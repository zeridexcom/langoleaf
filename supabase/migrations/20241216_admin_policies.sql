-- Admin RLS Policies Migration
-- This migration adds admin-level access policies to all tables

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update Students table policies for admin access
DROP POLICY IF EXISTS "Admins can view all students" ON students;
CREATE POLICY "Admins can view all students"
  ON students FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update any student" ON students;
CREATE POLICY "Admins can update any student"
  ON students FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete any student" ON students;
CREATE POLICY "Admins can delete any student"
  ON students FOR DELETE
  USING (is_admin());

-- Update Applications table policies for admin access
DROP POLICY IF EXISTS "Admins can view all applications" ON applications;
CREATE POLICY "Admins can view all applications"
  ON applications FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update any application" ON applications;
CREATE POLICY "Admins can update any application"
  ON applications FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete any application" ON applications;
CREATE POLICY "Admins can delete any application"
  ON applications FOR DELETE
  USING (is_admin());

-- Update Documents table policies for admin access
DROP POLICY IF EXISTS "Admins can view all documents" ON documents;
CREATE POLICY "Admins can view all documents"
  ON documents FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update any document" ON documents;
CREATE POLICY "Admins can update any document"
  ON documents FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can delete any document" ON documents;
CREATE POLICY "Admins can delete any document"
  ON documents FOR DELETE
  USING (is_admin());

-- Update Profiles table policies for admin access
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (is_admin());

DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
CREATE POLICY "Admins can update any profile"
  ON profiles FOR UPDATE
  USING (is_admin());

-- Update Notifications table policies for admin access
DROP POLICY IF EXISTS "Admins can view all notifications" ON notifications;
CREATE POLICY "Admins can view all notifications"
  ON notifications FOR SELECT
  USING (is_admin());

-- Update Activity Log table policies for admin access
DROP POLICY IF EXISTS "Admins can view all activity" ON activity_log;
CREATE POLICY "Admins can view all activity"
  ON activity_log FOR SELECT
  USING (is_admin());

-- Update Coins History table policies for admin access
DROP POLICY IF EXISTS "Admins can view all coins history" ON coins_history;
CREATE POLICY "Admins can view all coins history"
  ON coins_history FOR SELECT
  USING (is_admin());

-- Create function to transfer student ownership
CREATE OR REPLACE FUNCTION transfer_student_ownership(
  p_student_id UUID,
  p_new_freelancer_id UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_old_freelancer_id UUID;
  v_admin_id UUID;
BEGIN
  -- Get current user ID (should be admin)
  v_admin_id := auth.uid();
  
  -- Verify current user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can transfer student ownership';
  END IF;
  
  -- Get current freelancer_id
  SELECT freelancer_id INTO v_old_freelancer_id
  FROM students WHERE id = p_student_id;
  
  IF v_old_freelancer_id IS NULL THEN
    RAISE EXCEPTION 'Student not found';
  END IF;
  
  -- Update student ownership
  UPDATE students 
  SET 
    freelancer_id = p_new_freelancer_id,
    updated_at = NOW()
  WHERE id = p_student_id;
  
  -- Log the transfer in activity log
  INSERT INTO activity_log (
    freelancer_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_admin_id,
    'student_transferred',
    'student',
    p_student_id,
    jsonb_build_object(
      'old_freelancer_id', v_old_freelancer_id,
      'new_freelancer_id', p_new_freelancer_id,
      'reason', p_reason,
      'transferred_by', v_admin_id
    )
  );
  
  -- Create notification for old freelancer
  INSERT INTO notifications (
    freelancer_id,
    type,
    title,
    message,
    data
  ) VALUES (
    v_old_freelancer_id,
    'system',
    'Student Transferred',
    'A student has been transferred to another freelancer',
    jsonb_build_object(
      'student_id', p_student_id,
      'transferred_to', p_new_freelancer_id
    )
  );
  
  -- Create notification for new freelancer
  INSERT INTO notifications (
    freelancer_id,
    type,
    title,
    message,
    data
  ) VALUES (
    p_new_freelancer_id,
    'system',
    'Student Assigned',
    'A new student has been assigned to you',
    jsonb_build_object(
      'student_id', p_student_id,
      'transferred_from', v_old_freelancer_id
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to assign unassigned student to freelancer
CREATE OR REPLACE FUNCTION assign_student_to_freelancer(
  p_student_id UUID,
  p_freelancer_id UUID,
  p_notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  v_admin_id UUID;
BEGIN
  -- Get current user ID (should be admin)
  v_admin_id := auth.uid();
  
  -- Verify current user is admin
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can assign students';
  END IF;
  
  -- Update student ownership
  UPDATE students 
  SET 
    freelancer_id = p_freelancer_id,
    updated_at = NOW()
  WHERE id = p_student_id;
  
  -- Log the assignment
  INSERT INTO activity_log (
    freelancer_id,
    action,
    entity_type,
    entity_id,
    details
  ) VALUES (
    v_admin_id,
    'student_assigned',
    'student',
    p_student_id,
    jsonb_build_object(
      'assigned_to', p_freelancer_id,
      'notes', p_notes,
      'assigned_by', v_admin_id
    )
  );
  
  -- Create notification for freelancer
  INSERT INTO notifications (
    freelancer_id,
    type,
    title,
    message,
    data
  ) VALUES (
    p_freelancer_id,
    'system',
    'New Student Assigned',
    'A new student has been assigned to your account',
    jsonb_build_object(
      'student_id', p_student_id,
      'assigned_by', v_admin_id,
      'notes', p_notes
    )
  );
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for admin to get all students with freelancer info
CREATE OR REPLACE FUNCTION get_all_students_with_freelancer(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  freelancer_id UUID,
  freelancer_name TEXT,
  freelancer_email TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can view all students';
  END IF;
  
  RETURN QUERY
  SELECT 
    s.id,
    s.freelancer_id,
    p.full_name as freelancer_name,
    p.email as freelancer_email,
    s.full_name,
    s.email,
    s.phone,
    s.status,
    s.created_at
  FROM students s
  LEFT JOIN profiles p ON s.freelancer_id = p.id
  ORDER BY s.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for admin to get all freelancers with stats
CREATE OR REPLACE FUNCTION get_all_freelancers_with_stats(
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  email TEXT,
  full_name TEXT,
  role TEXT,
  total_students BIGINT,
  total_applications BIGINT,
  total_earnings DECIMAL,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can view all freelancers';
  END IF;
  
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.full_name,
    p.role,
    COUNT(DISTINCT s.id) as total_students,
    COUNT(DISTINCT a.id) as total_applications,
    COALESCE(SUM(c.amount), 0) as total_earnings,
    p.created_at
  FROM profiles p
  LEFT JOIN students s ON p.id = s.freelancer_id
  LEFT JOIN applications a ON p.id = a.freelancer_id
  LEFT JOIN commissions c ON p.id = c.freelancer_id AND c.status = 'paid'
  WHERE p.role = 'freelancer'
  GROUP BY p.id, p.email, p.full_name, p.role, p.created_at
  ORDER BY p.created_at DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create RPC function for system-wide analytics
CREATE OR REPLACE FUNCTION get_system_analytics()
RETURNS TABLE (
  total_freelancers BIGINT,
  total_students BIGINT,
  total_applications BIGINT,
  total_enrollments BIGINT,
  total_revenue DECIMAL,
  students_this_month BIGINT,
  applications_this_month BIGINT
) AS $$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can view system analytics';
  END IF;
  
  RETURN QUERY
  SELECT 
    (SELECT COUNT(*) FROM profiles WHERE role = 'freelancer') as total_freelancers,
    (SELECT COUNT(*) FROM students) as total_students,
    (SELECT COUNT(*) FROM applications) as total_applications,
    (SELECT COUNT(*) FROM applications WHERE status = 'enrolled') as total_enrollments,
    (SELECT COALESCE(SUM(amount), 0) FROM commissions WHERE status = 'paid') as total_revenue,
    (SELECT COUNT(*) FROM students WHERE created_at >= DATE_TRUNC('month', NOW())) as students_this_month,
    (SELECT COUNT(*) FROM applications WHERE created_at >= DATE_TRUNC('month', NOW())) as applications_this_month;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

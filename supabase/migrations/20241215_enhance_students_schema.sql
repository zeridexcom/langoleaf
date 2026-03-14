-- ============================================
-- STUDENT PAGES ENHANCEMENT MIGRATION
-- Phase 1: Database Schema Updates
-- ============================================

-- ============================================
-- 1. ADD NEW FIELDS TO STUDENTS TABLE
-- ============================================

-- Personal Information
ALTER TABLE students ADD COLUMN IF NOT EXISTS date_of_birth DATE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'other', 'prefer_not_to_say'));
ALTER TABLE students ADD COLUMN IF NOT EXISTS nationality TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Address Information
ALTER TABLE students ADD COLUMN IF NOT EXISTS address TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS city TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS state TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS pincode TEXT;

-- Emergency Contact
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS emergency_contact_relation TEXT;

-- Additional Information
ALTER TABLE students ADD COLUMN IF NOT EXISTS previous_education TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS work_experience TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS source TEXT;
ALTER TABLE students ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- Profile Completion Tracking
ALTER TABLE students ADD COLUMN IF NOT EXISTS profile_completion INTEGER DEFAULT 0;

-- ============================================
-- 2. ENHANCE ACTIVITY LOG TABLE
-- ============================================

ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS old_values JSONB;
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS new_values JSONB;
ALTER TABLE activity_log ADD COLUMN IF NOT EXISTS student_id UUID REFERENCES students(id) ON DELETE CASCADE;

-- Create index for faster student activity queries
CREATE INDEX IF NOT EXISTS idx_activity_log_student_id ON activity_log(student_id);

-- ============================================
-- 3. CREATE STUDENT STATUS HISTORY TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS student_status_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster status history queries
CREATE INDEX IF NOT EXISTS idx_status_history_student_id ON student_status_history(student_id);
CREATE INDEX IF NOT EXISTS idx_status_history_created_at ON student_status_history(created_at);

-- ============================================
-- 4. CREATE STUDENT NOTES TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS student_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES profiles(id) NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  category TEXT DEFAULT 'general' CHECK (category IN ('general', 'follow_up', 'important', 'document', 'communication')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for notes
CREATE INDEX IF NOT EXISTS idx_notes_student_id ON student_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_notes_author_id ON student_notes(author_id);
CREATE INDEX IF NOT EXISTS idx_notes_is_pinned ON student_notes(is_pinned) WHERE is_pinned = TRUE;

-- ============================================
-- 5. ENHANCE STUDENT DOCUMENTS TABLE
-- ============================================

ALTER TABLE student_documents ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected'));
ALTER TABLE student_documents ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES profiles(id);
ALTER TABLE student_documents ADD COLUMN IF NOT EXISTS verified_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE student_documents ADD COLUMN IF NOT EXISTS expiry_date DATE;
ALTER TABLE student_documents ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE student_documents ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE student_documents ADD COLUMN IF NOT EXISTS mime_type TEXT;

-- Create index for document status queries
CREATE INDEX IF NOT EXISTS idx_documents_status ON student_documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_expiry ON student_documents(expiry_date) WHERE expiry_date IS NOT NULL;

-- ============================================
-- 6. ENABLE RLS ON NEW TABLES
-- ============================================

ALTER TABLE student_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_notes ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 7. RLS POLICIES FOR NEW TABLES
-- ============================================

-- Student Status History Policies
CREATE POLICY "Freelancers can view status history for their students"
  ON student_status_history FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE freelancer_id = auth.uid()));

CREATE POLICY "Freelancers can create status history for their students"
  ON student_status_history FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM students WHERE freelancer_id = auth.uid()));

-- Student Notes Policies
CREATE POLICY "Freelancers can view notes for their students"
  ON student_notes FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE freelancer_id = auth.uid()));

CREATE POLICY "Freelancers can create notes for their students"
  ON student_notes FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM students WHERE freelancer_id = auth.uid()) AND author_id = auth.uid());

CREATE POLICY "Freelancers can update their own notes"
  ON student_notes FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Freelancers can delete their own notes"
  ON student_notes FOR DELETE
  USING (author_id = auth.uid());

-- ============================================
-- 8. CREATE HELPER FUNCTIONS
-- ============================================

-- Function to calculate profile completion percentage
CREATE OR REPLACE FUNCTION calculate_profile_completion(student_id UUID)
RETURNS INTEGER AS $$
DECLARE
  completion INTEGER := 0;
  total_fields INTEGER := 10; -- Total number of fields to check
  filled_fields INTEGER := 0;
  student_record RECORD;
BEGIN
  SELECT * INTO student_record FROM students WHERE id = student_id;
  
  IF student_record IS NULL THEN
    RETURN 0;
  END IF;
  
  -- Check basic fields (5 points)
  IF student_record.name IS NOT NULL AND student_record.name != '' THEN filled_fields := filled_fields + 1; END IF;
  IF student_record.email IS NOT NULL AND student_record.email != '' THEN filled_fields := filled_fields + 1; END IF;
  IF student_record.phone IS NOT NULL AND student_record.phone != '' THEN filled_fields := filled_fields + 1; END IF;
  IF student_record.program IS NOT NULL AND student_record.program != '' THEN filled_fields := filled_fields + 1; END IF;
  IF student_record.university IS NOT NULL AND student_record.university != '' THEN filled_fields := filled_fields + 1; END IF;
  
  -- Check additional fields (5 points)
  IF student_record.date_of_birth IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF student_record.address IS NOT NULL AND student_record.address != '' THEN filled_fields := filled_fields + 1; END IF;
  IF student_record.emergency_contact_name IS NOT NULL AND student_record.emergency_contact_name != '' THEN filled_fields := filled_fields + 1; END IF;
  IF student_record.previous_education IS NOT NULL AND student_record.previous_education != '' THEN filled_fields := filled_fields + 1; END IF;
  
  -- Check for documents (1 point)
  IF EXISTS (SELECT 1 FROM student_documents WHERE student_documents.student_id = student_id) THEN
    filled_fields := filled_fields + 1;
  END IF;
  
  completion := (filled_fields * 100) / total_fields;
  
  -- Update the student's profile_completion
  UPDATE students SET profile_completion = completion WHERE id = student_id;
  
  RETURN completion;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log activity with old and new values
CREATE OR REPLACE FUNCTION log_student_activity(
  p_freelancer_id UUID,
  p_action TEXT,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_student_id UUID,
  p_old_values JSONB DEFAULT NULL,
  p_new_values JSONB DEFAULT NULL,
  p_details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO activity_log (
    freelancer_id,
    action,
    entity_type,
    entity_id,
    student_id,
    old_values,
    new_values,
    details,
    created_at
  ) VALUES (
    p_freelancer_id,
    p_action,
    p_entity_type,
    p_entity_id,
    p_student_id,
    p_old_values,
    p_new_values,
    p_details,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to track status changes
CREATE OR REPLACE FUNCTION track_status_change(
  p_student_id UUID,
  p_old_status TEXT,
  p_new_status TEXT,
  p_changed_by UUID,
  p_reason TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Insert into status history
  INSERT INTO student_status_history (
    student_id,
    old_status,
    new_status,
    changed_by,
    reason,
    created_at
  ) VALUES (
    p_student_id,
    p_old_status,
    p_new_status,
    p_changed_by,
    p_reason,
    NOW()
  );
  
  -- Log activity
  PERFORM log_student_activity(
    p_changed_by,
    'status_changed',
    'student',
    p_student_id,
    p_student_id,
    jsonb_build_object('status', p_old_status),
    jsonb_build_object('status', p_new_status),
    jsonb_build_object('reason', p_reason)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 9. CREATE TRIGGERS FOR AUTOMATIC TRACKING
-- ============================================

-- Trigger to update profile completion on student update
CREATE OR REPLACE FUNCTION trigger_update_profile_completion()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate and update profile completion
  PERFORM calculate_profile_completion(NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profile_completion ON students;
CREATE TRIGGER update_profile_completion
  AFTER INSERT OR UPDATE ON students
  FOR EACH ROW
  EXECUTE FUNCTION trigger_update_profile_completion();

-- Trigger to track status changes
CREATE OR REPLACE FUNCTION trigger_track_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    PERFORM track_status_change(
      NEW.id,
      OLD.status,
      NEW.status,
      NEW.freelancer_id,
      NULL
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS track_status_change ON students;
CREATE TRIGGER track_status_change
  AFTER UPDATE ON students
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION trigger_track_status_change();

-- ============================================
-- 10. UPDATE EXISTING STUDENTS
-- ============================================

-- Calculate profile completion for all existing students
DO $$
DECLARE
  student_record RECORD;
BEGIN
  FOR student_record IN SELECT id FROM students LOOP
    PERFORM calculate_profile_completion(student_record.id);
  END LOOP;
END $$;

-- ============================================
-- DONE!
-- ============================================

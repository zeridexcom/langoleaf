-- Language Courses Schema for LangoLeaf
-- Run this after essential-schema.sql

-- Add language courses
INSERT INTO courses (name, duration, fee_range_min, fee_range_max, category, is_active) VALUES
  ('IELTS', '30-45 days', 15000, 15000, 'Language - English', true),
  ('TOEFL', '30-45 days', 15000, 15000, 'Language - English', true),
  ('German Language (A1-B2)', '6-12 months', 25000, 45000, 'Language - European', true),
  ('French Language (A1-B2)', '6-12 months', 25000, 45000, 'Language - European', true)
ON CONFLICT DO NOTHING;

-- Activity tracking table for freelancers
CREATE TABLE IF NOT EXISTS freelancer_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'logout', 'page_view', 'student_added', 'application_submitted', 'document_uploaded', 'profile_updated', 'course_viewed', 'earnings_checked', 'settings_changed')),
  page_path TEXT,
  metadata JSONB,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sessions table for tracking login/logout and time spent
CREATE TABLE IF NOT EXISTS freelancer_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ended_at TIMESTAMP WITH TIME ZONE,
  duration_seconds INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  pages_visited INTEGER DEFAULT 0,
  actions_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE
);

-- Commission rates table (10-15% based on course)
CREATE TABLE IF NOT EXISTS commission_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  min_students INTEGER DEFAULT 1,
  max_students INTEGER,
  commission_percentage DECIMAL(5,2) NOT NULL CHECK (commission_percentage BETWEEN 10 AND 15),
  fixed_amount DECIMAL(10,2),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert commission rates for language courses
-- IELTS: 15% of ₹15,000 = ₹2,250 per student
-- TOEFL: 15% of ₹15,000 = ₹2,250 per student
-- German: 12% of ₹35,000 (avg) = ₹4,200 per student
-- French: 12% of ₹35,000 (avg) = ₹4,200 per student

INSERT INTO commission_rates (course_id, min_students, max_students, commission_percentage, fixed_amount)
SELECT 
  c.id,
  1,
  NULL, -- unlimited
  CASE 
    WHEN c.name IN ('IELTS', 'TOEFL') THEN 15.00
    ELSE 12.00
  END,
  CASE 
    WHEN c.name = 'IELTS' THEN 2250
    WHEN c.name = 'TOEFL' THEN 2250
    WHEN c.name = 'German Language (A1-B2)' THEN 4200
    WHEN c.name = 'French Language (A1-B2)' THEN 4200
  END
FROM courses c
WHERE c.category LIKE 'Language%'
ON CONFLICT DO NOTHING;

-- Enable RLS on new tables
ALTER TABLE freelancer_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Freelancers can only see their own activity
CREATE POLICY "Freelancers view own activities" ON freelancer_activities 
  FOR SELECT USING (freelancer_id = auth.uid());

-- Freelancers can only see their own sessions
CREATE POLICY "Freelancers view own sessions" ON freelancer_sessions 
  FOR SELECT USING (freelancer_id = auth.uid());

-- Commission rates readable by all (to calculate earnings)
CREATE POLICY "Commission rates readable by all" ON commission_rates 
  FOR SELECT USING (true);

-- Only admins can manage commission rates
CREATE POLICY "Admin can manage commission rates" ON commission_rates 
  FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admin can view all activities (for admin dashboard)
CREATE POLICY "Admin can view all activities" ON freelancer_activities 
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can view all sessions" ON freelancer_sessions 
  FOR SELECT USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Function to calculate commission for a freelancer
CREATE OR REPLACE FUNCTION calculate_freelancer_commission(p_freelancer_id UUID)
RETURNS TABLE (
  course_name TEXT,
  total_students BIGINT,
  total_commission DECIMAL(10,2)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.name as course_name,
    COUNT(s.id) as total_students,
    SUM(
      CASE 
        WHEN c.name IN ('IELTS', 'TOEFL') THEN 2250
        WHEN c.name LIKE 'German%' THEN 4200
        WHEN c.name LIKE 'French%' THEN 4200
        ELSE cr.fixed_amount
      END
    ) as total_commission
  FROM students s
  JOIN courses c ON s.program = c.name
  LEFT JOIN commission_rates cr ON c.id = cr.course_id
  WHERE s.freelancer_id = p_freelancer_id
    AND s.status = 'enrolled'
  GROUP BY c.name;
END;
$$ LANGUAGE plpgsql;

-- Function to log freelancer activity
CREATE OR REPLACE FUNCTION log_freelancer_activity(
  p_freelancer_id UUID,
  p_activity_type TEXT,
  p_page_path TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_activity_id UUID;
BEGIN
  INSERT INTO freelancer_activities (
    freelancer_id, 
    activity_type, 
    page_path, 
    metadata, 
    session_id,
    created_at
  ) VALUES (
    p_freelancer_id,
    p_activity_type,
    p_page_path,
    p_metadata,
    p_session_id,
    NOW()
  ) RETURNING id INTO v_activity_id;
  
  -- Update session actions count
  UPDATE freelancer_sessions 
  SET actions_count = actions_count + 1
  WHERE freelancer_id = p_freelancer_id 
    AND is_active = TRUE;
  
  RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql;

-- Function to start a session
CREATE OR REPLACE FUNCTION start_freelancer_session(p_freelancer_id UUID)
RETURNS UUID AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- End any existing active sessions
  UPDATE freelancer_sessions 
  SET ended_at = NOW(),
      duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
      is_active = FALSE
  WHERE freelancer_id = p_freelancer_id 
    AND is_active = TRUE;
  
  -- Start new session
  INSERT INTO freelancer_sessions (
    freelancer_id,
    started_at,
    is_active
  ) VALUES (
    p_freelancer_id,
    NOW(),
    TRUE
  ) RETURNING id INTO v_session_id;
  
  RETURN v_session_id;
END;
$$ LANGUAGE plpgsql;

-- Function to end a session
CREATE OR REPLACE FUNCTION end_freelancer_session(p_freelancer_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE freelancer_sessions 
  SET ended_at = NOW(),
      duration_seconds = EXTRACT(EPOCH FROM (NOW() - started_at))::INTEGER,
      is_active = FALSE
  WHERE freelancer_id = p_freelancer_id 
    AND is_active = TRUE;
END;
$$ LANGUAGE plpgsql;

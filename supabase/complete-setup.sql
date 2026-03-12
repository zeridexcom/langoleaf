-- ============================================
-- COMPLETE DATABASE SETUP FOR LANGOLEAF
-- Run this in Supabase SQL Editor
-- ============================================

-- Drop existing tables if they exist (be careful in production!)
DROP TABLE IF EXISTS activity_log CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS user_badges CASCADE;
DROP TABLE IF EXISTS coins_history CASCADE;
DROP TABLE IF EXISTS student_documents CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS badges CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'freelancer' CHECK (role IN ('freelancer', 'admin')),
  agent_code TEXT UNIQUE,
  coins_balance INTEGER DEFAULT 0,
  tier_level TEXT DEFAULT 'bronze' CHECK (tier_level IN ('bronze', 'silver', 'gold', 'platinum')),
  total_earnings DECIMAL(10,2) DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STUDENTS TABLE
-- ============================================
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  program TEXT,
  university TEXT,
  status TEXT DEFAULT 'application_submitted' CHECK (status IN ('application_submitted', 'documents_pending', 'under_review', 'approved', 'enrolled', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- STUDENT DOCUMENTS TABLE (for Cloudinary uploads)
-- ============================================
CREATE TABLE student_documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL,
  url TEXT NOT NULL,
  public_id TEXT NOT NULL,
  format TEXT,
  size INTEGER,
  thumbnail TEXT,
  uploaded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- APPLICATIONS TABLE
-- ============================================
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  program TEXT,
  university TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'documents_pending', 'under_review', 'approved', 'rejected', 'enrolled')),
  commission_amount DECIMAL(10,2),
  commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- DOCUMENTS TABLE (legacy)
-- ============================================
CREATE TABLE documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  application_id UUID REFERENCES applications(id) ON DELETE SET NULL,
  document_type TEXT,
  file_name TEXT,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  cloudinary_public_id TEXT,
  cloudinary_url TEXT,
  cloudinary_resource_type TEXT,
  category TEXT DEFAULT 'general',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- COINS HISTORY TABLE
-- ============================================
CREATE TABLE coins_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('earned', 'spent', 'bonus')),
  reason TEXT NOT NULL,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- BADGES TABLE
-- ============================================
CREATE TABLE badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT,
  requirement_value INTEGER,
  coins_reward INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- USER BADGES TABLE
-- ============================================
CREATE TABLE user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(freelancer_id, badge_id)
);

-- ============================================
-- ACTIVITY LOG TABLE
-- ============================================
CREATE TABLE activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE coins_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - PROFILES
-- ============================================
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" 
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- ============================================
-- RLS POLICIES - STUDENTS
-- ============================================
CREATE POLICY "Freelancers can view own students"
  ON students FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can create students"
  ON students FOR INSERT WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can update own students"
  ON students FOR UPDATE USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can delete own students"
  ON students FOR DELETE USING (freelancer_id = auth.uid());

-- ============================================
-- RLS POLICIES - STUDENT DOCUMENTS
-- ============================================
CREATE POLICY "Users can view documents for their students"
  ON student_documents FOR SELECT
  USING (student_id IN (SELECT id FROM students WHERE freelancer_id = auth.uid()));

CREATE POLICY "Users can upload documents for their students"
  ON student_documents FOR INSERT
  WITH CHECK (student_id IN (SELECT id FROM students WHERE freelancer_id = auth.uid()));

CREATE POLICY "Users can delete documents for their students"
  ON student_documents FOR DELETE
  USING (student_id IN (SELECT id FROM students WHERE freelancer_id = auth.uid()));

-- ============================================
-- RLS POLICIES - APPLICATIONS
-- ============================================
CREATE POLICY "Freelancers can view own applications"
  ON applications FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can create applications"
  ON applications FOR INSERT WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can update own applications"
  ON applications FOR UPDATE USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can delete own applications"
  ON applications FOR DELETE USING (freelancer_id = auth.uid());

-- ============================================
-- RLS POLICIES - DOCUMENTS
-- ============================================
CREATE POLICY "Freelancers can view own documents"
  ON documents FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can upload documents"
  ON documents FOR INSERT WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can delete own documents"
  ON documents FOR DELETE USING (freelancer_id = auth.uid());

-- ============================================
-- RLS POLICIES - COINS HISTORY
-- ============================================
CREATE POLICY "Freelancers can view own coins history"
  ON coins_history FOR SELECT USING (freelancer_id = auth.uid());

-- ============================================
-- RLS POLICIES - BADGES
-- ============================================
CREATE POLICY "Badges are viewable by everyone"
  ON badges FOR SELECT USING (true);

-- ============================================
-- RLS POLICIES - USER BADGES
-- ============================================
CREATE POLICY "Freelancers can view own badges"
  ON user_badges FOR SELECT USING (freelancer_id = auth.uid());

-- ============================================
-- RLS POLICIES - NOTIFICATIONS
-- ============================================
CREATE POLICY "Freelancers can view own notifications"
  ON notifications FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can update own notifications"
  ON notifications FOR UPDATE USING (freelancer_id = auth.uid());

-- ============================================
-- RLS POLICIES - ACTIVITY LOG
-- ============================================
CREATE POLICY "Freelancers can view own activity"
  ON activity_log FOR SELECT USING (freelancer_id = auth.uid());

-- ============================================
-- AUTO-CREATE PROFILE ON USER SIGNUP
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================
-- INSERT DEFAULT BADGES
-- ============================================
INSERT INTO badges (name, description, icon, requirement_type, requirement_value, coins_reward) VALUES
('First Steps', 'Add your first student', '🌱', 'students_added', 1, 50),
('Rising Star', 'Add 10 students', '⭐', 'students_added', 10, 200),
('Super Agent', 'Add 50 students', '🚀', 'students_added', 50, 500),
('Master Agent', 'Add 100 students', '👑', 'students_added', 100, 1000),
('First Enrollment', 'Get your first student enrolled', '🎓', 'enrollments', 1, 100),
('Enrollment Pro', 'Get 10 students enrolled', '🏆', 'enrollments', 10, 500)
ON CONFLICT (name) DO NOTHING;

-- ============================================
-- AWARD COINS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION award_coins(profile_id UUID, amount INTEGER, reason TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles 
  SET coins_balance = coins_balance + amount 
  WHERE id = profile_id;
  
  INSERT INTO coins_history (freelancer_id, amount, type, reason)
  VALUES (profile_id, amount, 'earned', reason);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- GET FREELANCER STATS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION get_freelancer_stats(freelancer_id UUID)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
  SELECT json_build_object(
    'totalStudents', (SELECT COUNT(*) FROM students WHERE students.freelancer_id = get_freelancer_stats.freelancer_id),
    'totalApplications', (SELECT COUNT(*) FROM applications WHERE applications.freelancer_id = get_freelancer_stats.freelancer_id),
    'totalEarnings', (SELECT COALESCE(SUM(commission_amount), 0) FROM applications WHERE applications.freelancer_id = get_freelancer_stats.freelancer_id AND commission_status = 'paid'),
    'pendingApplications', (SELECT COUNT(*) FROM applications WHERE applications.freelancer_id = get_freelancer_stats.freelancer_id AND status IN ('submitted', 'documents_pending', 'under_review')),
    'conversionRate', 0
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- CREATE PROFILE FOR EXISTING USERS
-- ============================================
INSERT INTO profiles (id, email, full_name)
SELECT id, email, COALESCE(raw_user_meta_data->>'full_name', email)
FROM auth.users
WHERE id NOT IN (SELECT id FROM profiles)
ON CONFLICT (id) DO NOTHING;

-- ============================================
-- DONE! 
-- ============================================

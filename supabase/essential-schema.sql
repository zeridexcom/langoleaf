-- Essential tables for the freelancer portal to work
-- Run this in Supabase SQL Editor first

-- First, clean up any existing partial tables to avoid conflicts
DROP TABLE IF EXISTS course_universities CASCADE;
DROP TABLE IF EXISTS universities CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS coins_history CASCADE;
DROP TABLE IF EXISTS applications CASCADE;
DROP TABLE IF EXISTS students CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- 1. Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'freelancer' CHECK (role IN ('freelancer', 'admin')),
  phone TEXT,
  avatar_url TEXT,
  coins_balance INTEGER DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Students table (managed by freelancers)
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  program TEXT,
  university TEXT,
  status TEXT DEFAULT 'application_submitted' CHECK (status IN ('application_submitted', 'documents_pending', 'under_review', 'approved', 'enrolled', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Applications table (student applications to universities)
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  university TEXT NOT NULL,
  program TEXT NOT NULL,
  status TEXT DEFAULT 'application_submitted' CHECK (status IN ('application_submitted', 'documents_pending', 'under_review', 'approved', 'enrolled', 'rejected')),
  commission_amount DECIMAL(10,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Coins history (gamification/earnings tracking)
CREATE TABLE coins_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('earned', 'spent', 'bonus')),
  reason TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Courses reference table (for dropdowns)
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  duration TEXT,
  fee_range_min DECIMAL(10,2),
  fee_range_max DECIMAL(10,2),
  category TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Universities reference table (for dropdowns)
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  type TEXT CHECK (type IN ('premier', 'state', 'private', 'deemed')),
  ranking INTEGER,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Course-University mappings (which courses available at which universities)
CREATE TABLE course_universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  university_id UUID REFERENCES universities(id) ON DELETE CASCADE,
  fee DECIMAL(10,2),
  commission_rate DECIMAL(5,2) DEFAULT 5.00, -- percentage
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(course_id, university_id)
);

-- Enable Row Level Security
ALTER TABLE IF EXISTS profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS students ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS coins_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS course_universities ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Students viewable by owner freelancer" ON students;
DROP POLICY IF EXISTS "Students insertable by owner" ON students;
DROP POLICY IF EXISTS "Students updatable by owner" ON students;
DROP POLICY IF EXISTS "Applications viewable by owner freelancer" ON applications;
DROP POLICY IF EXISTS "Applications insertable by owner" ON applications;
DROP POLICY IF EXISTS "Applications updatable by owner" ON applications;
DROP POLICY IF EXISTS "Coins history viewable by owner" ON coins_history;
DROP POLICY IF EXISTS "Courses readable by all" ON courses;
DROP POLICY IF EXISTS "Universities readable by all" ON universities;
DROP POLICY IF EXISTS "Course-universities readable by all" ON course_universities;
DROP POLICY IF EXISTS "Admin can manage courses" ON courses;
DROP POLICY IF EXISTS "Admin can manage universities" ON universities;
DROP POLICY IF EXISTS "Admin can manage mappings" ON course_universities;

-- RLS Policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Students viewable by owner freelancer" ON students FOR SELECT USING (freelancer_id = auth.uid());
CREATE POLICY "Students insertable by owner" ON students FOR INSERT WITH CHECK (freelancer_id = auth.uid());
CREATE POLICY "Students updatable by owner" ON students FOR UPDATE USING (freelancer_id = auth.uid());

CREATE POLICY "Applications viewable by owner freelancer" ON applications FOR SELECT USING (freelancer_id = auth.uid());
CREATE POLICY "Applications insertable by owner" ON applications FOR INSERT WITH CHECK (freelancer_id = auth.uid());
CREATE POLICY "Applications updatable by owner" ON applications FOR UPDATE USING (freelancer_id = auth.uid());

CREATE POLICY "Coins history viewable by owner" ON coins_history FOR SELECT USING (profile_id = auth.uid());

-- Reference tables readable by all authenticated users
CREATE POLICY "Courses readable by all" ON courses FOR SELECT USING (true);
CREATE POLICY "Universities readable by all" ON universities FOR SELECT USING (true);
CREATE POLICY "Course-universities readable by all" ON course_universities FOR SELECT USING (true);

-- Admin can manage reference tables
CREATE POLICY "Admin can manage courses" ON courses FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can manage universities" ON universities FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admin can manage mappings" ON course_universities FOR ALL USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Insert sample data (optional - remove if you want to start empty)
INSERT INTO courses (name, duration, category) VALUES
  ('MBA', '2 Years', 'Management'),
  ('B.Tech', '4 Years', 'Engineering'),
  ('MCA', '2 Years', 'Computer Applications'),
  ('BBA', '3 Years', 'Management'),
  ('M.Tech', '2 Years', 'Engineering')
ON CONFLICT DO NOTHING;

INSERT INTO universities (name, location, type, ranking) VALUES
  ('IIM Bangalore', 'Bangalore', 'premier', 1),
  ('IIM Ahmedabad', 'Ahmedabad', 'premier', 2),
  ('IIT Delhi', 'Delhi', 'premier', 1),
  ('IIT Bombay', 'Mumbai', 'premier', 2),
  ('XLRI Jamshedpur', 'Jamshedpur', 'premier', 3),
  ('NIT Trichy', 'Trichy', 'premier', 5)
ON CONFLICT DO NOTHING;

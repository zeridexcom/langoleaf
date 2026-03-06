-- Quick Setup - Essential tables only for dashboard to work
-- Run this in Supabase SQL Editor first to test

-- 1. Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT DEFAULT 'freelancer' CHECK (role IN ('freelancer', 'admin')),
  phone TEXT,
  coins_balance INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Students table
CREATE TABLE IF NOT EXISTS students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  program TEXT,
  university TEXT,
  status TEXT DEFAULT 'application_submitted' CHECK (status IN ('application_submitted', 'documents_pending', 'under_review', 'approved', 'enrolled', 'rejected')),
  documents JSONB DEFAULT '[]',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Applications table
CREATE TABLE IF NOT EXISTS applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  course_id UUID,
  university TEXT,
  program TEXT,
  status TEXT DEFAULT 'application_submitted',
  documents JSONB DEFAULT '[]',
  commission_amount DECIMAL(10,2) DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Coins history
CREATE TABLE IF NOT EXISTS coins_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('earned', 'spent', 'bonus')),
  reason TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coins_history ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid errors)
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Freelancers can view own students" ON students;
DROP POLICY IF EXISTS "Freelancers can create students" ON students;
DROP POLICY IF EXISTS "Freelancers can update own students" ON students;
DROP POLICY IF EXISTS "Freelancers can view own applications" ON applications;
DROP POLICY IF EXISTS "Freelancers can create applications" ON applications;
DROP POLICY IF EXISTS "Freelancers can view own coins" ON coins_history;

-- Create policies
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Freelancers can view own students" 
  ON students FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can create students" 
  ON students FOR INSERT WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can update own students" 
  ON students FOR UPDATE USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can view own applications" 
  ON applications FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can create applications" 
  ON applications FOR INSERT WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can view own coins" 
  ON coins_history FOR SELECT USING (profile_id = auth.uid());

-- Insert sample data for testing (optional - remove if not needed)
INSERT INTO students (freelancer_id, name, email, phone, program, university, status)
SELECT 
  auth.uid(),
  'Test Student',
  'test@example.com',
  '+91 98765 43210',
  'IELTS',
  'British Council',
  'application_submitted'
WHERE auth.uid() IS NOT NULL
ON CONFLICT DO NOTHING;

-- Verify tables were created
SELECT 'profiles' as table_name, COUNT(*) as count FROM profiles
UNION ALL
SELECT 'students', COUNT(*) FROM students
UNION ALL
SELECT 'applications', COUNT(*) FROM applications
UNION ALL
SELECT 'coins_history', COUNT(*) FROM coins_history;

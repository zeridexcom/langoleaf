-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
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

-- Students table
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  education_level TEXT,
  interested_course TEXT,
  status TEXT DEFAULT 'lead' CHECK (status IN ('lead', 'application_submitted', 'documents_pending', 'under_review', 'approved', 'enrolled', 'rejected')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  course_id TEXT,
  course_name TEXT,
  university_id TEXT,
  university_name TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'documents_pending', 'under_review', 'approved', 'rejected', 'enrolled')),
  application_fee DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid')),
  submitted_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Documents table
CREATE TABLE documents (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  document_type TEXT CHECK (document_type IN ('photo', 'id_proof', 'address_proof', 'education_certificate', 'marksheet', 'experience_certificate', 'other')),
  file_name TEXT,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  reviewed_at TIMESTAMP WITH TIME ZONE
);

-- Coins history table
CREATE TABLE coins_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('earned', 'spent', 'bonus')),
  reason TEXT NOT NULL,
  reference_id UUID,
  reference_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges table
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

-- User badges table
CREATE TABLE user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(freelancer_id, badge_id)
);

-- Notifications table
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT CHECK (type IN ('student_added', 'application_update', 'document_status', 'commission_earned', 'badge_earned', 'tier_upgrade', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activity log table
CREATE TABLE activity_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE coins_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Profiles: Users can read all, update only own
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Students: Freelancers can CRUD their own students
CREATE POLICY "Freelancers can view own students"
  ON students FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can create students"
  ON students FOR INSERT WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can update own students"
  ON students FOR UPDATE USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can delete own students"
  ON students FOR DELETE USING (freelancer_id = auth.uid());

-- Applications: Freelancers can CRUD their own applications
CREATE POLICY "Freelancers can view own applications"
  ON applications FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can create applications"
  ON applications FOR INSERT WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can update own applications"
  ON applications FOR UPDATE USING (freelancer_id = auth.uid());

-- Documents: Freelancers can CRUD their own documents
CREATE POLICY "Freelancers can view own documents"
  ON documents FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can upload documents"
  ON documents FOR INSERT WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can delete own documents"
  ON documents FOR DELETE USING (freelancer_id = auth.uid());

-- Coins history: Freelancers can view own history
CREATE POLICY "Freelancers can view own coins history"
  ON coins_history FOR SELECT USING (freelancer_id = auth.uid());

-- Badges: Public read
CREATE POLICY "Badges are viewable by everyone"
  ON badges FOR SELECT USING (true);

-- User badges: Freelancers can view own badges
CREATE POLICY "Freelancers can view own badges"
  ON user_badges FOR SELECT USING (freelancer_id = auth.uid());

-- Notifications: Freelancers can view and update own notifications
CREATE POLICY "Freelancers can view own notifications"
  ON notifications FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can update own notifications"
  ON notifications FOR UPDATE USING (freelancer_id = auth.uid());

-- Activity log: Freelancers can view own activity
CREATE POLICY "Freelancers can view own activity"
  ON activity_log FOR SELECT USING (freelancer_id = auth.uid());

-- Insert default badges
INSERT INTO badges (name, description, icon, requirement_type, requirement_value, coins_reward) VALUES
('First Steps', 'Add your first student', '🌱', 'students_added', 1, 50),
('Rising Star', 'Add 10 students', '⭐', 'students_added', 10, 200),
('Super Agent', 'Add 50 students', '🚀', 'students_added', 50, 500),
('Master Agent', 'Add 100 students', '👑', 'students_added', 100, 1000),
('First Enrollment', 'Get your first student enrolled', '🎓', 'enrollments', 1, 100),
('Enrollment Pro', 'Get 10 students enrolled', '🏆', 'enrollments', 10, 500),
('Document Master', 'Upload 50 documents', '📄', 'documents_uploaded', 50, 200),
('Quick Starter', 'Add 5 students in first week', '⚡', 'quick_start', 5, 300),
('Consistent Performer', 'Add at least 1 student for 30 days straight', '🔥', 'streak', 30, 1000);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Migration: Add tasks and task_submissions tables
-- Run this in your Supabase SQL Editor

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('push_review', 'document_upload', 'profile_complete', 'other')),
  title TEXT NOT NULL,
  description TEXT,
  reward_amount DECIMAL DEFAULT 20,
  reward_currency TEXT DEFAULT 'INR',
  is_active BOOLEAN DEFAULT true,
  auto_assign BOOLEAN DEFAULT true,
  target_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task_submissions table
CREATE TABLE IF NOT EXISTS task_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  submission_data JSONB DEFAULT '{}',
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'submitted', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES profiles(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  reward_credited BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_tasks_type ON tasks(type);
CREATE INDEX IF NOT EXISTS idx_tasks_active ON tasks(is_active);
CREATE INDEX IF NOT EXISTS idx_task_submissions_task_id ON task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_freelancer_id ON task_submissions(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_task_submissions_status ON task_submissions(status);

-- Enable RLS
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for tasks
CREATE POLICY "Anyone can view active tasks"
  ON tasks FOR SELECT
  USING (is_active = true);

CREATE POLICY "Admins can manage tasks"
  ON tasks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- RLS Policies for task_submissions
CREATE POLICY "Users can view their own submissions"
  ON task_submissions FOR SELECT
  USING (freelancer_id = auth.uid());

CREATE POLICY "Users can create their own submissions"
  ON task_submissions FOR INSERT
  WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Users can update their own pending submissions"
  ON task_submissions FOR UPDATE
  USING (freelancer_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can manage all submissions"
  ON task_submissions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

-- Insert default Push Review task
INSERT INTO tasks (type, title, description, reward_amount, target_url, auto_assign, is_active)
VALUES (
  'push_review',
  'Push Review - Google Review for edufast.in',
  'Submit a Google review for edufast.in and earn ₹20 per approved review! Copy any 5-star review template from our collection, post it on Google, and submit the link for verification.',
  20,
  'https://edufast.in',
  true,
  true
) ON CONFLICT DO NOTHING;

-- Add notification types for tasks
-- Note: You may need to add these to your existing notifications table if it has a type constraint
-- ALTER TABLE notifications DROP CONSTRAINT IF EXISTS notifications_type_check;
-- ALTER TABLE notifications ADD CONSTRAINT notifications_type_check
--   CHECK (type IN ('student_assigned', 'student_created', 'application_status_changed', 'document_uploaded', 'document_verified', 'note_added', 'reminder_due', 'coins_earned', 'welcome', 'system', 'general', 'task_assigned', 'task_approved', 'task_rejected'));

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_task_submissions_updated_at
  BEFORE UPDATE ON task_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions
GRANT SELECT ON tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON task_submissions TO authenticated;
GRANT ALL ON tasks TO service_role;
GRANT ALL ON task_submissions TO service_role;

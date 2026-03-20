-- Task Assignment System Migration
-- Run this in Supabase SQL Editor

-- 1. Add new columns to tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS deadline TIMESTAMP;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'normal';
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS category VARCHAR(100);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS admin_question TEXT;

-- 2. Add new columns to task_submissions table
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP;
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS deadline_extension_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS deadline_extension_reason TEXT;
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS deadline_extension_approved BOOLEAN;
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS proof_files JSONB DEFAULT '[]'::jsonb;
ALTER TABLE task_submissions ADD COLUMN IF NOT EXISTS new_deadline TIMESTAMP;

-- 3. Create task_assignments table
CREATE TABLE IF NOT EXISTS task_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  freelancer_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  assigned_at TIMESTAMP DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'assigned',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(task_id, freelancer_id)
);

-- 4. Create task_chats table
CREATE TABLE IF NOT EXISTS task_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  submission_id UUID REFERENCES task_submissions(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]'::jsonb,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_task_assignments_task_id ON task_assignments(task_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_freelancer_id ON task_assignments(freelancer_id);
CREATE INDEX IF NOT EXISTS idx_task_assignments_status ON task_assignments(status);
CREATE INDEX IF NOT EXISTS idx_task_chats_task_id ON task_chats(task_id);
CREATE INDEX IF NOT EXISTS idx_task_chats_submission_id ON task_chats(submission_id);
CREATE INDEX IF NOT EXISTS idx_task_chats_sender_id ON task_chats(sender_id);
CREATE INDEX IF NOT EXISTS idx_tasks_deadline ON tasks(deadline);
CREATE INDEX IF NOT EXISTS idx_tasks_priority ON tasks(priority);
CREATE INDEX IF NOT EXISTS idx_tasks_category ON tasks(category);

-- 6. Enable RLS on new tables
ALTER TABLE task_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_chats ENABLE ROW LEVEL SECURITY;

-- 7. RLS Policies for task_assignments
CREATE POLICY "Admins can manage all task assignments"
  ON task_assignments FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Freelancers can view their own assignments"
  ON task_assignments FOR SELECT
  USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can update their own assignments"
  ON task_assignments FOR UPDATE
  USING (freelancer_id = auth.uid());

-- 8. RLS Policies for task_chats
CREATE POLICY "Admins can manage all task chats"
  ON task_chats FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can view chats for their tasks"
  ON task_chats FOR SELECT
  USING (
    sender_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM task_submissions
      WHERE task_submissions.id = task_chats.submission_id
      AND task_submissions.freelancer_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'super_admin')
    )
  );

CREATE POLICY "Users can insert their own chats"
  ON task_chats FOR INSERT
  WITH CHECK (sender_id = auth.uid());

-- 9. Add updated_at trigger for new tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 10. Create notification types for task system
-- Note: These will be used in the application layer
-- Notification types: 'task_assigned', 'task_accepted', 'task_completed', 'task_rejected', 
--                     'task_chat_message', 'deadline_extension_requested', 'deadline_extension_approved'

-- Create notifications table for the notification dropdown
-- Run this in Supabase SQL Editor

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'general',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own notifications"
    ON notifications FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notifications"
    ON notifications FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications"
    ON notifications FOR INSERT
    WITH CHECK (true);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger
DROP TRIGGER IF EXISTS update_notifications_updated_at ON notifications;
CREATE TRIGGER update_notifications_updated_at
    BEFORE UPDATE ON notifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample notifications for testing
-- Note: Replace 'USER_ID_HERE' with actual user ID from auth.users

-- INSERT INTO notifications (user_id, title, message, type, read)
-- SELECT 
--     id,
--     'Welcome to Lango!',
--     'Thanks for joining our partner portal. Start adding students to earn coins.',
--     'welcome',
--     false
-- FROM auth.users 
-- LIMIT 1;

-- INSERT INTO notifications (user_id, title, message, type, read)
-- SELECT 
--     id,
--     'New Student Added',
--     'Rahul Sharma has been successfully added to your leads.',
--     'student',
--     false
-- FROM auth.users 
-- LIMIT 1;

-- INSERT INTO notifications (user_id, title, message, type, read)
-- SELECT 
--     id,
--     'Coins Earned!',
--     'You earned 500 coins for successful enrollment.',
--     'coins',
--     true
-- FROM auth.users 
-- LIMIT 1;

-- Verify table was created
SELECT 
    'Notifications table created successfully' as status,
    COUNT(*) as total_notifications
FROM notifications;

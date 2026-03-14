-- Phase 7: Notifications Enhancement
-- Add link and metadata columns to notifications table
-- Create notification preferences table

-- Add link column to notifications table
ALTER TABLE notifications 
ADD COLUMN IF NOT EXISTS link TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

-- Create notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Global settings
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT true,
    
    -- Notification type preferences
    student_assigned BOOLEAN DEFAULT true,
    application_status_changed BOOLEAN DEFAULT true,
    document_uploaded BOOLEAN DEFAULT true,
    document_verified BOOLEAN DEFAULT true,
    note_added BOOLEAN DEFAULT true,
    reminder_due BOOLEAN DEFAULT true,
    coins_earned BOOLEAN DEFAULT true,
    system_notifications BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- Enable RLS on notification preferences
ALTER TABLE notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for notification preferences
CREATE POLICY "Users can view their own notification preferences"
    ON notification_preferences FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own notification preferences"
    ON notification_preferences FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own notification preferences"
    ON notification_preferences FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create trigger to update updated_at
DROP TRIGGER IF EXISTS update_notification_preferences_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_preferences_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Create function to create default preferences for new users
CREATE OR REPLACE FUNCTION create_default_notification_preferences()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO notification_preferences (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to auto-create preferences for new users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION create_default_notification_preferences();

-- Create function to check if notification should be sent
CREATE OR REPLACE FUNCTION should_send_notification(
    p_user_id UUID,
    p_notification_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_preferences RECORD;
BEGIN
    -- Get user preferences
    SELECT * INTO v_preferences
    FROM notification_preferences
    WHERE user_id = p_user_id;
    
    -- If no preferences found, allow notification
    IF NOT FOUND THEN
        RETURN true;
    END IF;
    
    -- Check specific notification type preference
    CASE p_notification_type
        WHEN 'student_assigned' THEN RETURN v_preferences.student_assigned;
        WHEN 'application_status_changed' THEN RETURN v_preferences.application_status_changed;
        WHEN 'document_uploaded' THEN RETURN v_preferences.document_uploaded;
        WHEN 'document_verified' THEN RETURN v_preferences.document_verified;
        WHEN 'note_added' THEN RETURN v_preferences.note_added;
        WHEN 'reminder_due' THEN RETURN v_preferences.reminder_due;
        WHEN 'coins_earned' THEN RETURN v_preferences.coins_earned;
        WHEN 'system' THEN RETURN v_preferences.system_notifications;
        ELSE RETURN true;
    END CASE;
END;
$$ language 'plpgsql';

-- Create function to create notification with preference check
CREATE OR REPLACE FUNCTION create_notification(
    p_user_id UUID,
    p_title TEXT,
    p_message TEXT,
    p_type TEXT,
    p_link TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    -- Check if notification should be sent
    IF NOT should_send_notification(p_user_id, p_type) THEN
        RETURN NULL;
    END IF;
    
    -- Insert notification
    INSERT INTO notifications (user_id, title, message, type, link, metadata)
    VALUES (p_user_id, p_title, p_message, p_type, p_link, p_metadata)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$ language 'plpgsql';

-- Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_link ON notifications(link) WHERE link IS NOT NULL;

-- Verify changes
SELECT 
    'Notifications table enhanced successfully' as status,
    COUNT(*) as total_notifications
FROM notifications;

SELECT 
    'Notification preferences table created successfully' as status,
    COUNT(*) as total_preferences
FROM notification_preferences;

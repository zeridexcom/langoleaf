-- Admin Real-Time Setup
-- Run this in Supabase SQL Editor

-- ============================================
-- SUPPORT TICKETS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  subject TEXT NOT NULL,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  resolved_at TIMESTAMP WITH TIME ZONE,
  resolved_by UUID REFERENCES profiles(id)
);

-- ============================================
-- SUPPORT MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS support_messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID REFERENCES support_tickets(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  sender_type TEXT DEFAULT 'freelancer' CHECK (sender_type IN ('freelancer', 'admin')),
  message TEXT NOT NULL,
  attachments JSONB DEFAULT '[]',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ADMIN NOTIFICATIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS admin_notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  is_read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ACTIVITY FEED TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  user_name TEXT,
  user_email TEXT,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================
ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - SUPPORT TICKETS
-- ============================================
CREATE POLICY "Freelancers can view own tickets" ON support_tickets
  FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can create tickets" ON support_tickets
  FOR INSERT WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can update own tickets" ON support_tickets
  FOR UPDATE USING (freelancer_id = auth.uid());

CREATE POLICY "Admins can view all tickets" ON support_tickets
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update all tickets" ON support_tickets
  FOR UPDATE USING (is_admin());

-- ============================================
-- RLS POLICIES - SUPPORT MESSAGES
-- ============================================
CREATE POLICY "Users can view messages in their tickets" ON support_messages
  FOR SELECT USING (
    ticket_id IN (SELECT id FROM support_tickets WHERE freelancer_id = auth.uid())
    OR is_admin()
  );

CREATE POLICY "Users can send messages in their tickets" ON support_messages
  FOR INSERT WITH CHECK (
    ticket_id IN (SELECT id FROM support_tickets WHERE freelancer_id = auth.uid())
    OR is_admin()
  );

-- ============================================
-- RLS POLICIES - ADMIN NOTIFICATIONS
-- ============================================
CREATE POLICY "Admins can view all admin notifications" ON admin_notifications
  FOR SELECT USING (is_admin());

CREATE POLICY "Admins can update admin notifications" ON admin_notifications
  FOR UPDATE USING (is_admin());

-- ============================================
-- RLS POLICIES - ACTIVITY FEED
-- ============================================
CREATE POLICY "Admins can view all activity" ON activity_feed
  FOR SELECT USING (is_admin());

CREATE POLICY "Users can view own activity" ON activity_feed
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can insert own activity" ON activity_feed
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- ============================================
-- TRIGGERS FOR REAL-TIME NOTIFICATIONS
-- ============================================

-- Notify admin when new application is submitted
CREATE OR REPLACE FUNCTION notify_admin_new_application()
RETURNS TRIGGER AS $func$
BEGIN
  INSERT INTO admin_notifications (type, title, message, data, priority)
  VALUES (
    'new_application',
    'New Application Submitted',
    CONCAT('A new application has been submitted for ', COALESCE(NEW.program, 'Unknown Program')),
    jsonb_build_object(
      'application_id', NEW.id,
      'student_id', NEW.student_id,
      'freelancer_id', NEW.freelancer_id,
      'program', NEW.program,
      'university', NEW.university
    ),
    'normal'
  );
  
  INSERT INTO activity_feed (user_id, action, entity_type, entity_id, description, metadata)
  SELECT 
    NEW.freelancer_id,
    'application_submitted',
    'application',
    NEW.id,
    CONCAT('Submitted application for ', COALESCE(NEW.program, 'Unknown Program')),
    jsonb_build_object('program', NEW.program, 'university', NEW.university)
  WHERE NEW.freelancer_id IS NOT NULL;
  
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_application_created ON applications;
CREATE TRIGGER on_application_created
  AFTER INSERT ON applications
  FOR EACH ROW EXECUTE FUNCTION notify_admin_new_application();

-- Notify admin when document is uploaded
CREATE OR REPLACE FUNCTION notify_admin_document_uploaded()
RETURNS TRIGGER AS $func$
BEGIN
  INSERT INTO admin_notifications (type, title, message, data, priority)
  VALUES (
    'document_uploaded',
    'New Document Uploaded',
    CONCAT('A new document has been uploaded: ', COALESCE(NEW.document_type, 'Unknown Type')),
    jsonb_build_object(
      'document_id', NEW.id,
      'student_id', NEW.student_id,
      'freelancer_id', NEW.freelancer_id,
      'document_type', NEW.document_type
    ),
    'normal'
  );
  
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_document_created ON documents;
CREATE TRIGGER on_document_created
  AFTER INSERT ON documents
  FOR EACH ROW EXECUTE FUNCTION notify_admin_document_uploaded();

-- Notify admin when new freelancer registers
CREATE OR REPLACE FUNCTION notify_admin_new_freelancer()
RETURNS TRIGGER AS $func$
BEGIN
  IF NEW.role = 'freelancer' THEN
    INSERT INTO admin_notifications (type, title, message, data, priority)
    VALUES (
      'new_freelancer',
      'New Freelancer Registered',
      CONCAT('New freelancer joined: ', COALESCE(NEW.full_name, NEW.email)),
      jsonb_build_object(
        'freelancer_id', NEW.id,
        'email', NEW.email,
        'full_name', NEW.full_name
      ),
      'normal'
    );
    
    INSERT INTO activity_feed (user_id, user_name, user_email, action, entity_type, entity_id, description)
    VALUES (
      NEW.id,
      NEW.full_name,
      NEW.email,
      'freelancer_registered',
      'profile',
      NEW.id,
      'New freelancer registered'
    );
  END IF;
  
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_profile_created ON profiles;
CREATE TRIGGER on_profile_created
  AFTER INSERT ON profiles
  FOR EACH ROW EXECUTE FUNCTION notify_admin_new_freelancer();

-- Notify admin when support ticket is created
CREATE OR REPLACE FUNCTION notify_admin_new_ticket()
RETURNS TRIGGER AS $func$
BEGIN
  INSERT INTO admin_notifications (type, title, message, data, priority)
  VALUES (
    'support_ticket',
    'New Support Ticket',
    CONCAT('New support ticket: ', NEW.subject),
    jsonb_build_object(
      'ticket_id', NEW.id,
      'freelancer_id', NEW.freelancer_id,
      'subject', NEW.subject,
      'priority', NEW.priority
    ),
    CASE WHEN NEW.priority = 'urgent' THEN 'urgent' ELSE 'high' END
  );
  
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_ticket_created ON support_tickets;
CREATE TRIGGER on_ticket_created
  AFTER INSERT ON support_tickets
  FOR EACH ROW EXECUTE FUNCTION notify_admin_new_ticket();

-- Notify admin when support message is sent
CREATE OR REPLACE FUNCTION notify_admin_new_message()
RETURNS TRIGGER AS $func$
BEGIN
  IF NEW.sender_type = 'freelancer' THEN
    INSERT INTO admin_notifications (type, title, message, data, priority)
    SELECT 
      'support_message',
      'New Support Message',
      CONCAT('New message on ticket: ', t.subject),
      jsonb_build_object(
        'ticket_id', NEW.ticket_id,
        'message_id', NEW.id,
        'sender_id', NEW.sender_id
      ),
      'high'
    FROM support_tickets t WHERE t.id = NEW.ticket_id;
  END IF;
  
  RETURN NEW;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON support_messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON support_messages
  FOR EACH ROW EXECUTE FUNCTION notify_admin_new_message();

-- ============================================
-- ENABLE REALTIME FOR TABLES
-- ============================================
ALTER PUBLICATION supabase_realtime ADD TABLE admin_notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE support_tickets;
ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE activity_feed;
ALTER PUBLICATION supabase_realtime ADD TABLE applications;
ALTER PUBLICATION supabase_realtime ADD TABLE documents;
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE students;

-- ============================================
-- HELPER FUNCTIONS
-- ============================================

-- Get pending admin notifications count
CREATE OR REPLACE FUNCTION get_admin_notifications_count()
RETURNS INTEGER AS $func$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can view notifications count';
  END IF;
  
  RETURN (SELECT COUNT(*) FROM admin_notifications WHERE is_read = FALSE);
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending support tickets count
CREATE OR REPLACE FUNCTION get_pending_tickets_count()
RETURNS INTEGER AS $func$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can view tickets count';
  END IF;
  
  RETURN (SELECT COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress'));
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get recent activity feed
CREATE OR REPLACE FUNCTION get_recent_activity(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  user_name TEXT,
  user_email TEXT,
  action TEXT,
  entity_type TEXT,
  entity_id UUID,
  description TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE
) AS $func$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can view activity feed';
  END IF;
  
  RETURN QUERY
  SELECT * FROM activity_feed
  ORDER BY created_at DESC
  LIMIT p_limit;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get pending documents for verification
CREATE OR REPLACE FUNCTION get_pending_documents(p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  id UUID,
  student_id UUID,
  student_name TEXT,
  freelancer_id UUID,
  freelancer_name TEXT,
  document_type TEXT,
  file_name TEXT,
  file_url TEXT,
  status TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $func$
BEGIN
  IF NOT is_admin() THEN
    RAISE EXCEPTION 'Only admins can view pending documents';
  END IF;
  
  RETURN QUERY
  SELECT 
    d.id,
    d.student_id,
    s.name as student_name,
    d.freelancer_id,
    p.full_name as freelancer_name,
    d.document_type,
    d.file_name,
    d.file_url,
    d.status,
    d.created_at
  FROM documents d
  LEFT JOIN students s ON d.student_id = s.id
  LEFT JOIN profiles p ON d.freelancer_id = p.id
  WHERE d.status = 'pending'
  ORDER BY d.created_at DESC
  LIMIT p_limit;
END;
$func$ LANGUAGE plpgsql SECURITY DEFINER;

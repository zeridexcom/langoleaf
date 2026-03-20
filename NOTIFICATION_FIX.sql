-- RUN THIS IN YOUR SUPABASE SQL EDITOR --

-- 1. Enable DELETE policy for notifications
-- This allows freelancers to clear their own notifications
CREATE POLICY "Freelancers can delete own notifications"
ON notifications
FOR DELETE
USING (freelancer_id = auth.uid());

-- 2. Ensure all parts of the app are using is_read instead of read
-- If your table still has a "read" column instead of "is_read", 
-- uncomment the next line to rename it:
-- ALTER TABLE notifications RENAME COLUMN "read" TO "is_read";

-- 3. Verify RLS is enabled
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Setup Admin User
-- Run this after essential-schema.sql and language-courses-schema.sql

-- Note: This creates the admin profile. 
-- The actual auth user needs to be created via Supabase Auth UI or API
-- Email: admin@freelancer.langoleaf.com
-- Password: freelancer.langoleaf.com@333

-- First, ensure the admin user exists in auth.users (you'll need to sign up via the app first)
-- Then run this to set the role to admin:

-- Option 1: If user already signed up, update their role
UPDATE profiles 
SET role = 'admin',
    full_name = 'System Administrator'
WHERE email = 'admin@freelancer.langoleaf.com';

-- Option 2: Insert if not exists (requires the auth user to exist first)
INSERT INTO profiles (id, email, full_name, role, coins_balance, created_at)
SELECT 
    id,
    'admin@freelancer.langoleaf.com',
    'System Administrator',
    'admin',
    0,
    NOW()
FROM auth.users 
WHERE email = 'admin@freelancer.langoleaf.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'admin',
    full_name = 'System Administrator';

-- Verify admin was set
SELECT id, email, full_name, role, created_at 
FROM profiles 
WHERE email = 'admin@freelancer.langoleaf.com';

-- Create Test User for Login Testing
-- Run this in Supabase SQL Editor

-- IMPORTANT: This creates a test user that you can use to login
-- Email: test@langoleaf.com
-- Password: Test@123456

-- First, we need to create the user in auth.users using the supabase auth API
-- This SQL will set up the profile once the auth user is created

-- Create the profile for test user (run this after signing up via UI)
INSERT INTO profiles (id, email, full_name, role, coins_balance, created_at, updated_at)
VALUES (
    '00000000-0000-0000-0000-000000000001', -- This will be replaced with actual auth user ID
    'test@langoleaf.com',
    'Test User',
    'freelancer',
    1000,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE 
SET full_name = 'Test User',
    role = 'freelancer',
    coins_balance = 1000,
    updated_at = NOW();

-- Create freelancer profile for test user
INSERT INTO freelancer_profiles (id, user_id, agent_id, status, total_earnings, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    id,
    'AGT-TEST-001',
    'active',
    50000,
    NOW(),
    NOW()
FROM profiles 
WHERE email = 'test@langoleaf.com'
ON CONFLICT DO NOTHING;

-- Add sample student for test user
INSERT INTO students (freelancer_id, name, email, phone, program, university, status, created_at)
SELECT 
    id,
    'Rahul Sharma',
    'rahul@example.com',
    '+91 98765 43210',
    'MBA',
    'IIM Bangalore',
    'application_submitted',
    NOW()
FROM profiles 
WHERE email = 'test@langoleaf.com'
ON CONFLICT DO NOTHING;

-- Add sample application
INSERT INTO applications (freelancer_id, student_id, program, university, status, commission_amount, created_at)
SELECT 
    p.id,
    s.id,
    'MBA',
    'IIM Bangalore',
    'application_submitted',
    15000,
    NOW()
FROM profiles p
CROSS JOIN students s
WHERE p.email = 'test@langoleaf.com' AND s.name = 'Rahul Sharma'
ON CONFLICT DO NOTHING;

-- Add sample commission/earning
INSERT INTO commissions (freelancer_id, amount, status, description, created_at)
SELECT 
    id,
    25000,
    'paid',
    'Commission for Rahul Sharma MBA application',
    NOW()
FROM profiles 
WHERE email = 'test@langoleaf.com'
ON CONFLICT DO NOTHING;

-- Verify test user setup
SELECT 
    p.email,
    p.full_name,
    p.role,
    p.coins_balance,
    fp.agent_id,
    fp.status,
    (SELECT COUNT(*) FROM students WHERE freelancer_id = p.id) as student_count,
    (SELECT COUNT(*) FROM applications WHERE freelancer_id = p.id) as application_count
FROM profiles p
LEFT JOIN freelancer_profiles fp ON fp.user_id = p.id
WHERE p.email = 'test@langoleaf.com';

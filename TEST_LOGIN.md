# Test Login Credentials

## Option 1: Create Your Own Test Account

1. Go to https://freelancer.langoleaf.com/signup
2. Sign up with any email (e.g., `test@example.com`)
3. Use any password (minimum 6 characters)
4. Check your email for confirmation link
5. Click the link to verify email
6. Login with your credentials

## Option 2: Use SQL to Create Test User

Run this SQL in your Supabase SQL Editor:

```sql
-- Create test user profile
INSERT INTO profiles (id, email, full_name, role, coins_balance, created_at, updated_at)
VALUES (
    gen_random_uuid(),
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
    coins_balance = 1000;
```

**Note:** The auth user must be created via the signup page first, then run this SQL to set up the profile.

## Option 3: Admin Access

If you have database access, you can check existing users:

```sql
-- List all users
SELECT email, created_at 
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 10;
```

## Troubleshooting Login Issues

1. **"Invalid login credentials"**
   - Check if email is confirmed
   - Verify password is correct
   - Try resetting password

2. **"Email not confirmed"**
   - Check spam folder for confirmation email
   - Resend confirmation from login page

3. **"User not found"**
   - User needs to sign up first
   - Check if using correct email

## Quick Test

Test the login API directly:

```bash
curl -X POST https://kzcbnvkwvkzlzwbvkoly.supabase.co/auth/v1/token?grant_type=password \
  -H "apikey: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt6Y2Judmt3dmt6bHp3YnZrb2x5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzI4MDI5NDIsImV4cCI6MjA4ODM3ODk0Mn0.bJYsSuAgRu8cnMnRDxn8UZKczKa22FQhoiMz9dQRvCs" \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "password": "yourpassword"}'
```

## Need Help?

If login is still not working:
1. Check browser console for errors
2. Verify Supabase project is active
3. Check if Auth API is enabled in Supabase dashboard
4. Contact support with error messages

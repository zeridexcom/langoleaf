# LangoLeaf Freelancer Portal - Step-by-Step Deployment Guide

## Overview
This guide will walk you through setting up and deploying the freelancer portal from start to finish.

---

## Phase 1: Local Development Setup

### Step 1: Navigate to Project Directory
```bash
cd freelancer-portal
```

### Step 2: Install Dependencies
```bash
npm install
```
This installs all required packages (Next.js, React, Tailwind, etc.)

### Step 3: Set Up Environment Variables

1. **Copy the example file:**
   ```bash
   copy .env.local.example .env.local
   ```

2. **Open `.env.local` and add your credentials** (we'll get these in Phase 2)

---

## Phase 2: Set Up Supabase (Database + Auth)

### Step 1: Create Supabase Account
1. Go to [https://supabase.com](https://supabase.com)
2. Click "Start your project"
3. Sign up with GitHub or email
4. Create a new organization (e.g., "LangoLeaf")

### Step 2: Create New Project
1. Click "New Project"
2. Name: `langoleaf-freelancer`
3. Database Password: Generate a strong password (save it!)
4. Region: Choose closest to your users (e.g., Mumbai for India)
5. Click "Create new project"

### Step 3: Get API Credentials
1. Wait for project to be ready (2-3 minutes)
2. Go to Project Settings → API
3. Copy these values:
   - `Project URL` → paste in `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → paste as `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role secret` key → paste as `SUPABASE_SERVICE_ROLE_KEY`

### Step 4: Set Up Database Schema
1. Go to SQL Editor (in left sidebar)
2. Click "New query"
3. Copy and paste this SQL:

```sql
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
  agent_level TEXT DEFAULT 'bronze' CHECK (agent_level IN ('bronze', 'silver', 'gold', 'platinum')),
  coins_balance INTEGER DEFAULT 0,
  total_earned DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Students table
CREATE TABLE students (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  program TEXT NOT NULL,
  university TEXT NOT NULL,
  status TEXT DEFAULT 'application_submitted' CHECK (status IN ('application_submitted', 'documents_pending', 'under_review', 'approved', 'enrolled', 'rejected')),
  documents JSONB DEFAULT '[]',
  commission_amount DECIMAL(10,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Applications table
CREATE TABLE applications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  student_id UUID REFERENCES students(id) ON DELETE CASCADE,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  application_code TEXT UNIQUE,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'documents_pending', 'under_review', 'approved', 'payment_pending', 'payment_received', 'enrolled', 'rejected')),
  commission_amount DECIMAL(10,2),
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'processing', 'paid')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Coins history
CREATE TABLE coins_history (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('earned', 'spent', 'bonus')),
  reason TEXT,
  reference_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Badges
CREATE TABLE badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon TEXT,
  requirement_type TEXT,
  requirement_value INTEGER,
  coins_reward INTEGER DEFAULT 0
);

-- User badges
CREATE TABLE user_badges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  freelancer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT,
  title TEXT,
  message TEXT,
  data JSONB,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE coins_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Freelancers can view own students" ON students
  FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can create students" ON students
  FOR INSERT WITH CHECK (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can update own students" ON students
  FOR UPDATE USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can view own applications" ON applications
  FOR SELECT USING (freelancer_id = auth.uid());

CREATE POLICY "Freelancers can create applications" ON applications
  FOR INSERT WITH CHECK (freelancer_id = auth.uid());

-- Insert default badges
INSERT INTO badges (name, description, icon, requirement_type, requirement_value, coins_reward) VALUES
('First Steps', 'Add your first student', '🌱', 'students_added', 1, 100),
('Rising Star', 'Add 5 students', '⭐', 'students_added', 5, 250),
('Top Performer', 'Add 20 students', '🏆', 'students_added', 20, 500),
('Enrollment Pro', 'Get 3 students enrolled', '🎓', 'enrollments', 3, 300),
('Gold Agent', 'Earn ₹50,000 in commissions', '💰', 'earnings', 50000, 1000);
```

4. Click "Run" to execute the SQL

### Step 5: Set Up Auth Providers (Optional but recommended)

1. Go to Authentication → Providers
2. Enable **Google**:
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Create OAuth 2.0 credentials
   - Add redirect URL: `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase
3. Enable **GitHub**:
   - Go to GitHub Settings → Developer settings → OAuth Apps
   - Create new OAuth app
   - Authorization callback URL: `https://your-project.supabase.co/auth/v1/callback`
   - Copy Client ID and Secret to Supabase

---

## Phase 3: Set Up Upstash Redis (Caching)

### Step 1: Create Upstash Account
1. Go to [https://upstash.com](https://upstash.com)
2. Sign up with GitHub or email
3. Click "Create Database"

### Step 2: Configure Redis
1. Name: `langoleaf-cache`
2. Region: Same as Supabase (e.g., Mumbai)
3. Type: **Global** (for edge caching) or **Regional** (cheaper)
4. Click "Create"

### Step 3: Get Credentials
1. In your database dashboard, click "REST API"
2. Copy:
   - `UPSTASH_REDIS_REST_URL` → paste in `.env.local`
   - `UPSTASH_REDIS_REST_TOKEN` → paste in `.env.local`

---

## Phase 4: Run Locally

### Step 1: Start Development Server
```bash
npm run dev
```

### Step 2: Open in Browser
Go to [http://localhost:3000](http://localhost:3000)

### Step 3: Test the Application
1. **Sign Up**: Create a new account at `/signup`
2. **Login**: Sign in at `/login`
3. **Dashboard**: View stats, recent students, earnings
4. **Add Student**: Go to Students → Add New Student
5. **View Students**: See list with filters

---

## Phase 5: Deploy to Vercel

### Step 1: Push to GitHub
1. Create a new repository on GitHub
2. Initialize git and push:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/yourusername/langoleaf-freelancer.git
   git push -u origin main
   ```

### Step 2: Deploy on Vercel
1. Go to [https://vercel.com](https://vercel.com)
2. Sign up with GitHub
3. Click "Add New Project"
4. Import your GitHub repository
5. Configure:
   - Framework Preset: Next.js
   - Root Directory: `freelancer-portal` (if your repo has this structure)
   - Build Command: `npm run build`
   - Output Directory: `.next`

### Step 3: Add Environment Variables
In Vercel project settings, add all variables from `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `UPSTASH_REDIS_REST_URL`
- `UPSTASH_REDIS_REST_TOKEN`
- `NEXT_PUBLIC_SITE_URL` = `https://freelancer.langoleaf.com`
- `NEXT_PUBLIC_APP_NAME` = `LangoLeaf Freelancer Hub`

### Step 4: Configure Custom Domain
1. In Vercel project, go to Settings → Domains
2. Add domain: `freelancer.langoleaf.com`
3. Follow Vercel's DNS instructions:
   - Add CNAME record in your domain provider
   - Point `freelancer.langoleaf.com` to `cname.vercel-dns.com`

### Step 5: Update Supabase Redirect URLs
1. Go to Supabase → Authentication → URL Configuration
2. Add to Redirect URLs:
   - `https://freelancer.langoleaf.com/auth/callback`
   - `https://freelancer.langoleaf.com`

---

## Phase 6: Post-Deployment

### Step 1: Test Production
1. Visit `https://freelancer.langoleaf.com`
2. Test signup, login, and all features
3. Check that data persists in Supabase

### Step 2: Set Up Monitoring
1. **Vercel Analytics**: Enable in project settings (free tier: 2,500 events/month)
2. **Supabase Dashboard**: Monitor database usage
3. **Upstash Dashboard**: Monitor Redis commands

### Step 3: Configure Email (Optional)
For production email notifications:
1. Go to Supabase → Auth → Email Templates
2. Customize email templates
3. Set up SMTP provider (SendGrid, AWS SES, etc.)

---

## Troubleshooting

### Issue: "Cannot find module" errors
**Solution**: Run `npm install` again

### Issue: Database connection fails
**Solution**: 
- Check Supabase URL and keys in `.env.local`
- Ensure IP allowlist includes your IP (Supabase → Database → Network Restrictions)

### Issue: Redis cache not working
**Solution**:
- Verify Upstash URL and token
- Check Redis commands limit (10K/day on free tier)

### Issue: Auth redirect fails
**Solution**:
- Update redirect URLs in Supabase Auth settings
- Ensure `NEXT_PUBLIC_SITE_URL` matches your domain

---

## Free Tier Limits Summary

| Service | Free Tier | Your Usage |
|---------|-----------|------------|
| **Vercel** | 100GB bandwidth, 10K req/hour | ~20GB, 1K req/hour |
| **Supabase DB** | 500MB, 2M requests/month | ~100MB, 50K requests |
| **Supabase Auth** | 50K users/month | ~500 users |
| **Supabase Storage** | 1GB | ~200MB |
| **Upstash Redis** | 10K commands/day | ~2K commands |
| **Total Cost** | **$0/month** | ✅ |

---

## Next Steps

1. **Add More Features**:
   - Document upload with Supabase Storage
   - Real-time notifications with Supabase Realtime
   - Payment integration (Razorpay/Stripe)
   - WhatsApp OTP with Twilio

2. **Customize Design**:
   - Update colors in `tailwind.config.ts`
   - Add your logo in `public/`
   - Modify content to match your programs

3. **Mobile App**:
   - Use React Native with Expo
   - Share Supabase backend

4. **Admin Dashboard**:
   - Create separate app for admins
   - View all freelancers and students

---

## Support

If you encounter issues:
1. Check Vercel logs: Project → Deployments → Latest → Functions
2. Check Supabase logs: Database → Logs
3. Check browser console for frontend errors

Good luck with your deployment! 🚀

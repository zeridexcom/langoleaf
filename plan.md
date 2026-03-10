# LangoLeaf Freelancer Partner Portal - Technical Implementation Plan

## Project Overview
**Project Name:** LangoLeaf Freelancer Hub  
**Subdomain:** `freelancer.langoleaf.com`  
**Platform:** Next.js 14+ (App Router)  
**Deployment:** Vercel (Free Tier)  
**Database:** Supabase (Free Tier)  
**Cache:** Upstash Redis (Free Tier)  
**Authentication:** Supabase Auth + OAuth (Google, GitHub) + WhatsApp OTP  
**Storage:** Supabase Storage  
**Real-time:** Supabase Realtime  

**Purpose:** A partner portal where freelancers/agents can:
- Generate leads for LangoLeaf educational programs
- Add and manage their own students/clients
- Track admission/application progress
- Upload and manage required documents
- Earn commissions and rewards for successful enrollments
- View earnings and payment status
- Receive notifications on application updates

---

## 1. Architecture Overview

### 1.1 System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Vercel Edge Network                       │
│              (Next.js 14 + React Server Components)        │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┴────────────┐
        │                         │
┌───────▼────────┐      ┌────────▼────────┐
│   Next.js App  │      │   Upstash Redis │
│   (Frontend)   │      │   (Cache Layer) │
└───────┬────────┘      └─────────────────┘
        │
┌───────▼──────────────────────────────────┐
│           Supabase Platform               │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │  PostgreSQL │  │  Auth (OAuth)   │  │
│  │  (Database) │  │  + OTP (WhatsApp)│  │
│  └─────────────┘  └─────────────────┘  │
│  ┌─────────────┐  ┌─────────────────┐  │
│  │    Storage  │  │  Edge Functions │  │
│  │  (Files)    │  │  (Serverless)   │  │
│  └─────────────┘  └─────────────────┘  │
└─────────────────────────────────────────┘
```

### 1.2 Tech Stack Details

| Layer | Technology | Free Tier Limits |
|-------|-----------|----------------|
| **Frontend** | Next.js 14 (App Router) | - |
| **Styling** | Tailwind CSS + Framer Motion | - |
| **UI Components** | shadcn/ui + Radix UI | - |
| **State Management** | Zustand + React Query | - |
| **Database** | Supabase PostgreSQL | 500MB, 2M requests/month |
| **Auth** | Supabase Auth | 50,000 users/month |
| **Storage** | Supabase Storage | 1GB |
| **Cache** | Upstash Redis | 10,000 commands/day |
| **Deployment** | Vercel | 100GB bandwidth, 10k requests/hour |
| **Analytics** | Vercel Analytics | 2,500 events/month |
| **Real-time** | Supabase Realtime | 200 concurrent connections |

---

## 2. Database Schema (Supabase PostgreSQL)

### 2.1 Core Tables

```sql
-- Users & Authentication
CREATE TABLE profiles (
  id UUID REFERENCES auth.users PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('freelancer', 'admin', 'manager')),
  phone TEXT,
  whatsapp_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Freelancer/Agent Profiles
CREATE TABLE freelancer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  agent_code TEXT UNIQUE, -- Unique agent referral code
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  total_students_added INTEGER DEFAULT 0,
  total_applications INTEGER DEFAULT 0,
  approved_applications INTEGER DEFAULT 0,
  pending_applications INTEGER DEFAULT 0,
  rejected_applications INTEGER DEFAULT 0,
  total_earnings DECIMAL(10,2) DEFAULT 0,
  pending_commission DECIMAL(10,2) DEFAULT 0,
  paid_commission DECIMAL(10,2) DEFAULT 0,
  coins_balance INTEGER DEFAULT 0,
  rating DECIMAL(2,1) DEFAULT 0,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  bank_details JSONB, -- {account_number, ifsc_code, account_name, bank_name}
  pan_card TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Educational Programs/Courses Offered
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT, -- 'Degree', 'Diploma', 'Certification'
  duration TEXT,
  fees DECIMAL(10,2),
  commission_percentage DECIMAL(5,2) DEFAULT 10.00,
  description TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP DEFAULT NOW()
);

-- Universities/Institutions
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location TEXT,
  logo_url TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Program-University Mapping
CREATE TABLE program_universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES programs(id),
  university_id UUID REFERENCES universities(id),
  fees DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW()
);

-- Students/Leads Added by Freelancers
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES freelancer_profiles(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  whatsapp_number TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female', 'other')),
  address TEXT,
  city TEXT,
  state TEXT,
  pincode TEXT,
  education_background TEXT, -- Highest qualification
  work_experience TEXT,
  preferred_program UUID REFERENCES programs(id),
  preferred_university UUID REFERENCES universities(id),
  lead_source TEXT DEFAULT 'freelancer', -- 'freelancer', 'website', 'referral'
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'interested', 'not_interested', 'enrolled', 'dropped')),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Applications/Admissions
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES students(id),
  freelancer_id UUID REFERENCES freelancer_profiles(id),
  program_id UUID REFERENCES programs(id),
  university_id UUID REFERENCES universities(id),
  application_status TEXT DEFAULT 'draft' CHECK (application_status IN (
    'draft',                    -- Initial state
    'submitted',               -- Application submitted
    'documents_pending',       -- Waiting for documents
    'under_review',           -- University reviewing
    'approved',               -- Application approved
    'rejected',               -- Application rejected
    'payment_pending',        -- Waiting for fee payment
    'payment_received',        -- Fee paid
    'enrolled',               -- Student enrolled
    'cancelled'               -- Application cancelled
  )),
  application_date TIMESTAMP DEFAULT NOW(),
  submission_date TIMESTAMP,
  approval_date TIMESTAMP,
  enrollment_date TIMESTAMP,
  application_fee DECIMAL(10,2),
  course_fee DECIMAL(10,2),
  commission_amount DECIMAL(10,2),
  commission_status TEXT DEFAULT 'pending' CHECK (commission_status IN ('pending', 'approved', 'paid', 'rejected')),
  commission_paid_date TIMESTAMP,
  documents JSONB, -- Array of uploaded document IDs
  remarks TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Documents Uploaded
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID REFERENCES applications(id),
  student_id UUID REFERENCES students(id),
  document_type TEXT CHECK (document_type IN (
    'photo',
    'aadhar_card',
    'pan_card',
    'tenth_marksheet',
    'twelfth_marksheet',
    'graduation_marksheet',
    'experience_certificate',
    'salary_slip',
    'bank_statement',
    'other'
  )),
  file_name TEXT,
  file_url TEXT,
  file_size INTEGER,
  mime_type TEXT,
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
  rejection_reason TEXT,
  uploaded_by UUID REFERENCES profiles(id),
  uploaded_at TIMESTAMP DEFAULT NOW(),
  verified_at TIMESTAMP,
  verified_by UUID REFERENCES profiles(id)
);

-- Commission/Earnings History
CREATE TABLE earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES freelancer_profiles(id),
  application_id UUID REFERENCES applications(id),
  student_id UUID REFERENCES students(id),
  program_id UUID REFERENCES programs(id),
  amount DECIMAL(10,2) NOT NULL,
  type TEXT CHECK (type IN ('commission', 'bonus', 'referral', 'adjustment')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  paid_at TIMESTAMP,
  transaction_reference TEXT
);

-- Gamification - Coins History
CREATE TABLE coins_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES freelancer_profiles(id),
  amount INTEGER NOT NULL,
  type TEXT CHECK (type IN ('earned', 'spent', 'bonus')),
  reason TEXT,
  reference_id UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Gamification - Badges
CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  icon_url TEXT,
  requirement_type TEXT,
  requirement_value INTEGER,
  coins_reward INTEGER DEFAULT 0
);

-- Freelancer Badges
CREATE TABLE freelancer_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES freelancer_profiles(id),
  badge_id UUID REFERENCES badges(id),
  earned_at TIMESTAMP DEFAULT NOW()
);

-- Notifications
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES freelancer_profiles(id),
  type TEXT CHECK (type IN (
    'application_update',
    'document_verified',
    'document_rejected',
    'commission_approved',
    'commission_paid',
    'new_badge',
    'student_enrolled',
    'system'
  )),
  title TEXT,
  message TEXT,
  data JSONB, -- {application_id, student_id, etc.}
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Activity Log
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES freelancer_profiles(id),
  action TEXT, -- 'student_added', 'application_submitted', 'document_uploaded', etc.
  entity_type TEXT, -- 'student', 'application', 'document'
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Support Tickets
CREATE TABLE support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID REFERENCES freelancer_profiles(id),
  subject TEXT,
  message TEXT,
  status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
  created_at TIMESTAMP DEFAULT NOW(),
  resolved_at TIMESTAMP
);
```

### 2.2 Row Level Security (RLS) Policies

```sql
-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE freelancer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE earnings ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read all, update only own
CREATE POLICY "Profiles are viewable by everyone" 
  ON profiles FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE USING (auth.uid() = id);

-- Freelancer profiles: Owner read/write, admin read all
CREATE POLICY "Freelancers can view own profile"
  ON freelancer_profiles FOR SELECT USING (profile_id = auth.uid());

CREATE POLICY "Freelancers can update own profile"
  ON freelancer_profiles FOR UPDATE USING (profile_id = auth.uid());

CREATE POLICY "Admins can view all freelancer profiles"
  ON freelancer_profiles FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'manager'))
  );

-- Students: Freelancer can only see their own students
CREATE POLICY "Freelancers can view own students"
  ON students FOR SELECT USING (
    freelancer_id = (SELECT id FROM freelancer_profiles WHERE profile_id = auth.uid())
  );

CREATE POLICY "Freelancers can create students"
  ON students FOR INSERT WITH CHECK (
    freelancer_id = (SELECT id FROM freelancer_profiles WHERE profile_id = auth.uid())
  );

CREATE POLICY "Freelancers can update own students"
  ON students FOR UPDATE USING (
    freelancer_id = (SELECT id FROM freelancer_profiles WHERE profile_id = auth.uid())
  );

-- Applications: Freelancer can only see their own applications
CREATE POLICY "Freelancers can view own applications"
  ON applications FOR SELECT USING (
    freelancer_id = (SELECT id FROM freelancer_profiles WHERE profile_id = auth.uid())
  );

CREATE POLICY "Freelancers can create applications"
  ON applications FOR INSERT WITH CHECK (
    freelancer_id = (SELECT id FROM freelancer_profiles WHERE profile_id = auth.uid())
  );

-- Documents: Freelancer can only see documents for their students
CREATE POLICY "Freelancers can view own documents"
  ON documents FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM students s
      JOIN freelancer_profiles f ON s.freelancer_id = f.id
      WHERE s.id = documents.student_id AND f.profile_id = auth.uid()
    )
  );

-- Earnings: Freelancer can only see their own earnings
CREATE POLICY "Freelancers can view own earnings"
  ON earnings FOR SELECT USING (
    freelancer_id = (SELECT id FROM freelancer_profiles WHERE profile_id = auth.uid())
  );

-- Notifications: Freelancer can only see their own notifications
CREATE POLICY "Freelancers can view own notifications"
  ON notifications FOR SELECT USING (
    freelancer_id = (SELECT id FROM freelancer_profiles WHERE profile_id = auth.uid())
  );

CREATE POLICY "Freelancers can update own notifications"
  ON notifications FOR UPDATE USING (
    freelancer_id = (SELECT id FROM freelancer_profiles WHERE profile_id = auth.uid())
  );
```

---

## 3. Project Structure

```
freelancer-portal/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth group (no layout)
│   │   ├── login/
│   │   ├── signup/
│   │   ├── forgot-password/
│   │   └── verify-otp/
│   ├── (dashboard)/              # Dashboard group
│   │   ├── layout.tsx            # Dashboard layout with sidebar
│   │   ├── page.tsx              # Dashboard home - Overview
│   │   ├── students/
│   │   │   ├── page.tsx          # List all students
│   │   │   ├── add/
│   │   │   │   └── page.tsx      # Add new student
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Student details
│   │   ├── applications/
│   │   │   ├── page.tsx          # List all applications
│   │   │   ├── create/
│   │   │   │   └── page.tsx      # Create new application
│   │   │   └── [id]/
│   │   │       └── page.tsx      # Application details & tracking
│   │   ├── documents/
│   │   │   ├── page.tsx          # Document management
│   │   │   └── upload/
│   │   │       └── page.tsx      # Upload documents
│   │   ├── earnings/
│   │   │   ├── page.tsx          # Earnings overview
│   │   │   └── history/
│   │   │           └── page.tsx  # Commission history
│   │   ├── profile/
│   │   │   └── page.tsx          # Edit profile & bank details
│   │   ├── notifications/
│   │   │   └── page.tsx          # All notifications
│   │   └── support/
│   │       └── page.tsx          # Help & support tickets
│   ├── api/                      # API Routes
│   │   ├── auth/
│   │   ├── students/
│   │   ├── applications/
│   │   ├── documents/
│   │   ├── earnings/
│   │   ├── webhooks/
│   │   │   └── supabase/         # Supabase webhooks
│   │   └── cron/                 # Scheduled jobs
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Landing page
│   ├── globals.css
│   └── loading.tsx
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui components
│   ├── layout/                   # Layout components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   ├── footer.tsx
│   │   └── mobile-nav.tsx
│   ├── dashboard/                # Dashboard-specific
│   │   ├── stats-cards.tsx       # Students, Applications, Earnings stats
│   │   ├── quick-actions.tsx     # Add Student, New Application buttons
│   │   ├── recent-students.tsx   # Recently added students
│   │   ├── recent-applications.tsx # Recent application updates
│   │   ├── earnings-summary.tsx  # Commission overview
│   │   ├── activity-feed.tsx     # Recent activity log
│   │   └── notifications-panel.tsx
│   ├── students/                   # Student management
│   │   ├── student-list.tsx
│   │   ├── student-card.tsx
│   │   ├── student-form.tsx      # Add/Edit student
│   │   ├── student-filters.tsx
│   │   └── student-details.tsx
│   ├── applications/               # Application management
│   │   ├── application-list.tsx
│   │   ├── application-card.tsx
│   │   ├── application-form.tsx    # Create application
│   │   ├── status-tracker.tsx      # Visual progress tracker
│   │   ├── application-filters.tsx
│   │   └── application-details.tsx
│   ├── documents/                  # Document management
│   │   ├── document-list.tsx
│   │   ├── document-uploader.tsx
│   │   ├── document-card.tsx
│   │   ├── verification-badge.tsx
│   │   └── document-preview.tsx
│   ├── earnings/                   # Earnings/Commission
│   │   ├── earnings-chart.tsx
│   │   ├── commission-table.tsx
│   │   ├── payment-status.tsx
│   │   └── withdrawal-form.tsx
│   ├── profile/                    # Profile management
│   │   ├── profile-form.tsx
│   │   ├── bank-details-form.tsx
│   │   ├── kyc-verification.tsx
│   │   └── agent-code-display.tsx
   │   ├── gamification/               # Gamification
   │   │   ├── coins-display.tsx
   │   │   ├── badge-showcase.tsx
   │   │   ├── progress-bar.tsx
   │   │   ├── milestone-popup.tsx
   │   │   └── level-indicator.tsx
   │   └── shared/                     # Shared components
   │       ├── animated-counter.tsx
   │       ├── confetti-effect.tsx
   │       ├── coin-animation.tsx
   │       ├── swipeable-carousel.tsx
   │       ├── data-table.tsx
   │       ├── search-bar.tsx
   │       ├── filter-dropdown.tsx
   │       ├── status-badge.tsx
   │       ├── skeleton-loader.tsx
   │       └── empty-state.tsx
   ├── hooks/                          # Custom React Hooks
   │   ├── use-auth.ts
   │   ├── use-profile.ts
   │   ├── use-students.ts
   │   ├── use-applications.ts
   │   ├── use-documents.ts
   │   ├── use-earnings.ts
   │   ├── use-notifications.ts
   │   ├── use-coins.ts
   │   ├── use-realtime.ts
   │   └── use-media-query.ts
   ├── lib/                            # Utilities & Config
   │   ├── supabase/                   # Supabase clients
   │   │   ├── client.ts               # Browser client
   │   │   ├── server.ts               # Server client
   │   │   └── admin.ts                # Admin client
   │   ├── redis/                      # Redis client
   │   │   └── client.ts
   │   ├── utils/
   │   │   ├── cn.ts                   # Tailwind merge
   │   │   ├── formatters.ts           # Date, currency formatters
   │   │   ├── validators.ts           # Form validation (Zod)
   │   │   └── constants.ts            # App constants
   │   └── types/                      # TypeScript types
   │       ├── database.ts             # Database types
   │       ├── api.ts                  # API types
   │       └── index.ts
   ├── stores/                         # Zustand Stores
   │   ├── auth-store.ts
   │   ├── ui-store.ts
   │   ├── student-store.ts
   │   ├── application-store.ts
   │   ├── notification-store.ts
   │   └── gamification-store.ts
   ├── public/                         # Static assets
   │   ├── images/
   │   ├── icons/
   │   └── fonts/
   ├── styles/                         # Additional styles
   │   └── animations.css
   ├── middleware.ts                   # Next.js middleware
   ├── next.config.js
   ├── tailwind.config.ts
   ├── tsconfig.json
   └── package.json
   ```

---

## 4. Design System

### 4.1 Color Palette (Based on LangoLeaf + Academic Expert)

```typescript
// tailwind.config.ts
const config = {
  theme: {
    extend: {
      colors: {
        // Primary Brand Colors
        primary: {
          DEFAULT: '#6d28d9',      // Professional Purple
          50: '#f5f3ff',
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',          // Main
          800: '#5b21b6',
          900: '#4c1d95',
        },
        // Accent Colors
        accent: {
          cyan: '#22d3ee',         // Bright Cyan
          teal: '#14b8a6',         // Teal
          coral: '#f97316',        // Coral/Orange
        },
        // Dark Theme Base
        dark: {
          bg: '#0f0f1a',           // Main background
          surface: '#1a1a2e',      // Card surfaces
          elevated: '#252542',     // Elevated surfaces
          border: '#2d2d4a',       // Borders
        },
        // Status Colors
        status: {
          pending: '#f59e0b',      // Amber
          approved: '#10b981',     // Green
          rejected: '#ef4444',     // Red
          review: '#3b82f6',       // Blue
        },
        // Gamification Colors
        coins: {
          DEFAULT: '#fbbf24',      // Gold
          glow: '#f59e0b',
        },
        success: '#10b981',
        warning: '#f59e0b',
        error: '#ef4444',
      },
      backgroundImage: {
        'gradient-primary': 'linear-gradient(135deg, #6d28d9 0%, #22d3ee 100%)',
        'gradient-teal-coral': 'linear-gradient(135deg, #14b8a6 0%, #f97316 100%)',
        'gradient-dark': 'linear-gradient(180deg, #0f0f1a 0%, #1a1a2e 100%)',
      },
      animation: {
        'coin-fly': 'coinFly 1s ease-out',
        'badge-pop': 'badgePop 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        'progress-fill': 'progressFill 1s ease-out',
        'confetti': 'confetti 2s ease-out',
        'float': 'float 3s ease-in-out infinite',
        'pulse-glow': 'pulseGlow 2s ease-in-out infinite',
        'slide-in': 'slideIn 0.3s ease-out',
      },
      keyframes: {
        coinFly: {
          '0%': { transform: 'translateY(0) scale(1)', opacity: '1' },
          '50%': { transform: 'translateY(-50px) scale(1.2)', opacity: '1' },
          '100%': { transform: 'translateY(-100px) scale(0)', opacity: '0' },
        },
        badgePop: {
          '0%': { transform: 'scale(0)', opacity: '0' },
          '50%': { transform: 'scale(1.2)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        progressFill: {
          '0%': { width: '0%' },
          '100%': { width: 'var(--progress-width)' },
        },
        confetti: {
          '0%': { transform: 'translateY(0) rotate(0deg)', opacity: '1' },
          '100%': { transform: 'translateY(100vh) rotate(720deg)', opacity: '0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(109, 40, 217, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(109, 40, 217, 0.6)' },
        },
        slideIn: {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
      },
    },
  },
};
```

### 4.2 Typography

```typescript
// Font configuration
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  display: ['Cal Sans', 'Inter', 'sans-serif'], // For headings
  mono: ['JetBrains Mono', 'monospace'],
}
```

### 4.3 Component Specifications

#### Buttons
- **Primary**: Purple background (#6d28d9), white text, rounded-xl, hover:scale-105
- **Secondary**: Transparent, purple border, purple text, rounded-xl
- **Accent**: Cyan background (#22d3ee), dark text, rounded-xl
- **Success**: Green background (#10b981), white text, rounded-xl
- **Ghost**: Transparent, hover:bg-dark-elevated

#### Cards
- Background: dark-surface (#1a1a2e)
- Border: 1px solid dark-border
- Border-radius: rounded-2xl
- Shadow: shadow-lg with purple tint
- Hover: translateY(-4px), enhanced shadow

#### Status Badges
```typescript
const statusStyles = {
  draft: 'bg-gray-500/20 text-gray-400',
  submitted: 'bg-blue-500/20 text-blue-400',
  documents_pending: 'bg-yellow-500/20 text-yellow-400',
  under_review: 'bg-purple-500/20 text-purple-400',
  approved: 'bg-green-500/20 text-green-400',
  rejected: 'bg-red-500/20 text-red-400',
  payment_pending: 'bg-orange-500/20 text-orange-400',
  payment_received: 'bg-cyan-500/20 text-cyan-400',
  enrolled: 'bg-emerald-500/20 text-emerald-400',
};
```

---

## 5. Key Features Implementation

### 5.1 Authentication System

```typescript
// lib/supabase/auth.ts
export async function signUpWithEmail(email: string, password: string, metadata: object) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
  return { data, error };
}

export async function signInWithOAuth(provider: 'google' | 'github') {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });
  return { data, error };
}

// WhatsApp OTP for phone verification
export async function sendWhatsAppOTP(phone: string) {
  // Using Twilio Verify API or similar
  // Store pending verification in Redis with 5-min TTL
  const otp = generateOTP();
  await redis.setex(`otp:${phone}`, 300, otp);
  
  // Send via WhatsApp API
  await sendWhatsAppMessage(phone, `Your LangoLeaf verification code is: ${otp}`);
}

export async function verifyWhatsAppOTP(phone: string, code: string) {
  const stored = await redis.get(`otp:${phone}`);
  if (stored === code) {
    await redis.del(`otp:${phone}`);
    return { success: true };
  }
  return { success: false, error: 'Invalid OTP' };
}
```

### 5.2 Real-time Features (Supabase Realtime)

```typescript
// hooks/use-realtime.ts
export function useRealtimeApplications(freelancerId: string) {
  useEffect(() => {
    const subscription = supabase
      .channel('applications')
      .on('postgres_changes', 
        { 
          event: '*', 
          schema: 'public', 
          table: 'applications',
          filter: `freelancer_id=eq.${freelancerId}`
        },
        (payload) => {
          // Update React Query cache
          queryClient.invalidateQueries(['applications', freelancerId]);
          
          // Show notification for status changes
          if (payload.eventType === 'UPDATE') {
            showNotification({
              title: 'Application Updated',
              message: `Application #${payload.new.id} status changed to ${payload.new.application_status}`,
            });
          }
        }
      )
      .subscribe();
    
    return () => subscription.unsubscribe();
  }, [freelancerId]);
}
```

### 5.3 Caching Strategy (Upstash Redis)

```typescript
// lib/redis/client.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

// Cache strategies
export const cache = {
  // Cache student list for 5 minutes
  async getStudents(freelancerId: string, filters: object) {
    const key = `students:${freelancerId}:${JSON.stringify(filters)}`;
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    
    const students = await fetchStudentsFromDB(freelancerId, filters);
    await redis.setex(key, 300, JSON.stringify(students));
    return students;
  },
  
  // Cache application details for 10 minutes
  async getApplication(applicationId: string) {
    const key = `application:${applicationId}`;
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    
    const application = await fetchApplicationFromDB(applicationId);
    await redis.setex(key, 600, JSON.stringify(application));
    return application;
  },
  
  // Cache freelancer profile for 1 hour
  async getFreelancerProfile(userId: string) {
    const key = `freelancer:profile:${userId}`;
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    
    const profile = await fetchFreelancerProfileFromDB(userId);
    await redis.setex(key, 3600, JSON.stringify(profile));
    return profile;
  },
  
  // Cache programs list for 30 minutes
  async getPrograms() {
    const key = 'programs:all';
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    
    const programs = await fetchProgramsFromDB();
    await redis.setex(key, 1800, JSON.stringify(programs));
    return programs;
  },
  
  // Invalidate cache
  async invalidate(pattern: string) {
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
};
```

### 5.4 Gamification System

```typescript
// stores/gamification-store.ts
interface GamificationState {
  coins: number;
  badges: Badge[];
  level: number;
  progress: number;
  recentMilestone: Milestone | null;
  
  addCoins: (amount: number, reason: string) => void;
  spendCoins: (amount: number) => boolean;
  checkMilestones: () => void;
  showMilestone: (milestone: Milestone) => void;
}

// Coin earning triggers for freelancers
const COIN_REWARDS = {
  PROFILE_COMPLETE: 50,
  FIRST_STUDENT_ADDED: 100,
  FIRST_APPLICATION_SUBMITTED: 150,
  STUDENT_ENROLLED: 500,
  DOCUMENT_VERIFIED: 50,
  COMMISSION_EARNED: 200,
  REFERRAL_SUCCESS: 300,
  DAILY_LOGIN: 10,
  STREAK_7_DAYS: 100,
  STREAK_30_DAYS: 500,
  TOP_PERFORMER_MONTH: 1000,
};

// Badge definitions for freelancers
const BADGES = [
  { id: 'newcomer', name: 'New Agent', requirement: 0, icon: '🌱', description: 'Welcome to LangoLeaf!' },
  { id: 'first-step', name: 'First Step', requirement: 1, type: 'students_added', icon: '👣', description: 'Added your first student' },
  { id: 'go-getter', name: 'Go-Getter', requirement: 10, type: 'students_added', icon: '🚀', description: 'Added 10 students' },
  { id: 'super-agent', name: 'Super Agent', requirement: 50, type: 'students_added', icon: '⭐', description: 'Added 50 students' },
  { id: 'enrollment-pro', name: 'Enrollment Pro', requirement: 5, type: 'students_enrolled', icon: '🎓', description: '5 students successfully enrolled' },
  { id: 'top-earner', name: 'Top Earner', requirement: 10000, type: 'total_earnings', icon: '💰', description: 'Earned ₹10,000 in commissions' },
  { id: 'document-master', name: 'Document Master', requirement: 20, type: 'documents_verified', icon: '📄', description: '20 documents verified' },
  { id: 'verified', name: 'Verified Agent', requirement: 1, type: 'kyc_verified', icon: '✅', description: 'KYC verification completed' },
  { id: 'consistency-champion', name: 'Consistency Champion', requirement: 30, type: 'daily_streak', icon: '🔥', description: '30-day active streak' },
  { id: 'referral-star', name: 'Referral Star', requirement: 5, type: 'referrals', icon: '🌟', description: 'Referred 5 new agents' },
];
```

### 5.5 File Upload (Supabase Storage)

```typescript
// lib/supabase/storage.ts
export async function uploadDocument(
  file: File, 
  studentId: string, 
  documentType: string,
  userId: string
) {
  const fileExt = file.name.split('.').pop();
  const fileName = `${studentId}-${documentType}-${Date.now()}.${fileExt}`;
  const filePath = `documents/${studentId}/${fileName}`;
  
  const { error: uploadError } = await supabase.storage
    .from('freelancer-documents')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: true,
      contentType: file.type,
    });
  
  if (uploadError) throw uploadError;
  
  const { data: { publicUrl } } = supabase.storage
    .from('freelancer-documents')
    .getPublicUrl(filePath);
  
  // Save document record in database
  const { data: document, error: dbError } = await supabase
    .from('documents')
    .insert({
      student_id: studentId,
      document_type: documentType,
      file_name: file.name,
      file_url: publicUrl,
      file_size: file.size,
      mime_type: file.type,
      uploaded_by: userId,
    })
    .select()
    .single();
  
  if (dbError) throw dbError;
  
  return document;
}
```

---

## 6. API Routes Structure

```typescript
// app/api/students/route.ts
import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cache } from '@/lib/redis/client';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const freelancerId = searchParams.get('freelancer_id');
  
  if (!freelancerId) {
    return Response.json({ error: 'Freelancer ID required' }, { status: 400 });
  }
  
  // Try cache first
  const cached = await cache.getStudents(freelancerId, Object.fromEntries(searchParams));
  if (cached) return Response.json(cached);
  
  // Fetch from DB
  const supabase = createRouteHandlerClient({ cookies });
  const { data: students, error } = await supabase
    .from('students')
    .select('*, applications(count), documents(count)')
    .eq('freelancer_id', freelancerId)
    .order('created_at', { ascending: false });
  
  if (error) return Response.json({ error: error.message }, { status: 500 });
  
  return Response.json(students);
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const student = await request.json();
  
  const { data, error } = await supabase
    .from('students')
    .insert(student)
    .select()
    .single();
  
  if (error) return Response.json({ error: error.message }, { status: 500 });
  
  // Award coins for adding student
  await awardCoins(student.freelancer_id, COIN_REWARDS.FIRST_STUDENT_ADDED, 'Student added');
  
  // Invalidate cache
  await cache.invalidate(`students:${student.freelancer_id}:*`);
  
  return Response.json(data);
}

// app/api/applications/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const freelancerId = searchParams.get('freelancer_id');
  
  const supabase = createRouteHandlerClient({ cookies });
  const { data: applications, error } = await supabase
    .from('applications')
    .select(`
      *,
      student:students(*),
      program:programs(*),
      university:universities(*)
    `)
    .eq('freelancer_id', freelancerId)
    .order('created_at', { ascending: false });
  
  return Response.json(applications);
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies });
  const application = await request.json();
  
  // Calculate commission
  const { data: program } = await supabase
    .from('programs')
    .select('commission_percentage')
    .eq('id', application.program_id)
    .single();
  
  const commissionAmount = (application.course_fee * program.commission_percentage) / 100;
  
  const { data, error } = await supabase
    .from('applications')
    .insert({
      ...application,
      commission_amount: commissionAmount,
    })
    .select()
    .single();
  
  // Award coins
  await awardCoins(application.freelancer_id, COIN_REWARDS.FIRST_APPLICATION_SUBMITTED, 'Application submitted');
  
  return Response.json(data);
}
```

---

## 7. Free Tier Optimization Strategies

### 7.1 Database Optimization
- Use connection pooling (PgBouncer on Supabase)
- Implement aggressive caching with Redis
- Use materialized views for complex queries
- Limit real-time subscriptions to essential features only
- Implement pagination with cursor-based navigation

### 7.2 Vercel Optimization
- Use static generation (ISR) for public pages
- Edge functions for auth middleware
- Image optimization with next/image
- Code splitting by route
- Minimize serverless function size

### 7.3 Redis Optimization
- Cache only frequently accessed data
- Use appropriate TTL values
- Implement cache warming for popular content
- Use Redis for rate limiting (prevents abuse)

### 7.4 Storage Optimization
- Compress images before upload
- Use WebP format
- Implement image resizing
- Set up CDN caching headers

---

## 8. Environment Variables

```bash
# .env.local (never commit this)

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Upstash Redis
UPSTASH_REDIS_REST_URL=https://your-redis-url.upstash.io
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# Application
NEXT_PUBLIC_SITE_URL=https://freelancer.langoleaf.com
NEXT_PUBLIC_APP_NAME=LangoLeaf Freelancer Hub

# OAuth (if using additional providers)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-secret

# WhatsApp/Twilio (for OTP)
TWILIO_ACCOUNT_SID=your-twilio-sid
TWILIO_AUTH_TOKEN=your-twilio-token
TWILIO_VERIFY_SERVICE_SID=your-verify-sid

# Payment/Commission (Razorpay or similar)
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

---

## 9. Deployment Checklist

### Pre-deployment
- [ ] Set up Supabase project with schema
- [ ] Configure RLS policies
- [ ] Set up Upstash Redis
- [ ] Configure Vercel project
- [ ] Set environment variables
- [ ] Configure custom domain (freelancer.langoleaf.com)
- [ ] Set up SSL certificate

### Post-deployment
- [ ] Test authentication flows
- [ ] Verify real-time subscriptions
- [ ] Test file uploads (documents)
- [ ] Check Redis caching
- [ ] Test commission calculations
- [ ] Monitor analytics
- [ ] Set up error tracking (Sentry free tier)

---

## 10. Development Phases

### Phase 1: Foundation (Week 1)
- Project setup with Next.js + Tailwind + shadcn/ui
- Supabase integration and schema setup
- Authentication system (email + OAuth + WhatsApp OTP)
- Freelancer onboarding flow
- Basic layout and navigation

### Phase 2: Core Features (Week 2-3)
- Freelancer profile management
- Student management (add, edit, view)
- Application creation and tracking
- Document upload system
- Programs and universities listing

### Phase 3: Gamification & Earnings (Week 4)
- Coins system implementation
- Badge system
- Earnings dashboard
- Commission tracking
- Payment status visualization

### Phase 4: Advanced Features (Week 5)
- Real-time notifications
- Application status tracking with visual progress
- Support ticket system
- Advanced analytics for freelancers
- Referral system

### Phase 5: Polish & Optimization (Week 6)
- Performance optimization
- Mobile responsiveness
- Accessibility improvements
- Testing and bug fixes
- Documentation

---

## 11. Cost Analysis (Monthly - Free Tier)

| Service | Free Tier Limit | Estimated Usage | Status |
|---------|----------------|-----------------|---------|
| Vercel | 100GB bandwidth | ~20GB | ✅ Safe |
| Supabase DB | 500MB + 2M requests | ~300MB, 500K requests | ✅ Safe |
| Supabase Auth | 50K users/month | ~1K users | ✅ Safe |
| Supabase Storage | 1GB | ~500MB | ✅ Safe |
| Upstash Redis | 10K commands/day | ~5K/day | ✅ Safe |
| **Total Cost** | | **$0** | ✅ |

---

## 12. Security Considerations

- All API routes protected with middleware
- RLS policies on all database tables
- Input validation with Zod
- Rate limiting on auth endpoints
- CSRF protection
- Secure cookie settings
- Content Security Policy headers
- Document access restricted to owner freelancer
- Regular dependency updates

---

## 13. Monitoring & Analytics

- Vercel Analytics (built-in)
- Supabase Dashboard for DB metrics
- Custom dashboard for:
  - Active freelancers
  - Students added per freelancer
  - Application conversion rates
  - Commission payouts
  - Coin economy health
  - Popular programs/universities
  - Document verification times

---

## 14. Key Dashboard Sections (Based on Edufast Reference)

### 14.1 Dashboard Overview
- **Welcome Message**: "Welcome back, [Freelancer Name]!"
- **Quick Stats Cards**:
  - Students Added (total count)
  - Applications Approved (count)
  - Action Required (missing documents count)
  - Pending Commission (amount)
- **Quick Actions**: "Add New Student", "View All Students"
- **Recent Activity**: Last 5 student additions/application updates
- **Notifications**: Document rejections, application approvals

### 14.2 Students Management
- **Student List**: Table with filters (status, date, program)
- **Add Student Form**: 
  - Personal details (name, email, phone, DOB, gender)
  - Address (city, state, pincode)
  - Education background
  - Preferred program/university
- **Student Details View**:
  - Personal information
  - Application history
  - Document status
  - Notes/remarks

### 14.3 Applications Tracking
- **Application Status Visual Tracker**:
  1. Draft → 2. Submitted → 3. Documents Pending → 4. Under Review → 5. Approved/Rejected → 6. Payment → 7. Enrolled
- **Application Cards**: Program name, university, status badge, commission amount
- **Status Filters**: View by status (pending, approved, rejected, enrolled)

### 14.4 Documents Management
- **Document Upload**: Drag & drop for each document type
- **Verification Status**: Pending/Verified/Rejected with reasons
- **Document Types**:
  - Photo
  - Aadhar Card
  - PAN Card
  - 10th/12th/Graduation Marksheets
  - Experience Certificate
  - Salary Slip
  - Bank Statement

### 14.5 Earnings & Commission
- **Earnings Overview**: Total earned, pending, paid
- **Commission History**: Table with application reference, amount, status
- **Payment Status**: Pending → Approved → Paid
- **Withdrawal Request**: Form to request commission payout

### 14.6 Profile & Settings
- **Personal Information**: Name, email, phone, address
- **Bank Details**: Account number, IFSC, bank name (for commission payout)
- **KYC Documents**: PAN card, address proof
- **Agent Code**: Unique referral code for new freelancer signups
- **Verification Status**: Pending/Verified badge

---

This plan provides a complete roadmap for building the **LangoLeaf Freelancer Partner Portal** - an EdTech platform where freelancers/agents generate leads, manage student admissions, track applications, and earn commissions. The architecture supports gamified, interactive design requirements while keeping all infrastructure costs at zero using free tiers of Vercel, Supabase, and Upstash Redis.

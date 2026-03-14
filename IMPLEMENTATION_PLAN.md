# Student & Application Management System
## Implementation Plan

**Project:** Freelancer CRM for Education Consultants  
**Version:** 1.0.0  
**Last Updated:** March 14, 2026  
**Estimated Duration:** 10-12 Weeks  
**Team Size:** 1-2 Developers

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [Database Schema](#3-database-schema)
4. [State Machines](#4-state-machines)
5. [Build Phases](#5-build-phases)
6. [File Structure](#6-file-structure)
7. [Environment Configuration](#7-environment-configuration)
8. [Testing Strategy](#8-testing-strategy)
9. [Deployment Checklist](#9-deployment-checklist)
10. [Appendices](#10-appendices)

---

## 1. Executive Summary

### 1.1 Project Purpose
A comprehensive CRM system enabling education consultants ("freelancers") to manage student university applications through a state-machine-driven, multi-tenant platform with document management and workflow automation.

### 1.2 Core Problem Solved
**Before:** Broken workflow where adding students was disconnected from application creation—users had to navigate separately to create applications after adding students.

**After:** Unified 4-step wizard (Personal → Academic → Documents → Review) with localStorage persistence for draft recovery, enabling complete student onboarding in one flow.

### 1.3 Key Features
- **Student Management:** Lead tracking, profile completeness, soft-delete
- **Application Workflow:** 15-state machine from draft to enrolled
- **Document System:** Versioned uploads with Cloudinary integration
- **University/Program Database:** Searchable catalog with filtering
- **Dashboard Analytics:** Real-time stats via materialized views
- **Audit Trail:** Complete status history and activity logging

### 1.4 Success Metrics
- [ ] Student onboarding completed in < 5 minutes
- [ ] Zero data loss during wizard (browser crash recovery)
- [ ] < 2 second page load times
- [ ] 100% RLS policy coverage
- [ ] All 15 business rules enforced

---

## 2. Architecture Overview

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | Next.js 14+ (App Router) | React framework with SSR/SSG |
| **Language** | TypeScript 5+ | Type safety |
| **Styling** | Tailwind CSS 3.4+ | Utility-first CSS |
| **Components** | shadcn/ui | Accessible UI primitives |
| **Database** | Supabase PostgreSQL | Database + Auth |
| **Storage** | Cloudinary | Document/file storage |
| **State** | Zustand | Global state management |
| **Forms** | React Hook Form + Zod | Form handling + validation |
| **Tables** | TanStack React Table | Data grid components |

### 2.2 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  Next.js App │  │   Zustand    │  │ React Hook   │       │
│  │   Router     │  │    Stores    │  │    Form      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API LAYER (Next.js)                     │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │    Students  │  │ Applications │  │   Documents  │       │
│  │     API      │  │     API      │  │     API      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │ Universities │  │   Programs   │  │   Dashboard  │       │
│  │     API      │  │     API      │  │     API      │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    SERVICE LAYER                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Supabase   │  │  Cloudinary  │  │    Zod       │       │
│  │   Client     │  │    Client    │  │ Validation   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   DATA LAYER                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │  PostgreSQL  │  │  Cloudinary  │  │   Row Level  │       │
│  │   Database   │  │    Storage   │  │   Security   │       │
│  └──────────────┘  └──────────────┘  └──────────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### 2.3 Security Model

**Authentication:** Supabase Auth with email/password + OAuth providers

**Authorization:**
- Row Level Security (RLS) on all tables
- Four user roles: `super_admin`, `admin`, `manager`, `freelancer`
- Freelancers isolated to own data only
- Middleware route protection

**Data Protection:**
- Soft deletes (no hard deletes)
- Audit logging for all changes
- Input sanitization at all layers
- Signed URLs for document access (1-hour expiry)

---

## 3. Database Schema

### 3.1 Entity Relationship Diagram

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│    profiles     │     │     students     │     │  applications   │
├─────────────────┤     ├──────────────────┤     ├─────────────────┤
│ id (PK)         │◄────┤ freelancer_id    │     │ id (PK)         │
│ email           │     │ id (PK)          │────►│ student_id (FK) │
│ full_name       │     │ full_name        │     │ university_id   │
│ role            │     │ email            │     │ program_id      │
│ phone           │     │ phone            │     │ status          │
│ created_at      │     │ status           │     │ intake_date     │
└─────────────────┘     │ profile_complete │     │ notes           │
                        │ deleted_at       │     │ created_at      │
                        └──────────────────┘     └─────────────────┘
                                 │                        │
                                 │               ┌────────┘
                                 │               │
                                 ▼               ▼
                        ┌──────────────────┐     ┌─────────────────┐
                        │ student_documents│     │application_docs │
                        ├──────────────────┤     ├─────────────────┤
                        │ id (PK)          │     │ id (PK)         │
                        │ student_id (FK)  │     │ application_id  │
                        │ doc_type         │     │ document_id     │
                        │ file_url         │     │ is_required     │
                        │ status           │     │ uploaded_at     │
                        │ version          │     └─────────────────┘
                        │ is_latest        │
                        └──────────────────┘
                                 │
                                 ▼
                        ┌──────────────────┐
                        │  status_history  │
                        ├──────────────────┤
                        │ id (PK)          │
                        │ entity_type      │
                        │ entity_id        │
                        │ old_status       │
                        │ new_status       │
                        │ changed_by       │
                        │ reason           │
                        │ created_at       │
                        └──────────────────┘
```

### 3.2 Core Tables

#### 3.2.1 profiles
```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'manager', 'freelancer')),
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2.2 students
```sql
CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  freelancer_id UUID NOT NULL REFERENCES profiles(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  nationality TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  passport_number TEXT,
  status TEXT NOT NULL DEFAULT 'lead' CHECK (status IN ('lead', 'active', 'inactive', 'enrolled', 'archived')),
  profile_complete INTEGER DEFAULT 0 CHECK (profile_complete BETWEEN 0 AND 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
```

#### 3.2.3 applications
```sql
CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  university_id UUID NOT NULL REFERENCES universities(id),
  program_id UUID NOT NULL REFERENCES programs(id),
  intake_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'documents_pending', 'ready_to_submit', 'submitted', 'under_review', 'interview_scheduled', 'interview_completed', 'offer_received', 'offer_accepted', 'offer_declined', 'enrolled', 'rejected', 'withdrawn', 'on_hold')),
  application_fee_paid BOOLEAN DEFAULT FALSE,
  application_fee_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2.4 universities
```sql
CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT,
  website TEXT,
  logo_url TEXT,
  ranking INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2.5 programs
```sql
CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id UUID NOT NULL REFERENCES universities(id),
  name TEXT NOT NULL,
  degree_type TEXT NOT NULL CHECK (degree_type IN ('bachelor', 'master', 'phd', 'diploma', 'certificate')),
  duration_months INTEGER,
  tuition_fee DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  language TEXT,
  description TEXT,
  requirements TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2.6 student_documents
```sql
CREATE TABLE student_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES students(id),
  doc_type TEXT NOT NULL CHECK (doc_type IN ('passport', 'transcript', 'diploma', 'cv', 'recommendation_letter', 'personal_statement', 'language_test', 'other')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  cloudinary_public_id TEXT,
  status TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'under_review', 'approved', 'rejected', 'expired')),
  version INTEGER DEFAULT 1,
  is_latest BOOLEAN DEFAULT TRUE,
  uploaded_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2.7 application_documents
```sql
CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES applications(id),
  document_id UUID REFERENCES student_documents(id),
  doc_type TEXT NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  is_uploaded BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ
);
```

#### 3.2.8 status_history
```sql
CREATE TABLE status_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('student', 'application', 'document')),
  entity_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2.9 activity_log
```sql
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 3.2.10 notifications
```sql
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3.3 Database Functions & Triggers

#### 3.3.1 Auto-update updated_at
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_students_updated_at BEFORE UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

#### 3.3.2 Log Status Changes
```sql
CREATE OR REPLACE FUNCTION log_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO status_history (entity_type, entity_id, old_status, new_status, changed_by)
    VALUES (
      TG_TABLE_NAME,
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(current_setting('app.current_user_id', TRUE)::UUID, NULL)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER log_student_status_change AFTER UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION log_status_change();
CREATE TRIGGER log_application_status_change AFTER UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION log_status_change();
```

#### 3.3.3 Sync Student Status with Applications
```sql
CREATE OR REPLACE FUNCTION sync_student_status_with_application()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'enrolled' THEN
    UPDATE students SET status = 'enrolled' WHERE id = NEW.student_id;
  ELSIF NEW.status IN ('offer_received', 'offer_accepted') THEN
    UPDATE students SET status = 'active' WHERE id = NEW.student_id AND status = 'lead';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER sync_student_status AFTER UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION sync_student_status_with_application();
```

#### 3.3.4 Calculate Profile Completeness
```sql
CREATE OR REPLACE FUNCTION calculate_profile_completeness()
RETURNS TRIGGER AS $$
DECLARE
  total_fields INTEGER := 10;
  filled_fields INTEGER := 0;
BEGIN
  IF NEW.full_name IS NOT NULL AND NEW.full_name != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.email IS NOT NULL AND NEW.email != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.phone IS NOT NULL AND NEW.phone != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.date_of_birth IS NOT NULL THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.nationality IS NOT NULL AND NEW.nationality != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.address IS NOT NULL AND NEW.address != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.city IS NOT NULL AND NEW.city != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.country IS NOT NULL AND NEW.country != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.passport_number IS NOT NULL AND NEW.passport_number != '' THEN filled_fields := filled_fields + 1; END IF;
  IF NEW.notes IS NOT NULL AND NEW.notes != '' THEN filled_fields := filled_fields + 1; END IF;
  
  NEW.profile_complete := (filled_fields * 100) / total_fields;
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_student_completeness BEFORE INSERT OR UPDATE ON students
  FOR EACH ROW EXECUTE FUNCTION calculate_profile_completeness();
```

### 3.4 Row Level Security (RLS) Policies

#### 3.4.1 profiles
```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (id = auth.uid());

CREATE POLICY "Admins can view all profiles"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin')
    )
  );
```

#### 3.4.2 students
```sql
ALTER TABLE students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Freelancers can CRUD own students"
  ON students FOR ALL
  USING (
    freelancer_id = auth.uid() AND deleted_at IS NULL
  );

CREATE POLICY "Admins can view all students"
  ON students FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );
```

#### 3.4.3 applications
```sql
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Freelancers can CRUD applications for own students"
  ON applications FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = applications.student_id 
      AND students.freelancer_id = auth.uid()
      AND students.deleted_at IS NULL
    )
  );

CREATE POLICY "Admins can view all applications"
  ON applications FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('super_admin', 'admin', 'manager')
    )
  );
```

#### 3.4.4 student_documents
```sql
ALTER TABLE student_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Freelancers can CRUD documents for own students"
  ON student_documents FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM students 
      WHERE students.id = student_documents.student_id 
      AND students.freelancer_id = auth.uid()
      AND students.deleted_at IS NULL
    )
  );
```

---

## 4. State Machines

### 4.1 Application Status State Machine

```
                              ┌─────────────────┐
                              │     DRAFT       │
                              │   (Initial)     │
                              └────────┬────────┘
                                       │
                                       │ Add documents
                                       ▼
                         ┌─────────────────────────────┐
                         │     DOCUMENTS_PENDING       │
                         │  (Missing required docs)    │
                         └────────┬────────────────────┘
                                  │
                                  │ All required docs uploaded
                                  ▼
                    ┌─────────────────────────────┐
                    │      READY_TO_SUBMIT        │
                    │   (Complete, can submit)    │
                    └────────┬────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              │              ▼
    ┌─────────────────┐      │    ┌─────────────────┐
    │    SUBMITTED    │◄─────┘    │    ON_HOLD      │
    │  (To university)│           │  (Paused/follow-up)
    └────────┬────────┘           └─────────────────┘
             │
             ▼
    ┌─────────────────┐
    │   UNDER_REVIEW  │
    │ (Uni reviewing) │
    └────────┬────────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌──────────┐    ┌─────────────────┐
│ REJECTED │    │ INTERVIEW_      │
│(Terminal)│    │   SCHEDULED     │
└──────────┘    └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ INTERVIEW_      │
                │   COMPLETED     │
                └────────┬────────┘
                         │
                         ▼
                ┌─────────────────┐
                │  OFFER_RECEIVED │
                └────────┬────────┘
                         │
            ┌────────────┴────────────┐
            │                         │
            ▼                         ▼
   ┌─────────────────┐      ┌─────────────────┐
   │   OFFER_ACCEPTED│      │  OFFER_DECLINED │
   └────────┬────────┘      │    (Terminal)   │
            │               └─────────────────┘
            ▼
   ┌─────────────────┐
   │     ENROLLED    │
   │    (Terminal)   │
   └─────────────────┘
            ▲
            │
   ┌────────┴────────┐
   │    WITHDRAWN    │
   │    (Terminal)   │
   └─────────────────┘
```

**Valid Transitions:**
| From | To | Condition |
|------|-----|-----------|
| draft | documents_pending | Student created, no docs |
| documents_pending | ready_to_submit | All required docs uploaded |
| ready_to_submit | submitted | User clicks "Submit" |
| ready_to_submit | on_hold | User pauses application |
| on_hold | ready_to_submit | User resumes |
| submitted | under_review | University acknowledges |
| under_review | interview_scheduled | Interview requested |
| interview_scheduled | interview_completed | Interview done |
| interview_completed | offer_received | Offer made |
| under_review | offer_received | Direct offer (no interview) |
| under_review | rejected | University declines |
| offer_received | offer_accepted | Student accepts |
| offer_received | offer_declined | Student declines |
| offer_accepted | enrolled | Student enrolls |
| any non-terminal | withdrawn | Student withdraws |

### 4.2 Student Status State Machine

```
                    ┌─────────────────┐
                    │      LEAD       │
                    │   (Initial)     │
                    └────────┬────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
              ▼              │              ▼
    ┌─────────────────┐      │    ┌─────────────────┐
    │     ACTIVE      │◄─────┘    │    INACTIVE     │
    │ (Has application)│          │ (No activity)   │
    └────────┬────────┘           └─────────────────┘
             │
             │ Application enrolled
             ▼
    ┌─────────────────┐
    │    ENROLLED     │
    │    (Terminal)   │
    └─────────────────┘
             ▲
             │
    ┌────────┴────────┐
    │    ARCHIVED     │
    │ (Soft deleted)  │
    └─────────────────┘
```

### 4.3 Document Status State Machine

```
                    ┌─────────────────┐
                    │    UPLOADED     │
                    │   (Initial)     │
                    └────────┬────────┘
                             │
                             │ Review started
                             ▼
                    ┌─────────────────┐
                    │   UNDER_REVIEW  │
                    └────────┬────────┘
                             │
            ┌────────────────┼────────────────┐
            │                │                │
            ▼                ▼                ▼
   ┌─────────────────┐ ┌──────────┐ ┌─────────────────┐
   │    APPROVED     │ │ REJECTED │ │    EXPIRED      │
   │    (Valid)      │ │ (Invalid)│ │ (Past expiry)   │
   └─────────────────┘ └──────────┘ └─────────────────┘
```

---

## 5. Build Phases

### Phase 0: Project Setup (Week 1)
**Goal:** Initialize project with all dependencies and configurations

#### 0.1 Initialize Next.js Project
```bash
npx create-next-app@latest freelancer-crm --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
cd freelancer-crm
```

#### 0.2 Install Core Dependencies
```bash
# UI Components
npx shadcn@latest init --yes --template next --base-color slate
npx shadcn@latest add button card input label select textarea badge dialog dropdown-menu table tabs toast avatar separator scroll-area sheet skeleton

# State Management & Forms
npm install zustand react-hook-form @hookform/resolvers zod

# Database & Auth
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs

# Cloudinary
npm install cloudinary next-cloudinary

# Tables & Utilities
npm install @tanstack/react-table date-fns lucide-react clsx tailwind-merge

# Development
npm install -D @types/node @types/react @types/react-dom typescript
```

#### 0.3 Environment Configuration
Create `.env.local`:
```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=freelancer-crm

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

#### 0.4 Project Structure Setup
```
D:\freelancer.lango\
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx (dashboard)
│   │   │   ├── students/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── applications/
│   │   │   │   └── page.tsx
│   │   │   └── universities/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── students/
│   │   │   │   └── route.ts
│   │   │   ├── applications/
│   │   │   │   └── route.ts
│   │   │   ├── documents/
│   │   │   │   └── route.ts
│   │   │   └── upload/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/ (shadcn components)
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── students/
│   │   │   ├── student-list.tsx
│   │   │   ├── student-card.tsx
│   │   │   ├── student-filters.tsx
│   │   │   └── student-wizard/
│   │   │       ├── wizard-container.tsx
│   │   │       ├── step-personal.tsx
│   │   │       ├── step-academic.tsx
│   │   │       ├── step-documents.tsx
│   │   │       ├── step-review.tsx
│   │   │       └── wizard-progress.tsx
│   │   ├── applications/
│   │   │   ├── application-list.tsx
│   │   │   ├── status-badge.tsx
│   │   │   └── status-update-dialog.tsx
│   │   ├── documents/
│   │   │   ├── document-uploader.tsx
│   │   │   ├── document-list.tsx
│   │   │   └── document-preview.tsx
│   │   └── shared/
│   │       ├── data-table.tsx
│   │       ├── search-input.tsx
│   │       ├── pagination.tsx
│   │       └── confirm-dialog.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── admin.ts
│   │   ├── cloudinary/
│   │   │   └── client.ts
│   │   ├── validations/
│   │   │   ├── student.schema.ts
│   │   │   ├── application.schema.ts
│   │   │   └── document.schema.ts
│   │   ├── constants/
│   │   │   ├── status.ts
│   │   │   └── document-types.ts
│   │   └── utils/
│   │       ├── formatters.ts
│   │       └── helpers.ts
│   ├── hooks/
│   │   ├── use-students.ts
│   │   ├── use-applications.ts
│   │   ├── use-documents.ts
│   │   └── use-auth.ts
│   ├── stores/
│   │   ├── student-wizard-store.ts
│   │   ├── student-store.ts
│   │   └── ui-store.ts
│   ├── services/
│   │   ├── student.service.ts
│   │   ├── application.service.ts
│   │   ├── document.service.ts
│   │   └── university.service.ts
│   ├── types/
│   │   ├── database.ts
│   │   ├── student.ts
│   │   ├── application.ts
│   │   └── index.ts
│   └── middleware.ts
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_functions_triggers.sql
│   │   ├── 003_rls_policies.sql
│   │   └── 004_seed_data.sql
│   └── seed.sql
├── public/
│   └── (static assets)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

**Verification:**
- [ ] `npm run dev` starts without errors
- [ ] shadcn components render correctly
- [ ] Environment variables load
- [ ] TypeScript compiles without errors

---

### Phase 1: Foundation (Week 1-2)
**Goal:** Types, validations, and state machine definitions

#### 1.1 Database Types
**File:** `src/types/database.ts`
```typescript
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          full_name: string
          role: 'super_admin' | 'admin' | 'manager' | 'freelancer'
          phone: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          full_name: string
          role?: 'super_admin' | 'admin' | 'manager' | 'freelancer'
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string
          role?: 'super_admin' | 'admin' | 'manager' | 'freelancer'
          phone?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      students: {
        Row: {
          id: string
          freelancer_id: string
          full_name: string
          email: string | null
          phone: string
          date_of_birth: string | null
          nationality: string | null
          address: string | null
          city: string | null
          country: string | null
          passport_number: string | null
          status: 'lead' | 'active' | 'inactive' | 'enrolled' | 'archived'
          profile_complete: number
          notes: string | null
          created_at: string
          updated_at: string
          deleted_at: string | null
        }
        Insert: {
          id?: string
          freelancer_id: string
          full_name: string
          email?: string | null
          phone: string
          date_of_birth?: string | null
          nationality?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          passport_number?: string | null
          status?: 'lead' | 'active' | 'inactive' | 'enrolled' | 'archived'
          profile_complete?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
        Update: {
          id?: string
          freelancer_id?: string
          full_name?: string
          email?: string | null
          phone?: string
          date_of_birth?: string | null
          nationality?: string | null
          address?: string | null
          city?: string | null
          country?: string | null
          passport_number?: string | null
          status?: 'lead' | 'active' | 'inactive' | 'enrolled' | 'archived'
          profile_complete?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
          deleted_at?: string | null
        }
      }
      applications: {
        Row: {
          id: string
          student_id: string
          university_id: string
          program_id: string
          intake_date: string
          status: ApplicationStatus
          application_fee_paid: boolean
          application_fee_amount: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          student_id: string
          university_id: string
          program_id: string
          intake_date: string
          status?: ApplicationStatus
          application_fee_paid?: boolean
          application_fee_amount?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          student_id?: string
          university_id?: string
          program_id?: string
          intake_date?: string
          status?: ApplicationStatus
          application_fee_paid?: boolean
          application_fee_amount?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

export type ApplicationStatus = 
  | 'draft'
  | 'documents_pending'
  | 'ready_to_submit'
  | 'submitted'
  | 'under_review'
  | 'interview_scheduled'
  | 'interview_completed'
  | 'offer_received'
  | 'offer_accepted'
  | 'offer_declined'
  | 'enrolled'
  | 'rejected'
  | 'withdrawn'
  | 'on_hold'

export type StudentStatus = 'lead' | 'active' | 'inactive' | 'enrolled' | 'archived'
export type DocumentStatus = 'uploaded' | 'under_review' | 'approved' | 'rejected' | 'expired'
export type DocumentType = 'passport' | 'transcript' | 'diploma' | 'cv' | 'recommendation_letter' | 'personal_statement' | 'language_test' | 'other'
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'freelancer'
export type DegreeType = 'bachelor' | 'master' | 'phd' | 'diploma' | 'certificate'
```

#### 1.2 Validation Schemas
**File:** `src/lib/validations/student.schema.ts`
```typescript
import { z } from 'zod'

export const personalInfoSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().min(10, 'Phone must be at least 10 characters'),
  date_of_birth: z.string().optional().or(z.literal('')),
  nationality: z.string().optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  city: z.string().optional().or(z.literal('')),
  country: z.string().optional().or(z.literal('')),
  passport_number: z.string().optional().or(z.literal('')),
  notes: z.string().optional().or(z.literal('')),
})

export const academicInfoSchema = z.object({
  previous_institution: z.string().optional().or(z.literal('')),
  previous_degree: z.string().optional().or(z.literal('')),
  gpa: z.string().optional().or(z.literal('')),
  graduation_year: z.string().optional().or(z.literal('')),
  target_degree: z.enum(['bachelor', 'master', 'phd', 'diploma', 'certificate']).optional(),
  target_field: z.string().optional().or(z.literal('')),
  language_proficiency: z.string().optional().or(z.literal('')),
  language_score: z.string().optional().or(z.literal('')),
})

export const studentWizardSchema = z.object({
  personal: personalInfoSchema,
  academic: academicInfoSchema,
  documents: z.array(z.object({
    doc_type: z.enum(['passport', 'transcript', 'diploma', 'cv', 'recommendation_letter', 'personal_statement', 'language_test', 'other']),
    file: z.instanceof(File).optional(),
    existing_document_id: z.string().optional(),
  })).optional(),
  application: z.object({
    university_id: z.string().uuid('Please select a university'),
    program_id: z.string().uuid('Please select a program'),
    intake_date: z.string().min(1, 'Please select an intake date'),
  }).optional(),
})

export type PersonalInfoInput = z.infer<typeof personalInfoSchema>
export type AcademicInfoInput = z.infer<typeof academicInfoSchema>
export type StudentWizardInput = z.infer<typeof studentWizardSchema>
```

**File:** `src/lib/validations/application.schema.ts`
```typescript
import { z } from 'zod'
import { applicationStatuses } from '@/lib/constants/status'

export const createApplicationSchema = z.object({
  student_id: z.string().uuid(),
  university_id: z.string().uuid(),
  program_id: z.string().uuid(),
  intake_date: z.string().min(1, 'Intake date is required'),
  notes: z.string().optional(),
})

export const updateApplicationStatusSchema = z.object({
  status: z.enum(applicationStatuses),
  reason: z.string().optional(),
})

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>
export type UpdateApplicationStatusInput = z.infer<typeof updateApplicationStatusSchema>
```

**File:** `src/lib/validations/document.schema.ts`
```typescript
import { z } from 'zod'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB
const ACCEPTED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/jpg',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

export const documentUploadSchema = z.object({
  doc_type: z.enum(['passport', 'transcript', 'diploma', 'cv', 'recommendation_letter', 'personal_statement', 'language_test', 'other']),
  file: z
    .instanceof(File)
    .refine((file) => file.size <= MAX_FILE_SIZE, `File size must be less than 10MB`)
    .refine(
      (file) => ACCEPTED_FILE_TYPES.includes(file.type),
      'Only PDF, Word, and image files are accepted'
    ),
  expiry_date: z.string().optional(),
})

export type DocumentUploadInput = z.infer<typeof documentUploadSchema>
```

#### 1.3 Constants
**File:** `src/lib/constants/status.ts`
```typescript
export const applicationStatuses = [
  'draft',
  'documents_pending',
  'ready_to_submit',
  'submitted',
  'under_review',
  'interview_scheduled',
  'interview_completed',
  'offer_received',
  'offer_accepted',
  'offer_declined',
  'enrolled',
  'rejected',
  'withdrawn',
  'on_hold',
] as const

export const studentStatuses = ['lead', 'active', 'inactive', 'enrolled', 'archived'] as const
export const documentStatuses = ['uploaded', 'under_review', 'approved', 'rejected', 'expired'] as const
export const documentTypes = [
  'passport',
  'transcript',
  'diploma',
  'cv',
  'recommendation_letter',
  'personal_statement',
  'language_test',
  'other',
] as const

export const applicationStatusLabels: Record<string, string> = {
  draft: 'Draft',
  documents_pending: 'Documents Pending',
  ready_to_submit: 'Ready to Submit',
  submitted: 'Submitted',
  under_review: 'Under Review',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  offer_received: 'Offer Received',
  offer_accepted: 'Offer Accepted',
  offer_declined: 'Offer Declined',
  enrolled: 'Enrolled',
  rejected: 'Rejected',
  withdrawn: 'Withdrawn',
  on_hold: 'On Hold',
}

export const studentStatusLabels: Record<string, string> = {
  lead: 'Lead',
  active: 'Active',
  inactive: 'Inactive',
  enrolled: 'Enrolled',
  archived: 'Archived',
}

export const documentStatusLabels: Record<string, string> = {
  uploaded: 'Uploaded',
  under_review: 'Under Review',
  approved: 'Approved',
  rejected: 'Rejected',
  expired: 'Expired',
}

export const documentTypeLabels: Record<string, string> = {
  passport: 'Passport',
  transcript: 'Academic Transcript',
  diploma: 'Diploma/Certificate',
  cv: 'CV/Resume',
  recommendation_letter: 'Recommendation Letter',
  personal_statement: 'Personal Statement',
  language_test: 'Language Test Score',
  other: 'Other Document',
}

export const statusColors: Record<string, string> = {
  draft: 'bg-gray-100 text-gray-800',
  documents_pending: 'bg-yellow-100 text-yellow-800',
  ready_to_submit: 'bg-blue-100 text-blue-800',
  submitted: 'bg-purple-100 text-purple-800',
  under_review: 'bg-indigo-100 text-indigo-800',
  interview_scheduled: 'bg-pink-100 text-pink-800',
  interview_completed: 'bg-rose-100 text-rose-800',
  offer_received: 'bg-green-100 text-green-800',
  offer_accepted: 'bg-emerald-100 text-emerald-800',
  offer_declined: 'bg-red-100 text-red-800',
  enrolled: 'bg-teal-100 text-teal-800',
  rejected: 'bg-red-100 text-red-800',
  withdrawn: 'bg-gray-100 text-gray-800',
  on_hold: 'bg-orange-100 text-orange-800',
  lead: 'bg-gray-100 text-gray-800',
  active: 'bg-blue-100 text-blue-800',
  inactive: 'bg-gray-100 text-gray-800',
  archived: 'bg-gray-100 text-gray-800',
  uploaded: 'bg-blue-100 text-blue-800',
  approved: 'bg-green-100 text-green-800',
}
```

#### 1.4 State Machine Logic
**File:** `src/lib/utils/state-machine.ts`
```typescript
import { ApplicationStatus, StudentStatus, DocumentStatus } from '@/types/database'

type StatusTransition = {
  from: string
  to: string
  condition?: string
}

const applicationTransitions: StatusTransition[] = [
  { from: 'draft', to: 'documents_pending', condition: 'Student created, no documents' },
  { from: 'documents_pending', to: 'ready_to_submit', condition: 'All required documents uploaded' },
  { from: 'ready_to_submit', to: 'submitted', condition: 'User submits application' },
  { from: 'ready_to_submit', to: 'on_hold', condition: 'User pauses application' },
  { from: 'on_hold', to: 'ready_to_submit', condition: 'User resumes application' },
  { from: 'submitted', to: 'under_review', condition: 'University acknowledges receipt' },
  { from: 'under_review', to: 'interview_scheduled', condition: 'Interview requested' },
  { from: 'under_review', to: 'offer_received', condition: 'Direct offer made' },
  { from: 'under_review', to: 'rejected', condition: 'University declines' },
  { from: 'interview_scheduled', to: 'interview_completed', condition: 'Interview completed' },
  { from: 'interview_completed', to: 'offer_received', condition: 'Offer made after interview' },
  { from: 'offer_received', to: 'offer_accepted', condition: 'Student accepts offer' },
  { from: 'offer_received', to: 'offer_declined', condition: 'Student declines offer' },
  { from: 'offer_accepted', to: 'enrolled', condition: 'Student enrolls' },
  { from: 'draft', to: 'withdrawn', condition: 'Student withdraws' },
  { from: 'documents_pending', to: 'withdrawn', condition: 'Student withdraws' },
  { from: 'ready_to_submit', to: 'withdrawn', condition: 'Student withdraws' },
  { from: 'submitted', to: 'withdrawn', condition: 'Student withdraws' },
  { from: 'under_review', to: 'withdrawn', condition: 'Student withdraws' },
  { from: 'interview_scheduled', to: 'withdrawn', condition: 'Student withdraws' },
  { from: 'interview_completed', to: 'withdrawn', condition: 'Student withdraws' },
  { from: 'offer_received', to: 'withdrawn', condition: 'Student withdraws' },
  { from: 'on_hold', to: 'withdrawn', condition: 'Student withdraws' },
]

const terminalStatuses = ['enrolled', 'offer_declined', 'rejected', 'withdrawn']

export function isValidStatusTransition(
  currentStatus: ApplicationStatus,
  newStatus: ApplicationStatus
): boolean {
  // Cannot transition from terminal states
  if (terminalStatuses.includes(currentStatus)) {
    return false
  }
  
  return applicationTransitions.some(
    (t) => t.from === currentStatus && t.to === newStatus
  )
}

export function getValidNextStatuses(currentStatus: ApplicationStatus): ApplicationStatus[] {
  if (terminalStatuses.includes(currentStatus)) {
    return []
  }
  
  return applicationTransitions
    .filter((t) => t.from === currentStatus)
    .map((t) => t.to as ApplicationStatus)
}

export function isTerminalStatus(status: ApplicationStatus): boolean {
  return terminalStatuses.includes(status)
}

export function getStatusTransitionReason(
  from: ApplicationStatus,
  to: ApplicationStatus
): string | undefined {
  return applicationTransitions.find(
    (t) => t.from === from && t.to === to
  )?.condition
}
```

**Verification:**
- [ ] All TypeScript types compile
- [ ] Zod schemas validate correctly
- [ ] State machine transitions work as expected
- [ ] Constants are properly typed

---

### Phase 2: Service Layer + API Routes (Week 2-3)
**Goal:** Database operations and REST API endpoints

#### 2.1 Supabase Clients
**File:** `src/lib/supabase/client.ts`
```typescript
import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

**File:** `src/lib/supabase/server.ts`
```typescript
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/database'

export function createClient() {
  const cookieStore = cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // Handle middleware context
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // Handle middleware context
          }
        },
      },
    }
  )
}
```

**File:** `src/lib/supabase/admin.ts`
```typescript
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export const supabaseAdmin = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
)
```

#### 2.2 Student Service
**File:** `src/services/student.service.ts`
```typescript
import { createClient } from '@/lib/supabase/client'
import { Database } from '@/types/database'

type Student = Database['public']['Tables']['students']['Row']
type StudentInsert = Database['public']['Tables']['students']['Insert']
type StudentUpdate = Database['public']['Tables']['students']['Update']

export class StudentService {
  private supabase = createClient()

  async getStudents(options?: {
    status?: string
    search?: string
    page?: number
    limit?: number
  }): Promise<{ data: Student[]; count: number }> {
    const { status, search, page = 1, limit = 20 } = options || {}
    
    let query = this.supabase
      .from('students')
      .select('*', { count: 'exact' })
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error
    return { data: data || [], count: count || 0 }
  }

  async getStudentById(id: string): Promise<Student | null> {
    const { data, error } = await this.supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .is('deleted_at', null)
      .single()

    if (error) throw error
    return data
  }

  async createStudent(student: StudentInsert): Promise<Student> {
    // Check for duplicate phone
    const { data: existing } = await this.supabase
      .from('students')
      .select('id')
      .eq('phone', student.phone)
      .is('deleted_at', null)
      .single()

    if (existing) {
      throw new Error('A student with this phone number already exists')
    }

    const { data, error } = await this.supabase
      .from('students')
      .insert(student)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateStudent(id: string, updates: StudentUpdate): Promise<Student> {
    const { data, error } = await this.supabase
      .from('students')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async softDeleteStudent(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('students')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', id)

    if (error) throw error
  }

  async checkDuplicatePhone(phone: string, excludeId?: string): Promise<boolean> {
    let query = this.supabase
      .from('students')
      .select('id')
      .eq('phone', phone)
      .is('deleted_at', null)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data } = await query.single()
    return !!data
  }
}

export const studentService = new StudentService()
```

#### 2.3 Application Service
**File:** `src/services/application.service.ts`
```typescript
import { createClient } from '@/lib/supabase/client'
import { Database, ApplicationStatus } from '@/types/database'
import { isValidStatusTransition } from '@/lib/utils/state-machine'

type Application = Database['public']['Tables']['applications']['Row']
type ApplicationInsert = Database['public']['Tables']['applications']['Insert']

export class ApplicationService {
  private supabase = createClient()

  async getApplications(options?: {
    studentId?: string
    status?: string
    page?: number
    limit?: number
  }): Promise<{ data: Application[]; count: number }> {
    const { studentId, status, page = 1, limit = 20 } = options || {}
    
    let query = this.supabase
      .from('applications')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    if (studentId) {
      query = query.eq('student_id', studentId)
    }

    if (status) {
      query = query.eq('status', status)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error
    return { data: data || [], count: count || 0 }
  }

  async getApplicationById(id: string): Promise<Application | null> {
    const { data, error } = await this.supabase
      .from('applications')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createApplication(application: ApplicationInsert): Promise<Application> {
    // Check for duplicate application (same program + intake)
    const { data: existing } = await this.supabase
      .from('applications')
      .select('id')
      .eq('student_id', application.student_id)
      .eq('program_id', application.program_id)
      .eq('intake_date', application.intake_date)
      .single()

    if (existing) {
      throw new Error('An application for this program and intake already exists')
    }

    const { data, error } = await this.supabase
      .from('applications')
      .insert(application)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateStatus(
    id: string,
    newStatus: ApplicationStatus,
    reason?: string
  ): Promise<Application> {
    // Get current application
    const { data: current } = await this.supabase
      .from('applications')
      .select('status')
      .eq('id', id)
      .single()

    if (!current) {
      throw new Error('Application not found')
    }

    // Validate transition
    if (!isValidStatusTransition(current.status as ApplicationStatus, newStatus)) {
      throw new Error(`Invalid status transition from ${current.status} to ${newStatus}`)
    }

    const { data, error } = await this.supabase
      .from('applications')
      .update({ status: newStatus })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async checkDuplicateApplication(
    studentId: string,
    programId: string,
    intakeDate: string
  ): Promise<boolean> {
    const { data } = await this.supabase
      .from('applications')
      .select('id')
      .eq('student_id', studentId)
      .eq('program_id', programId)
      .eq('intake_date', intakeDate)
      .single()

    return !!data
  }
}

export const applicationService = new ApplicationService()
```

#### 2.4 Document Service
**File:** `src/services/document.service.ts`
```typescript
import { createClient } from '@/lib/supabase/client'
import { Database, DocumentStatus } from '@/types/database'

type StudentDocument = Database['public']['Tables']['student_documents']['Row']
type StudentDocumentInsert = Database['public']['Tables']['student_documents']['Insert']

export class DocumentService {
  private supabase = createClient()

  async getDocumentsByStudent(studentId: string): Promise<StudentDocument[]> {
    const { data, error } = await this.supabase
      .from('student_documents')
      .select('*')
      .eq('student_id', studentId)
      .eq('is_latest', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  }

  async getDocumentById(id: string): Promise<StudentDocument | null> {
    const { data, error } = await this.supabase
      .from('student_documents')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  }

  async createDocument(document: StudentDocumentInsert): Promise<StudentDocument> {
    // If there's an existing latest document of same type, mark it as not latest
    if (document.is_latest) {
      await this.supabase
        .from('student_documents')
        .update({ is_latest: false })
        .eq('student_id', document.student_id)
        .eq('doc_type', document.doc_type)
        .eq('is_latest', true)
    }

    const { data, error } = await this.supabase
      .from('student_documents')
      .insert(document)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async updateDocumentStatus(
    id: string,
    status: DocumentStatus,
    rejectionReason?: string
  ): Promise<StudentDocument> {
    const updates: Partial<StudentDocument> = { status }
    if (rejectionReason) {
      updates.rejection_reason = rejectionReason
    }

    const { data, error } = await this.supabase
      .from('student_documents')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return data
  }

  async getDocumentsByType(studentId: string, docType: string): Promise<StudentDocument[]> {
    const { data, error } = await this.supabase
      .from('student_documents')
      .select('*')
      .eq('student_id', studentId)
      .eq('doc_type', docType)
      .order('version', { ascending: false })

    if (error) throw error
    return data || []
  }
}

export const documentService = new DocumentService()
```

#### 2.5 Cloudinary Service
**File:** `src/lib/cloudinary/client.ts`
```typescript
import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export function generateFolderPath(
  freelancerId: string,
  studentId: string,
  docType: string
): string {
  const timestamp = Date.now()
  return `${process.env.CLOUDINARY_FOLDER}/${freelancerId}/${studentId}/${docType}/${timestamp}`
}

export async function generateUploadSignature(
  folder: string,
  publicId: string
): Promise<{ signature: string; timestamp: number }> {
  const timestamp = Math.round(new Date().getTime() / 1000)
  
  const signature = cloudinary.utils.api_sign_request(
    {
      folder,
      public_id: publicId,
      timestamp,
    },
    process.env.CLOUDINARY_API_SECRET!
  )

  return { signature, timestamp }
}

export async function deleteDocument(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}

export function generateSignedUrl(publicId: string, expiresInSeconds: number = 3600): string {
  return cloudinary.url(publicId, {
    sign_url: true,
    secure: true,
    expires_at: Math.floor(Date.now() / 1000) + expiresInSeconds,
  })
}
```

#### 2.6 API Routes
**File:** `src/app/api/students/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { personalInfoSchema } from '@/lib/validations/student.schema'

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    let query = supabase
      .from('students')
      .select('*', { count: 'exact' })
      .eq('freelancer_id', user.id)
      .is('deleted_at', null)
      .order('created_at', { ascending: false })

    if (status) {
      query = query.eq('status', status)
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,phone.ilike.%${search}%`)
    }

    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    return NextResponse.json({
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error('Error fetching students:', error)
    return NextResponse.json(
      { error: 'Failed to fetch students' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()

    // Validate input
    const result = personalInfoSchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: result.error.flatten() },
        { status: 400 }
      )
    }

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check for duplicate phone
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('phone', result.data.phone)
      .is('deleted_at', null)
      .single()

    if (existing) {
      return NextResponse.json(
        { error: 'A student with this phone number already exists' },
        { status: 409 }
      )
    }

    // Create student
    const { data, error } = await supabase
      .from('students')
      .insert({
        ...result.data,
        freelancer_id: user.id,
        status: 'lead',
      })
      .select()
      .single()

    if (error) throw error

    return NextResponse.json(data, { status: 201 })
  } catch (error) {
    console.error('Error creating student:', error)
    return NextResponse.json(
      { error: 'Failed to create student' },
      { status: 500 }
    )
  }
}
```

**File:** `src/app/api/upload/signature/route.ts`
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { generateUploadSignature, generateFolderPath } from '@/lib/cloudinary/client'

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient()
    const body = await request.json()
    const { studentId, docType, fileName } = body

    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Generate folder path
    const folder = generateFolderPath(user.id, studentId, docType)
    const publicId = `${folder}/${fileName}`

    // Generate signature
    const { signature, timestamp } = await generateUploadSignature(folder, publicId)

    return NextResponse.json({
      signature,
      timestamp,
      folder,
      publicId,
      cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY,
    })
  } catch (error) {
    console.error('Error generating upload signature:', error)
    return NextResponse.json(
      { error: 'Failed to generate upload signature' },
      { status: 500 }
    )
  }
}
```

**Verification:**
- [ ] All API routes return correct status codes
- [ ] RLS policies enforced
- [ ] Input validation works
- [ ] Error handling covers edge cases

---

### Phase 3: Hooks + Zustand Stores (Week 3)
**Goal:** React hooks for data fetching and state management

#### 3.1 Student Store
**File:** `src/stores/student-store.ts`
```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { Student } from '@/types/database'
import { studentService } from '@/services/student.service'

interface StudentState {
  students: Student[]
  selectedStudent: Student | null
  isLoading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
  filters: {
    status: string | null
    search: string
  }
  
  // Actions
  fetchStudents: (options?: { page?: number; status?: string; search?: string }) => Promise<void>
  getStudentById: (id: string) => Promise<void>
  createStudent: (student: Partial<Student>) => Promise<Student>
  updateStudent: (id: string, updates: Partial<Student>) => Promise<void>
  deleteStudent: (id: string) => Promise<void>
  setFilters: (filters: Partial<StudentState['filters']>) => void
  clearError: () => void
}

export const useStudentStore = create<StudentState>()(
  devtools(
    (set, get) => ({
      students: [],
      selectedStudent: null,
      isLoading: false,
      error: null,
      pagination: {
        page: 1,
        limit: 20,
        total: 0,
        totalPages: 0,
      },
      filters: {
        status: null,
        search: '',
      },

      fetchStudents: async (options = {}) => {
        set({ isLoading: true, error: null })
        try {
          const { page = 1, status, search } = options
          const { data, count } = await studentService.getStudents({
            page,
            status: status || get().filters.status || undefined,
            search: search || get().filters.search || undefined,
            limit: get().pagination.limit,
          })

          set({
            students: data,
            pagination: {
              ...get().pagination,
              page,
              total: count,
              totalPages: Math.ceil(count / get().pagination.limit),
            },
            isLoading: false,
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch students',
            isLoading: false,
          })
        }
      },

      getStudentById: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          const student = await studentService.getStudentById(id)
          set({ selectedStudent: student, isLoading: false })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to fetch student',
            isLoading: false,
          })
        }
      },

      createStudent: async (student: Partial<Student>) => {
        set({ isLoading: true, error: null })
        try {
          const newStudent = await studentService.createStudent(student as any)
          set((state) => ({
            students: [newStudent, ...state.students],
            isLoading: false,
          }))
          return newStudent
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to create student',
            isLoading: false,
          })
          throw error
        }
      },

      updateStudent: async (id: string, updates: Partial<Student>) => {
        set({ isLoading: true, error: null })
        try {
          const updated = await studentService.updateStudent(id, updates)
          set((state) => ({
            students: state.students.map((s) => (s.id === id ? updated : s)),
            selectedStudent: state.selectedStudent?.id === id ? updated : state.selectedStudent,
            isLoading: false,
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to update student',
            isLoading: false,
          })
          throw error
        }
      },

      deleteStudent: async (id: string) => {
        set({ isLoading: true, error: null })
        try {
          await studentService.softDeleteStudent(id)
          set((state) => ({
            students: state.students.filter((s) => s.id !== id),
            isLoading: false,
          }))
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : 'Failed to delete student',
            isLoading: false,
          })
          throw error
        }
      },

      setFilters: (filters) => {
        set((state) => ({
          filters: { ...state.filters, ...filters },
        }))
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'student-store' }
  )
)
```

#### 3.2 Student Wizard Store (with Persistence)
**File:** `src/stores/student-wizard-store.ts`
```typescript
import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { PersonalInfoInput, AcademicInfoInput } from '@/lib/validations/student.schema'

export type WizardStep = 'personal' | 'academic' | 'documents' | 'review'

interface DocumentUpload {
  doc_type: string
  file?: File
  existing_document_id?: string
}

interface ApplicationInfo {
  university_id: string
  program_id: string
  intake_date: string
}

interface StudentWizardState {
  // Current step
  currentStep: WizardStep
  completedSteps: WizardStep[]
  
  // Form data
  personalInfo: Partial<PersonalInfoInput>
  academicInfo: Partial<AcademicInfoInput>
  documents: DocumentUpload[]
  applicationInfo: Partial<ApplicationInfo>
  
  // UI state
  isSubmitting: boolean
  error: string | null
  
  // Actions
  setStep: (step: WizardStep) => void
  markStepComplete: (step: WizardStep) => void
  setPersonalInfo: (data: Partial<PersonalInfoInput>) => void
  setAcademicInfo: (data: Partial<AcademicInfoInput>) => void
  addDocument: (doc: DocumentUpload) => void
  removeDocument: (index: number) => void
  setApplicationInfo: (data: Partial<ApplicationInfo>) => void
  setSubmitting: (isSubmitting: boolean) => void
  setError: (error: string | null) => void
  reset: () => void
  canProceedToStep: (step: WizardStep) => boolean
}

const initialState = {
  currentStep: 'personal' as WizardStep,
  completedSteps: [],
  personalInfo: {},
  academicInfo: {},
  documents: [],
  applicationInfo: {},
  isSubmitting: false,
  error: null,
}

export const useStudentWizardStore = create<StudentWizardState>()(
  devtools(
    persist(
      (set, get) => ({
        ...initialState,

        setStep: (step) => set({ currentStep: step }),

        markStepComplete: (step) =>
          set((state) => ({
            completedSteps: [...new Set([...state.completedSteps, step])],
          })),

        setPersonalInfo: (data) =>
          set((state) => ({
            personalInfo: { ...state.personalInfo, ...data },
          })),

        setAcademicInfo: (data) =>
          set((state) => ({
            academicInfo: { ...state.academicInfo, ...data },
          })),

        addDocument: (doc) =>
          set((state) => ({
            documents: [...state.documents, doc],
          })),

        removeDocument: (index) =>
          set((state) => ({
            documents: state.documents.filter((_, i) => i !== index),
          })),

        setApplicationInfo: (data) =>
          set((state) => ({
            applicationInfo: { ...state.applicationInfo, ...data },
          })),

        setSubmitting: (isSubmitting) => set({ isSubmitting }),

        setError: (error) => set({ error }),

        reset: () => set(initialState),

        canProceedToStep: (step) => {
          const { completedSteps, personalInfo, academicInfo } = get()
          
          switch (step) {
            case 'personal':
              return true
            case 'academic':
              return completedSteps.includes('personal') || 
                (personalInfo.full_name && personalInfo.phone)
            case 'documents':
              return completedSteps.includes('academic') ||
                (completedSteps.includes('personal') && academicInfo.target_degree)
            case 'review':
              return completedSteps.includes('documents')
            default:
              return false
          }
        },
      }),
      {
        name: 'student-wizard-storage',
        partialize: (state) => ({
          currentStep: state.currentStep,
          completedSteps: state.completedSteps,
          personalInfo: state.personalInfo,
          academicInfo: state.academicInfo,
          documents: state.documents,
          applicationInfo: state.applicationInfo,
        }),
      }
    ),
    { name: 'student-wizard-store' }
  )
)
```

#### 3.3 Custom Hooks
**File:** `src/hooks/use-students.ts`
```typescript
import { useEffect } from 'react'
import { useStudentStore } from '@/stores/student-store'

export function useStudents(options?: { 
  page?: number
  status?: string
  search?: string
  autoFetch?: boolean 
}) {
  const { 
    students, 
    isLoading, 
    error, 
    pagination, 
    filters,
    fetchStudents,
    setFilters,
    clearError 
  } = useStudentStore()

  useEffect(() => {
    if (options?.autoFetch !== false) {
      fetchStudents(options)
    }
  }, [options?.page, options?.status, options?.search])

  return {
    students,
    isLoading,
    error,
    pagination,
    filters,
    refetch: () => fetchStudents(options),
    setFilters,
    clearError,
  }
}
```

**File:** `src/hooks/use-student.ts`
```typescript
import { useEffect } from 'react'
import { useStudentStore } from '@/stores/student-store'

export function useStudent(id: string | null) {
  const { 
    selectedStudent, 
    isLoading, 
    error, 
    getStudentById,
    updateStudent,
    deleteStudent,
    clearError 
  } = useStudentStore()

  useEffect(() => {
    if (id) {
      getStudentById(id)
    }
  }, [id])

  return {
    student: selectedStudent,
    isLoading,
    error,
    updateStudent,
    deleteStudent,
    clearError,
    refetch: () => id && getStudentById(id),
  }
}
```

**Verification:**
- [ ] Stores persist data correctly
- [ ] Hooks handle loading/error states
- [ ] Wizard state survives page refresh
- [ ] No unnecessary re-renders

---

### Phase 4: Layout + Shared Components (Week 3-4)
**Goal:** Application shell and reusable UI components

#### 4.1 Dashboard Layout
**File:** `src/app/(dashboard)/layout.tsx`
```typescript
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header user={user} />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

#### 4.2 Sidebar
**File:** `src/components/layout/sidebar.tsx`
```typescript
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  GraduationCap, 
  Settings,
  LogOut
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { createClient } from '@/lib/supabase/client'

interface SidebarProps {
  user: User
}

const navigation = [
  { name: 'Dashboard', href: '/', icon: LayoutDashboard },
  { name: 'Students', href: '/students', icon: Users },
  { name: 'Applications', href: '/applications', icon: FileText },
  { name: 'Universities', href: '/universities', icon: GraduationCap },
  { name: 'Settings', href: '/settings', icon: Settings },
]

export function Sidebar({ user }: SidebarProps) {
  const pathname = usePathname()
  const supabase = createClient()

  const handleLogout = async () => {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  return (
    <div className="flex flex-col w-64 bg-white border-r border-gray-200">
      <div className="flex items-center h-16 px-6 border-b border-gray-200">
        <Link href="/" className="text-xl font-bold text-gray-900">
          Freelancer CRM
        </Link>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center px-4 py-2 text-sm font-medium rounded-md transition-colors',
                isActive
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="w-5 h-5 mr-3" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full bg-gray-300 flex items-center justify-center text-sm font-medium text-gray-700">
            {user.email?.charAt(0).toUpperCase()}
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-gray-900">{user.email}</p>
          </div>
        </div>
        <Button
          variant="outline"
          className="w-full"
          onClick={handleLogout}
        >
          <LogOut className="w-4 h-4 mr-2" />
          Logout
        </Button>
      </div>
    </div>
  )
}
```

#### 4.3 Header
**File:** `src/components/layout/header.tsx`
```typescript
'use client'

import { User } from '@supabase/supabase-js'
import { Bell, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface HeaderProps {
  user: User
}

export function Header({ user }: HeaderProps) {
  return (
    <header className="flex items-center justify-between h-16 px-6 bg-white border-b border-gray-200">
      <div className="flex items-center flex-1 max-w-xl">
        <Search className="w-5 h-5 text-gray-400 mr-3" />
        <Input
          type="search"
          placeholder="Search students, applications..."
          className="border-none focus-visible:ring-0"
        />
      </div>

      <div className="flex items-center space-x-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuItem>No new notifications</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
```

#### 4.4 Data Table Component
**File:** `src/components/shared/data-table.tsx`
```typescript
'use client'

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageCount?: number
  onPageChange?: (page: number) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount = 1,
  onPageChange,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    state: {
      sorting,
    },
  })

  return (
    <div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {pageCount > 1 && (
        <div className="flex items-center justify-end space-x-2 py-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(table.getState().pagination.pageIndex)}
            disabled={!table.getCanPreviousPage()}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange?.(table.getState().pagination.pageIndex + 2)}
            disabled={!table.getCanNextPage()}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}
```

#### 4.5 Status Badge
**File:** `src/components/applications/status-badge.tsx`
```typescript
import { Badge } from '@/components/ui/badge'
import { statusColors, applicationStatusLabels, studentStatusLabels, documentStatusLabels } from '@/lib/constants/status'
import { cn } from '@/lib/utils'

interface StatusBadgeProps {
  status: string
  type?: 'application' | 'student' | 'document'
  className?: string
}

const labelMap = {
  application: applicationStatusLabels,
  student: studentStatusLabels,
  document: documentStatusLabels,
}

export function StatusBadge({ status, type = 'application', className }: StatusBadgeProps) {
  const labels = labelMap[type]
  const colorClass = statusColors[status] || 'bg-gray-100 text-gray-800'

  return (
    <Badge className={cn(colorClass, className)} variant="secondary">
      {labels[status] || status}
    </Badge>
  )
}
```

**Verification:**
- [ ] Layout renders correctly on all screen sizes
- [ ] Sidebar navigation highlights active route
- [ ] Data table supports sorting and pagination
- [ ] Status badges show correct colors and labels

---

### Phase 5: Student List Page (Week 4)
**Goal:** Student listing with search, filters, and pagination

#### 5.1 Student List Page
**File:** `src/app/(dashboard)/students/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useStudents } from '@/hooks/use-students'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/applications/status-badge'
import { ColumnDef } from '@tanstack/react-table'
import { Student } from '@/types/database'
import { format } from 'date-fns'

const columns: ColumnDef<Student>[] = [
  {
    accessorKey: 'full_name',
    header: 'Name',
    cell: ({ row }) => (
      <Link
        href={`/students/${row.original.id}`}
        className="font-medium text-blue-600 hover:underline"
      >
        {row.getValue('full_name')}
      </Link>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => (
      <StatusBadge status={row.getValue('status')} type="student" />
    ),
  },
  {
    accessorKey: 'profile_complete',
    header: 'Profile',
    cell: ({ row }) => (
      <div className="flex items-center">
        <div className="w-16 h-2 bg-gray-200 rounded-full mr-2">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${row.getValue('profile_complete')}%` }}
          />
        </div>
        <span className="text-sm text-gray-600">{row.getValue('profile_complete')}%</span>
      </div>
    ),
  },
  {
    accessorKey: 'created_at',
    header: 'Created',
    cell: ({ row }) => format(new Date(row.getValue('created_at')), 'MMM d, yyyy'),
  },
]

export default function StudentsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState<string>('')
  const [page, setPage] = useState(1)

  const { students, isLoading, pagination } = useStudents({
    page,
    status: status || undefined,
    search: search || undefined,
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Students</h1>
        <Link href="/students/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Student
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="enrolled">Enrolled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Loading...</div>
      ) : (
        <DataTable
          columns={columns}
          data={students}
          pageCount={pagination.totalPages}
          onPageChange={setPage}
        />
      )}
    </div>
  )
}
```

**Verification:**
- [ ] Search filters students in real-time
- [ ] Status filter works correctly
- [ ] Pagination navigates properly
- [ ] Clicking student name navigates to profile
- [ ] "Add Student" button goes to wizard

---

### Phase 6: Add Student Wizard (Week 4-5)
**Goal:** 4-step wizard for complete student onboarding

#### 6.1 Wizard Container
**File:** `src/components/students/student-wizard/wizard-container.tsx`
```typescript
'use client'

import { useRouter } from 'next/navigation'
import { useStudentWizardStore, WizardStep } from '@/stores/student-wizard-store'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { WizardProgress } from './wizard-progress'
import { StepPersonal } from './step-personal'
import { StepAcademic } from './step-academic'
import { StepDocuments } from './step-documents'
import { StepReview } from './step-review'
import { studentService } from '@/services/student.service'
import { applicationService } from '@/services/application.service'
import { documentService } from '@/services/document.service'
import { useToast } from '@/components/ui/use-toast'

const steps: { id: WizardStep; title: string; description: string }[] = [
  {
    id: 'personal',
    title: 'Personal Information',
    description: 'Basic details about the student',
  },
  {
    id: 'academic',
    title: 'Academic Background',
    description: 'Education history and goals',
  },
  {
    id: 'documents',
    title: 'Documents',
    description: 'Upload required documents',
  },
  {
    id: 'review',
    title: 'Review & Submit',
    description: 'Verify and create student',
  },
]

export function WizardContainer() {
  const router = useRouter()
  const { toast } = useToast()
  const {
    currentStep,
    setStep,
    markStepComplete,
    personalInfo,
    academicInfo,
    documents,
    applicationInfo,
    isSubmitting,
    setSubmitting,
    setError,
    reset,
    canProceedToStep,
  } = useStudentWizardStore()

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep)

  const handleNext = () => {
    markStepComplete(currentStep)
    const nextStep = steps[currentStepIndex + 1]
    if (nextStep) {
      setStep(nextStep.id)
    }
  }

  const handleBack = () => {
    const prevStep = steps[currentStepIndex - 1]
    if (prevStep) {
      setStep(prevStep.id)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    setError(null)

    try {
      // Step 1: Create student
      const student = await studentService.createStudent({
        ...personalInfo,
        ...academicInfo,
        status: 'lead',
      })

      // Step 2: Upload documents
      for (const doc of documents) {
        if (doc.file) {
          // Upload to Cloudinary
          const formData = new FormData()
          formData.append('file', doc.file)
          formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)

          const response = await fetch(
            `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/upload`,
            {
              method: 'POST',
              body: formData,
            }
          )

          const data = await response.json()

          // Save document record
          await documentService.createDocument({
            student_id: student.id,
            doc_type: doc.doc_type,
            file_name: doc.file.name,
            file_url: data.secure_url,
            file_size: doc.file.size,
            mime_type: doc.file.type,
            cloudinary_public_id: data.public_id,
          })
        }
      }

      // Step 3: Create application if provided
      if (applicationInfo.university_id) {
        await applicationService.createApplication({
          student_id: student.id,
          university_id: applicationInfo.university_id,
          program_id: applicationInfo.program_id,
          intake_date: applicationInfo.intake_date,
          status: 'draft',
        })
      }

      toast({
        title: 'Success',
        description: 'Student created successfully',
      })

      reset()
      router.push(`/students/${student.id}`)
    } catch (error) {
      console.error('Error creating student:', error)
      setError(error instanceof Error ? error.message : 'Failed to create student')
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to create student',
        variant: 'destructive',
      })
    } finally {
      setSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (currentStep) {
      case 'personal':
        return <StepPersonal onNext={handleNext} />
      case 'academic':
        return <StepAcademic onNext={handleNext} onBack={handleBack} />
      case 'documents':
        return <StepDocuments onNext={handleNext} onBack={handleBack} />
      case 'review':
        return <StepReview onSubmit={handleSubmit} onBack={handleBack} />
      default:
        return null
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Add New Student</CardTitle>
        </CardHeader>
        <CardContent>
          <WizardProgress steps={steps} currentStep={currentStep} />

          <div className="mt-8">
            {renderStep()}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
```

#### 6.2 Wizard Progress
**File:** `src/components/students/student-wizard/wizard-progress.tsx`
```typescript
import { WizardStep } from '@/stores/student-wizard-store'
import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface WizardProgressProps {
  steps: { id: WizardStep; title: string; description: string }[]
  currentStep: WizardStep
}

export function WizardProgress({ steps, currentStep }: WizardProgressProps) {
  const currentIndex = steps.findIndex((s) => s.id === currentStep)

  return (
    <div className="flex items-center justify-between">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex
        const isCurrent = index === currentIndex
        const isUpcoming = index > currentIndex

        return (
          <div key={step.id} className="flex items-center">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  'w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium transition-colors',
                  isCompleted && 'bg-green-500 text-white',
                  isCurrent && 'bg-blue-500 text-white',
                  isUpcoming && 'bg-gray-200 text-gray-500'
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : index + 1}
              </div>
              <div className="mt-2 text-center">
                <p
                  className={cn(
                    'text-sm font-medium',
                    isCurrent ? 'text-gray-900' : 'text-gray-500'
                  )}
                >
                  {step.title}
                </p>
                <p className="text-xs text-gray-400">{step.description}</p>
              </div>
            </div>

            {index < steps.length - 1 && (
              <div
                className={cn(
                  'w-24 h-0.5 mx-4',
                  isCompleted ? 'bg-green-500' : 'bg-gray-200'
                )}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
```

#### 6.3 Step 1: Personal Information
**File:** `src/components/students/student-wizard/step-personal.tsx`
```typescript
'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { personalInfoSchema, PersonalInfoInput } from '@/lib/validations/student.schema'
import { useStudentWizardStore } from '@/stores/student-wizard-store'
import { Button } from '@/components/ui/button'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'

interface StepPersonalProps {
  onNext: () => void
}

export function StepPersonal({ onNext }: StepPersonalProps) {
  const { personalInfo, setPersonalInfo } = useStudentWizardStore()

  const form = useForm<PersonalInfoInput>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: personalInfo,
  })

  const onSubmit = (data: PersonalInfoInput) => {
    setPersonalInfo(data)
    onNext()
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="full_name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name *</FormLabel>
                <FormControl>
                  <Input placeholder="John Doe" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="phone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Phone *</FormLabel>
                <FormControl>
                  <Input placeholder="+1 234 567 8900" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input type="email" placeholder="john@example.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="date_of_birth"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Date of Birth</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nationality"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nationality</FormLabel>
                <FormControl>
                  <Input placeholder="Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="passport_number"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Passport Number</FormLabel>
                <FormControl>
                  <Input placeholder="Passport number" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address</FormLabel>
              <FormControl>
                <Input placeholder="Street address" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>City</FormLabel>
                <FormControl>
                  <Input placeholder="City" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="country"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Country</FormLabel>
                <FormControl>
                  <Input placeholder="Country" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Notes</FormLabel>
              <FormControl>
                <textarea
                  className="w-full min-h-[100px] px-3 py-2 border rounded-md"
                  placeholder="Additional notes about the student..."
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end">
          <Button type="submit">Continue</Button>
        </div>
      </form>
    </Form>
  )
}
```

**Verification:**
- [ ] Wizard persists data between steps
- [ ] Form validation works on each step
- [ ] Progress indicator shows correct step
- [ ] Can navigate back to previous steps
- [ ] Submit creates student + application + documents
- [ ] Browser refresh recovers wizard state

---

### Phase 7: Student Profile Page (Week 5)
**Goal:** Detailed student view with applications and documents

#### 7.1 Student Profile Page
**File:** `src/app/(dashboard)/students/[id]/page.tsx`
```typescript
import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { StudentProfile } from '@/components/students/student-profile'

interface StudentPageProps {
  params: { id: string }
}

export default async function StudentPage({ params }: StudentPageProps) {
  const supabase = createClient()

  const { data: student } = await supabase
    .from('students')
    .select('*')
    .eq('id', params.id)
    .is('deleted_at', null)
    .single()

  if (!student) {
    notFound()
  }

  const { data: applications } = await supabase
    .from('applications')
    .select(`
      *,
      university:universities(name, country),
      program:programs(name, degree_type)
    `)
    .eq('student_id', params.id)
    .order('created_at', { ascending: false })

  const { data: documents } = await supabase
    .from('student_documents')
    .select('*')
    .eq('student_id', params.id)
    .eq('is_latest', true)
    .order('created_at', { ascending: false })

  return (
    <StudentProfile
      student={student}
      applications={applications || []}
      documents={documents || []}
    />
  )
}
```

**Verification:**
- [ ] Profile displays all student information
- [ ] Applications list shows with status
- [ ] Documents section shows uploaded files
- [ ] Can create new application from profile
- [ ] Can upload additional documents

---

### Phase 8: Application Management (Week 5-6)
**Goal:** Application CRUD with status workflow

#### 8.1 Applications List Page
**File:** `src/app/(dashboard)/applications/page.tsx`
```typescript
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DataTable } from '@/components/shared/data-table'
import { StatusBadge } from '@/components/applications/status-badge'
import { ColumnDef } from '@tanstack/react-table'
import { format } from 'date-fns'

interface Application {
  id: string
  student: { full_name: string }
  university: { name: string; country: string }
  program: { name: string; degree_type: string }
  status: string
  intake_date: string
  created_at: string
}

const columns: ColumnDef<Application>[] = [
  {
    accessorKey: 'student.full_name',
    header: 'Student',
    cell: ({ row }) => row.original.student?.full_name,
  },
  {
    accessorKey: 'university.name',
    header: 'University',
    cell: ({ row }) => (
      <div>
        <div>{row.original.university?.name}</div>
        <div className="text-sm text-gray-500">{row.original.university?.country}</div>
      </div>
    ),
  },
  {
    accessorKey: 'program.name',
    header: 'Program',
    cell: ({ row }) => (
      <div>
        <div>{row.original.program?.name}</div>
        <div className="text-sm text-gray-500">{row.original.program?.degree_type}</div>
      </div>
    ),
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => <StatusBadge status={row.getValue('status')} />,
  },
  {
    accessorKey: 'intake_date',
    header: 'Intake',
    cell: ({ row }) => format(new Date(row.getValue('intake_date')), 'MMM yyyy'),
  },
]

export default function ApplicationsPage() {
  const [search, setSearch] = useState('')
  const [status, setStatus
] = useState('') 


  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Applications</h1>
        <Link href="/applications/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            New Application
          </Button>
        </Link>
      </div>

      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search applications..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All Statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="">All Statuses</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
            <SelectItem value="submitted">Submitted</SelectItem>
            <SelectItem value="under_review">Under Review</SelectItem>
            <SelectItem value="offer_received">Offer Received</SelectItem>
            <SelectItem value="enrolled">Enrolled</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <DataTable columns={columns} data={[]} />
    </div>
  )
}
```

#### 8.2 Status Update Dialog
**File:** `src/components/applications/status-update-dialog.tsx`
```typescript
'use client'

import { useState } from 'react'
import { ApplicationStatus } from '@/types/database'
import { getValidNextStatuses, isTerminalStatus } from '@/lib/utils/state-machine'
import { applicationService } from '@/services/application.service'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'

interface StatusUpdateDialogProps {
  applicationId: string
  currentStatus: ApplicationStatus
  onUpdate: () => void
  children: React.ReactNode
}

export function StatusUpdateDialog({
  applicationId,
  currentStatus,
  onUpdate,
  children,
}: StatusUpdateDialogProps) {
  const [open, setOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<ApplicationStatus | ''>('')
  const [reason, setReason] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()

  const validStatuses = getValidNextStatuses(currentStatus)
  const isTerminal = isTerminalStatus(currentStatus)

  const handleSubmit = async () => {
    if (!newStatus) return

    setIsSubmitting(true)
    try {
      await applicationService.updateStatus(applicationId, newStatus, reason)
      toast({
        title: 'Status Updated',
        description: `Application status changed to ${newStatus}`,
      })
      onUpdate()
      setOpen(false)
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isTerminal) {
    return null
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Application Status</DialogTitle>
          <DialogDescription>
            Current status: <strong>{currentStatus}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">New Status</label>
            <Select
              value={newStatus}
              onValueChange={(value) => setNewStatus(value as ApplicationStatus)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {validStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Reason (Optional)</label>
            <Textarea
              placeholder="Enter reason for status change..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!newStatus || isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Status'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

**Verification:**
- [ ] Status dropdown shows only valid transitions
- [ ] Terminal statuses hide update button
- [ ] Status change logs to history
- [ ] Student status syncs on enrollment

---

### Phase 9: Dashboard (Week 6)
**Goal:** Overview with statistics and recent activity

#### 9.1 Dashboard Page
**File:** `src/app/(dashboard)/page.tsx`
```typescript
import { createClient } from '@/lib/supabase/server'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, GraduationCap, Clock } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) return null

  // Get statistics
  const { count: totalStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('freelancer_id', user.id)
    .is('deleted_at', null)

  const { count: activeApplications } = await supabase
    .from('applications')
    .select('*', { count: 'exact', head: true })
    .in('status', ['draft', 'documents_pending', 'ready_to_submit', 'submitted', 'under_review'])

  const { count: enrolledStudents } = await supabase
    .from('students')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'enrolled')
    .eq('freelancer_id', user.id)

  const { data: recentStudents } = await supabase
    .from('students')
    .select('id, full_name, status, created_at')
    .eq('freelancer_id', user.id)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })
    .limit(5)

  const stats = [
    {
      title: 'Total Students',
      value: totalStudents || 0,
      icon: Users,
      href: '/students',
    },
    {
      title: 'Active Applications',
      value: activeApplications || 0,
      icon: FileText,
      href: '/applications',
    },
    {
      title: 'Enrolled Students',
      value: enrolledStudents || 0,
      icon: GraduationCap,
      href: '/students?status=enrolled',
    },
  ]

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat) => (
          <Link key={stat.title} href={stat.href}>
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">
                  {stat.title}
                </CardTitle>
                <stat.icon className="w-4 h-4 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Students</CardTitle>
        </CardHeader>
        <CardContent>
          {recentStudents && recentStudents.length > 0 ? (
            <div className="space-y-4">
              {recentStudents.map((student) => (
                <div
                  key={student.id}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <div>
                    <Link
                      href={`/students/${student.id}`}
                      className="font-medium text-blue-600 hover:underline"
                    >
                      {student.full_name}
                    </Link>
                    <p className="text-sm text-gray-500">{student.status}</p>
                  </div>
                  <span className="text-sm text-gray-400">
                    {new Date(student.created_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No students yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
```

**Verification:**
- [ ] Stats cards show correct numbers
- [ ] Recent students list displays
- [ ] Clicking cards navigates to correct pages
- [ ] Data updates in real-time

---

### Phase 10: Polish & Edge Cases (Week 6-7)
**Goal:** Error handling, loading states, and final touches

#### 10.1 Error Boundary
**File:** `src/components/shared/error-boundary.tsx`
```typescript
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Something went wrong
            </h2>
            <p className="text-gray-600 mb-4 text-center max-w-md">
              {this.state.error?.message || 'An unexpected error occurred'}
            </p>
            <Button
              onClick={() => {
                this.setState({ hasError: false, error: null })
                window.location.reload()
              }}
            >
              Try Again
            </Button>
          </div>
        )
      )
    }

    return this.props.children
  }
}
```

#### 10.2 Loading Skeletons
**File:** `src/components/shared/skeleton-card.tsx`
```typescript
import { Skeleton } from '@/components/ui/skeleton'

export function SkeletonCard() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-4 w-1/3" />
      <Skeleton className="h-8 w-1/2" />
    </div>
  )
}

export function SkeletonTable() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
      <Skeleton className="h-10 w-full" />
    </div>
  )
}
```

#### 10.3 Toast Notifications
**File:** `src/components/ui/toaster.tsx`
```typescript
'use client'

import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'
import { useToast } from '@/components/ui/use-toast'

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        return (
          <Toast key={id} {...props}>
            <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
```

**Verification:**
- [ ] Error boundaries catch crashes
- [ ] Loading skeletons show during data fetch
- [ ] Toast notifications appear for actions
- [ ] Empty states handled gracefully
- [ ] Mobile responsive design works

---

## 6. File Structure

```
D:\freelancer.lango\
├── src/
│   ├── app/
│   │   ├── (auth)/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── layout.tsx
│   │   ├── (dashboard)/
│   │   │   ├── layout.tsx
│   │   │   ├── page.tsx
│   │   │   ├── students/
│   │   │   │   ├── page.tsx
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx
│   │   │   ├── applications/
│   │   │   │   └── page.tsx
│   │   │   └── universities/
│   │   │       └── page.tsx
│   │   ├── api/
│   │   │   ├── students/
│   │   │   │   └── route.ts
│   │   │   ├── applications/
│   │   │   │   └── route.ts
│   │   │   ├── documents/
│   │   │   │   └── route.ts
│   │   │   └── upload/
│   │   │       └── route.ts
│   │   ├── layout.tsx
│   │   └── globals.css
│   ├── components/
│   │   ├── ui/                    # shadcn components
│   │   ├── layout/
│   │   │   ├── sidebar.tsx
│   │   │   ├── header.tsx
│   │   │   └── mobile-nav.tsx
│   │   ├── students/
│   │   │   ├── student-list.tsx
│   │   │   ├── student-card.tsx
│   │   │   ├── student-filters.tsx
│   │   │   ├── student-profile.tsx
│   │   │   └── student-wizard/
│   │   │       ├── wizard-container.tsx
│
│   │   │       ├── wizard-progress.tsx
│   │   │       ├── step-personal.tsx
│   │   │       ├── step-academic.tsx
│   │   │       ├── step-documents.tsx
│   │   │       └── step-review.tsx
│   │   ├── applications/
│   │   │   ├── application-list.tsx
│   │   │   ├── status-badge.tsx
│   │   │   └── status-update-dialog.tsx
│   │   ├── documents/
│   │   │   ├── document-uploader.tsx
│   │   │   ├── document-list.tsx
│   │   │   └── document-preview.tsx
│   │   └── shared/
│   │       ├── data-table.tsx
│   │       ├── search-input.tsx
│   │       ├── pagination.tsx
│   │       ├── confirm-dialog.tsx
│   │       ├── error-boundary.tsx
│   │       └── skeleton-card.tsx
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts
│   │   │   ├── server.ts
│   │   │   └── admin.ts
│   │   ├── cloudinary/
│   │   │   └── client.ts
│   │   ├── validations/
│   │   │   ├── student.schema.ts
│   │   │   ├── application.schema.ts
│   │   │   └── document.schema.ts
│   │   ├── constants/
│   │   │   ├── status.ts
│   │   │   └── document-types.ts
│   │   └── utils/
│   │       ├── state-machine.ts
│   │       ├── formatters.ts
│   │       └── helpers.ts
│   ├── hooks/
│   │   ├── use-students.ts
│   │   ├── use-student.ts
│   │   ├── use-applications.ts
│   │   ├── use-documents.ts
│   │   └── use-auth.ts
│   ├── stores/
│   │   ├── student-wizard-store.ts
│   │   ├── student-store.ts
│   │   └── ui-store.ts
│   ├── services/
│   │   ├── student.service.ts
│   │   ├── application.service.ts
│   │   ├── document.service.ts
│   │   └── university.service.ts
│   ├── types/
│   │   ├── database.ts
│   │   ├── student.ts
│   │   ├── application.ts
│   │   └── index.ts
│   └── middleware.ts
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql
│   │   ├── 002_functions_triggers.sql
│   │   ├── 003_rls_policies.sql
│   │   └── 004_seed_data.sql
│   └── seed.sql
├── public/
│   └── (static assets)
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
└── package.json
```

---

## 7. Environment Configuration

### 7.1 Required Environment Variables

Create `.env.local` file:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Cloudinary Configuration
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
CLOUDINARY_FOLDER=freelancer-crm

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
NODE_ENV=development
```

### 7.2 Environment Setup Checklist

- [ ] Create Supabase project at https://supabase.com
- [ ] Enable Email provider in Authentication > Providers
- [ ] Run SQL migrations in Supabase SQL Editor
- [ ] Create Cloudinary account at https://cloudinary.com
- [ ] Configure upload presets in Cloudinary settings
- [ ] Copy all credentials to `.env.local`
- [ ] Add `.env.local` to `.gitignore`

---

## 8. Testing Strategy

### 8.1 Unit Tests

**File:** `src/lib/utils/state-machine.test.ts`
```typescript
import { isValidStatusTransition, getValidNextStatuses, isTerminalStatus } from './state-machine'
import { ApplicationStatus } from '@/types/database'

describe('State Machine', () => {
  describe('isValidStatusTransition', () => {
    it('should allow valid transitions', () => {
      expect(isValidStatusTransition('draft', 'documents_pending')).toBe(true)
      expect(isValidStatusTransition('ready_to_submit', 'submitted')).toBe(true)
    })

    it('should block invalid transitions', () => {
      expect(isValidStatusTransition('draft', 'enrolled')).toBe(false)
      expect(isValidStatusTransition('enrolled', 'draft')).toBe(false)
    })

    it('should block transitions from terminal states', () => {
      expect(isValidStatusTransition('enrolled', 'submitted')).toBe(false)
    })
  })

  describe('getValidNextStatuses', () => {
    it('should return valid next statuses', () => {
      const next = getValidNextStatuses('draft')
      expect(next).toContain('documents_pending')
      expect(next).toContain('withdrawn')
    })

    it('should return empty array for terminal states', () => {
      expect(getValidNextStatuses('enrolled')).toEqual([])
    })
  })
})
```

### 8.2 Integration Tests

**File:** `src/services/student.service.test.ts`
```typescript
import { studentService } from './student.service'
import { supabaseAdmin } from '@/lib/supabase/admin'

describe('StudentService', () => {
  beforeEach(async () => {
    // Clean up test data
    await supabaseAdmin.from('students').delete().eq('email', 'test@example.com')
  })

  describe('createStudent', () => {
    it('should create a new student', async () => {
      const student = await studentService.createStudent({
        full_name: 'Test Student',
        email: 'test@example.com',
        phone: '+1234567890',
        freelancer_id: 'test-freelancer-id',
      })

      expect(student.full_name).toBe('Test Student')
      expect(student.status).toBe('lead')
    })

    it('should prevent duplicate phone numbers', async () => {
      await studentService.createStudent({
        full_name: 'First Student',
        email: 'first@example.com',
        phone: '+1234567890',
        freelancer_id: 'test-freelancer-id',
      })

      await expect(
        studentService.createStudent({
          full_name: 'Second Student',
          email: 'second@example.com',
          phone: '+1234567890',
          freelancer_id: 'test-freelancer-id',
        })
      ).rejects.toThrow('A student with this phone number already exists')
    })
  })
})
```

### 8.3 E2E Tests

**File:** `cypress/e2e/student-wizard.cy.ts`
```typescript
describe('Student Wizard', () => {
  beforeEach(() => {
    cy.login('test@example.com', 'password')
    cy.visit('/students/new')
  })

  it('should complete the full wizard', () => {
    // Step 1: Personal Information
    cy.get('input[name="full_name"]').type('John Doe')
    cy.get('input[name="phone"]').type('+1234567890')
    cy.get('input[name="email"]').type('john@example.com')
    cy.contains('button', 'Continue').click()

    // Step 2: Academic Information
    cy.get('select[name="target_degree"]').select('master')
    cy.contains('button', 'Continue').click()

    // Step 3: Documents (skip for now)
    cy.contains('button', 'Continue').click()

    // Step 4: Review
    cy.contains('John Doe').should('be.visible')
    cy.contains('button', 'Submit').click()

    // Should redirect to student profile
    cy.url().should('include', '/students/')
    cy.contains('Student created successfully').should('be.visible')
  })

  it('should persist data on browser refresh', () => {
    cy.get('input[name="full_name"]').type('Jane Doe')
    cy.reload()
    cy.get('input[name="full_name"]').should('have.value', 'Jane Doe')
  })
})
```

### 8.4 Test Commands

```bash
# Run unit tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run E2E tests
npx cypress run

# Open Cypress UI
npx cypress open
```

---

## 9. Deployment Checklist

### 9.1 Pre-Deployment

- [ ] All tests passing
- [ ] TypeScript compilation successful (`npm run build`)
- [ ] Environment variables configured in Vercel
- [ ] Supabase RLS policies tested
- [ ] Cloudinary upload presets configured
- [ ] Database migrations applied to production

### 9.2 Vercel Deployment

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy to production
vercel --prod
```

### 9.3 Post-Deployment

- [ ] Verify all API routes respond correctly
- [ ] Test authentication flow
- [ ] Test file uploads to Cloudinary
- [ ] Verify RLS policies working
- [ ] Check error monitoring (Sentry recommended)
- [ ] Set up automated backups (Supabase)

---

## 10. Appendices

### Appendix A: Database Migration Scripts

**File:** `supabase/migrations/001_initial_schema.sql`
```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enum types
CREATE TYPE user_role AS ENUM ('super_admin', 'admin', 'manager', 'freelancer');
CREATE TYPE student_status AS ENUM ('lead', 'active', 'inactive', 'enrolled', 'archived');
CREATE TYPE application_status AS ENUM (
  'draft', 'documents_pending', 'ready_to_submit', 'submitted', 
  'under_review', 'interview_scheduled', 'interview_completed',
  'offer_received', 'offer_accepted', 'offer_declined', 'enrolled',
  'rejected', 'withdrawn', 'on_hold'
);
CREATE TYPE document_status AS ENUM ('uploaded', 'under_review', 'approved', 'rejected', 'expired');
CREATE TYPE document_type AS ENUM (
  'passport', 'transcript', 'diploma', 'cv', 'recommendation_letter',
  'personal_statement', 'language_test', 'other'
);
CREATE TYPE degree_type AS ENUM ('bachelor', 'master', 'phd', 'diploma', 'certificate');

-- Create tables
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'freelancer',
  phone TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE students (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  freelancer_id UUID NOT NULL REFERENCES profiles(id),
  full_name TEXT NOT NULL,
  email TEXT,
  phone TEXT NOT NULL,
  date_of_birth DATE,
  nationality TEXT,
  address TEXT,
  city TEXT,
  country TEXT,
  passport_number TEXT,
  status student_status NOT NULL DEFAULT 'lead',
  profile_complete INTEGER DEFAULT 0 CHECK (profile_complete BETWEEN 0 AND 100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);

CREATE TABLE universities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT,
  website TEXT,
  logo_url TEXT,
  ranking INTEGER,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  university_id UUID NOT NULL REFERENCES universities(id),
  name TEXT NOT NULL,
  degree_type degree_type NOT NULL,
  duration_months INTEGER,
  tuition_fee DECIMAL(10,2),
  currency TEXT DEFAULT 'USD',
  language TEXT,
  description TEXT,
  requirements TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE applications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  university_id UUID NOT NULL REFERENCES universities(id),
  program_id UUID NOT NULL REFERENCES programs(id),
  intake_date DATE NOT NULL,
  status application_status NOT NULL DEFAULT 'draft',
  application_fee_paid BOOLEAN DEFAULT FALSE,
  application_fee_amount DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE student_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES students(id),
  doc_type document_type NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  cloudinary_public_id TEXT,
  status document_status NOT NULL DEFAULT 'uploaded',
  version INTEGER DEFAULT 1,
  is_latest BOOLEAN DEFAULT TRUE,
  uploaded_by UUID REFERENCES profiles(id),
  rejection_reason TEXT,
  expiry_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE application_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  application_id UUID NOT NULL REFERENCES applications(id),
  document_id UUID REFERENCES student_documents(id),
  doc_type document_type NOT NULL,
  is_required BOOLEAN DEFAULT TRUE,
  is_uploaded BOOLEAN DEFAULT FALSE,
  uploaded_at TIMESTAMPTZ
);

CREATE TABLE status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type TEXT NOT NULL CHECK (entity_type IN ('student', 'application', 'document')),
  entity_id UUID NOT NULL,
  old_status TEXT,
  new_status TEXT NOT NULL,
  changed_by UUID REFERENCES profiles(id),
  reason TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES profiles(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES profiles(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  link TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Appendix B: Business Rules Reference

| # | Rule | Implementation |
|---|------|----------------|
| 1 | Student CAN exist without Application | `applications` table has nullable FK, student status defaults to 'lead' |
| 2 | Application CANNOT exist without Student | `applications.student_id` is NOT NULL with FK constraint |
| 3 | Student status auto-syncs with applications | Database trigger `sync_student_status_with_application` |
| 4 | Documents belong to STUDENT, not Application | `student_documents.student_id` FK, junction table for linking |
| 5 | Document versioning on re-upload | `is_latest` flag + `version` counter |
| 6 | Every status change logged | `status_history` table + trigger `log_status_change` |
| 7 | Freelancers ONLY see own data | RLS policies on all tables |
| 8 | Duplicate phone blocked per freelancer | Unique constraint + validation in service layer |
| 9 | All deletes are SOFT deletes | `deleted_at` timestamp, filtered in queries |
| 10 | Validation at 3 layers | Zod (client) + Zod (API) + CHECK constraints (DB) |
| 11 | Profile completeness auto-calculated | Database trigger `calculate_profile_completeness` |
| 12 | File path convention enforced | Cloudinary folder structure: `{freelancer_id}/{student_id}/{doc_type}/{timestamp}_{filename}` |
| 13 | Signed URLs for document access | Cloudinary signed URLs with 1-hour expiry |
| 14 | Duplicate application prevention | Unique constraint on (student_id, program_id, intake_date) |
| 15 | Terminal states block further changes | State machine validation in `isValidStatusTransition` |

### Appendix C: API Endpoints Reference

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | `/api/students` | List students | Yes |
| POST | `/api/students` | Create student | Yes |
| GET | `/api/students/:id` | Get student by ID | Yes |
| PATCH | `/api/students/:id` | Update student | Yes |
| DELETE | `/api/students/:id` | Soft delete student | Yes |
| GET | `/api/applications` | List applications | Yes |
| POST | `/api/applications` | Create application | Yes |
| GET | `/api/applications/:id` | Get application by ID | Yes |
| PATCH | `/api/applications/:id/status` | Update application status | Yes |
| GET | `/api/documents` | List documents | Yes |
| POST | `/api/documents` | Create document record | Yes |
| POST | `/api/upload/signature` | Get Cloudinary upload signature | Yes |
| GET | `/api/universities` | List universities | Yes |
| GET | `/api/universities/:id/programs` | List university programs | Yes |

### Appendix D: Troubleshooting Guide

**Issue:** RLS policy blocking legitimate queries
**Solution:** Check that `auth.uid()` matches the `freelancer_id` in the row

**Issue:** Cloudinary uploads failing
**Solution:** Verify upload preset is set to "unsigned" or use signed uploads with correct signature

**Issue:** Wizard state not persisting
**Solution:** Check localStorage quota and clear if needed; verify Zustand persist middleware is configured

**Issue:** Status transitions not working
**Solution:** Check state machine logic and ensure current status is not terminal

**Issue:** Duplicate phone error when no duplicate exists
**Solution:** Check for soft-deleted students with same phone number

---

## Summary

This implementation plan provides a comprehensive roadmap for building the Student & Application Management System. The 10-phase approach ensures:

1. **Solid Foundation:** Type safety, validation, and state machines defined first
2. **Service Layer:** Reusable database operations and API routes
3. **State Management:** Zustand stores with persistence for complex workflows
4. **Component Architecture:** Modular, reusable UI components
5. **Security:** RLS policies, input validation, and soft deletes throughout
6. **User Experience:** 4-step wizard with draft recovery, real-time updates, and responsive design

**Key Success Factors:**
- Follow the phase order strictly
- Test each phase before moving to the next
- Maintain type safety throughout
- Document all business rules in code
- Use the state machine for all status transitions

**Estimated Timeline:** 10-12 weeks for a single developer, 6-8 weeks for a team of two.

---

*Document Version: 1.0*  
*Last Updated: March 14, 2026*  
*Next Review: Upon Phase 5 completion*

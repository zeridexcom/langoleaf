COMPLETE BUILD SPECIFICATION — Student \& Application Management System

AGENT INSTRUCTIONS: This is the ONLY document you need. Read it fully before writing any code. Follow the build order in Phase section. Do NOT skip any table, trigger, policy, or validation. This is an education enrollment system — data integrity is critical. A missing field or broken flow means a student might miss their university deadline.



TABLE OF CONTENTS

text



1\.  PROJECT CONTEXT \& RULES

2\.  TECH STACK (exact versions)

3\.  DATABASE — COMPLETE SCHEMA (copy-paste ready SQL)

4\.  DATABASE — TRIGGERS \& FUNCTIONS

5\.  DATABASE — ROW LEVEL SECURITY (RLS)

6\.  DATABASE — SEED DATA

7\.  STATE MACHINES (student + application + document)

8\.  TYPES \& INTERFACES (TypeScript)

9\.  ZOD VALIDATION SCHEMAS

10\. SERVICE LAYER (business logic)

11\. API ROUTES (every endpoint, full implementation)

12\. HOOKS (React custom hooks)

13\. ZUSTAND STORES

14\. UI COMPONENTS (every component, full structure)

15\. USER FLOWS (step-by-step with every screen)

16\. FILE UPLOAD SYSTEM

17\. ERROR HANDLING (standardized)

18\. EDGE CASES (every single one)

19\. CONSTANTS \& CONFIG

20\. FOLDER STRUCTURE

21\. BUILD ORDER (phase by phase, file by file)

22\. TESTING CHECKLIST

1\. PROJECT CONTEXT \& RULES

What This System Does

text



This is a CRM for education consultants (called "freelancers") who help 

students apply to universities. A freelancer:



1\. Adds a student (personal info, academic preferences)

2\. Uploads the student's documents (passport, transcripts, etc.)

3\. Creates applications to specific universities/programs

4\. Tracks each application through its lifecycle

5\. Earns commission when a student enrolls



The system must support:

\- One freelancer managing 100+ students

\- Each student applying to 1-10 universities

\- Each application requiring 3-8 documents

\- Full audit trail of every status change

\- Multi-role access (freelancer, manager, admin, super\_admin)

Non-Negotiable Rules

text



RULE 1:  A Student CAN exist without an Application (they start as a "lead")

RULE 2:  An Application CANNOT exist without a Student (FK constraint)

RULE 3:  A Student can have MANY Applications (one per university+program+intake)

RULE 4:  A Document belongs to the STUDENT, not the Application

RULE 5:  Applications REFERENCE documents via a link table (no duplication)

RULE 6:  Every status change MUST be logged in status\_history (audit trail)

RULE 7:  Freelancers can ONLY see their own students/applications (RLS enforced)

RULE 8:  Status transitions follow a STATE MACHINE (no random jumps)

RULE 9:  All deletes are SOFT DELETES (deleted\_at timestamp, never DROP data)

RULE 10: Validation happens at THREE layers: Client (Zod) → API (Zod) → Database (CHECK constraints)

RULE 11: The wizard form state persists to localStorage (user doesn't lose work if browser crashes)

RULE 12: File uploads go to Supabase Storage with path: /{freelancer\_id}/{student\_id}/{doc\_type}/{timestamp}\_{filename}

RULE 13: Profile completeness is auto-calculated by a database trigger

RULE 14: Student status auto-syncs when application status changes (via trigger)

RULE 15: Documents have versioning (re-upload creates new version, keeps old one)

The Core Problem We Are Solving

text



BEFORE (BROKEN):

&#x20; Freelancer adds student → uploads documents → DEAD END

&#x20; No application created. Documents orphaned. Must re-navigate.

&#x20; Must re-enter student data when creating application manually.



AFTER (FIXED):

&#x20; Freelancer adds student → uploads documents → prompted to create application

&#x20; → form pre-filled from student data → documents auto-linked

&#x20; → single continuous wizard flow → everything connected

2\. TECH STACK

text



Runtime:         Node.js 20+

Framework:       Next.js 14+ (App Router, NOT pages router)

Language:        TypeScript (strict mode)

Styling:         Tailwind CSS 3.4+

UI Components:   shadcn/ui (latest)

Forms:           React Hook Form v7+ with @hookform/resolvers

Validation:      Zod v3+

State:           Zustand v4+ (with persist middleware)

Database:        Supabase PostgreSQL (latest)

Auth:            Supabase Auth

File Storage:    Supabase Storage

Realtime:        Supabase Realtime (for live status updates)

Icons:           Lucide React

Tables:          @tanstack/react-table v8

Date handling:   date-fns

Toast/Notifications: sonner (or shadcn toast)

HTTP:            Supabase JS client (NOT axios, NOT fetch for DB operations)

3\. DATABASE — COMPLETE SCHEMA

AGENT: Run this ENTIRE SQL block in Supabase SQL Editor. Do not modify table names, column names, or types. Every constraint is intentional.



SQL



\-- ================================================================

\-- EXTENSIONS (run first)

\-- ================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE EXTENSION IF NOT EXISTS "pg\_trgm";  -- For fuzzy text search



\-- ================================================================

\-- CUSTOM TYPES (enums for type safety at DB level)

\-- ================================================================



\-- Drop if recreating (dev only)

\-- DROP TYPE IF EXISTS user\_role, student\_status, application\_status, document\_type, document\_status, commission\_status CASCADE;



DO $$ BEGIN

&#x20;   CREATE TYPE user\_role AS ENUM (

&#x20;       'super\_admin',

&#x20;       'admin', 

&#x20;       'manager', 

&#x20;       'freelancer'

&#x20;   );

EXCEPTION WHEN duplicate\_object THEN NULL;

END $$;



DO $$ BEGIN

&#x20;   CREATE TYPE student\_status AS ENUM (

&#x20;       'lead',              -- Just added, no application yet

&#x20;       'active',            -- Has at least one active application

&#x20;       'inactive',          -- All applications closed, no recent activity

&#x20;       'enrolled',          -- Successfully enrolled at a university

&#x20;       'archived'           -- Soft archived by freelancer

&#x20;   );

EXCEPTION WHEN duplicate\_object THEN NULL;

END $$;



DO $$ BEGIN

&#x20;   CREATE TYPE application\_status AS ENUM (

&#x20;       'draft',                   -- Started, not yet complete

&#x20;       'documents\_pending',       -- Awaiting required documents

&#x20;       'ready\_to\_submit',         -- All documents ready

&#x20;       'submitted',               -- Submitted to university

&#x20;       'under\_review',            -- University is reviewing

&#x20;       'additional\_info\_needed',  -- University wants more info/docs

&#x20;       'conditional\_offer',       -- Accepted with conditions

&#x20;       'unconditional\_offer',     -- Fully accepted

&#x20;       'offer\_accepted',          -- Student accepted the offer

&#x20;       'offer\_declined',          -- Student declined the offer

&#x20;       'visa\_processing',         -- Visa application stage

&#x20;       'enrolled',                -- Final enrollment confirmed

&#x20;       'rejected',                -- University rejected

&#x20;       'withdrawn',               -- Withdrawn by student/freelancer

&#x20;       'deferred'                 -- Deferred to future intake

&#x20;   );

EXCEPTION WHEN duplicate\_object THEN NULL;

END $$;



DO $$ BEGIN

&#x20;   CREATE TYPE document\_type AS ENUM (

&#x20;       'passport',

&#x20;       'national\_id',

&#x20;       'photo',

&#x20;       'academic\_transcript',

&#x20;       'degree\_certificate',

&#x20;       'marksheet',

&#x20;       'recommendation\_letter',

&#x20;       'statement\_of\_purpose',

&#x20;       'cv\_resume',

&#x20;       'language\_test\_score',

&#x20;       'financial\_proof',

&#x20;       'bank\_statement',

&#x20;       'sponsorship\_letter',

&#x20;       'medical\_report',

&#x20;       'police\_clearance',

&#x20;       'visa\_document',

&#x20;       'admission\_letter',

&#x20;       'scholarship\_letter',

&#x20;       'other'

&#x20;   );

EXCEPTION WHEN duplicate\_object THEN NULL;

END $$;



DO $$ BEGIN

&#x20;   CREATE TYPE document\_status AS ENUM (

&#x20;       'uploaded',        -- File uploaded, not yet reviewed

&#x20;       'under\_review',    -- Being checked by admin/manager

&#x20;       'approved',        -- Verified and accepted

&#x20;       'rejected',        -- Rejected, needs re-upload

&#x20;       'expired'          -- Past expiry date (auto-set by cron)

&#x20;   );

EXCEPTION WHEN duplicate\_object THEN NULL;

END $$;



DO $$ BEGIN

&#x20;   CREATE TYPE commission\_status AS ENUM (

&#x20;       'not\_applicable',

&#x20;       'pending',

&#x20;       'approved',

&#x20;       'invoiced',

&#x20;       'paid',

&#x20;       'disputed'

&#x20;   );

EXCEPTION WHEN duplicate\_object THEN NULL;

END $$;





\-- ================================================================

\-- TABLE 1: PROFILES (extends Supabase auth.users)

\-- ================================================================

CREATE TABLE IF NOT EXISTS profiles (

&#x20;   id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,

&#x20;   role              user\_role NOT NULL DEFAULT 'freelancer',

&#x20;   full\_name         TEXT NOT NULL,

&#x20;   email             TEXT UNIQUE NOT NULL,

&#x20;   phone             TEXT,

&#x20;   avatar\_url        TEXT,

&#x20;   organization\_id   UUID,                -- For future multi-org support

&#x20;   is\_active         BOOLEAN NOT NULL DEFAULT true,

&#x20;   timezone          TEXT DEFAULT 'Asia/Kolkata',

&#x20;   preferences       JSONB DEFAULT '{}',  -- UI preferences, notification settings

&#x20;   created\_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   updated\_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   

&#x20;   -- Constraints

&#x20;   CONSTRAINT profiles\_email\_valid CHECK (email \~\* '^\[A-Za-z0-9.\_%+-]+@\[A-Za-z0-9.-]+\\.\[A-Za-z]{2,}$'),

&#x20;   CONSTRAINT profiles\_full\_name\_not\_empty CHECK (length(trim(full\_name)) > 0)

);



\-- Index

CREATE INDEX IF NOT EXISTS idx\_profiles\_role ON profiles(role) WHERE is\_active = true;

CREATE INDEX IF NOT EXISTS idx\_profiles\_org ON profiles(organization\_id) WHERE organization\_id IS NOT NULL;





\-- ================================================================

\-- TABLE 2: UNIVERSITIES

\-- ================================================================

CREATE TABLE IF NOT EXISTS universities (

&#x20;   id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   name              TEXT NOT NULL,

&#x20;   short\_name        TEXT,                   -- 'IIM-B', 'MIT', 'Oxford'

&#x20;   country           TEXT NOT NULL,

&#x20;   state\_province    TEXT,

&#x20;   city              TEXT,

&#x20;   website           TEXT,

&#x20;   email             TEXT,

&#x20;   phone             TEXT,

&#x20;   ranking\_national  INTEGER,

&#x20;   ranking\_global    INTEGER,

&#x20;   logo\_url          TEXT,

&#x20;   description       TEXT,

&#x20;   is\_partner        BOOLEAN DEFAULT false,  -- Partner university (higher commission)

&#x20;   is\_active         BOOLEAN NOT NULL DEFAULT true,

&#x20;   metadata          JSONB DEFAULT '{}',

&#x20;   created\_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   updated\_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   

&#x20;   CONSTRAINT universities\_name\_not\_empty CHECK (length(trim(name)) > 0)

);



CREATE INDEX IF NOT EXISTS idx\_universities\_country ON universities(country) WHERE is\_active = true;

CREATE INDEX IF NOT EXISTS idx\_universities\_search ON universities USING gin(

&#x20;   to\_tsvector('english', coalesce(name, '') || ' ' || coalesce(short\_name, '') || ' ' || coalesce(city, '') || ' ' || coalesce(country, ''))

);





\-- ================================================================

\-- TABLE 3: PROGRAMS

\-- ================================================================

CREATE TABLE IF NOT EXISTS programs (

&#x20;   id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   university\_id     UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,

&#x20;   

&#x20;   -- Program details

&#x20;   name              TEXT NOT NULL,          -- 'Master of Business Administration'

&#x20;   short\_name        TEXT,                   -- 'MBA'

&#x20;   degree\_level      TEXT NOT NULL CHECK (degree\_level IN ('diploma', 'bachelors', 'masters', 'phd', 'certificate', 'foundation')),

&#x20;   department        TEXT,                   -- 'School of Management'

&#x20;   specialization    TEXT,                   -- 'Finance', 'Marketing'

&#x20;   

&#x20;   -- Duration \& Fees

&#x20;   duration\_months   INTEGER,

&#x20;   tuition\_fee       DECIMAL(12,2),

&#x20;   currency          TEXT DEFAULT 'USD',

&#x20;   application\_fee   DECIMAL(12,2) DEFAULT 0,

&#x20;   

&#x20;   -- Requirements

&#x20;   required\_document\_types document\_type\[] DEFAULT '{}',  -- Which documents this program needs

&#x20;   min\_gpa           DECIMAL(3,2),

&#x20;   language\_requirement TEXT,                -- 'IELTS 6.5', 'TOEFL 90'

&#x20;   other\_requirements TEXT,

&#x20;   

&#x20;   -- Intakes

&#x20;   available\_intakes TEXT\[] DEFAULT '{}',    -- \['Fall 2025', 'Spring 2026']

&#x20;   application\_deadlines JSONB DEFAULT '{}', -- {"Fall 2025": "2025-03-15", "Spring 2026": "2025-10-01"}

&#x20;   

&#x20;   -- Status

&#x20;   is\_active         BOOLEAN NOT NULL DEFAULT true,

&#x20;   metadata          JSONB DEFAULT '{}',

&#x20;   created\_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   updated\_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   

&#x20;   CONSTRAINT programs\_name\_not\_empty CHECK (length(trim(name)) > 0),

&#x20;   CONSTRAINT programs\_unique\_per\_uni UNIQUE(university\_id, name, degree\_level, specialization)

);



CREATE INDEX IF NOT EXISTS idx\_programs\_university ON programs(university\_id) WHERE is\_active = true;

CREATE INDEX IF NOT EXISTS idx\_programs\_degree ON programs(degree\_level) WHERE is\_active = true;





\-- ================================================================

\-- TABLE 4: STUDENTS (core entity)

\-- ================================================================

CREATE TABLE IF NOT EXISTS students (

&#x20;   id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   freelancer\_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,

&#x20;   

&#x20;   -- ── Personal Information ──

&#x20;   first\_name        TEXT NOT NULL,

&#x20;   last\_name         TEXT NOT NULL,

&#x20;   email             TEXT,

&#x20;   phone             TEXT NOT NULL,

&#x20;   date\_of\_birth     DATE,

&#x20;   gender            TEXT CHECK (gender IS NULL OR gender IN ('male', 'female', 'other', 'prefer\_not\_to\_say')),

&#x20;   nationality       TEXT,

&#x20;   marital\_status    TEXT CHECK (marital\_status IS NULL OR marital\_status IN ('single', 'married', 'divorced', 'widowed')),

&#x20;   

&#x20;   -- ── Address ──

&#x20;   address\_line1     TEXT,

&#x20;   address\_line2     TEXT,

&#x20;   city              TEXT,

&#x20;   state\_province    TEXT,

&#x20;   country           TEXT DEFAULT 'India',

&#x20;   postal\_code       TEXT,

&#x20;   

&#x20;   -- ── Emergency Contact ──

&#x20;   emergency\_contact\_name     TEXT,

&#x20;   emergency\_contact\_phone    TEXT,

&#x20;   emergency\_contact\_relation TEXT,

&#x20;   emergency\_contact\_email    TEXT,

&#x20;   

&#x20;   -- ── Academic Background ──

&#x20;   highest\_education          TEXT CHECK (highest\_education IS NULL OR highest\_education IN ('high\_school', 'diploma', 'bachelors', 'masters', 'phd')),

&#x20;   highest\_education\_field    TEXT,          -- 'Computer Science'

&#x20;   highest\_education\_institute TEXT,         -- 'Delhi University'

&#x20;   highest\_education\_year     INTEGER,       -- 2020

&#x20;   highest\_education\_gpa      DECIMAL(4,2), -- 3.85

&#x20;   highest\_education\_percentage DECIMAL(5,2), -- 92.50 (Indian system)

&#x20;   

&#x20;   -- ── Academic Preferences (what they WANT) ──

&#x20;   preferred\_countries        TEXT\[] DEFAULT '{}',

&#x20;   preferred\_degree\_level     TEXT CHECK (preferred\_degree\_level IS NULL OR preferred\_degree\_level IN ('diploma', 'bachelors', 'masters', 'phd', 'certificate', 'foundation')),

&#x20;   preferred\_field            TEXT,

&#x20;   preferred\_specializations  TEXT\[] DEFAULT '{}',

&#x20;   budget\_min                 DECIMAL(12,2),

&#x20;   budget\_max                 DECIMAL(12,2),

&#x20;   budget\_currency            TEXT DEFAULT 'USD',

&#x20;   preferred\_intake           TEXT,          -- 'Fall 2025'

&#x20;   

&#x20;   -- ── Language Proficiency ──

&#x20;   language\_test\_type         TEXT CHECK (language\_test\_type IS NULL OR language\_test\_type IN ('ielts', 'toefl', 'pte', 'duolingo', 'gre', 'gmat', 'sat', 'none')),

&#x20;   language\_test\_score        TEXT,          -- '7.5' or '100'

&#x20;   language\_test\_date         DATE,

&#x20;   

&#x20;   -- ── Status \& Tracking ──

&#x20;   status                     student\_status NOT NULL DEFAULT 'lead',

&#x20;   source                     TEXT DEFAULT 'direct',  -- 'referral', 'website', 'social\_media', 'walk\_in', 'direct'

&#x20;   referred\_by                TEXT,

&#x20;   tags                       TEXT\[] DEFAULT '{}',     -- \['high\_priority', 'scholarship\_eligible', 'needs\_visa']

&#x20;   

&#x20;   -- ── Computed Fields (auto-calculated by trigger) ──

&#x20;   profile\_completeness       INTEGER NOT NULL DEFAULT 0 CHECK (profile\_completeness BETWEEN 0 AND 100),

&#x20;   total\_applications         INTEGER NOT NULL DEFAULT 0,

&#x20;   total\_documents            INTEGER NOT NULL DEFAULT 0,

&#x20;   

&#x20;   -- ── Notes \& Metadata ──

&#x20;   internal\_notes             TEXT,

&#x20;   metadata                   JSONB DEFAULT '{}',

&#x20;   

&#x20;   -- ── Timestamps ──

&#x20;   created\_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   updated\_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   deleted\_at                 TIMESTAMPTZ,     -- Soft delete

&#x20;   

&#x20;   -- ── Constraints ──

&#x20;   CONSTRAINT students\_first\_name\_not\_empty CHECK (length(trim(first\_name)) > 0),

&#x20;   CONSTRAINT students\_last\_name\_not\_empty CHECK (length(trim(last\_name)) > 0),

&#x20;   CONSTRAINT students\_email\_valid CHECK (email IS NULL OR email \~\* '^\[A-Za-z0-9.\_%+-]+@\[A-Za-z0-9.-]+\\.\[A-Za-z]{2,}$'),

&#x20;   CONSTRAINT students\_phone\_valid CHECK (length(phone) >= 10),

&#x20;   CONSTRAINT students\_budget\_valid CHECK (budget\_min IS NULL OR budget\_max IS NULL OR budget\_min <= budget\_max),

&#x20;   CONSTRAINT students\_dob\_valid CHECK (date\_of\_birth IS NULL OR (date\_of\_birth > '1940-01-01' AND date\_of\_birth < CURRENT\_DATE))

);



\-- Indexes for students

CREATE INDEX IF NOT EXISTS idx\_students\_freelancer ON students(freelancer\_id) WHERE deleted\_at IS NULL;

CREATE INDEX IF NOT EXISTS idx\_students\_status ON students(status) WHERE deleted\_at IS NULL;

CREATE INDEX IF NOT EXISTS idx\_students\_created ON students(created\_at DESC) WHERE deleted\_at IS NULL;

CREATE INDEX IF NOT EXISTS idx\_students\_search ON students USING gin(

&#x20;   to\_tsvector('english', 

&#x20;       coalesce(first\_name, '') || ' ' || 

&#x20;       coalesce(last\_name, '') || ' ' || 

&#x20;       coalesce(email, '') || ' ' || 

&#x20;       coalesce(phone, '')

&#x20;   )

);

CREATE INDEX IF NOT EXISTS idx\_students\_tags ON students USING gin(tags) WHERE deleted\_at IS NULL;



\-- Unique constraint: same freelancer can't have two students with same phone

CREATE UNIQUE INDEX IF NOT EXISTS idx\_students\_unique\_phone\_per\_freelancer 

&#x20;   ON students(freelancer\_id, phone) WHERE deleted\_at IS NULL;





\-- ================================================================

\-- TABLE 5: STUDENT DOCUMENTS

\-- ================================================================

CREATE TABLE IF NOT EXISTS student\_documents (

&#x20;   id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   student\_id        UUID NOT NULL REFERENCES students(id) ON DELETE CASCADE,

&#x20;   uploaded\_by       UUID NOT NULL REFERENCES profiles(id),

&#x20;   

&#x20;   -- ── Document Info ──

&#x20;   type              document\_type NOT NULL,

&#x20;   custom\_label      TEXT,              -- For 'other' type: "Birth Certificate"

&#x20;   description       TEXT,              -- Optional note about this document

&#x20;   

&#x20;   -- ── File Info ──

&#x20;   file\_name         TEXT NOT NULL,     -- Original file name

&#x20;   file\_path         TEXT NOT NULL,     -- Supabase Storage path (unique)

&#x20;   file\_size         BIGINT NOT NULL,   -- In bytes

&#x20;   mime\_type         TEXT NOT NULL,

&#x20;   file\_hash         TEXT,              -- SHA-256 hash to detect duplicates

&#x20;   

&#x20;   -- ── Verification ──

&#x20;   status            document\_status NOT NULL DEFAULT 'uploaded',

&#x20;   verified\_by       UUID REFERENCES profiles(id),

&#x20;   verified\_at       TIMESTAMPTZ,

&#x20;   rejection\_reason  TEXT,

&#x20;   

&#x20;   -- ── Validity Period ──

&#x20;   issued\_date       DATE,

&#x20;   expires\_at        DATE,

&#x20;   

&#x20;   -- ── Versioning ──

&#x20;   version           INTEGER NOT NULL DEFAULT 1,

&#x20;   is\_latest         BOOLEAN NOT NULL DEFAULT true,

&#x20;   previous\_version\_id UUID REFERENCES student\_documents(id),

&#x20;   

&#x20;   -- ── Timestamps ──

&#x20;   created\_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   updated\_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   deleted\_at        TIMESTAMPTZ,

&#x20;   

&#x20;   -- ── Constraints ──

&#x20;   CONSTRAINT docs\_file\_name\_not\_empty CHECK (length(trim(file\_name)) > 0),

&#x20;   CONSTRAINT docs\_file\_path\_not\_empty CHECK (length(trim(file\_path)) > 0),

&#x20;   CONSTRAINT docs\_file\_size\_valid CHECK (file\_size > 0 AND file\_size <= 10485760), -- Max 10MB

&#x20;   CONSTRAINT docs\_mime\_type\_valid CHECK (mime\_type IN (

&#x20;       'application/pdf',

&#x20;       'image/jpeg',

&#x20;       'image/png',

&#x20;       'image/webp',

&#x20;       'application/msword',

&#x20;       'application/vnd.openxmlformats-officedocument.wordprocessingml.document'

&#x20;   )),

&#x20;   CONSTRAINT docs\_custom\_label\_required CHECK (

&#x20;       type != 'other' OR (type = 'other' AND custom\_label IS NOT NULL AND length(trim(custom\_label)) > 0)

&#x20;   ),

&#x20;   CONSTRAINT docs\_expiry\_after\_issue CHECK (

&#x20;       issued\_date IS NULL OR expires\_at IS NULL OR expires\_at > issued\_date

&#x20;   )

);



\-- Indexes for documents

CREATE INDEX IF NOT EXISTS idx\_docs\_student ON student\_documents(student\_id) WHERE deleted\_at IS NULL AND is\_latest = true;

CREATE INDEX IF NOT EXISTS idx\_docs\_type ON student\_documents(student\_id, type) WHERE deleted\_at IS NULL AND is\_latest = true;

CREATE INDEX IF NOT EXISTS idx\_docs\_status ON student\_documents(status) WHERE deleted\_at IS NULL AND is\_latest = true;

CREATE INDEX IF NOT EXISTS idx\_docs\_expiry ON student\_documents(expires\_at) WHERE deleted\_at IS NULL AND is\_latest = true AND expires\_at IS NOT NULL;





\-- ================================================================

\-- TABLE 6: APPLICATIONS

\-- ================================================================

CREATE TABLE IF NOT EXISTS applications (

&#x20;   id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   student\_id        UUID NOT NULL REFERENCES students(id) ON DELETE RESTRICT,

&#x20;   freelancer\_id     UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,

&#x20;   university\_id     UUID NOT NULL REFERENCES universities(id) ON DELETE RESTRICT,

&#x20;   program\_id        UUID NOT NULL REFERENCES programs(id) ON DELETE RESTRICT,

&#x20;   

&#x20;   -- ── Application Details ──

&#x20;   intake            TEXT NOT NULL,           -- 'Fall 2025'

&#x20;   status            application\_status NOT NULL DEFAULT 'draft',

&#x20;   priority          INTEGER NOT NULL DEFAULT 0 CHECK (priority BETWEEN 0 AND 5),

&#x20;   

&#x20;   -- ── Financial: Application ──

&#x20;   application\_fee        DECIMAL(12,2) DEFAULT 0,

&#x20;   application\_fee\_currency TEXT DEFAULT 'USD',

&#x20;   application\_fee\_paid   BOOLEAN NOT NULL DEFAULT false,

&#x20;   application\_fee\_paid\_date DATE,

&#x20;   

&#x20;   -- ── Financial: Scholarship ──

&#x20;   scholarship\_applied    BOOLEAN NOT NULL DEFAULT false,

&#x20;   scholarship\_type       TEXT,              -- 'merit', 'need\_based', 'sports'

&#x20;   scholarship\_amount     DECIMAL(12,2),

&#x20;   scholarship\_currency   TEXT DEFAULT 'USD',

&#x20;   scholarship\_status     TEXT DEFAULT 'not\_applied' CHECK (scholarship\_status IN ('not\_applied', 'applied', 'awarded', 'rejected', 'partial')),

&#x20;   

&#x20;   -- ── Financial: Commission (freelancer earnings) ──

&#x20;   commission\_amount      DECIMAL(12,2),

&#x20;   commission\_currency    TEXT DEFAULT 'INR',

&#x20;   commission\_percentage  DECIMAL(5,2),      -- e.g., 15.00%

&#x20;   commission\_status      commission\_status NOT NULL DEFAULT 'not\_applicable',

&#x20;   commission\_paid\_at     TIMESTAMPTZ,

&#x20;   commission\_invoice\_id  TEXT,

&#x20;   commission\_notes       TEXT,

&#x20;   

&#x20;   -- ── Important Dates ──

&#x20;   submitted\_at           TIMESTAMPTZ,       -- When submitted to university

&#x20;   decision\_at            TIMESTAMPTZ,       -- When university decided

&#x20;   offer\_deadline         DATE,              -- Deadline to accept offer

&#x20;   enrollment\_at          TIMESTAMPTZ,       -- When enrollment confirmed

&#x20;   application\_deadline   DATE,              -- University's deadline for this intake

&#x20;   

&#x20;   -- ── University Reference ──

&#x20;   university\_application\_id TEXT,           -- University's tracking number

&#x20;   university\_portal\_url     TEXT,           -- Link to university portal

&#x20;   university\_contact\_email  TEXT,

&#x20;   university\_contact\_name   TEXT,

&#x20;   

&#x20;   -- ── Notes \& Conditions ──

&#x20;   internal\_notes         TEXT,              -- Freelancer's private notes

&#x20;   offer\_conditions       TEXT,              -- "Must achieve IELTS 7.0 before enrollment"

&#x20;   rejection\_reason       TEXT,

&#x20;   withdrawal\_reason      TEXT,

&#x20;   

&#x20;   -- ── Metadata ──

&#x20;   metadata               JSONB DEFAULT '{}',

&#x20;   

&#x20;   -- ── Timestamps ──

&#x20;   created\_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   updated\_at             TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   deleted\_at             TIMESTAMPTZ,

&#x20;   

&#x20;   -- ── Constraints ──

&#x20;   CONSTRAINT app\_intake\_not\_empty CHECK (length(trim(intake)) > 0),

&#x20;   CONSTRAINT app\_dates\_valid CHECK (

&#x20;       submitted\_at IS NULL OR decision\_at IS NULL OR decision\_at >= submitted\_at

&#x20;   ),

&#x20;   CONSTRAINT app\_commission\_valid CHECK (

&#x20;       commission\_percentage IS NULL OR (commission\_percentage >= 0 AND commission\_percentage <= 100)

&#x20;   )

);



\-- Indexes for applications

CREATE INDEX IF NOT EXISTS idx\_app\_student ON applications(student\_id) WHERE deleted\_at IS NULL;

CREATE INDEX IF NOT EXISTS idx\_app\_freelancer ON applications(freelancer\_id) WHERE deleted\_at IS NULL;

CREATE INDEX IF NOT EXISTS idx\_app\_status ON applications(status) WHERE deleted\_at IS NULL;

CREATE INDEX IF NOT EXISTS idx\_app\_university ON applications(university\_id) WHERE deleted\_at IS NULL;

CREATE INDEX IF NOT EXISTS idx\_app\_intake ON applications(intake) WHERE deleted\_at IS NULL;

CREATE INDEX IF NOT EXISTS idx\_app\_deadline ON applications(application\_deadline) WHERE deleted\_at IS NULL AND application\_deadline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx\_app\_created ON applications(created\_at DESC) WHERE deleted\_at IS NULL;



\-- Prevent duplicate: same student can't apply to same program+intake twice

CREATE UNIQUE INDEX IF NOT EXISTS idx\_app\_unique\_application 

&#x20;   ON applications(student\_id, program\_id, intake) WHERE deleted\_at IS NULL;





\-- ================================================================

\-- TABLE 7: APPLICATION DOCUMENTS (link table)

\-- ================================================================

CREATE TABLE IF NOT EXISTS application\_documents (

&#x20;   id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   application\_id    UUID NOT NULL REFERENCES applications(id) ON DELETE CASCADE,

&#x20;   document\_id       UUID NOT NULL REFERENCES student\_documents(id) ON DELETE RESTRICT,

&#x20;   

&#x20;   -- ── Link Details ──

&#x20;   is\_required       BOOLEAN NOT NULL DEFAULT false,

&#x20;   status            TEXT NOT NULL DEFAULT 'linked' CHECK (status IN ('linked', 'submitted', 'accepted', 'rejected', 'needs\_reupload')),

&#x20;   

&#x20;   -- ── Notes ──

&#x20;   notes             TEXT,

&#x20;   rejection\_reason  TEXT,

&#x20;   

&#x20;   -- ── Timestamps ──

&#x20;   linked\_at         TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   submitted\_at      TIMESTAMPTZ,

&#x20;   reviewed\_at       TIMESTAMPTZ,

&#x20;   

&#x20;   -- ── Constraints ──

&#x20;   CONSTRAINT app\_docs\_unique UNIQUE(application\_id, document\_id)

);



CREATE INDEX IF NOT EXISTS idx\_app\_docs\_application ON application\_documents(application\_id);

CREATE INDEX IF NOT EXISTS idx\_app\_docs\_document ON application\_documents(document\_id);





\-- ================================================================

\-- TABLE 8: STATUS HISTORY (audit trail)

\-- ================================================================

CREATE TABLE IF NOT EXISTS status\_history (

&#x20;   id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   

&#x20;   -- ── What Changed ──

&#x20;   entity\_type       TEXT NOT NULL CHECK (entity\_type IN ('student', 'application', 'document')),

&#x20;   entity\_id         UUID NOT NULL,

&#x20;   

&#x20;   -- ── Status Change ──

&#x20;   from\_status       TEXT,               -- NULL for initial creation

&#x20;   to\_status         TEXT NOT NULL,

&#x20;   

&#x20;   -- ── Who \& Why ──

&#x20;   changed\_by        UUID NOT NULL REFERENCES profiles(id),

&#x20;   reason            TEXT,

&#x20;   

&#x20;   -- ── Context ──

&#x20;   metadata          JSONB DEFAULT '{}',

&#x20;   ip\_address        INET,

&#x20;   

&#x20;   -- ── Timestamp ──

&#x20;   created\_at        TIMESTAMPTZ NOT NULL DEFAULT now()

);



\-- Indexes for status\_history

CREATE INDEX IF NOT EXISTS idx\_status\_entity ON status\_history(entity\_type, entity\_id, created\_at DESC);

CREATE INDEX IF NOT EXISTS idx\_status\_changed\_by ON status\_history(changed\_by, created\_at DESC);

CREATE INDEX IF NOT EXISTS idx\_status\_time ON status\_history(created\_at DESC);





\-- ================================================================

\-- TABLE 9: ACTIVITY LOG (all notable actions)

\-- ================================================================

CREATE TABLE IF NOT EXISTS activity\_log (

&#x20;   id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   actor\_id          UUID NOT NULL REFERENCES profiles(id),

&#x20;   

&#x20;   -- ── What Happened ──

&#x20;   action            TEXT NOT NULL,       -- 'student.created', 'document.uploaded', 'application.status\_changed'

&#x20;   entity\_type       TEXT NOT NULL,       -- 'student', 'application', 'document'

&#x20;   entity\_id         UUID NOT NULL,

&#x20;   

&#x20;   -- ── Human Readable ──

&#x20;   title             TEXT NOT NULL,       -- Short: "Student Created"

&#x20;   description       TEXT,               -- Long: "John created student Rahul Sharma"

&#x20;   

&#x20;   -- ── Related Entities ──

&#x20;   related\_entities  JSONB DEFAULT '{}',  -- {"student\_id": "...", "application\_id": "..."}

&#x20;   

&#x20;   -- ── Context ──

&#x20;   metadata          JSONB DEFAULT '{}',

&#x20;   ip\_address        INET,

&#x20;   user\_agent        TEXT,

&#x20;   

&#x20;   -- ── Timestamp ──

&#x20;   created\_at        TIMESTAMPTZ NOT NULL DEFAULT now()

);



\-- Indexes for activity\_log

CREATE INDEX IF NOT EXISTS idx\_activity\_actor ON activity\_log(actor\_id, created\_at DESC);

CREATE INDEX IF NOT EXISTS idx\_activity\_entity ON activity\_log(entity\_type, entity\_id, created\_at DESC);

CREATE INDEX IF NOT EXISTS idx\_activity\_action ON activity\_log(action, created\_at DESC);

CREATE INDEX IF NOT EXISTS idx\_activity\_time ON activity\_log(created\_at DESC);





\-- ================================================================

\-- TABLE 10: NOTIFICATIONS (future use, create now)

\-- ================================================================

CREATE TABLE IF NOT EXISTS notifications (

&#x20;   id                UUID PRIMARY KEY DEFAULT uuid\_generate\_v4(),

&#x20;   user\_id           UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

&#x20;   

&#x20;   -- ── Notification Content ──

&#x20;   type              TEXT NOT NULL,       -- 'deadline\_approaching', 'status\_changed', 'document\_expired'

&#x20;   title             TEXT NOT NULL,

&#x20;   message           TEXT NOT NULL,

&#x20;   

&#x20;   -- ── Reference ──

&#x20;   entity\_type       TEXT,

&#x20;   entity\_id         UUID,

&#x20;   action\_url        TEXT,               -- '/students/123/applications/456'

&#x20;   

&#x20;   -- ── Status ──

&#x20;   is\_read           BOOLEAN NOT NULL DEFAULT false,

&#x20;   read\_at           TIMESTAMPTZ,

&#x20;   

&#x20;   -- ── Timestamps ──

&#x20;   created\_at        TIMESTAMPTZ NOT NULL DEFAULT now(),

&#x20;   expires\_at        TIMESTAMPTZ          -- Auto-cleanup old notifications

);



CREATE INDEX IF NOT EXISTS idx\_notifications\_user ON notifications(user\_id, is\_read, created\_at DESC);

4\. DATABASE — TRIGGERS \& FUNCTIONS

AGENT: Run this AFTER the schema above. These triggers enforce business rules at the database level. They are the safety net — even if the API has a bug, the database will enforce correctness.



SQL



\-- ================================================================

\-- FUNCTION: Auto-update updated\_at timestamp

\-- ================================================================

CREATE OR REPLACE FUNCTION fn\_update\_timestamp()

RETURNS TRIGGER AS $$

BEGIN

&#x20;   NEW.updated\_at = now();

&#x20;   RETURN NEW;

END;

$$ LANGUAGE plpgsql;



\-- Apply to all tables with updated\_at

CREATE TRIGGER trg\_profiles\_timestamp BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION fn\_update\_timestamp();

CREATE TRIGGER trg\_universities\_timestamp BEFORE UPDATE ON universities FOR EACH ROW EXECUTE FUNCTION fn\_update\_timestamp();

CREATE TRIGGER trg\_programs\_timestamp BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION fn\_update\_timestamp();

CREATE TRIGGER trg\_students\_timestamp BEFORE UPDATE ON students FOR EACH ROW EXECUTE FUNCTION fn\_update\_timestamp();

CREATE TRIGGER trg\_documents\_timestamp BEFORE UPDATE ON student\_documents FOR EACH ROW EXECUTE FUNCTION fn\_update\_timestamp();

CREATE TRIGGER trg\_applications\_timestamp BEFORE UPDATE ON applications FOR EACH ROW EXECUTE FUNCTION fn\_update\_timestamp();





\-- ================================================================

\-- FUNCTION: Calculate student profile completeness (0-100)

\-- ================================================================

CREATE OR REPLACE FUNCTION fn\_calculate\_profile\_completeness()

RETURNS TRIGGER AS $$

DECLARE

&#x20;   total\_fields INTEGER := 20;

&#x20;   filled INTEGER := 0;

BEGIN

&#x20;   -- Personal (7 fields)

&#x20;   IF NEW.first\_name IS NOT NULL AND trim(NEW.first\_name) != '' THEN filled := filled + 1; END IF;

&#x20;   IF NEW.last\_name IS NOT NULL AND trim(NEW.last\_name) != '' THEN filled := filled + 1; END IF;

&#x20;   IF NEW.email IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF NEW.phone IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF NEW.date\_of\_birth IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF NEW.gender IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF NEW.nationality IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   

&#x20;   -- Address (4 fields)

&#x20;   IF NEW.address\_line1 IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF NEW.city IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF NEW.state\_province IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF NEW.postal\_code IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   

&#x20;   -- Emergency (2 fields)

&#x20;   IF NEW.emergency\_contact\_name IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF NEW.emergency\_contact\_phone IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   

&#x20;   -- Academic Background (4 fields)

&#x20;   IF NEW.highest\_education IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF NEW.highest\_education\_field IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF NEW.highest\_education\_institute IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF NEW.highest\_education\_year IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   

&#x20;   -- Preferences (3 fields)

&#x20;   IF NEW.preferred\_degree\_level IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF NEW.preferred\_field IS NOT NULL THEN filled := filled + 1; END IF;

&#x20;   IF array\_length(NEW.preferred\_countries, 1) > 0 THEN filled := filled + 1; END IF;

&#x20;   

&#x20;   NEW.profile\_completeness := ROUND((filled::NUMERIC / total\_fields) \* 100);

&#x20;   RETURN NEW;

END;

$$ LANGUAGE plpgsql;



CREATE TRIGGER trg\_profile\_completeness

&#x20;   BEFORE INSERT OR UPDATE ON students

&#x20;   FOR EACH ROW EXECUTE FUNCTION fn\_calculate\_profile\_completeness();





\-- ================================================================

\-- FUNCTION: Auto-sync student status when application changes

\-- ================================================================

CREATE OR REPLACE FUNCTION fn\_sync\_student\_status()

RETURNS TRIGGER AS $$

DECLARE

&#x20;   has\_enrolled BOOLEAN;

&#x20;   has\_active BOOLEAN;

&#x20;   current\_student\_status student\_status;

BEGIN

&#x20;   -- Get current student status

&#x20;   SELECT status INTO current\_student\_status FROM students WHERE id = NEW.student\_id;

&#x20;   

&#x20;   -- Don't downgrade from 'enrolled' unless explicitly archived

&#x20;   IF current\_student\_status = 'enrolled' AND NEW.status != 'enrolled' THEN

&#x20;       -- Check if ANY other application is enrolled

&#x20;       SELECT EXISTS(

&#x20;           SELECT 1 FROM applications 

&#x20;           WHERE student\_id = NEW.student\_id 

&#x20;           AND id != NEW.id 

&#x20;           AND status = 'enrolled' 

&#x20;           AND deleted\_at IS NULL

&#x20;       ) INTO has\_enrolled;

&#x20;       

&#x20;       IF has\_enrolled THEN

&#x20;           RETURN NEW; -- Keep student as enrolled

&#x20;       END IF;

&#x20;   END IF;

&#x20;   

&#x20;   -- If this application is enrolled → student is enrolled

&#x20;   IF NEW.status = 'enrolled' THEN

&#x20;       UPDATE students SET status = 'enrolled' WHERE id = NEW.student\_id AND status != 'archived';

&#x20;       RETURN NEW;

&#x20;   END IF;

&#x20;   

&#x20;   -- If student is a lead and now has an application → active

&#x20;   IF current\_student\_status = 'lead' THEN

&#x20;       UPDATE students SET status = 'active' WHERE id = NEW.student\_id;

&#x20;       RETURN NEW;

&#x20;   END IF;

&#x20;   

&#x20;   -- Check if all applications are terminal (no active ones left)

&#x20;   SELECT EXISTS(

&#x20;       SELECT 1 FROM applications

&#x20;       WHERE student\_id = NEW.student\_id

&#x20;       AND deleted\_at IS NULL

&#x20;       AND status NOT IN ('rejected', 'withdrawn', 'offer\_declined', 'enrolled')

&#x20;   ) INTO has\_active;

&#x20;   

&#x20;   IF NOT has\_active AND current\_student\_status = 'active' THEN

&#x20;       UPDATE students SET status = 'inactive' WHERE id = NEW.student\_id;

&#x20;   END IF;

&#x20;   

&#x20;   RETURN NEW;

END;

$$ LANGUAGE plpgsql;



CREATE TRIGGER trg\_sync\_student\_status

&#x20;   AFTER INSERT OR UPDATE OF status ON applications

&#x20;   FOR EACH ROW EXECUTE FUNCTION fn\_sync\_student\_status();





\-- ================================================================

\-- FUNCTION: Update student counters (total\_applications, total\_documents)

\-- ================================================================

CREATE OR REPLACE FUNCTION fn\_update\_student\_app\_count()

RETURNS TRIGGER AS $$

DECLARE

&#x20;   sid UUID;

BEGIN

&#x20;   sid := COALESCE(NEW.student\_id, OLD.student\_id);

&#x20;   UPDATE students SET total\_applications = (

&#x20;       SELECT COUNT(\*) FROM applications WHERE student\_id = sid AND deleted\_at IS NULL

&#x20;   ) WHERE id = sid;

&#x20;   RETURN NEW;

END;

$$ LANGUAGE plpgsql;



CREATE TRIGGER trg\_update\_app\_count

&#x20;   AFTER INSERT OR UPDATE OR DELETE ON applications

&#x20;   FOR EACH ROW EXECUTE FUNCTION fn\_update\_student\_app\_count();



CREATE OR REPLACE FUNCTION fn\_update\_student\_doc\_count()

RETURNS TRIGGER AS $$

DECLARE

&#x20;   sid UUID;

BEGIN

&#x20;   sid := COALESCE(NEW.student\_id, OLD.student\_id);

&#x20;   UPDATE students SET total\_documents = (

&#x20;       SELECT COUNT(\*) FROM student\_documents WHERE student\_id = sid AND deleted\_at IS NULL AND is\_latest = true

&#x20;   ) WHERE id = sid;

&#x20;   RETURN NEW;

END;

$$ LANGUAGE plpgsql;



CREATE TRIGGER trg\_update\_doc\_count

&#x20;   AFTER INSERT OR UPDATE OR DELETE ON student\_documents

&#x20;   FOR EACH ROW EXECUTE FUNCTION fn\_update\_student\_doc\_count();





\-- ================================================================

\-- FUNCTION: Auto-log status changes to status\_history

\-- ================================================================

CREATE OR REPLACE FUNCTION fn\_log\_status\_change()

RETURNS TRIGGER AS $$

BEGIN

&#x20;   IF OLD.status IS DISTINCT FROM NEW.status THEN

&#x20;       INSERT INTO status\_history (entity\_type, entity\_id, from\_status, to\_status, changed\_by, metadata)

&#x20;       VALUES (

&#x20;           TG\_ARGV\[0],

&#x20;           NEW.id,

&#x20;           OLD.status::TEXT,

&#x20;           NEW.status::TEXT,

&#x20;           COALESCE(

&#x20;               current\_setting('app.current\_user\_id', true)::UUID,

&#x20;               CASE WHEN TG\_ARGV\[0] = 'application' THEN NEW.freelancer\_id

&#x20;                    WHEN TG\_ARGV\[0] = 'student' THEN NEW.freelancer\_id

&#x20;                    ELSE NULL

&#x20;               END

&#x20;           ),

&#x20;           jsonb\_build\_object('trigger', 'auto', 'table', TG\_TABLE\_NAME)

&#x20;       );

&#x20;   END IF;

&#x20;   RETURN NEW;

END;

$$ LANGUAGE plpgsql;



CREATE TRIGGER trg\_student\_status\_log

&#x20;   AFTER UPDATE OF status ON students

&#x20;   FOR EACH ROW EXECUTE FUNCTION fn\_log\_status\_change('student');



CREATE TRIGGER trg\_app\_status\_log

&#x20;   AFTER UPDATE OF status ON applications

&#x20;   FOR EACH ROW EXECUTE FUNCTION fn\_log\_status\_change('application');



CREATE TRIGGER trg\_doc\_status\_log

&#x20;   AFTER UPDATE OF status ON student\_documents

&#x20;   FOR EACH ROW EXECUTE FUNCTION fn\_log\_status\_change('document');





\-- ================================================================

\-- FUNCTION: Log initial status on INSERT

\-- ================================================================

CREATE OR REPLACE FUNCTION fn\_log\_initial\_status()

RETURNS TRIGGER AS $$

BEGIN

&#x20;   INSERT INTO status\_history (entity\_type, entity\_id, from\_status, to\_status, changed\_by, metadata)

&#x20;   VALUES (

&#x20;       TG\_ARGV\[0],

&#x20;       NEW.id,

&#x20;       NULL,

&#x20;       NEW.status::TEXT,

&#x20;       COALESCE(

&#x20;           current\_setting('app.current\_user\_id', true)::UUID,

&#x20;           CASE WHEN TG\_ARGV\[0] = 'application' THEN NEW.freelancer\_id

&#x20;                WHEN TG\_ARGV\[0] = 'student' THEN NEW.freelancer\_id

&#x20;                ELSE NEW.uploaded\_by

&#x20;           END

&#x20;       ),

&#x20;       jsonb\_build\_object('trigger', 'initial\_creation')

&#x20;   );

&#x20;   RETURN NEW;

END;

$$ LANGUAGE plpgsql;



CREATE TRIGGER trg\_student\_initial\_status

&#x20;   AFTER INSERT ON students

&#x20;   FOR EACH ROW EXECUTE FUNCTION fn\_log\_initial\_status('student');



CREATE TRIGGER trg\_app\_initial\_status

&#x20;   AFTER INSERT ON applications

&#x20;   FOR EACH ROW EXECUTE FUNCTION fn\_log\_initial\_status('application');



CREATE TRIGGER trg\_doc\_initial\_status

&#x20;   AFTER INSERT ON student\_documents

&#x20;   FOR EACH ROW EXECUTE FUNCTION fn\_log\_initial\_status('document');





\-- ================================================================

\-- FUNCTION: Set application.submitted\_at when status → submitted

\-- ================================================================

CREATE OR REPLACE FUNCTION fn\_set\_application\_dates()

RETURNS TRIGGER AS $$

BEGIN

&#x20;   -- Set submitted\_at

&#x20;   IF NEW.status = 'submitted' AND OLD.status != 'submitted' AND NEW.submitted\_at IS NULL THEN

&#x20;       NEW.submitted\_at = now();

&#x20;   END IF;

&#x20;   

&#x20;   -- Set decision\_at (for offer/rejection)

&#x20;   IF NEW.status IN ('conditional\_offer', 'unconditional\_offer', 'rejected') 

&#x20;      AND OLD.status NOT IN ('conditional\_offer', 'unconditional\_offer', 'rejected')

&#x20;      AND NEW.decision\_at IS NULL THEN

&#x20;       NEW.decision\_at = now();

&#x20;   END IF;

&#x20;   

&#x20;   -- Set enrollment\_at

&#x20;   IF NEW.status = 'enrolled' AND OLD.status != 'enrolled' AND NEW.enrollment\_at IS NULL THEN

&#x20;       NEW.enrollment\_at = now();

&#x20;   END IF;

&#x20;   

&#x20;   RETURN NEW;

END;

$$ LANGUAGE plpgsql;



CREATE TRIGGER trg\_set\_app\_dates

&#x20;   BEFORE UPDATE OF status ON applications

&#x20;   FOR EACH ROW EXECUTE FUNCTION fn\_set\_application\_dates();





\-- ================================================================

\-- FUNCTION: Prevent deletion of student with active applications

\-- ================================================================

CREATE OR REPLACE FUNCTION fn\_prevent\_student\_delete\_with\_active\_apps()

RETURNS TRIGGER AS $$

DECLARE

&#x20;   active\_count INTEGER;

BEGIN

&#x20;   IF NEW.deleted\_at IS NOT NULL AND OLD.deleted\_at IS NULL THEN

&#x20;       SELECT COUNT(\*) INTO active\_count FROM applications

&#x20;       WHERE student\_id = NEW.id

&#x20;       AND deleted\_at IS NULL

&#x20;       AND status NOT IN ('rejected', 'withdrawn', 'offer\_declined');

&#x20;       

&#x20;       IF active\_count > 0 THEN

&#x20;           RAISE EXCEPTION 'Cannot delete student with % active application(s). Withdraw or close them first.', active\_count;

&#x20;       END IF;

&#x20;   END IF;

&#x20;   RETURN NEW;

END;

$$ LANGUAGE plpgsql;



CREATE TRIGGER trg\_prevent\_student\_delete

&#x20;   BEFORE UPDATE OF deleted\_at ON students

&#x20;   FOR EACH ROW EXECUTE FUNCTION fn\_prevent\_student\_delete\_with\_active\_apps();





\-- ================================================================

\-- MATERIALIZED VIEW: Dashboard stats per freelancer

\-- ================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv\_dashboard\_stats AS

SELECT

&#x20;   p.id AS freelancer\_id,

&#x20;   

&#x20;   -- Student counts

&#x20;   COUNT(DISTINCT s.id) FILTER (WHERE s.deleted\_at IS NULL) AS total\_students,

&#x20;   COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'lead' AND s.deleted\_at IS NULL) AS lead\_count,

&#x20;   COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'active' AND s.deleted\_at IS NULL) AS active\_student\_count,

&#x20;   COUNT(DISTINCT s.id) FILTER (WHERE s.status = 'enrolled' AND s.deleted\_at IS NULL) AS enrolled\_student\_count,

&#x20;   

&#x20;   -- Application counts

&#x20;   COUNT(DISTINCT a.id) FILTER (WHERE a.deleted\_at IS NULL) AS total\_applications,

&#x20;   COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'draft' AND a.deleted\_at IS NULL) AS draft\_app\_count,

&#x20;   COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'submitted' AND a.deleted\_at IS NULL) AS submitted\_app\_count,

&#x20;   COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'under\_review' AND a.deleted\_at IS NULL) AS under\_review\_app\_count,

&#x20;   COUNT(DISTINCT a.id) FILTER (WHERE a.status IN ('conditional\_offer', 'unconditional\_offer') AND a.deleted\_at IS NULL) AS offer\_count,

&#x20;   COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'enrolled' AND a.deleted\_at IS NULL) AS enrolled\_app\_count,

&#x20;   COUNT(DISTINCT a.id) FILTER (WHERE a.status = 'rejected' AND a.deleted\_at IS NULL) AS rejected\_app\_count,

&#x20;   

&#x20;   -- Commission

&#x20;   COALESCE(SUM(a.commission\_amount) FILTER (WHERE a.commission\_status = 'paid' AND a.deleted\_at IS NULL), 0) AS total\_commission\_earned,

&#x20;   COALESCE(SUM(a.commission\_amount) FILTER (WHERE a.commission\_status = 'pending' AND a.deleted\_at IS NULL), 0) AS pending\_commission,

&#x20;   COALESCE(SUM(a.commission\_amount) FILTER (WHERE a.commission\_status = 'approved' AND a.deleted\_at IS NULL), 0) AS approved\_commission,

&#x20;   

&#x20;   -- Deadlines (upcoming)

&#x20;   COUNT(DISTINCT a.id) FILTER (

&#x20;       WHERE a.application\_deadline IS NOT NULL 

&#x20;       AND a.application\_deadline BETWEEN CURRENT\_DATE AND CURRENT\_DATE + INTERVAL '30 days'

&#x20;       AND a.status NOT IN ('enrolled', 'rejected', 'withdrawn', 'offer\_declined')

&#x20;       AND a.deleted\_at IS NULL

&#x20;   ) AS upcoming\_deadline\_count,

&#x20;   

&#x20;   now() AS last\_refreshed



FROM profiles p

LEFT JOIN students s ON s.freelancer\_id = p.id

LEFT JOIN applications a ON a.freelancer\_id = p.id

WHERE p.role = 'freelancer' AND p.is\_active = true

GROUP BY p.id;



CREATE UNIQUE INDEX IF NOT EXISTS idx\_mv\_dashboard\_freelancer ON mv\_dashboard\_stats(freelancer\_id);



\-- Function to refresh the view

CREATE OR REPLACE FUNCTION fn\_refresh\_dashboard\_stats()

RETURNS void AS $$

BEGIN

&#x20;   REFRESH MATERIALIZED VIEW CONCURRENTLY mv\_dashboard\_stats;

END;

$$ LANGUAGE plpgsql;

5\. DATABASE — ROW LEVEL SECURITY

AGENT: RLS is what prevents Freelancer A from seeing Freelancer B's students. This is CRITICAL. Enable RLS on every table and add these policies.



SQL



\-- ================================================================

\-- ENABLE RLS ON ALL TABLES

\-- ================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE students ENABLE ROW LEVEL SECURITY;

ALTER TABLE student\_documents ENABLE ROW LEVEL SECURITY;

ALTER TABLE applications ENABLE ROW LEVEL SECURITY;

ALTER TABLE application\_documents ENABLE ROW LEVEL SECURITY;

ALTER TABLE status\_history ENABLE ROW LEVEL SECURITY;

ALTER TABLE activity\_log ENABLE ROW LEVEL SECURITY;

ALTER TABLE universities ENABLE ROW LEVEL SECURITY;

ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;



\-- ================================================================

\-- HELPER FUNCTION: Get current user's role

\-- ================================================================

CREATE OR REPLACE FUNCTION auth.user\_role()

RETURNS user\_role AS $$

&#x20;   SELECT role FROM profiles WHERE id = auth.uid();

$$ LANGUAGE sql SECURITY DEFINER STABLE;



\-- Helper: Is the user an admin or above?

CREATE OR REPLACE FUNCTION auth.is\_admin\_or\_above()

RETURNS BOOLEAN AS $$

&#x20;   SELECT role IN ('admin', 'super\_admin') FROM profiles WHERE id = auth.uid();

$$ LANGUAGE sql SECURITY DEFINER STABLE;



\-- Helper: Is the user a manager or above?

CREATE OR REPLACE FUNCTION auth.is\_manager\_or\_above()

RETURNS BOOLEAN AS $$

&#x20;   SELECT role IN ('manager', 'admin', 'super\_admin') FROM profiles WHERE id = auth.uid();

$$ LANGUAGE sql SECURITY DEFINER STABLE;





\-- ================================================================

\-- PROFILES POLICIES

\-- ================================================================

CREATE POLICY "users\_read\_own\_profile" ON profiles

&#x20;   FOR SELECT TO authenticated

&#x20;   USING (id = auth.uid() OR auth.is\_manager\_or\_above());



CREATE POLICY "users\_update\_own\_profile" ON profiles

&#x20;   FOR UPDATE TO authenticated

&#x20;   USING (id = auth.uid())

&#x20;   WITH CHECK (id = auth.uid());





\-- ================================================================

\-- STUDENTS POLICIES

\-- ================================================================

\-- Freelancers: CRUD only their own students

\-- Managers/Admins: See all students

CREATE POLICY "students\_select" ON students

&#x20;   FOR SELECT TO authenticated

&#x20;   USING (

&#x20;       deleted\_at IS NULL AND (

&#x20;           freelancer\_id = auth.uid() OR auth.is\_manager\_or\_above()

&#x20;       )

&#x20;   );



CREATE POLICY "students\_insert" ON students

&#x20;   FOR INSERT TO authenticated

&#x20;   WITH CHECK (freelancer\_id = auth.uid());



CREATE POLICY "students\_update" ON students

&#x20;   FOR UPDATE TO authenticated

&#x20;   USING (freelancer\_id = auth.uid() OR auth.is\_manager\_or\_above())

&#x20;   WITH CHECK (freelancer\_id = auth.uid() OR auth.is\_manager\_or\_above());



CREATE POLICY "students\_delete" ON students

&#x20;   FOR DELETE TO authenticated

&#x20;   USING (freelancer\_id = auth.uid() OR auth.is\_admin\_or\_above());





\-- ================================================================

\-- APPLICATIONS POLICIES

\-- ================================================================

CREATE POLICY "applications\_select" ON applications

&#x20;   FOR SELECT TO authenticated

&#x20;   USING (

&#x20;       deleted\_at IS NULL AND (

&#x20;           freelancer\_id = auth.uid() OR auth.is\_manager\_or\_above()

&#x20;       )

&#x20;   );



CREATE POLICY "applications\_insert" ON applications

&#x20;   FOR INSERT TO authenticated

&#x20;   WITH CHECK (freelancer\_id = auth.uid());



CREATE POLICY "applications\_update" ON applications

&#x20;   FOR UPDATE TO authenticated

&#x20;   USING (freelancer\_id = auth.uid() OR auth.is\_manager\_or\_above())

&#x20;   WITH CHECK (freelancer\_id = auth.uid() OR auth.is\_manager\_or\_above());



CREATE POLICY "applications\_delete" ON applications

&#x20;   FOR DELETE TO authenticated

&#x20;   USING (freelancer\_id = auth.uid() OR auth.is\_admin\_or\_above());





\-- ================================================================

\-- STUDENT DOCUMENTS POLICIES

\-- ================================================================

CREATE POLICY "documents\_select" ON student\_documents

&#x20;   FOR SELECT TO authenticated

&#x20;   USING (

&#x20;       deleted\_at IS NULL AND (

&#x20;           uploaded\_by = auth.uid() 

&#x20;           OR student\_id IN (SELECT id FROM students WHERE freelancer\_id = auth.uid())

&#x20;           OR auth.is\_manager\_or\_above()

&#x20;       )

&#x20;   );



CREATE POLICY "documents\_insert" ON student\_documents

&#x20;   FOR INSERT TO authenticated

&#x20;   WITH CHECK (

&#x20;       uploaded\_by = auth.uid()

&#x20;       AND student\_id IN (SELECT id FROM students WHERE freelancer\_id = auth.uid())

&#x20;   );



CREATE POLICY "documents\_update" ON student\_documents

&#x20;   FOR UPDATE TO authenticated

&#x20;   USING (

&#x20;       uploaded\_by = auth.uid()

&#x20;       OR student\_id IN (SELECT id FROM students WHERE freelancer\_id = auth.uid())

&#x20;       OR auth.is\_manager\_or\_above()

&#x20;   );



CREATE POLICY "documents\_delete" ON student\_documents

&#x20;   FOR DELETE TO authenticated

&#x20;   USING (

&#x20;       uploaded\_by = auth.uid() OR auth.is\_admin\_or\_above()

&#x20;   );





\-- ================================================================

\-- APPLICATION DOCUMENTS POLICIES

\-- ================================================================

CREATE POLICY "app\_docs\_select" ON application\_documents

&#x20;   FOR SELECT TO authenticated

&#x20;   USING (

&#x20;       application\_id IN (

&#x20;           SELECT id FROM applications WHERE freelancer\_id = auth.uid() AND deleted\_at IS NULL

&#x20;       )

&#x20;       OR auth.is\_manager\_or\_above()

&#x20;   );



CREATE POLICY "app\_docs\_insert" ON application\_documents

&#x20;   FOR INSERT TO authenticated

&#x20;   WITH CHECK (

&#x20;       application\_id IN (

&#x20;           SELECT id FROM applications WHERE freelancer\_id = auth.uid() AND deleted\_at IS NULL

&#x20;       )

&#x20;   );



CREATE POLICY "app\_docs\_delete" ON application\_documents

&#x20;   FOR DELETE TO authenticated

&#x20;   USING (

&#x20;       application\_id IN (

&#x20;           SELECT id FROM applications WHERE freelancer\_id = auth.uid() AND deleted\_at IS NULL

&#x20;       )

&#x20;       OR auth.is\_admin\_or\_above()

&#x20;   );





\-- ================================================================

\-- STATUS HISTORY POLICIES

\-- ================================================================

CREATE POLICY "status\_history\_select" ON status\_history

&#x20;   FOR SELECT TO authenticated

&#x20;   USING (

&#x20;       changed\_by = auth.uid()

&#x20;       OR auth.is\_manager\_or\_above()

&#x20;       OR (entity\_type = 'student' AND entity\_id IN (SELECT id FROM students WHERE freelancer\_id = auth.uid()))

&#x20;       OR (entity\_type = 'application' AND entity\_id IN (SELECT id FROM applications WHERE freelancer\_id = auth.uid()))

&#x20;   );



\-- Insert is done by triggers, so allow service role

CREATE POLICY "status\_history\_insert" ON status\_history

&#x20;   FOR INSERT TO authenticated

&#x20;   WITH CHECK (true);  -- Triggers handle the insert; validate at app layer





\-- ================================================================

\-- ACTIVITY LOG POLICIES

\-- ================================================================

CREATE POLICY "activity\_log\_select" ON activity\_log

&#x20;   FOR SELECT TO authenticated

&#x20;   USING (actor\_id = auth.uid() OR auth.is\_manager\_or\_above());



CREATE POLICY "activity\_log\_insert" ON activity\_log

&#x20;   FOR INSERT TO authenticated

&#x20;   WITH CHECK (actor\_id = auth.uid());





\-- ================================================================

\-- UNIVERSITIES \& PROGRAMS POLICIES (read-only for non-admins)

\-- ================================================================

CREATE POLICY "universities\_read" ON universities

&#x20;   FOR SELECT TO authenticated

&#x20;   USING (is\_active = true OR auth.is\_admin\_or\_above());



CREATE POLICY "universities\_write" ON universities

&#x20;   FOR ALL TO authenticated

&#x20;   USING (auth.is\_admin\_or\_above())

&#x20;   WITH CHECK (auth.is\_admin\_or\_above());



CREATE POLICY "programs\_read" ON programs

&#x20;   FOR SELECT TO authenticated

&#x20;   USING (is\_active = true OR auth.is\_admin\_or\_above());



CREATE POLICY "programs\_write" ON programs

&#x20;   FOR ALL TO authenticated

&#x20;   USING (auth.is\_admin\_or\_above())

&#x20;   WITH CHECK (auth.is\_admin\_or\_above());





\-- ================================================================

\-- NOTIFICATIONS POLICIES

\-- ================================================================

CREATE POLICY "notifications\_own" ON notifications

&#x20;   FOR ALL TO authenticated

&#x20;   USING (user\_id = auth.uid())

&#x20;   WITH CHECK (user\_id = auth.uid());





\-- ================================================================

\-- SUPABASE STORAGE POLICIES

\-- ================================================================

\-- Create bucket first (do this in Supabase Dashboard or via API):

\-- Bucket name: student-documents

\-- Public: false

\-- File size limit: 10MB

\-- Allowed MIME types: application/pdf, image/jpeg, image/png, image/webp, application/msword, application/vnd.openxmlformats-officedocument.wordprocessingml.document



\-- Storage path convention: {freelancer\_id}/{student\_id}/{doc\_type}/{timestamp}\_{filename}



\-- Upload policy: only to your own folder

CREATE POLICY "storage\_upload" ON storage.objects

&#x20;   FOR INSERT TO authenticated

&#x20;   WITH CHECK (

&#x20;       bucket\_id = 'student-documents'

&#x20;       AND (storage.foldername(name))\[1] = auth.uid()::text

&#x20;   );



\-- Read policy: only your own folder (or admin)

CREATE POLICY "storage\_read" ON storage.objects

&#x20;   FOR SELECT TO authenticated

&#x20;   USING (

&#x20;       bucket\_id = 'student-documents'

&#x20;       AND (

&#x20;           (storage.foldername(name))\[1] = auth.uid()::text

&#x20;           OR auth.is\_manager\_or\_above()

&#x20;       )

&#x20;   );



\-- Update policy

CREATE POLICY "storage\_update" ON storage.objects

&#x20;   FOR UPDATE TO authenticated

&#x20;   USING (

&#x20;       bucket\_id = 'student-documents'

&#x20;       AND (storage.foldername(name))\[1] = auth.uid()::text

&#x20;   );



\-- Delete policy

CREATE POLICY "storage\_delete" ON storage.objects

&#x20;   FOR DELETE TO authenticated

&#x20;   USING (

&#x20;       bucket\_id = 'student-documents'

&#x20;       AND (

&#x20;           (storage.foldername(name))\[1] = auth.uid()::text

&#x20;           OR auth.is\_admin\_or\_above()

&#x20;       )

&#x20;   );

6\. DATABASE — SEED DATA

AGENT: Insert this sample data for development and testing. Do this AFTER schema + triggers + RLS.



SQL



\-- ================================================================

\-- SEED: Universities \& Programs

\-- ================================================================

INSERT INTO universities (id, name, short\_name, country, city, is\_partner, is\_active) VALUES

&#x20;   ('11111111-1111-1111-1111-111111111101', 'Indian Institute of Management Bangalore', 'IIM-B', 'India', 'Bangalore', true, true),

&#x20;   ('11111111-1111-1111-1111-111111111102', 'Indian Institute of Technology Delhi', 'IIT-D', 'India', 'New Delhi', true, true),

&#x20;   ('11111111-1111-1111-1111-111111111103', 'University of Toronto', 'UofT', 'Canada', 'Toronto', true, true),

&#x20;   ('11111111-1111-1111-1111-111111111104', 'University of Oxford', 'Oxford', 'United Kingdom', 'Oxford', false, true),

&#x20;   ('11111111-1111-1111-1111-111111111105', 'Technical University of Munich', 'TUM', 'Germany', 'Munich', true, true),

&#x20;   ('11111111-1111-1111-1111-111111111106', 'National University of Singapore', 'NUS', 'Singapore', 'Singapore', true, true),

&#x20;   ('11111111-1111-1111-1111-111111111107', 'University of Melbourne', 'UMelb', 'Australia', 'Melbourne', false, true),

&#x20;   ('11111111-1111-1111-1111-111111111108', 'Massachusetts Institute of Technology', 'MIT', 'United States', 'Cambridge', false, true)

ON CONFLICT DO NOTHING;



INSERT INTO programs (university\_id, name, short\_name, degree\_level, duration\_months, tuition\_fee, currency, application\_fee, required\_document\_types, available\_intakes) VALUES

&#x20;   -- IIM Bangalore

&#x20;   ('11111111-1111-1111-1111-111111111101', 'Master of Business Administration', 'MBA', 'masters', 24, 2300000, 'INR', 3500, ARRAY\['passport','academic\_transcript','recommendation\_letter','statement\_of\_purpose','cv\_resume']::document\_type\[], ARRAY\['Fall 2025', 'Fall 2026']),

&#x20;   ('11111111-1111-1111-1111-111111111101', 'Executive MBA', 'EMBA', 'masters', 12, 2800000, 'INR', 5000, ARRAY\['passport','academic\_transcript','cv\_resume','recommendation\_letter']::document\_type\[], ARRAY\['Spring 2025', 'Spring 2026']),

&#x20;   

&#x20;   -- IIT Delhi

&#x20;   ('11111111-1111-1111-1111-111111111102', 'Master of Technology in Computer Science', 'M.Tech CS', 'masters', 24, 200000, 'INR', 1500, ARRAY\['passport','academic\_transcript','statement\_of\_purpose','cv\_resume']::document\_type\[], ARRAY\['Fall 2025']),

&#x20;   ('11111111-1111-1111-1111-111111111102', 'Bachelor of Technology in Electrical Engineering', 'B.Tech EE', 'bachelors', 48, 800000, 'INR', 1000, ARRAY\['passport','academic\_transcript','marksheet']::document\_type\[], ARRAY\['Fall 2025']),

&#x20;   

&#x20;   -- University of Toronto

&#x20;   ('11111111-1111-1111-1111-111111111103', 'Master of Science in Computer Science', 'MSc CS', 'masters', 20, 58680, 'CAD', 125, ARRAY\['passport','academic\_transcript','recommendation\_letter','statement\_of\_purpose','cv\_resume','language\_test\_score']::document\_type\[], ARRAY\['Fall 2025', 'Winter 2026']),

&#x20;   ('11111111-1111-1111-1111-111111111103', 'Master of Business Administration', 'MBA', 'masters', 20, 115660, 'CAD', 275, ARRAY\['passport','academic\_transcript','recommendation\_letter','statement\_of\_purpose','cv\_resume','language\_test\_score','financial\_proof']::document\_type\[], ARRAY\['Fall 2025']),

&#x20;   

&#x20;   -- Oxford

&#x20;   ('11111111-1111-1111-1111-111111111104', 'MSc in Computer Science', 'MSc CS', 'masters', 12, 37510, 'GBP', 75, ARRAY\['passport','academic\_transcript','recommendation\_letter','statement\_of\_purpose','cv\_resume','language\_test\_score']::document\_type\[], ARRAY\['Fall 2025']),

&#x20;   

&#x20;   -- TUM

&#x20;   ('11111111-1111-1111-1111-111111111105', 'MSc Informatics', 'MSc Info', 'masters', 24, 0, 'EUR', 0, ARRAY\['passport','academic\_transcript','cv\_resume','language\_test\_score']::document\_type\[], ARRAY\['Fall 2025', 'Spring 2026']),

&#x20;   

&#x20;   -- NUS

&#x20;   ('11111111-1111-1111-1111-111111111106', 'Master of Computing', 'MComp', 'masters', 18, 45000, 'SGD', 50, ARRAY\['passport','academic\_transcript','recommendation\_letter','statement\_of\_purpose','cv\_resume']::document\_type\[], ARRAY\['Fall 2025', 'Spring 2026']),

&#x20;   

&#x20;   -- Melbourne

&#x20;   ('11111111-1111-1111-1111-111111111107', 'Master of Information Technology', 'MIT', 'masters', 24, 47000, 'AUD', 100, ARRAY\['passport','academic\_transcript','cv\_resume','language\_test\_score','financial\_proof']::document\_type\[], ARRAY\['Semester 1 2025', 'Semester 2 2025'])

ON CONFLICT DO NOTHING;

7\. STATE MACHINES

AGENT: Create these files exactly. The state machine is used by both the API and the UI. Never allow a status transition that isn't listed here.



TypeScript



// src/lib/state-machines/application-status.ts



export type ApplicationStatus =

&#x20;   | 'draft'

&#x20;   | 'documents\_pending'

&#x20;   | 'ready\_to\_submit'

&#x20;   | 'submitted'

&#x20;   | 'under\_review'

&#x20;   | 'additional\_info\_needed'

&#x20;   | 'conditional\_offer'

&#x20;   | 'unconditional\_offer'

&#x20;   | 'offer\_accepted'

&#x20;   | 'offer\_declined'

&#x20;   | 'visa\_processing'

&#x20;   | 'enrolled'

&#x20;   | 'rejected'

&#x20;   | 'withdrawn'

&#x20;   | 'deferred';



// Define all legal transitions

// Key = current status, Value = array of statuses it can move to

const APPLICATION\_TRANSITIONS: Record<ApplicationStatus, ApplicationStatus\[]> = {

&#x20;   draft:                  \['documents\_pending', 'ready\_to\_submit', 'withdrawn'],

&#x20;   documents\_pending:      \['ready\_to\_submit', 'draft', 'withdrawn'],

&#x20;   ready\_to\_submit:        \['submitted', 'documents\_pending', 'withdrawn'],

&#x20;   submitted:              \['under\_review', 'additional\_info\_needed', 'rejected', 'withdrawn'],

&#x20;   under\_review:           \['conditional\_offer', 'unconditional\_offer', 'additional\_info\_needed', 'rejected', 'withdrawn'],

&#x20;   additional\_info\_needed: \['under\_review', 'submitted', 'withdrawn'],

&#x20;   conditional\_offer:      \['unconditional\_offer', 'offer\_accepted', 'offer\_declined', 'withdrawn'],

&#x20;   unconditional\_offer:    \['offer\_accepted', 'offer\_declined', 'withdrawn'],

&#x20;   offer\_accepted:         \['visa\_processing', 'enrolled', 'withdrawn'],

&#x20;   offer\_declined:         \[],  // TERMINAL — cannot change

&#x20;   visa\_processing:        \['enrolled', 'withdrawn'],

&#x20;   enrolled:               \[],  // TERMINAL — cannot change

&#x20;   rejected:               \['deferred'],  // Can only defer from rejected

&#x20;   withdrawn:              \['draft'],     // Can reopen as draft

&#x20;   deferred:               \['draft', 'submitted'],

};



// Which statuses require a reason?

const REASON\_REQUIRED: ApplicationStatus\[] = \[

&#x20;   'rejected',

&#x20;   'withdrawn',

&#x20;   'offer\_declined',

&#x20;   'additional\_info\_needed',

&#x20;   'deferred',

];



// Which statuses are terminal (no further transitions)?

const TERMINAL\_STATUSES: ApplicationStatus\[] = \[

&#x20;   'enrolled',

&#x20;   'offer\_declined',

];



// Which statuses count as "active" (student has something in progress)?

const ACTIVE\_STATUSES: ApplicationStatus\[] = \[

&#x20;   'draft',

&#x20;   'documents\_pending',

&#x20;   'ready\_to\_submit',

&#x20;   'submitted',

&#x20;   'under\_review',

&#x20;   'additional\_info\_needed',

&#x20;   'conditional\_offer',

&#x20;   'unconditional\_offer',

&#x20;   'offer\_accepted',

&#x20;   'visa\_processing',

];



// Status display configuration

export const APPLICATION\_STATUS\_CONFIG: Record<ApplicationStatus, {

&#x20;   label: string;

&#x20;   color: string;       // Tailwind color class

&#x20;   bgColor: string;

&#x20;   icon: string;        // Lucide icon name

&#x20;   description: string;

}> = {

&#x20;   draft:                  { label: 'Draft',                  color: 'text-gray-700',    bgColor: 'bg-gray-100',    icon: 'FileEdit',      description: 'Application started but not complete' },

&#x20;   documents\_pending:      { label: 'Documents Pending',      color: 'text-yellow-700',  bgColor: 'bg-yellow-100',  icon: 'FileWarning',   description: 'Waiting for required documents' },

&#x20;   ready\_to\_submit:        { label: 'Ready to Submit',        color: 'text-blue-700',    bgColor: 'bg-blue-100',    icon: 'FileCheck',     description: 'All documents ready, pending submission' },

&#x20;   submitted:              { label: 'Submitted',              color: 'text-indigo-700',  bgColor: 'bg-indigo-100',  icon: 'Send',          description: 'Submitted to university' },

&#x20;   under\_review:           { label: 'Under Review',           color: 'text-purple-700',  bgColor: 'bg-purple-100',  icon: 'Eye',           description: 'University is reviewing the application' },

&#x20;   additional\_info\_needed: { label: 'Additional Info Needed', color: 'text-orange-700',  bgColor: 'bg-orange-100',  icon: 'AlertCircle',   description: 'University needs more information' },

&#x20;   conditional\_offer:      { label: 'Conditional Offer',      color: 'text-teal-700',    bgColor: 'bg-teal-100',    icon: 'FileCheck2',    description: 'Accepted with conditions' },

&#x20;   unconditional\_offer:    { label: 'Unconditional Offer',    color: 'text-green-700',   bgColor: 'bg-green-100',   icon: 'CheckCircle2',  description: 'Fully accepted, no conditions' },

&#x20;   offer\_accepted:         { label: 'Offer Accepted',         color: 'text-green-800',   bgColor: 'bg-green-200',   icon: 'ThumbsUp',      description: 'Student has accepted the offer' },

&#x20;   offer\_declined:         { label: 'Offer Declined',         color: 'text-red-700',     bgColor: 'bg-red-100',     icon: 'ThumbsDown',    description: 'Student declined the offer' },

&#x20;   visa\_processing:        { label: 'Visa Processing',        color: 'text-cyan-700',    bgColor: 'bg-cyan-100',    icon: 'Plane',         description: 'Visa application in progress' },

&#x20;   enrolled:               { label: 'Enrolled',               color: 'text-emerald-800', bgColor: 'bg-emerald-200', icon: 'GraduationCap', description: 'Student is enrolled' },

&#x20;   rejected:               { label: 'Rejected',               color: 'text-red-800',     bgColor: 'bg-red-200',     icon: 'XCircle',       description: 'Application was rejected' },

&#x20;   withdrawn:              { label: 'Withdrawn',              color: 'text-gray-600',    bgColor: 'bg-gray-200',    icon: 'Undo2',         description: 'Application was withdrawn' },

&#x20;   deferred:               { label: 'Deferred',               color: 'text-amber-700',   bgColor: 'bg-amber-100',   icon: 'Clock',         description: 'Deferred to a future intake' },

};



// ── Exported Functions ──



export function canTransition(from: ApplicationStatus, to: ApplicationStatus): boolean {

&#x20;   return APPLICATION\_TRANSITIONS\[from]?.includes(to) ?? false;

}



export function getNextStatuses(current: ApplicationStatus): ApplicationStatus\[] {

&#x20;   return APPLICATION\_TRANSITIONS\[current] ?? \[];

}



export function isTerminal(status: ApplicationStatus): boolean {

&#x20;   return TERMINAL\_STATUSES.includes(status);

}



export function isActive(status: ApplicationStatus): boolean {

&#x20;   return ACTIVE\_STATUSES.includes(status);

}



export function requiresReason(status: ApplicationStatus): boolean {

&#x20;   return REASON\_REQUIRED.includes(status);

}



export function validateTransition(from: ApplicationStatus, to: ApplicationStatus): {

&#x20;   valid: boolean;

&#x20;   error?: string;

} {

&#x20;   if (from === to) {

&#x20;       return { valid: false, error: `Status is already "${from}". No change needed.` };

&#x20;   }

&#x20;   if (isTerminal(from)) {

&#x20;       return { valid: false, error: `Cannot change status from "${from}". It is a terminal status.` };

&#x20;   }

&#x20;   if (!canTransition(from, to)) {

&#x20;       const allowed = getNextStatuses(from);

&#x20;       return {

&#x20;           valid: false,

&#x20;           error: `Cannot transition from "${from}" to "${to}". Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none (terminal state)'}`,

&#x20;       };

&#x20;   }

&#x20;   return { valid: true };

}

TypeScript



// src/lib/state-machines/student-status.ts



export type StudentStatus = 'lead' | 'active' | 'inactive' | 'enrolled' | 'archived';



const STUDENT\_TRANSITIONS: Record<StudentStatus, StudentStatus\[]> = {

&#x20;   lead:     \['active', 'archived'],

&#x20;   active:   \['inactive', 'enrolled', 'archived'],

&#x20;   inactive: \['active', 'archived'],

&#x20;   enrolled: \['archived'],  // Enrolled is near-terminal, only admin can archive

&#x20;   archived: \['lead', 'active'],  // Can reactivate

};



export const STUDENT\_STATUS\_CONFIG: Record<StudentStatus, {

&#x20;   label: string;

&#x20;   color: string;

&#x20;   bgColor: string;

&#x20;   icon: string;

&#x20;   description: string;

}> = {

&#x20;   lead:     { label: 'Lead',     color: 'text-blue-700',    bgColor: 'bg-blue-100',    icon: 'UserPlus',      description: 'New student, no application yet' },

&#x20;   active:   { label: 'Active',   color: 'text-green-700',   bgColor: 'bg-green-100',   icon: 'UserCheck',     description: 'Has active application(s)' },

&#x20;   inactive: { label: 'Inactive', color: 'text-gray-600',    bgColor: 'bg-gray-100',    icon: 'UserMinus',     description: 'No active applications' },

&#x20;   enrolled: { label: 'Enrolled', color: 'text-emerald-800', bgColor: 'bg-emerald-200', icon: 'GraduationCap', description: 'Successfully enrolled' },

&#x20;   archived: { label: 'Archived', color: 'text-gray-500',    bgColor: 'bg-gray-200',    icon: 'Archive',       description: 'Archived by freelancer' },

};



export function canTransitionStudent(from: StudentStatus, to: StudentStatus): boolean {

&#x20;   return STUDENT\_TRANSITIONS\[from]?.includes(to) ?? false;

}



export function getNextStudentStatuses(current: StudentStatus): StudentStatus\[] {

&#x20;   return STUDENT\_TRANSITIONS\[current] ?? \[];

}

TypeScript



// src/lib/state-machines/document-status.ts



export type DocumentStatus = 'uploaded' | 'under\_review' | 'approved' | 'rejected' | 'expired';



const DOCUMENT\_TRANSITIONS: Record<DocumentStatus, DocumentStatus\[]> = {

&#x20;   uploaded:     \['under\_review', 'approved', 'rejected'],

&#x20;   under\_review: \['approved', 'rejected'],

&#x20;   approved:     \['expired'],     // Only via cron/auto

&#x20;   rejected:     \['uploaded'],    // Re-upload resets to uploaded

&#x20;   expired:      \['uploaded'],    // Re-upload resets to uploaded

};



export const DOCUMENT\_STATUS\_CONFIG: Record<DocumentStatus, {

&#x20;   label: string;

&#x20;   color: string;

&#x20;   bgColor: string;

&#x20;   icon: string;

}> = {

&#x20;   uploaded:     { label: 'Uploaded',     color: 'text-blue-700',   bgColor: 'bg-blue-100',   icon: 'Upload' },

&#x20;   under\_review: { label: 'Under Review', color: 'text-yellow-700', bgColor: 'bg-yellow-100', icon: 'Eye' },

&#x20;   approved:     { label: 'Approved',     color: 'text-green-700',  bgColor: 'bg-green-100',  icon: 'CheckCircle' },

&#x20;   rejected:     { label: 'Rejected',     color: 'text-red-700',    bgColor: 'bg-red-100',    icon: 'XCircle' },

&#x20;   expired:      { label: 'Expired',      color: 'text-orange-700', bgColor: 'bg-orange-100', icon: 'Clock' },

};

8\. TYPES \& INTERFACES

TypeScript



// src/types/database.ts

// These types MUST match the database schema exactly.

// Generate from Supabase CLI: npx supabase gen types typescript --local > src/types/supabase.ts

// But also define clean application-level types below:



export interface Profile {

&#x20;   id: string;

&#x20;   role: 'super\_admin' | 'admin' | 'manager' | 'freelancer';

&#x20;   full\_name: string;

&#x20;   email: string;

&#x20;   phone: string | null;

&#x20;   avatar\_url: string | null;

&#x20;   organization\_id: string | null;

&#x20;   is\_active: boolean;

&#x20;   timezone: string;

&#x20;   preferences: Record<string, unknown>;

&#x20;   created\_at: string;

&#x20;   updated\_at: string;

}



export interface Student {

&#x20;   id: string;

&#x20;   freelancer\_id: string;

&#x20;   

&#x20;   // Personal

&#x20;   first\_name: string;

&#x20;   last\_name: string;

&#x20;   email: string | null;

&#x20;   phone: string;

&#x20;   date\_of\_birth: string | null;

&#x20;   gender: 'male' | 'female' | 'other' | 'prefer\_not\_to\_say' | null;

&#x20;   nationality: string | null;

&#x20;   marital\_status: 'single' | 'married' | 'divorced' | 'widowed' | null;

&#x20;   

&#x20;   // Address

&#x20;   address\_line1: string | null;

&#x20;   address\_line2: string | null;

&#x20;   city: string | null;

&#x20;   state\_province: string | null;

&#x20;   country: string;

&#x20;   postal\_code: string | null;

&#x20;   

&#x20;   // Emergency

&#x20;   emergency\_contact\_name: string | null;

&#x20;   emergency\_contact\_phone: string | null;

&#x20;   emergency\_contact\_relation: string | null;

&#x20;   emergency\_contact\_email: string | null;

&#x20;   

&#x20;   // Academic Background

&#x20;   highest\_education: 'high\_school' | 'diploma' | 'bachelors' | 'masters' | 'phd' | null;

&#x20;   highest\_education\_field: string | null;

&#x20;   highest\_education\_institute: string | null;

&#x20;   highest\_education\_year: number | null;

&#x20;   highest\_education\_gpa: number | null;

&#x20;   highest\_education\_percentage: number | null;

&#x20;   

&#x20;   // Preferences

&#x20;   preferred\_countries: string\[];

&#x20;   preferred\_degree\_level: string | null;

&#x20;   preferred\_field: string | null;

&#x20;   preferred\_specializations: string\[];

&#x20;   budget\_min: number | null;

&#x20;   budget\_max: number | null;

&#x20;   budget\_currency: string;

&#x20;   preferred\_intake: string | null;

&#x20;   

&#x20;   // Language

&#x20;   language\_test\_type: string | null;

&#x20;   language\_test\_score: string | null;

&#x20;   language\_test\_date: string | null;

&#x20;   

&#x20;   // Status \& Meta

&#x20;   status: 'lead' | 'active' | 'inactive' | 'enrolled' | 'archived';

&#x20;   source: string;

&#x20;   referred\_by: string | null;

&#x20;   tags: string\[];

&#x20;   profile\_completeness: number;

&#x20;   total\_applications: number;

&#x20;   total\_documents: number;

&#x20;   internal\_notes: string | null;

&#x20;   metadata: Record<string, unknown>;

&#x20;   

&#x20;   // Timestamps

&#x20;   created\_at: string;

&#x20;   updated\_at: string;

&#x20;   deleted\_at: string | null;

}



export interface StudentWithRelations extends Student {

&#x20;   freelancer?: Profile;

&#x20;   applications?: ApplicationWithRelations\[];

&#x20;   documents?: StudentDocument\[];

}



export interface University {

&#x20;   id: string;

&#x20;   name: string;

&#x20;   short\_name: string | null;

&#x20;   country: string;

&#x20;   state\_province: string | null;

&#x20;   city: string | null;

&#x20;   website: string | null;

&#x20;   email: string | null;

&#x20;   phone: string | null;

&#x20;   ranking\_national: number | null;

&#x20;   ranking\_global: number | null;

&#x20;   logo\_url: string | null;

&#x20;   description: string | null;

&#x20;   is\_partner: boolean;

&#x20;   is\_active: boolean;

&#x20;   metadata: Record<string, unknown>;

&#x20;   created\_at: string;

&#x20;   updated\_at: string;

}



export interface Program {

&#x20;   id: string;

&#x20;   university\_id: string;

&#x20;   name: string;

&#x20;   short\_name: string | null;

&#x20;   degree\_level: 'diploma' | 'bachelors' | 'masters' | 'phd' | 'certificate' | 'foundation';

&#x20;   department: string | null;

&#x20;   specialization: string | null;

&#x20;   duration\_months: number | null;

&#x20;   tuition\_fee: number | null;

&#x20;   currency: string;

&#x20;   application\_fee: number;

&#x20;   required\_document\_types: string\[];

&#x20;   available\_intakes: string\[];

&#x20;   application\_deadlines: Record<string, string>;

&#x20;   min\_gpa: number | null;

&#x20;   language\_requirement: string | null;

&#x20;   other\_requirements: string | null;

&#x20;   is\_active: boolean;

&#x20;   metadata: Record<string, unknown>;

&#x20;   created\_at: string;

&#x20;   updated\_at: string;

}



export interface ProgramWithUniversity extends Program {

&#x20;   university: University;

}



export interface StudentDocument {

&#x20;   id: string;

&#x20;   student\_id: string;

&#x20;   uploaded\_by: string;

&#x20;   type: string;

&#x20;   custom\_label: string | null;

&#x20;   description: string | null;

&#x20;   file\_name: string;

&#x20;   file\_path: string;

&#x20;   file\_size: number;

&#x20;   mime\_type: string;

&#x20;   file\_hash: string | null;

&#x20;   status: 'uploaded' | 'under\_review' | 'approved' | 'rejected' | 'expired';

&#x20;   verified\_by: string | null;

&#x20;   verified\_at: string | null;

&#x20;   rejection\_reason: string | null;

&#x20;   issued\_date: string | null;

&#x20;   expires\_at: string | null;

&#x20;   version: number;

&#x20;   is\_latest: boolean;

&#x20;   previous\_version\_id: string | null;

&#x20;   created\_at: string;

&#x20;   updated\_at: string;

&#x20;   deleted\_at: string | null;

}



export interface Application {

&#x20;   id: string;

&#x20;   student\_id: string;

&#x20;   freelancer\_id: string;

&#x20;   university\_id: string;

&#x20;   program\_id: string;

&#x20;   intake: string;

&#x20;   status: string;

&#x20;   priority: number;

&#x20;   

&#x20;   application\_fee: number;

&#x20;   application\_fee\_currency: string;

&#x20;   application\_fee\_paid: boolean;

&#x20;   application\_fee\_paid\_date: string | null;

&#x20;   

&#x20;   scholarship\_applied: boolean;

&#x20;   scholarship\_type: string | null;

&#x20;   scholarship\_amount: number | null;

&#x20;   scholarship\_currency: string;

&#x20;   scholarship\_status: string;

&#x20;   

&#x20;   commission\_amount: number | null;

&#x20;   commission\_currency: string;

&#x20;   commission\_percentage: number | null;

&#x20;   commission\_status: string;

&#x20;   commission\_paid\_at: string | null;

&#x20;   commission\_invoice\_id: string | null;

&#x20;   commission\_notes: string | null;

&#x20;   

&#x20;   submitted\_at: string | null;

&#x20;   decision\_at: string | null;

&#x20;   offer\_deadline: string | null;

&#x20;   enrollment\_at: string | null;

&#x20;   application\_deadline: string | null;

&#x20;   

&#x20;   university\_application\_id: string | null;

&#x20;   university\_portal\_url: string | null;

&#x20;   university\_contact\_email: string | null;

&#x20;   university\_contact\_name: string | null;

&#x20;   

&#x20;   internal\_notes: string | null;

&#x20;   offer\_conditions: string | null;

&#x20;   rejection\_reason: string | null;

&#x20;   withdrawal\_reason: string | null;

&#x20;   

&#x20;   metadata: Record<string, unknown>;

&#x20;   created\_at: string;

&#x20;   updated\_at: string;

&#x20;   deleted\_at: string | null;

}



export interface ApplicationWithRelations extends Application {

&#x20;   student?: Student;

&#x20;   university?: University;

&#x20;   program?: Program;

&#x20;   documents?: ApplicationDocument\[];

}



export interface ApplicationDocument {

&#x20;   id: string;

&#x20;   application\_id: string;

&#x20;   document\_id: string;

&#x20;   is\_required: boolean;

&#x20;   status: 'linked' | 'submitted' | 'accepted' | 'rejected' | 'needs\_reupload';

&#x20;   notes: string | null;

&#x20;   rejection\_reason: string | null;

&#x20;   linked\_at: string;

&#x20;   submitted\_at: string | null;

&#x20;   reviewed\_at: string | null;

&#x20;   document?: StudentDocument; // Joined

}



export interface StatusHistoryEntry {

&#x20;   id: string;

&#x20;   entity\_type: 'student' | 'application' | 'document';

&#x20;   entity\_id: string;

&#x20;   from\_status: string | null;

&#x20;   to\_status: string;

&#x20;   changed\_by: string;

&#x20;   reason: string | null;

&#x20;   metadata: Record<string, unknown>;

&#x20;   ip\_address: string | null;

&#x20;   created\_at: string;

&#x20;   changed\_by\_profile?: Profile; // Joined

}



export interface ActivityLogEntry {

&#x20;   id: string;

&#x20;   actor\_id: string;

&#x20;   action: string;

&#x20;   entity\_type: string;

&#x20;   entity\_id: string;

&#x20;   title: string;

&#x20;   description: string | null;

&#x20;   related\_entities: Record<string, string>;

&#x20;   metadata: Record<string, unknown>;

&#x20;   created\_at: string;

&#x20;   actor?: Profile; // Joined

}



export interface DashboardStats {

&#x20;   freelancer\_id: string;

&#x20;   total\_students: number;

&#x20;   lead\_count: number;

&#x20;   active\_student\_count: number;

&#x20;   enrolled\_student\_count: number;

&#x20;   total\_applications: number;

&#x20;   draft\_app\_count: number;

&#x20;   submitted\_app\_count: number;

&#x20;   under\_review\_app\_count: number;

&#x20;   offer\_count: number;

&#x20;   enrolled\_app\_count: number;

&#x20;   rejected\_app\_count: number;

&#x20;   total\_commission\_earned: number;

&#x20;   pending\_commission: number;

&#x20;   approved\_commission: number;

&#x20;   upcoming\_deadline\_count: number;

&#x20;   last\_refreshed: string;

}

TypeScript



// src/types/api.ts

// Standardized API response shapes



export interface ApiSuccessResponse<T> {

&#x20;   success: true;

&#x20;   data: T;

&#x20;   meta?: PaginationMeta;

}



export interface ApiErrorResponse {

&#x20;   success: false;

&#x20;   error: {

&#x20;       code: string;

&#x20;       message: string;

&#x20;       details?: Array<{ field: string; message: string }>;

&#x20;   };

}



export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;



export interface PaginationMeta {

&#x20;   page: number;

&#x20;   per\_page: number;

&#x20;   total: number;

&#x20;   total\_pages: number;

&#x20;   has\_next: boolean;

&#x20;   has\_prev: boolean;

}



export interface PaginationParams {

&#x20;   page?: number;

&#x20;   per\_page?: number;

&#x20;   sort\_by?: string;

&#x20;   sort\_order?: 'asc' | 'desc';

}



export interface StudentListParams extends PaginationParams {

&#x20;   search?: string;

&#x20;   status?: string;

&#x20;   tags?: string\[];

&#x20;   created\_after?: string;

&#x20;   created\_before?: string;

}



export interface ApplicationListParams extends PaginationParams {

&#x20;   search?: string;

&#x20;   status?: string;

&#x20;   student\_id?: string;

&#x20;   university\_id?: string;

&#x20;   intake?: string;

&#x20;   has\_deadline\_before?: string;

}

9\. ZOD VALIDATION SCHEMAS

TypeScript



// src/lib/validations/student.ts

import { z } from 'zod';



// ── Reusable field schemas ──

const phoneSchema = z.string()

&#x20;   .min(10, 'Phone must be at least 10 digits')

&#x20;   .max(15, 'Phone number too long')

&#x20;   .regex(/^\\+?\[0-9\\s-]+$/, 'Invalid phone number format');



const emailSchema = z.string()

&#x20;   .email('Invalid email address')

&#x20;   .max(255, 'Email too long')

&#x20;   .transform(v => v.toLowerCase().trim());



// ── Step 1: Personal Info ──

export const personalInfoSchema = z.object({

&#x20;   first\_name: z.string().min(1, 'First name is required').max(100).trim(),

&#x20;   last\_name: z.string().min(1, 'Last name is required').max(100).trim(),

&#x20;   email: emailSchema.optional().nullable().or(z.literal('')).transform(v => v || null),

&#x20;   phone: phoneSchema,

&#x20;   date\_of\_birth: z.string().optional().nullable().refine((val) => {

&#x20;       if (!val) return true;

&#x20;       const date = new Date(val);

&#x20;       if (isNaN(date.getTime())) return false;

&#x20;       const age = (Date.now() - date.getTime()) / (365.25 \* 24 \* 60 \* 60 \* 1000);

&#x20;       return age >= 14 \&\& age <= 80;

&#x20;   }, 'Student must be between 14 and 80 years old'),

&#x20;   gender: z.enum(\['male', 'female', 'other', 'prefer\_not\_to\_say']).optional().nullable(),

&#x20;   nationality: z.string().max(100).optional().nullable(),

&#x20;   marital\_status: z.enum(\['single', 'married', 'divorced', 'widowed']).optional().nullable(),

&#x20;   

&#x20;   // Address (all optional)

&#x20;   address\_line1: z.string().max(255).optional().nullable(),

&#x20;   address\_line2: z.string().max(255).optional().nullable(),

&#x20;   city: z.string().max(100).optional().nullable(),

&#x20;   state\_province: z.string().max(100).optional().nullable(),

&#x20;   country: z.string().max(100).default('India'),

&#x20;   postal\_code: z.string().max(20).optional().nullable(),

&#x20;   

&#x20;   // Emergency (optional)

&#x20;   emergency\_contact\_name: z.string().max(100).optional().nullable(),

&#x20;   emergency\_contact\_phone: phoneSchema.optional().nullable().or(z.literal('')).transform(v => v || null),

&#x20;   emergency\_contact\_relation: z.string().max(50).optional().nullable(),

&#x20;   emergency\_contact\_email: emailSchema.optional().nullable().or(z.literal('')).transform(v => v || null),

});



// ── Step 2: Academic Preferences ──

export const academicPreferencesSchema = z.object({

&#x20;   // Background

&#x20;   highest\_education: z.enum(\['high\_school', 'diploma', 'bachelors', 'masters', 'phd']).optional().nullable(),

&#x20;   highest\_education\_field: z.string().max(200).optional().nullable(),

&#x20;   highest\_education\_institute: z.string().max(200).optional().nullable(),

&#x20;   highest\_education\_year: z.number().int().min(1970).max(new Date().getFullYear()).optional().nullable(),

&#x20;   highest\_education\_gpa: z.number().min(0).max(10).optional().nullable(),

&#x20;   highest\_education\_percentage: z.number().min(0).max(100).optional().nullable(),

&#x20;   

&#x20;   // What they want

&#x20;   preferred\_countries: z.array(z.string()).default(\[]),

&#x20;   preferred\_degree\_level: z.enum(\['diploma', 'bachelors', 'masters', 'phd', 'certificate', 'foundation']).optional().nullable(),

&#x20;   preferred\_field: z.string().max(200).optional().nullable(),

&#x20;   preferred\_specializations: z.array(z.string()).default(\[]),

&#x20;   budget\_min: z.number().min(0).optional().nullable(),

&#x20;   budget\_max: z.number().min(0).optional().nullable(),

&#x20;   budget\_currency: z.string().default('USD'),

&#x20;   preferred\_intake: z.string().max(50).optional().nullable(),

&#x20;   

&#x20;   // Language

&#x20;   language\_test\_type: z.enum(\['ielts', 'toefl', 'pte', 'duolingo', 'gre', 'gmat', 'sat', 'none']).optional().nullable(),

&#x20;   language\_test\_score: z.string().max(20).optional().nullable(),

&#x20;   language\_test\_date: z.string().optional().nullable(),

&#x20;   

&#x20;   // Meta

&#x20;   source: z.string().default('direct'),

&#x20;   referred\_by: z.string().max(200).optional().nullable(),

&#x20;   tags: z.array(z.string()).default(\[]),

&#x20;   internal\_notes: z.string().max(5000).optional().nullable(),

}).refine((data) => {

&#x20;   if (data.budget\_min \&\& data.budget\_max) {

&#x20;       return data.budget\_min <= data.budget\_max;

&#x20;   }

&#x20;   return true;

}, { message: 'Minimum budget cannot be greater than maximum budget', path: \['budget\_min'] });



// ── Application (within wizard) ──

export const applicationInWizardSchema = z.object({

&#x20;   university\_id: z.string().uuid('Select a university'),

&#x20;   program\_id: z.string().uuid('Select a program'),

&#x20;   intake: z.string().min(1, 'Select an intake'),

&#x20;   priority: z.number().int().min(0).max(5).default(0),

&#x20;   application\_fee: z.number().min(0).default(0),

&#x20;   application\_fee\_currency: z.string().default('USD'),

&#x20;   application\_fee\_paid: z.boolean().default(false),

&#x20;   scholarship\_applied: z.boolean().default(false),

&#x20;   internal\_notes: z.string().max(5000).optional().nullable(),

});



// ── Combined: Full Wizard Submission ──

export const studentWizardSubmitSchema = z.object({

&#x20;   student: personalInfoSchema.merge(academicPreferencesSchema),

&#x20;   create\_application: z.boolean().default(false),

&#x20;   application: applicationInWizardSchema.optional().nullable(),

&#x20;   document\_ids: z.array(z.string().uuid()).default(\[]),

}).refine((data) => {

&#x20;   // If user chose to create application, application details are required

&#x20;   if (data.create\_application \&\& !data.application) {

&#x20;       return false;

&#x20;   }

&#x20;   return true;

}, { message: 'Application details are required when "Create Application" is selected', path: \['application'] });



export type PersonalInfoInput = z.infer<typeof personalInfoSchema>;

export type AcademicPreferencesInput = z.infer<typeof academicPreferencesSchema>;

export type ApplicationInWizardInput = z.infer<typeof applicationInWizardSchema>;

export type StudentWizardSubmitInput = z.infer<typeof studentWizardSubmitSchema>;

TypeScript



// src/lib/validations/application.ts

import { z } from 'zod';



export const applicationCreateSchema = z.object({

&#x20;   student\_id: z.string().uuid('Valid student is required'),

&#x20;   university\_id: z.string().uuid('Select a university'),

&#x20;   program\_id: z.string().uuid('Select a program'),

&#x20;   intake: z.string().min(1, 'Select an intake'),

&#x20;   priority: z.number().int().min(0).max(5).default(0),

&#x20;   

&#x20;   application\_fee: z.number().min(0).default(0),

&#x20;   application\_fee\_currency: z.string().default('USD'),

&#x20;   application\_fee\_paid: z.boolean().default(false),

&#x20;   

&#x20;   scholarship\_applied: z.boolean().default(false),

&#x20;   scholarship\_type: z.string().optional().nullable(),

&#x20;   

&#x20;   application\_deadline: z.string().optional().nullable(),

&#x20;   

&#x20;   internal\_notes: z.string().max(5000).optional().nullable(),

&#x20;   

&#x20;   // Document IDs to link

&#x20;   document\_ids: z.array(z.string().uuid()).default(\[]),

});



export const applicationUpdateSchema = z.object({

&#x20;   priority: z.number().int().min(0).max(5).optional(),

&#x20;   application\_fee: z.number().min(0).optional(),

&#x20;   application\_fee\_paid: z.boolean().optional(),

&#x20;   application\_fee\_paid\_date: z.string().optional().nullable(),

&#x20;   scholarship\_applied: z.boolean().optional(),

&#x20;   scholarship\_type: z.string().optional().nullable(),

&#x20;   scholarship\_amount: z.number().min(0).optional().nullable(),

&#x20;   scholarship\_status: z.enum(\['not\_applied', 'applied', 'awarded', 'rejected', 'partial']).optional(),

&#x20;   application\_deadline: z.string().optional().nullable(),

&#x20;   offer\_deadline: z.string().optional().nullable(),

&#x20;   university\_application\_id: z.string().max(200).optional().nullable(),

&#x20;   university\_portal\_url: z.string().url().optional().nullable().or(z.literal('')),

&#x20;   university\_contact\_email: z.string().email().optional().nullable().or(z.literal('')),

&#x20;   university\_contact\_name: z.string().max(200).optional().nullable(),

&#x20;   internal\_notes: z.string().max(5000).optional().nullable(),

&#x20;   offer\_conditions: z.string().max(5000).optional().nullable(),

&#x20;   commission\_amount: z.number().min(0).optional().nullable(),

&#x20;   commission\_percentage: z.number().min(0).max(100).optional().nullable(),

&#x20;   commission\_notes: z.string().max(2000).optional().nullable(),

});



export const applicationStatusUpdateSchema = z.object({

&#x20;   status: z.string().min(1, 'Status is required'),

&#x20;   reason: z.string().max(1000).optional().nullable(),

&#x20;   metadata: z.record(z.unknown()).optional().default({}),

});



export type ApplicationCreateInput = z.infer<typeof applicationCreateSchema>;

export type ApplicationUpdateInput = z.infer<typeof applicationUpdateSchema>;

export type ApplicationStatusUpdateInput = z.infer<typeof applicationStatusUpdateSchema>;

TypeScript



// src/lib/validations/document.ts

import { z } from 'zod';



export const ALLOWED\_MIME\_TYPES = \[

&#x20;   'application/pdf',

&#x20;   'image/jpeg',

&#x20;   'image/png',

&#x20;   'image/webp',

&#x20;   'application/msword',

&#x20;   'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

] as const;



export const MAX\_FILE\_SIZE = 10 \* 1024 \* 1024; // 10MB



export const documentUploadSchema = z.object({

&#x20;   type: z.enum(\[

&#x20;       'passport', 'national\_id', 'photo', 'academic\_transcript',

&#x20;       'degree\_certificate', 'marksheet', 'recommendation\_letter',

&#x20;       'statement\_of\_purpose', 'cv\_resume', 'language\_test\_score',

&#x20;       'financial\_proof', 'bank\_statement', 'sponsorship\_letter',

&#x20;       'medical\_report', 'police\_clearance', 'visa\_document',

&#x20;       'admission\_letter', 'scholarship\_letter', 'other',

&#x20;   ]),

&#x20;   custom\_label: z.string().max(200).optional().nullable(),

&#x20;   description: z.string().max(1000).optional().nullable(),

&#x20;   issued\_date: z.string().optional().nullable(),

&#x20;   expires\_at: z.string().optional().nullable(),

}).refine((data) => {

&#x20;   if (data.type === 'other' \&\& (!data.custom\_label || data.custom\_label.trim() === '')) {

&#x20;       return false;

&#x20;   }

&#x20;   return true;

}, { message: 'Custom label is required for "Other" document type', path: \['custom\_label'] });



export const documentVerifySchema = z.object({

&#x20;   status: z.enum(\['approved', 'rejected']),

&#x20;   rejection\_reason: z.string().max(1000).optional().nullable(),

}).refine((data) => {

&#x20;   if (data.status === 'rejected' \&\& (!data.rejection\_reason || data.rejection\_reason.trim() === '')) {

&#x20;       return false;

&#x20;   }

&#x20;   return true;

}, { message: 'Rejection reason is required when rejecting a document', path: \['rejection\_reason'] });



export type DocumentUploadInput = z.infer<typeof documentUploadSchema>;

export type DocumentVerifyInput = z.infer<typeof documentVerifySchema>;

10\. SERVICE LAYER

TypeScript



// src/lib/services/student-service.ts

import { createClient } from '@/lib/supabase/server';

import type { StudentWizardSubmitInput } from '@/lib/validations/student';

import type { Student, Application, StudentWithRelations } from '@/types/database';



export class StudentService {

&#x20;   

&#x20;   /\*\*

&#x20;    \* Create student + optionally create application in a single transaction.

&#x20;    \* This is the main wizard submission handler.

&#x20;    \*/

&#x20;   static async createStudentWithApplication(

&#x20;       input: StudentWizardSubmitInput,

&#x20;       freelancerId: string

&#x20;   ): Promise<{ student: Student; application: Application | null }> {

&#x20;       const supabase = await createClient();

&#x20;       

&#x20;       // 1. Check for duplicate phone under same freelancer

&#x20;       const { data: existing } = await supabase

&#x20;           .from('students')

&#x20;           .select('id, first\_name, last\_name')

&#x20;           .eq('freelancer\_id', freelancerId)

&#x20;           .eq('phone', input.student.phone)

&#x20;           .is('deleted\_at', null)

&#x20;           .maybeSingle();

&#x20;       

&#x20;       if (existing) {

&#x20;           throw new AppError(

&#x20;               'CONFLICT',

&#x20;               `Student with phone ${input.student.phone} already exists: ${existing.first\_name} ${existing.last\_name}`,

&#x20;               409

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       // 2. Create student

&#x20;       const { data: student, error: studentError } = await supabase

&#x20;           .from('students')

&#x20;           .insert({

&#x20;               freelancer\_id: freelancerId,

&#x20;               ...input.student,

&#x20;               status: 'lead',

&#x20;           })

&#x20;           .select()

&#x20;           .single();

&#x20;       

&#x20;       if (studentError || !student) {

&#x20;           throw new AppError('DB\_ERROR', `Failed to create student: ${studentError?.message}`, 500);

&#x20;       }

&#x20;       

&#x20;       // 3. Log activity

&#x20;       await supabase.from('activity\_log').insert({

&#x20;           actor\_id: freelancerId,

&#x20;           action: 'student.created',

&#x20;           entity\_type: 'student',

&#x20;           entity\_id: student.id,

&#x20;           title: 'Student Created',

&#x20;           description: `Created student ${student.first\_name} ${student.last\_name}`,

&#x20;       });

&#x20;       

&#x20;       // 4. Link any pre-uploaded documents

&#x20;       if (input.document\_ids.length > 0) {

&#x20;           // Verify documents belong to this student (they were uploaded during wizard)

&#x20;           // Documents are uploaded in Step 3 of wizard, already linked to student\_id

&#x20;       }

&#x20;       

&#x20;       // 5. Create application if requested

&#x20;       let application: Application | null = null;

&#x20;       

&#x20;       if (input.create\_application \&\& input.application) {

&#x20;           const { data: app, error: appError } = await supabase

&#x20;               .from('applications')

&#x20;               .insert({

&#x20;                   student\_id: student.id,

&#x20;                   freelancer\_id: freelancerId,

&#x20;                   university\_id: input.application.university\_id,

&#x20;                   program\_id: input.application.program\_id,

&#x20;                   intake: input.application.intake,

&#x20;                   priority: input.application.priority,

&#x20;                   application\_fee: input.application.application\_fee,

&#x20;                   application\_fee\_currency: input.application.application\_fee\_currency,

&#x20;                   application\_fee\_paid: input.application.application\_fee\_paid,

&#x20;                   scholarship\_applied: input.application.scholarship\_applied,

&#x20;                   internal\_notes: input.application.internal\_notes,

&#x20;                   status: input.document\_ids.length > 0 ? 'documents\_pending' : 'draft',

&#x20;               })

&#x20;               .select()

&#x20;               .single();

&#x20;           

&#x20;           if (appError || !app) {

&#x20;               // Don't fail the whole operation — student is already created

&#x20;               console.error('Failed to create application:', appError);

&#x20;               // But we should still inform the user

&#x20;           } else {

&#x20;               application = app;

&#x20;               

&#x20;               // Link documents to application

&#x20;               if (input.document\_ids.length > 0) {

&#x20;                   const docLinks = input.document\_ids.map(docId => ({

&#x20;                       application\_id: app.id,

&#x20;                       document\_id: docId,

&#x20;                       is\_required: false,

&#x20;                       status: 'linked' as const,

&#x20;                   }));

&#x20;                   

&#x20;                   await supabase.from('application\_documents').insert(docLinks);

&#x20;               }

&#x20;               

&#x20;               // Log activity

&#x20;               await supabase.from('activity\_log').insert({

&#x20;                   actor\_id: freelancerId,

&#x20;                   action: 'application.created',

&#x20;                   entity\_type: 'application',

&#x20;                   entity\_id: app.id,

&#x20;                   title: 'Application Created',

&#x20;                   description: `Created application for ${student.first\_name} ${student.last\_name}`,

&#x20;                   related\_entities: { student\_id: student.id },

&#x20;               });

&#x20;           }

&#x20;       }

&#x20;       

&#x20;       return { student, application };

&#x20;   }

&#x20;   

&#x20;   /\*\*

&#x20;    \* Get student with all relations

&#x20;    \*/

&#x20;   static async getStudentById(studentId: string): Promise<StudentWithRelations | null> {

&#x20;       const supabase = await createClient();

&#x20;       

&#x20;       const { data, error } = await supabase

&#x20;           .from('students')

&#x20;           .select(`

&#x20;               \*,

&#x20;               freelancer:profiles!freelancer\_id(id, full\_name, email),

&#x20;               applications(

&#x20;                   \*,

&#x20;                   university:universities(id, name, short\_name, country, city, logo\_url),

&#x20;                   program:programs(id, name, short\_name, degree\_level, duration\_months, tuition\_fee, currency)

&#x20;               ),

&#x20;               documents:student\_documents(\*)

&#x20;           `)

&#x20;           .eq('id', studentId)

&#x20;           .is('deleted\_at', null)

&#x20;           .single();

&#x20;       

&#x20;       if (error || !data) return null;

&#x20;       return data as unknown as StudentWithRelations;

&#x20;   }

&#x20;   

&#x20;   /\*\*

&#x20;    \* List students with pagination, search, and filters

&#x20;    \*/

&#x20;   static async listStudents(

&#x20;       freelancerId: string,

&#x20;       params: {

&#x20;           page?: number;

&#x20;           per\_page?: number;

&#x20;           search?: string;

&#x20;           status?: string;

&#x20;           sort\_by?: string;

&#x20;           sort\_order?: 'asc' | 'desc';

&#x20;           tags?: string\[];

&#x20;       }

&#x20;   ) {

&#x20;       const supabase = await createClient();

&#x20;       const page = params.page || 1;

&#x20;       const perPage = Math.min(params.per\_page || 20, 100);

&#x20;       const offset = (page - 1) \* perPage;

&#x20;       

&#x20;       let query = supabase

&#x20;           .from('students')

&#x20;           .select('\*, applications(count)', { count: 'exact' })

&#x20;           .eq('freelancer\_id', freelancerId)

&#x20;           .is('deleted\_at', null);

&#x20;       

&#x20;       // Search

&#x20;       if (params.search) {

&#x20;           query = query.or(

&#x20;               `first\_name.ilike.%${params.search}%,last\_name.ilike.%${params.search}%,email.ilike.%${params.search}%,phone.ilike.%${params.search}%`

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       // Status filter

&#x20;       if (params.status) {

&#x20;           query = query.eq('status', params.status);

&#x20;       }

&#x20;       

&#x20;       // Tags filter

&#x20;       if (params.tags \&\& params.tags.length > 0) {

&#x20;           query = query.overlaps('tags', params.tags);

&#x20;       }

&#x20;       

&#x20;       // Sort

&#x20;       const sortBy = params.sort\_by || 'created\_at';

&#x20;       const sortOrder = params.sort\_order === 'asc' ? true : false;

&#x20;       query = query.order(sortBy, { ascending: sortOrder });

&#x20;       

&#x20;       // Pagination

&#x20;       query = query.range(offset, offset + perPage - 1);

&#x20;       

&#x20;       const { data, error, count } = await query;

&#x20;       

&#x20;       if (error) throw new AppError('DB\_ERROR', error.message, 500);

&#x20;       

&#x20;       return {

&#x20;           data: data || \[],

&#x20;           meta: {

&#x20;               page,

&#x20;               per\_page: perPage,

&#x20;               total: count || 0,

&#x20;               total\_pages: Math.ceil((count || 0) / perPage),

&#x20;               has\_next: page \* perPage < (count || 0),

&#x20;               has\_prev: page > 1,

&#x20;           },

&#x20;       };

&#x20;   }

&#x20;   

&#x20;   /\*\*

&#x20;    \* Update student

&#x20;    \*/

&#x20;   static async updateStudent(studentId: string, freelancerId: string, updates: Partial<Student>) {

&#x20;       const supabase = await createClient();

&#x20;       

&#x20;       const { data, error } = await supabase

&#x20;           .from('students')

&#x20;           .update(updates)

&#x20;           .eq('id', studentId)

&#x20;           .eq('freelancer\_id', freelancerId)

&#x20;           .is('deleted\_at', null)

&#x20;           .select()

&#x20;           .single();

&#x20;       

&#x20;       if (error) throw new AppError('DB\_ERROR', error.message, 500);

&#x20;       if (!data) throw new AppError('NOT\_FOUND', 'Student not found', 404);

&#x20;       

&#x20;       return data;

&#x20;   }

&#x20;   

&#x20;   /\*\*

&#x20;    \* Soft delete student

&#x20;    \*/

&#x20;   static async deleteStudent(studentId: string, freelancerId: string) {

&#x20;       const supabase = await createClient();

&#x20;       

&#x20;       // Check for active applications (trigger will also catch this, but better UX to check here)

&#x20;       const { count } = await supabase

&#x20;           .from('applications')

&#x20;           .select('\*', { count: 'exact', head: true })

&#x20;           .eq('student\_id', studentId)

&#x20;           .is('deleted\_at', null)

&#x20;           .not('status', 'in', '("rejected","withdrawn","offer\_declined")');

&#x20;       

&#x20;       if (count \&\& count > 0) {

&#x20;           throw new AppError(

&#x20;               'CONFLICT',

&#x20;               `Cannot delete student with ${count} active application(s). Withdraw or close them first.`,

&#x20;               409

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       const { data, error } = await supabase

&#x20;           .from('students')

&#x20;           .update({ deleted\_at: new Date().toISOString(), status: 'archived' })

&#x20;           .eq('id', studentId)

&#x20;           .eq('freelancer\_id', freelancerId)

&#x20;           .is('deleted\_at', null)

&#x20;           .select()

&#x20;           .single();

&#x20;       

&#x20;       if (error) throw new AppError('DB\_ERROR', error.message, 500);

&#x20;       if (!data) throw new AppError('NOT\_FOUND', 'Student not found', 404);

&#x20;       

&#x20;       return data;

&#x20;   }

}



// ── Custom Error Class ──

export class AppError extends Error {

&#x20;   constructor(

&#x20;       public code: string,

&#x20;       message: string,

&#x20;       public statusCode: number = 500,

&#x20;       public details?: Array<{ field: string; message: string }>

&#x20;   ) {

&#x20;       super(message);

&#x20;       this.name = 'AppError';

&#x20;   }

}

TypeScript



// src/lib/services/application-service.ts

import { createClient } from '@/lib/supabase/server';

import { validateTransition, requiresReason } from '@/lib/state-machines/application-status';

import type { ApplicationCreateInput, ApplicationStatusUpdateInput } from '@/lib/validations/application';

import type { Application, ApplicationWithRelations } from '@/types/database';

import { AppError } from './student-service';



export class ApplicationService {

&#x20;   

&#x20;   /\*\*

&#x20;    \* Create a new application for an existing student

&#x20;    \*/

&#x20;   static async createApplication(

&#x20;       input: ApplicationCreateInput,

&#x20;       freelancerId: string

&#x20;   ): Promise<Application> {

&#x20;       const supabase = await createClient();

&#x20;       

&#x20;       // 1. Verify student belongs to this freelancer

&#x20;       const { data: student } = await supabase

&#x20;           .from('students')

&#x20;           .select('id, first\_name, last\_name')

&#x20;           .eq('id', input.student\_id)

&#x20;           .eq('freelancer\_id', freelancerId)

&#x20;           .is('deleted\_at', null)

&#x20;           .single();

&#x20;       

&#x20;       if (!student) {

&#x20;           throw new AppError('NOT\_FOUND', 'Student not found or access denied', 404);

&#x20;       }

&#x20;       

&#x20;       // 2. Verify program belongs to university

&#x20;       const { data: program } = await supabase

&#x20;           .from('programs')

&#x20;           .select('id, name, required\_document\_types, available\_intakes, application\_fee, currency')

&#x20;           .eq('id', input.program\_id)

&#x20;           .eq('university\_id', input.university\_id)

&#x20;           .eq('is\_active', true)

&#x20;           .single();

&#x20;       

&#x20;       if (!program) {

&#x20;           throw new AppError('VALIDATION\_ERROR', 'Selected program does not belong to the selected university', 422);

&#x20;       }

&#x20;       

&#x20;       // 3. Verify intake is valid for this program

&#x20;       if (program.available\_intakes \&\& !program.available\_intakes.includes(input.intake)) {

&#x20;           throw new AppError('VALIDATION\_ERROR', `Intake "${input.intake}" is not available for this program. Available: ${program.available\_intakes.join(', ')}`, 422);

&#x20;       }

&#x20;       

&#x20;       // 4. Check for duplicate application

&#x20;       const { data: existingApp } = await supabase

&#x20;           .from('applications')

&#x20;           .select('id, status')

&#x20;           .eq('student\_id', input.student\_id)

&#x20;           .eq('program\_id', input.program\_id)

&#x20;           .eq('intake', input.intake)

&#x20;           .is('deleted\_at', null)

&#x20;           .maybeSingle();

&#x20;       

&#x20;       if (existingApp) {

&#x20;           throw new AppError('CONFLICT', `An application for this program and intake already exists (Status: ${existingApp.status})`, 409);

&#x20;       }

&#x20;       

&#x20;       // 5. Determine initial status based on documents

&#x20;       let initialStatus: string = 'draft';

&#x20;       if (input.document\_ids.length > 0) {

&#x20;           // Check if all required docs are covered

&#x20;           const { data: studentDocs } = await supabase

&#x20;               .from('student\_documents')

&#x20;               .select('type')

&#x20;               .in('id', input.document\_ids)

&#x20;               .eq('student\_id', input.student\_id)

&#x20;               .is('deleted\_at', null);

&#x20;           

&#x20;           const uploadedTypes = new Set(studentDocs?.map(d => d.type) || \[]);

&#x20;           const requiredTypes = program.required\_document\_types || \[];

&#x20;           const allRequired = requiredTypes.every((t: string) => uploadedTypes.has(t));

&#x20;           

&#x20;           initialStatus = allRequired ? 'ready\_to\_submit' : 'documents\_pending';

&#x20;       }

&#x20;       

&#x20;       // 6. Create application

&#x20;       const { data: application, error } = await supabase

&#x20;           .from('applications')

&#x20;           .insert({

&#x20;               student\_id: input.student\_id,

&#x20;               freelancer\_id: freelancerId,

&#x20;               university\_id: input.university\_id,

&#x20;               program\_id: input.program\_id,

&#x20;               intake: input.intake,

&#x20;               priority: input.priority,

&#x20;               application\_fee: input.application\_fee || program.application\_fee || 0,

&#x20;               application\_fee\_currency: input.application\_fee\_currency || program.currency || 'USD',

&#x20;               application\_fee\_paid: input.application\_fee\_paid,

&#x20;               scholarship\_applied: input.scholarship\_applied,

&#x20;               application\_deadline: input.application\_deadline,

&#x20;               internal\_notes: input.internal\_notes,

&#x20;               status: initialStatus,

&#x20;           })

&#x20;           .select()

&#x20;           .single();

&#x20;       

&#x20;       if (error || !application) {

&#x20;           throw new AppError('DB\_ERROR', `Failed to create application: ${error?.message}`, 500);

&#x20;       }

&#x20;       

&#x20;       // 7. Link documents

&#x20;       if (input.document\_ids.length > 0) {

&#x20;           const requiredTypes = new Set(program.required\_document\_types || \[]);

&#x20;           

&#x20;           // Get document types for the linked docs

&#x20;           const { data: docs } = await supabase

&#x20;               .from('student\_documents')

&#x20;               .select('id, type')

&#x20;               .in('id', input.document\_ids);

&#x20;           

&#x20;           const docLinks = (docs || \[]).map(doc => ({

&#x20;               application\_id: application.id,

&#x20;               document\_id: doc.id,

&#x20;               is\_required: requiredTypes.has(doc.type),

&#x20;               status: 'linked' as const,

&#x20;           }));

&#x20;           

&#x20;           if (docLinks.length > 0) {

&#x20;               await supabase.from('application\_documents').insert(docLinks);

&#x20;           }

&#x20;       }

&#x20;       

&#x20;       // 8. Log activity

&#x20;       await supabase.from('activity\_log').insert({

&#x20;           actor\_id: freelancerId,

&#x20;           action: 'application.created',

&#x20;           entity\_type: 'application',

&#x20;           entity\_id: application.id,

&#x20;           title: 'Application Created',

&#x20;           description: `Created application for ${student.first\_name} ${student.last\_name}`,

&#x20;           related\_entities: { student\_id: student.id },

&#x20;       });

&#x20;       

&#x20;       return application;

&#x20;   }

&#x20;   

&#x20;   /\*\*

&#x20;    \* Update application status with state machine validation

&#x20;    \*/

&#x20;   static async updateStatus(

&#x20;       applicationId: string,

&#x20;       freelancerId: string,

&#x20;       input: ApplicationStatusUpdateInput

&#x20;   ): Promise<Application> {

&#x20;       const supabase = await createClient();

&#x20;       

&#x20;       // 1. Get current application

&#x20;       const { data: current } = await supabase

&#x20;           .from('applications')

&#x20;           .select('\*')

&#x20;           .eq('id', applicationId)

&#x20;           .eq('freelancer\_id', freelancerId)

&#x20;           .is('deleted\_at', null)

&#x20;           .single();

&#x20;       

&#x20;       if (!current) {

&#x20;           throw new AppError('NOT\_FOUND', 'Application not found', 404);

&#x20;       }

&#x20;       

&#x20;       // 2. Validate transition

&#x20;       const validation = validateTransition(current.status, input.status as any);

&#x20;       if (!validation.valid) {

&#x20;           throw new AppError('INVALID\_STATUS\_TRANSITION', validation.error!, 422);

&#x20;       }

&#x20;       

&#x20;       // 3. Check if reason is required

&#x20;       if (requiresReason(input.status as any) \&\& (!input.reason || input.reason.trim() === '')) {

&#x20;           throw new AppError('VALIDATION\_ERROR', `A reason is required when changing status to "${input.status}"`, 422, \[

&#x20;               { field: 'reason', message: 'Reason is required for this status change' },

&#x20;           ]);

&#x20;       }

&#x20;       

&#x20;       // 4. Prepare update object

&#x20;       const updateData: Record<string, unknown> = {

&#x20;           status: input.status,

&#x20;       };

&#x20;       

&#x20;       // Set rejection/withdrawal reason fields

&#x20;       if (input.status === 'rejected') updateData.rejection\_reason = input.reason;

&#x20;       if (input.status === 'withdrawn') updateData.withdrawal\_reason = input.reason;

&#x20;       

&#x20;       // Merge metadata

&#x20;       if (input.metadata \&\& Object.keys(input.metadata).length > 0) {

&#x20;           updateData.metadata = { ...current.metadata, ...input.metadata };

&#x20;       }

&#x20;       

&#x20;       // 5. Set the current user for the trigger to pick up

&#x20;       await supabase.rpc('set\_config', {

&#x20;           setting: 'app.current\_user\_id',

&#x20;           value: freelancerId,

&#x20;       }).catch(() => {

&#x20;           // Fallback: trigger will use freelancer\_id from the row

&#x20;       });

&#x20;       

&#x20;       // 6. Update

&#x20;       const { data: updated, error } = await supabase

&#x20;           .from('applications')

&#x20;           .update(updateData)

&#x20;           .eq('id', applicationId)

&#x20;           .select()

&#x20;           .single();

&#x20;       

&#x20;       if (error || !updated) {

&#x20;           throw new AppError('DB\_ERROR', `Failed to update status: ${error?.message}`, 500);

&#x20;       }

&#x20;       

&#x20;       // 7. If reason provided, also insert into status\_history manually with reason

&#x20;       if (input.reason) {

&#x20;           await supabase.from('status\_history').insert({

&#x20;               entity\_type: 'application',

&#x20;               entity\_id: applicationId,

&#x20;               from\_status: current.status,

&#x20;               to\_status: input.status,

&#x20;               changed\_by: freelancerId,

&#x20;               reason: input.reason,

&#x20;               metadata: input.metadata || {},

&#x20;           });

&#x20;       }

&#x20;       

&#x20;       // 8. Log activity

&#x20;       await supabase.from('activity\_log').insert({

&#x20;           actor\_id: freelancerId,

&#x20;           action: 'application.status\_changed',

&#x20;           entity\_type: 'application',

&#x20;           entity\_id: applicationId,

&#x20;           title: 'Status Updated',

&#x20;           description: `Changed status from "${current.status}" to "${input.status}"${input.reason ? `: ${input.reason}` : ''}`,

&#x20;           related\_entities: { student\_id: current.student\_id },

&#x20;       });

&#x20;       

&#x20;       return updated;

&#x20;   }

&#x20;   

&#x20;   /\*\*

&#x20;    \* Get application with all relations

&#x20;    \*/

&#x20;   static async getApplicationById(applicationId: string): Promise<ApplicationWithRelations | null> {

&#x20;       const supabase = await createClient();

&#x20;       

&#x20;       const { data, error } = await supabase

&#x20;           .from('applications')

&#x20;           .select(`

&#x20;               \*,

&#x20;               student:students(id, first\_name, last\_name, email, phone, status, profile\_completeness),

&#x20;               university:universities(id, name, short\_name, country, city, logo\_url),

&#x20;               program:programs(id, name, short\_name, degree\_level, duration\_months, tuition\_fee, currency, required\_document\_types),

&#x20;               documents:application\_documents(

&#x20;                   \*,

&#x20;                   document:student\_documents(\*)

&#x20;               )

&#x20;           `)

&#x20;           .eq('id', applicationId)

&#x20;           .is('deleted\_at', null)

&#x20;           .single();

&#x20;       

&#x20;       if (error || !data) return null;

&#x20;       return data as unknown as ApplicationWithRelations;

&#x20;   }

&#x20;   

&#x20;   /\*\*

&#x20;    \* List applications with filters

&#x20;    \*/

&#x20;   static async listApplications(

&#x20;       freelancerId: string,

&#x20;       params: {

&#x20;           page?: number;

&#x20;           per\_page?: number;

&#x20;           search?: string;

&#x20;           status?: string;

&#x20;           student\_id?: string;

&#x20;           university\_id?: string;

&#x20;           intake?: string;

&#x20;           sort\_by?: string;

&#x20;           sort\_order?: 'asc' | 'desc';

&#x20;       }

&#x20;   ) {

&#x20;       const supabase = await createClient();

&#x20;       const page = params.page || 1;

&#x20;       const perPage = Math.min(params.per\_page || 20, 100);

&#x20;       const offset = (page - 1) \* perPage;

&#x20;       

&#x20;       let query = supabase

&#x20;           .from('applications')

&#x20;           .select(`

&#x20;               \*,

&#x20;               student:students(id, first\_name, last\_name, email, phone),

&#x20;               university:universities(id, name, short\_name, country),

&#x20;               program:programs(id, name, short\_name, degree\_level)

&#x20;           `, { count: 'exact' })

&#x20;           .eq('freelancer\_id', freelancerId)

&#x20;           .is('deleted\_at', null);

&#x20;       

&#x20;       if (params.status) query = query.eq('status', params.status);

&#x20;       if (params.student\_id) query = query.eq('student\_id', params.student\_id);

&#x20;       if (params.university\_id) query = query.eq('university\_id', params.university\_id);

&#x20;       if (params.intake) query = query.eq('intake', params.intake);

&#x20;       

&#x20;       const sortBy = params.sort\_by || 'created\_at';

&#x20;       query = query.order(sortBy, { ascending: params.sort\_order === 'asc' });

&#x20;       query = query.range(offset, offset + perPage - 1);

&#x20;       

&#x20;       const { data, error, count } = await query;

&#x20;       

&#x20;       if (error) throw new AppError('DB\_ERROR', error.message, 500);

&#x20;       

&#x20;       return {

&#x20;           data: data || \[],

&#x20;           meta: {

&#x20;               page,

&#x20;               per\_page: perPage,

&#x20;               total: count || 0,

&#x20;               total\_pages: Math.ceil((count || 0) / perPage),

&#x20;               has\_next: page \* perPage < (count || 0),

&#x20;               has\_prev: page > 1,

&#x20;           },

&#x20;       };

&#x20;   }

}

TypeScript



// src/lib/services/document-service.ts

import { createClient } from '@/lib/supabase/server';

import type { StudentDocument } from '@/types/database';

import { AppError } from './student-service';



const STORAGE\_BUCKET = 'student-documents';



export class DocumentService {

&#x20;   

&#x20;   /\*\*

&#x20;    \* Generate storage path for a document

&#x20;    \*/

&#x20;   static generateStoragePath(

&#x20;       freelancerId: string,

&#x20;       studentId: string,

&#x20;       docType: string,

&#x20;       fileName: string

&#x20;   ): string {

&#x20;       const timestamp = Date.now();

&#x20;       const sanitized = fileName.replace(/\[^a-zA-Z0-9.\_-]/g, '\_').substring(0, 100);

&#x20;       return `${freelancerId}/${studentId}/${docType}/${timestamp}\_${sanitized}`;

&#x20;   }

&#x20;   

&#x20;   /\*\*

&#x20;    \* Upload a document for a student

&#x20;    \* The file upload itself is handled client-side via Supabase Storage SDK.

&#x20;    \* This method creates the database record after upload.

&#x20;    \*/

&#x20;   static async createDocumentRecord(

&#x20;       studentId: string,

&#x20;       freelancerId: string,

&#x20;       input: {

&#x20;           type: string;

&#x20;           custom\_label?: string | null;

&#x20;           description?: string | null;

&#x20;           file\_name: string;

&#x20;           file\_path: string;

&#x20;           file\_size: number;

&#x20;           mime\_type: string;

&#x20;           issued\_date?: string | null;

&#x20;           expires\_at?: string | null;

&#x20;       }

&#x20;   ): Promise<StudentDocument> {

&#x20;       const supabase = await createClient();

&#x20;       

&#x20;       // Verify student belongs to freelancer

&#x20;       const { data: student } = await supabase

&#x20;           .from('students')

&#x20;           .select('id')

&#x20;           .eq('id', studentId)

&#x20;           .eq('freelancer\_id', freelancerId)

&#x20;           .is('deleted\_at', null)

&#x20;           .single();

&#x20;       

&#x20;       if (!student) {

&#x20;           throw new AppError('NOT\_FOUND', 'Student not found', 404);

&#x20;       }

&#x20;       

&#x20;       // Check for existing latest document of same type (for versioning)

&#x20;       const { data: existingDoc } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .select('id, version')

&#x20;           .eq('student\_id', studentId)

&#x20;           .eq('type', input.type)

&#x20;           .eq('is\_latest', true)

&#x20;           .is('deleted\_at', null)

&#x20;           .maybeSingle();

&#x20;       

&#x20;       // If exists, mark old as not latest

&#x20;       if (existingDoc) {

&#x20;           await supabase

&#x20;               .from('student\_documents')

&#x20;               .update({ is\_latest: false })

&#x20;               .eq('id', existingDoc.id);

&#x20;       }

&#x20;       

&#x20;       // Create new document record

&#x20;       const { data: doc, error } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .insert({

&#x20;               student\_id: studentId,

&#x20;               uploaded\_by: freelancerId,

&#x20;               type: input.type,

&#x20;               custom\_label: input.custom\_label,

&#x20;               description: input.description,

&#x20;               file\_name: input.file\_name,

&#x20;               file\_path: input.file\_path,

&#x20;               file\_size: input.file\_size,

&#x20;               mime\_type: input.mime\_type,

&#x20;               issued\_date: input.issued\_date,

&#x20;               expires\_at: input.expires\_at,

&#x20;               status: 'uploaded',

&#x20;               version: existingDoc ? existingDoc.version + 1 : 1,

&#x20;               is\_latest: true,

&#x20;               previous\_version\_id: existingDoc?.id || null,

&#x20;           })

&#x20;           .select()

&#x20;           .single();

&#x20;       

&#x20;       if (error || !doc) {

&#x20;           throw new AppError('DB\_ERROR', `Failed to create document record: ${error?.message}`, 500);

&#x20;       }

&#x20;       

&#x20;       // Log activity

&#x20;       await supabase.from('activity\_log').insert({

&#x20;           actor\_id: freelancerId,

&#x20;           action: 'document.uploaded',

&#x20;           entity\_type: 'document',

&#x20;           entity\_id: doc.id,

&#x20;           title: 'Document Uploaded',

&#x20;           description: `Uploaded ${input.type}: ${input.file\_name}`,

&#x20;           related\_entities: { student\_id: studentId },

&#x20;       });

&#x20;       

&#x20;       return doc;

&#x20;   }

&#x20;   

&#x20;   /\*\*

&#x20;    \* Get signed download URL for a document

&#x20;    \*/

&#x20;   static async getDownloadUrl(documentId: string): Promise<string> {

&#x20;       const supabase = await createClient();

&#x20;       

&#x20;       const { data: doc } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .select('file\_path')

&#x20;           .eq('id', documentId)

&#x20;           .single();

&#x20;       

&#x20;       if (!doc) throw new AppError('NOT\_FOUND', 'Document not found', 404);

&#x20;       

&#x20;       const { data: signedUrl, error } = await supabase.storage

&#x20;           .from(STORAGE\_BUCKET)

&#x20;           .createSignedUrl(doc.file\_path, 3600); // 1 hour

&#x20;       

&#x20;       if (error || !signedUrl) {

&#x20;           throw new AppError('STORAGE\_ERROR', 'Failed to generate download URL', 500);

&#x20;       }

&#x20;       

&#x20;       return signedUrl.signedUrl;

&#x20;   }

&#x20;   

&#x20;   /\*\*

&#x20;    \* Get all documents for a student

&#x20;    \*/

&#x20;   static async getStudentDocuments(studentId: string): Promise<StudentDocument\[]> {

&#x20;       const supabase = await createClient();

&#x20;       

&#x20;       const { data, error } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .select('\*')

&#x20;           .eq('student\_id', studentId)

&#x20;           .eq('is\_latest', true)

&#x20;           .is('deleted\_at', null)

&#x20;           .order('created\_at', { ascending: false });

&#x20;       

&#x20;       if (error) throw new AppError('DB\_ERROR', error.message, 500);

&#x20;       return data || \[];

&#x20;   }

&#x20;   

&#x20;   /\*\*

&#x20;    \* Soft delete a document

&#x20;    \*/

&#x20;   static async deleteDocument(documentId: string, freelancerId: string): Promise<void> {

&#x20;       const supabase = await createClient();

&#x20;       

&#x20;       // Check if document is linked to any active application

&#x20;       const { count } = await supabase

&#x20;           .from('application\_documents')

&#x20;           .select('\*', { count: 'exact', head: true })

&#x20;           .eq('document\_id', documentId);

&#x20;       

&#x20;       if (count \&\& count > 0) {

&#x20;           throw new AppError(

&#x20;               'CONFLICT',

&#x20;               'Cannot delete a document that is linked to an application. Unlink it first.',

&#x20;               409

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       const { error } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .update({ deleted\_at: new Date().toISOString() })

&#x20;           .eq('id', documentId)

&#x20;           .eq('uploaded\_by', freelancerId);

&#x20;       

&#x20;       if (error) throw new AppError('DB\_ERROR', error.message, 500);

&#x20;   }

}

11\. API ROUTES

TypeScript



// src/app/api/v1/students/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { StudentService, AppError } from '@/lib/services/student-service';

import { studentWizardSubmitSchema } from '@/lib/validations/student';



// POST /api/v1/students — Create student (+ optional application)

export async function POST(request: NextRequest) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       const body = await request.json();

&#x20;       

&#x20;       // Validate

&#x20;       const parsed = studentWizardSubmitSchema.safeParse(body);

&#x20;       if (!parsed.success) {

&#x20;           return NextResponse.json(

&#x20;               {

&#x20;                   success: false,

&#x20;                   error: {

&#x20;                       code: 'VALIDATION\_ERROR',

&#x20;                       message: 'Validation failed',

&#x20;                       details: parsed.error.errors.map(e => ({

&#x20;                           field: e.path.join('.'),

&#x20;                           message: e.message,

&#x20;                       })),

&#x20;                   },

&#x20;               },

&#x20;               { status: 400 }

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       const result = await StudentService.createStudentWithApplication(parsed.data, user.id);

&#x20;       

&#x20;       return NextResponse.json({ success: true, data: result }, { status: 201 });

&#x20;       

&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message, details: error.details } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       console.error('POST /api/v1/students error:', error);

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}



// GET /api/v1/students — List students

export async function GET(request: NextRequest) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       const searchParams = request.nextUrl.searchParams;

&#x20;       const params = {

&#x20;           page: parseInt(searchParams.get('page') || '1'),

&#x20;           per\_page: parseInt(searchParams.get('per\_page') || '20'),

&#x20;           search: searchParams.get('search') || undefined,

&#x20;           status: searchParams.get('status') || undefined,

&#x20;           sort\_by: searchParams.get('sort\_by') || undefined,

&#x20;           sort\_order: (searchParams.get('sort\_order') as 'asc' | 'desc') || undefined,

&#x20;           tags: searchParams.get('tags')?.split(',').filter(Boolean) || undefined,

&#x20;       };

&#x20;       

&#x20;       const result = await StudentService.listStudents(user.id, params);

&#x20;       

&#x20;       return NextResponse.json({ success: true, ...result });

&#x20;       

&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       console.error('GET /api/v1/students error:', error);

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}

TypeScript



// src/app/api/v1/students/\[id]/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { StudentService, AppError } from '@/lib/services/student-service';



// GET /api/v1/students/:id

export async function GET(

&#x20;   request: NextRequest,

&#x20;   { params }: { params: { id: string } }

) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       const student = await StudentService.getStudentById(params.id);

&#x20;       

&#x20;       if (!student) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'NOT\_FOUND', message: 'Student not found' } },

&#x20;               { status: 404 }

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       return NextResponse.json({ success: true, data: student });

&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}



// PATCH /api/v1/students/:id

export async function PATCH(

&#x20;   request: NextRequest,

&#x20;   { params }: { params: { id: string } }

) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       const body = await request.json();

&#x20;       const student = await StudentService.updateStudent(params.id, user.id, body);

&#x20;       

&#x20;       return NextResponse.json({ success: true, data: student });

&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}



// DELETE /api/v1/students/:id (soft delete)

export async function DELETE(

&#x20;   request: NextRequest,

&#x20;   { params }: { params: { id: string } }

) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       await StudentService.deleteStudent(params.id, user.id);

&#x20;       

&#x20;       return NextResponse.json({ success: true, data: { deleted: true } });

&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}

TypeScript



// src/app/api/v1/applications/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { ApplicationService } from '@/lib/services/application-service';

import { applicationCreateSchema } from '@/lib/validations/application';

import { AppError } from '@/lib/services/student-service';



// POST /api/v1/applications

export async function POST(request: NextRequest) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       const body = await request.json();

&#x20;       const parsed = applicationCreateSchema.safeParse(body);

&#x20;       if (!parsed.success) {

&#x20;           return NextResponse.json(

&#x20;               {

&#x20;                   success: false,

&#x20;                   error: {

&#x20;                       code: 'VALIDATION\_ERROR',

&#x20;                       message: 'Validation failed',

&#x20;                       details: parsed.error.errors.map(e => ({

&#x20;                           field: e.path.join('.'),

&#x20;                           message: e.message,

&#x20;                       })),

&#x20;                   },

&#x20;               },

&#x20;               { status: 400 }

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       const application = await ApplicationService.createApplication(parsed.data, user.id);

&#x20;       

&#x20;       return NextResponse.json({ success: true, data: application }, { status: 201 });

&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message, details: error.details } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       console.error('POST /api/v1/applications error:', error);

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}



// GET /api/v1/applications

export async function GET(request: NextRequest) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       const searchParams = request.nextUrl.searchParams;

&#x20;       const params = {

&#x20;           page: parseInt(searchParams.get('page') || '1'),

&#x20;           per\_page: parseInt(searchParams.get('per\_page') || '20'),

&#x20;           status: searchParams.get('status') || undefined,

&#x20;           student\_id: searchParams.get('student\_id') || undefined,

&#x20;           university\_id: searchParams.get('university\_id') || undefined,

&#x20;           intake: searchParams.get('intake') || undefined,

&#x20;           sort\_by: searchParams.get('sort\_by') || undefined,

&#x20;           sort\_order: (searchParams.get('sort\_order') as 'asc' | 'desc') || undefined,

&#x20;       };

&#x20;       

&#x20;       const result = await ApplicationService.listApplications(user.id, params);

&#x20;       

&#x20;       return NextResponse.json({ success: true, ...result });

&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}

TypeScript



// src/app/api/v1/applications/\[id]/status/route.ts

import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { ApplicationService } from '@/lib/services/application-service';

import { applicationStatusUpdateSchema } from '@/lib/validations/application';

import { getNextStatuses } from '@/lib/state-machines/application-status';

import { AppError } from '@/lib/services/student-service';



// PATCH /api/v1/applications/:id/status

export async function PATCH(

&#x20;   request: NextRequest,

&#x20;   { params }: { params: { id: string } }

) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       const body = await request.json();

&#x20;       const parsed = applicationStatusUpdateSchema.safeParse(body);

&#x20;       if (!parsed.success) {

&#x20;           return NextResponse.json(

&#x20;               {

&#x20;                   success: false,

&#x20;                   error: {

&#x20;                       code: 'VALIDATION\_ERROR',

&#x20;                       message: 'Validation failed',

&#x20;                       details: parsed.error.errors.map(e => ({

&#x20;                           field: e.path.join('.'),

&#x20;                           message: e.message,

&#x20;                       })),

&#x20;                   },

&#x20;               },

&#x20;               { status: 400 }

&#x20;           );

&#x20;       }

&#x20;       

&#x20;       const application = await ApplicationService.updateStatus(params.id, user.id, parsed.data);

&#x20;       

&#x20;       return NextResponse.json({

&#x20;           success: true,

&#x20;           data: {

&#x20;               ...application,

&#x20;               next\_possible\_statuses: getNextStatuses(application.status as any),

&#x20;           },

&#x20;       });

&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message, details: error.details } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}

AGENT: Create similar route files for:



src/app/api/v1/applications/\[id]/route.ts (GET, PATCH, DELETE)

src/app/api/v1/students/\[id]/documents/route.ts (POST upload record, GET list)

src/app/api/v1/students/\[id]/applications/route.ts (GET list)

src/app/api/v1/applications/\[id]/documents/route.ts (POST link, DELETE unlink)

src/app/api/v1/documents/\[id]/route.ts (GET, PATCH, DELETE)

src/app/api/v1/documents/\[id]/download/route.ts (GET signed URL)

src/app/api/v1/universities/route.ts (GET list)

src/app/api/v1/universities/\[id]/programs/route.ts (GET list)

src/app/api/v1/dashboard/stats/route.ts (GET)

Follow the EXACT same pattern as above: auth check → validate → service call → response.



12\. HOOKS

TypeScript



// src/hooks/use-students.ts

'use client';



import { useState, useCallback, useEffect } from 'react';

import type { Student, PaginationMeta, StudentListParams } from '@/types';



interface UseStudentsReturn {

&#x20;   students: Student\[];

&#x20;   meta: PaginationMeta | null;

&#x20;   isLoading: boolean;

&#x20;   error: string | null;

&#x20;   fetchStudents: (params?: StudentListParams) => Promise<void>;

&#x20;   refetch: () => Promise<void>;

}



export function useStudents(initialParams?: StudentListParams): UseStudentsReturn {

&#x20;   const \[students, setStudents] = useState<Student\[]>(\[]);

&#x20;   const \[meta, setMeta] = useState<PaginationMeta | null>(null);

&#x20;   const \[isLoading, setIsLoading] = useState(true);

&#x20;   const \[error, setError] = useState<string | null>(null);

&#x20;   const \[currentParams, setCurrentParams] = useState(initialParams || {});

&#x20;   

&#x20;   const fetchStudents = useCallback(async (params?: StudentListParams) => {

&#x20;       setIsLoading(true);

&#x20;       setError(null);

&#x20;       

&#x20;       const queryParams = params || currentParams;

&#x20;       if (params) setCurrentParams(params);

&#x20;       

&#x20;       try {

&#x20;           const searchParams = new URLSearchParams();

&#x20;           if (queryParams.page) searchParams.set('page', String(queryParams.page));

&#x20;           if (queryParams.per\_page) searchParams.set('per\_page', String(queryParams.per\_page));

&#x20;           if (queryParams.search) searchParams.set('search', queryParams.search);

&#x20;           if (queryParams.status) searchParams.set('status', queryParams.status);

&#x20;           if (queryParams.sort\_by) searchParams.set('sort\_by', queryParams.sort\_by);

&#x20;           if (queryParams.sort\_order) searchParams.set('sort\_order', queryParams.sort\_order);

&#x20;           

&#x20;           const response = await fetch(`/api/v1/students?${searchParams.toString()}`);

&#x20;           const json = await response.json();

&#x20;           

&#x20;           if (!json.success) {

&#x20;               throw new Error(json.error?.message || 'Failed to fetch students');

&#x20;           }

&#x20;           

&#x20;           setStudents(json.data);

&#x20;           setMeta(json.meta);

&#x20;       } catch (err) {

&#x20;           setError(err instanceof Error ? err.message : 'An error occurred');

&#x20;       } finally {

&#x20;           setIsLoading(false);

&#x20;       }

&#x20;   }, \[currentParams]);

&#x20;   

&#x20;   const refetch = useCallback(() => fetchStudents(currentParams), \[fetchStudents, currentParams]);

&#x20;   

&#x20;   useEffect(() => {

&#x20;       fetchStudents();

&#x20;   }, \[]); // eslint-disable-line react-hooks/exhaustive-deps

&#x20;   

&#x20;   return { students, meta, isLoading, error, fetchStudents, refetch };

}

TypeScript



// src/hooks/use-student.ts

'use client';



import { useState, useCallback, useEffect } from 'react';

import type { StudentWithRelations } from '@/types';



export function useStudent(studentId: string) {

&#x20;   const \[student, setStudent] = useState<StudentWithRelations | null>(null);

&#x20;   const \[isLoading, setIsLoading] = useState(true);

&#x20;   const \[error, setError] = useState<string | null>(null);

&#x20;   

&#x20;   const fetchStudent = useCallback(async () => {

&#x20;       if (!studentId) return;

&#x20;       setIsLoading(true);

&#x20;       setError(null);

&#x20;       

&#x20;       try {

&#x20;           const response = await fetch(`/api/v1/students/${studentId}`);

&#x20;           const json = await response.json();

&#x20;           

&#x20;           if (!json.success) throw new Error(json.error?.message || 'Failed to fetch student');

&#x20;           

&#x20;           setStudent(json.data);

&#x20;       } catch (err) {

&#x20;           setError(err instanceof Error ? err.message : 'An error occurred');

&#x20;       } finally {

&#x20;           setIsLoading(false);

&#x20;       }

&#x20;   }, \[studentId]);

&#x20;   

&#x20;   useEffect(() => { fetchStudent(); }, \[fetchStudent]);

&#x20;   

&#x20;   return { student, isLoading, error, refetch: fetchStudent };

}

TypeScript



// src/hooks/use-file-upload.ts

'use client';



import { useState, useCallback } from 'react';

import { createClient } from '@/lib/supabase/client';

import { MAX\_FILE\_SIZE, ALLOWED\_MIME\_TYPES } from '@/lib/validations/document';



interface UploadResult {

&#x20;   file\_path: string;

&#x20;   file\_name: string;

&#x20;   file\_size: number;

&#x20;   mime\_type: string;

}



interface UseFileUploadReturn {

&#x20;   upload: (file: File, path: string) => Promise<UploadResult>;

&#x20;   progress: number;

&#x20;   isUploading: boolean;

&#x20;   error: string | null;

&#x20;   reset: () => void;

}



export function useFileUpload(): UseFileUploadReturn {

&#x20;   const \[progress, setProgress] = useState(0);

&#x20;   const \[isUploading, setIsUploading] = useState(false);

&#x20;   const \[error, setError] = useState<string | null>(null);

&#x20;   

&#x20;   const upload = useCallback(async (file: File, path: string): Promise<UploadResult> => {

&#x20;       setError(null);

&#x20;       setProgress(0);

&#x20;       setIsUploading(true);

&#x20;       

&#x20;       // Client-side validation

&#x20;       if (file.size > MAX\_FILE\_SIZE) {

&#x20;           const errorMsg = `File too large. Maximum size is ${MAX\_FILE\_SIZE / 1024 / 1024}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`;

&#x20;           setError(errorMsg);

&#x20;           setIsUploading(false);

&#x20;           throw new Error(errorMsg);

&#x20;       }

&#x20;       

&#x20;       if (!ALLOWED\_MIME\_TYPES.includes(file.type as any)) {

&#x20;           const errorMsg = `File type "${file.type}" is not allowed. Accepted: PDF, JPG, PNG, WEBP, DOC, DOCX`;

&#x20;           setError(errorMsg);

&#x20;           setIsUploading(false);

&#x20;           throw new Error(errorMsg);

&#x20;       }

&#x20;       

&#x20;       try {

&#x20;           const supabase = createClient();

&#x20;           

&#x20;           // Simulate progress (Supabase JS doesn't give upload progress)

&#x20;           const progressInterval = setInterval(() => {

&#x20;               setProgress(prev => Math.min(prev + 10, 90));

&#x20;           }, 200);

&#x20;           

&#x20;           const { data, error: uploadError } = await supabase.storage

&#x20;               .from('student-documents')

&#x20;               .upload(path, file, {

&#x20;                   cacheControl: '3600',

&#x20;                   upsert: false,

&#x20;               });

&#x20;           

&#x20;           clearInterval(progressInterval);

&#x20;           

&#x20;           if (uploadError) {

&#x20;               throw new Error(uploadError.message);

&#x20;           }

&#x20;           

&#x20;           setProgress(100);

&#x20;           

&#x20;           return {

&#x20;               file\_path: data.path,

&#x20;               file\_name: file.name,

&#x20;               file\_size: file.size,

&#x20;               mime\_type: file.type,

&#x20;           };

&#x20;       } catch (err) {

&#x20;           const errorMsg = err instanceof Error ? err.message : 'Upload failed';

&#x20;           setError(errorMsg);

&#x20;           throw err;

&#x20;       } finally {

&#x20;           setIsUploading(false);

&#x20;       }

&#x20;   }, \[]);

&#x20;   

&#x20;   const reset = useCallback(() => {

&#x20;       setProgress(0);

&#x20;       setIsUploading(false);

&#x20;       setError(null);

&#x20;   }, \[]);

&#x20;   

&#x20;   return { upload, progress, isUploading, error, reset };

}

13\. ZUSTAND STORES

TypeScript



// src/stores/wizard-store.ts

'use client';



import { create } from 'zustand';

import { persist, createJSONStorage } from 'zustand/middleware';

import type { PersonalInfoInput, AcademicPreferencesInput, ApplicationInWizardInput } from '@/lib/validations/student';



interface WizardFormData {

&#x20;   personal: Partial<PersonalInfoInput>;

&#x20;   academic: Partial<AcademicPreferencesInput>;

&#x20;   application: Partial<ApplicationInWizardInput> | null;

&#x20;   createApplication: boolean;

&#x20;   uploadedDocuments: Array<{

&#x20;       id: string;

&#x20;       type: string;

&#x20;       file\_name: string;

&#x20;       file\_size: number;

&#x20;       status: string;

&#x20;   }>;

}



interface WizardState {

&#x20;   // Step management

&#x20;   currentStep: number;

&#x20;   completedSteps: Set<number>;

&#x20;   

&#x20;   // Form data

&#x20;   formData: WizardFormData;

&#x20;   

&#x20;   // Submission state

&#x20;   isSubmitting: boolean;

&#x20;   submissionError: string | null;

&#x20;   

&#x20;   // Draft management

&#x20;   hasDraft: boolean;

&#x20;   draftSavedAt: string | null;

&#x20;   

&#x20;   // Actions

&#x20;   setStep: (step: number) => void;

&#x20;   nextStep: () => void;

&#x20;   prevStep: () => void;

&#x20;   markStepComplete: (step: number) => void;

&#x20;   

&#x20;   updatePersonalData: (data: Partial<PersonalInfoInput>) => void;

&#x20;   updateAcademicData: (data: Partial<AcademicPreferencesInput>) => void;

&#x20;   updateApplicationData: (data: Partial<ApplicationInWizardInput>) => void;

&#x20;   setCreateApplication: (value: boolean) => void;

&#x20;   

&#x20;   addUploadedDocument: (doc: WizardFormData\['uploadedDocuments']\[0]) => void;

&#x20;   removeUploadedDocument: (docId: string) => void;

&#x20;   

&#x20;   setSubmitting: (value: boolean) => void;

&#x20;   setSubmissionError: (error: string | null) => void;

&#x20;   

&#x20;   reset: () => void;

&#x20;   canProceedToStep: (step: number) => boolean;

}



const INITIAL\_FORM\_DATA: WizardFormData = {

&#x20;   personal: {},

&#x20;   academic: {},

&#x20;   application: null,

&#x20;   createApplication: true,

&#x20;   uploadedDocuments: \[],

};



const INITIAL\_STATE = {

&#x20;   currentStep: 0,

&#x20;   completedSteps: new Set<number>(),

&#x20;   formData: INITIAL\_FORM\_DATA,

&#x20;   isSubmitting: false,

&#x20;   submissionError: null,

&#x20;   hasDraft: false,

&#x20;   draftSavedAt: null,

};



export const useWizardStore = create<WizardState>()(

&#x20;   persist(

&#x20;       (set, get) => ({

&#x20;           ...INITIAL\_STATE,

&#x20;           

&#x20;           setStep: (step) => {

&#x20;               if (get().canProceedToStep(step)) {

&#x20;                   set({ currentStep: step });

&#x20;               }

&#x20;           },

&#x20;           

&#x20;           nextStep: () => {

&#x20;               const { currentStep } = get();

&#x20;               const nextStep = currentStep + 1;

&#x20;               if (nextStep <= 3) { // 4 steps: 0-3

&#x20;                   set({

&#x20;                       currentStep: nextStep,

&#x20;                       completedSteps: new Set(\[...get().completedSteps, currentStep]),

&#x20;                   });

&#x20;               }

&#x20;           },

&#x20;           

&#x20;           prevStep: () => {

&#x20;               const { currentStep } = get();

&#x20;               if (currentStep > 0) {

&#x20;                   set({ currentStep: currentStep - 1 });

&#x20;               }

&#x20;           },

&#x20;           

&#x20;           markStepComplete: (step) => {

&#x20;               set({ completedSteps: new Set(\[...get().completedSteps, step]) });

&#x20;           },

&#x20;           

&#x20;           updatePersonalData: (data) => set((state) => ({

&#x20;               formData: {

&#x20;                   ...state.formData,

&#x20;                   personal: { ...state.formData.personal, ...data },

&#x20;               },

&#x20;               hasDraft: true,

&#x20;               draftSavedAt: new Date().toISOString(),

&#x20;           })),

&#x20;           

&#x20;           updateAcademicData: (data) => set((state) => ({

&#x20;               formData: {

&#x20;                   ...state.formData,

&#x20;                   academic: { ...state.formData.academic, ...data },

&#x20;               },

&#x20;               hasDraft: true,

&#x20;               draftSavedAt: new Date().toISOString(),

&#x20;           })),

&#x20;           

&#x20;           updateApplicationData: (data) => set((state) => ({

&#x20;               formData: {

&#x20;                   ...state.formData,

&#x20;                   application: { ...(state.formData.application || {}), ...data },

&#x20;               },

&#x20;               hasDraft: true,

&#x20;               draftSavedAt: new Date().toISOString(),

&#x20;           })),

&#x20;           

&#x20;           setCreateApplication: (value) => set((state) => ({

&#x20;               formData: {

&#x20;                   ...state.formData,

&#x20;                   createApplication: value,

&#x20;                   application: value ? state.formData.application : null,

&#x20;               },

&#x20;           })),

&#x20;           

&#x20;           addUploadedDocument: (doc) => set((state) => ({

&#x20;               formData: {

&#x20;                   ...state.formData,

&#x20;                   uploadedDocuments: \[...state.formData.uploadedDocuments, doc],

&#x20;               },

&#x20;           })),

&#x20;           

&#x20;           removeUploadedDocument: (docId) => set((state) => ({

&#x20;               formData: {

&#x20;                   ...state.formData,

&#x20;                   uploadedDocuments: state.formData.uploadedDocuments.filter(d => d.id !== docId),

&#x20;               },

&#x20;           })),

&#x20;           

&#x20;           setSubmitting: (value) => set({ isSubmitting: value }),

&#x20;           setSubmissionError: (error) => set({ submissionError: error }),

&#x20;           

&#x20;           reset: () => set({

&#x20;               ...INITIAL\_STATE,

&#x20;               completedSteps: new Set(),

&#x20;           }),

&#x20;           

&#x20;           canProceedToStep: (step) => {

&#x20;               if (step === 0) return true;

&#x20;               const { completedSteps } = get();

&#x20;               // Must complete all previous steps

&#x20;               for (let i = 0; i < step; i++) {

&#x20;                   if (!completedSteps.has(i)) return false;

&#x20;               }

&#x20;               return true;

&#x20;           },

&#x20;       }),

&#x20;       {

&#x20;           name: 'student-add-wizard',

&#x20;           storage: createJSONStorage(() => localStorage),

&#x20;           partialize: (state) => ({

&#x20;               formData: state.formData,

&#x20;               currentStep: state.currentStep,

&#x20;               completedSteps: Array.from(state.completedSteps), // Set → Array for JSON

&#x20;               hasDraft: state.hasDraft,

&#x20;               draftSavedAt: state.draftSavedAt,

&#x20;           }),

&#x20;           onRehydrateStorage: () => (state) => {

&#x20;               // Convert completedSteps back from Array to Set

&#x20;               if (state \&\& Array.isArray(state.completedSteps)) {

&#x20;                   state.completedSteps = new Set(state.completedSteps as unknown as number\[]);

&#x20;               }

&#x20;           },

&#x20;       }

&#x20;   )

);

14\. CONSTANTS \& CONFIG

TypeScript



// src/lib/constants/document-types.ts



export const DOCUMENT\_TYPE\_CONFIG: Record<string, {

&#x20;   label: string;

&#x20;   description: string;

&#x20;   icon: string;

&#x20;   commonFileTypes: string\[];

}> = {

&#x20;   passport:              { label: 'Passport',               description: 'Valid passport (front page with photo)',     icon: 'BookOpen',    commonFileTypes: \['pdf', 'jpg'] },

&#x20;   national\_id:           { label: 'National ID',            description: 'Government-issued ID card',                  icon: 'CreditCard',  commonFileTypes: \['pdf', 'jpg'] },

&#x20;   photo:                 { label: 'Passport Photo',         description: 'Recent passport-size photograph',            icon: 'Image',       commonFileTypes: \['jpg', 'png'] },

&#x20;   academic\_transcript:   { label: 'Academic Transcript',    description: 'Official transcript from university/school', icon: 'FileText',    commonFileTypes: \['pdf'] },

&#x20;   degree\_certificate:    { label: 'Degree Certificate',     description: 'Degree/diploma completion certificate',      icon: 'Award',       commonFileTypes: \['pdf'] },

&#x20;   marksheet:             { label: 'Marksheet',              description: 'Semester or annual marksheets',              icon: 'ClipboardList', commonFileTypes: \['pdf'] },

&#x20;   recommendation\_letter: { label: 'Recommendation Letter',  description: 'Letter of recommendation from professor/employer', icon: 'Mail',  commonFileTypes: \['pdf'] },

&#x20;   statement\_of\_purpose:  { label: 'Statement of Purpose',   description: 'SOP / Personal statement',                  icon: 'PenTool',     commonFileTypes: \['pdf', 'docx'] },

&#x20;   cv\_resume:             { label: 'CV / Resume',            description: 'Updated curriculum vitae',                   icon: 'User',        commonFileTypes: \['pdf', 'docx'] },

&#x20;   language\_test\_score:   { label: 'Language Test Score',     description: 'IELTS, TOEFL, PTE, or other test results',  icon: 'Languages',   commonFileTypes: \['pdf'] },

&#x20;   financial\_proof:       { label: 'Financial Proof',         description: 'Bank statement or financial documents',      icon: 'Landmark',    commonFileTypes: \['pdf'] },

&#x20;   bank\_statement:        { label: 'Bank Statement',          description: 'Recent bank statement (3-6 months)',         icon: 'Receipt',     commonFileTypes: \['pdf'] },

&#x20;   sponsorship\_letter:    { label: 'Sponsorship Letter',      description: 'Financial sponsorship letter',               icon: 'Heart',       commonFileTypes: \['pdf'] },

&#x20;   medical\_report:        { label: 'Medical Report',          description: 'Health/medical examination report',          icon: 'Activity',    commonFileTypes: \['pdf'] },

&#x20;   police\_clearance:      { label: 'Police Clearance',        description: 'Police verification certificate',            icon: 'Shield',      commonFileTypes: \['pdf'] },

&#x20;   visa\_document:         { label: 'Visa Document',           description: 'Visa or visa-related documents',             icon: 'Globe',       commonFileTypes: \['pdf'] },

&#x20;   admission\_letter:      { label: 'Admission Letter',        description: 'University admission/offer letter',          icon: 'FileCheck',   commonFileTypes: \['pdf'] },

&#x20;   scholarship\_letter:    { label: 'Scholarship Letter',      description: 'Scholarship award letter',                   icon: 'Star',        commonFileTypes: \['pdf'] },

&#x20;   other:                 { label: 'Other',                   description: 'Any other document',                         icon: 'File',        commonFileTypes: \['pdf', 'jpg', 'docx'] },

};



export const DOCUMENT\_TYPES\_LIST = Object.entries(DOCUMENT\_TYPE\_CONFIG).map((\[value, config]) => ({

&#x20;   value,

&#x20;   label: config.label,

&#x20;   description: config.description,

}));

TypeScript



// src/lib/constants/countries.ts

export const COUNTRIES = \[

&#x20;   { code: 'IN', name: 'India' },

&#x20;   { code: 'US', name: 'United States' },

&#x20;   { code: 'GB', name: 'United Kingdom' },

&#x20;   { code: 'CA', name: 'Canada' },

&#x20;   { code: 'AU', name: 'Australia' },

&#x20;   { code: 'DE', name: 'Germany' },

&#x20;   { code: 'FR', name: 'France' },

&#x20;   { code: 'SG', name: 'Singapore' },

&#x20;   { code: 'NZ', name: 'New Zealand' },

&#x20;   { code: 'IE', name: 'Ireland' },

&#x20;   { code: 'NL', name: 'Netherlands' },

&#x20;   { code: 'SE', name: 'Sweden' },

&#x20;   { code: 'CH', name: 'Switzerland' },

&#x20;   { code: 'JP', name: 'Japan' },

&#x20;   { code: 'KR', name: 'South Korea' },

&#x20;   { code: 'AE', name: 'United Arab Emirates' },

&#x20;   // Add more as needed

];



export const TARGET\_STUDY\_COUNTRIES = COUNTRIES.filter(c =>

&#x20;   \['US', 'GB', 'CA', 'AU', 'DE', 'FR', 'SG', 'NZ', 'IE', 'NL', 'SE', 'CH'].includes(c.code)

);

15\. FOLDER STRUCTURE (Complete)

text



src/

├── app/

│   ├── (auth)/

│   │   ├── login/page.tsx

│   │   ├── register/page.tsx

│   │   └── layout.tsx

│   │

│   ├── (dashboard)/

│   │   ├── layout.tsx                          # Dashboard layout with sidebar

│   │   ├── page.tsx                            # Dashboard home (redirect or stats)

│   │   │

│   │   ├── dashboard/

│   │   │   └── page.tsx                        # Stats \& overview

│   │   │

│   │   ├── students/

│   │   │   ├── page.tsx                        # Student list

│   │   │   ├── loading.tsx                     # Loading skeleton

│   │   │   ├── add/

│   │   │   │   └── page.tsx                    # Add student wizard

│   │   │   └── \[id]/

│   │   │       ├── page.tsx                    # Student profile (overview)

│   │   │       ├── loading.tsx

│   │   │       ├── documents/page.tsx          # Documents tab

│   │   │       ├── applications/page.tsx       # Applications tab

│   │   │       ├── activity/page.tsx           # Activity log tab

│   │   │       └── edit/page.tsx               # Edit student details

│   │   │

│   │   ├── applications/

│   │   │   ├── page.tsx                        # All applications list

│   │   │   ├── loading.tsx

│   │   │   └── \[id]/

│   │   │       ├── page.tsx                    # Application detail

│   │   │       └── loading.tsx

│   │   │

│   │   └── settings/

│   │       └── page.tsx                        # User settings

│   │

│   ├── api/v1/

│   │   ├── students/

│   │   │   ├── route.ts                        # POST, GET

│   │   │   └── \[id]/

│   │   │       ├── route.ts                    # GET, PATCH, DELETE

│   │   │       ├── status/route.ts             # PATCH

│   │   │       ├── documents/route.ts          # POST, GET

│   │   │       └── applications/route.ts       # GET

│   │   │

│   │   ├── applications/

│   │   │   ├── route.ts                        # POST, GET

│   │   │   └── \[id]/

│   │   │       ├── route.ts                    # GET, PATCH, DELETE

│   │   │       ├── status/route.ts             # PATCH

│   │   │       └── documents/route.ts          # POST, DELETE

│   │   │

│   │   ├── documents/

│   │   │   └── \[id]/

│   │   │       ├── route.ts                    # GET, PATCH, DELETE

│   │   │       └── download/route.ts           # GET (signed URL)

│   │   │

│   │   ├── universities/

│   │   │   ├── route.ts                        # GET

│   │   │   └── \[id]/

│   │   │       └── programs/route.ts           # GET

│   │   │

│   │   └── dashboard/

│   │       └── stats/route.ts                  # GET

│   │

│   ├── layout.tsx                              # Root layout

│   ├── page.tsx                                # Landing / redirect

│   ├── globals.css

│   └── not-found.tsx

│

├── components/

│   ├── layout/

│   │   ├── sidebar.tsx

│   │   ├── header.tsx

│   │   ├── nav-links.tsx

│   │   └── user-menu.tsx

│   │

│   ├── students/

│   │   ├── student-add-wizard.tsx

│   │   ├── steps/

│   │   │   ├── personal-info-step.tsx

│   │   │   ├── academic-preferences-step.tsx

│   │   │   ├── document-upload-step.tsx

│   │   │   └── review-submit-step.tsx

│   │   ├── student-list-table.tsx

│   │   ├── student-list-filters.tsx

│   │   ├── student-profile-header.tsx

│   │   ├── student-profile-tabs.tsx

│   │   ├── student-overview-tab.tsx

│   │   ├── student-status-badge.tsx

│   │   └── student-quick-stats.tsx

│   │

│   ├── applications/

│   │   ├── application-create-form.tsx

│   │   ├── application-create-modal.tsx

│   │   ├── application-card.tsx

│   │   ├── application-detail-view.tsx

│   │   ├── application-list-table.tsx

│   │   ├── application-status-badge.tsx

│   │   ├── application-status-updater.tsx

│   │   ├── application-timeline.tsx

│   │   └── application-document-linker.tsx

│   │

│   ├── documents/

│   │   ├── document-uploader.tsx

│   │   ├── document-dropzone.tsx

│   │   ├── document-list.tsx

│   │   ├── document-card.tsx

│   │   ├── document-selector.tsx

│   │   ├── document-requirements-checklist.tsx

│   │   ├── document-preview-modal.tsx

│   │   └── document-status-badge.tsx

│   │

│   ├── dashboard/

│   │   ├── stats-cards.tsx

│   │   ├── recent-activity.tsx

│   │   ├── upcoming-deadlines.tsx

│   │   └── conversion-chart.tsx

│   │

│   ├── shared/

│   │   ├── wizard-shell.tsx

│   │   ├── wizard-progress-bar.tsx

│   │   ├── confirmation-dialog.tsx

│   │   ├── empty-state.tsx

│   │   ├── error-display.tsx

│   │   ├── loading-skeleton.tsx

│   │   ├── page-header.tsx

│   │   ├── data-table.tsx

│   │   ├── pagination.tsx

│   │   ├── search-input.tsx

│   │   └── status-filter.tsx

│   │

│   └── ui/                                     # shadcn/ui components

│       ├── button.tsx

│       ├── input.tsx

│       ├── label.tsx

│       ├── select.tsx

│       ├── textarea.tsx

│       ├── checkbox.tsx

│       ├── radio-group.tsx

│       ├── dialog.tsx

│       ├── sheet.tsx

│       ├── tabs.tsx

│       ├── badge.tsx

│       ├── card.tsx

│       ├── table.tsx

│       ├── toast.tsx

│       ├── toaster.tsx

│       ├── separator.tsx

│       ├── skeleton.tsx

│       ├── dropdown-menu.tsx

│       ├── command.tsx

│       ├── popover.tsx

│       ├── calendar.tsx

│       ├── form.tsx

│       ├── scroll-area.tsx

│       ├── avatar.tsx

│       ├── progress.tsx

│       ├── alert.tsx

│       ├── tooltip.tsx

│       └── sonner.tsx

│

├── hooks/

│   ├── use-students.ts

│   ├── use-student.ts

│   ├── use-applications.ts

│   ├── use-application.ts

│   ├── use-documents.ts

│   ├── use-file-upload.ts

│   ├── use-universities.ts

│   ├── use-programs.ts

│   ├── use-dashboard-stats.ts

│   ├── use-debounce.ts

│   └── use-media-query.ts

│

├── lib/

│   ├── supabase/

│   │   ├── client.ts                           # Browser Supabase client

│   │   ├── server.ts                           # Server Supabase client

│   │   ├── admin.ts                            # Service role client (admin ops)

│   │   └── middleware.ts                       # Auth middleware helper

│   │

│   ├── validations/

│   │   ├── student.ts

│   │   ├── application.ts

│   │   └── document.ts

│   │

│   ├── state-machines/

│   │   ├── application-status.ts

│   │   ├── student-status.ts

│   │   └── document-status.ts

│   │

│   ├── services/

│   │   ├── student-service.ts

│   │   ├── application-service.ts

│   │   └── document-service.ts

│   │

│   ├── utils/

│   │   ├── format.ts                           # formatDate, formatCurrency, formatFileSize

│   │   ├── file.ts                             # getFileExtension, isAllowedFile

│   │   ├── error.ts                            # parseApiError

│   │   ├── cn.ts                               # className merger (shadcn)

│   │   └── helpers.ts                          # misc helpers

│   │

│   └── constants/

│       ├── document-types.ts

│       ├── countries.ts

│       ├── nav-links.ts

│       └── config.ts                           # App-wide config

│

├── stores/

│   ├── wizard-store.ts

│   └── filter-store.ts

│

├── types/

│   ├── database.ts                             # All DB entity types

│   ├── api.ts                                  # API request/response types

│   └── index.ts                                # Re-exports

│

└── middleware.ts                               # Next.js middleware (auth guard)

16\. BUILD ORDER

AGENT: Follow this order EXACTLY. Each phase depends on the previous one. Do NOT jump ahead.



text



═══════════════════════════════════════════════════════════════

PHASE 0: PROJECT SETUP (do first, before any code)

═══════════════════════════════════════════════════════════════

☐ Create Next.js project: npx create-next-app@latest --typescript --tailwind --eslint --app --src-dir

☐ Install dependencies:

&#x20;   npm install @supabase/supabase-js @supabase/ssr

&#x20;   npm install zustand

&#x20;   npm install zod

&#x20;   npm install react-hook-form @hookform/resolvers

&#x20;   npm install @tanstack/react-table

&#x20;   npm install lucide-react

&#x20;   npm install date-fns

&#x20;   npm install sonner

&#x20;   npm install clsx tailwind-merge

&#x20;   

☐ Initialize shadcn/ui: npx shadcn@latest init

☐ Add shadcn components:

&#x20;   npx shadcn@latest add button input label select textarea checkbox

&#x20;   npx shadcn@latest add radio-group dialog sheet tabs badge card

&#x20;   npx shadcn@latest add table toast separator skeleton dropdown-menu

&#x20;   npx shadcn@latest add command popover calendar form scroll-area

&#x20;   npx shadcn@latest add avatar progress alert tooltip sonner



☐ Set up Supabase project (create via dashboard.supabase.com)

☐ Add env variables to .env.local:

&#x20;   NEXT\_PUBLIC\_SUPABASE\_URL=your-url

&#x20;   NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=your-anon-key

&#x20;   SUPABASE\_SERVICE\_ROLE\_KEY=your-service-key



☐ Create Supabase clients (src/lib/supabase/client.ts, server.ts, admin.ts)

☐ Create middleware.ts for auth

☐ Run ALL SQL from sections 3, 4, 5, 6 in Supabase SQL Editor

☐ Create storage bucket "student-documents" in Supabase Dashboard

☐ Verify: tables exist, triggers work, RLS enabled, seed data present





═══════════════════════════════════════════════════════════════

PHASE 1: FOUNDATION — Types, Validations, State Machines

═══════════════════════════════════════════════════════════════

☐ src/types/database.ts

☐ src/types/api.ts

☐ src/types/index.ts

☐ src/lib/state-machines/application-status.ts

☐ src/lib/state-machines/student-status.ts

☐ src/lib/state-machines/document-status.ts

☐ src/lib/validations/student.ts

☐ src/lib/validations/application.ts

☐ src/lib/validations/document.ts

☐ src/lib/constants/document-types.ts

☐ src/lib/constants/countries.ts

☐ src/lib/constants/config.ts

☐ src/lib/utils/format.ts

☐ src/lib/utils/file.ts

☐ src/lib/utils/error.ts

☐ src/lib/utils/cn.ts





═══════════════════════════════════════════════════════════════

PHASE 2: SERVICE LAYER + API ROUTES

═══════════════════════════════════════════════════════════════

☐ src/lib/services/student-service.ts (AppError class + StudentService)

☐ src/lib/services/application-service.ts

☐ src/lib/services/document-service.ts

☐ src/app/api/v1/students/route.ts (POST + GET)

☐ src/app/api/v1/students/\[id]/route.ts (GET + PATCH + DELETE)

☐ src/app/api/v1/students/\[id]/documents/route.ts

☐ src/app/api/v1/students/\[id]/applications/route.ts

☐ src/app/api/v1/applications/route.ts (POST + GET)

☐ src/app/api/v1/applications/\[id]/route.ts

☐ src/app/api/v1/applications/\[id]/status/route.ts

☐ src/app/api/v1/applications/\[id]/documents/route.ts

☐ src/app/api/v1/documents/\[id]/route.ts

☐ src/app/api/v1/documents/\[id]/download/route.ts

☐ src/app/api/v1/universities/route.ts

☐ src/app/api/v1/universities/\[id]/programs/route.ts

☐ src/app/api/v1/dashboard/stats/route.ts



TEST: Use Postman/Thunder Client to test every endpoint manually.





═══════════════════════════════════════════════════════════════

PHASE 3: HOOKS + STORES

═══════════════════════════════════════════════════════════════

☐ src/hooks/use-students.ts

☐ src/hooks/use-student.ts

☐ src/hooks/use-applications.ts

☐ src/hooks/use-application.ts

☐ src/hooks/use-documents.ts

☐ src/hooks/use-file-upload.ts

☐ src/hooks/use-universities.ts

☐ src/hooks/use-programs.ts

☐ src/hooks/use-dashboard-stats.ts

☐ src/hooks/use-debounce.ts

☐ src/stores/wizard-store.ts

☐ src/stores/filter-store.ts





═══════════════════════════════════════════════════════════════

PHASE 4: LAYOUT + SHARED COMPONENTS

═══════════════════════════════════════════════════════════════

☐ src/components/layout/sidebar.tsx

☐ src/components/layout/header.tsx

☐ src/components/layout/nav-links.tsx

☐ src/components/layout/user-menu.tsx

☐ src/app/(dashboard)/layout.tsx

☐ src/components/shared/wizard-shell.tsx

☐ src/components/shared/wizard-progress-bar.tsx

☐ src/components/shared/page-header.tsx

☐ src/components/shared/data-table.tsx

☐ src/components/shared/pagination.tsx

☐ src/components/shared/search-input.tsx

☐ src/components/shared/status-filter.tsx

☐ src/components/shared/empty-state.tsx

☐ src/components/shared/loading-skeleton.tsx

☐ src/components/shared/error-display.tsx

☐ src/components/shared/confirmation-dialog.tsx





═══════════════════════════════════════════════════════════════

PHASE 5: STUDENT LIST PAGE

═══════════════════════════════════════════════════════════════

☐ src/components/students/student-status-badge.tsx

☐ src/components/students/student-list-filters.tsx

☐ src/components/students/student-list-table.tsx

☐ src/app/(dashboard)/students/page.tsx

☐ src/app/(dashboard)/students/loading.tsx



TEST: Can see student list, search, filter by status, paginate.





═══════════════════════════════════════════════════════════════

PHASE 6: ADD STUDENT WIZARD (the main feature)

═══════════════════════════════════════════════════════════════

☐ src/components/students/steps/personal-info-step.tsx

☐ src/components/students/steps/academic-preferences-step.tsx

☐ src/components/documents/document-dropzone.tsx

☐ src/components/documents/document-card.tsx

☐ src/components/students/steps/document-upload-step.tsx

☐ src/components/students/steps/review-submit-step.tsx

☐ src/components/students/student-add-wizard.tsx

☐ src/app/(dashboard)/students/add/page.tsx



TEST: Full wizard flow:

&#x20; - Fill Step 1 (personal) → Next

&#x20; - Fill Step 2 (academic + choose to create app) → Next

&#x20; - Upload 1-2 docs in Step 3 → Next

&#x20; - Review everything in Step 4 → Submit

&#x20; - Verify: student created in DB, application created, docs linked

&#x20; - Test: close browser mid-wizard, reopen — draft should resume

&#x20; - Test: skip application creation — only student created





═══════════════════════════════════════════════════════════════

PHASE 7: STUDENT PROFILE PAGE

═══════════════════════════════════════════════════════════════

☐ src/components/students/student-profile-header.tsx

☐ src/components/students/student-profile-tabs.tsx

☐ src/components/students/student-overview-tab.tsx

☐ src/components/students/student-quick-stats.tsx

☐ src/components/documents/document-list.tsx

☐ src/components/documents/document-uploader.tsx

☐ src/components/documents/document-status-badge.tsx

☐ src/components/documents/document-requirements-checklist.tsx

☐ src/components/applications/application-card.tsx

☐ src/components/applications/application-status-badge.tsx

☐ src/app/(dashboard)/students/\[id]/page.tsx

☐ src/app/(dashboard)/students/\[id]/documents/page.tsx

☐ src/app/(dashboard)/students/\[id]/applications/page.tsx

☐ src/app/(dashboard)/students/\[id]/activity/page.tsx



TEST: View student profile, see overview, documents tab, applications tab, activity log.





═══════════════════════════════════════════════════════════════

PHASE 8: APPLICATION MANAGEMENT

═══════════════════════════════════════════════════════════════

☐ src/components/applications/application-create-form.tsx

☐ src/components/applications/application-create-modal.tsx

☐ src/components/documents/document-selector.tsx

☐ src/components/applications/application-status-updater.tsx

☐ src/components/applications/application-timeline.tsx

☐ src/components/applications/application-detail-view.tsx

☐ src/components/applications/application-list-table.tsx

☐ src/components/applications/application-document-linker.tsx

☐ src/app/(dashboard)/applications/page.tsx

☐ src/app/(dashboard)/applications/\[id]/page.tsx



TEST: 

&#x20; - Create application from student profile (Flow B)

&#x20; - View application details

&#x20; - Update status (check state machine works — try invalid transitions)

&#x20; - Link/unlink documents

&#x20; - View status timeline





═══════════════════════════════════════════════════════════════

PHASE 9: DASHBOARD

═══════════════════════════════════════════════════════════════

☐ src/components/dashboard/stats-cards.tsx

☐ src/components/dashboard/recent-activity.tsx

☐ src/components/dashboard/upcoming-deadlines.tsx

☐ src/app/(dashboard)/dashboard/page.tsx



TEST: Dashboard shows correct counts, recent activity, upcoming deadlines.





═══════════════════════════════════════════════════════════════

PHASE 10: POLISH \& EDGE CASES

═══════════════════════════════════════════════════════════════

☐ Duplicate student detection (show warning on phone match)

☐ Duplicate application detection (show error on same program+intake)

☐ Document preview modal (PDF viewer, image preview)

☐ Toast notifications for all actions (create, update, delete, error)

☐ Confirmation dialogs before destructive actions (delete, withdraw)

☐ Loading skeletons on every page

☐ Empty states on every list (no students yet, no applications yet)

☐ Error boundaries

☐ Mobile responsive layout

☐ Keyboard navigation (wizard steps, form fields)

☐ 404 page for invalid student/application IDs

17\. EDGE CASES CHECKLIST

AGENT: After building, test every single one of these. If any fails, fix it before moving on.



text



WIZARD EDGE CASES:

☐ Close browser during Step 2 → Reopen → Draft loads from localStorage

☐ Fill Step 1, skip to Step 3 directly → Should be blocked (must complete in order)

☐ Submit wizard with no internet → Show error, don't lose form data

☐ Submit wizard twice quickly (double click) → Prevent duplicate submission

☐ Enter same phone number as existing student → Show "already exists" warning

☐ Enter future date of birth → Validation error

☐ Upload file > 10MB → Client-side rejection before upload starts

☐ Upload .exe file renamed to .pdf → Server-side MIME check rejects it

☐ Choose "Create application" but don't fill university → Validation error on Step 2

☐ Choose "Skip application" → Only student created, status = "lead"

☐ Upload document, then go back to Step 1 and change data → Document still preserved



APPLICATION EDGE CASES:

☐ Try to transition from "draft" to "enrolled" → Rejected by state machine

☐ Try to change status of "enrolled" application → Blocked (terminal state)

☐ Change to "rejected" without reason → Validation error (reason required)

☐ Create duplicate application (same student + program + intake) → 409 Conflict

☐ Delete student with active application → Blocked with clear error message

☐ Application deadline is past → Show warning badge, still allow submission

☐ Update application status → Check student status auto-syncs



DOCUMENT EDGE CASES:

☐ Upload same type twice (e.g., 2 passports) → Versioning: old becomes v1, new becomes v2

☐ Delete document that's linked to an application → Blocked with error

☐ Document with expires\_at in the past → Should show "Expired" status

☐ Download document → Returns signed URL (expires in 1 hour)

☐ Upload 0-byte file → Rejected by file\_size > 0 constraint



DATA EDGE CASES:

☐ Freelancer A tries to view Freelancer B's student → RLS blocks it, returns 404

☐ Non-authenticated request to any API → Returns 401

☐ Malformed JSON in POST body → Returns 400 with clear error

☐ SQL injection in search query → Parameterized queries prevent it

☐ XSS in student name → React auto-escapes, no dangerouslySetInnerHTML used

18\. TESTING CHECKLIST (Manual)

text



After completing all phases, run through these complete user journeys:



JOURNEY 1: New Freelancer, First Student

☐ Register / Login as freelancer

☐ See empty dashboard ("No students yet" empty state)

☐ Click "Add Student"

☐ Fill Step 1: Personal info (name, phone, email, DOB)

☐ Fill Step 2: Academic preferences + Choose "Create Application"

☐ Select university → programs load → select program → select intake

☐ Upload 2 documents in Step 3

☐ Review everything in Step 4

☐ Submit → Redirected to student profile

☐ Verify: Student exists, Application exists, Documents linked

☐ Dashboard shows: 1 student, 1 application



JOURNEY 2: Existing Student, New Application

☐ Go to student profile from Journey 1

☐ Click "Applications" tab

☐ Click "+ Create New Application"

☐ Select different university/program

☐ Reuse existing documents (checkboxes)

☐ Submit → New application appears in list

☐ Verify: Student now has 2 applications



JOURNEY 3: Application Lifecycle

☐ Go to application from Journey 1

☐ Update status: draft → documents\_pending → ready\_to\_submit

☐ Update status: ready\_to\_submit → submitted (add university ref number)

☐ Update status: submitted → under\_review

☐ Update status: under\_review → unconditional\_offer

☐ Update status: unconditional\_offer → offer\_accepted

☐ Update status: offer\_accepted → enrolled

☐ Verify: Student status auto-changed to "enrolled"

☐ Verify: Status history shows all 7 transitions

☐ Verify: Activity log shows all actions



JOURNEY 4: Rejected + Retry

☐ Go to application from Journey 2

☐ Update status: → submitted → under\_review → rejected (with reason)

☐ Verify: Rejection reason saved

☐ Try to change status again → Blocked (can only defer)

☐ Defer → draft → re-submit



JOURNEY 5: Document Management

☐ Go to student profile

☐ Upload a new document (e.g., language test score)

☐ Re-upload passport (should create v2, old becomes v1)

☐ Link new document to existing application

☐ Try to delete a linked document → Blocked

☐ Unlink document from application → Now can delete



ADDENDUM: CLOUDINARY DOCUMENT STORAGE INTEGRATION

AGENT: This REPLACES all Supabase Storage references in the main specification. Documents (PDFs, images, etc.) are stored on Cloudinary. Everything else (auth, database, realtime) stays on Supabase. Apply these changes ON TOP of the main spec.



WHAT CHANGED \& WHY

text



BEFORE:

&#x20; Auth        → Supabase Auth       ✅ (stays)

&#x20; Database    → Supabase PostgreSQL  ✅ (stays)

&#x20; Realtime    → Supabase Realtime    ✅ (stays)

&#x20; Documents   → Supabase Storage     ❌ (limited free tier: 1GB)



AFTER:

&#x20; Auth        → Supabase Auth       ✅

&#x20; Database    → Supabase PostgreSQL  ✅

&#x20; Realtime    → Supabase Realtime    ✅

&#x20; Documents   → Cloudinary           ✅ (25GB free, auto-optimization, CDN)



WHY CLOUDINARY:

&#x20; • Supabase free tier: 1GB storage (fills fast with PDFs/scans)

&#x20; • Cloudinary free tier: 25GB storage + 25GB bandwidth/month

&#x20; • Auto image optimization (compress passport scans, photos)

&#x20; • Built-in CDN (fast document downloads globally)

&#x20; • PDF thumbnail generation (preview without downloading)

&#x20; • Transformation URLs (resize, watermark, convert format)

&#x20; • Signed URLs for secure access (same as Supabase signed URLs)

&#x20; • Easy delete/replace (no orphaned files)

1\. ADDITIONAL DEPENDENCIES

Bash



\# Add to your npm install command:

npm install cloudinary

npm install next-cloudinary    # Optional: React components for upload widget

2\. ENVIRONMENT VARIABLES

Add these to your .env.local alongside the existing Supabase vars:



env



\# ── Supabase (already exists) ──

NEXT\_PUBLIC\_SUPABASE\_URL=your-supabase-url

NEXT\_PUBLIC\_SUPABASE\_ANON\_KEY=your-anon-key

SUPABASE\_SERVICE\_ROLE\_KEY=your-service-role-key



\# ── Cloudinary (NEW) ──

CLOUDINARY\_CLOUD\_NAME=your-cloud-name

CLOUDINARY\_API\_KEY=your-api-key

CLOUDINARY\_API\_SECRET=your-api-secret

NEXT\_PUBLIC\_CLOUDINARY\_CLOUD\_NAME=your-cloud-name



\# Combined URL format (used by Cloudinary SDK)

CLOUDINARY\_URL=cloudinary://your-api-key:your-api-secret@your-cloud-name

3\. CLOUDINARY CONFIGURATION

TypeScript



// src/lib/cloudinary/config.ts



import { v2 as cloudinary } from 'cloudinary';



// Configure Cloudinary (server-side only — NEVER expose API\_SECRET to client)

cloudinary.config({

&#x20;   cloud\_name: process.env.CLOUDINARY\_CLOUD\_NAME!,

&#x20;   api\_key: process.env.CLOUDINARY\_API\_KEY!,

&#x20;   api\_secret: process.env.CLOUDINARY\_API\_SECRET!,

&#x20;   secure: true,

});



export default cloudinary;



// ── Storage Configuration ──



export const CLOUDINARY\_CONFIG = {

&#x20;   // Root folder in Cloudinary for all documents

&#x20;   ROOT\_FOLDER: 'student-portal',



&#x20;   // Max file size (10MB)

&#x20;   MAX\_FILE\_SIZE: 10 \* 1024 \* 1024,



&#x20;   // Allowed formats

&#x20;   ALLOWED\_FORMATS: \['pdf', 'jpg', 'jpeg', 'png', 'webp', 'doc', 'docx'],



&#x20;   // Allowed MIME types (for client-side validation)

&#x20;   ALLOWED\_MIME\_TYPES: \[

&#x20;       'application/pdf',

&#x20;       'image/jpeg',

&#x20;       'image/png',

&#x20;       'image/webp',

&#x20;       'application/msword',

&#x20;       'application/vnd.openxmlformats-officedocument.wordprocessingml.document',

&#x20;   ] as const,



&#x20;   // Resource type mapping

&#x20;   RESOURCE\_TYPE\_MAP: {

&#x20;       'application/pdf': 'raw' as const,

&#x20;       'image/jpeg': 'image' as const,

&#x20;       'image/png': 'image' as const,

&#x20;       'image/webp': 'image' as const,

&#x20;       'application/msword': 'raw' as const,

&#x20;       'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'raw' as const,

&#x20;   } as Record<string, 'image' | 'raw'>,



&#x20;   // Signed URL expiry (seconds)

&#x20;   SIGNED\_URL\_EXPIRY: 3600, // 1 hour



&#x20;   // Image transformations for previews

&#x20;   PREVIEW\_TRANSFORMS: {

&#x20;       thumbnail: { width: 200, height: 200, crop: 'fill', quality: 'auto' },

&#x20;       medium: { width: 600, height: 800, crop: 'limit', quality: 'auto' },

&#x20;       full: { quality: 'auto', fetch\_format: 'auto' },

&#x20;   },

} as const;



/\*\*

&#x20;\* Generate the Cloudinary folder path for a document

&#x20;\* 

&#x20;\* Structure:

&#x20;\*   student-portal/{freelancer\_id}/{student\_id}/{document\_type}/

&#x20;\* 

&#x20;\* Example:

&#x20;\*   student-portal/abc-123/def-456/passport/

&#x20;\*/

export function generateFolderPath(

&#x20;   freelancerId: string,

&#x20;   studentId: string,

&#x20;   docType: string

): string {

&#x20;   return `${CLOUDINARY\_CONFIG.ROOT\_FOLDER}/${freelancerId}/${studentId}/${docType}`;

}



/\*\*

&#x20;\* Generate a unique public\_id for Cloudinary

&#x20;\* 

&#x20;\* Format: student-portal/{freelancer\_id}/{student\_id}/{doc\_type}/{timestamp}\_{sanitized\_name}

&#x20;\* 

&#x20;\* Example: student-portal/abc-123/def-456/passport/1706123456\_rahul\_passport

&#x20;\*/

export function generatePublicId(

&#x20;   freelancerId: string,

&#x20;   studentId: string,

&#x20;   docType: string,

&#x20;   fileName: string

): string {

&#x20;   const timestamp = Date.now();

&#x20;   const nameWithoutExt = fileName.replace(/\\.\[^.]+$/, ''); // Remove extension

&#x20;   const sanitized = nameWithoutExt

&#x20;       .replace(/\[^a-zA-Z0-9\_-]/g, '\_')  // Replace special chars

&#x20;       .replace(/\_+/g, '\_')               // Collapse multiple underscores

&#x20;       .substring(0, 80);                  // Limit length

&#x20;   

&#x20;   return `${CLOUDINARY\_CONFIG.ROOT\_FOLDER}/${freelancerId}/${studentId}/${docType}/${timestamp}\_${sanitized}`;

}



/\*\*

&#x20;\* Determine Cloudinary resource\_type from MIME type

&#x20;\* - Images (jpg, png, webp) → 'image' (enables transformations)

&#x20;\* - Everything else (pdf, doc, docx) → 'raw' (stored as-is)

&#x20;\*/

export function getResourceType(mimeType: string): 'image' | 'raw' {

&#x20;   return CLOUDINARY\_CONFIG.RESOURCE\_TYPE\_MAP\[mimeType] || 'raw';

}

4\. CLOUDINARY SERVICE (Server-Side)

AGENT: This REPLACES the file upload parts of document-service.ts from the main spec.



TypeScript



// src/lib/services/cloudinary-service.ts



import cloudinary from '@/lib/cloudinary/config';

import {

&#x20;   CLOUDINARY\_CONFIG,

&#x20;   generatePublicId,

&#x20;   generateFolderPath,

&#x20;   getResourceType,

} from '@/lib/cloudinary/config';

import { AppError } from './student-service';



export interface CloudinaryUploadResult {

&#x20;   public\_id: string;

&#x20;   secure\_url: string;

&#x20;   resource\_type: string;

&#x20;   format: string;

&#x20;   bytes: number;

&#x20;   width?: number;

&#x20;   height?: number;

&#x20;   pages?: number;       // For PDFs — number of pages

&#x20;   created\_at: string;

&#x20;   original\_filename: string;

&#x20;   folder: string;

&#x20;   asset\_id: string;

&#x20;   version: number;

}



export interface CloudinaryDeleteResult {

&#x20;   result: 'ok' | 'not found';

}



export class CloudinaryService {



&#x20;   /\*\*

&#x20;    \* Upload a file to Cloudinary

&#x20;    \* 

&#x20;    \* @param fileBuffer - The file as a Buffer (from FormData parsing)

&#x20;    \* @param options - Upload options

&#x20;    \* @returns Cloudinary upload result

&#x20;    \*/

&#x20;   static async uploadFile(

&#x20;       fileBuffer: Buffer,

&#x20;       options: {

&#x20;           freelancerId: string;

&#x20;           studentId: string;

&#x20;           docType: string;

&#x20;           fileName: string;

&#x20;           mimeType: string;

&#x20;       }

&#x20;   ): Promise<CloudinaryUploadResult> {

&#x20;       // Validate file size

&#x20;       if (fileBuffer.length > CLOUDINARY\_CONFIG.MAX\_FILE\_SIZE) {

&#x20;           throw new AppError(

&#x20;               'FILE\_TOO\_LARGE',

&#x20;               `File size ${(fileBuffer.length / 1024 / 1024).toFixed(1)}MB exceeds maximum ${CLOUDINARY\_CONFIG.MAX\_FILE\_SIZE / 1024 / 1024}MB`,

&#x20;               400

&#x20;           );

&#x20;       }



&#x20;       // Validate MIME type

&#x20;       if (!CLOUDINARY\_CONFIG.ALLOWED\_MIME\_TYPES.includes(options.mimeType as any)) {

&#x20;           throw new AppError(

&#x20;               'INVALID\_FILE\_TYPE',

&#x20;               `File type "${options.mimeType}" is not allowed. Accepted: PDF, JPG, PNG, WEBP, DOC, DOCX`,

&#x20;               400

&#x20;           );

&#x20;       }



&#x20;       const publicId = generatePublicId(

&#x20;           options.freelancerId,

&#x20;           options.studentId,

&#x20;           options.docType,

&#x20;           options.fileName

&#x20;       );



&#x20;       const resourceType = getResourceType(options.mimeType);

&#x20;       const folder = generateFolderPath(options.freelancerId, options.studentId, options.docType);



&#x20;       try {

&#x20;           // Upload using buffer (convert Buffer to base64 data URI)

&#x20;           const base64 = fileBuffer.toString('base64');

&#x20;           const dataUri = `data:${options.mimeType};base64,${base64}`;



&#x20;           const result = await cloudinary.uploader.upload(dataUri, {

&#x20;               public\_id: publicId,

&#x20;               resource\_type: resourceType,

&#x20;               folder: '', // Already included in public\_id

&#x20;               overwrite: false,

&#x20;               unique\_filename: false, // We handle uniqueness via timestamp in public\_id

&#x20;               

&#x20;               // Access control

&#x20;               type: 'authenticated', // Requires signed URL to access (SECURE)

&#x20;               access\_mode: 'authenticated',

&#x20;               

&#x20;               // Tags for organization

&#x20;               tags: \[

&#x20;                   `freelancer:${options.freelancerId}`,

&#x20;                   `student:${options.studentId}`,

&#x20;                   `type:${options.docType}`,

&#x20;               ],

&#x20;               

&#x20;               // Context (metadata stored in Cloudinary)

&#x20;               context: {

&#x20;                   freelancer\_id: options.freelancerId,

&#x20;                   student\_id: options.studentId,

&#x20;                   doc\_type: options.docType,

&#x20;                   original\_name: options.fileName,

&#x20;                   uploaded\_at: new Date().toISOString(),

&#x20;               },

&#x20;               

&#x20;               // For images: don't apply default transformations

&#x20;               // For PDFs: Cloudinary can generate thumbnails

&#x20;               ...(resourceType === 'image' ? {

&#x20;                   quality: 'auto:good',

&#x20;                   fetch\_format: 'auto',

&#x20;               } : {}),

&#x20;           });



&#x20;           return {

&#x20;               public\_id: result.public\_id,

&#x20;               secure\_url: result.secure\_url,

&#x20;               resource\_type: result.resource\_type,

&#x20;               format: result.format,

&#x20;               bytes: result.bytes,

&#x20;               width: result.width,

&#x20;               height: result.height,

&#x20;               pages: result.pages,

&#x20;               created\_at: result.created\_at,

&#x20;               original\_filename: result.original\_filename,

&#x20;               folder: result.folder || folder,

&#x20;               asset\_id: result.asset\_id,

&#x20;               version: result.version,

&#x20;           };

&#x20;       } catch (error: any) {

&#x20;           console.error('Cloudinary upload error:', error);

&#x20;           

&#x20;           if (error.http\_code === 400) {

&#x20;               throw new AppError('UPLOAD\_ERROR', `Upload rejected: ${error.message}`, 400);

&#x20;           }

&#x20;           

&#x20;           throw new AppError(

&#x20;               'UPLOAD\_ERROR',

&#x20;               `Failed to upload file: ${error.message || 'Unknown error'}`,

&#x20;               500

&#x20;           );

&#x20;       }

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Generate a signed/secure URL for downloading a document

&#x20;    \* Only works for 'authenticated' type uploads

&#x20;    \*/

&#x20;   static generateSecureUrl(

&#x20;       publicId: string,

&#x20;       resourceType: 'image' | 'raw' = 'raw',

&#x20;       options?: {

&#x20;           expiresInSeconds?: number;

&#x20;           asAttachment?: boolean;  // Force download instead of inline display

&#x20;           transformations?: Record<string, any>;

&#x20;       }

&#x20;   ): string {

&#x20;       const expiry = options?.expiresInSeconds || CLOUDINARY\_CONFIG.SIGNED\_URL\_EXPIRY;

&#x20;       const expiresAt = Math.floor(Date.now() / 1000) + expiry;



&#x20;       const urlOptions: Record<string, any> = {

&#x20;           type: 'authenticated',

&#x20;           resource\_type: resourceType,

&#x20;           sign\_url: true,

&#x20;           secure: true,

&#x20;           expires\_at: expiresAt,

&#x20;       };



&#x20;       // Force download

&#x20;       if (options?.asAttachment) {

&#x20;           urlOptions.flags = 'attachment';

&#x20;       }



&#x20;       // Apply transformations (only for images)

&#x20;       if (options?.transformations \&\& resourceType === 'image') {

&#x20;           urlOptions.transformation = \[options.transformations];

&#x20;       }



&#x20;       return cloudinary.url(publicId, urlOptions);

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Generate a thumbnail URL for preview

&#x20;    \* Works for images directly. For PDFs, generates from first page.

&#x20;    \*/

&#x20;   static generateThumbnailUrl(

&#x20;       publicId: string,

&#x20;       resourceType: 'image' | 'raw' = 'image',

&#x20;       size: 'thumbnail' | 'medium' | 'full' = 'thumbnail'

&#x20;   ): string | null {

&#x20;       // Can only generate thumbnails for images

&#x20;       if (resourceType !== 'image') {

&#x20;           // For PDFs, Cloudinary can generate a preview of page 1

&#x20;           // by treating it as an image with page flag

&#x20;           // But this only works with certain Cloudinary plans

&#x20;           return null;

&#x20;       }



&#x20;       const transforms = CLOUDINARY\_CONFIG.PREVIEW\_TRANSFORMS\[size];



&#x20;       return cloudinary.url(publicId, {

&#x20;           type: 'authenticated',

&#x20;           resource\_type: 'image',

&#x20;           sign\_url: true,

&#x20;           secure: true,

&#x20;           expires\_at: Math.floor(Date.now() / 1000) + 3600,

&#x20;           transformation: \[transforms],

&#x20;       });

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Replace/update an existing file (keeps same public\_id, creates new version)

&#x20;    \*/

&#x20;   static async replaceFile(

&#x20;       existingPublicId: string,

&#x20;       newFileBuffer: Buffer,

&#x20;       mimeType: string

&#x20;   ): Promise<CloudinaryUploadResult> {

&#x20;       const resourceType = getResourceType(mimeType);



&#x20;       try {

&#x20;           const base64 = newFileBuffer.toString('base64');

&#x20;           const dataUri = `data:${mimeType};base64,${base64}`;



&#x20;           const result = await cloudinary.uploader.upload(dataUri, {

&#x20;               public\_id: existingPublicId,

&#x20;               resource\_type: resourceType,

&#x20;               overwrite: true,           // Replace existing

&#x20;               invalidate: true,          // Invalidate CDN cache

&#x20;               type: 'authenticated',

&#x20;           });



&#x20;           return {

&#x20;               public\_id: result.public\_id,

&#x20;               secure\_url: result.secure\_url,

&#x20;               resource\_type: result.resource\_type,

&#x20;               format: result.format,

&#x20;               bytes: result.bytes,

&#x20;               width: result.width,

&#x20;               height: result.height,

&#x20;               pages: result.pages,

&#x20;               created\_at: result.created\_at,

&#x20;               original\_filename: result.original\_filename,

&#x20;               folder: result.folder,

&#x20;               asset\_id: result.asset\_id,

&#x20;               version: result.version,

&#x20;           };

&#x20;       } catch (error: any) {

&#x20;           throw new AppError(

&#x20;               'UPLOAD\_ERROR',

&#x20;               `Failed to replace file: ${error.message || 'Unknown error'}`,

&#x20;               500

&#x20;           );

&#x20;       }

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Delete a file from Cloudinary

&#x20;    \*/

&#x20;   static async deleteFile(

&#x20;       publicId: string,

&#x20;       resourceType: 'image' | 'raw' = 'raw'

&#x20;   ): Promise<CloudinaryDeleteResult> {

&#x20;       try {

&#x20;           const result = await cloudinary.uploader.destroy(publicId, {

&#x20;               resource\_type: resourceType,

&#x20;               type: 'authenticated',

&#x20;               invalidate: true,  // Clear from CDN cache

&#x20;           });



&#x20;           return { result: result.result };

&#x20;       } catch (error: any) {

&#x20;           console.error('Cloudinary delete error:', error);

&#x20;           throw new AppError(

&#x20;               'DELETE\_ERROR',

&#x20;               `Failed to delete file: ${error.message || 'Unknown error'}`,

&#x20;               500

&#x20;           );

&#x20;       }

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Delete ALL files for a student (when student is permanently deleted)

&#x20;    \* Uses Cloudinary's bulk delete by prefix

&#x20;    \*/

&#x20;   static async deleteStudentFolder(

&#x20;       freelancerId: string,

&#x20;       studentId: string

&#x20;   ): Promise<void> {

&#x20;       const folderPath = `${CLOUDINARY\_CONFIG.ROOT\_FOLDER}/${freelancerId}/${studentId}`;



&#x20;       try {

&#x20;           // Delete all resources in the folder

&#x20;           await cloudinary.api.delete\_resources\_by\_prefix(folderPath, {

&#x20;               resource\_type: 'image',

&#x20;               type: 'authenticated',

&#x20;           });

&#x20;           await cloudinary.api.delete\_resources\_by\_prefix(folderPath, {

&#x20;               resource\_type: 'raw',

&#x20;               type: 'authenticated',

&#x20;           });



&#x20;           // Delete the empty folder

&#x20;           await cloudinary.api.delete\_folder(folderPath).catch(() => {

&#x20;               // Folder might not exist or be non-empty, ignore

&#x20;           });

&#x20;       } catch (error: any) {

&#x20;           console.error('Cloudinary folder delete error:', error);

&#x20;           // Don't throw — this is cleanup, shouldn't block the main operation

&#x20;       }

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Get details about a file stored in Cloudinary

&#x20;    \*/

&#x20;   static async getFileDetails(

&#x20;       publicId: string,

&#x20;       resourceType: 'image' | 'raw' = 'raw'

&#x20;   ): Promise<Record<string, any> | null> {

&#x20;       try {

&#x20;           const result = await cloudinary.api.resource(publicId, {

&#x20;               resource\_type: resourceType,

&#x20;               type: 'authenticated',

&#x20;           });

&#x20;           return result;

&#x20;       } catch (error: any) {

&#x20;           if (error.http\_code === 404) return null;

&#x20;           throw new AppError('STORAGE\_ERROR', `Failed to get file details: ${error.message}`, 500);

&#x20;       }

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Generate a signed upload signature for DIRECT client-side uploads

&#x20;    \* (Alternative to server-side upload — faster for large files)

&#x20;    \* 

&#x20;    \* The client uploads directly to Cloudinary, skipping your server.

&#x20;    \* Your server only generates the signature.

&#x20;    \*/

&#x20;   static generateUploadSignature(params: {

&#x20;       freelancerId: string;

&#x20;       studentId: string;

&#x20;       docType: string;

&#x20;       fileName: string;

&#x20;   }): {

&#x20;       signature: string;

&#x20;       timestamp: number;

&#x20;       cloudName: string;

&#x20;       apiKey: string;

&#x20;       publicId: string;

&#x20;       folder: string;

&#x20;       uploadPreset?: string;

&#x20;   } {

&#x20;       const timestamp = Math.floor(Date.now() / 1000);

&#x20;       const publicId = generatePublicId(

&#x20;           params.freelancerId,

&#x20;           params.studentId,

&#x20;           params.docType,

&#x20;           params.fileName

&#x20;       );



&#x20;       // Parameters that will be signed

&#x20;       const paramsToSign = {

&#x20;           timestamp,

&#x20;           public\_id: publicId,

&#x20;           type: 'authenticated',

&#x20;           tags: `freelancer:${params.freelancerId},student:${params.studentId},type:${params.docType}`,

&#x20;           context: `freelancer\_id=${params.freelancerId}|student\_id=${params.studentId}|doc\_type=${params.docType}`,

&#x20;       };



&#x20;       const signature = cloudinary.utils.api\_sign\_request(

&#x20;           paramsToSign,

&#x20;           process.env.CLOUDINARY\_API\_SECRET!

&#x20;       );



&#x20;       return {

&#x20;           signature,

&#x20;           timestamp,

&#x20;           cloudName: process.env.CLOUDINARY\_CLOUD\_NAME!,

&#x20;           apiKey: process.env.CLOUDINARY\_API\_KEY!,

&#x20;           publicId,

&#x20;           folder: generateFolderPath(params.freelancerId, params.studentId, params.docType),

&#x20;       };

&#x20;   }

}

5\. UPDATED DOCUMENT SERVICE

AGENT: This REPLACES src/lib/services/document-service.ts from the main spec.



TypeScript



// src/lib/services/document-service.ts

// UPDATED: Uses Cloudinary instead of Supabase Storage



import { createClient } from '@/lib/supabase/server';

import { CloudinaryService } from './cloudinary-service';

import { getResourceType } from '@/lib/cloudinary/config';

import type { StudentDocument } from '@/types/database';

import { AppError } from './student-service';



export class DocumentService {



&#x20;   /\*\*

&#x20;    \* Upload document: file → Cloudinary, metadata → Supabase DB

&#x20;    \* 

&#x20;    \* Flow:

&#x20;    \* 1. Validate file (size, type)

&#x20;    \* 2. Verify student belongs to freelancer

&#x20;    \* 3. Upload file to Cloudinary

&#x20;    \* 4. Save metadata record in Supabase (with Cloudinary public\_id + URL)

&#x20;    \* 5. Handle versioning if same doc type exists

&#x20;    \* 6. Log activity

&#x20;    \*/

&#x20;   static async uploadDocument(

&#x20;       studentId: string,

&#x20;       freelancerId: string,

&#x20;       file: {

&#x20;           buffer: Buffer;

&#x20;           name: string;

&#x20;           size: number;

&#x20;           type: string; // MIME type

&#x20;       },

&#x20;       metadata: {

&#x20;           type: string;          // document\_type enum

&#x20;           custom\_label?: string | null;

&#x20;           description?: string | null;

&#x20;           issued\_date?: string | null;

&#x20;           expires\_at?: string | null;

&#x20;       }

&#x20;   ): Promise<StudentDocument> {

&#x20;       const supabase = await createClient();



&#x20;       // 1. Verify student belongs to freelancer

&#x20;       const { data: student } = await supabase

&#x20;           .from('students')

&#x20;           .select('id, first\_name, last\_name')

&#x20;           .eq('id', studentId)

&#x20;           .eq('freelancer\_id', freelancerId)

&#x20;           .is('deleted\_at', null)

&#x20;           .single();



&#x20;       if (!student) {

&#x20;           throw new AppError('NOT\_FOUND', 'Student not found or access denied', 404);

&#x20;       }



&#x20;       // 2. Upload file to Cloudinary

&#x20;       const cloudinaryResult = await CloudinaryService.uploadFile(file.buffer, {

&#x20;           freelancerId,

&#x20;           studentId,

&#x20;           docType: metadata.type,

&#x20;           fileName: file.name,

&#x20;           mimeType: file.type,

&#x20;       });



&#x20;       // 3. Handle versioning: if same type exists, mark old as not latest

&#x20;       const { data: existingDoc } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .select('id, version, cloudinary\_public\_id, cloudinary\_resource\_type')

&#x20;           .eq('student\_id', studentId)

&#x20;           .eq('type', metadata.type)

&#x20;           .eq('is\_latest', true)

&#x20;           .is('deleted\_at', null)

&#x20;           .maybeSingle();



&#x20;       if (existingDoc) {

&#x20;           await supabase

&#x20;               .from('student\_documents')

&#x20;               .update({ is\_latest: false })

&#x20;               .eq('id', existingDoc.id);

&#x20;       }



&#x20;       // 4. Save record in Supabase database

&#x20;       const { data: doc, error } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .insert({

&#x20;               student\_id: studentId,

&#x20;               uploaded\_by: freelancerId,

&#x20;               type: metadata.type,

&#x20;               custom\_label: metadata.custom\_label,

&#x20;               description: metadata.description,

&#x20;               file\_name: file.name,

&#x20;               file\_size: cloudinaryResult.bytes,

&#x20;               mime\_type: file.type,



&#x20;               // ── Cloudinary-specific fields ──

&#x20;               file\_path: cloudinaryResult.secure\_url,     // Full Cloudinary URL

&#x20;               cloudinary\_public\_id: cloudinaryResult.public\_id,

&#x20;               cloudinary\_resource\_type: cloudinaryResult.resource\_type,

&#x20;               cloudinary\_format: cloudinaryResult.format,

&#x20;               cloudinary\_version: cloudinaryResult.version,

&#x20;               cloudinary\_asset\_id: cloudinaryResult.asset\_id,



&#x20;               // ── Metadata ──

&#x20;               issued\_date: metadata.issued\_date,

&#x20;               expires\_at: metadata.expires\_at,

&#x20;               status: 'uploaded',

&#x20;               version: existingDoc ? existingDoc.version + 1 : 1,

&#x20;               is\_latest: true,

&#x20;               previous\_version\_id: existingDoc?.id || null,

&#x20;           })

&#x20;           .select()

&#x20;           .single();



&#x20;       if (error || !doc) {

&#x20;           // If DB insert fails, clean up the Cloudinary upload

&#x20;           await CloudinaryService.deleteFile(

&#x20;               cloudinaryResult.public\_id,

&#x20;               cloudinaryResult.resource\_type as 'image' | 'raw'

&#x20;           ).catch(console.error);



&#x20;           throw new AppError('DB\_ERROR', `Failed to save document record: ${error?.message}`, 500);

&#x20;       }



&#x20;       // 5. Log activity

&#x20;       await supabase.from('activity\_log').insert({

&#x20;           actor\_id: freelancerId,

&#x20;           action: 'document.uploaded',

&#x20;           entity\_type: 'document',

&#x20;           entity\_id: doc.id,

&#x20;           title: 'Document Uploaded',

&#x20;           description: `Uploaded ${metadata.type}: ${file.name} for ${student.first\_name} ${student.last\_name}`,

&#x20;           related\_entities: { student\_id: studentId },

&#x20;       });



&#x20;       return doc;

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Get a secure download URL for a document

&#x20;    \* Generates a time-limited signed Cloudinary URL

&#x20;    \*/

&#x20;   static async getDownloadUrl(

&#x20;       documentId: string,

&#x20;       options?: { asAttachment?: boolean }

&#x20;   ): Promise<{ url: string; fileName: string; mimeType: string }> {

&#x20;       const supabase = await createClient();



&#x20;       const { data: doc } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .select('cloudinary\_public\_id, cloudinary\_resource\_type, file\_name, mime\_type')

&#x20;           .eq('id', documentId)

&#x20;           .is('deleted\_at', null)

&#x20;           .single();



&#x20;       if (!doc || !doc.cloudinary\_public\_id) {

&#x20;           throw new AppError('NOT\_FOUND', 'Document not found', 404);

&#x20;       }



&#x20;       const url = CloudinaryService.generateSecureUrl(

&#x20;           doc.cloudinary\_public\_id,

&#x20;           doc.cloudinary\_resource\_type as 'image' | 'raw',

&#x20;           {

&#x20;               expiresInSeconds: 3600,

&#x20;               asAttachment: options?.asAttachment ?? true,

&#x20;           }

&#x20;       );



&#x20;       return {

&#x20;           url,

&#x20;           fileName: doc.file\_name,

&#x20;           mimeType: doc.mime\_type,

&#x20;       };

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Get a preview/thumbnail URL (for images only)

&#x20;    \*/

&#x20;   static async getPreviewUrl(

&#x20;       documentId: string,

&#x20;       size: 'thumbnail' | 'medium' | 'full' = 'medium'

&#x20;   ): Promise<string | null> {

&#x20;       const supabase = await createClient();



&#x20;       const { data: doc } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .select('cloudinary\_public\_id, cloudinary\_resource\_type, mime\_type')

&#x20;           .eq('id', documentId)

&#x20;           .is('deleted\_at', null)

&#x20;           .single();



&#x20;       if (!doc || !doc.cloudinary\_public\_id) return null;



&#x20;       // Only images get preview thumbnails

&#x20;       if (doc.cloudinary\_resource\_type !== 'image') return null;



&#x20;       return CloudinaryService.generateThumbnailUrl(

&#x20;           doc.cloudinary\_public\_id,

&#x20;           'image',

&#x20;           size

&#x20;       );

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Replace a document file (re-upload with same DB record, new Cloudinary version)

&#x20;    \*/

&#x20;   static async replaceDocumentFile(

&#x20;       documentId: string,

&#x20;       freelancerId: string,

&#x20;       newFile: {

&#x20;           buffer: Buffer;

&#x20;           name: string;

&#x20;           size: number;

&#x20;           type: string;

&#x20;       }

&#x20;   ): Promise<StudentDocument> {

&#x20;       const supabase = await createClient();



&#x20;       // Get existing document

&#x20;       const { data: existingDoc } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .select('\*, students!inner(freelancer\_id)')

&#x20;           .eq('id', documentId)

&#x20;           .is('deleted\_at', null)

&#x20;           .single();



&#x20;       if (!existingDoc) {

&#x20;           throw new AppError('NOT\_FOUND', 'Document not found', 404);

&#x20;       }



&#x20;       // Verify ownership through student's freelancer\_id

&#x20;       if ((existingDoc as any).students?.freelancer\_id !== freelancerId) {

&#x20;           throw new AppError('FORBIDDEN', 'You do not have permission to modify this document', 403);

&#x20;       }



&#x20;       // Replace file in Cloudinary

&#x20;       const cloudinaryResult = await CloudinaryService.replaceFile(

&#x20;           existingDoc.cloudinary\_public\_id,

&#x20;           newFile.buffer,

&#x20;           newFile.type

&#x20;       );



&#x20;       // Update DB record

&#x20;       const { data: updatedDoc, error } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .update({

&#x20;               file\_name: newFile.name,

&#x20;               file\_size: cloudinaryResult.bytes,

&#x20;               mime\_type: newFile.type,

&#x20;               file\_path: cloudinaryResult.secure\_url,

&#x20;               cloudinary\_version: cloudinaryResult.version,

&#x20;               cloudinary\_format: cloudinaryResult.format,

&#x20;               status: 'uploaded', // Reset to uploaded (needs re-verification)

&#x20;               verified\_by: null,

&#x20;               verified\_at: null,

&#x20;               rejection\_reason: null,

&#x20;               version: existingDoc.version + 1,

&#x20;           })

&#x20;           .eq('id', documentId)

&#x20;           .select()

&#x20;           .single();



&#x20;       if (error || !updatedDoc) {

&#x20;           throw new AppError('DB\_ERROR', `Failed to update document record: ${error?.message}`, 500);

&#x20;       }



&#x20;       // Log activity

&#x20;       await supabase.from('activity\_log').insert({

&#x20;           actor\_id: freelancerId,

&#x20;           action: 'document.replaced',

&#x20;           entity\_type: 'document',

&#x20;           entity\_id: documentId,

&#x20;           title: 'Document Replaced',

&#x20;           description: `Replaced file for ${existingDoc.type}: ${newFile.name}`,

&#x20;           related\_entities: { student\_id: existingDoc.student\_id },

&#x20;       });



&#x20;       return updatedDoc;

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Delete a document (Cloudinary file + DB record)

&#x20;    \*/

&#x20;   static async deleteDocument(

&#x20;       documentId: string,

&#x20;       freelancerId: string

&#x20;   ): Promise<void> {

&#x20;       const supabase = await createClient();



&#x20;       // Get document details

&#x20;       const { data: doc } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .select('id, cloudinary\_public\_id, cloudinary\_resource\_type, student\_id, type, uploaded\_by')

&#x20;           .eq('id', documentId)

&#x20;           .is('deleted\_at', null)

&#x20;           .single();



&#x20;       if (!doc) {

&#x20;           throw new AppError('NOT\_FOUND', 'Document not found', 404);

&#x20;       }



&#x20;       // Check if document is linked to any application

&#x20;       const { count: linkCount } = await supabase

&#x20;           .from('application\_documents')

&#x20;           .select('\*', { count: 'exact', head: true })

&#x20;           .eq('document\_id', documentId);



&#x20;       if (linkCount \&\& linkCount > 0) {

&#x20;           throw new AppError(

&#x20;               'CONFLICT',

&#x20;               `Cannot delete document — it is linked to ${linkCount} application(s). Unlink it first.`,

&#x20;               409

&#x20;           );

&#x20;       }



&#x20;       // Delete from Cloudinary

&#x20;       if (doc.cloudinary\_public\_id) {

&#x20;           await CloudinaryService.deleteFile(

&#x20;               doc.cloudinary\_public\_id,

&#x20;               (doc.cloudinary\_resource\_type as 'image' | 'raw') || 'raw'

&#x20;           ).catch((err) => {

&#x20;               console.error('Failed to delete from Cloudinary (continuing with DB delete):', err);

&#x20;               // Don't throw — still soft-delete the DB record even if Cloudinary fails

&#x20;           });

&#x20;       }



&#x20;       // Soft delete in DB

&#x20;       const { error } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .update({ deleted\_at: new Date().toISOString() })

&#x20;           .eq('id', documentId);



&#x20;       if (error) {

&#x20;           throw new AppError('DB\_ERROR', `Failed to delete document: ${error.message}`, 500);

&#x20;       }



&#x20;       // Log activity

&#x20;       await supabase.from('activity\_log').insert({

&#x20;           actor\_id: freelancerId,

&#x20;           action: 'document.deleted',

&#x20;           entity\_type: 'document',

&#x20;           entity\_id: documentId,

&#x20;           title: 'Document Deleted',

&#x20;           description: `Deleted ${doc.type} document`,

&#x20;           related\_entities: { student\_id: doc.student\_id },

&#x20;       });

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Get all documents for a student (metadata from DB)

&#x20;    \*/

&#x20;   static async getStudentDocuments(studentId: string): Promise<StudentDocument\[]> {

&#x20;       const supabase = await createClient();



&#x20;       const { data, error } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .select('\*')

&#x20;           .eq('student\_id', studentId)

&#x20;           .eq('is\_latest', true)

&#x20;           .is('deleted\_at', null)

&#x20;           .order('created\_at', { ascending: false });



&#x20;       if (error) throw new AppError('DB\_ERROR', error.message, 500);

&#x20;       return data || \[];

&#x20;   }



&#x20;   /\*\*

&#x20;    \* Get documents with their signed download URLs

&#x20;    \* Use this when you need to display documents with download links

&#x20;    \*/

&#x20;   static async getStudentDocumentsWithUrls(studentId: string): Promise<(StudentDocument \& {

&#x20;       download\_url: string | null;

&#x20;       preview\_url: string | null;

&#x20;   })\[]> {

&#x20;       const docs = await this.getStudentDocuments(studentId);



&#x20;       return docs.map(doc => ({

&#x20;           ...doc,

&#x20;           download\_url: doc.cloudinary\_public\_id

&#x20;               ? CloudinaryService.generateSecureUrl(

&#x20;                   doc.cloudinary\_public\_id,

&#x20;                   (doc.cloudinary\_resource\_type as 'image' | 'raw') || 'raw',

&#x20;                   { expiresInSeconds: 3600, asAttachment: true }

&#x20;               )

&#x20;               : null,

&#x20;           preview\_url: doc.cloudinary\_resource\_type === 'image' \&\& doc.cloudinary\_public\_id

&#x20;               ? CloudinaryService.generateThumbnailUrl(doc.cloudinary\_public\_id, 'image', 'medium')

&#x20;               : null,

&#x20;       }));

&#x20;   }

}

6\. DATABASE SCHEMA CHANGES

AGENT: Run this SQL to add Cloudinary-specific columns to the student\_documents table.



SQL



\-- ================================================================

\-- ADD CLOUDINARY COLUMNS TO student\_documents

\-- Run this AFTER the main schema from the original spec

\-- ================================================================



ALTER TABLE student\_documents 

&#x20;   ADD COLUMN IF NOT EXISTS cloudinary\_public\_id    TEXT,

&#x20;   ADD COLUMN IF NOT EXISTS cloudinary\_resource\_type TEXT DEFAULT 'raw',

&#x20;   ADD COLUMN IF NOT EXISTS cloudinary\_format       TEXT,

&#x20;   ADD COLUMN IF NOT EXISTS cloudinary\_version      INTEGER,

&#x20;   ADD COLUMN IF NOT EXISTS cloudinary\_asset\_id     TEXT;



\-- Index for looking up by cloudinary public\_id

CREATE INDEX IF NOT EXISTS idx\_docs\_cloudinary\_id 

&#x20;   ON student\_documents(cloudinary\_public\_id) 

&#x20;   WHERE cloudinary\_public\_id IS NOT NULL AND deleted\_at IS NULL;



\-- NOTE: The file\_path column now stores the Cloudinary secure\_url

\-- The file\_hash column can store the Cloudinary asset\_id for dedup



\-- ================================================================

\-- REMOVE Supabase Storage policies (we don't need them anymore)

\-- ================================================================

\-- If you already created Supabase Storage policies from the main spec,

\-- you can drop them. Documents no longer go to Supabase Storage.



\-- DROP POLICY IF EXISTS "storage\_upload" ON storage.objects;

\-- DROP POLICY IF EXISTS "storage\_read" ON storage.objects;

\-- DROP POLICY IF EXISTS "storage\_update" ON storage.objects;

\-- DROP POLICY IF EXISTS "storage\_delete" ON storage.objects;



\-- You do NOT need to create the "student-documents" bucket in Supabase.

\-- All files go to Cloudinary now.

7\. UPDATED API ROUTES FOR DOCUMENTS

TypeScript



// src/app/api/v1/students/\[id]/documents/route.ts

// UPDATED: Server-side upload to Cloudinary



import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { DocumentService } from '@/lib/services/document-service';

import { documentUploadSchema, ALLOWED\_MIME\_TYPES, MAX\_FILE\_SIZE } from '@/lib/validations/document';

import { AppError } from '@/lib/services/student-service';



/\*\*

&#x20;\* POST /api/v1/students/:id/documents

&#x20;\* Upload a document for a student

&#x20;\* 

&#x20;\* Content-Type: multipart/form-data

&#x20;\* Body:

&#x20;\*   - file: File (the actual document file)

&#x20;\*   - type: string (document\_type enum)

&#x20;\*   - custom\_label: string (optional, required if type = 'other')

&#x20;\*   - description: string (optional)

&#x20;\*   - issued\_date: string (optional)

&#x20;\*   - expires\_at: string (optional)

&#x20;\*/

export async function POST(

&#x20;   request: NextRequest,

&#x20;   { params }: { params: { id: string } }

) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();



&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }



&#x20;       // Parse multipart form data

&#x20;       const formData = await request.formData();

&#x20;       const file = formData.get('file') as File | null;

&#x20;       const type = formData.get('type') as string;

&#x20;       const customLabel = formData.get('custom\_label') as string | null;

&#x20;       const description = formData.get('description') as string | null;

&#x20;       const issuedDate = formData.get('issued\_date') as string | null;

&#x20;       const expiresAt = formData.get('expires\_at') as string | null;



&#x20;       // Validate file exists

&#x20;       if (!file) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'VALIDATION\_ERROR', message: 'No file provided' } },

&#x20;               { status: 400 }

&#x20;           );

&#x20;       }



&#x20;       // Validate file size

&#x20;       if (file.size > MAX\_FILE\_SIZE) {

&#x20;           return NextResponse.json(

&#x20;               {

&#x20;                   success: false,

&#x20;                   error: {

&#x20;                       code: 'FILE\_TOO\_LARGE',

&#x20;                       message: `File size ${(file.size / 1024 / 1024).toFixed(1)}MB exceeds the ${MAX\_FILE\_SIZE / 1024 / 1024}MB limit`,

&#x20;                   },

&#x20;               },

&#x20;               { status: 400 }

&#x20;           );

&#x20;       }



&#x20;       // Validate MIME type

&#x20;       if (!ALLOWED\_MIME\_TYPES.includes(file.type as any)) {

&#x20;           return NextResponse.json(

&#x20;               {

&#x20;                   success: false,

&#x20;                   error: {

&#x20;                       code: 'INVALID\_FILE\_TYPE',

&#x20;                       message: `File type "${file.type}" is not allowed. Accepted: PDF, JPG, PNG, WEBP, DOC, DOCX`,

&#x20;                   },

&#x20;               },

&#x20;               { status: 400 }

&#x20;           );

&#x20;       }



&#x20;       // Validate metadata

&#x20;       const metadataParsed = documentUploadSchema.safeParse({

&#x20;           type,

&#x20;           custom\_label: customLabel,

&#x20;           description,

&#x20;           issued\_date: issuedDate,

&#x20;           expires\_at: expiresAt,

&#x20;       });



&#x20;       if (!metadataParsed.success) {

&#x20;           return NextResponse.json(

&#x20;               {

&#x20;                   success: false,

&#x20;                   error: {

&#x20;                       code: 'VALIDATION\_ERROR',

&#x20;                       message: 'Validation failed',

&#x20;                       details: metadataParsed.error.errors.map(e => ({

&#x20;                           field: e.path.join('.'),

&#x20;                           message: e.message,

&#x20;                       })),

&#x20;                   },

&#x20;               },

&#x20;               { status: 400 }

&#x20;           );

&#x20;       }



&#x20;       // Convert File to Buffer for server-side upload

&#x20;       const arrayBuffer = await file.arrayBuffer();

&#x20;       const buffer = Buffer.from(arrayBuffer);



&#x20;       // Upload via DocumentService (handles Cloudinary + DB)

&#x20;       const document = await DocumentService.uploadDocument(

&#x20;           params.id,      // studentId

&#x20;           user.id,         // freelancerId

&#x20;           {

&#x20;               buffer,

&#x20;               name: file.name,

&#x20;               size: file.size,

&#x20;               type: file.type,

&#x20;           },

&#x20;           metadataParsed.data

&#x20;       );



&#x20;       return NextResponse.json({ success: true, data: document }, { status: 201 });



&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message, details: error.details } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       console.error('POST /api/v1/students/\[id]/documents error:', error);

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}



/\*\*

&#x20;\* GET /api/v1/students/:id/documents

&#x20;\* Get all documents for a student (with signed URLs)

&#x20;\*/

export async function GET(

&#x20;   request: NextRequest,

&#x20;   { params }: { params: { id: string } }

) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();



&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }



&#x20;       const withUrls = request.nextUrl.searchParams.get('with\_urls') === 'true';



&#x20;       let documents;

&#x20;       if (withUrls) {

&#x20;           documents = await DocumentService.getStudentDocumentsWithUrls(params.id);

&#x20;       } else {

&#x20;           documents = await DocumentService.getStudentDocuments(params.id);

&#x20;       }



&#x20;       return NextResponse.json({ success: true, data: documents });



&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}

TypeScript



// src/app/api/v1/documents/\[id]/route.ts



import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { DocumentService } from '@/lib/services/document-service';

import { MAX\_FILE\_SIZE, ALLOWED\_MIME\_TYPES } from '@/lib/validations/document';

import { AppError } from '@/lib/services/student-service';



/\*\*

&#x20;\* GET /api/v1/documents/:id

&#x20;\* Get document details

&#x20;\*/

export async function GET(

&#x20;   request: NextRequest,

&#x20;   { params }: { params: { id: string } }

) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }



&#x20;       const { data: doc, error } = await supabase

&#x20;           .from('student\_documents')

&#x20;           .select('\*')

&#x20;           .eq('id', params.id)

&#x20;           .is('deleted\_at', null)

&#x20;           .single();



&#x20;       if (error || !doc) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'NOT\_FOUND', message: 'Document not found' } },

&#x20;               { status: 404 }

&#x20;           );

&#x20;       }



&#x20;       return NextResponse.json({ success: true, data: doc });

&#x20;   } catch (error) {

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}



/\*\*

&#x20;\* PATCH /api/v1/documents/:id

&#x20;\* Replace document file (re-upload)

&#x20;\* 

&#x20;\* Content-Type: multipart/form-data

&#x20;\* Body:

&#x20;\*   - file: File (new file to replace existing)

&#x20;\*/

export async function PATCH(

&#x20;   request: NextRequest,

&#x20;   { params }: { params: { id: string } }

) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }



&#x20;       const formData = await request.formData();

&#x20;       const file = formData.get('file') as File | null;



&#x20;       if (!file) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'VALIDATION\_ERROR', message: 'No file provided' } },

&#x20;               { status: 400 }

&#x20;           );

&#x20;       }



&#x20;       if (file.size > MAX\_FILE\_SIZE) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'FILE\_TOO\_LARGE', message: 'File exceeds 10MB limit' } },

&#x20;               { status: 400 }

&#x20;           );

&#x20;       }



&#x20;       if (!ALLOWED\_MIME\_TYPES.includes(file.type as any)) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'INVALID\_FILE\_TYPE', message: `"${file.type}" not allowed` } },

&#x20;               { status: 400 }

&#x20;           );

&#x20;       }



&#x20;       const arrayBuffer = await file.arrayBuffer();

&#x20;       const buffer = Buffer.from(arrayBuffer);



&#x20;       const updatedDoc = await DocumentService.replaceDocumentFile(

&#x20;           params.id,

&#x20;           user.id,

&#x20;           { buffer, name: file.name, size: file.size, type: file.type }

&#x20;       );



&#x20;       return NextResponse.json({ success: true, data: updatedDoc });

&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}



/\*\*

&#x20;\* DELETE /api/v1/documents/:id

&#x20;\* Soft delete document (removes from Cloudinary + marks deleted in DB)

&#x20;\*/

export async function DELETE(

&#x20;   request: NextRequest,

&#x20;   { params }: { params: { id: string } }

) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }



&#x20;       await DocumentService.deleteDocument(params.id, user.id);



&#x20;       return NextResponse.json({ success: true, data: { deleted: true } });

&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}

TypeScript



// src/app/api/v1/documents/\[id]/download/route.ts



import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { DocumentService } from '@/lib/services/document-service';

import { AppError } from '@/lib/services/student-service';



/\*\*

&#x20;\* GET /api/v1/documents/:id/download

&#x20;\* Returns a signed URL for downloading the document from Cloudinary

&#x20;\*/

export async function GET(

&#x20;   request: NextRequest,

&#x20;   { params }: { params: { id: string } }

) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }



&#x20;       const inline = request.nextUrl.searchParams.get('inline') === 'true';



&#x20;       const result = await DocumentService.getDownloadUrl(params.id, {

&#x20;           asAttachment: !inline, // true = force download, false = display in browser

&#x20;       });



&#x20;       return NextResponse.json({

&#x20;           success: true,

&#x20;           data: {

&#x20;               download\_url: result.url,

&#x20;               file\_name: result.fileName,

&#x20;               mime\_type: result.mimeType,

&#x20;               expires\_in: 3600, // seconds

&#x20;           },

&#x20;       });

&#x20;   } catch (error) {

&#x20;       if (error instanceof AppError) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: error.code, message: error.message } },

&#x20;               { status: error.statusCode }

&#x20;           );

&#x20;       }

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}

TypeScript



// src/app/api/v1/documents/upload-signature/route.ts

// For DIRECT client-side uploads (optional — use if server upload is too slow)



import { NextRequest, NextResponse } from 'next/server';

import { createClient } from '@/lib/supabase/server';

import { CloudinaryService } from '@/lib/services/cloudinary-service';



/\*\*

&#x20;\* POST /api/v1/documents/upload-signature

&#x20;\* Generate a signed upload token for direct client → Cloudinary upload

&#x20;\* 

&#x20;\* Use this when you want the client to upload directly to Cloudinary

&#x20;\* without the file passing through your server (faster for large files).

&#x20;\* 

&#x20;\* Flow:

&#x20;\* 1. Client requests signature from this endpoint

&#x20;\* 2. This endpoint returns signature + params

&#x20;\* 3. Client uploads directly to Cloudinary using the signature

&#x20;\* 4. Client sends Cloudinary response to /api/v1/students/:id/documents to save DB record

&#x20;\*/

export async function POST(request: NextRequest) {

&#x20;   try {

&#x20;       const supabase = await createClient();

&#x20;       const { data: { user } } = await supabase.auth.getUser();

&#x20;       if (!user) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'UNAUTHORIZED', message: 'Not authenticated' } },

&#x20;               { status: 401 }

&#x20;           );

&#x20;       }



&#x20;       const body = await request.json();

&#x20;       const { student\_id, doc\_type, file\_name } = body;



&#x20;       if (!student\_id || !doc\_type || !file\_name) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'VALIDATION\_ERROR', message: 'student\_id, doc\_type, and file\_name are required' } },

&#x20;               { status: 400 }

&#x20;           );

&#x20;       }



&#x20;       // Verify student belongs to user

&#x20;       const { data: student } = await supabase

&#x20;           .from('students')

&#x20;           .select('id')

&#x20;           .eq('id', student\_id)

&#x20;           .eq('freelancer\_id', user.id)

&#x20;           .is('deleted\_at', null)

&#x20;           .single();



&#x20;       if (!student) {

&#x20;           return NextResponse.json(

&#x20;               { success: false, error: { code: 'NOT\_FOUND', message: 'Student not found' } },

&#x20;               { status: 404 }

&#x20;           );

&#x20;       }



&#x20;       const signatureData = CloudinaryService.generateUploadSignature({

&#x20;           freelancerId: user.id,

&#x20;           studentId: student\_id,

&#x20;           docType: doc\_type,

&#x20;           fileName: file\_name,

&#x20;       });



&#x20;       return NextResponse.json({ success: true, data: signatureData });



&#x20;   } catch (error) {

&#x20;       return NextResponse.json(

&#x20;           { success: false, error: { code: 'INTERNAL\_ERROR', message: 'Internal server error' } },

&#x20;           { status: 500 }

&#x20;       );

&#x20;   }

}

8\. UPDATED CLIENT-SIDE FILE UPLOAD HOOK

TypeScript



// src/hooks/use-file-upload.ts

// UPDATED: Uploads to server API which forwards to Cloudinary



'use client';



import { useState, useCallback } from 'react';

import { MAX\_FILE\_SIZE, ALLOWED\_MIME\_TYPES } from '@/lib/validations/document';



interface UploadedDocument {

&#x20;   id: string;              // DB record ID

&#x20;   type: string;

&#x20;   file\_name: string;

&#x20;   file\_size: number;

&#x20;   mime\_type: string;

&#x20;   file\_path: string;       // Cloudinary URL

&#x20;   cloudinary\_public\_id: string;

&#x20;   status: string;

}



interface UseFileUploadReturn {

&#x20;   uploadDocument: (

&#x20;       studentId: string,

&#x20;       file: File,

&#x20;       metadata: {

&#x20;           type: string;

&#x20;           custom\_label?: string;

&#x20;           description?: string;

&#x20;           issued\_date?: string;

&#x20;           expires\_at?: string;

&#x20;       }

&#x20;   ) => Promise<UploadedDocument>;

&#x20;   replaceDocument: (documentId: string, file: File) => Promise<UploadedDocument>;

&#x20;   deleteDocument: (documentId: string) => Promise<void>;

&#x20;   getDownloadUrl: (documentId: string) => Promise<string>;

&#x20;   progress: number;

&#x20;   isUploading: boolean;

&#x20;   error: string | null;

&#x20;   reset: () => void;

}



export function useFileUpload(): UseFileUploadReturn {

&#x20;   const \[progress, setProgress] = useState(0);

&#x20;   const \[isUploading, setIsUploading] = useState(false);

&#x20;   const \[error, setError] = useState<string | null>(null);



&#x20;   // ── Client-side validation (runs before upload) ──

&#x20;   const validateFile = useCallback((file: File): string | null => {

&#x20;       if (file.size > MAX\_FILE\_SIZE) {

&#x20;           return `File too large. Maximum size is ${MAX\_FILE\_SIZE / 1024 / 1024}MB. Your file is ${(file.size / 1024 / 1024).toFixed(1)}MB.`;

&#x20;       }

&#x20;       if (!ALLOWED\_MIME\_TYPES.includes(file.type as any)) {

&#x20;           return `File type "${file.type}" is not allowed. Accepted: PDF, JPG, PNG, WEBP, DOC, DOCX`;

&#x20;       }

&#x20;       if (file.name.length > 200) {

&#x20;           return 'File name is too long. Maximum 200 characters.';

&#x20;       }

&#x20;       return null;

&#x20;   }, \[]);



&#x20;   // ── Upload new document ──

&#x20;   const uploadDocument = useCallback(async (

&#x20;       studentId: string,

&#x20;       file: File,

&#x20;       metadata: {

&#x20;           type: string;

&#x20;           custom\_label?: string;

&#x20;           description?: string;

&#x20;           issued\_date?: string;

&#x20;           expires\_at?: string;

&#x20;       }

&#x20;   ): Promise<UploadedDocument> => {

&#x20;       // Client-side validation

&#x20;       const validationError = validateFile(file);

&#x20;       if (validationError) {

&#x20;           setError(validationError);

&#x20;           throw new Error(validationError);

&#x20;       }



&#x20;       setError(null);

&#x20;       setProgress(0);

&#x20;       setIsUploading(true);



&#x20;       try {

&#x20;           // Build FormData

&#x20;           const formData = new FormData();

&#x20;           formData.append('file', file);

&#x20;           formData.append('type', metadata.type);

&#x20;           if (metadata.custom\_label) formData.append('custom\_label', metadata.custom\_label);

&#x20;           if (metadata.description) formData.append('description', metadata.description);

&#x20;           if (metadata.issued\_date) formData.append('issued\_date', metadata.issued\_date);

&#x20;           if (metadata.expires\_at) formData.append('expires\_at', metadata.expires\_at);



&#x20;           // Simulate progress (actual upload progress requires XMLHttpRequest)

&#x20;           const progressInterval = setInterval(() => {

&#x20;               setProgress(prev => Math.min(prev + 8, 85));

&#x20;           }, 300);



&#x20;           const response = await fetch(`/api/v1/students/${studentId}/documents`, {

&#x20;               method: 'POST',

&#x20;               body: formData,

&#x20;               // NOTE: Do NOT set Content-Type header — browser sets it with boundary for FormData

&#x20;           });



&#x20;           clearInterval(progressInterval);



&#x20;           const json = await response.json();



&#x20;           if (!json.success) {

&#x20;               throw new Error(json.error?.message || 'Upload failed');

&#x20;           }



&#x20;           setProgress(100);

&#x20;           return json.data;



&#x20;       } catch (err) {

&#x20;           const errorMsg = err instanceof Error ? err.message : 'Upload failed';

&#x20;           setError(errorMsg);

&#x20;           throw err;

&#x20;       } finally {

&#x20;           setIsUploading(false);

&#x20;       }

&#x20;   }, \[validateFile]);



&#x20;   // ── Replace existing document ──

&#x20;   const replaceDocument = useCallback(async (

&#x20;       documentId: string,

&#x20;       file: File

&#x20;   ): Promise<UploadedDocument> => {

&#x20;       const validationError = validateFile(file);

&#x20;       if (validationError) {

&#x20;           setError(validationError);

&#x20;           throw new Error(validationError);

&#x20;       }



&#x20;       setError(null);

&#x20;       setProgress(0);

&#x20;       setIsUploading(true);



&#x20;       try {

&#x20;           const formData = new FormData();

&#x20;           formData.append('file', file);



&#x20;           const progressInterval = setInterval(() => {

&#x20;               setProgress(prev => Math.min(prev + 8, 85));

&#x20;           }, 300);



&#x20;           const response = await fetch(`/api/v1/documents/${documentId}`, {

&#x20;               method: 'PATCH',

&#x20;               body: formData,

&#x20;           });



&#x20;           clearInterval(progressInterval);



&#x20;           const json = await response.json();

&#x20;           if (!json.success) throw new Error(json.error?.message || 'Replace failed');



&#x20;           setProgress(100);

&#x20;           return json.data;



&#x20;       } catch (err) {

&#x20;           const errorMsg = err instanceof Error ? err.message : 'Replace failed';

&#x20;           setError(errorMsg);

&#x20;           throw err;

&#x20;       } finally {

&#x20;           setIsUploading(false);

&#x20;       }

&#x20;   }, \[validateFile]);



&#x20;   // ── Delete document ──

&#x20;   const deleteDocument = useCallback(async (documentId: string): Promise<void> => {

&#x20;       const response = await fetch(`/api/v1/documents/${documentId}`, {

&#x20;           method: 'DELETE',

&#x20;       });



&#x20;       const json = await response.json();

&#x20;       if (!json.success) throw new Error(json.error?.message || 'Delete failed');

&#x20;   }, \[]);



&#x20;   // ── Get download URL ──

&#x20;   const getDownloadUrl = useCallback(async (documentId: string): Promise<string> => {

&#x20;       const response = await fetch(`/api/v1/documents/${documentId}/download`);

&#x20;       const json = await response.json();



&#x20;       if (!json.success) throw new Error(json.error?.message || 'Failed to get download URL');



&#x20;       return json.data.download\_url;

&#x20;   }, \[]);



&#x20;   // ── Reset state ──

&#x20;   const reset = useCallback(() => {

&#x20;       setProgress(0);

&#x20;       setIsUploading(false);

&#x20;       setError(null);

&#x20;   }, \[]);



&#x20;   return {

&#x20;       uploadDocument,

&#x20;       replaceDocument,

&#x20;       deleteDocument,

&#x20;       getDownloadUrl,

&#x20;       progress,

&#x20;       isUploading,

&#x20;       error,

&#x20;       reset,

&#x20;   };

}

9\. UPDATED TYPES

AGENT: Update the StudentDocument interface in src/types/database.ts:



TypeScript



// ADD these fields to the StudentDocument interface:



export interface StudentDocument {

&#x20;   // ... all existing fields from main spec ...

&#x20;   

&#x20;   // ── Cloudinary-specific fields (NEW) ──

&#x20;   cloudinary\_public\_id: string | null;      // Cloudinary's unique ID for the file

&#x20;   cloudinary\_resource\_type: string | null;   // 'image' or 'raw'

&#x20;   cloudinary\_format: string | null;          // 'pdf', 'jpg', etc.

&#x20;   cloudinary\_version: number | null;         // Cloudinary's version number

&#x20;   cloudinary\_asset\_id: string | null;        // Cloudinary's asset ID

&#x20;   

&#x20;   // NOTE: file\_path now contains the Cloudinary secure\_url

&#x20;   // e.g., "https://res.cloudinary.com/your-cloud/image/authenticated/v123/student-portal/..."

}

10\. ARCHITECTURE DIAGRAM (Updated)

text



┌─────────────────────────────────────────────────────────────────────────┐

│                     HOW DOCUMENT STORAGE WORKS                          │

├─────────────────────────────────────────────────────────────────────────┤

│                                                                         │

│   ┌──────────┐                                                         │

│   │  Browser  │                                                         │

│   │  (Client) │                                                         │

│   └─────┬────┘                                                         │

│         │                                                               │

│         │  1. User picks file + selects type                           │

│         │  2. Client validates (size, type)                            │

│         │  3. Sends FormData to API                                    │

│         ▼                                                               │

│   ┌──────────────────┐                                                 │

│   │  Next.js API      │                                                 │

│   │  /api/v1/students │                                                 │

│   │  /\[id]/documents  │                                                 │

│   └──────┬───────────┘                                                 │

│          │                                                              │

│          │  4. Server validates (auth, ownership, file)                 │

│          │  5. Converts File → Buffer                                  │

│          │                                                              │

│          ├───────────────────────┐                                      │

│          │                       │                                      │

│          ▼                       ▼                                      │

│   ┌──────────────┐       ┌──────────────┐                              │

│   │  Cloudinary   │       │  Supabase    │                              │

│   │  (File Store) │       │  (Database)  │                              │

│   │               │       │              │                              │

│   │  6. Upload    │       │  7. Save     │                              │

│   │     file      │       │     metadata │                              │

│   │     (Buffer   │       │     record   │                              │

│   │      → CDN)   │       │     (with    │                              │

│   │               │       │     public\_id│                              │

│   │  Returns:     │       │     + URL)   │                              │

│   │  • public\_id  │──────▶│              │                              │

│   │  • secure\_url │       │              │                              │

│   │  • bytes      │       │              │                              │

│   │  • format     │       │              │                              │

│   └──────────────┘       └──────────────┘                              │

│                                                                         │

│   DOWNLOAD FLOW:                                                        │

│                                                                         │

│   Browser → API → DB lookup (get public\_id) → Generate signed URL      │

│                                                → Return URL to client   │

│   Client  → Cloudinary CDN (direct download via signed URL)            │

│                                                                         │

│   KEY POINTS:                                                           │

│   • Files NEVER stored in Supabase Storage                             │

│   • DB only stores metadata + Cloudinary public\_id                     │

│   • Downloads go directly from Cloudinary CDN to browser               │

│   • Signed URLs expire after 1 hour (configurable)                     │

│   • 'authenticated' type = no one can access without signed URL        │

│   • If DB record is deleted, Cloudinary file is also deleted           │

│   • If Cloudinary upload fails, no DB record is created                │

│   • If DB insert fails after upload, Cloudinary file is cleaned up     │

│                                                                         │

└─────────────────────────────────────────────────────────────────────────┘

11\. CLOUDINARY FOLDER STRUCTURE

text



Cloudinary Dashboard → Media Library:



student-portal/                              ← Root folder

├── {freelancer-uuid-1}/                     ← Freelancer A's files

│   ├── {student-uuid-1}/                    ← Student Rahul

│   │   ├── passport/

│   │   │   └── 1706123456\_rahul\_passport    ← Actual file (no extension in public\_id)

│   │   ├── academic\_transcript/

│   │   │   └── 1706123500\_du\_transcript

│   │   ├── recommendation\_letter/

│   │   │   ├── 1706123600\_prof\_singh\_rec

│   │   │   └── 1706123700\_prof\_sharma\_rec

│   │   └── cv\_resume/

│   │       └── 1706123800\_rahul\_cv

│   │

│   └── {student-uuid-2}/                    ← Student Priya

│       ├── passport/

│       │   └── 1706200000\_priya\_passport

│       └── ...

│

├── {freelancer-uuid-2}/                     ← Freelancer B's files

│   └── ...                                  ← Completely isolated

│

└── ...

12\. WHAT TO REMOVE FROM MAIN SPEC

text



REMOVE/SKIP these from the main specification:



1\. ❌ DO NOT create Supabase Storage bucket "student-documents"

2\. ❌ DO NOT create Supabase Storage policies (storage\_upload, storage\_read, etc.)

3\. ❌ REPLACE the old DocumentService with the one in this addendum

4\. ❌ REPLACE the old use-file-upload.ts with the one in this addendum

5\. ❌ REPLACE the old /api/v1/students/\[id]/documents/route.ts

6\. ❌ REPLACE the old /api/v1/documents/\[id]/route.ts

7\. ❌ REPLACE the old /api/v1/documents/\[id]/download/route.ts



KEEP everything else exactly as-is:

✅ All Supabase database tables, triggers, RLS policies

✅ All other API routes (students, applications, status, etc.)

✅ All types, validations, state machines

✅ All React components, hooks, stores

✅ All UI flows (wizard, profile, etc.)

13\. CLOUDINARY FREE TIER LIMITS (Reference)

text



┌────────────────────────┬─────────────────┬─────────────────────┐

│ Feature                │ Supabase Free   │ Cloudinary Free     │

├────────────────────────┼─────────────────┼─────────────────────┤

│ Storage                │ 1 GB            │ 25 GB               │

│ Bandwidth              │ 2 GB/month      │ 25 GB/month         │

│ Transformations        │ N/A             │ 25,000 credits/month│

│ Max file size          │ 50 MB           │ 10 MB (free plan)   │

│ CDN                    │ Basic           │ Global CDN          │

│ Image optimization     │ No              │ Yes (auto)          │

│ PDF preview generation │ No              │ Yes (paid plans)    │

│ Signed URLs            │ Yes             │ Yes                 │

│ Folder organization    │ Yes             │ Yes                 │

│ Tagging                │ No              │ Yes                 │

│ Backup/versioning      │ No              │ Yes                 │

└────────────────────────┴─────────────────┴─────────────────────┘



ESTIMATION:

\- Average document size: 500KB - 2MB

\- Per student: \~6 documents = \~6MB

\- 25GB storage = \~4,000 students worth of documents

\- That's plenty for MVP and growth phase

14\. UPDATED BUILD ORDER CHANGES

text



In the main spec's build order, make these changes:



PHASE 0: PROJECT SETUP

&#x20; ☐ ADD: npm install cloudinary

&#x20; ☐ ADD: Add CLOUDINARY\_\* env variables to .env.local

&#x20; ☐ SKIP: "Create storage bucket in Supabase Dashboard"

&#x20; ☐ ADD: Run the ALTER TABLE SQL from section 6 of this addendum



PHASE 1: FOUNDATION

&#x20; ☐ ADD: src/lib/cloudinary/config.ts (this addendum, section 3)



PHASE 2: SERVICE LAYER + API

&#x20; ☐ ADD: src/lib/services/cloudinary-service.ts (this addendum, section 4)

&#x20; ☐ REPLACE: src/lib/services/document-service.ts (this addendum, section 5)

&#x20; ☐ REPLACE: Document API routes (this addendum, section 7)



PHASE 3: HOOKS

&#x20; ☐ REPLACE: src/hooks/use-file-upload.ts (this addendum, section 8)



Everything else stays the same.


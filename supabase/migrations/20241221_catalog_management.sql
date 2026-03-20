
-- Catalog Management Migration
-- This migration ensures universities and programs tables are fully established with RLS

-- 1. Create degree_level type if not exists (checked from applicationflowguide)
DO $$ BEGIN
    CREATE TYPE degree_level AS ENUM (
        'diploma', 
        'bachelors', 
        'masters', 
        'phd', 
        'certificate', 
        'foundation'
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- 2. Create universities table (if missing or needs re-creation)
CREATE TABLE IF NOT EXISTS universities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    short_name TEXT,
    country TEXT NOT NULL,
    city TEXT,
    website TEXT,
    logo_url TEXT,
    ranking_global INTEGER,
    description TEXT,
    is_partner BOOLEAN DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT universities_name_not_empty CHECK (length(trim(name)) > 0)
);

-- 3. Create programs table
CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    university_id UUID NOT NULL REFERENCES universities(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    degree_level degree_level NOT NULL,
    duration_months INTEGER,
    tuition_fee DECIMAL(12,2),
    currency TEXT DEFAULT 'USD',
    is_active BOOLEAN NOT NULL DEFAULT true,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT programs_name_not_empty CHECK (length(trim(name)) > 0)
);

-- 4. Enable RLS
ALTER TABLE universities ENABLE ROW LEVEL SECURITY;
ALTER TABLE programs ENABLE ROW LEVEL SECURITY;

-- 5. RLS Policies (Public Read, Admin Write)
CREATE POLICY "Public can view active universities"
    ON universities FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage universities"
    ON universities FOR ALL
    USING (is_admin());

CREATE POLICY "Public can view active programs"
    ON programs FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage programs"
    ON programs FOR ALL
    USING (is_admin());

-- 6. Indexes
CREATE INDEX IF NOT EXISTS idx_universities_country ON universities(country);
CREATE INDEX IF NOT EXISTS idx_programs_university ON programs(university_id);
CREATE INDEX IF NOT EXISTS idx_programs_degree ON programs(degree_level);

-- 7. Updated At Triggers
CREATE TRIGGER trg_universities_timestamp_v2 BEFORE UPDATE ON universities FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();
CREATE TRIGGER trg_programs_timestamp_v2 BEFORE UPDATE ON programs FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

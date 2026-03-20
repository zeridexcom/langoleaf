
-- Team Hierarchy & Managerial Access Migration
-- This migration establishes the teams structure and updates RLS policies for manager access

-- 1. Create teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    manager_id UUID NOT NULL REFERENCES profiles(id) ON DELETE RESTRICT,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Add team_id to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;

-- 3. Helper function to check if user is a manager of the owner
CREATE OR REPLACE FUNCTION is_manager_of(owner_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles p
    JOIN teams t ON p.team_id = t.id
    WHERE p.id = owner_id
    AND t.manager_id = auth.uid()
    AND t.is_active = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Update Students table policies for manager access
DROP POLICY IF EXISTS "Managers can view team students" ON students;
CREATE POLICY "Managers can view team students"
  ON students FOR SELECT
  USING (is_manager_of(freelancer_id));

DROP POLICY IF EXISTS "Managers can update team students" ON students;
CREATE POLICY "Managers can update team students"
  ON students FOR UPDATE
  USING (is_manager_of(freelancer_id));

-- 5. Update Applications table policies for manager access
DROP POLICY IF EXISTS "Managers can view team applications" ON applications;
CREATE POLICY "Managers can view team applications"
  ON applications FOR SELECT
  USING (is_manager_of(freelancer_id));

DROP POLICY IF EXISTS "Managers can update team applications" ON applications;
CREATE POLICY "Managers can update team applications"
  ON applications FOR UPDATE
  USING (is_manager_of(freelancer_id));

-- 6. Update Documents table policies for manager access
DROP POLICY IF EXISTS "Managers can view team documents" ON documents;
CREATE POLICY "Managers can view team documents"
  ON documents FOR SELECT
  USING (is_manager_of(freelancer_id));

DROP POLICY IF EXISTS "Managers can update team documents" ON documents;
CREATE POLICY "Managers can update team documents"
  ON documents FOR UPDATE
  USING (is_manager_of(freelancer_id));

-- 7. Enable RLS on teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for Teams
CREATE POLICY "Managers can view own teams"
    ON teams FOR SELECT
    USING (manager_id = auth.uid());

CREATE POLICY "Admins can manage all teams"
    ON teams FOR ALL
    USING (is_admin());

-- 9. Indexes
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_teams_manager_id ON teams(manager_id);

-- 10. Updated At Trigger
CREATE TRIGGER trg_teams_timestamp BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION fn_update_timestamp();

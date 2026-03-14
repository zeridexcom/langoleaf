-- Gamification System Migration
-- Creates tables for coin transactions, achievements, and user progress tracking

-- ============================================
-- COIN TRANSACTIONS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('earned', 'spent', 'bonus', 'refund')),
  reason VARCHAR(255) NOT NULL,
  reference_type VARCHAR(50), -- 'student', 'application', 'achievement', etc.
  reference_id UUID, -- ID of the related entity
  balance_after INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for coin transactions
CREATE INDEX idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX idx_coin_transactions_created_at ON coin_transactions(created_at DESC);
CREATE INDEX idx_coin_transactions_type ON coin_transactions(type);

-- ============================================
-- ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(100) NOT NULL DEFAULT 'Award',
  color VARCHAR(50) NOT NULL DEFAULT 'amber',
  coin_reward INTEGER NOT NULL DEFAULT 0,
  requirement_type VARCHAR(50) NOT NULL CHECK (requirement_type IN ('count', 'milestone', 'streak', 'special')),
  requirement_value INTEGER NOT NULL DEFAULT 1,
  requirement_entity VARCHAR(50), -- 'students', 'applications', 'enrollments', etc.
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================
-- USER ACHIEVEMENTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS user_achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  achievement_id UUID NOT NULL REFERENCES achievements(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ,
  coin_reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, achievement_id)
);

-- Indexes for user achievements
CREATE INDEX idx_user_achievements_user_id ON user_achievements(user_id);
CREATE INDEX idx_user_achievements_achievement_id ON user_achievements(achievement_id);
CREATE INDEX idx_user_achievements_completed ON user_achievements(completed_at) WHERE completed_at IS NOT NULL;

-- ============================================
-- LEADERBOARD VIEW
-- ============================================
CREATE OR REPLACE VIEW leaderboard AS
SELECT 
  p.id as user_id,
  p.full_name,
  p.avatar_url,
  COALESCE(SUM(ct.amount) FILTER (WHERE ct.type = 'earned'), 0) as total_coins_earned,
  COALESCE(SUM(ct.amount) FILTER (WHERE ct.type = 'earned' AND ct.created_at >= DATE_TRUNC('month', NOW())), 0) as coins_this_month,
  COUNT(DISTINCT s.id) FILTER (WHERE s.deleted_at IS NULL) as total_students,
  COUNT(DISTINCT a.id) FILTER (WHERE a.deleted_at IS NULL AND a.status = 'enrolled') as total_enrollments,
  COUNT(DISTINCT ua.achievement_id) FILTER (WHERE ua.completed_at IS NOT NULL) as achievements_unlocked,
  RANK() OVER (ORDER BY COALESCE(SUM(ct.amount) FILTER (WHERE ct.type = 'earned'), 0) DESC) as rank
FROM profiles p
LEFT JOIN coin_transactions ct ON p.id = ct.user_id
LEFT JOIN students s ON p.id = s.freelancer_id
LEFT JOIN applications a ON s.id = a.student_id
LEFT JOIN user_achievements ua ON p.id = ua.user_id
WHERE p.role = 'freelancer'
GROUP BY p.id, p.full_name, p.avatar_url;

-- ============================================
-- RLS POLICIES
-- ============================================

-- Coin transactions policies
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coin transactions"
  ON coin_transactions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all coin transactions"
  ON coin_transactions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- Achievements policies (public read, admin write)
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view achievements"
  ON achievements FOR SELECT
  USING (true);

CREATE POLICY "Only admins can manage achievements"
  ON achievements FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- User achievements policies
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own achievements"
  ON user_achievements FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own achievements"
  ON user_achievements FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user achievements"
  ON user_achievements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'super_admin')
    )
  );

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to award coins with transaction logging
CREATE OR REPLACE FUNCTION award_coins_with_transaction(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason VARCHAR,
  p_reference_type VARCHAR DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance from profile
  SELECT COALESCE(coins_balance, 0) INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id;
  
  -- Calculate new balance
  v_new_balance := v_current_balance + p_amount;
  
  -- Update profile balance
  UPDATE profiles
  SET coins_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log transaction
  INSERT INTO coin_transactions (
    user_id,
    amount,
    type,
    reason,
    reference_type,
    reference_id,
    balance_after,
    created_at
  ) VALUES (
    p_user_id,
    p_amount,
    'earned',
    p_reason,
    p_reference_type,
    p_reference_id,
    v_new_balance,
    NOW()
  );
  
  RETURN v_new_balance;
END;
$$;

-- Function to spend coins
CREATE OR REPLACE FUNCTION spend_coins(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
BEGIN
  -- Get current balance
  SELECT COALESCE(coins_balance, 0) INTO v_current_balance
  FROM profiles
  WHERE id = p_user_id;
  
  -- Check if user has enough coins
  IF v_current_balance < p_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Calculate new balance
  v_new_balance := v_current_balance - p_amount;
  
  -- Update profile
  UPDATE profiles
  SET coins_balance = v_new_balance,
      updated_at = NOW()
  WHERE id = p_user_id;
  
  -- Log transaction
  INSERT INTO coin_transactions (
    user_id,
    amount,
    type,
    reason,
    balance_after,
    created_at
  ) VALUES (
    p_user_id,
    -p_amount,
    'spent',
    p_reason,
    v_new_balance,
    NOW()
  );
  
  RETURN TRUE;
END;
$$;

-- Function to get user level
CREATE OR REPLACE FUNCTION get_user_level(p_user_id UUID)
RETURNS TABLE (
  level VARCHAR,
  min_coins INTEGER,
  max_coins INTEGER,
  total_coins_earned INTEGER,
  progress_percent INTEGER
)
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  v_total_coins INTEGER;
  v_level VARCHAR;
  v_min INTEGER;
  v_max INTEGER;
  v_progress INTEGER;
BEGIN
  -- Get total coins earned (not current balance)
  SELECT COALESCE(SUM(amount), 0) INTO v_total_coins
  FROM coin_transactions
  WHERE user_id = p_user_id AND type = 'earned';
  
  -- Determine level
  IF v_total_coins >= 10000 THEN
    v_level := 'platinum';
    v_min := 10000;
    v_max := 999999;
    v_progress := 100;
  ELSIF v_total_coins >= 5000 THEN
    v_level := 'gold';
    v_min := 5000;
    v_max := 9999;
    v_progress := ((v_total_coins - 5000) * 100) / 5000;
  ELSIF v_total_coins >= 1000 THEN
    v_level := 'silver';
    v_min := 1000;
    v_max := 4999;
    v_progress := ((v_total_coins - 1000) * 100) / 4000;
  ELSE
    v_level := 'bronze';
    v_min := 0;
    v_max := 999;
    v_progress := (v_total_coins * 100) / 1000;
  END IF;
  
  RETURN QUERY SELECT v_level, v_min, v_max, v_total_coins, v_progress;
END;
$$;

-- Function to check and award achievements
CREATE OR REPLACE FUNCTION check_and_award_achievement(
  p_user_id UUID,
  p_achievement_code VARCHAR
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_achievement_id UUID;
  v_coin_reward INTEGER;
  v_already_completed BOOLEAN;
BEGIN
  -- Get achievement details
  SELECT id, coin_reward INTO v_achievement_id, v_coin_reward
  FROM achievements
  WHERE code = p_achievement_code AND is_active = TRUE;
  
  IF v_achievement_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Check if already completed
  SELECT EXISTS(
    SELECT 1 FROM user_achievements 
    WHERE user_id = p_user_id AND achievement_id = v_achievement_id AND completed_at IS NOT NULL
  ) INTO v_already_completed;
  
  IF v_already_completed THEN
    RETURN FALSE;
  END IF;
  
  -- Mark as completed
  INSERT INTO user_achievements (user_id, achievement_id, progress, completed_at, coin_reward_claimed)
  VALUES (p_user_id, v_achievement_id, 100, NOW(), TRUE)
  ON CONFLICT (user_id, achievement_id) 
  DO UPDATE SET 
    progress = 100,
    completed_at = NOW(),
    coin_reward_claimed = TRUE,
    updated_at = NOW();
  
  -- Award coins if reward exists
  IF v_coin_reward > 0 THEN
    PERFORM award_coins_with_transaction(
      p_user_id,
      v_coin_reward,
      'Achievement unlocked: ' || p_achievement_code,
      'achievement',
      v_achievement_id
    );
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Function to update achievement progress
CREATE OR REPLACE FUNCTION update_achievement_progress(
  p_user_id UUID,
  p_achievement_code VARCHAR,
  p_progress INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_achievement_id UUID;
  v_requirement_value INTEGER;
  v_current_progress INTEGER;
BEGIN
  -- Get achievement details
  SELECT id, requirement_value INTO v_achievement_id, v_requirement_value
  FROM achievements
  WHERE code = p_achievement_code AND is_active = TRUE;
  
  IF v_achievement_id IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Get current progress
  SELECT COALESCE(progress, 0) INTO v_current_progress
  FROM user_achievements
  WHERE user_id = p_user_id AND achievement_id = v_achievement_id;
  
  -- Only update if new progress is higher
  IF p_progress > v_current_progress THEN
    INSERT INTO user_achievements (user_id, achievement_id, progress)
    VALUES (p_user_id, v_achievement_id, p_progress)
    ON CONFLICT (user_id, achievement_id) 
    DO UPDATE SET 
      progress = p_progress,
      updated_at = NOW();
    
    -- Check if achievement should be completed
    IF p_progress >= v_requirement_value THEN
      PERFORM check_and_award_achievement(p_user_id, p_achievement_code);
    END IF;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$;

-- ============================================
-- SEED DEFAULT ACHIEVEMENTS
-- ============================================
INSERT INTO achievements (code, name, description, icon, color, coin_reward, requirement_type, requirement_value, requirement_entity, display_order) VALUES
('first_student', 'First Steps', 'Add your first student to the system', 'UserPlus', 'blue', 50, 'count', 1, 'students', 1),
('student_collector', 'Student Collector', 'Add 10 students', 'Users', 'green', 200, 'count', 10, 'students', 2),
('student_master', 'Student Master', 'Add 50 students', 'Crown', 'purple', 1000, 'count', 50, 'students', 3),
('first_application', 'Application Pioneer', 'Submit your first application', 'FileCheck', 'amber', 100, 'count', 1, 'applications', 4),
('application_pro', 'Application Pro', 'Submit 10 applications', 'FileText', 'orange', 500, 'count', 10, 'applications', 5),
('first_enrollment', 'Enrollment Champion', 'Get your first student enrolled', 'GraduationCap', 'emerald', 500, 'count', 1, 'enrollments', 6),
('enrollment_expert', 'Enrollment Expert', 'Get 5 students enrolled', 'Trophy', 'gold', 2000, 'count', 5, 'enrollments', 7),
('document_organizer', 'Document Organizer', 'Upload 10 documents', 'FolderOpen', 'cyan', 100, 'count', 10, 'documents', 8),
('quick_responder', 'Quick Responder', 'Respond to a notification within 1 hour', 'Zap', 'yellow', 50, 'special', 1, NULL, 9),
('profile_complete', 'Profile Perfectionist', 'Complete your profile to 100%', 'CheckCircle', 'teal', 100, 'milestone', 100, 'profile_completion', 10),
('coin_collector', 'Coin Collector', 'Earn 1000 coins total', 'Coins', 'amber', 200, 'milestone', 1000, 'coins', 11),
('silver_agent', 'Silver Agent', 'Reach Silver level', 'Medal', 'slate', 500, 'milestone', 1000, 'level', 12),
('gold_agent', 'Gold Agent', 'Reach Gold level', 'Award', 'yellow', 1000, 'milestone', 5000, 'level', 13),
('platinum_agent', 'Platinum Agent', 'Reach Platinum level', 'Star', 'purple', 2000, 'milestone', 10000, 'level', 14)
ON CONFLICT (code) DO NOTHING;

-- ============================================
-- ADD COINS BALANCE TO PROFILES IF NOT EXISTS
-- ============================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'coins_balance'
  ) THEN
    ALTER TABLE profiles ADD COLUMN coins_balance INTEGER NOT NULL DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'total_coins_earned'
  ) THEN
    ALTER TABLE profiles ADD COLUMN total_coins_earned INTEGER NOT NULL DEFAULT 0;
  END IF;
END $$;

-- Phase 6 Slice 1: Gamification foundation (XP, levels, streaks)
-- Date: 2026-07-09
-- Purpose:
--   - xp_transactions: append-only audit log of XP awards
--   - user_gamification: denormalized per-user snapshot for fast UI reads
-- Additive only. Does NOT recreate user_achievements (already exists).
-- FK convention: profiles(id) (matches rest of Skill Gain schema).
-- Run in Supabase SQL Editor before using awardXP server action.

-- ---------------------------------------------------------------------------
-- 1. xp_transactions (append-only audit log)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS xp_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  amount INTEGER NOT NULL CHECK (amount >= 0), -- 0 allowed as idempotency marker when daily-capped
  source TEXT NOT NULL CHECK (
    source IN ('path_generated', 'lesson_completed', 'daily_login', 'achievement_unlock')
  ),
  reference_id TEXT, -- path id, card id, YYYY-MM-DD for daily, achievement_type for unlock
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user
  ON xp_transactions(user_id);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_created
  ON xp_transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_xp_transactions_user_source
  ON xp_transactions(user_id, source);

-- Idempotency: one award per (user, source, reference) when reference is set
CREATE UNIQUE INDEX IF NOT EXISTS idx_xp_transactions_user_source_ref
  ON xp_transactions(user_id, source, reference_id)
  WHERE reference_id IS NOT NULL;

COMMENT ON TABLE xp_transactions IS 'Phase 6: append-only XP award log. Written by awardXP server action.';
COMMENT ON COLUMN xp_transactions.source IS 'path_generated | lesson_completed | daily_login | achievement_unlock';
COMMENT ON COLUMN xp_transactions.reference_id IS 'path id, lesson/card id, UTC date (daily_login), or achievement_type';

-- ---------------------------------------------------------------------------
-- 2. user_gamification (fast-read current state)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_gamification (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  total_xp INTEGER NOT NULL DEFAULT 0 CHECK (total_xp >= 0),
  current_level INTEGER NOT NULL DEFAULT 1 CHECK (current_level >= 1),
  current_streak INTEGER NOT NULL DEFAULT 0 CHECK (current_streak >= 0),
  longest_streak INTEGER NOT NULL DEFAULT 0 CHECK (longest_streak >= 0),
  last_activity_date DATE,
  paths_generated_count INTEGER NOT NULL DEFAULT 0 CHECK (paths_generated_count >= 0),
  lessons_completed_count INTEGER NOT NULL DEFAULT 0 CHECK (lessons_completed_count >= 0),
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_user_gamification_level
  ON user_gamification(current_level DESC);

CREATE OR REPLACE FUNCTION update_user_gamification_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_user_gamification_updated ON user_gamification;
CREATE TRIGGER trg_user_gamification_updated
  BEFORE UPDATE ON user_gamification
  FOR EACH ROW EXECUTE FUNCTION update_user_gamification_updated_at();

COMMENT ON TABLE user_gamification IS 'Phase 6: denormalized XP/level/streak snapshot. Updated only via awardXP server action.';

-- ---------------------------------------------------------------------------
-- 3. RLS — users can read own rows; write own rows via authenticated server actions
-- ---------------------------------------------------------------------------
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_gamification ENABLE ROW LEVEL SECURITY;

-- xp_transactions: SELECT + INSERT own (no UPDATE/DELETE — append-only)
DROP POLICY IF EXISTS "Users can view own xp transactions" ON xp_transactions;
CREATE POLICY "Users can view own xp transactions"
  ON xp_transactions
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own xp transactions" ON xp_transactions;
CREATE POLICY "Users can insert own xp transactions"
  ON xp_transactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- user_gamification: full own-row access for upserts from awardXP
DROP POLICY IF EXISTS "Users can view own gamification" ON user_gamification;
CREATE POLICY "Users can view own gamification"
  ON user_gamification
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own gamification" ON user_gamification;
CREATE POLICY "Users can insert own gamification"
  ON user_gamification
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own gamification" ON user_gamification;
CREATE POLICY "Users can update own gamification"
  ON user_gamification
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- 4. Ensure user_achievements insert policy exists (table already in schema)
--    Safe to re-run; only creates if missing patterns vary by env.
-- ---------------------------------------------------------------------------
-- Existing table columns: id, user_id, achievement_type, title, description, icon, earned_at
-- Policies may already exist in production; create IF NOT EXISTS style via DROP+CREATE.

DROP POLICY IF EXISTS "Users can view own achievements" ON user_achievements;
CREATE POLICY "Users can view own achievements"
  ON user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own achievements" ON user_achievements;
CREATE POLICY "Users can insert own achievements"
  ON user_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Note: No DELETE/UPDATE for users — achievements are permanent unlocks.
-- Backfill: none. Rows created lazily on first awardXP call per user.

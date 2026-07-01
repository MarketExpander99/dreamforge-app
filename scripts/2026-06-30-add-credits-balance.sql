-- Phase 3: Additive credits support for Study experience (lesson card generation)
-- Date: 2026-06-30
-- Purpose: Add credits_balance to profiles for showing balance + enforcing usage on Grok lesson generation.
-- Additive only — no existing columns or data touched. Safe to run multiple times.
-- Default starting balance: 25 credits (generous starter for study + discover usage).
-- RLS on profiles already allows owners to SELECT/UPDATE their row; the new column inherits this automatically.
-- Run this in Supabase SQL Editor before using credit-aware features in Study.

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS credits_balance INTEGER NOT NULL DEFAULT 25;

-- Backfill for any pre-existing profiles (safe)
UPDATE profiles SET credits_balance = 25 WHERE credits_balance IS NULL;

-- Optional comment
COMMENT ON COLUMN profiles.credits_balance IS 'Phase 3: user credit balance for AI lesson/path generation. Deducted on successful Grok calls in Study.';

-- Note: In app code we read/write via RLS-protected server actions.
-- No new table or policies required for basic balance tracking.
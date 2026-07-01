-- Phase 5: Additive credit purchases table for PayFast integration
-- Date: 2026-07-01
-- Purpose: Store pending + completed credit purchases / transactions.
-- Allows tracking PayFast payments, prevents double-crediting, provides audit log.
-- Additive only. No changes to profiles or other tables.
-- Run in Supabase SQL Editor AFTER the previous credits_balance migration.

CREATE TABLE IF NOT EXISTS credit_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  pack_id TEXT NOT NULL,                    -- e.g. 'starter', 'standard', 'pro'
  credits INTEGER NOT NULL CHECK (credits > 0),
  amount NUMERIC(10, 2) NOT NULL,           -- ZAR amount charged
  currency TEXT DEFAULT 'ZAR' NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'completed', 'cancelled', 'failed')),
  m_payment_id TEXT UNIQUE NOT NULL,        -- Our unique reference sent to PayFast (e.g. userId_timestamp)
  payfast_payment_id TEXT,                  -- pf_payment_id returned by PayFast
  item_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Helpful index for lookups during ITN and success pages
CREATE INDEX IF NOT EXISTS idx_credit_purchases_user ON credit_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_mpid ON credit_purchases(m_payment_id);
CREATE INDEX IF NOT EXISTS idx_credit_purchases_status ON credit_purchases(status);

-- Trigger to maintain updated_at
CREATE OR REPLACE FUNCTION update_credit_purchases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_credit_purchases_updated ON credit_purchases;
CREATE TRIGGER trg_credit_purchases_updated
  BEFORE UPDATE ON credit_purchases
  FOR EACH ROW EXECUTE FUNCTION update_credit_purchases_updated_at();

-- RLS
ALTER TABLE credit_purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY IF NOT EXISTS "Users can view own credit purchases"
  ON credit_purchases
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own pending purchases (client or server action)
CREATE POLICY IF NOT EXISTS "Users can insert their own purchases"
  ON credit_purchases
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- NOTE: No broad UPDATE policy for normal users.
-- Status/credits are updated server-side via the notify webhook using the SERVICE ROLE KEY (bypasses RLS).
-- This is intentional and secure for PayFast ITN.

COMMENT ON TABLE credit_purchases IS 'Phase 5 PayFast credit purchases. Records every buy attempt. Credits added only after successful validated ITN.';
COMMENT ON COLUMN credit_purchases.m_payment_id IS 'Unique merchant reference passed as m_payment_id to PayFast. Used for reconciliation.';
COMMENT ON COLUMN credit_purchases.status IS 'pending = created, completed = ITN confirmed success, cancelled/failed = user cancelled or error.';

-- Backfill note: none needed. Table is new.
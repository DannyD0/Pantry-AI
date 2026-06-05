-- Sprint 6: Automated Prediction Engine
-- Run this SQL in your Supabase SQL editor (Dashboard → SQL Editor → New Query)

-- Add new columns to inventory table
ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS consumption_velocity_per_day FLOAT,
  ADD COLUMN IF NOT EXISTS historical_lifespans JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS tracking_state TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK (tracking_state IN ('ACTIVE', 'PENDING_VERIFICATION', 'EMPTY')),
  ADD COLUMN IF NOT EXISTS priority_tier TEXT NOT NULL DEFAULT 'MEDIUM'
    CHECK (priority_tier IN ('HIGH', 'MEDIUM', 'LOW')),
  ADD COLUMN IF NOT EXISTS last_purchased_timestamp TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS volume_multiplier FLOAT NOT NULL DEFAULT 1.0;

-- Backfill existing items: assign MEDIUM priority and set last_purchased_timestamp
UPDATE inventory
SET
  last_purchased_timestamp = COALESCE(last_purchased_timestamp, last_updated, NOW())
WHERE last_purchased_timestamp IS NULL;

-- Sprint 7: Expiry Date Tracking
-- Run this SQL in your Supabase SQL editor (Dashboard → SQL Editor → New Query)

ALTER TABLE inventory
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

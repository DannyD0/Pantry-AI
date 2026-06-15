-- Sprint 9: Shopping list captures full pantry fields for smart restock
-- Run this SQL in your Supabase SQL editor (Dashboard -> SQL Editor -> New Query)

ALTER TABLE shopping_list
  ADD COLUMN IF NOT EXISTS brand TEXT,
  ADD COLUMN IF NOT EXISTS usage_frequency TEXT
    CHECK (usage_frequency IS NULL OR usage_frequency IN ('daily', 'thrice_weekly', 'weekly')),
  ADD COLUMN IF NOT EXISTS expiry_date DATE;

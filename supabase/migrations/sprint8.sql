-- Sprint 8: Shopping list details for smart-match restock
-- Run this SQL in your Supabase SQL editor (Dashboard → SQL Editor → New Query)

ALTER TABLE shopping_list
  ADD COLUMN IF NOT EXISTS weight_per_unit FLOAT,
  ADD COLUMN IF NOT EXISTS unit TEXT,
  ADD COLUMN IF NOT EXISTS category TEXT
    CHECK (category IS NULL OR category IN ('Protein', 'Vegetable', 'Grain', 'Dairy', 'Essential', 'Other'));

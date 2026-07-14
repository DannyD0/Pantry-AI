-- Sprint 13: Expand food categories
-- Review carefully before running. Do NOT auto-run.
-- Run in Supabase SQL Editor. Safe to run multiple times (idempotent).
--
-- Old categories: Protein, Vegetable, Grain, Dairy, Essential, Other
-- New categories: Fruits & Vegetables, Bakery, Grains & Pasta, Deli & Meat,
--                 Seafood, Dairy & Eggs, Frozen Foods, Beverages, Snacks,
--                 Essentials, Other
--
-- Existing rows still holding an old category value would violate the new
-- CHECK constraint, so this migration remaps them first (best-effort) before
-- swapping the constraint.

-- ─── Data remap: old category values → new category values ───────────────────

DO $$
DECLARE
  inv_rows  INTEGER;
  shop_rows INTEGER;
BEGIN
  UPDATE public.inventory SET category = CASE category
    WHEN 'Protein'   THEN 'Deli & Meat'
    WHEN 'Vegetable' THEN 'Fruits & Vegetables'
    WHEN 'Grain'     THEN 'Grains & Pasta'
    WHEN 'Dairy'     THEN 'Dairy & Eggs'
    WHEN 'Essential' THEN 'Essentials'
    ELSE category
  END
  WHERE category IN ('Protein', 'Vegetable', 'Grain', 'Dairy', 'Essential');
  GET DIAGNOSTICS inv_rows = ROW_COUNT;

  UPDATE public.shopping_list SET category = CASE category
    WHEN 'Protein'   THEN 'Deli & Meat'
    WHEN 'Vegetable' THEN 'Fruits & Vegetables'
    WHEN 'Grain'     THEN 'Grains & Pasta'
    WHEN 'Dairy'     THEN 'Dairy & Eggs'
    WHEN 'Essential' THEN 'Essentials'
    ELSE category
  END
  WHERE category IN ('Protein', 'Vegetable', 'Grain', 'Dairy', 'Essential');
  GET DIAGNOSTICS shop_rows = ROW_COUNT;

  RAISE NOTICE 'Remapped % inventory rows and % shopping_list rows to new categories.', inv_rows, shop_rows;
END;
$$;

-- ─── Swap the CHECK constraints ───────────────────────────────────────────────

ALTER TABLE public.inventory DROP CONSTRAINT IF EXISTS inventory_category_check;
ALTER TABLE public.inventory
  ADD CONSTRAINT inventory_category_check
  CHECK (category IS NULL OR category IN (
    'Fruits & Vegetables', 'Bakery', 'Grains & Pasta', 'Deli & Meat', 'Seafood',
    'Dairy & Eggs', 'Frozen Foods', 'Beverages', 'Snacks', 'Essentials', 'Other'
  ));

ALTER TABLE public.shopping_list DROP CONSTRAINT IF EXISTS shopping_list_category_check;
ALTER TABLE public.shopping_list
  ADD CONSTRAINT shopping_list_category_check
  CHECK (category IS NULL OR category IN (
    'Fruits & Vegetables', 'Bakery', 'Grains & Pasta', 'Deli & Meat', 'Seafood',
    'Dairy & Eggs', 'Frozen Foods', 'Beverages', 'Snacks', 'Essentials', 'Other'
  ));

-- ─── Verify migration ─────────────────────────────────────────────────────────

DO $$
DECLARE
  bad_inv  INTEGER;
  bad_shop INTEGER;
BEGIN
  SELECT COUNT(*) INTO bad_inv FROM public.inventory
    WHERE category IS NOT NULL AND category NOT IN (
      'Fruits & Vegetables', 'Bakery', 'Grains & Pasta', 'Deli & Meat', 'Seafood',
      'Dairy & Eggs', 'Frozen Foods', 'Beverages', 'Snacks', 'Essentials', 'Other'
    );
  SELECT COUNT(*) INTO bad_shop FROM public.shopping_list
    WHERE category IS NOT NULL AND category NOT IN (
      'Fruits & Vegetables', 'Bakery', 'Grains & Pasta', 'Deli & Meat', 'Seafood',
      'Dairy & Eggs', 'Frozen Foods', 'Beverages', 'Snacks', 'Essentials', 'Other'
    );

  IF bad_inv > 0 OR bad_shop > 0 THEN
    RAISE EXCEPTION
      'Migration incomplete: % inventory rows and % shopping_list rows still hold an invalid category.',
      bad_inv, bad_shop;
  END IF;

  RAISE NOTICE 'Verification passed — all category values are valid.';
END;
$$;

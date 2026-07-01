-- Sprint 12: Household Sharing
-- Review carefully before running. This migration moves existing user data.
-- Run in Supabase SQL Editor. Safe to run multiple times (idempotent).

-- ─── New tables ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.households (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  created_by    UUID REFERENCES auth.users(id),
  household_size INTEGER DEFAULT 2,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.household_members (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID REFERENCES public.households(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(household_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_household_members_user_id      ON public.household_members(user_id);
CREATE INDEX IF NOT EXISTS idx_household_members_household_id ON public.household_members(household_id);

CREATE TABLE IF NOT EXISTS public.household_invites (
  id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id   UUID REFERENCES public.households(id) ON DELETE CASCADE,
  invite_code    TEXT UNIQUE NOT NULL,
  created_by     UUID REFERENCES auth.users(id),
  invited_email  TEXT NULL,
  used_by        UUID NULL REFERENCES auth.users(id),
  expires_at     TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ─── Add household_id to existing tables ─────────────────────────────────────

ALTER TABLE public.inventory     ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id);
ALTER TABLE public.shopping_list ADD COLUMN IF NOT EXISTS household_id UUID REFERENCES public.households(id);

CREATE INDEX IF NOT EXISTS idx_inventory_household_id     ON public.inventory(household_id);
CREATE INDEX IF NOT EXISTS idx_shopping_list_household_id ON public.shopping_list(household_id);

-- ─── Data migration ───────────────────────────────────────────────────────────
-- For each existing user: create a household, add them as the sole member,
-- then backfill household_id on their inventory and shopping_list rows.
-- Row counts are logged via RAISE NOTICE (visible in the SQL editor output).
-- The block is idempotent: users who already have a household are skipped.

DO $$
DECLARE
  rec        RECORD;
  hh_id      UUID;
  inv_rows   INTEGER;
  shop_rows  INTEGER;
BEGIN
  FOR rec IN SELECT id, raw_user_meta_data FROM auth.users LOOP

    IF EXISTS (SELECT 1 FROM public.household_members WHERE user_id = rec.id) THEN
      RAISE NOTICE 'User % already has a household — skipping.', rec.id;
      CONTINUE;
    END IF;

    INSERT INTO public.households (created_by, household_size)
    VALUES (
      rec.id,
      COALESCE((rec.raw_user_meta_data->>'household_size')::INTEGER, 2)
    )
    RETURNING id INTO hh_id;

    INSERT INTO public.household_members (household_id, user_id)
    VALUES (hh_id, rec.id);

    UPDATE public.inventory
    SET    household_id = hh_id
    WHERE  user_id = rec.id AND household_id IS NULL;
    GET DIAGNOSTICS inv_rows = ROW_COUNT;

    UPDATE public.shopping_list
    SET    household_id = hh_id
    WHERE  user_id = rec.id AND household_id IS NULL;
    GET DIAGNOSTICS shop_rows = ROW_COUNT;

    RAISE NOTICE 'User %  household=%  inventory updated=%  shopping_list updated=%',
      rec.id, hh_id, inv_rows, shop_rows;
  END LOOP;
END;
$$;

-- ─── Verify migration ─────────────────────────────────────────────────────────
-- This block raises an exception (aborting the statement) if any rows are
-- still missing household_id after the migration above.

DO $$
DECLARE
  null_inv  INTEGER;
  null_shop INTEGER;
BEGIN
  SELECT COUNT(*) INTO null_inv  FROM public.inventory     WHERE household_id IS NULL;
  SELECT COUNT(*) INTO null_shop FROM public.shopping_list WHERE household_id IS NULL;

  IF null_inv > 0 OR null_shop > 0 THEN
    RAISE EXCEPTION
      'Migration incomplete: % inventory rows and % shopping_list rows still have NULL household_id. '
      'Check that all auth.users rows were processed above.',
      null_inv, null_shop;
  END IF;

  RAISE NOTICE 'Verification passed — all rows have household_id set.';
END;
$$;

-- ─── RLS ─────────────────────────────────────────────────────────────────────

ALTER TABLE public.households        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.household_invites ENABLE ROW LEVEL SECURITY;

-- Shared helper: a member can access anything whose household_id matches their membership.
-- Applied identically to all four new/updated tables (symmetric, no role distinction).

DROP POLICY IF EXISTS "household_member_access" ON public.households;
CREATE POLICY "household_member_access" ON public.households FOR ALL
  USING (id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "household_member_access" ON public.household_members;
CREATE POLICY "household_member_access" ON public.household_members FOR ALL
  USING (household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "household_member_access" ON public.household_invites;
CREATE POLICY "household_member_access" ON public.household_invites FOR ALL
  USING (household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  ));

-- inventory and shopping_list: replace old user_id policies with household_id policies.
DROP POLICY IF EXISTS "Users can manage their own inventory" ON public.inventory;
DROP POLICY IF EXISTS "household_member_access"              ON public.inventory;
CREATE POLICY "household_member_access" ON public.inventory FOR ALL
  USING (household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  ));

DROP POLICY IF EXISTS "Users can manage their own shopping list" ON public.shopping_list;
DROP POLICY IF EXISTS "household_member_access"                  ON public.shopping_list;
CREATE POLICY "household_member_access" ON public.shopping_list FOR ALL
  USING (household_id IN (
    SELECT household_id FROM public.household_members WHERE user_id = auth.uid()
  ));

-- ─── Trigger: auto-create household for future new users ─────────────────────
-- Fires AFTER INSERT on auth.users so every new signup gets a household row
-- and a membership row automatically, before the first app request.

CREATE OR REPLACE FUNCTION public.handle_new_user_household()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  new_hh_id UUID;
BEGIN
  INSERT INTO public.households (created_by, household_size)
  VALUES (NEW.id, 2)
  RETURNING id INTO new_hh_id;

  INSERT INTO public.household_members (household_id, user_id)
  VALUES (new_hh_id, NEW.id);

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE PROCEDURE public.handle_new_user_household();

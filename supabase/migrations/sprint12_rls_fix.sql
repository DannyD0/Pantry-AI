-- Sprint 12 RLS fix: break the self-referencing recursion on household_members.
-- Root cause: the household_members policy subqueried household_members itself,
-- which Postgres flags as "infinite recursion detected in policy for relation
-- household_members" (42P17) whenever any RLS-governed query (households,
-- household_invites, inventory, shopping_list) needed to evaluate it.
-- Run in Supabase SQL Editor. Safe to run multiple times (idempotent).

-- ─── Helper function ──────────────────────────────────────────────────────────
-- SECURITY DEFINER lets this function read household_members without
-- re-triggering RLS on itself, breaking the recursive dependency.

CREATE OR REPLACE FUNCTION public.my_household_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT household_id FROM public.household_members WHERE user_id = auth.uid() LIMIT 1;
$$;

-- ─── Replace self-referencing policies ────────────────────────────────────────

DROP POLICY IF EXISTS "household_member_access" ON public.households;
CREATE POLICY "household_member_access" ON public.households FOR ALL
  USING (id = public.my_household_id());

DROP POLICY IF EXISTS "household_member_access" ON public.household_members;
CREATE POLICY "household_member_access" ON public.household_members FOR ALL
  USING (household_id = public.my_household_id());

DROP POLICY IF EXISTS "household_member_access" ON public.household_invites;
CREATE POLICY "household_member_access" ON public.household_invites FOR ALL
  USING (household_id = public.my_household_id());

DROP POLICY IF EXISTS "household_member_access" ON public.inventory;
CREATE POLICY "household_member_access" ON public.inventory FOR ALL
  USING (household_id = public.my_household_id());

DROP POLICY IF EXISTS "household_member_access" ON public.shopping_list;
CREATE POLICY "household_member_access" ON public.shopping_list FOR ALL
  USING (household_id = public.my_household_id());

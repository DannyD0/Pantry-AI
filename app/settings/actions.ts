"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { sanitizeText } from "@/lib/logic/validate"
import type { HouseholdMemberWithProfile } from "@/lib/supabase/types"

function makeAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return null
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function updateProfile(name: string) {
  const fullName = sanitizeText(name, 80)
  if (!fullName) return { error: "Name cannot be empty." }
  const supabase = createServerClient()
  const { error } = await supabase.auth.updateUser({ data: { full_name: fullName } })
  if (error) return { error: error.message }
  return { success: true }
}

export async function changePassword(currentPassword: string, newPassword: string) {
  if (typeof newPassword !== "string" || newPassword.length < 8 || newPassword.length > 128)
    return { error: "New password must be 8–128 characters." }
  if (newPassword === currentPassword)
    return { error: "New password must differ from current password." }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.email) return { error: "Not authenticated." }

  const { error: signInErr } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  })
  if (signInErr) return { error: "Current password is incorrect." }

  const { error } = await supabase.auth.updateUser({ password: newPassword })
  if (error) return { error: error.message }
  return { success: true }
}

export async function deleteAccount() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const admin = makeAdminClient()

  // Get the user's household(s) before deleting data
  const { data: memberRecords } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)

  // Delete the user's own data rows
  await supabase.from("inventory").delete().eq("user_id", user.id)
  await supabase.from("shopping_list").delete().eq("user_id", user.id)
  await supabase.from("household_members").delete().eq("user_id", user.id)

  // Delete any household that is now empty
  if (admin) {
    for (const { household_id } of memberRecords ?? []) {
      const { count } = await admin
        .from("household_members")
        .select("*", { count: "exact", head: true })
        .eq("household_id", household_id)
      if ((count ?? 0) === 0) {
        await admin.from("households").delete().eq("id", household_id)
      }
    }
    await admin.auth.admin.deleteUser(user.id)
  }

  await supabase.auth.signOut()
  redirect("/login")
}

export async function downloadUserData() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const [{ data: inventory }, { data: shoppingList }] = await Promise.all([
    supabase.from("inventory").select("*").eq("user_id", user.id),
    supabase.from("shopping_list").select("*").eq("user_id", user.id),
  ])

  return {
    success: true,
    data: {
      exported_at: new Date().toISOString(),
      inventory: inventory ?? [],
      shopping_list: shoppingList ?? [],
    },
  }
}

// ─── Household actions ────────────────────────────────────────────────────────

export async function getHouseholdData() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const { data: memberRecord } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single()

  if (!memberRecord?.household_id) return { error: "No household found." }

  const householdId = memberRecord.household_id as string

  const [{ data: household }, { data: members }] = await Promise.all([
    supabase.from("households").select("*").eq("id", householdId).single(),
    supabase.from("household_members").select("*").eq("household_id", householdId),
  ])

  // Enrich members with name/email from auth.users via admin client
  const admin = makeAdminClient()
  const enrichedMembers: HouseholdMemberWithProfile[] = await Promise.all(
    (members ?? []).map(async (m) => {
      if (!admin) return { ...m, email: null, full_name: null }
      const { data } = await admin.auth.admin.getUserById(m.user_id as string)
      return {
        ...m,
        email: data.user?.email ?? null,
        full_name: (data.user?.user_metadata?.full_name as string | undefined) ?? null,
      }
    })
  )

  return {
    success: true,
    householdId,
    household: household ?? null,
    members: enrichedMembers,
    currentUserId: user.id,
  }
}

export async function updateHouseholdSize(size: number) {
  if (!Number.isInteger(size) || size < 1 || size > 20) {
    return { error: "Household size must be between 1 and 20." }
  }

  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: "Not authenticated." }

  const { data: memberRecord } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single()

  if (!memberRecord?.household_id) return { error: "No household found." }

  const { error } = await supabase
    .from("households")
    .update({ household_size: size })
    .eq("id", memberRecord.household_id)

  if (error) return { error: error.message }
  return { success: true }
}

"use server"

import { createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { redirect } from "next/navigation"
import { sanitizeText } from "@/lib/logic/validate"

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

  // Re-authenticate with current password to verify it
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

  // Clear all user data using auth'd client (RLS allows this)
  await supabase.from("inventory").delete().eq("user_id", user.id)
  await supabase.from("shopping_list").delete().eq("user_id", user.id)

  // Delete the auth user if service role key is available
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (serviceKey) {
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
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

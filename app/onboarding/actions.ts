"use server"

import { createServerClient } from "@/lib/supabase/server"

export async function completeOnboarding() {
  const supabase = createServerClient()
  const { error } = await supabase.auth.updateUser({ data: { onboarding_complete: true } })
  if (error) return { error: error.message }
  return { success: true }
}

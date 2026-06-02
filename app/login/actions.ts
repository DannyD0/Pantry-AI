"use server"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function sendMagicLink(email: string) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    console.log("[sendMagicLink] SUPABASE_URL domain:", supabaseUrl ? new URL(supabaseUrl).hostname : "MISSING")
    console.log("[sendMagicLink] SITE_URL:", process.env.NEXT_PUBLIC_SITE_URL ?? "MISSING")

    const supabase = createServerClient()

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      },
    })

    if (error) {
      console.log("[sendMagicLink] Supabase error:", error.message)
      return { error: error.message }
    }

    console.log("[sendMagicLink] Success")
    return { success: true }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Something went wrong. Please try again."
    console.log("[sendMagicLink] Caught exception:", msg)
    return { error: msg }
  }
}

export async function signOut() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect("/login")
}

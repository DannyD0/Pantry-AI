"use server"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export async function sendMagicLink(email: string) {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      },
    })
    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong. Please try again." }
  }
}

export async function signInWithPassword(email: string, password: string) {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    redirect("/")
  } catch (err: unknown) {
    // redirect() throws — rethrow it
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err
    return { error: err instanceof Error ? err.message : "Something went wrong." }
  }
}

export async function signUpWithPassword(email: string, password: string) {
  try {
    const supabase = createServerClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      },
    })
    if (error) return { error: error.message }
    return { success: true, needsConfirmation: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." }
  }
}

export async function signOut() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect("/login")
}

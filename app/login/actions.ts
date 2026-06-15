"use server"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { isValidEmail, sanitizeText } from "@/lib/logic/validate"

function validateCredentials(email: string, password: string): string | null {
  if (!isValidEmail(email)) return "Enter a valid email address."
  if (typeof password !== "string" || password.length < 8 || password.length > 128)
    return "Password must be 8–128 characters."
  return null
}

export async function signInWithPassword(email: string, password: string) {
  const invalid = validateCredentials(email, password)
  if (invalid) return { error: invalid }
  try {
    const supabase = createServerClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    redirect("/")
  } catch (err: unknown) {
    // redirect() throws, rethrow it
    if (err instanceof Error && err.message === "NEXT_REDIRECT") throw err
    return { error: err instanceof Error ? err.message : "Something went wrong." }
  }
}

export async function signUpWithPassword(email: string, password: string, name: string) {
  const invalid = validateCredentials(email, password)
  if (invalid) return { error: invalid }
  const fullName = sanitizeText(name, 80)
  if (!fullName) return { error: "Enter your name." }
  try {
    const supabase = createServerClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/auth/callback`,
      },
    })
    if (error) return { error: error.message }
    return { success: true }
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Something went wrong." }
  }
}

export async function signOut() {
  const supabase = createServerClient()
  await supabase.auth.signOut()
  redirect("/login")
}

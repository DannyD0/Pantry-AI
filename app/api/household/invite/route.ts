import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

function generateInviteCode(): string {
  // Unambiguous alphanumeric characters (avoids 0/O, 1/I confusion)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("")
}

export async function POST() {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const { data: memberRecord } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single()

  if (!memberRecord?.household_id) {
    return NextResponse.json({ error: "No household found." }, { status: 404 })
  }

  const householdId = memberRecord.household_id
  const inviteCode = generateInviteCode()

  const { error } = await supabase.from("household_invites").insert({
    household_id: householdId,
    invite_code: inviteCode,
    created_by: user.id,
  })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const link = `${siteUrl}/join?code=${inviteCode}`

  return NextResponse.json({ invite_code: inviteCode, link })
}

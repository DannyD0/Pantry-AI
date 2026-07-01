import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"

function adminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) return null
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const admin = adminClient()
  if (!admin) {
    return NextResponse.json(
      { error: "Household management requires server configuration. Contact support." },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const code = typeof body.code === "string" ? body.code.trim().toUpperCase() : ""
  if (!code) {
    return NextResponse.json({ error: "Invite code is required." }, { status: 400 })
  }

  // Validate invite (uses admin to bypass RLS; inviter's household is not accessible by outsider)
  const { data: invite, error: inviteErr } = await admin
    .from("household_invites")
    .select("*")
    .eq("invite_code", code)
    .single()

  if (inviteErr || !invite) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 404 })
  }
  if (invite.used_by) {
    return NextResponse.json({ error: "This invite code has already been used." }, { status: 409 })
  }
  if (new Date(invite.expires_at) < new Date()) {
    return NextResponse.json({ error: "This invite code has expired." }, { status: 410 })
  }

  const targetHouseholdId = invite.household_id as string

  // Get the user's current household
  const { data: currentMember } = await admin
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single()

  const oldHouseholdId = currentMember?.household_id as string | undefined

  // Already a member of the target household: no-op
  if (oldHouseholdId === targetHouseholdId) {
    return NextResponse.json({ success: true, household_id: targetHouseholdId })
  }

  // Move the user's personal items to the target household
  if (oldHouseholdId) {
    await admin
      .from("inventory")
      .update({ household_id: targetHouseholdId })
      .eq("household_id", oldHouseholdId)
      .eq("user_id", user.id)

    await admin
      .from("shopping_list")
      .update({ household_id: targetHouseholdId })
      .eq("household_id", oldHouseholdId)
      .eq("user_id", user.id)
  }

  // Add to target household FIRST so the user is never without a household if
  // a crash occurs between this insert and the delete below.
  const { error: joinErr } = await admin.from("household_members").insert({
    household_id: targetHouseholdId,
    user_id: user.id,
  })

  if (joinErr) {
    return NextResponse.json({ error: joinErr.message }, { status: 500 })
  }

  // Remove from old household now that the user is safely in the new one
  if (oldHouseholdId) {
    await admin
      .from("household_members")
      .delete()
      .eq("household_id", oldHouseholdId)
      .eq("user_id", user.id)

    // Delete old household if it has no remaining members
    const { count } = await admin
      .from("household_members")
      .select("*", { count: "exact", head: true })
      .eq("household_id", oldHouseholdId)

    if ((count ?? 0) === 0) {
      await admin.from("households").delete().eq("id", oldHouseholdId)
    }
  }

  // Mark invite as used
  await admin
    .from("household_invites")
    .update({ used_by: user.id })
    .eq("id", invite.id)

  return NextResponse.json({ success: true, household_id: targetHouseholdId })
}

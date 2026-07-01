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

export async function DELETE(request: NextRequest) {
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
  const targetUserId = typeof body.user_id === "string" ? body.user_id : user.id

  // Verify the requesting user is in the same household as the target
  const { data: requesterMember } = await admin
    .from("household_members")
    .select("household_id")
    .eq("user_id", user.id)
    .single()

  if (!requesterMember?.household_id) {
    return NextResponse.json({ error: "No household found." }, { status: 404 })
  }

  const householdId = requesterMember.household_id as string

  // Ensure target is actually in this household
  const { data: targetMember } = await admin
    .from("household_members")
    .select("id")
    .eq("household_id", householdId)
    .eq("user_id", targetUserId)
    .single()

  if (!targetMember) {
    return NextResponse.json({ error: "Member not found in this household." }, { status: 404 })
  }

  // Last-member guardrail
  const { count: memberCount } = await admin
    .from("household_members")
    .select("*", { count: "exact", head: true })
    .eq("household_id", householdId)

  if ((memberCount ?? 0) <= 1) {
    return NextResponse.json(
      { error: "You're the only member of this household, you can't leave." },
      { status: 409 }
    )
  }

  // Create a new empty solo household for the removed user.
  // All items stay with the current household regardless of who added them.
  const { data: newHousehold, error: createErr } = await admin
    .from("households")
    .insert({ created_by: targetUserId, household_size: 1 })
    .select("id")
    .single()

  if (createErr || !newHousehold) {
    return NextResponse.json({ error: "Failed to create new household." }, { status: 500 })
  }

  const newHouseholdId = newHousehold.id as string

  // Add the removed user to their new household first so they are never memberless.
  await admin.from("household_members").insert({
    household_id: newHouseholdId,
    user_id: targetUserId,
  })

  // Remove from old household. Items remain with the old household.
  await admin
    .from("household_members")
    .delete()
    .eq("household_id", householdId)
    .eq("user_id", targetUserId)

  return NextResponse.json({ success: true })
}

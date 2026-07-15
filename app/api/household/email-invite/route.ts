import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { isValidEmail } from "@/lib/logic/validate"

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
  const bytes = crypto.getRandomValues(new Uint8Array(8))
  return Array.from(bytes).map((b) => chars[b % chars.length]).join("")
}

export async function POST(request: NextRequest) {
  const supabase = createServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Not authenticated." }, { status: 401 })
  }

  const resendKey = process.env.RESEND_API_KEY
  if (!resendKey) {
    return NextResponse.json(
      { error: "Email invites are not configured. Add RESEND_API_KEY to enable them." },
      { status: 503 }
    )
  }

  const body = await request.json().catch(() => ({}))
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : ""
  if (!isValidEmail(email)) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
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
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  const inviteLink = `${siteUrl}/join?code=${inviteCode}`
  const senderName = (user.user_metadata?.full_name as string | undefined) ?? user.email ?? "Someone"
  const fromEmail = process.env.RESEND_FROM_EMAIL ?? "onboarding@resend.dev"

  // Save the invite record first
  const { error: dbErr } = await supabase.from("household_invites").insert({
    household_id: householdId,
    invite_code: inviteCode,
    created_by: user.id,
    invited_email: email,
  })

  if (dbErr) {
    return NextResponse.json({ error: dbErr.message }, { status: 500 })
  }

  // Send via Resend REST API
  const emailRes = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${resendKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: `Remto <${fromEmail}>`,
      to: [email],
      subject: `${senderName} invited you to join their household on Remto`,
      html: `
        <p>Hi there!</p>
        <p><strong>${senderName}</strong> has invited you to share their pantry on <strong>Remto</strong>.</p>
        <p>Click the link below to join their household:</p>
        <p><a href="${inviteLink}" style="background:#16a34a;color:#fff;padding:10px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Join Household</a></p>
        <p>Or enter this code manually in the app: <strong style="font-size:20px;letter-spacing:2px;">${inviteCode}</strong></p>
        <p style="color:#888;font-size:12px;">This invite expires in 7 days. If you did not expect this email, you can safely ignore it.</p>
      `,
    }),
  })

  if (!emailRes.ok) {
    const errBody = await emailRes.text()
    return NextResponse.json(
      { error: `Failed to send email: ${errBody}` },
      { status: 502 }
    )
  }

  return NextResponse.json({ success: true, invite_code: inviteCode })
}

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardView } from "@/components/dashboard/DashboardView"

export default async function HomePage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/login")

  const userName =
    (session.user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    session.user.email?.split("@")[0] ||
    ""

  const { data: memberRecord } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", session.user.id)
    .single()

  return (
    <DashboardView
      userId={session.user.id}
      householdId={memberRecord?.household_id ?? null}
      userName={userName}
    />
  )
}

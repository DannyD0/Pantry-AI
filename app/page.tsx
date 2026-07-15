import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { DashboardView } from "@/components/dashboard/DashboardView"

export default async function HomePage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/login")

  const { data: memberRecord } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", session.user.id)
    .single()

  const householdId = memberRecord?.household_id ?? null

  if (!session.user.user_metadata?.onboarding_complete) {
    const { count } = householdId
      ? await supabase
          .from("inventory")
          .select("*", { count: "exact", head: true })
          .eq("household_id", householdId)
      : { count: 0 }

    if (count && count > 0) {
      await supabase.auth.updateUser({ data: { onboarding_complete: true } })
    } else {
      redirect("/onboarding")
    }
  }

  const userName =
    (session.user.user_metadata?.full_name as string | undefined)?.split(" ")[0] ||
    session.user.email?.split("@")[0] ||
    ""

  return (
    <DashboardView
      userId={session.user.id}
      householdId={householdId}
      userName={userName}
    />
  )
}

import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ShoppingView } from "@/components/shopping/ShoppingView"

export default async function ShoppingPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect("/login")

  const { data: memberRecord } = await supabase
    .from("household_members")
    .select("household_id")
    .eq("user_id", session.user.id)
    .single()

  return (
    <ShoppingView
      userId={session.user.id}
      householdId={memberRecord?.household_id ?? null}
    />
  )
}

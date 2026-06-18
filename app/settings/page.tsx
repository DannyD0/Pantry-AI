import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { SettingsView } from "@/components/settings/SettingsView"

export default async function SettingsPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/login")

  const userName = (session.user.user_metadata?.full_name as string | undefined) ?? ""

  return (
    <SettingsView
      userEmail={session.user.email ?? ""}
      userName={userName}
    />
  )
}

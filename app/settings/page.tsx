import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { SettingsView } from "@/components/settings/SettingsView"

export default async function SettingsPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/login")

  return <SettingsView userEmail={session.user.email ?? ""} />
}

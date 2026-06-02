import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ScanView } from "@/components/scan/ScanView"

export default async function ScanPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect("/login")

  return <ScanView userId={session.user.id} />
}

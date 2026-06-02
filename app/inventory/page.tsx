import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { InventoryView } from "@/components/inventory/InventoryView"

export default async function InventoryPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect("/login")

  return <InventoryView userId={session.user.id} />
}

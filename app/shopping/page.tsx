import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { ShoppingView } from "@/components/shopping/ShoppingView"

export default async function ShoppingPage() {
  const supabase = createServerClient()
  const { data: { session } } = await supabase.auth.getSession()

  if (!session) redirect("/login")

  return <ShoppingView userId={session.user.id} />
}

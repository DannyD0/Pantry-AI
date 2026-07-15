import { redirect } from "next/navigation"
import { createServerClient } from "@/lib/supabase/server"
import { OnboardingFlow } from "@/components/onboarding/OnboardingFlow"

export default async function OnboardingPage() {
  const supabase = createServerClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session) redirect("/login")
  if (session.user.user_metadata?.onboarding_complete) redirect("/")

  const prefillName = (session.user.user_metadata?.full_name as string | undefined) ?? ""

  return <OnboardingFlow prefillName={prefillName} />
}

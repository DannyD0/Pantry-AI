import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 py-8">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-4">Privacy Policy</h1>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">Mento</strong> is operated by Semad Tech.
          We are committed to protecting your privacy.
        </p>
        <p>
          We collect only the data you provide — your email address, name, and pantry inventory
          items. This data is stored securely in Supabase and is never sold or shared with third
          parties.
        </p>
        <p>
          Your data is associated with your account and protected by row-level security policies.
          Only you can view or modify your data.
        </p>
        <p>
          You may export or permanently delete all your data at any time from the Settings page.
        </p>
        <p className="text-xs text-muted-foreground/60 pt-4">
          Last updated: June 2026 · Semad Tech
        </p>
      </div>
    </div>
  )
}

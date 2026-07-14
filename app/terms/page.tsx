import Link from "next/link"
import { ArrowLeft } from "lucide-react"

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background max-w-lg mx-auto px-4 py-8">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Settings
      </Link>
      <h1 className="text-2xl font-bold tracking-tight mb-4">Terms of Service</h1>
      <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
        <p>
          By using <strong className="text-foreground">Mento</strong>, you agree to these
          terms. The app is provided as-is by Semad Tech for personal pantry management use.
        </p>
        <p>
          You are responsible for maintaining the security of your account credentials. Do not
          share your login details with others.
        </p>
        <p>
          We reserve the right to suspend accounts that misuse the service. We are not liable for
          any loss of data or indirect damages arising from use of the app.
        </p>
        <p>
          These terms may be updated periodically. Continued use of the app constitutes acceptance
          of any changes.
        </p>
        <p className="text-xs text-muted-foreground/60 pt-4">
          Last updated: June 2026 · Semad Tech
        </p>
      </div>
    </div>
  )
}

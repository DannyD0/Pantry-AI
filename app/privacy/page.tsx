import Link from "next/link"
import { ArrowLeft } from "lucide-react"

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className="text-sm font-semibold text-foreground">{children}</h2>
}

function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-medium text-foreground mt-3">{children}</p>
}

function List({ items }: { items: React.ReactNode[] }) {
  return (
    <ul className="list-disc pl-5 space-y-1 text-sm text-muted-foreground leading-relaxed">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  )
}

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

      <h1 className="text-2xl font-bold tracking-tight mb-1">Privacy Policy</h1>
      <p className="text-xs text-muted-foreground mb-6">
        Effective Date: July 15, 2026 · Last Updated: July 15, 2026 · Semad Tech
      </p>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>
          <strong className="text-foreground">Mento</strong> is a smart pantry tracking app built
          by Semad Tech. We take your privacy seriously. This Privacy Policy explains what data we
          collect, how we use it, how we protect it, and your rights over it.
        </p>
        <p>By using Mento, you agree to the practices described in this policy.</p>

        <section className="space-y-2">
          <SectionHeading>1. What Data We Collect</SectionHeading>

          <SubHeading>Account Information</SubHeading>
          <List
            items={[
              "Your name (optional, used for personalization)",
              "Your email address (used to create and access your account)",
              "Your password (stored encrypted, never readable by us)",
            ]}
          />

          <SubHeading>Pantry Data</SubHeading>
          <List
            items={[
              "Item names, brands, categories, quantities, units",
              "Usage frequency settings",
              "Expiry dates",
              "Predicted depletion dates and depletion history",
              "Photos you upload for AI item identification (processed and discarded, not stored permanently)",
              "Barcodes scanned during item entry",
            ]}
          />

          <SubHeading>Household Data</SubHeading>
          <List
            items={[
              "Household size setting",
              "Names and email addresses of household members you invite",
              "Invite codes you generate or redeem",
            ]}
          />

          <SubHeading>App Usage Data</SubHeading>
          <List
            items={[
              "Your preferences (units, color theme, notification settings)",
              "When items were added, updated, or deleted (timestamps)",
            ]}
          />

          <SubHeading>We do NOT collect</SubHeading>
          <List
            items={[
              "Your location",
              "Your contacts",
              "Payment information (Mento is currently free)",
              "Any data from your device beyond what you explicitly enter",
            ]}
          />
        </section>

        <section className="space-y-2">
          <SectionHeading>2. How We Use Your Data</SectionHeading>
          <p>We use your data only to provide and improve the Mento app:</p>
          <List
            items={[
              "To authenticate you and keep your account secure",
              "To display and manage your personal pantry inventory",
              "To calculate depletion predictions and send relevant reminders",
              "To generate and sync your shopping list",
              "To enable household sharing with people you invite",
              "To personalize your experience (your name in the dashboard greeting)",
              "To improve prediction accuracy over time using your depletion history",
            ]}
          />
          <SubHeading>We do NOT</SubHeading>
          <List
            items={[
              "Sell your data to anyone",
              "Use your data for advertising",
              "Share your data with third parties except as described in Section 4",
            ]}
          />
        </section>

        <section className="space-y-2">
          <SectionHeading>3. AI and Third-Party Processing</SectionHeading>

          <SubHeading>Claude Vision API (Anthropic)</SubHeading>
          <p>
            When you upload a photo to identify a grocery item, that image is sent to Anthropic&apos;s
            Claude Vision API for processing. The image is used only to identify the item and is not
            stored by Semad Tech after the response is received. Anthropic&apos;s own privacy policy
            governs how they handle data sent to their API. You can review it at
            anthropic.com/privacy.
          </p>

          <SubHeading>Open Food Facts</SubHeading>
          <p>
            When you scan a barcode, the barcode number is sent to the Open Food Facts API to
            retrieve product information. Open Food Facts is a free, open database. No personal
            information is sent with barcode lookups.
          </p>
        </section>

        <section className="space-y-2">
          <SectionHeading>4. Who We Share Your Data With</SectionHeading>
          <p>We share your data only in these limited circumstances:</p>

          <SubHeading>Household Members</SubHeading>
          <p>
            If you join or create a shared household, all members of that household can see and
            edit your shared pantry and shopping list data. You control who is in your household.
            You can leave a household at any time from your Profile settings.
          </p>

          <SubHeading>Service Providers</SubHeading>
          <List
            items={[
              "Supabase: our database and authentication provider, stores your data securely in the United States (us-east-1, North Virginia)",
              "Vercel: our hosting provider, serves the Mento app globally",
              "Resend: our email provider, used only to send account and invite emails",
              "Anthropic: processes photos you upload for item identification only",
            ]}
          />
          <p>We do not share your data with anyone else.</p>

          <SubHeading>Legal Requirements</SubHeading>
          <p>
            We may disclose your data if required by law or to protect the rights and safety of
            Semad Tech or our users.
          </p>
        </section>

        <section className="space-y-2">
          <SectionHeading>5. How We Store and Protect Your Data</SectionHeading>
          <List
            items={[
              "All data is stored in Supabase's PostgreSQL database in the US",
              "All connections are encrypted via HTTPS",
              "Passwords are hashed using bcrypt and never stored in plain text",
              "Row Level Security (RLS) ensures you can only access your own data, or your household's shared data if you are a member",
              "API keys are stored as environment variables, never in the app code",
              "We do not store photos you upload, they are processed and discarded",
            ]}
          />
        </section>

        <section className="space-y-2">
          <SectionHeading>6. Your Rights</SectionHeading>
          <p>You have the following rights over your data:</p>

          <SubHeading>Download your data</SubHeading>
          <p>
            Go to Profile, find &quot;Download my data&quot; under Privacy &amp; Data. This exports
            your full inventory and shopping list as a JSON file.
          </p>

          <SubHeading>Delete your account</SubHeading>
          <p>
            Go to Profile, find &quot;Delete account&quot; under Privacy &amp; Data. This
            permanently deletes your account and all associated data. This action cannot be undone.
          </p>

          <SubHeading>Update your information</SubHeading>
          <p>You can update your name and password at any time from your Profile page.</p>

          <SubHeading>Leave a household</SubHeading>
          <p>
            You can leave a shared household at any time from your Profile settings. Your personal
            data remains yours.
          </p>
        </section>

        <section className="space-y-2">
          <SectionHeading>7. Data Retention</SectionHeading>
          <p>
            We retain your data for as long as your account is active. If you delete your account,
            all your data is permanently deleted within 30 days. Anonymized, aggregated data (e.g.
            total number of app users) may be retained indefinitely but cannot be traced back to
            you.
          </p>
        </section>

        <section className="space-y-2">
          <SectionHeading>8. Children&apos;s Privacy</SectionHeading>
          <p>
            Mento is not directed at children under 13. We do not knowingly collect personal
            information from children under 13. If you believe a child has provided us with their
            information, please contact us and we will delete it promptly.
          </p>
        </section>

        <section className="space-y-2">
          <SectionHeading>9. Changes to This Policy</SectionHeading>
          <p>
            We may update this Privacy Policy from time to time. When we do, we will update the
            &quot;Last Updated&quot; date at the top of this page. For significant changes, we will
            notify users via email or an in-app notice. Continued use of Mento after changes
            constitutes acceptance of the updated policy.
          </p>
        </section>

        <section className="space-y-2">
          <SectionHeading>10. Contact Us</SectionHeading>
          <p>If you have questions about this Privacy Policy or your data, contact Semad Tech at:</p>
          <p>
            Email: privacy@semadtech.com
            <br />
            Website: semadtech.com
          </p>
        </section>

        <p className="text-xs text-muted-foreground/60 pt-4">
          Last updated: July 15, 2026 · Semad Tech
        </p>
      </div>
    </div>
  )
}

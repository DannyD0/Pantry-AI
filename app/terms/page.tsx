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

      <h1 className="text-2xl font-bold tracking-tight mb-1">Terms of Service</h1>
      <p className="text-xs text-muted-foreground mb-6">
        Effective Date: July 15, 2026 · Last Updated: July 15, 2026 · Semad Tech
      </p>

      <div className="space-y-6 text-sm text-muted-foreground leading-relaxed">
        <p>
          These Terms of Service govern your use of <strong className="text-foreground">Remto</strong>,
          a smart pantry tracking app built by Semad Tech. By creating an account or using Remto,
          you agree to these terms. Please read them carefully.
        </p>
        <p>If you do not agree to these terms, do not use Remto.</p>

        <section className="space-y-2">
          <SectionHeading>1. Who Can Use Remto</SectionHeading>
          <p>
            You must be at least 13 years old to use Remto. By using the app, you confirm that you
            meet this requirement.
          </p>
          <p>
            You must provide accurate information when creating your account. You are responsible
            for keeping your account credentials secure. You are responsible for all activity that
            occurs under your account.
          </p>
        </section>

        <section className="space-y-2">
          <SectionHeading>2. What Remto Is and Is Not</SectionHeading>
          <p>
            Remto is a personal pantry inventory and prediction tool. It helps you track what you
            have at home, estimate when you might run out, and manage your shopping list.
          </p>
          <SubHeading>Remto is NOT</SubHeading>
          <List
            items={[
              "A food safety tool. Do not rely on Remto's expiry date tracking as the sole basis for food safety decisions. Always use your own judgment when assessing whether food is safe to consume.",
              "A nutritional or dietary advice tool.",
              "A guarantee of accuracy. Depletion predictions are estimates based on your usage patterns. Actual results will vary.",
            ]}
          />
        </section>

        <section className="space-y-2">
          <SectionHeading>3. Your Account</SectionHeading>
          <p>You are responsible for:</p>
          <List
            items={[
              "Keeping your password confidential",
              "All activity that occurs under your account",
              "Notifying us immediately if you suspect unauthorized access",
            ]}
          />
          <p>We reserve the right to suspend or terminate accounts that violate these terms.</p>
        </section>

        <section className="space-y-2">
          <SectionHeading>4. Household Sharing</SectionHeading>
          <p>
            Remto allows you to share your pantry with household members. By inviting someone to
            your household:
          </p>
          <List
            items={[
              "You grant them full access to view and edit your shared pantry and shopping list",
              "You confirm you have their consent to share data with them",
              "You understand that all household members have equal permissions",
            ]}
          />
          <p>
            You can remove members or leave a household at any time from your Profile settings.
            When you leave a household, you will no longer have access to that household&apos;s
            shared data.
          </p>
        </section>

        <section className="space-y-2">
          <SectionHeading>5. Acceptable Use</SectionHeading>
          <p>You agree NOT to:</p>
          <List
            items={[
              "Use Remto for any unlawful purpose",
              "Attempt to gain unauthorized access to other users' data",
              "Reverse engineer, copy, or distribute any part of the Remto app",
              "Use Remto to transmit spam, malware, or harmful content",
              "Impersonate another person or entity",
              "Attempt to overload or disrupt Remto's servers or infrastructure",
            ]}
          />
        </section>

        <section className="space-y-2">
          <SectionHeading>6. AI Features</SectionHeading>
          <p>
            Remto uses artificial intelligence to identify grocery items from photos you upload. By
            using this feature:
          </p>
          <List
            items={[
              "You consent to your photo being sent to Anthropic's Claude Vision API for processing",
              "You understand that AI identification is not always accurate and you should verify results before saving",
              "You will not upload photos containing personal, sensitive, or inappropriate content",
            ]}
          />
        </section>

        <section className="space-y-2">
          <SectionHeading>7. Intellectual Property</SectionHeading>
          <p>
            Remto and all its content, features, and functionality are owned by Semad Tech. You may
            not copy, modify, distribute, or create derivative works based on Remto without our
            explicit written permission.
          </p>
          <p>
            Your data (your pantry items, shopping lists, etc.) belongs to you. We do not claim
            ownership over content you create within the app.
          </p>
        </section>

        <section className="space-y-2">
          <SectionHeading>8. Limitation of Liability</SectionHeading>
          <p>Remto is provided &quot;as is&quot; without warranties of any kind. Semad Tech is not liable for:</p>
          <List
            items={[
              "Inaccurate depletion predictions or shopping recommendations",
              "Food spoilage or waste resulting from reliance on app predictions",
              "Loss of data due to technical failures",
              "Any indirect, incidental, or consequential damages arising from your use of Remto",
            ]}
          />
          <p>
            To the maximum extent permitted by law, Semad Tech&apos;s total liability to you for any
            claims arising from your use of Remto shall not exceed the amount you paid to use the
            app in the past 12 months. Since Remto is currently free, this limit is $0.
          </p>
        </section>

        <section className="space-y-2">
          <SectionHeading>9. Termination</SectionHeading>
          <p>You may stop using Remto and delete your account at any time from your Profile settings.</p>
          <p>
            We may suspend or terminate your access to Remto at any time, with or without notice,
            if we believe you have violated these terms or for any other reason at our discretion.
          </p>
          <p>
            Upon termination, your right to use Remto ends immediately. We will delete your data in
            accordance with our Privacy Policy.
          </p>
        </section>

        <section className="space-y-2">
          <SectionHeading>10. Changes to These Terms</SectionHeading>
          <p>
            We may update these Terms of Service from time to time. When we do, we will update the
            &quot;Last Updated&quot; date at the top of this page. For significant changes, we will
            notify users via email or an in-app notice at least 14 days before the changes take
            effect.
          </p>
          <p>Continued use of Remto after changes constitutes acceptance of the updated terms.</p>
        </section>

        <section className="space-y-2">
          <SectionHeading>11. Governing Law</SectionHeading>
          <p>
            These terms are governed by the laws of the State of Texas, United States, without
            regard to its conflict of law provisions. Any disputes arising from these terms shall
            be resolved in the courts of Texas.
          </p>
        </section>

        <section className="space-y-2">
          <SectionHeading>12. Contact Us</SectionHeading>
          <p>If you have questions about these Terms of Service, contact Semad Tech:</p>
          <p>
            Email: legal@semadtech.com
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

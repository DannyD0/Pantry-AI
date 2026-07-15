"use client"

import { useState, useTransition } from "react"
import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { usePreferences } from "@/hooks/usePreferences"
import { useToast } from "@/hooks/useToast"
import { signOut } from "@/app/login/actions"
import { updateProfile, changePassword, deleteAccount, downloadUserData } from "@/app/settings/actions"
import {
  LogOut,
  User,
  Ruler,
  Bell,
  Shield,
  HelpCircle,
  Download,
  Trash2,
  ChevronDown,
  Sun,
  Moon,
  Monitor,
  Lock,
  ExternalLink,
  Users,
} from "lucide-react"
import { HouseholdSection } from "@/components/household/HouseholdSection"
import type { UnitPref, ThemePref } from "@/hooks/usePreferences"

const UNITS: { value: UnitPref; label: string }[] = [
  { value: "oz", label: "oz — ounces" },
  { value: "g", label: "g — grams" },
  { value: "lbs", label: "lbs — pounds" },
]

const THEMES: { value: ThemePref; label: string; icon: React.ElementType }[] = [
  { value: "system", label: "System", icon: Monitor },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
]

interface SettingsViewProps {
  userEmail: string
  userName: string
}

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      <Icon className="h-3.5 w-3.5" />
      {label}
    </h2>
  )
}

function Toggle({ on, onToggle }: { on: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className={`w-10 h-6 rounded-full transition-colors shrink-0 relative ${on ? "bg-primary" : "bg-secondary border border-border"}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-1"}`}
      />
    </button>
  )
}

export function SettingsView({ userEmail, userName }: SettingsViewProps) {
  const { prefs, save, loaded } = usePreferences()
  const { toast } = useToast()
  const [isPending, startTransition] = useTransition()

  // Account section state
  const [displayName, setDisplayName] = useState(userName)
  const [nameSaving, setNameSaving] = useState(false)

  // Change password state
  const [showPwForm, setShowPwForm] = useState(false)
  const [currentPw, setCurrentPw] = useState("")
  const [newPw, setNewPw] = useState("")
  const [confirmPw, setConfirmPw] = useState("")
  const [pwSaving, setPwSaving] = useState(false)

  // Delete account dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [deleteInput, setDeleteInput] = useState("")
  const [deleting, setDeleting] = useState(false)

  // ─── Handlers ───────────────────────────────────────────────────────────────

  async function handleSaveName() {
    if (!displayName.trim()) return
    setNameSaving(true)
    const res = await updateProfile(displayName.trim())
    setNameSaving(false)
    if (res.error) toast(`❌ ${res.error}`)
    else toast("✅ Name updated")
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    if (newPw !== confirmPw) { toast("❌ Passwords don't match"); return }
    setPwSaving(true)
    const res = await changePassword(currentPw, newPw)
    setPwSaving(false)
    if (res.error) {
      toast(`❌ ${res.error}`)
    } else {
      toast("✅ Password updated")
      setCurrentPw(""); setNewPw(""); setConfirmPw("")
      setShowPwForm(false)
    }
  }

  function handleUnitChange(unit: UnitPref) {
    save({ unit })
    toast("✅ Preferences saved")
  }

  function handleThemeChange(theme: ThemePref) {
    save({ theme })
    // Apply immediately — ThemeProvider will pick it up on next render, but
    // we also update the class directly so there's no delay.
    const html = document.documentElement
    if (theme === "dark") {
      html.classList.add("dark"); html.classList.remove("light")
    } else if (theme === "light") {
      html.classList.remove("dark"); html.classList.add("light")
    } else {
      const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches
      if (isDark) { html.classList.add("dark"); html.classList.remove("light") }
      else { html.classList.remove("dark"); html.classList.add("light") }
    }
  }

  function handleNotifToggle() {
    save({ notifications_on: !prefs.notifications_on })
  }

  async function handleDownload() {
    const res = await downloadUserData()
    if (res.error || !res.data) { toast("❌ Failed to export data"); return }
    const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `remto-export-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
    toast("✅ Data exported")
  }

  async function handleDeleteAccount() {
    if (deleteInput !== "DELETE") return
    setDeleting(true)
    await deleteAccount()
    // deleteAccount redirects on success; if we reach here there was an error
    setDeleting(false)
    toast("❌ Failed to delete account")
    setShowDeleteConfirm(false)
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border pt-safe">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight">Profile</h1>
        </div>
      </header>

      <main className="px-4 py-5 pb-nav space-y-7 max-w-lg mx-auto">

        {/* ── Account ─────────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <SectionHeader icon={User} label="Account" />

          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {/* Name */}
            <div className="px-4 py-3.5 space-y-2">
              <Label className="text-xs text-muted-foreground">Name</Label>
              <div className="flex gap-2">
                <Input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your name"
                  className="h-9 text-sm bg-background"
                  maxLength={80}
                />
                <Button
                  size="sm"
                  className="h-9 px-3 shrink-0"
                  onClick={handleSaveName}
                  disabled={nameSaving || !displayName.trim() || displayName.trim() === userName}
                >
                  {nameSaving ? "Saving…" : "Save"}
                </Button>
              </div>
            </div>

            {/* Email */}
            <div className="px-4 py-3.5">
              <p className="text-xs text-muted-foreground mb-0.5">Email</p>
              <p className="text-sm font-medium text-foreground">{userEmail}</p>
            </div>

            {/* Change password */}
            <div>
              <button
                type="button"
                onClick={() => setShowPwForm((v) => !v)}
                className="w-full flex items-center justify-between px-4 py-3.5 text-sm hover:bg-secondary/40 transition-colors"
              >
                <span className="flex items-center gap-2 font-medium">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Change Password
                </span>
                <ChevronDown
                  className={`h-4 w-4 text-muted-foreground transition-transform ${showPwForm ? "rotate-180" : ""}`}
                />
              </button>

              {showPwForm && (
                <form onSubmit={handleChangePassword} className="px-4 pb-4 space-y-2.5 border-t border-border pt-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Current password</Label>
                    <Input
                      type="password"
                      value={currentPw}
                      onChange={(e) => setCurrentPw(e.target.value)}
                      autoComplete="current-password"
                      className="h-9 text-sm bg-background"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">New password</Label>
                    <Input
                      type="password"
                      value={newPw}
                      onChange={(e) => setNewPw(e.target.value)}
                      autoComplete="new-password"
                      className="h-9 text-sm bg-background"
                      minLength={8}
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Confirm new password</Label>
                    <Input
                      type="password"
                      value={confirmPw}
                      onChange={(e) => setConfirmPw(e.target.value)}
                      autoComplete="new-password"
                      className="h-9 text-sm bg-background"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    size="sm"
                    className="w-full h-9 mt-1"
                    disabled={pwSaving || !currentPw || !newPw || !confirmPw}
                  >
                    {pwSaving ? "Updating…" : "Update Password"}
                  </Button>
                </form>
              )}
            </div>
          </div>
        </section>

        {/* ── Household ───────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <SectionHeader icon={Users} label="Household" />
          <HouseholdSection />
        </section>

        {/* ── Preferences ─────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <SectionHeader icon={Ruler} label="Preferences" />

          {/* Units */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {UNITS.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleUnitChange(value)}
                disabled={!loaded}
                className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-left hover:bg-secondary/40 transition-colors"
              >
                <span className={prefs.unit === value ? "font-semibold text-primary" : "text-foreground"}>
                  {label}
                </span>
                {prefs.unit === value && (
                  <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Theme */}
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            <div className="flex divide-x divide-border">
              {THEMES.map(({ value, label, icon: Icon }) => {
                const active = prefs.theme === value
                return (
                  <button
                    key={value}
                    onClick={() => handleThemeChange(value)}
                    disabled={!loaded}
                    className={`flex-1 flex flex-col items-center justify-center gap-1 py-3 text-xs font-medium transition-colors ${
                      active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/40"
                    }`}
                  >
                    <Icon className="h-4 w-4" strokeWidth={active ? 2.5 : 1.75} />
                    {label}
                  </button>
                )
              })}
            </div>
          </div>
        </section>

        {/* ── Notifications ────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <SectionHeader icon={Bell} label="Notifications" />
          <div className="bg-card border border-border rounded-2xl">
            <button
              type="button"
              onClick={handleNotifToggle}
              disabled={!loaded}
              className="w-full flex items-center justify-between px-4 py-3.5 text-sm hover:bg-secondary/40 transition-colors"
            >
              <div>
                <p className="font-medium text-left">Check-in reminders</p>
                <p className="text-xs text-muted-foreground mt-0.5 text-left">
                  Show low-stock and expiry alerts on the dashboard
                </p>
              </div>
              <Toggle on={prefs.notifications_on} onToggle={handleNotifToggle} />
            </button>
          </div>
        </section>

        {/* ── Privacy & Data ───────────────────────────────────────────────── */}
        <section className="space-y-3">
          <SectionHeader icon={Shield} label="Privacy & Data" />
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            <button
              type="button"
              onClick={handleDownload}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-secondary/40 transition-colors text-left"
            >
              <Download className="h-4 w-4 text-muted-foreground shrink-0" />
              <span className="font-medium">Download my data</span>
            </button>
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-destructive/10 transition-colors text-left text-destructive"
            >
              <Trash2 className="h-4 w-4 shrink-0" />
              <span className="font-medium">Delete account</span>
            </button>
          </div>
        </section>

        {/* Delete confirm dialog */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4">
            <div className="bg-background border border-border rounded-2xl p-5 w-full max-w-sm space-y-4 shadow-xl">
              <div className="space-y-1">
                <h3 className="font-bold text-base text-destructive">Delete account?</h3>
                <p className="text-sm text-muted-foreground">
                  This permanently deletes your account and all data. This cannot be undone.
                </p>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Type DELETE to confirm</Label>
                <Input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="h-9 text-sm bg-background font-mono"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setShowDeleteConfirm(false); setDeleteInput("") }}
                  disabled={deleting}
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  className="flex-1"
                  onClick={handleDeleteAccount}
                  disabled={deleteInput !== "DELETE" || deleting}
                >
                  {deleting ? "Deleting…" : "Delete"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── Support & Legal ──────────────────────────────────────────────── */}
        <section className="space-y-3">
          <SectionHeader icon={HelpCircle} label="Support & Legal" />
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {[
              { label: "Help & Contact", href: "mailto:support@semadtech.com" },
              { label: "Privacy Policy", href: "/privacy" },
              { label: "Terms of Service", href: "/terms" },
            ].map(({ label, href }) => (
              <a
                key={label}
                href={href}
                className="flex items-center justify-between px-4 py-3.5 text-sm hover:bg-secondary/40 transition-colors"
              >
                <span>{label}</span>
                <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
              </a>
            ))}
            <div className="px-4 py-3.5 flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Version</span>
              <span className="text-muted-foreground font-mono text-xs">0.1.0</span>
            </div>
          </div>
        </section>

        {/* ── Sign Out ─────────────────────────────────────────────────────── */}
        <section>
          <form action={signOut}>
            <Button
              type="submit"
              variant="outline"
              className="w-full h-12 gap-2 text-sm border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </form>
        </section>

        <p className="text-center text-xs text-muted-foreground/40 pb-2">Remto · Semad Tech</p>
      </main>

      <BottomNav />
    </div>
  )
}

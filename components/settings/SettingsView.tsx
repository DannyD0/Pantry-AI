"use client"

import { BottomNav } from "@/components/layout/BottomNav"
import { Button } from "@/components/ui/button"
import { usePreferences } from "@/hooks/usePreferences"
import { useToast } from "@/hooks/useToast"
import { signOut } from "@/app/login/actions"
import { LogOut, User, Ruler, Bell } from "lucide-react"
import type { UnitPref } from "@/hooks/usePreferences"

const UNITS: { value: UnitPref; label: string }[] = [
  { value: "oz", label: "oz — ounces" },
  { value: "g", label: "g — grams" },
  { value: "lbs", label: "lbs — pounds" },
]

interface SettingsViewProps {
  userEmail: string
}

export function SettingsView({ userEmail }: SettingsViewProps) {
  const { prefs, save, loaded } = usePreferences()
  const { toast } = useToast()

  function handleUnitChange(unit: UnitPref) {
    save({ unit })
    toast("✅ Preferences saved")
  }

  function handleNotifToggle(key: "notify_high" | "notify_medium" | "notify_low") {
    save({ [key]: !prefs[key] })
    toast("✅ Preferences saved")
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border pt-safe">
        <div className="px-4 py-3">
          <h1 className="text-lg font-bold tracking-tight">Settings</h1>
        </div>
      </header>

      <main className="px-4 py-5 pb-nav space-y-6 max-w-lg mx-auto">
        {/* Profile */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <User className="h-3.5 w-3.5" />
            Profile
          </h2>
          <div className="bg-card border border-border rounded-2xl px-4 py-3.5">
            <p className="text-xs text-muted-foreground mb-0.5">Email</p>
            <p className="text-sm font-medium">{userEmail}</p>
          </div>
        </section>

        {/* Units */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Ruler className="h-3.5 w-3.5" />
            Default Unit
          </h2>
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
        </section>

        {/* Notifications */}
        <section className="space-y-3">
          <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Bell className="h-3.5 w-3.5" />
            Check-in Notifications
          </h2>
          <p className="text-xs text-muted-foreground -mt-1">
            Control which priority tiers show check-in cards on the dashboard.
          </p>
          <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
            {(
              [
                { key: "notify_high", label: "High priority", desc: "Dairy, fresh produce, meat", color: "text-orange-400" },
                { key: "notify_medium", label: "Medium priority", desc: "Protein, deli items", color: "text-yellow-400" },
                { key: "notify_low", label: "Low priority", desc: "Grains, pantry staples", color: "text-muted-foreground" },
              ] as const
            ).map(({ key, label, desc, color }) => (
              <button
                key={key}
                onClick={() => handleNotifToggle(key)}
                disabled={!loaded}
                className="w-full flex items-center justify-between px-4 py-3.5 text-sm text-left hover:bg-secondary/40 transition-colors"
              >
                <div>
                  <p className={`font-medium ${color}`}>{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <div
                  className={`w-10 h-6 rounded-full transition-colors shrink-0 ${
                    prefs[key] ? "bg-primary" : "bg-secondary"
                  } relative`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                      prefs[key] ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* Logout */}
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

        <p className="text-center text-xs text-muted-foreground/40 pb-2">Pantry AI · Semad Tech</p>
      </main>

      <BottomNav />
    </div>
  )
}

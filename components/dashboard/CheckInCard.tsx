"use client"

import { useState } from "react"
import { Bell, ChevronLeft, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { InventoryItem } from "@/lib/supabase/types"

type Step = "question" | "time_correction" | "fraction"

interface CheckInCardProps {
  item: InventoryItem
  onConfirmEmpty: (itemId: string, timeDeltaDays: number) => Promise<{ error?: string }>
  onConfirmStillHave: (itemId: string, remainingFraction: number) => Promise<{ error?: string }>
  onSnooze: (itemId: string) => Promise<void>
}

const TIME_DELTAS = [
  { label: "Just Now", days: 0 },
  { label: "Yesterday", days: 1 },
  { label: "A few days ago", days: 3 },
]

const FRACTION_CHIPS = [
  { label: "75% left", value: 0.75 },
  { label: "50% left", value: 0.5 },
  { label: "25% left", value: 0.25 },
  { label: "10% left", value: 0.1 },
]

export function CheckInCard({
  item,
  onConfirmEmpty,
  onConfirmStillHave,
  onSnooze,
}: CheckInCardProps) {
  const [step, setStep] = useState<Step>("question")
  const [busy, setBusy] = useState(false)

  async function handleEmpty(timeDeltaDays: number) {
    setBusy(true)
    await onConfirmEmpty(item.id, timeDeltaDays)
    setBusy(false)
  }

  async function handleFraction(fraction: number) {
    setBusy(true)
    await onConfirmStillHave(item.id, fraction)
    setBusy(false)
  }

  async function handleSnooze() {
    setBusy(true)
    await onSnooze(item.id)
    setBusy(false)
  }

  return (
    <div className="bg-card border border-primary/30 rounded-2xl p-4 space-y-3">
      {step === "question" && (
        <>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Bell className="h-3.5 w-3.5 text-primary" />
              <span className="text-[11px] font-semibold text-primary uppercase tracking-wider">
                Check-in
              </span>
            </div>
            <button
              onClick={handleSnooze}
              disabled={busy}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            >
              Not now
            </button>
          </div>

          <p className="text-sm font-medium leading-snug">
            Are you out of{" "}
            <span className="text-foreground font-semibold">{item.item_name}</span>?
          </p>

          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 h-9 text-xs"
              onClick={() => setStep("time_correction")}
              disabled={busy}
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Yes, I'm out"}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1 h-9 text-xs"
              onClick={() => setStep("fraction")}
              disabled={busy}
            >
              Still have some
            </Button>
          </div>
        </>
      )}

      {step === "time_correction" && (
        <>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep("question")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium">
              When did{" "}
              <span className="font-semibold">{item.item_name}</span> run out?
            </p>
          </div>

          <div className="flex gap-2">
            {TIME_DELTAS.map(({ label, days }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                className="flex-1 h-9 text-xs"
                onClick={() => handleEmpty(days)}
                disabled={busy}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : label}
              </Button>
            ))}
          </div>
        </>
      )}

      {step === "fraction" && (
        <>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStep("question")}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-medium">
              How much{" "}
              <span className="font-semibold">{item.item_name}</span> is left?
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {FRACTION_CHIPS.map(({ label, value }) => (
              <Button
                key={label}
                variant="outline"
                size="sm"
                className="h-9 text-xs"
                onClick={() => handleFraction(value)}
                disabled={busy}
              >
                {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : label}
              </Button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

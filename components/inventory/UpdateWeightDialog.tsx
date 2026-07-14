"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { FuelGauge } from "./FuelGauge"
import { applySliderUpdate, getStockPercent } from "@/lib/logic/depletion"
import type { InventoryItem } from "@/lib/supabase/types"

interface UpdateWeightDialogProps {
  item: InventoryItem
  open: boolean
  onOpenChange: (open: boolean) => void
  onUpdate: (itemId: string, newWeight: number) => Promise<{ error?: string; success?: boolean }>
  restockMode?: boolean
}

type EntryMode = "exact" | "percentage"

export function UpdateWeightDialog({
  item,
  open,
  onOpenChange,
  onUpdate,
  restockMode = false,
}: UpdateWeightDialogProps) {
  const currentPct = restockMode ? 100 : getStockPercent(item.current_weight, item.original_weight)
  const [mode, setMode] = useState<EntryMode>("exact")
  const [remainingPct, setRemainingPct] = useState(currentPct)
  const [amountUsed, setAmountUsed] = useState("")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const useExactMode = mode === "exact" && !restockMode

  const parsedAmount = parseFloat(amountUsed)
  const amountValid = amountUsed.trim() !== "" && !isNaN(parsedAmount) && parsedAmount >= 0
  const exceedsStock = amountValid && parsedAmount > item.current_weight

  const previewWeight = useExactMode
    ? amountValid && !exceedsStock
      ? item.current_weight - parsedAmount
      : item.current_weight
    : applySliderUpdate(item.original_weight, 100 - remainingPct)

  const previewPct = getStockPercent(previewWeight, item.original_weight)

  async function handleSave() {
    if (useExactMode) {
      if (!amountValid) {
        setError("Enter a valid amount.")
        return
      }
      if (exceedsStock) {
        setError("Amount exceeds what you have left.")
        return
      }
    }
    setSaving(true)
    setError(null)
    const result = await onUpdate(item.id, previewWeight)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      onOpenChange(false)
    }
  }

  function handleOpenChange(open: boolean) {
    if (!open) {
      setRemainingPct(restockMode ? 100 : currentPct)
      setAmountUsed("")
      setMode("exact")
      setError(null)
    }
    onOpenChange(open)
  }

  const fuelColor =
    previewPct > 50 ? "text-green-400" : previewPct > 20 ? "text-yellow-400" : "text-red-400"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {restockMode ? `Restock ${item.item_name}` : item.item_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {!restockMode && (
            <div className="flex rounded-xl border border-border overflow-hidden text-xs font-medium">
              <button
                type="button"
                onClick={() => { setMode("exact"); setError(null) }}
                className={`flex-1 py-2 transition-colors ${
                  mode === "exact" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                Enter amount used
              </button>
              <button
                type="button"
                onClick={() => { setMode("percentage"); setError(null) }}
                className={`flex-1 py-2 transition-colors ${
                  mode === "percentage" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-secondary/40"
                }`}
              >
                Estimate percentage
              </button>
            </div>
          )}

          {useExactMode ? (
            <div className="space-y-2">
              <span className="text-sm text-muted-foreground">How much did you use?</span>
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  step="any"
                  inputMode="decimal"
                  value={amountUsed}
                  onChange={(e) => { setAmountUsed(e.target.value); setError(null) }}
                  placeholder="0"
                  className="h-10 text-base bg-background"
                  autoFocus
                />
                <span className="text-sm text-muted-foreground shrink-0">{item.unit}</span>
              </div>
              {exceedsStock && (
                <p className="text-xs text-destructive">Amount exceeds what you have left.</p>
              )}
              <p className="text-xs text-muted-foreground">
                {item.current_weight} {item.unit} currently in stock
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  {restockMode ? "How full is the new container?" : "How much is left?"}
                </span>
                <span className={`text-2xl font-bold tabular-nums ${fuelColor}`}>
                  {remainingPct}%
                </span>
              </div>
              <Slider
                min={0}
                max={100}
                step={5}
                value={[remainingPct]}
                onValueChange={([v]) => setRemainingPct(v)}
                className="mt-2"
              />
            </div>
          )}

          <div className="space-y-2">
            <FuelGauge
              currentWeight={previewWeight}
              originalWeight={item.original_weight}
              showLabel={false}
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>
                {previewWeight.toFixed(1)} {item.unit} remaining
              </span>
              <span>of {item.original_weight} {item.unit}</span>
            </div>
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <DialogFooter className="gap-2">
          <Button variant="ghost" size="sm" onClick={() => handleOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={saving || (useExactMode && (!amountValid || exceedsStock))}
          >
            {saving ? "Saving…" : restockMode ? "Restock" : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

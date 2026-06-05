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

export function UpdateWeightDialog({
  item,
  open,
  onOpenChange,
  onUpdate,
  restockMode = false,
}: UpdateWeightDialogProps) {
  const currentPct = restockMode ? 100 : getStockPercent(item.current_weight, item.original_weight)
  const [remainingPct, setRemainingPct] = useState(currentPct)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const previewWeight = applySliderUpdate(item.original_weight, 100 - remainingPct)

  async function handleSave() {
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
    if (!open) setRemainingPct(restockMode ? 100 : currentPct)
    onOpenChange(open)
  }

  const fuelColor =
    remainingPct > 50 ? "text-green-400" : remainingPct > 20 ? "text-yellow-400" : "text-red-400"

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="text-base">
            {restockMode ? `Restock ${item.item_name}` : item.item_name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
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
          <Button size="sm" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : restockMode ? "Restock" : "Update"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Droplets, Clock } from "lucide-react"
import { FuelGauge } from "./FuelGauge"
import { CategoryBadge } from "./CategoryBadge"
import { UpdateWeightDialog } from "./UpdateWeightDialog"
import { getStockPercent } from "@/lib/logic/depletion"
import type { InventoryItem } from "@/lib/supabase/types"

interface InventoryCardProps {
  item: InventoryItem
  onUpdateWeight: (itemId: string, newWeight: number) => Promise<{ error?: string; success?: boolean }>
  onDelete: (itemId: string) => Promise<{ error?: string; success?: boolean }>
}

function formatDate(dateStr: string | null): string | null {
  if (!dateStr) return null
  const date = new Date(dateStr)
  const today = new Date()
  const diffDays = Math.round((date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return "Empty soon"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays <= 7) return `${diffDays} days left`
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
}

export function InventoryCard({ item, onUpdateWeight, onDelete }: InventoryCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)
  const pct = getStockPercent(item.current_weight, item.original_weight)
  const daysLabel = formatDate(item.predicted_empty_date)

  const pctColor =
    pct > 50 ? "text-green-400" : pct > 20 ? "text-yellow-400" : "text-red-400"

  const daysColor =
    !daysLabel ? "" :
    daysLabel === "Empty soon" || daysLabel === "Tomorrow" ? "text-red-400" :
    pct <= 20 ? "text-red-400" : pct <= 50 ? "text-yellow-400" : "text-muted-foreground"

  return (
    <>
      <Card className="bg-card border-border overflow-hidden">
        <CardContent className="p-4 space-y-3">
          {/* Header row */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="font-semibold text-sm leading-tight truncate">{item.item_name}</h3>
              {item.brand && (
                <p className="text-xs text-muted-foreground mt-0.5 truncate">{item.brand}</p>
              )}
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {item.category && <CategoryBadge category={item.category} />}
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                onClick={() => onDelete(item.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>

          {/* Fuel gauge */}
          <FuelGauge
            currentWeight={item.current_weight}
            originalWeight={item.original_weight}
          />

          {/* Bottom row: weight info + use button */}
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-lg font-bold tabular-nums leading-none ${pctColor}`}>
                  {pct}%
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.current_weight.toFixed(0)}{item.unit} left
                </span>
              </div>
              {daysLabel && (
                <p className={`flex items-center gap-1 text-xs font-medium ${daysColor}`}>
                  <Clock className="h-3 w-3 shrink-0" />
                  {daysLabel}
                </p>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs gap-1.5 shrink-0"
              onClick={() => setDialogOpen(true)}
            >
              <Droplets className="h-3.5 w-3.5" />
              Use
            </Button>
          </div>
        </CardContent>
      </Card>

      <UpdateWeightDialog
        item={item}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={onUpdateWeight}
      />
    </>
  )
}

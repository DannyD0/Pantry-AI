"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2, Droplets, Clock, Bell, ShoppingBag } from "lucide-react"
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
  const isEmpty = item.tracking_state === "EMPTY"
  const pct = isEmpty ? 0 : getStockPercent(item.current_weight, item.original_weight)
  const daysLabel = isEmpty ? null : formatDate(item.predicted_empty_date)

  const pctColor =
    isEmpty ? "text-muted-foreground" :
    pct > 50 ? "text-green-400" : pct > 20 ? "text-yellow-400" : "text-red-400"

  const daysColor =
    !daysLabel ? "" :
    daysLabel === "Empty soon" || daysLabel === "Tomorrow" ? "text-red-400" :
    pct <= 20 ? "text-red-400" : pct <= 50 ? "text-yellow-400" : "text-muted-foreground"

  const hasVelocity = !!item.consumption_velocity_per_day
  const cycleCount = item.historical_lifespans?.length ?? 0

  return (
    <>
      <Card className={`bg-card overflow-hidden ${isEmpty ? "border-muted" : "border-border"}`}>
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
              {/* HIGH priority badge */}
              {item.priority_tier === "HIGH" && !isEmpty && (
                <span className="inline-flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full bg-orange-950/60 text-orange-400 border border-orange-900/40 font-medium">
                  <Bell className="h-2.5 w-2.5" />
                  High
                </span>
              )}
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
            currentWeight={isEmpty ? 0 : item.current_weight}
            originalWeight={item.original_weight}
          />

          {/* Bottom row */}
          <div className="flex items-center justify-between gap-2">
            <div className="space-y-0.5">
              {isEmpty ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-medium text-muted-foreground">Empty</span>
                  {cycleCount > 0 && (
                    <span className="text-[10px] text-muted-foreground/60">
                      · {cycleCount} cycle{cycleCount > 1 ? "s" : ""} tracked
                    </span>
                  )}
                </div>
              ) : (
                <>
                  <div className="flex items-baseline gap-1.5">
                    <span className={`text-lg font-bold tabular-nums leading-none ${pctColor}`}>
                      {pct}%
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {item.current_weight.toFixed(0)}{item.unit} left
                    </span>
                    {hasVelocity && (
                      <span className="text-[10px] text-primary/70 font-medium">AI</span>
                    )}
                  </div>
                  {daysLabel && (
                    <p className={`flex items-center gap-1 text-xs font-medium ${daysColor}`}>
                      <Clock className="h-3 w-3 shrink-0" />
                      {daysLabel}
                    </p>
                  )}
                </>
              )}
            </div>

            {isEmpty ? (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 shrink-0 border-primary/40 text-primary hover:text-primary"
                onClick={() => setDialogOpen(true)}
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                Restock
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                className="h-8 text-xs gap-1.5 shrink-0"
                onClick={() => setDialogOpen(true)}
              >
                <Droplets className="h-3.5 w-3.5" />
                Use
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <UpdateWeightDialog
        item={item}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={onUpdateWeight}
        restockMode={isEmpty}
      />
    </>
  )
}

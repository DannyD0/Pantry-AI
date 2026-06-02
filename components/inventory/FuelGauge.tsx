"use client"

import { Progress } from "@/components/ui/progress"
import { getStockPercent, getFuelColor } from "@/lib/logic/depletion"
import { cn } from "@/lib/utils"

interface FuelGaugeProps {
  currentWeight: number
  originalWeight: number
  className?: string
  showLabel?: boolean
}

export function FuelGauge({ currentWeight, originalWeight, className, showLabel = false }: FuelGaugeProps) {
  const pct = getStockPercent(currentWeight, originalWeight)
  const colorClass = getFuelColor(currentWeight, originalWeight)

  return (
    <div className={cn("space-y-1", className)}>
      <Progress
        value={pct}
        className="h-2 bg-secondary"
        indicatorClassName={colorClass}
      />
      {showLabel && (
        <p className="text-xs text-muted-foreground text-right">{pct}% remaining</p>
      )}
    </div>
  )
}

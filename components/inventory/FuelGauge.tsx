"use client"

import { getStockPercent, getFuelColor } from "@/lib/logic/depletion"
import { cn } from "@/lib/utils"

const MARKERS = [25, 50, 75]

interface FuelGaugeProps {
  currentWeight: number
  originalWeight: number
  className?: string
  /** Show the 25 / 50 / 75 / 100 scale labels under the bar (fuel-tank style). */
  showScale?: boolean
  showLabel?: boolean
}

export function FuelGauge({
  currentWeight,
  originalWeight,
  className,
  showScale = false,
  showLabel = false,
}: FuelGaugeProps) {
  const pct = getStockPercent(currentWeight, originalWeight)
  const colorClass = getFuelColor(currentWeight, originalWeight)

  return (
    <div className={cn("space-y-1", className)}>
      {/* Graduated measure bar */}
      <div className="relative h-3 rounded-md bg-secondary border border-border/60 overflow-hidden">
        <div
          className={cn("h-full transition-all duration-500", colorClass)}
          style={{ width: `${pct}%` }}
        />
        {/* Level markers at 25 / 50 / 75 */}
        {MARKERS.map((m) => (
          <span
            key={m}
            className="absolute top-0 bottom-0 w-px bg-background/70"
            style={{ left: `${m}%` }}
          />
        ))}
      </div>

      {/* Scale labels */}
      {showScale && (
        <div className="relative h-3 text-[8px] font-medium text-muted-foreground/50 tabular-nums select-none">
          {MARKERS.map((m) => (
            <span
              key={m}
              className="absolute top-0 -translate-x-1/2"
              style={{ left: `${m}%` }}
            >
              {m}
            </span>
          ))}
          <span className="absolute top-0 right-0">100</span>
        </div>
      )}

      {showLabel && (
        <p className="text-xs text-muted-foreground text-right">{pct}% remaining</p>
      )}
    </div>
  )
}

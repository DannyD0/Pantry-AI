import type { UsageFrequency } from "@/lib/supabase/types"

// D: days between uses
const DAYS_PER_USE: Record<UsageFrequency, number> = {
  daily: 1,
  thrice_weekly: 2.33,
  weekly: 7,
}

// F: household-size consumption factor, applied to the cold-start estimate
// (no velocity history yet). Larger households deplete shared items faster.
export function getHouseholdFactor(householdSize: number | null | undefined): number {
  if (!householdSize || householdSize <= 0) return 0.10
  if (householdSize === 1) return 0.08
  if (householdSize === 2) return 0.10
  if (householdSize <= 4) return 0.13
  return 0.16
}

// Cold-start estimate: DaysUntilDepletion = D / F. Used only before any real
// depletion cycle exists for an item (i.e. no consumption_velocity_per_day yet).
export function calculateDaysRemaining(
  usageFrequency: UsageFrequency,
  householdSize: number | null | undefined
): number {
  const D = DAYS_PER_USE[usageFrequency]
  const F = getHouseholdFactor(householdSize)
  return Math.max(0, Math.round(D / F))
}

// Frequency-based fallback: used when no velocity data exists yet
export function calculatePredictedEmptyDate(
  usageFrequency: UsageFrequency,
  householdSize: number | null | undefined
): string {
  const days = calculateDaysRemaining(usageFrequency, householdSize)
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split("T")[0]
}

// Velocity-based primary prediction: more accurate after first depletion cycle
export function calculatePredictedEmptyDateFromVelocity(
  currentWeight: number,
  velocityPerDay: number
): string {
  const days = velocityPerDay > 0 ? Math.max(0, Math.round(currentWeight / velocityPerDay)) : 0
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split("T")[0]
}

export function getFuelColor(currentWeight: number, originalWeight: number): string {
  if (originalWeight <= 0) return "bg-muted"
  const pct = (currentWeight / originalWeight) * 100
  if (pct > 50) return "bg-fuel-full"
  if (pct > 20) return "bg-fuel-mid"
  return "bg-fuel-low"
}

export function getStockPercent(currentWeight: number, originalWeight: number): number {
  if (originalWeight <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((currentWeight / originalWeight) * 100)))
}

export function isLowStock(currentWeight: number, originalWeight: number): boolean {
  return getStockPercent(currentWeight, originalWeight) < 20
}

export function applySliderUpdate(originalWeight: number, usedPercent: number): number {
  return originalWeight * (1 - usedPercent / 100)
}

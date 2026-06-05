import type { UsageFrequency } from "@/lib/supabase/types"

const DAYS_PER_USE: Record<UsageFrequency, number> = {
  daily: 1,
  thrice_weekly: 2.33,
  weekly: 7,
}

export function calculateDaysRemaining(
  currentWeight: number,
  originalWeight: number,
  usageFrequency: UsageFrequency
): number {
  if (originalWeight <= 0) return 0
  const ratio = currentWeight / originalWeight
  return Math.max(0, Math.round(ratio * DAYS_PER_USE[usageFrequency]))
}

// Frequency-based fallback: used when no velocity data exists yet
export function calculatePredictedEmptyDate(
  currentWeight: number,
  originalWeight: number,
  usageFrequency: UsageFrequency
): string {
  const days = calculateDaysRemaining(currentWeight, originalWeight, usageFrequency)
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

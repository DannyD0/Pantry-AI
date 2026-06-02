import type { UsageFrequency } from "@/lib/supabase/types"

const DAYS_PER_USE: Record<UsageFrequency, number> = {
  daily: 1,
  thrice_weekly: 2.33,
  weekly: 7,
}

/**
 * Calculate how many days until an item runs out.
 */
export function calculateDaysRemaining(
  currentWeight: number,
  originalWeight: number,
  usageFrequency: UsageFrequency
): number {
  if (originalWeight <= 0) return 0
  const ratio = currentWeight / originalWeight
  return Math.max(0, Math.round(ratio * DAYS_PER_USE[usageFrequency]))
}

/**
 * Calculate predicted empty date from today.
 */
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

/**
 * Get fuel gauge color based on stock percentage.
 * Green > 50%, Yellow 20–50%, Red < 20%
 */
export function getFuelColor(currentWeight: number, originalWeight: number): string {
  if (originalWeight <= 0) return "bg-muted"
  const pct = (currentWeight / originalWeight) * 100
  if (pct > 50) return "bg-fuel-full"
  if (pct > 20) return "bg-fuel-mid"
  return "bg-fuel-low"
}

/**
 * Get stock percentage (0–100).
 */
export function getStockPercent(currentWeight: number, originalWeight: number): number {
  if (originalWeight <= 0) return 0
  return Math.min(100, Math.max(0, Math.round((currentWeight / originalWeight) * 100)))
}

/**
 * Determine if item is low stock (< 20%).
 */
export function isLowStock(currentWeight: number, originalWeight: number): boolean {
  return getStockPercent(currentWeight, originalWeight) < 20
}

/**
 * Apply a percentage-slider update.
 * sliderValue is 0–100 (how much has been USED, i.e. 25 = used 25%).
 */
export function applySliderUpdate(originalWeight: number, usedPercent: number): number {
  return originalWeight * (1 - usedPercent / 100)
}

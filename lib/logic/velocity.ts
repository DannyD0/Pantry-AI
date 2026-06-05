import type { HistoricalLifespan } from "@/lib/supabase/types"

// Most recent entry = highest weight
const WEIGHTS = [1.0, 1.5, 2.0, 2.5]
const OUTLIER_ALPHA = 1.75

function removeOutliers(values: number[]): number[] {
  if (values.length < 3) return values
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length
  const std = Math.sqrt(variance)
  if (std === 0) return values
  return values.filter((v) => Math.abs(v - mean) <= OUTLIER_ALPHA * std)
}

export function calculateWeightedAvgLifespan(
  lifespans: HistoricalLifespan[] | null
): number | null {
  if (!lifespans || lifespans.length === 0) return null

  const days = lifespans.map((l) => l.days)
  const filtered = removeOutliers(days)
  const working = filtered.length >= 1 ? filtered : days

  // Use last 4 data points; most recent gets the highest weight
  const recent = working.slice(-4)
  const activeWeights = WEIGHTS.slice(WEIGHTS.length - recent.length)

  const weightedSum = recent.reduce((sum, d, i) => sum + d * activeWeights[i], 0)
  const weightSum = activeWeights.reduce((a, b) => a + b, 0)

  return weightedSum / weightSum
}

export function calculateVelocity(
  lifespans: HistoricalLifespan[] | null,
  originalWeight: number
): number | null {
  if (!lifespans || lifespans.length === 0) return null
  const avgLifespan = calculateWeightedAvgLifespan(lifespans)
  if (!avgLifespan || avgLifespan <= 0) return null
  return originalWeight / avgLifespan
}

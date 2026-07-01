"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { HistoricalLifespan, InventoryItem, TrackingState } from "@/lib/supabase/types"
import {
  calculatePredictedEmptyDate,
  calculatePredictedEmptyDateFromVelocity,
  isLowStock,
} from "@/lib/logic/depletion"
import { calculateVelocity } from "@/lib/logic/velocity"
import { assignPriorityTier } from "@/lib/logic/priority"
import { triggerShoppingList } from "@/lib/logic/shopping"

export function useInventory(userId: string, householdId: string | null) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchItems = useCallback(async () => {
    if (!householdId) {
      setItems([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const today = new Date().toISOString().split("T")[0]
    await supabase
      .from("inventory")
      .update({ tracking_state: "PENDING_VERIFICATION" as TrackingState })
      .eq("household_id", householdId)
      .eq("tracking_state", "ACTIVE")
      .lte("predicted_empty_date", today)
      .not("predicted_empty_date", "is", null)

    const { data, error: err } = await supabase
      .from("inventory")
      .select("*")
      .eq("household_id", householdId)
      .order("item_name")

    if (err) {
      setError(err.message)
    } else {
      setItems((data as InventoryItem[]) ?? [])
    }
    setLoading(false)
  }, [userId, householdId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  function bestPredictedDate(
    item: Pick<InventoryItem, "current_weight" | "original_weight" | "usage_frequency" | "consumption_velocity_per_day" | "historical_lifespans">
  ): string | null {
    if (item.consumption_velocity_per_day && item.consumption_velocity_per_day > 0) {
      return calculatePredictedEmptyDateFromVelocity(
        item.current_weight,
        item.consumption_velocity_per_day
      )
    }
    if (item.usage_frequency) {
      return calculatePredictedEmptyDate(
        item.current_weight,
        item.original_weight,
        item.usage_frequency
      )
    }
    return null
  }

  const addItem = async (
    item: Omit<
      InventoryItem,
      | "id"
      | "user_id"
      | "household_id"
      | "last_updated"
      | "predicted_empty_date"
      | "consumption_velocity_per_day"
      | "historical_lifespans"
      | "tracking_state"
      | "priority_tier"
      | "last_purchased_timestamp"
      | "volume_multiplier"
    >
  ) => {
    const predicted_empty_date = item.usage_frequency
      ? calculatePredictedEmptyDate(item.current_weight, item.original_weight, item.usage_frequency)
      : null

    const priority_tier = assignPriorityTier(item.item_name, item.category ?? null)

    const { error: err } = await supabase.from("inventory").insert({
      ...item,
      user_id: userId,
      household_id: householdId,
      predicted_empty_date,
      priority_tier,
      tracking_state: "ACTIVE",
      last_purchased_timestamp: new Date().toISOString(),
      historical_lifespans: [],
      volume_multiplier: 1.0,
    })

    if (err) return { error: err.message }
    await fetchItems()
    return { success: true }
  }

  const updateItem = async (
    itemId: string,
    payload: Omit<
      InventoryItem,
      | "id"
      | "user_id"
      | "household_id"
      | "last_updated"
      | "predicted_empty_date"
      | "consumption_velocity_per_day"
      | "historical_lifespans"
      | "tracking_state"
      | "priority_tier"
      | "last_purchased_timestamp"
      | "volume_multiplier"
    >
  ) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return { error: "Item not found" }

    const current_weight =
      item.tracking_state === "EMPTY" ? 0 : Math.min(item.current_weight, payload.original_weight)

    const predicted_empty_date =
      item.tracking_state === "ACTIVE"
        ? bestPredictedDate({ ...item, ...payload, current_weight })
        : item.predicted_empty_date

    const { error: err } = await supabase
      .from("inventory")
      .update({
        item_name: payload.item_name,
        brand: payload.brand,
        category: payload.category,
        original_weight: payload.original_weight,
        current_weight,
        unit: payload.unit,
        usage_frequency: payload.usage_frequency,
        barcode: payload.barcode,
        expiry_date: payload.expiry_date,
        predicted_empty_date,
        last_updated: new Date().toISOString(),
      })
      .eq("id", itemId)

    if (err) return { error: err.message }
    await fetchItems()
    return { success: true }
  }

  const updateWeight = async (itemId: string, newCurrentWeight: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return { error: "Item not found" }

    const isRestocking = item.tracking_state === "EMPTY" && newCurrentWeight > 0
    const newTrackingState: TrackingState = isRestocking
      ? "ACTIVE"
      : item.tracking_state === "PENDING_VERIFICATION"
      ? "ACTIVE"
      : item.tracking_state

    const updatedItem = {
      ...item,
      current_weight: newCurrentWeight,
      consumption_velocity_per_day: item.consumption_velocity_per_day,
    }

    const predicted_empty_date = bestPredictedDate(updatedItem)

    const updatePayload: Partial<InventoryItem> = {
      current_weight: newCurrentWeight,
      predicted_empty_date,
      tracking_state: newTrackingState,
      last_updated: new Date().toISOString(),
    }

    if (isRestocking) {
      updatePayload.last_purchased_timestamp = new Date().toISOString()
    }

    const { error: err } = await supabase
      .from("inventory")
      .update(updatePayload)
      .eq("id", itemId)

    if (err) return { error: err.message }

    const refreshed = { ...item, ...updatePayload }
    const { autoAdded } = await triggerShoppingList(refreshed as InventoryItem)

    await fetchItems()
    return { success: true, autoAdded, itemName: item.item_name }
  }

  const confirmEmpty = async (itemId: string, timeDeltaDays: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return { error: "Item not found" }

    let lifespanDays = 1
    if (item.last_purchased_timestamp) {
      const purchaseDate = new Date(item.last_purchased_timestamp)
      const actualEmptyDate = new Date()
      actualEmptyDate.setDate(actualEmptyDate.getDate() - timeDeltaDays)
      lifespanDays = Math.max(
        1,
        Math.round(
          (actualEmptyDate.getTime() - purchaseDate.getTime()) / (1000 * 60 * 60 * 24)
        )
      )
    }

    const existingLifespans: HistoricalLifespan[] = item.historical_lifespans ?? []
    const newLifespans: HistoricalLifespan[] = [
      ...existingLifespans,
      { days: lifespanDays, recorded_at: new Date().toISOString() },
    ]

    const newVelocity = calculateVelocity(newLifespans, item.original_weight)

    const { error: err } = await supabase
      .from("inventory")
      .update({
        current_weight: 0,
        tracking_state: "EMPTY" as TrackingState,
        historical_lifespans: newLifespans,
        consumption_velocity_per_day: newVelocity,
        predicted_empty_date: null,
        last_updated: new Date().toISOString(),
      })
      .eq("id", itemId)

    if (err) return { error: err.message }

    await triggerShoppingList({ ...item, current_weight: 0 })
    await fetchItems()
    return { success: true }
  }

  const confirmStillHave = async (itemId: string, remainingFraction: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return { error: "Item not found" }

    const newCurrentWeight = item.original_weight * remainingFraction

    const predicted_empty_date = bestPredictedDate({
      ...item,
      current_weight: newCurrentWeight,
    })

    const { error: err } = await supabase
      .from("inventory")
      .update({
        current_weight: newCurrentWeight,
        predicted_empty_date,
        tracking_state: "ACTIVE" as TrackingState,
        last_updated: new Date().toISOString(),
      })
      .eq("id", itemId)

    if (err) return { error: err.message }
    await fetchItems()
    return { success: true }
  }

  const snoozeCheckIn = async (itemId: string) => {
    const snoozed = new Date()
    snoozed.setDate(snoozed.getDate() + 2)

    await supabase
      .from("inventory")
      .update({
        tracking_state: "ACTIVE" as TrackingState,
        predicted_empty_date: snoozed.toISOString().split("T")[0],
      })
      .eq("id", itemId)

    await fetchItems()
  }

  const deleteItem = async (itemId: string) => {
    const { error: err } = await supabase.from("inventory").delete().eq("id", itemId)
    if (err) return { error: err.message }
    await fetchItems()
    return { success: true }
  }

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    updateWeight,
    confirmEmpty,
    confirmStillHave,
    snoozeCheckIn,
    deleteItem,
    refetch: fetchItems,
  }
}

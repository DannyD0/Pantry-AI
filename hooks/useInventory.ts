"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { InventoryItem } from "@/lib/supabase/types"
import { calculatePredictedEmptyDate, isLowStock } from "@/lib/logic/depletion"
import { triggerShoppingList } from "@/lib/logic/shopping"

export function useInventory(userId: string) {
  const [items, setItems] = useState<InventoryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from("inventory")
      .select("*")
      .eq("user_id", userId)
      .order("item_name")

    if (err) {
      setError(err.message)
    } else {
      setItems(data ?? [])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const addItem = async (item: Omit<InventoryItem, "id" | "user_id" | "last_updated" | "predicted_empty_date">) => {
    const predicted_empty_date =
      item.usage_frequency
        ? calculatePredictedEmptyDate(item.current_weight, item.original_weight, item.usage_frequency)
        : null

    const { error: err } = await supabase.from("inventory").insert({
      ...item,
      user_id: userId,
      predicted_empty_date,
    })

    if (err) return { error: err.message }
    await fetchItems()
    return { success: true }
  }

  const updateWeight = async (itemId: string, newCurrentWeight: number) => {
    const item = items.find((i) => i.id === itemId)
    if (!item) return { error: "Item not found" }

    const predicted_empty_date =
      item.usage_frequency
        ? calculatePredictedEmptyDate(newCurrentWeight, item.original_weight, item.usage_frequency)
        : null

    const { error: err } = await supabase
      .from("inventory")
      .update({
        current_weight: newCurrentWeight,
        predicted_empty_date,
        last_updated: new Date().toISOString(),
      })
      .eq("id", itemId)

    if (err) return { error: err.message }

    // Auto-add to shopping list if low stock
    const updatedItem = { ...item, current_weight: newCurrentWeight, predicted_empty_date }
    const { autoAdded } = await triggerShoppingList(updatedItem)

    await fetchItems()
    return { success: true, autoAdded, itemName: item.item_name }
  }

  const deleteItem = async (itemId: string) => {
    const { error: err } = await supabase
      .from("inventory")
      .delete()
      .eq("id", itemId)

    if (err) return { error: err.message }
    await fetchItems()
    return { success: true }
  }

  return { items, loading, error, addItem, updateWeight, deleteItem, refetch: fetchItems }
}

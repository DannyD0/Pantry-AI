"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { restockFromShoppingItem, type RestockResult } from "@/lib/logic/restock"
import type { Category, ShoppingListItem } from "@/lib/supabase/types"

export interface AddListItemPayload {
  item_name: string
  quantity?: number
  weight_per_unit?: number | null
  unit?: string | null
  category?: Category | null
}

export function useShoppingList(userId: string) {
  const [items, setItems] = useState<ShoppingListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const fetchItems = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error: err } = await supabase
      .from("shopping_list")
      .select("*")
      .eq("user_id", userId)
      .order("added_at", { ascending: false })

    if (err) {
      setError(err.message)
    } else {
      setItems(data ?? [])
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    fetchItems()

    // Real-time subscription
    const channel = supabase
      .channel("shopping_list_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "shopping_list", filter: `user_id=eq.${userId}` },
        () => fetchItems()
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchItems, userId])

  const addItem = async (payload: AddListItemPayload) => {
    const { error: err } = await supabase.from("shopping_list").insert({
      user_id: userId,
      item_name: payload.item_name,
      quantity: payload.quantity ?? 1,
      weight_per_unit: payload.weight_per_unit ?? null,
      unit: payload.unit ?? null,
      category: payload.category ?? null,
      is_purchased: false,
      auto_added: false,
    })
    if (err) return { error: err.message }
    await fetchItems()
    return { success: true }
  }

  /**
   * Toggle purchased state. Checking an item off triggers smart-match restock:
   * existing pantry items get stock added on top, unknown items are created.
   */
  const togglePurchased = async (itemId: string, isPurchased: boolean) => {
    const item = items.find((i) => i.id === itemId)
    const { error: err } = await supabase
      .from("shopping_list")
      .update({ is_purchased: isPurchased })
      .eq("id", itemId)

    if (err) return { error: err.message }

    let restock: RestockResult | undefined
    if (isPurchased && item) {
      restock = await restockFromShoppingItem(item)
    }

    await fetchItems()
    return { success: true, restock }
  }

  const deleteItem = async (itemId: string) => {
    const { error: err } = await supabase
      .from("shopping_list")
      .delete()
      .eq("id", itemId)

    if (err) return { error: err.message }
    await fetchItems()
    return { success: true }
  }

  const clearPurchased = async () => {
    const { error: err } = await supabase
      .from("shopping_list")
      .delete()
      .eq("user_id", userId)
      .eq("is_purchased", true)

    if (err) return { error: err.message }
    await fetchItems()
    return { success: true }
  }

  const pending = items.filter((i) => !i.is_purchased)
  const purchased = items.filter((i) => i.is_purchased)

  return { items, pending, purchased, loading, error, addItem, togglePurchased, deleteItem, clearPurchased, refetch: fetchItems }
}

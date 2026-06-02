"use client"

import { useEffect, useState, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import type { ShoppingListItem } from "@/lib/supabase/types"

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

  const addItem = async (itemName: string, quantity = 1) => {
    const { error: err } = await supabase.from("shopping_list").insert({
      user_id: userId,
      item_name: itemName,
      quantity,
      is_purchased: false,
      auto_added: false,
    })
    if (err) return { error: err.message }
    await fetchItems()
    return { success: true }
  }

  const togglePurchased = async (itemId: string, isPurchased: boolean) => {
    const { error: err } = await supabase
      .from("shopping_list")
      .update({ is_purchased: isPurchased })
      .eq("id", itemId)

    if (err) return { error: err.message }
    await fetchItems()
    return { success: true }
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

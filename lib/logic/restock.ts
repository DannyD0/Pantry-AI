import { createClient } from "@/lib/supabase/client"
import type { InventoryItem, ShoppingListItem } from "@/lib/supabase/types"
import {
  calculatePredictedEmptyDate,
  calculatePredictedEmptyDateFromVelocity,
} from "@/lib/logic/depletion"
import { assignPriorityTier } from "@/lib/logic/priority"

export type RestockResult =
  | { action: "added_stock"; itemName: string }
  | { action: "created"; itemName: string }
  | { action: "error"; error: string }

/**
 * Smart-match restock: when a shopping list item is checked off, put it back
 * in the pantry. If a pantry item with the same name exists, stock is added
 * on top; otherwise a fresh entry is created from the list details.
 */
export async function restockFromShoppingItem(listItem: ShoppingListItem): Promise<RestockResult> {
  const supabase = createClient()
  const name = listItem.item_name.trim()
  const qty = Math.max(1, listItem.quantity ?? 1)

  // Case-insensitive exact name match within the user's pantry
  const { data: matches, error: findErr } = await supabase
    .from("inventory")
    .select("*")
    .eq("user_id", listItem.user_id)
    .ilike("item_name", name)
    .limit(1)

  if (findErr) return { action: "error", error: findErr.message }

  const existing = (matches as InventoryItem[] | null)?.[0]
  const now = new Date().toISOString()

  if (existing) {
    // Add purchased stock on top of whatever is left
    const addedWeight = listItem.weight_per_unit
      ? listItem.weight_per_unit * qty
      : existing.original_weight * qty
    const baseWeight = existing.tracking_state === "EMPTY" ? 0 : existing.current_weight
    const newCurrent = baseWeight + addedWeight
    const newOriginal = Math.max(existing.original_weight, newCurrent)

    const predicted =
      existing.consumption_velocity_per_day && existing.consumption_velocity_per_day > 0
        ? calculatePredictedEmptyDateFromVelocity(newCurrent, existing.consumption_velocity_per_day)
        : existing.usage_frequency
        ? calculatePredictedEmptyDate(newCurrent, newOriginal, existing.usage_frequency)
        : null

    const { error: err } = await supabase
      .from("inventory")
      .update({
        current_weight: newCurrent,
        original_weight: newOriginal,
        tracking_state: "ACTIVE",
        predicted_empty_date: predicted,
        last_purchased_timestamp: now,
        last_updated: now,
      })
      .eq("id", existing.id)

    if (err) return { action: "error", error: err.message }
    return { action: "added_stock", itemName: existing.item_name }
  }

  // No match: create a fresh pantry entry from the details entered on the list
  const weight = listItem.weight_per_unit ? listItem.weight_per_unit * qty : qty
  const unit = listItem.unit?.trim() || (listItem.weight_per_unit ? "oz" : "count")

  const predicted = listItem.usage_frequency
    ? calculatePredictedEmptyDate(weight, weight, listItem.usage_frequency)
    : null

  const { error: insertErr } = await supabase.from("inventory").insert({
    user_id: listItem.user_id,
    item_name: name,
    brand: listItem.brand ?? null,
    category: listItem.category ?? null,
    original_weight: weight,
    current_weight: weight,
    unit,
    usage_frequency: listItem.usage_frequency ?? null,
    barcode: null,
    image_url: null,
    expiry_date: listItem.expiry_date ?? null,
    predicted_empty_date: predicted,
    priority_tier: assignPriorityTier(name, listItem.category ?? null),
    tracking_state: "ACTIVE",
    last_purchased_timestamp: now,
    historical_lifespans: [],
    volume_multiplier: 1.0,
  })

  if (insertErr) return { action: "error", error: insertErr.message }
  return { action: "created", itemName: name }
}

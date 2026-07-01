import { createClient } from "@/lib/supabase/client"
import type { InventoryItem } from "@/lib/supabase/types"
import { isLowStock } from "@/lib/logic/depletion"

/**
 * After a weight update, check if item is low stock and auto-add to shopping list.
 * Returns { autoAdded: true } if a new entry was inserted.
 */
export async function triggerShoppingList(item: InventoryItem): Promise<{ autoAdded: boolean }> {
  if (!isLowStock(item.current_weight, item.original_weight)) return { autoAdded: false }
  if (!item.household_id) return { autoAdded: false }

  const supabase = createClient()

  const { data: existing } = await supabase
    .from("shopping_list")
    .select("id")
    .eq("household_id", item.household_id)
    .eq("item_name", item.item_name)
    .eq("is_purchased", false)
    .maybeSingle()

  if (existing) return { autoAdded: false }

  await supabase.from("shopping_list").insert({
    user_id: item.user_id,
    household_id: item.household_id,
    item_name: item.item_name,
    quantity: 1,
    auto_added: true,
    is_purchased: false,
  })

  return { autoAdded: true }
}

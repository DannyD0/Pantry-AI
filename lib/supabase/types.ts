export type Category = "Protein" | "Vegetable" | "Grain" | "Dairy" | "Essential" | "Other"
export type UsageFrequency = "daily" | "thrice_weekly" | "weekly"

export interface InventoryItem {
  id: string
  user_id: string
  item_name: string
  brand: string | null
  category: Category | null
  original_weight: number
  current_weight: number
  unit: string
  usage_frequency: UsageFrequency | null
  last_updated: string
  predicted_empty_date: string | null
  barcode: string | null
  image_url: string | null
}

export interface ShoppingListItem {
  id: string
  user_id: string
  item_name: string
  quantity: number
  added_at: string
  is_purchased: boolean
  auto_added: boolean
}

export type Database = {
  public: {
    Tables: {
      inventory: {
        Row: InventoryItem
        Insert: Omit<InventoryItem, "id" | "last_updated"> & { id?: string; last_updated?: string }
        Update: Partial<Omit<InventoryItem, "id" | "user_id">>
      }
      shopping_list: {
        Row: ShoppingListItem
        Insert: Omit<ShoppingListItem, "id" | "added_at"> & { id?: string; added_at?: string }
        Update: Partial<Omit<ShoppingListItem, "id" | "user_id">>
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}

export type Category = "Protein" | "Vegetable" | "Grain" | "Dairy" | "Essential" | "Other"
export type UsageFrequency = "daily" | "thrice_weekly" | "weekly"
export type TrackingState = "ACTIVE" | "PENDING_VERIFICATION" | "EMPTY"
export type PriorityTier = "HIGH" | "MEDIUM" | "LOW"

export type HistoricalLifespan = {
  days: number
  recorded_at: string // ISO timestamp
}

export type InventoryItem = {
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
  // Sprint 7
  expiry_date: string | null
  // Sprint 6 — automated prediction engine
  consumption_velocity_per_day: number | null
  historical_lifespans: HistoricalLifespan[] | null
  tracking_state: TrackingState
  priority_tier: PriorityTier
  last_purchased_timestamp: string | null
  volume_multiplier: number
}

export type ShoppingListItem = {
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
        Insert: Omit<
          InventoryItem,
          | "id"
          | "last_updated"
          | "tracking_state"
          | "priority_tier"
          | "historical_lifespans"
          | "consumption_velocity_per_day"
          | "last_purchased_timestamp"
          | "volume_multiplier"
        > & {
          id?: string
          last_updated?: string
          expiry_date?: string | null
          tracking_state?: TrackingState
          priority_tier?: PriorityTier
          historical_lifespans?: HistoricalLifespan[] | null
          consumption_velocity_per_day?: number | null
          last_purchased_timestamp?: string | null
          volume_multiplier?: number
        }
        Update: Partial<Omit<InventoryItem, "id" | "user_id">>
        Relationships: []
      }
      shopping_list: {
        Row: ShoppingListItem
        Insert: Omit<ShoppingListItem, "id" | "added_at"> & { id?: string; added_at?: string }
        Update: Partial<Omit<ShoppingListItem, "id" | "user_id">>
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

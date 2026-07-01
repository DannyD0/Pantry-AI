export type Category = "Protein" | "Vegetable" | "Grain" | "Dairy" | "Essential" | "Other"
export type UsageFrequency = "daily" | "thrice_weekly" | "weekly"
export type TrackingState = "ACTIVE" | "PENDING_VERIFICATION" | "EMPTY"
export type PriorityTier = "HIGH" | "MEDIUM" | "LOW"

export type HistoricalLifespan = {
  days: number
  recorded_at: string
}

export type InventoryItem = {
  id: string
  user_id: string
  household_id: string | null
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
  expiry_date: string | null
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
  household_id: string | null
  item_name: string
  quantity: number
  added_at: string
  is_purchased: boolean
  auto_added: boolean
  weight_per_unit: number | null
  unit: string | null
  category: Category | null
  brand: string | null
  usage_frequency: UsageFrequency | null
  expiry_date: string | null
}

// ─── Household types ──────────────────────────────────────────────────────────

export type Household = {
  id: string
  created_by: string
  household_size: number
  created_at: string
}

export type HouseholdMember = {
  id: string
  household_id: string
  user_id: string
  joined_at: string
}

export type HouseholdInvite = {
  id: string
  household_id: string
  invite_code: string
  created_by: string
  invited_email: string | null
  used_by: string | null
  expires_at: string
  created_at: string
}

export type HouseholdMemberWithProfile = HouseholdMember & {
  email: string | null
  full_name: string | null
}

// ─── Supabase Database type ───────────────────────────────────────────────────

export type Database = {
  public: {
    Tables: {
      inventory: {
        Row: InventoryItem & Record<string, unknown>
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
        } & Record<string, unknown>
        Update: Partial<Omit<InventoryItem, "id" | "user_id">> & Record<string, unknown>
        Relationships: []
      }
      shopping_list: {
        Row: ShoppingListItem & Record<string, unknown>
        Insert: Omit<
          ShoppingListItem,
          "id" | "added_at" | "weight_per_unit" | "unit" | "category" | "brand" | "usage_frequency" | "expiry_date"
        > & {
          id?: string
          added_at?: string
          weight_per_unit?: number | null
          unit?: string | null
          category?: Category | null
          brand?: string | null
          usage_frequency?: UsageFrequency | null
          expiry_date?: string | null
        } & Record<string, unknown>
        Update: Partial<Omit<ShoppingListItem, "id" | "user_id">> & Record<string, unknown>
        Relationships: []
      }
      households: {
        Row: Household & Record<string, unknown>
        Insert: Omit<Household, "id" | "created_at" | "household_size"> & {
          id?: string
          created_at?: string
          household_size?: number
        } & Record<string, unknown>
        Update: Partial<Omit<Household, "id">> & Record<string, unknown>
        Relationships: []
      }
      household_members: {
        Row: HouseholdMember & Record<string, unknown>
        Insert: Omit<HouseholdMember, "id" | "joined_at"> & { id?: string; joined_at?: string } & Record<string, unknown>
        Update: Partial<Omit<HouseholdMember, "id">> & Record<string, unknown>
        Relationships: []
      }
      household_invites: {
        Row: HouseholdInvite & Record<string, unknown>
        Insert: Omit<HouseholdInvite, "id" | "created_at" | "expires_at" | "used_by" | "invited_email"> & {
          id?: string
          created_at?: string
          expires_at?: string
          used_by?: string | null
          invited_email?: string | null
        } & Record<string, unknown>
        Update: Partial<Omit<HouseholdInvite, "id">> & Record<string, unknown>
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

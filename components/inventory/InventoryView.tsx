"use client"

import { useState } from "react"
import { Plus, Package, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InventoryCard } from "./InventoryCard"
import { AddItemFlow } from "./AddItemFlow"
import { AddItemDialog, type AddItemPayload, type AddItemPrefill } from "./AddItemDialog"
import { useInventory } from "@/hooks/useInventory"
import { useToast } from "@/hooks/useToast"
import { BottomNav } from "@/components/layout/BottomNav"
import type { Category, InventoryItem } from "@/lib/supabase/types"

const CATEGORY_ORDER: (Category | "All")[] = [
  "All", "Protein", "Vegetable", "Grain", "Dairy", "Essential", "Other",
]

function toPrefill(item: InventoryItem): AddItemPrefill {
  return {
    item_name: item.item_name,
    brand: item.brand ?? "",
    category: item.category ?? "",
    original_weight: String(item.original_weight),
    unit: item.unit,
    usage_frequency: item.usage_frequency ?? "",
    barcode: item.barcode ?? "",
    expiry_date: item.expiry_date ?? "",
  }
}

export function InventoryView({ userId }: { userId: string }) {
  const { items, loading, error, addItem, updateItem, updateWeight, deleteItem } = useInventory(userId)
  const { toast } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<InventoryItem | null>(null)
  const [activeFilter, setActiveFilter] = useState<Category | "All">("All")

  const handleAdd = async (payload: AddItemPayload) => {
    const result = await addItem(payload)
    if (result.error) toast(`❌ Something went wrong`, "error")
    else toast(`✅ ${payload.item_name} added to pantry`)
    return result
  }

  const handleEditSave = async (payload: AddItemPayload) => {
    if (!editItem) return { error: "No item selected" }
    const result = await updateItem(editItem.id, payload)
    if (result.error) toast(`❌ Something went wrong`, "error")
    else toast(`✅ Item updated`)
    return result
  }

  const handleUpdateWeight = async (itemId: string, newWeight: number) => {
    const item = items.find((i) => i.id === itemId)
    const wasEmpty = item?.tracking_state === "EMPTY"
    const result = await updateWeight(itemId, newWeight)
    if (result?.error) {
      toast(`❌ Something went wrong`, "error")
    } else if (result?.autoAdded && result?.itemName) {
      toast(`🛒 ${result.itemName} added to shopping list`)
    } else if (result?.success && item) {
      toast(wasEmpty ? `✅ ${item.item_name} restocked` : `✅ ${item.item_name} updated`)
    }
    return result
  }

  const handleDelete = async (itemId: string) => {
    const item = items.find((i) => i.id === itemId)
    const result = await deleteItem(itemId)
    if (result.error) toast(`❌ Something went wrong`, "error")
    else if (item) toast(`🗑️ ${item.item_name} removed`)
    return result
  }

  const filtered = activeFilter === "All"
    ? items
    : items.filter((item) => item.category === activeFilter)

  const sorted = [...filtered].sort((a, b) => {
    const aPct = a.original_weight > 0 ? a.current_weight / a.original_weight : 1
    const bPct = b.original_weight > 0 ? b.current_weight / b.original_weight : 1
    if (aPct !== bPct) return aPct - bPct
    return a.item_name.localeCompare(b.item_name)
  })

  const lowStockCount = items.filter(
    (i) => i.original_weight > 0 && i.current_weight / i.original_weight < 0.2
  ).length

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Pantry</h1>
            <p className="text-xs text-muted-foreground">
              {items.length} {items.length === 1 ? "item" : "items"}
              {lowStockCount > 0 && (
                <span className="text-red-400 ml-1.5">· {lowStockCount} low</span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <Button size="sm" className="gap-1.5 h-8" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>

        {/* Category filter pills */}
        {items.length > 0 && (
          <div className="flex gap-2 px-4 pb-3 overflow-x-auto scrollbar-none">
            {CATEGORY_ORDER.filter((cat) =>
              cat === "All" || items.some((i) => i.category === cat)
            ).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveFilter(cat)}
                className={`shrink-0 text-xs px-3 py-1 rounded-full border transition-colors ${
                  activeFilter === cat
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:border-foreground/30"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Body */}
      <main className="px-4 py-4 pb-nav space-y-3">
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-card animate-pulse" />
            ))}
          </div>
        )}

        {!loading && error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {!loading && !error && items.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-card border border-border flex items-center justify-center">
              <Package className="h-8 w-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <h3 className="font-semibold">Pantry is empty</h3>
              <p className="text-sm text-muted-foreground">Add your first item to start tracking.</p>
            </div>
            <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        )}

        {!loading && !error && items.length > 0 && sorted.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No {activeFilter} items yet.
          </div>
        )}

        {!loading && sorted.map((item) => (
          <InventoryCard
            key={item.id}
            item={item}
            onUpdateWeight={handleUpdateWeight}
            onDelete={handleDelete}
            onEdit={setEditItem}
          />
        ))}
      </main>

      <AddItemFlow open={addOpen} onOpenChange={setAddOpen} onAdd={handleAdd} />

      {/* Edit existing item: same form, prefilled, saves via UPDATE */}
      <AddItemDialog
        open={!!editItem}
        onOpenChange={(open) => { if (!open) setEditItem(null) }}
        onAdd={handleEditSave}
        prefill={editItem ? toPrefill(editItem) : undefined}
        mode="edit"
      />
      <BottomNav />
    </div>
  )
}

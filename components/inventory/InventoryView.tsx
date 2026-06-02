"use client"

import { useState } from "react"
import { Plus, Package, AlertTriangle, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { InventoryCard } from "./InventoryCard"
import { AddItemDialog } from "./AddItemDialog"
import { useInventory } from "@/hooks/useInventory"
import { useToast } from "@/hooks/useToast"
import { ToastProvider, ToastViewport, Toast, ToastTitle, ToastClose } from "@/components/ui/toast"
import { BottomNav } from "@/components/layout/BottomNav"
import type { Category } from "@/lib/supabase/types"

const CATEGORY_ORDER: (Category | "All")[] = [
  "All", "Protein", "Vegetable", "Grain", "Dairy", "Essential", "Other",
]

export function InventoryView({ userId }: { userId: string }) {
  const { items, loading, error, addItem, updateWeight, deleteItem } = useInventory(userId)
  const { toasts, toast, dismiss } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<Category | "All">("All")

  const handleUpdateWeight = async (itemId: string, newWeight: number) => {
    const result = await updateWeight(itemId, newWeight)
    if (result?.autoAdded && result?.itemName) {
      toast(`${result.itemName} added to shopping list`)
    }
    return result
  }

  const filtered = activeFilter === "All"
    ? items
    : items.filter((item) => item.category === activeFilter)

  // Sort: low stock first, then by name
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
          <Button size="sm" className="gap-1.5 h-8" onClick={() => setAddOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
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
        {/* Loading */}
        {loading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-28 rounded-lg bg-card animate-pulse" />
            ))}
          </div>
        )}

        {/* Error */}
        {!loading && error && (
          <div className="flex items-center gap-2 text-destructive text-sm p-4 bg-destructive/10 rounded-lg border border-destructive/20">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Empty state */}
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

        {/* No filter results */}
        {!loading && !error && items.length > 0 && sorted.length === 0 && (
          <div className="text-center py-12 text-sm text-muted-foreground">
            No {activeFilter} items yet.
          </div>
        )}

        {/* Inventory cards */}
        {!loading && sorted.map((item) => (
          <InventoryCard
            key={item.id}
            item={item}
            onUpdateWeight={handleUpdateWeight}
            onDelete={deleteItem}
          />
        ))}
      </main>

      <AddItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={addItem}
      />

      <BottomNav />

      <ToastProvider swipeDirection="down">
        {toasts.map((t) => (
          <Toast key={t.id} onOpenChange={(open) => { if (!open) dismiss(t.id) }} duration={3500}>
            <ShoppingCart className="h-4 w-4 text-green-400 shrink-0" />
            <ToastTitle className="flex-1 text-sm">{t.title}</ToastTitle>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </div>
  )
}

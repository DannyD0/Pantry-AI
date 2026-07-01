"use client"

import { useState } from "react"
import {
  Plus,
  ShoppingCart,
  CheckCircle2,
  Circle,
  Trash2,
  Pencil,
  AlertTriangle,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { AddItemDialog, type AddItemPayload, type AddItemPrefill } from "@/components/inventory/AddItemDialog"
import { useShoppingList, type AddListItemPayload } from "@/hooks/useShoppingList"
import { useToast } from "@/hooks/useToast"
import { BottomNav } from "@/components/layout/BottomNav"
import type { ShoppingListItem } from "@/lib/supabase/types"

// Same form as the pantry; quantity is how many units are being bought,
// weight is per unit. Both feed smart restock when the item is checked off.
function toListPayload(payload: AddItemPayload): AddListItemPayload {
  return {
    item_name: payload.item_name,
    quantity: payload.quantity ?? 1,
    weight_per_unit: payload.original_weight,
    unit: payload.unit,
    category: payload.category,
    brand: payload.brand,
    usage_frequency: payload.usage_frequency,
    expiry_date: payload.expiry_date,
  }
}

function toPrefill(item: ShoppingListItem): AddItemPrefill {
  return {
    item_name: item.item_name,
    brand: item.brand ?? "",
    category: item.category ?? "",
    original_weight: item.weight_per_unit != null ? String(item.weight_per_unit) : "",
    unit: item.unit ?? "",
    usage_frequency: item.usage_frequency ?? "",
    expiry_date: item.expiry_date ?? "",
    quantity: String(item.quantity),
  }
}

export function ShoppingView({ userId, householdId }: { userId: string; householdId: string | null }) {
  const { items, pending, purchased, loading, error, addItem, updateItem, togglePurchased, deleteItem, clearPurchased } =
    useShoppingList(userId, householdId)
  const { toast } = useToast()
  const [addOpen, setAddOpen] = useState(false)
  const [editItem, setEditItem] = useState<ShoppingListItem | null>(null)
  const [showPurchased, setShowPurchased] = useState(false)

  const handleAdd = async (payload: AddItemPayload) => {
    const result = await addItem(toListPayload(payload))
    if (result.error) toast(`❌ Something went wrong`, "error")
    else toast(`🛒 ${payload.item_name} added to list`)
    return result
  }

  const handleEditSave = async (payload: AddItemPayload) => {
    if (!editItem) return { error: "No item selected" }
    const result = await updateItem(editItem.id, toListPayload(payload))
    if (result.error) toast(`❌ Something went wrong`, "error")
    else toast(`✅ Item updated`)
    return result
  }

  const handleToggle = async (id: string, isPurchased: boolean) => {
    const item = items.find((i) => i.id === id)
    const result = await togglePurchased(id, isPurchased)
    if (result.error) {
      toast(`❌ Something went wrong`, "error")
    } else if (isPurchased && item) {
      if (result.restock?.action === "added_stock") {
        toast(`✅ ${result.restock.itemName} restocked in pantry`)
      } else if (result.restock?.action === "created") {
        toast(`✅ ${result.restock.itemName} added to pantry`)
      } else {
        toast(`✅ Got it! ${item.item_name} checked off`)
      }
    }
    return result
  }

  const handleDelete = async (id: string) => {
    const item = items.find((i) => i.id === id)
    const result = await deleteItem(id)
    if (result.error) toast(`❌ Something went wrong`, "error")
    else if (item) toast(`🗑️ ${item.item_name} removed`)
    return result
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border pt-safe">
        <div className="flex items-center justify-between px-4 py-3">
          <div>
            <h1 className="text-lg font-bold tracking-tight">Shopping List</h1>
            <p className="text-xs text-muted-foreground">
              {pending.length} {pending.length === 1 ? "item" : "items"} to buy
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            {purchased.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground h-8"
                onClick={clearPurchased}
              >
                Clear done
              </Button>
            )}
            <Button size="sm" className="gap-1.5 h-8" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-nav space-y-6">
        {/* Loading skeleton */}
        {loading && (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-14 rounded-xl bg-card animate-pulse" />
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

        {!loading && !error && (
          <>
            {/* To Buy section */}
            {pending.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 gap-3 text-center">
                <div className="w-14 h-14 rounded-2xl bg-card border border-border flex items-center justify-center">
                  <ShoppingCart className="h-7 w-7 text-muted-foreground" />
                </div>
                <div className="space-y-1">
                  <h3 className="font-semibold text-sm">All clear</h3>
                  <p className="text-sm text-muted-foreground max-w-[220px]">
                    Nothing to buy. Tap Add Item, or let low-stock auto-add things.
                  </p>
                </div>
                <Button size="sm" className="gap-1.5" onClick={() => setAddOpen(true)}>
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </div>
            ) : (
              <section className="space-y-2">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1">
                  To Buy · {pending.length}
                </h2>
                {pending.map((item) => (
                  <ShoppingItem
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    onDelete={handleDelete}
                    onEdit={setEditItem}
                  />
                ))}
              </section>
            )}

            {/* Purchased section */}
            {purchased.length > 0 && (
              <section className="space-y-2">
                <button
                  onClick={() => setShowPurchased((p) => !p)}
                  className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 py-1"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Done · {purchased.length}
                  <ChevronDown
                    className={`h-3.5 w-3.5 transition-transform duration-200 ${
                      showPurchased ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {showPurchased &&
                  purchased.map((item) => (
                    <ShoppingItem
                      key={item.id}
                      item={item}
                      onToggle={handleToggle}
                      onDelete={handleDelete}
                      onEdit={setEditItem}
                    />
                  ))}
              </section>
            )}
          </>
        )}
      </main>

      {/* Full pantry form plus quantity, reused from the inventory page */}
      <AddItemDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onAdd={handleAdd}
        showQuantity
        title="Add to List"
      />

      {/* Edit existing list item: same form, prefilled, saves via UPDATE */}
      <AddItemDialog
        open={!!editItem}
        onOpenChange={(open) => { if (!open) setEditItem(null) }}
        onAdd={handleEditSave}
        prefill={editItem ? toPrefill(editItem) : undefined}
        mode="edit"
        showQuantity
      />

      <BottomNav />
    </div>
  )
}

interface ShoppingItemProps {
  item: ShoppingListItem
  onToggle: (id: string, purchased: boolean) => Promise<{ error?: string; success?: boolean }>
  onDelete: (id: string) => Promise<{ error?: string; success?: boolean }>
  onEdit: (item: ShoppingListItem) => void
}

function formatDetails(item: ShoppingListItem): string | null {
  const parts: string[] = []
  if (item.quantity > 1 || item.weight_per_unit) {
    parts.push(
      item.weight_per_unit
        ? `${item.quantity} × ${item.weight_per_unit}${item.unit ?? ""}`
        : `× ${item.quantity}`
    )
  }
  if (item.brand) parts.push(item.brand)
  if (item.category) parts.push(item.category)
  return parts.length > 0 ? parts.join(" · ") : null
}

function ShoppingItem({ item, onToggle, onDelete, onEdit }: ShoppingItemProps) {
  const [toggling, setToggling] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const details = formatDetails(item)

  const handleToggle = async () => {
    setToggling(true)
    await onToggle(item.id, !item.is_purchased)
    setToggling(false)
  }

  const handleDelete = async () => {
    setDeleting(true)
    await onDelete(item.id)
    setDeleting(false)
  }

  return (
    <div
      className={`flex items-center gap-3 px-3 py-3 rounded-xl border bg-card border-border transition-opacity ${
        item.is_purchased ? "opacity-50" : ""
      }`}
    >
      <button
        onClick={handleToggle}
        disabled={toggling}
        className="shrink-0 transition-transform active:scale-90"
        aria-label={item.is_purchased ? "Mark as not purchased" : "Mark as purchased"}
      >
        {item.is_purchased ? (
          <CheckCircle2 className="h-5 w-5 text-green-400" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </button>

      <div className="flex-1 min-w-0">
        <span
          className={`block text-sm font-medium leading-tight truncate ${
            item.is_purchased ? "line-through text-muted-foreground" : ""
          }`}
        >
          {item.item_name}
        </span>
        {details && (
          <span className="block text-[11px] text-muted-foreground mt-0.5 truncate">{details}</span>
        )}
      </div>

      <button
        onClick={() => onEdit(item)}
        className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
        aria-label={`Edit ${item.item_name}`}
      >
        <Pencil className="h-4 w-4" />
      </button>

      <button
        onClick={handleDelete}
        disabled={deleting}
        className="shrink-0 text-muted-foreground hover:text-destructive transition-colors p-1"
        aria-label="Remove from list"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  )
}

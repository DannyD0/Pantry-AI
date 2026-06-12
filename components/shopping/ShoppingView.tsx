"use client"

import { useState } from "react"
import {
  Plus,
  ShoppingCart,
  CheckCircle2,
  Circle,
  Trash2,
  AlertTriangle,
  ChevronDown,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useShoppingList } from "@/hooks/useShoppingList"
import { useToast } from "@/hooks/useToast"
import { BottomNav } from "@/components/layout/BottomNav"
import { ProfileButton } from "@/components/layout/ProfileButton"
import { isValidQuantity, isValidWeight, sanitizeText } from "@/lib/logic/validate"
import type { Category, ShoppingListItem } from "@/lib/supabase/types"

const CATEGORIES: Category[] = ["Protein", "Vegetable", "Grain", "Dairy", "Essential", "Other"]

const EMPTY_FORM = {
  item_name: "",
  quantity: "1",
  weight_per_unit: "",
  unit: "oz",
  category: "" as Category | "",
}

export function ShoppingView({ userId }: { userId: string }) {
  const { items, pending, purchased, loading, error, addItem, togglePurchased, deleteItem, clearPurchased } =
    useShoppingList(userId)
  const { toast } = useToast()
  const [form, setForm] = useState(EMPTY_FORM)
  const [showDetails, setShowDetails] = useState(false)
  const [adding, setAdding] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [showPurchased, setShowPurchased] = useState(false)

  const handleAdd = async () => {
    const name = sanitizeText(form.item_name)
    if (!name) return

    const quantity = parseInt(form.quantity, 10) || 1
    if (!isValidQuantity(quantity)) {
      setFormError("Quantity must be between 1 and 99.")
      return
    }
    const weightPerUnit = form.weight_per_unit ? parseFloat(form.weight_per_unit) : null
    if (weightPerUnit !== null && !isValidWeight(weightPerUnit)) {
      setFormError("Enter a valid weight per unit.")
      return
    }

    setAdding(true)
    setFormError(null)
    const result = await addItem({
      item_name: name,
      quantity,
      weight_per_unit: weightPerUnit,
      unit: weightPerUnit !== null ? sanitizeText(form.unit, 12) || "oz" : null,
      category: (form.category as Category) || null,
    })
    if (result.error) toast(`❌ Something went wrong`, "error")
    else toast(`🛒 ${name} added to list`)
    setForm(EMPTY_FORM)
    setShowDetails(false)
    setAdding(false)
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
            <ProfileButton />
          </div>
        </div>
      </header>

      <main className="px-4 py-4 pb-nav space-y-6">
        {/* Add item form */}
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              placeholder="Add an item..."
              value={form.item_name}
              onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              maxLength={120}
              className="h-10"
            />
            <Button
              onClick={handleAdd}
              disabled={adding || !form.item_name.trim()}
              size="sm"
              className="h-10 px-4 gap-1.5 shrink-0"
            >
              <Plus className="h-4 w-4" />
              Add
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setShowDetails((d) => !d)}
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-1"
          >
            <ChevronDown
              className={`h-3.5 w-3.5 transition-transform duration-200 ${showDetails ? "rotate-180" : ""}`}
            />
            Details — qty, weight, category
          </button>

          {showDetails && (
            <div className="grid grid-cols-3 gap-2 bg-card border border-border rounded-xl p-3">
              <div className="space-y-1">
                <Label htmlFor="sl-qty" className="text-[11px] text-muted-foreground">Qty</Label>
                <Input
                  id="sl-qty"
                  type="number"
                  min="1"
                  max="99"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  inputMode="numeric"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sl-weight" className="text-[11px] text-muted-foreground">Weight/unit</Label>
                <Input
                  id="sl-weight"
                  type="number"
                  min="0"
                  step="any"
                  placeholder="e.g. 16"
                  value={form.weight_per_unit}
                  onChange={(e) => setForm((f) => ({ ...f, weight_per_unit: e.target.value }))}
                  inputMode="decimal"
                  className="h-9 text-sm"
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor="sl-unit" className="text-[11px] text-muted-foreground">Unit</Label>
                <Input
                  id="sl-unit"
                  placeholder="oz"
                  value={form.unit}
                  onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                  maxLength={12}
                  className="h-9 text-sm"
                />
              </div>
              <div className="col-span-3 space-y-1">
                <Label className="text-[11px] text-muted-foreground">Category</Label>
                <Select
                  value={form.category}
                  onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}
                >
                  <SelectTrigger className="h-9 text-sm">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {formError && <p className="text-xs text-destructive px-1">{formError}</p>}
        </div>

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
                    Nothing to buy. Add items above, or let low-stock auto-add them.
                  </p>
                </div>
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
                    />
                  ))}
              </section>
            )}
          </>
        )}
      </main>
      <BottomNav />
    </div>
  )
}

interface ShoppingItemProps {
  item: ShoppingListItem
  onToggle: (id: string, purchased: boolean) => Promise<{ error?: string; success?: boolean }>
  onDelete: (id: string) => Promise<{ error?: string; success?: boolean }>
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
  if (item.category) parts.push(item.category)
  return parts.length > 0 ? parts.join(" · ") : null
}

function ShoppingItem({ item, onToggle, onDelete }: ShoppingItemProps) {
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

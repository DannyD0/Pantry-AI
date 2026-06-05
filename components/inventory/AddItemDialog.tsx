"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
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
import type { Category, UsageFrequency, InventoryItem } from "@/lib/supabase/types"

export type AddItemPayload = Omit<
  InventoryItem,
  | "id"
  | "user_id"
  | "last_updated"
  | "predicted_empty_date"
  | "consumption_velocity_per_day"
  | "historical_lifespans"
  | "tracking_state"
  | "priority_tier"
  | "last_purchased_timestamp"
  | "volume_multiplier"
>

export interface AddItemPrefill {
  item_name?: string
  brand?: string
  category?: Category | ""
  original_weight?: string
  unit?: string
  barcode?: string
}

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: AddItemPayload) => Promise<{ error?: string; success?: boolean }>
  prefill?: AddItemPrefill
}

const CATEGORIES: Category[] = ["Protein", "Vegetable", "Grain", "Dairy", "Essential", "Other"]
const FREQUENCIES: { value: UsageFrequency; label: string }[] = [
  { value: "daily", label: "Daily" },
  { value: "thrice_weekly", label: "3× per week" },
  { value: "weekly", label: "Weekly" },
]

const EMPTY_FORM = {
  item_name: "",
  brand: "",
  category: "" as Category | "",
  original_weight: "",
  unit: "oz",
  usage_frequency: "" as UsageFrequency | "",
  barcode: "",
  expiry_date: "",
}

export function AddItemDialog({ open, onOpenChange, onAdd, prefill }: AddItemDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Apply prefill whenever dialog opens with new prefill data
  useEffect(() => {
    if (open) {
      setForm({
        ...EMPTY_FORM,
        ...(prefill ?? {}),
      })
      setError(null)
    }
  }, [open, prefill])

  function handleOpenChange(val: boolean) {
    if (!val) {
      setForm(EMPTY_FORM)
      setError(null)
    }
    onOpenChange(val)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.item_name.trim()) return setError("Item name is required.")
    const originalWeight = parseFloat(form.original_weight)
    if (!originalWeight || originalWeight <= 0) return setError("Enter a valid weight.")

    setSaving(true)
    setError(null)

    const payload: AddItemPayload = {
      item_name: form.item_name.trim(),
      brand: form.brand.trim() || null,
      category: (form.category as Category) || null,
      original_weight: originalWeight,
      current_weight: originalWeight,
      unit: form.unit.trim() || "oz",
      usage_frequency: (form.usage_frequency as UsageFrequency) || null,
      barcode: form.barcode.trim() || null,
      image_url: null,
      expiry_date: form.expiry_date || null,
    }

    const result = await onAdd(payload)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      handleOpenChange(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Item</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-1">
          {/* Item Name */}
          <div className="space-y-1.5">
            <Label htmlFor="item_name" className="text-xs text-muted-foreground">
              Item Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="item_name"
              placeholder="e.g. Chicken Breast"
              value={form.item_name}
              onChange={(e) => setForm((f) => ({ ...f, item_name: e.target.value }))}
              autoComplete="off"
            />
          </div>

          {/* Brand */}
          <div className="space-y-1.5">
            <Label htmlFor="brand" className="text-xs text-muted-foreground">Brand</Label>
            <Input
              id="brand"
              placeholder="e.g. Trader Joe's"
              value={form.brand}
              onChange={(e) => setForm((f) => ({ ...f, brand: e.target.value }))}
              autoComplete="off"
            />
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Category</Label>
            <Select
              value={form.category}
              onValueChange={(v) => setForm((f) => ({ ...f, category: v as Category }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Weight + Unit row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="original_weight" className="text-xs text-muted-foreground">
                Weight <span className="text-destructive">*</span>
              </Label>
              <Input
                id="original_weight"
                type="number"
                min="0"
                step="any"
                placeholder="e.g. 16"
                value={form.original_weight}
                onChange={(e) => setForm((f) => ({ ...f, original_weight: e.target.value }))}
                inputMode="decimal"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="unit" className="text-xs text-muted-foreground">Unit</Label>
              <Input
                id="unit"
                placeholder="oz"
                value={form.unit}
                onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
              />
            </div>
          </div>

          {/* Usage Frequency */}
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Usage Frequency</Label>
            <Select
              value={form.usage_frequency}
              onValueChange={(v) => setForm((f) => ({ ...f, usage_frequency: v as UsageFrequency }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="How often do you use this?" />
              </SelectTrigger>
              <SelectContent>
                {FREQUENCIES.map(({ value, label }) => (
                  <SelectItem key={value} value={value}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Expiry Date */}
          <div className="space-y-1.5">
            <Label htmlFor="expiry_date" className="text-xs text-muted-foreground">
              Expiry Date <span className="text-muted-foreground/60">(optional)</span>
            </Label>
            <Input
              id="expiry_date"
              type="date"
              value={form.expiry_date}
              onChange={(e) => setForm((f) => ({ ...f, expiry_date: e.target.value }))}
              className="h-10 text-sm [color-scheme:dark]"
            />
          </div>

          {error && <p className="text-xs text-destructive">{error}</p>}

          <DialogFooter className="gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => handleOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={saving}>
              {saving ? "Adding…" : "Add Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}

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
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { AlertTriangle } from "lucide-react"
import { UNIT_GROUPS, normalizeUnit } from "@/lib/logic/units"
import { isValidDateString, isValidQuantity, isValidWeight, sanitizeText } from "@/lib/logic/validate"
import type { Category, UsageFrequency, InventoryItem } from "@/lib/supabase/types"

export type AddItemPayload = Omit<
  InventoryItem,
  | "id"
  | "user_id"
  | "household_id"
  | "last_updated"
  | "predicted_empty_date"
  | "consumption_velocity_per_day"
  | "historical_lifespans"
  | "tracking_state"
  | "priority_tier"
  | "last_purchased_timestamp"
  | "volume_multiplier"
> & {
  /** Only present when the form is shown with showQuantity (shopping list). */
  quantity?: number
}

export interface AddItemPrefill {
  item_name?: string
  brand?: string
  category?: Category | ""
  original_weight?: string
  unit?: string
  usage_frequency?: UsageFrequency | ""
  barcode?: string
  expiry_date?: string
  quantity?: string
}

interface AddItemDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: AddItemPayload) => Promise<{ error?: string; success?: boolean }>
  prefill?: AddItemPrefill
  /** Informational banner shown above the form (e.g. lookup fallback messages). */
  notice?: string
  /** "edit" switches copy to Edit Item / Save Changes; the save action is whatever onAdd does. */
  mode?: "create" | "edit"
  /** Show a quantity field (how many units being bought), used by the shopping list. */
  showQuantity?: boolean
  /** Override the success toast/title wording, e.g. "Add to List". */
  title?: string
}

const CATEGORIES: Category[] = [
  "Fruits & Vegetables",
  "Bakery",
  "Grains & Pasta",
  "Deli & Meat",
  "Seafood",
  "Dairy & Eggs",
  "Frozen Foods",
  "Beverages",
  "Snacks",
  "Essentials",
  "Other",
]
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
  quantity: "1",
}

export function AddItemDialog({
  open,
  onOpenChange,
  onAdd,
  prefill,
  notice,
  mode = "create",
  showQuantity = false,
  title,
}: AddItemDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pendingPayload, setPendingPayload] = useState<AddItemPayload | null>(null)

  // Apply prefill whenever dialog opens with new prefill data
  useEffect(() => {
    if (open) {
      const merged = { ...EMPTY_FORM, ...(prefill ?? {}) }
      // Snap free-form units (barcode/vision results) to a dropdown value
      merged.unit = normalizeUnit(merged.unit) ?? "oz"
      setForm(merged)
      setError(null)
    }
  }, [open, prefill])

  function handleOpenChange(val: boolean) {
    if (!val) {
      setForm(EMPTY_FORM)
      setError(null)
      setPendingPayload(null)
    }
    onOpenChange(val)
  }

  async function doSave(payload: AddItemPayload) {
    setSaving(true)
    setError(null)
    const result = await onAdd(payload)
    setSaving(false)
    if (result.error) {
      setError(result.error)
    } else {
      handleOpenChange(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!sanitizeText(form.item_name)) return setError("Item name is required.")
    const originalWeight = parseFloat(form.original_weight)
    if (!isValidWeight(originalWeight)) return setError("Enter a valid weight.")
    if (form.expiry_date && !isValidDateString(form.expiry_date))
      return setError("Enter a valid expiry date.")

    let quantity: number | undefined
    if (showQuantity) {
      quantity = parseInt(form.quantity, 10) || 1
      if (!isValidQuantity(quantity)) return setError("Quantity must be between 1 and 99.")
    }

    const payload: AddItemPayload = {
      item_name: sanitizeText(form.item_name),
      brand: sanitizeText(form.brand) || null,
      category: (form.category as Category) || null,
      original_weight: originalWeight,
      current_weight: originalWeight,
      unit: form.unit || "oz",
      usage_frequency: (form.usage_frequency as UsageFrequency) || null,
      barcode: sanitizeText(form.barcode, 20) || null,
      image_url: null,
      expiry_date: form.expiry_date || null,
      ...(quantity !== undefined ? { quantity } : {}),
    }

    // Guard: if expiry date is before today, ask for confirmation first.
    if (payload.expiry_date) {
      const today = new Date()
      const todayStr = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0"),
      ].join("-")
      if (payload.expiry_date < todayStr) {
        setPendingPayload(payload)
        return
      }
    }

    await doSave(payload)
  }

  const heading = title ?? (mode === "edit" ? "Edit Item" : "Add Item")
  const submitLabel = mode === "edit" ? "Save Changes" : "Add Item"
  const savingLabel = mode === "edit" ? "Saving…" : "Adding…"

  return (
    <>
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="bg-card border-border max-w-sm w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{heading}</DialogTitle>
        </DialogHeader>

        {notice && (
          <p className="text-xs text-muted-foreground bg-secondary/60 border border-border rounded-lg p-3">
            {notice}
          </p>
        )}

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
              maxLength={120}
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
              maxLength={120}
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
              <Label className="text-xs text-muted-foreground">Unit</Label>
              <Select
                value={form.unit}
                onValueChange={(v) => setForm((f) => ({ ...f, unit: v }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Unit" />
                </SelectTrigger>
                <SelectContent>
                  {UNIT_GROUPS.map((group) => (
                    <SelectGroup key={group.label}>
                      <SelectLabel className="text-xs text-muted-foreground uppercase tracking-wider">
                        {group.label}
                      </SelectLabel>
                      {group.units.map((u) => (
                        <SelectItem key={u.value} value={u.value}>{u.label}</SelectItem>
                      ))}
                    </SelectGroup>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Quantity (shopping list variant) */}
          {showQuantity && (
            <div className="space-y-1.5">
              <Label htmlFor="quantity" className="text-xs text-muted-foreground">
                Quantity <span className="text-muted-foreground/60">(how many units)</span>
              </Label>
              <Input
                id="quantity"
                type="number"
                min="1"
                max="99"
                value={form.quantity}
                onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                inputMode="numeric"
              />
            </div>
          )}

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
              {saving ? savingLabel : submitLabel}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>

    {/* Expired-date confirmation dialog */}
    <Dialog
      open={pendingPayload !== null}
      onOpenChange={(v) => { if (!v) setPendingPayload(null) }}
    >
      <DialogContent className="bg-card border-border max-w-xs w-[calc(100vw-2rem)]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base">
            <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />
            Expired Item
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          This item appears to be expired. Are you sure you want to add it to your pantry?
        </p>
        <DialogFooter className="gap-2 pt-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPendingPayload(null)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button
            type="button"
            size="sm"
            disabled={saving}
            onClick={async () => {
              const payload = pendingPayload!
              setPendingPayload(null)
              await doSave(payload)
            }}
          >
            {saving ? "Adding…" : "Yes, Add Anyway"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  )
}

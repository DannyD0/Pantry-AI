"use client"

import { useState } from "react"
import { ScanLine, Sparkles, ChevronLeft, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { BarcodeScanner } from "./BarcodeScanner"
import { VisionUploader, type VisionResult } from "./VisionUploader"
import { AddItemDialog, type AddItemPrefill } from "@/components/inventory/AddItemDialog"
import { fetchBarcode } from "@/lib/logic/barcode"
import { useInventory } from "@/hooks/useInventory"
import { BottomNav } from "@/components/layout/BottomNav"
import type { Category } from "@/lib/supabase/types"

type Mode = "choose" | "barcode" | "vision"
type LookupStatus = "idle" | "loading" | "not_found" | "error"

/** Parse "500g", "16 oz", "1 lb" etc. into { weight, unit } */
function parseQuantityString(qty: string | null): { weight: string; unit: string } {
  if (!qty) return { weight: "", unit: "oz" }
  const match = qty.match(/^([\d.]+)\s*([a-zA-Z]+)/)
  if (match) {
    const raw = match[2].toLowerCase()
    // Normalise common unit aliases
    const unit = raw === "g" ? "g" : raw === "kg" ? "kg" : raw === "lb" || raw === "lbs" ? "lb" : raw === "ml" ? "ml" : raw === "l" ? "L" : raw
    return { weight: match[1], unit }
  }
  return { weight: "", unit: "oz" }
}

export function ScanView({ userId }: { userId: string }) {
  const { addItem } = useInventory(userId)
  const [mode, setMode] = useState<Mode>("choose")
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>("idle")
  const [lookupMsg, setLookupMsg] = useState<string | null>(null)
  const [addOpen, setAddOpen] = useState(false)
  const [prefill, setPrefill] = useState<AddItemPrefill | undefined>(undefined)

  // ── Barcode detected → look up Open Food Facts ───────────────────────────
  async function handleBarcodeDetected(barcode: string) {
    setMode("choose")
    setLookupStatus("loading")
    setLookupMsg(null)

    const result = await fetchBarcode(barcode)

    if (!result || !result.item_name) {
      setLookupStatus("not_found")
      setLookupMsg(`No product found for barcode ${barcode}. You can add it manually.`)
      // Open dialog with just the barcode pre-filled so user can complete it
      setPrefill({ barcode })
      setAddOpen(true)
      setLookupStatus("idle")
      return
    }

    const { weight, unit } = parseQuantityString(result.quantity)
    setPrefill({
      item_name: result.item_name,
      brand: result.brand ?? "",
      original_weight: weight,
      unit,
      barcode,
    })
    setLookupStatus("idle")
    setAddOpen(true)
  }

  // ── Vision result received ───────────────────────────────────────────────
  function handleVisionResult(result: VisionResult) {
    setMode("choose")
    setPrefill({
      item_name: result.item_name,
      category: (result.category as Category) ?? "",
      original_weight: result.estimated_quantity != null ? String(result.estimated_quantity) : "",
      unit: result.unit ?? "oz",
    })
    setAddOpen(true)
  }

  // ── After adding item, go back to choose ────────────────────────────────
  function handleAddOpenChange(open: boolean) {
    setAddOpen(open)
    if (!open) {
      setPrefill(undefined)
      setLookupStatus("idle")
      setLookupMsg(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border pt-safe">
        <div className="flex items-center gap-3 px-4 py-3">
          {mode !== "choose" && (
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={() => setMode("choose")}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          )}
          <div>
            <h1 className="text-lg font-bold tracking-tight">
              {mode === "choose" ? "Add via Scan" : mode === "barcode" ? "Scan Barcode" : "Photo ID"}
            </h1>
            <p className="text-xs text-muted-foreground">
              {mode === "choose"
                ? "Scan a barcode or take a photo"
                : mode === "barcode"
                ? "Point camera at product barcode"
                : "Identify item with Claude Vision"}
            </p>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 pb-nav max-w-md mx-auto">

        {/* Loading state while fetching barcode */}
        {lookupStatus === "loading" && (
          <div className="flex flex-col items-center gap-4 py-16">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-muted-foreground">Looking up product…</p>
          </div>
        )}

        {/* Choose mode */}
        {lookupStatus !== "loading" && mode === "choose" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground text-center">
              Scan a barcode to auto-fill product info, or take a photo for AI identification.
            </p>

            {/* Barcode option */}
            <button
              type="button"
              onClick={() => setMode("barcode")}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:bg-secondary/40 active:scale-[0.98] transition-all text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <ScanLine className="h-7 w-7 text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">Scan Barcode</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Use your camera to scan a UPC or EAN barcode. Auto-fills name, brand, and size.
                </p>
              </div>
            </button>

            {/* Vision option */}
            <button
              type="button"
              onClick={() => setMode("vision")}
              className="w-full flex items-center gap-4 p-5 rounded-2xl border border-border bg-card hover:bg-secondary/40 active:scale-[0.98] transition-all text-left"
            >
              <div className="w-14 h-14 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                <Sparkles className="h-7 w-7 text-purple-400" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold">Photo ID</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Take a photo of any grocery item. Claude Vision identifies it and suggests category.
                </p>
              </div>
            </button>

            {/* Success hint if lookup previously found something */}
            {lookupMsg && lookupStatus === "not_found" && (
              <div className="flex items-start gap-2 text-xs text-muted-foreground bg-secondary/50 rounded-lg p-3">
                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-muted-foreground" />
                <span>{lookupMsg}</span>
              </div>
            )}
          </div>
        )}

        {/* Barcode scanner */}
        {lookupStatus !== "loading" && mode === "barcode" && (
          <BarcodeScanner
            onDetect={handleBarcodeDetected}
            onCancel={() => setMode("choose")}
          />
        )}

        {/* Vision uploader */}
        {lookupStatus !== "loading" && mode === "vision" && (
          <VisionUploader
            onIdentify={handleVisionResult}
            onCancel={() => setMode("choose")}
          />
        )}
      </main>

      {/* Add Item dialog — shared between both flows */}
      <AddItemDialog
        open={addOpen}
        onOpenChange={handleAddOpenChange}
        onAdd={addItem}
        prefill={prefill}
      />

      <BottomNav />
    </div>
  )
}

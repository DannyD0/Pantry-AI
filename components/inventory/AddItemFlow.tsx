"use client"

import { useState } from "react"
import { ChevronLeft, PencilLine, ScanLine, Sparkles } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { BarcodeScanner } from "@/components/scan/BarcodeScanner"
import { VisionUploader, type VisionResult } from "@/components/scan/VisionUploader"
import { AddItemDialog, type AddItemPayload, type AddItemPrefill } from "./AddItemDialog"
import { fetchBarcode } from "@/lib/logic/barcode"
import type { Category } from "@/lib/supabase/types"

type Stage = "choose" | "barcode" | "vision" | "lookup" | "form"

const NOT_FOUND_MSG =
  "We couldn't find this product. No worries, fill in the details below and we'll save it for next time."
const TIMEOUT_MSG = "Lookup is taking too long. You can fill in the details manually."
const ERROR_MSG = "Lookup failed. You can fill in the details manually."

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

interface AddItemFlowProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onAdd: (item: AddItemPayload) => Promise<{ error?: string; success?: boolean }>
}

/**
 * Full add-item flow: a 3-option chooser (Manual / Scan Barcode / AI Vision),
 * where scan and vision feed a pre-filled Add Item form.
 */
export function AddItemFlow({ open, onOpenChange, onAdd }: AddItemFlowProps) {
  const [stage, setStage] = useState<Stage>("choose")
  const [prefill, setPrefill] = useState<AddItemPrefill | undefined>(undefined)
  const [notice, setNotice] = useState<string | undefined>(undefined)

  function close() {
    onOpenChange(false)
    setStage("choose")
    setPrefill(undefined)
    setNotice(undefined)
  }

  function handleChooserOpenChange(val: boolean) {
    if (!val) close()
  }

  function openForm(pre?: AddItemPrefill, msg?: string) {
    setPrefill(pre)
    setNotice(msg)
    setStage("form")
  }

  async function handleBarcodeDetected(barcode: string) {
    setStage("lookup")
    const result = await fetchBarcode(barcode)

    if (result.status === "found") {
      const { weight, unit } = parseQuantityString(result.product.quantity)
      openForm({
        item_name: result.product.item_name,
        brand: result.product.brand ?? "",
        original_weight: weight,
        unit,
        barcode,
        expiry_date: result.product.expiry_date ?? "",
      })
      return
    }

    const msg =
      result.status === "not_found" ? NOT_FOUND_MSG :
      result.status === "timeout" ? TIMEOUT_MSG : ERROR_MSG
    openForm({ barcode }, msg)
  }

  function handleVisionResult(result: VisionResult) {
    openForm({
      item_name: result.item_name,
      category: (result.category as Category) ?? "",
      original_weight: result.estimated_quantity != null ? String(result.estimated_quantity) : "",
      unit: result.unit ?? "oz",
    })
  }

  function handleFormOpenChange(val: boolean) {
    if (!val) close()
  }

  return (
    <>
      {/* Chooser / Scanner / Vision / Lookup dialog */}
      <Dialog open={open && stage !== "form"} onOpenChange={handleChooserOpenChange}>
        <DialogContent className="bg-card border-border max-w-sm w-[calc(100vw-2rem)] max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {stage !== "choose" && stage !== "lookup" && (
                <button
                  type="button"
                  onClick={() => setStage("choose")}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Back"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              )}
              {stage === "barcode" ? "Scan Barcode" : stage === "vision" ? "AI Vision" : "Add Item"}
            </DialogTitle>
          </DialogHeader>

          {stage === "choose" && (
            <div className="space-y-3 py-1">
              {/* Manual entry */}
              <button
                type="button"
                onClick={() => openForm()}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-background hover:bg-secondary/40 active:scale-[0.98] transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center shrink-0">
                  <PencilLine className="h-6 w-6 text-foreground" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Manual entry</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Type in the item details yourself.
                  </p>
                </div>
              </button>

              {/* Scan barcode */}
              <button
                type="button"
                onClick={() => setStage("barcode")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-background hover:bg-secondary/40 active:scale-[0.98] transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                  <ScanLine className="h-6 w-6 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Scan Barcode</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Auto-fill name, brand, and size from the barcode.
                  </p>
                </div>
              </button>

              {/* AI Vision */}
              <button
                type="button"
                onClick={() => setStage("vision")}
                className="w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-background hover:bg-secondary/40 active:scale-[0.98] transition-all text-left"
              >
                <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                  <Sparkles className="h-6 w-6 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-sm">Use AI Vision</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Snap a photo and let AI identify the item.
                  </p>
                </div>
              </button>

              <Button
                variant="ghost"
                size="sm"
                className="w-full text-muted-foreground"
                onClick={close}
              >
                Cancel
              </Button>
            </div>
          )}

          {stage === "barcode" && (
            <BarcodeScanner
              onDetect={handleBarcodeDetected}
              onCancel={() => setStage("choose")}
            />
          )}

          {stage === "vision" && (
            <VisionUploader
              onIdentify={handleVisionResult}
              onCancel={() => setStage("choose")}
            />
          )}

          {stage === "lookup" && (
            <div className="flex flex-col items-center gap-4 py-10">
              <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-sm text-muted-foreground">Looking up product…</p>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Pre-filled add item form */}
      <AddItemDialog
        open={open && stage === "form"}
        onOpenChange={handleFormOpenChange}
        onAdd={onAdd}
        prefill={prefill}
        notice={notice}
      />
    </>
  )
}

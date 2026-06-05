"use client"

import { useRef, useState, useEffect } from "react"
import { Camera, ImagePlus, X, Loader2, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { Category } from "@/lib/supabase/types"

export interface VisionResult {
  item_name: string
  category: Category | null
  estimated_quantity: number | null
  unit: string | null
}

interface VisionUploaderProps {
  onIdentify: (result: VisionResult) => void
  onCancel: () => void
}

const LOADING_MESSAGES = [
  "Scanning your haul...",
  "Checking the shelves...",
  "Inspecting your groceries...",
  "Reading the fine print...",
  "Sniffing out your items...",
  "Checking the sell-by date...",
]

type UploadStatus = "idle" | "loading" | "error"

export function VisionUploader({ onIdentify, onCancel }: VisionUploaderProps) {
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const galleryInputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<UploadStatus>("idle")
  const [preview, setPreview] = useState<string | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [msgIndex, setMsgIndex] = useState(0)

  useEffect(() => {
    if (status !== "loading") return
    setMsgIndex(Math.floor(Math.random() * LOADING_MESSAGES.length))
    const interval = setInterval(() => {
      setMsgIndex((i) => (i + 1) % LOADING_MESSAGES.length)
    }, 1800)
    return () => clearInterval(interval)
  }, [status])

  async function handleFile(file: File) {
    if (!file.type.startsWith("image/")) {
      setErrorMsg("Please select an image file.")
      return
    }

    setPreview(URL.createObjectURL(file))
    setStatus("loading")
    setErrorMsg(null)

    const formData = new FormData()
    formData.append("image", file)

    try {
      const res = await fetch("/api/vision", { method: "POST", body: formData })
      const data = await res.json()

      if (!res.ok || data.error) {
        setStatus("error")
        setErrorMsg(data.error ?? "Vision analysis failed. Try again or add manually.")
        return
      }

      setStatus("idle")
      onIdentify({
        item_name: data.item_name ?? "",
        category: data.category ?? null,
        estimated_quantity: typeof data.estimated_quantity === "number" ? data.estimated_quantity : null,
        unit: data.unit ?? null,
      })
    } catch {
      setStatus("error")
      setErrorMsg("Network error. Check your connection and try again.")
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    // Reset so same file can be re-selected
    e.target.value = ""
  }

  function reset() {
    setStatus("idle")
    setPreview(null)
    setErrorMsg(null)
  }

  // ── Loading state ────────────────────────────────────────────────────────
  if (status === "loading") {
    return (
      <div className="flex flex-col items-center gap-5 py-8">
        {preview && (
          <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-border">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Analyzing" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          </div>
        )}
        <div className="text-center space-y-1">
          <p className="font-semibold text-sm">Identifying item…</p>
          <p className="text-xs text-muted-foreground transition-all duration-300">
            {LOADING_MESSAGES[msgIndex]}
          </p>
        </div>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    )
  }

  // ── Error state ──────────────────────────────────────────────────────────
  if (status === "error") {
    return (
      <div className="flex flex-col items-center gap-5 py-6">
        {preview && (
          <div className="relative w-36 h-36 rounded-xl overflow-hidden border border-border opacity-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Failed" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-start gap-2 text-sm bg-destructive/10 border border-destructive/20 rounded-lg p-3 max-w-xs">
          <AlertTriangle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
          <span className="text-destructive text-xs">{errorMsg}</span>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={reset}>
            Try Again
          </Button>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  // ── Idle: pick source ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground text-center px-2">
        Take a photo or choose from your gallery. Claude Vision will identify the grocery item.
      </p>

      <div className="grid grid-cols-2 gap-3">
        {/* Take photo (mobile camera) */}
        <button
          type="button"
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card hover:bg-secondary/50 active:scale-95 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
            <Camera className="h-6 w-6 text-primary" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Camera</p>
            <p className="text-xs text-muted-foreground">Take a photo</p>
          </div>
        </button>

        {/* Choose from gallery */}
        <button
          type="button"
          onClick={() => galleryInputRef.current?.click()}
          className="flex flex-col items-center gap-3 p-5 rounded-xl border border-border bg-card hover:bg-secondary/50 active:scale-95 transition-all"
        >
          <div className="w-12 h-12 rounded-xl bg-secondary flex items-center justify-center">
            <ImagePlus className="h-6 w-6 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="text-sm font-medium">Gallery</p>
            <p className="text-xs text-muted-foreground">Choose image</p>
          </div>
        </button>
      </div>

      <Button variant="ghost" size="sm" className="text-muted-foreground mx-auto" onClick={onCancel}>
        <X className="h-3.5 w-3.5 mr-1.5" />
        Cancel
      </Button>

      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleInputChange}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleInputChange}
      />
    </div>
  )
}

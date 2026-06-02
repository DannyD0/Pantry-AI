"use client"

import { useEffect, useRef, useState } from "react"
import { Scan, X, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Minimal type declaration for BarcodeDetector Web API
interface BarcodeDetectorResult {
  rawValue: string
  format: string
}
interface BarcodeDetectorAPI {
  detect(source: HTMLVideoElement): Promise<BarcodeDetectorResult[]>
}
declare global {
  interface Window {
    BarcodeDetector?: {
      new(options?: { formats: string[] }): BarcodeDetectorAPI
      getSupportedFormats?(): Promise<string[]>
    }
  }
}

type ScannerStatus = "checking" | "unsupported" | "requesting" | "active" | "detected" | "error"

interface BarcodeScannerProps {
  onDetect: (barcode: string) => void
  onCancel: () => void
}

export function BarcodeScanner({ onDetect, onCancel }: BarcodeScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const detectorRef = useRef<BarcodeDetectorAPI | null>(null)
  const calledRef = useRef(false)

  const [status, setStatus] = useState<ScannerStatus>("checking")
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [manualCode, setManualCode] = useState("")
  const [showManual, setShowManual] = useState(false)
  const [detectedValue, setDetectedValue] = useState<string | null>(null)

  useEffect(() => {
    calledRef.current = false
    if (!window.BarcodeDetector) {
      setStatus("unsupported")
      return
    }

    let detector: BarcodeDetectorAPI
    try {
      detector = new window.BarcodeDetector({
        formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"],
      })
      detectorRef.current = detector
    } catch {
      setStatus("unsupported")
      return
    }

    setStatus("requesting")
    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } } })
      .then((stream) => {
        streamRef.current = stream
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          videoRef.current.play().then(() => {
            setStatus("active")
            scheduleScan()
          })
        }
      })
      .catch((err: Error) => {
        setStatus("error")
        setErrorMsg(
          err.name === "NotAllowedError"
            ? "Camera permission denied. Allow camera access or enter the barcode manually."
            : "Could not access camera. Enter the barcode manually."
        )
      })

    return () => stopCamera()
  }, [])

  function stopCamera() {
    if (timerRef.current) clearTimeout(timerRef.current)
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
  }

  function scheduleScan() {
    timerRef.current = setTimeout(runScan, 350)
  }

  async function runScan() {
    if (calledRef.current || !detectorRef.current || !videoRef.current) return
    if (videoRef.current.readyState < 2) {
      scheduleScan()
      return
    }
    try {
      const results = await detectorRef.current.detect(videoRef.current)
      if (results.length > 0 && !calledRef.current) {
        calledRef.current = true
        const code = results[0].rawValue
        setDetectedValue(code)
        setStatus("detected")
        stopCamera()
        // Short pause so user sees the detected state before dialog opens
        setTimeout(() => onDetect(code), 600)
      } else {
        scheduleScan()
      }
    } catch {
      scheduleScan()
    }
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = manualCode.trim()
    if (!code) return
    stopCamera()
    onDetect(code)
  }

  // ── Unsupported / Error ──────────────────────────────────────────────────
  if (status === "unsupported" || status === "error") {
    return (
      <div className="flex flex-col items-center gap-6 py-6">
        <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
          <Scan className="h-7 w-7 text-muted-foreground" />
        </div>
        <div className="text-center space-y-1 px-4">
          <p className="font-semibold text-sm">
            {status === "unsupported" ? "Scanner not supported" : "Camera unavailable"}
          </p>
          <p className="text-xs text-muted-foreground">
            {status === "unsupported"
              ? "Your browser doesn't support the Barcode API. Enter the UPC/barcode number manually."
              : errorMsg}
          </p>
        </div>
        <form onSubmit={handleManualSubmit} className="w-full max-w-xs space-y-3 px-4">
          <div className="space-y-1.5">
            <Label htmlFor="manual_code" className="text-xs text-muted-foreground">Barcode / UPC</Label>
            <Input
              id="manual_code"
              placeholder="e.g. 0123456789012"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              inputMode="numeric"
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full" size="sm" disabled={!manualCode.trim()}>
            Look Up Product
          </Button>
        </form>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    )
  }

  // ── Requesting / Loading ─────────────────────────────────────────────────
  if (status === "requesting" || status === "checking") {
    return (
      <div className="flex flex-col items-center gap-4 py-12">
        <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <p className="text-sm text-muted-foreground">Starting camera…</p>
        <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    )
  }

  // ── Active Scanning / Detected ───────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4">
      {/* Viewfinder */}
      <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-[4/3]">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
        />

        {/* Scanning frame overlay */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative w-52 h-32">
            {/* Corner brackets */}
            <span className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-primary rounded-tl-sm" />
            <span className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-primary rounded-tr-sm" />
            <span className="absolute bottom-0 left-0 w-6 h-6 border-b-2 border-l-2 border-primary rounded-bl-sm" />
            <span className="absolute bottom-0 right-0 w-6 h-6 border-b-2 border-r-2 border-primary rounded-br-sm" />

            {/* Scan line */}
            {status === "active" && (
              <div className="absolute left-1 right-1 top-1/2 h-px bg-primary/70 animate-pulse" />
            )}

            {/* Detected flash */}
            {status === "detected" && (
              <div className="absolute inset-0 rounded-sm bg-primary/20 flex items-center justify-center">
                <span className="text-xs font-mono text-primary font-bold tracking-wider">
                  {detectedValue}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Dim edges */}
        <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 bg-black/40 hover:bg-black/60 text-white"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Status label */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
          <span className="text-xs text-white/80 bg-black/50 px-3 py-1 rounded-full">
            {status === "detected" ? "Barcode detected!" : "Align barcode within frame"}
          </span>
        </div>
      </div>

      {/* Manual fallback toggle */}
      {!showManual ? (
        <Button
          variant="ghost"
          size="sm"
          className="text-muted-foreground gap-1.5 mx-auto"
          onClick={() => setShowManual(true)}
        >
          <Keyboard className="h-3.5 w-3.5" />
          Enter barcode manually
        </Button>
      ) : (
        <form onSubmit={handleManualSubmit} className="flex gap-2">
          <Input
            placeholder="Enter UPC / barcode"
            value={manualCode}
            onChange={(e) => setManualCode(e.target.value)}
            inputMode="numeric"
            className="flex-1"
            autoFocus
          />
          <Button type="submit" size="sm" disabled={!manualCode.trim()}>
            Go
          </Button>
        </form>
      )}
    </div>
  )
}

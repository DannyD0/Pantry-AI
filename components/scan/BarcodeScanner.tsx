"use client"

import { useEffect, useRef, useState } from "react"
import { Scan, X, Keyboard } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

// Minimal interface shared by the native BarcodeDetector and the ponyfill
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
      new (options?: { formats: string[] }): BarcodeDetectorAPI
      getSupportedFormats?(): Promise<string[]>
    }
  }
}

const BARCODE_FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39", "qr_code"]

type ScannerStatus = "starting" | "active" | "detected" | "failed"
type FailReason = "denied" | "unsupported" | "hardware"

const FAIL_MESSAGES: Record<FailReason, string> = {
  denied:
    "Camera access was denied. You can enter the barcode number manually below.",
  unsupported:
    "Barcode scanning isn't supported on this browser. Try opening Remto in Chrome or Safari, or enter the barcode manually.",
  hardware:
    "We couldn't access your camera. Please check your device settings or enter the barcode manually.",
}

/**
 * Returns a BarcodeDetector: native where available (Chrome/Android),
 * otherwise the zxing-wasm ponyfill (iOS Safari, Firefox).
 */
async function getDetector(): Promise<BarcodeDetectorAPI | null> {
  try {
    if (window.BarcodeDetector) {
      return new window.BarcodeDetector({ formats: BARCODE_FORMATS })
    }
    const { BarcodeDetector } = await import("barcode-detector/ponyfill")
    return new BarcodeDetector({
      formats: BARCODE_FORMATS as never[],
    }) as unknown as BarcodeDetectorAPI
  } catch {
    return null
  }
}

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
  const cancelledRef = useRef(false)

  const [status, setStatus] = useState<ScannerStatus>("starting")
  const [failReason, setFailReason] = useState<FailReason>("hardware")
  const [manualCode, setManualCode] = useState("")
  const [showManual, setShowManual] = useState(false)
  const [detectedValue, setDetectedValue] = useState<string | null>(null)

  useEffect(() => {
    calledRef.current = false
    cancelledRef.current = false

    async function start() {
      // 1. Camera first: getUserMedia with rear camera (works on iOS Safari)
      if (!navigator.mediaDevices?.getUserMedia) {
        setFailReason("unsupported")
        setStatus("failed")
        return
      }

      let stream: MediaStream
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        })
      } catch (err) {
        const name = err instanceof DOMException ? err.name : ""
        setFailReason(name === "NotAllowedError" || name === "SecurityError" ? "denied" : "hardware")
        setStatus("failed")
        return
      }

      if (cancelledRef.current) {
        stream.getTracks().forEach((t) => t.stop())
        return
      }
      streamRef.current = stream

      const video = videoRef.current
      if (video) {
        video.srcObject = stream
        // iOS Safari requires playsinline + muted to autoplay inline
        video.setAttribute("playsinline", "true")
        video.muted = true
        try {
          await video.play()
        } catch {
          // play() can be interrupted on unmount, ignore
        }
      }

      // 2. Detector: native or ponyfill
      const detector = await getDetector()
      if (cancelledRef.current) return
      if (!detector) {
        stopCamera()
        setFailReason("unsupported")
        setStatus("failed")
        return
      }
      detectorRef.current = detector
      setStatus("active")
      scheduleScan()
    }

    start()
    return () => {
      cancelledRef.current = true
      stopCamera()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    if (cancelledRef.current || calledRef.current || !detectorRef.current || !videoRef.current) return
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
    const code = manualCode.trim().replace(/\D/g, "")
    if (!code || code.length > 20) return
    stopCamera()
    onDetect(code)
  }

  // The <video> element stays mounted across every status so `videoRef` is
  // always attached by the time the camera stream is ready — mounting it only
  // in the "active" branch meant the stream was attached to a null ref and
  // silently dropped (no error, just a permanently blank feed).
  return (
    <div className="flex flex-col gap-4">
      {/* Viewfinder */}
      <div className="relative w-full overflow-hidden rounded-xl bg-black aspect-[4/3]">
        <video
          ref={videoRef}
          className="absolute inset-0 w-full h-full object-cover"
          playsInline
          muted
          autoPlay
        />

        {(status === "active" || status === "detected") && (
          <>
            {/* Dim edges (behind the scan frame so the frame stays crisp) */}
            <div className="absolute inset-0 [background:radial-gradient(ellipse_at_center,transparent_40%,rgba(0,0,0,0.55)_100%)]" />

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

            {/* Status label */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2">
              <span className="text-xs text-white/80 bg-black/50 px-3 py-1 rounded-full">
                {status === "detected" ? "Barcode detected!" : "Align barcode within frame"}
              </span>
            </div>
          </>
        )}

        {/* Starting overlay */}
        {status === "starting" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-black/70">
            <div className="w-12 h-12 rounded-full border-2 border-primary border-t-transparent animate-spin" />
            <p className="text-sm text-white/80">Starting camera…</p>
          </div>
        )}

        {/* Failed overlay: denied / unsupported / hardware, inline message + manual entry */}
        {status === "failed" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-black/90 py-6 overflow-y-auto">
            <div className="w-14 h-14 rounded-2xl bg-secondary flex items-center justify-center">
              <Scan className="h-7 w-7 text-muted-foreground" />
            </div>
            <div className="text-center space-y-1 px-4">
              <p className="font-semibold text-sm text-white">
                {failReason === "unsupported"
                  ? "Scanner not supported"
                  : failReason === "denied"
                  ? "Camera access denied"
                  : "Camera unavailable"}
              </p>
              <p className="text-xs text-white/70">{FAIL_MESSAGES[failReason]}</p>
            </div>
            <form onSubmit={handleManualSubmit} className="w-full max-w-xs space-y-3 px-4">
              <div className="space-y-1.5">
                <Label htmlFor="manual_code" className="text-xs text-white/70">Barcode / UPC</Label>
                <Input
                  id="manual_code"
                  placeholder="e.g. 0123456789012"
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  inputMode="numeric"
                  maxLength={20}
                  autoFocus
                />
              </div>
              <Button type="submit" className="w-full" size="sm" disabled={!manualCode.trim()}>
                Look Up Product
              </Button>
            </form>
          </div>
        )}

        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 bg-black/40 hover:bg-black/60 text-white"
          onClick={onCancel}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Manual fallback toggle (only while actively scanning; "failed" has its own form above) */}
      {(status === "active" || status === "detected") && (
        !showManual ? (
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
              maxLength={20}
              className="flex-1"
              autoFocus
            />
            <Button type="submit" size="sm" disabled={!manualCode.trim()}>
              Go
            </Button>
          </form>
        )
      )}
    </div>
  )
}

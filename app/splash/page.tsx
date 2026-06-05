"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function SplashPage() {
  const router = useRouter()
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 1700)
    const navTimer = setTimeout(() => router.replace("/"), 2100)
    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(navTimer)
    }
  }, [router])

  return (
    <main
      className={`fixed inset-0 bg-background flex flex-col items-center justify-center transition-opacity duration-400 ${
        fading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-5 animate-scale-in">
        {/* Logo mark */}
        <div className="w-20 h-20 rounded-[28px] bg-primary/10 border border-primary/20 flex items-center justify-center">
          <span className="text-4xl select-none">🛒</span>
        </div>

        {/* Wordmark */}
        <div className="text-center space-y-1.5 animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <h1 className="text-3xl font-bold tracking-tight">Pantry AI</h1>
          <p className="text-sm text-muted-foreground">Smart pantry tracking</p>
        </div>
      </div>

      {/* Bottom branding */}
      <p className="absolute bottom-12 text-[11px] text-muted-foreground/40 animate-fade-in" style={{ animationDelay: "0.5s" }}>
        Powered by AI
      </p>
    </main>
  )
}

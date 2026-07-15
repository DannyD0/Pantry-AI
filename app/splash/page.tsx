"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart } from "lucide-react"

export default function SplashPage() {
  const router = useRouter()
  const [fading, setFading] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFading(true), 2000)
    const navTimer = setTimeout(() => router.replace("/"), 2400)
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
        <ShoppingCart className="w-16 h-16 text-green-500" strokeWidth={1.75} />

        {/* Wordmark */}
        <div className="text-center space-y-1.5 animate-fade-in" style={{ animationDelay: "0.25s" }}>
          <h1 className="text-3xl font-bold tracking-tight">Remto</h1>
          <p className="text-sm text-muted-foreground">Semad Tech</p>
        </div>
      </div>
    </main>
  )
}

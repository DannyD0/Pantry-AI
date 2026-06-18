"use client"

import { useEffect } from "react"
import { usePreferences } from "@/hooks/usePreferences"

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { prefs, loaded } = usePreferences()

  useEffect(() => {
    if (!loaded) return
    const html = document.documentElement
    const applyDark = () => { html.classList.add("dark"); html.classList.remove("light") }
    const applyLight = () => { html.classList.remove("dark"); html.classList.add("light") }

    if (prefs.theme === "dark") {
      applyDark()
    } else if (prefs.theme === "light") {
      applyLight()
    } else {
      const mq = window.matchMedia("(prefers-color-scheme: dark)")
      if (mq.matches) applyDark(); else applyLight()
      const handler = (e: MediaQueryListEvent) => e.matches ? applyDark() : applyLight()
      mq.addEventListener("change", handler)
      return () => mq.removeEventListener("change", handler)
    }
  }, [prefs.theme, loaded])

  return <>{children}</>
}

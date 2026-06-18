"use client"

import { useState, useEffect, useCallback } from "react"

export type UnitPref = "oz" | "g" | "lbs"
export type ThemePref = "system" | "light" | "dark"

export interface Preferences {
  unit: UnitPref
  theme: ThemePref
  notifications_on: boolean
}

const DEFAULTS: Preferences = {
  unit: "oz",
  theme: "light",
  notifications_on: true,
}

const KEY = "pantry_prefs"

export function usePreferences() {
  const [prefs, setPrefs] = useState<Preferences>(DEFAULTS)
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) setPrefs({ ...DEFAULTS, ...JSON.parse(raw) })
    } catch {}
    setLoaded(true)
  }, [])

  const save = useCallback((updates: Partial<Preferences>) => {
    setPrefs((prev) => {
      const next = { ...prev, ...updates }
      try { localStorage.setItem(KEY, JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  return { prefs, save, loaded }
}

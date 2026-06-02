"use client"

import { useState, useCallback } from "react"

export interface ToastMessage {
  id: string
  title: string
  icon?: string
}

export function useToast() {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const toast = useCallback((title: string) => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, title }])
    return id
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return { toasts, toast, dismiss }
}

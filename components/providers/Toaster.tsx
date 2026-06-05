"use client"

import { createContext, useCallback, useContext, useState } from "react"
import {
  ToastProvider,
  ToastViewport,
  Toast,
  ToastTitle,
  ToastClose,
} from "@/components/ui/toast"

type ToastVariant = "default" | "error"

interface ToastItem {
  id: string
  title: string
  variant: ToastVariant
}

interface ToastContextValue {
  toast: (title: string, variant?: ToastVariant) => void
}

const ToastContext = createContext<ToastContextValue>({ toast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function Toaster({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const toast = useCallback((title: string, variant: ToastVariant = "default") => {
    const id = Math.random().toString(36).slice(2)
    setToasts((prev) => [...prev, { id, title, variant }])
  }, [])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toast }}>
      <ToastProvider swipeDirection="down">
        {children}
        {toasts.map((t) => (
          <Toast
            key={t.id}
            duration={3000}
            onOpenChange={(open) => { if (!open) dismiss(t.id) }}
            className={t.variant === "error" ? "border-destructive/50 bg-destructive/10" : undefined}
          >
            <ToastTitle className="flex-1 text-sm font-medium">{t.title}</ToastTitle>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </ToastContext.Provider>
  )
}

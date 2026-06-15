"use client"

import Link from "next/link"
import { CircleUserRound } from "lucide-react"

/** Top-right profile button shown on every screen: opens the Settings page. */
export function ProfileButton({ className = "" }: { className?: string }) {
  return (
    <Link
      href="/settings"
      aria-label="Profile & settings"
      className={`inline-flex items-center justify-center h-9 w-9 rounded-full text-muted-foreground hover:text-foreground hover:bg-secondary/60 active:scale-95 transition-all shrink-0 ${className}`}
    >
      <CircleUserRound className="h-6 w-6" strokeWidth={1.75} />
    </Link>
  )
}

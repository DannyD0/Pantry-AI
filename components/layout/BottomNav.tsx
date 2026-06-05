"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Package, ScanLine, ShoppingCart, Settings } from "lucide-react"

const NAV_ITEMS = [
  { href: "/", icon: Home, label: "Home" },
  { href: "/inventory", icon: Package, label: "Pantry" },
  { href: "/scan", icon: ScanLine, label: "Scan" },
  { href: "/shopping", icon: ShoppingCart, label: "List" },
  { href: "/settings", icon: Settings, label: "Settings" },
] as const

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border pb-safe">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-1">
        {NAV_ITEMS.map(({ href, icon: Icon, label }) => {
          const isActive = pathname === href
          return (
            <Link
              key={href}
              href={href}
              className={`relative flex flex-col items-center justify-center gap-0.5 flex-1 h-full transition-colors ${
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full bg-primary" />
              )}
              <Icon
                className="h-[20px] w-[20px]"
                strokeWidth={isActive ? 2.5 : 1.75}
              />
              <span
                className={`text-[9px] font-semibold tracking-wide ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

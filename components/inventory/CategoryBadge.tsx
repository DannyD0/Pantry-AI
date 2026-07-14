"use client"

import { Badge } from "@/components/ui/badge"
import type { Category } from "@/lib/supabase/types"
import { cn } from "@/lib/utils"

const CATEGORY_STYLES: Record<Category, string> = {
  "Fruits & Vegetables": "bg-green-500/20 text-green-400 border-green-500/30",
  "Bakery":              "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Grains & Pasta":      "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  "Deli & Meat":         "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "Seafood":             "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  "Dairy & Eggs":        "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Frozen Foods":        "bg-sky-500/20 text-sky-400 border-sky-500/30",
  "Beverages":           "bg-pink-500/20 text-pink-400 border-pink-500/30",
  "Snacks":              "bg-red-500/20 text-red-400 border-red-500/30",
  "Essentials":          "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Other":               "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
}

interface CategoryBadgeProps {
  category: Category | null
  className?: string
}

export function CategoryBadge({ category, className }: CategoryBadgeProps) {
  if (!category) return null
  return (
    <Badge
      variant="outline"
      className={cn("text-[10px] font-medium px-1.5 py-0 border", CATEGORY_STYLES[category], className)}
    >
      {category}
    </Badge>
  )
}

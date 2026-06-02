"use client"

import Link from "next/link"
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  Plus,
  ScanLine,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { FuelGauge } from "@/components/inventory/FuelGauge"
import { useInventory } from "@/hooks/useInventory"
import { useShoppingList } from "@/hooks/useShoppingList"
import { BottomNav } from "@/components/layout/BottomNav"
import { getStockPercent } from "@/lib/logic/depletion"
import { useState } from "react"
import { AddItemDialog } from "@/components/inventory/AddItemDialog"

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
}

export function DashboardView({ userId }: { userId: string }) {
  const { items, loading: invLoading, addItem } = useInventory(userId)
  const { pending, loading: listLoading } = useShoppingList(userId)
  const [addOpen, setAddOpen] = useState(false)

  const loading = invLoading || listLoading

  const lowStock = items.filter((i) => getStockPercent(i.current_weight, i.original_weight) < 20)
  const totalItems = items.length
  const pendingCount = pending.length

  const allGood = !loading && lowStock.length === 0 && totalItems > 0
  const statusColor = lowStock.length > 0 ? "text-yellow-400" : totalItems === 0 ? "text-muted-foreground" : "text-green-400"
  const statusMsg = loading
    ? "Loading…"
    : lowStock.length > 0
    ? `${lowStock.length} item${lowStock.length > 1 ? "s" : ""} running low`
    : totalItems === 0
    ? "Add items to start tracking"
    : "Pantry looking good"

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 pb-nav max-w-lg mx-auto">
        {/* Hero header */}
        <div className="pt-14 pb-6 space-y-0.5">
          <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
            {greeting()}
          </p>
          <h1 className="text-3xl font-bold tracking-tight">Pantry AI</h1>
          <p className={`text-sm font-semibold mt-1 ${statusColor}`}>{statusMsg}</p>
        </div>

        {/* Stat cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          {loading ? (
            [1, 2, 3].map((i) => (
              <div key={i} className="h-[88px] rounded-2xl bg-card animate-pulse" />
            ))
          ) : (
            <>
              {/* Total items */}
              <Link
                href="/inventory"
                className="bg-card border border-border rounded-2xl p-3.5 flex flex-col gap-2 active:scale-[0.96] transition-transform"
              >
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <div className="text-2xl font-bold tabular-nums leading-none">{totalItems}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Total</div>
                </div>
              </Link>

              {/* Low stock */}
              <Link
                href="/inventory"
                className={`bg-card border rounded-2xl p-3.5 flex flex-col gap-2 active:scale-[0.96] transition-transform ${
                  lowStock.length > 0 ? "border-red-900/60" : "border-border"
                }`}
              >
                <AlertTriangle
                  className={`h-4 w-4 ${lowStock.length > 0 ? "text-red-400" : "text-muted-foreground"}`}
                />
                <div>
                  <div
                    className={`text-2xl font-bold tabular-nums leading-none ${
                      lowStock.length > 0 ? "text-red-400" : ""
                    }`}
                  >
                    {lowStock.length}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">Low stock</div>
                </div>
              </Link>

              {/* Shopping list */}
              <Link
                href="/shopping"
                className={`bg-card border rounded-2xl p-3.5 flex flex-col gap-2 active:scale-[0.96] transition-transform ${
                  pendingCount > 0 ? "border-primary/40" : "border-border"
                }`}
              >
                <ShoppingCart
                  className={`h-4 w-4 ${pendingCount > 0 ? "text-primary" : "text-muted-foreground"}`}
                />
                <div>
                  <div
                    className={`text-2xl font-bold tabular-nums leading-none ${
                      pendingCount > 0 ? "text-primary" : ""
                    }`}
                  >
                    {pendingCount}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">To buy</div>
                </div>
              </Link>
            </>
          )}
        </div>

        {/* Low stock preview */}
        {!loading && lowStock.length > 0 && (
          <section className="mb-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <TrendingDown className="h-3.5 w-3.5 text-red-400" />
                Running Low
              </h2>
              <Link
                href="/inventory"
                className="flex items-center gap-0.5 text-xs text-primary font-medium"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {lowStock.slice(0, 4).map((item) => {
                const pct = getStockPercent(item.current_weight, item.original_weight)
                const dateStr = item.predicted_empty_date
                  ? new Date(item.predicted_empty_date).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })
                  : null
                return (
                  <Link
                    key={item.id}
                    href="/inventory"
                    className="flex items-center gap-3 bg-card border border-red-900/30 rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{item.item_name}</span>
                        <div className="flex items-center gap-2 shrink-0">
                          {dateStr && (
                            <span className="text-[11px] text-muted-foreground">{dateStr}</span>
                          )}
                          <span className="text-xs font-bold text-red-400 tabular-nums">
                            {pct}%
                          </span>
                        </div>
                      </div>
                      <FuelGauge
                        currentWeight={item.current_weight}
                        originalWeight={item.original_weight}
                      />
                    </div>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

        {/* All-good state when pantry is full */}
        {allGood && (
          <div className="mb-6 flex items-center gap-3 bg-green-950/40 border border-green-900/40 rounded-2xl px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
            <p className="text-sm text-green-300 font-medium">
              All items well-stocked. Nothing to worry about.
            </p>
          </div>
        )}

        {/* Quick actions */}
        <section className="space-y-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Quick Add
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="h-12 gap-2 text-sm font-medium"
              onClick={() => setAddOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
            <Link href="/scan" className="block">
              <Button variant="outline" className="w-full h-12 gap-2 text-sm font-medium">
                <ScanLine className="h-4 w-4" />
                Scan
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <AddItemDialog open={addOpen} onOpenChange={setAddOpen} onAdd={addItem} />
      <BottomNav />
    </div>
  )
}

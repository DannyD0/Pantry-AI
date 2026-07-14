"use client"

import Link from "next/link"
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  Bell,
  CalendarClock,
} from "lucide-react"
import { FuelGauge } from "@/components/inventory/FuelGauge"
import { useInventory } from "@/hooks/useInventory"
import { useShoppingList } from "@/hooks/useShoppingList"
import { BottomNav } from "@/components/layout/BottomNav"
import { getStockPercent } from "@/lib/logic/depletion"
import { CheckInCard } from "@/components/dashboard/CheckInCard"

function greeting() {
  const h = new Date().getHours()
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"
}

export function DashboardView({ userId, householdId, userName }: { userId: string; householdId: string | null; userName: string }) {
  const {
    items,
    loading: invLoading,
    confirmEmpty,
    confirmStillHave,
    snoozeCheckIn,
  } = useInventory(userId, householdId)
  const { pending, loading: listLoading } = useShoppingList(userId, householdId)

  const loading = invLoading || listLoading

  const pendingVerification = items.filter((i) => i.tracking_state === "PENDING_VERIFICATION")
  const activeItems = items.filter((i) => i.tracking_state !== "EMPTY")

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const sevenDaysOut = new Date(today)
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7)
  const expiringSoon = activeItems
    .filter((i) => {
      if (!i.expiry_date) return false
      const exp = new Date(i.expiry_date)
      exp.setHours(0, 0, 0, 0)
      return exp <= sevenDaysOut
    })
    .sort((a, b) => new Date(a.expiry_date!).getTime() - new Date(b.expiry_date!).getTime())
  const lowStock = activeItems.filter((i) => getStockPercent(i.current_weight, i.original_weight) < 20)
  const totalItems = activeItems.length
  const pendingCount = pending.length

  const pantryTitle = userName.trim() ? `${userName}'s Pantry` : "My Pantry"

  const allGood = !loading && lowStock.length === 0 && pendingVerification.length === 0 && totalItems > 0
  const statusColor =
    pendingVerification.length > 0
      ? "text-primary"
      : lowStock.length > 0
      ? "text-yellow-400"
      : totalItems === 0
      ? "text-muted-foreground"
      : "text-green-400"
  const statusMsg = loading
    ? "Loading…"
    : pendingVerification.length > 0
    ? `${pendingVerification.length} check-in${pendingVerification.length > 1 ? "s" : ""} needed`
    : lowStock.length > 0
    ? `${lowStock.length} item${lowStock.length > 1 ? "s" : ""} running low`
    : totalItems === 0
    ? "Add items to start tracking"
    : "Pantry looking good"

  return (
    <div className="min-h-screen bg-background">
      <main className="px-4 pb-nav max-w-lg mx-auto">
        {/* Hero header */}
        <div className="pt-14 pb-6">
          <div className="space-y-0.5 min-w-0">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-widest">
              Mento
            </p>
            <h1
              className="font-bold tracking-tight"
              style={{ fontSize: "clamp(1.4rem, 6vw, 1.875rem)", lineHeight: 1.15 }}
            >
              {pantryTitle}
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">{greeting()}</p>
            <p className={`text-sm font-semibold mt-1 ${statusColor}`}>{statusMsg}</p>
          </div>
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

        {/* Check-in cards */}
        {!loading && pendingVerification.length > 0 && (
          <section className="mb-6 space-y-2.5">
            <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Bell className="h-3.5 w-3.5 text-primary" />
              Check-ins needed
            </h2>
            <div className="space-y-2">
              {pendingVerification.map((item) => (
                <CheckInCard
                  key={item.id}
                  item={item}
                  onConfirmEmpty={confirmEmpty}
                  onConfirmStillHave={confirmStillHave}
                  onSnooze={snoozeCheckIn}
                />
              ))}
            </div>
          </section>
        )}

        {/* Expiring Soon */}
        {!loading && expiringSoon.length > 0 && (
          <section className="mb-6 space-y-2.5">
            <div className="flex items-center justify-between">
              <h2 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <CalendarClock className="h-3.5 w-3.5 text-orange-400" />
                Expiring Soon
              </h2>
              <Link href="/inventory" className="flex items-center gap-0.5 text-xs text-primary font-medium">
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {expiringSoon.slice(0, 3).map((item) => {
                const exp = new Date(item.expiry_date!)
                exp.setHours(0, 0, 0, 0)
                const diffDays = Math.round((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
                const isExpired = diffDays < 0
                const label = isExpired
                  ? "Expired"
                  : diffDays === 0
                  ? "Expires today"
                  : `${diffDays}d left`
                const textColor = isExpired || diffDays === 0 ? "text-red-500" : "text-orange-500"
                const borderColor = isExpired || diffDays === 0 ? "border-red-400/40" : "border-orange-400/40"
                return (
                  <Link
                    key={item.id}
                    href="/inventory"
                    className={`flex items-center justify-between bg-card border rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform ${borderColor}`}
                  >
                    <span className="text-sm font-medium truncate">{item.item_name}</span>
                    <span className={`text-xs font-bold shrink-0 ml-2 ${textColor}`}>{label}</span>
                  </Link>
                )
              })}
            </div>
          </section>
        )}

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
                    className="flex items-center gap-3 bg-card border border-red-400/40 rounded-xl px-3 py-2.5 active:scale-[0.98] transition-transform"
                  >
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium truncate">{item.item_name}</span>
                        {dateStr && (
                          <span className="text-[11px] text-muted-foreground shrink-0">{dateStr}</span>
                        )}
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

        {/* All-good state */}
        {allGood && (
          <div className="mb-6 flex items-center gap-3 bg-primary/10 border border-primary/20 rounded-2xl px-4 py-3">
            <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
            <p className="text-sm text-primary font-medium">
              All items well-stocked. Nothing to worry about.
            </p>
          </div>
        )}

      </main>

      <BottomNav />
    </div>
  )
}

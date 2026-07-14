"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Users, CheckCircle2 } from "lucide-react"
import { Button } from "@/components/ui/button"

export function JoinClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const code = searchParams.get("code") ?? ""

  const [status, setStatus] = useState<"idle" | "joining" | "success" | "error">("idle")
  const [errorMsg, setErrorMsg] = useState("")
  const [authed, setAuthed] = useState<boolean | null>(null)

  useEffect(() => {
    // Probe auth by hitting a known authenticated endpoint
    fetch("/api/household/invite", { method: "POST" })
      .then((r) => setAuthed(r.status !== 401))
      .catch(() => setAuthed(false))
  }, [])

  async function handleJoin() {
    if (!code) return
    setStatus("joining")
    try {
      const res = await fetch("/api/household/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const json = await res.json()
      if (!res.ok) {
        setErrorMsg(json.error ?? "Something went wrong.")
        setStatus("error")
        return
      }
      setStatus("success")
      setTimeout(() => router.push("/"), 1500)
    } catch {
      setErrorMsg("Network error. Please try again.")
      setStatus("error")
    }
  }

  if (authed === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 bg-primary/10 border border-primary/20 rounded-2xl flex items-center justify-center mx-auto">
            <Users className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Join Household</h1>
          {code ? (
            <p className="text-sm text-muted-foreground">
              You were invited to join a shared pantry on Mento.
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">No invite code found in this link.</p>
          )}
        </div>

        {code && (
          <div className="bg-secondary rounded-xl px-4 py-3 text-center">
            <p className="text-xs text-muted-foreground mb-1">Invite code</p>
            <p className="font-mono text-xl font-bold tracking-widest">{code}</p>
          </div>
        )}

        {status === "success" && (
          <div className="flex items-center justify-center gap-2 text-primary">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-semibold">Joined! Redirecting…</span>
          </div>
        )}

        {status === "error" && (
          <p className="text-sm text-destructive text-center">{errorMsg}</p>
        )}

        {!authed ? (
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground text-center">
              Sign in or create an account to join this household.
            </p>
            <Button className="w-full h-12" onClick={() => router.push("/login")}>
              Sign in / Sign up
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              After signing in, return to this link to join the household.
            </p>
          </div>
        ) : (
          code && status !== "success" && (
            <Button
              className="w-full h-12 text-base font-semibold"
              onClick={handleJoin}
              disabled={status === "joining"}
            >
              {status === "joining" ? "Joining…" : "Join This Household"}
            </Button>
          )
        )}

        {authed && (
          <button
            onClick={() => router.push("/")}
            className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
          >
            Go to my pantry instead
          </button>
        )}
      </div>
    </div>
  )
}

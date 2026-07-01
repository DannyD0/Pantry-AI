"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Copy, Check, Users } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithPassword, signInWithPasswordNoRedirect, signUpWithPassword } from "@/app/login/actions"
import { isValidEmail } from "@/lib/logic/validate"

type AuthMode = "signin" | "signup"
type Step = "form" | "household"
type HouseStep = "choose" | "invite" | "join"

export function LoginForm() {
  const router = useRouter()
  const [mode, setMode] = useState<AuthMode>("signin")
  const [step, setStep] = useState<Step>("form")
  const [houseStep, setHouseStep] = useState<HouseStep>("choose")

  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Household setup state
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  function switchMode(next: AuthMode) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidEmail(email)) { setError("Enter a valid email address."); return }
    if (password.length < 8) { setError("Password must be at least 8 characters."); return }
    if (mode === "signup" && !name.trim()) { setError("Enter your name."); return }
    setLoading(true)
    setError(null)

    if (mode === "signin") {
      const result = await signInWithPassword(email, password)
      if (result?.error) setError(result.error)
      // on success, signInWithPassword redirects; nothing more to do
    } else {
      const result = await signUpWithPassword(email, password, name.trim())
      if (result?.error) {
        setError(result.error)
      } else {
        // Sign in without redirecting so we can show the household setup step
        const signin = await signInWithPasswordNoRedirect(email, password)
        if (signin?.error) {
          setError("Account created, but sign-in failed. Please sign in with your new credentials.")
          setMode("signin")
        } else {
          setStep("household")
        }
      }
    }
    setLoading(false)
  }

  async function handleGenerateInvite() {
    setGeneratingInvite(true)
    try {
      const res = await fetch("/api/household/invite", { method: "POST" })
      const json = await res.json()
      if (!res.ok) return
      setInviteCode(json.invite_code)
      setInviteLink(json.link)
      setHouseStep("invite")
    } finally {
      setGeneratingInvite(false)
    }
  }

  async function handleCopy() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function handleJoinSubmit(e: React.FormEvent) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    setJoining(true)
    setJoinError(null)
    try {
      const res = await fetch("/api/household/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const json = await res.json()
      if (!res.ok) { setJoinError(json.error ?? "Invalid code."); return }
      router.push("/")
    } finally {
      setJoining(false)
    }
  }

  // ─── Household setup step ────────────────────────────────────────────────────

  if (step === "household") {
    return (
      <div className="space-y-5">
        <div className="space-y-1">
          <h2 className="text-xl font-bold tracking-tight">Set up your household</h2>
          <p className="text-sm text-muted-foreground">
            Invite someone to share your pantry, or keep it solo for now.
          </p>
        </div>

        {houseStep === "choose" && (
          <div className="space-y-3">
            <button
              onClick={handleGenerateInvite}
              disabled={generatingInvite}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 text-sm font-medium hover:bg-secondary/40 active:scale-[0.98] transition-all text-left"
            >
              <Users className="h-5 w-5 text-primary shrink-0" />
              <div>
                <p className="font-semibold">{generatingInvite ? "Generating…" : "Invite someone to your household"}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Share a link or code for them to join</p>
              </div>
            </button>

            <button
              onClick={() => setHouseStep("join")}
              className="w-full flex items-center gap-3 bg-card border border-border rounded-xl px-4 py-3.5 text-sm font-medium hover:bg-secondary/40 active:scale-[0.98] transition-all text-left"
            >
              <Users className="h-5 w-5 text-muted-foreground shrink-0" />
              <div>
                <p className="font-semibold">Join an existing household</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enter an invite code you received</p>
              </div>
            </button>

            <Button
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => router.push("/")}
            >
              Use it alone for now
            </Button>
          </div>
        )}

        {houseStep === "invite" && inviteCode && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Share this code or link, it expires in 7 days.</p>
            <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-3">
              <span className="font-mono text-lg font-bold tracking-widest flex-1">{inviteCode}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1"
                title="Copy link"
              >
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            {inviteLink && (
              <p className="text-xs text-muted-foreground break-all">{inviteLink}</p>
            )}
            <Button className="w-full" onClick={() => router.push("/")}>
              Done, go to my pantry
            </Button>
            <button
              onClick={() => setHouseStep("choose")}
              className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
          </div>
        )}

        {houseStep === "join" && (
          <form onSubmit={handleJoinSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-code">Invite code</Label>
              <Input
                id="join-code"
                placeholder="e.g. A3X7K9P2"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                className="h-12 text-base font-mono tracking-widest"
                maxLength={12}
                autoComplete="off"
              />
            </div>
            {joinError && <p className="text-sm text-destructive">{joinError}</p>}
            <Button type="submit" className="w-full h-12" disabled={joining || !joinCode.trim()}>
              {joining ? "Joining…" : "Join Household"}
            </Button>
            <button
              type="button"
              onClick={() => setHouseStep("choose")}
              className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
            >
              Back
            </button>
          </form>
        )}

        {houseStep !== "choose" && (
          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors pt-1"
          >
            Skip, use it alone for now
          </button>
        )}
      </div>
    )
  }

  // ─── Auth form ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-5">
      <div className="flex rounded-xl bg-secondary p-1 gap-1">
        <button
          onClick={() => switchMode("signin")}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
            mode === "signin"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign In
        </button>
        <button
          onClick={() => switchMode("signup")}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
            mode === "signup"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Sign Up
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {mode === "signup" && (
          <div className="space-y-2">
            <Label htmlFor="auth-name">Name</Label>
            <Input
              id="auth-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              autoComplete="name"
              className="h-12 text-base"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="auth-email">Email</Label>
          <Input
            id="auth-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            maxLength={254}
            autoComplete="email"
            className="h-12 text-base"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="auth-password">Password</Label>
          <div className="relative">
            <Input
              id="auth-password"
              type={showPw ? "text" : "password"}
              placeholder={mode === "signup" ? "Min. 8 characters" : "Your password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              maxLength={128}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className="h-12 text-base pr-11"
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              tabIndex={-1}
            >
              {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
          {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
        </Button>

        <button
          type="button"
          onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
          className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
        >
          {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
        </button>
      </form>
    </div>
  )
}

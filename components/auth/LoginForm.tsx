"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { sendMagicLink, signInWithPassword, signUpWithPassword } from "@/app/login/actions"

type AuthTab = "magic" | "password"
type PasswordMode = "signin" | "signup"

export function LoginForm() {
  const [tab, setTab] = useState<AuthTab>("magic")

  return (
    <div className="space-y-5">
      {/* Tab switcher */}
      <div className="flex rounded-xl bg-secondary p-1 gap-1">
        <button
          onClick={() => setTab("magic")}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
            tab === "magic"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Magic Link
        </button>
        <button
          onClick={() => setTab("password")}
          className={`flex-1 text-sm font-medium py-2 rounded-lg transition-colors ${
            tab === "password"
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Password
        </button>
      </div>

      {tab === "magic" ? <MagicLinkForm /> : <PasswordForm />}
    </div>
  )
}

function MagicLinkForm() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    const result = await sendMagicLink(email)
    if (result.error) setError(result.error)
    else setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
        <div className="text-2xl">📬</div>
        <p className="font-semibold">Check your inbox</p>
        <p className="text-sm text-muted-foreground">
          We sent a magic link to{" "}
          <span className="text-foreground font-medium">{email}</span>
        </p>
        <button
          onClick={() => { setSent(false); setEmail("") }}
          className="text-xs text-primary underline-offset-2 hover:underline"
        >
          Use a different email
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="magic-email">Email</Label>
        <Input
          id="magic-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-12 text-base"
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={loading}>
        {loading ? "Sending…" : "Send Magic Link"}
      </Button>
      <p className="text-xs text-center text-muted-foreground">
        No password needed. We'll email you a sign-in link.
      </p>
    </form>
  )
}

function PasswordForm() {
  const [mode, setMode] = useState<PasswordMode>("signin")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    setLoading(true)
    setError(null)

    if (mode === "signin") {
      const result = await signInWithPassword(email, password)
      // If we get here, redirect didn't fire — must be an error
      if (result?.error) setError(result.error)
    } else {
      const result = await signUpWithPassword(email, password)
      if (result?.error) setError(result.error)
      else if (result?.needsConfirmation) setConfirmed(true)
    }
    setLoading(false)
  }

  if (confirmed) {
    return (
      <div className="rounded-xl border border-border bg-card p-6 text-center space-y-3">
        <div className="text-2xl">✉️</div>
        <p className="font-semibold">Confirm your email</p>
        <p className="text-sm text-muted-foreground">
          We sent a confirmation link to{" "}
          <span className="text-foreground font-medium">{email}</span>
        </p>
        <button
          onClick={() => { setConfirmed(false); setMode("signin") }}
          className="text-xs text-primary underline-offset-2 hover:underline"
        >
          Back to sign in
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pw-email">Email</Label>
        <Input
          id="pw-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
          className="h-12 text-base"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="pw-password">Password</Label>
        <div className="relative">
          <Input
            id="pw-password"
            type={showPw ? "text" : "password"}
            placeholder={mode === "signup" ? "Min. 8 characters" : "Your password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
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
        onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setError(null) }}
        className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
      >
        {mode === "signin" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </form>
  )
}

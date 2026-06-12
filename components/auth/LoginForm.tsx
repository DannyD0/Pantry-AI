"use client"

import { useState } from "react"
import { Eye, EyeOff } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { signInWithPassword, signUpWithPassword } from "@/app/login/actions"
import { isValidEmail } from "@/lib/logic/validate"

type AuthMode = "signin" | "signup"

export function LoginForm() {
  const [mode, setMode] = useState<AuthMode>("signin")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function switchMode(next: AuthMode) {
    setMode(next)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!isValidEmail(email)) {
      setError("Enter a valid email address.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (mode === "signup" && !name.trim()) {
      setError("Enter your name.")
      return
    }
    setLoading(true)
    setError(null)

    if (mode === "signin") {
      const result = await signInWithPassword(email, password)
      // If we get here, redirect didn't fire — must be an error
      if (result?.error) setError(result.error)
    } else {
      const result = await signUpWithPassword(email, password, name.trim())
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
    <div className="space-y-5">
      {/* Sign in / Sign up toggle */}
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

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ShoppingCart, CheckCircle2, ChevronLeft, Users, Copy, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { updateProfile, updateHouseholdSize } from "@/app/settings/actions"
import { completeOnboarding } from "@/app/onboarding/actions"

const TOTAL_STEPS = 5

const HOUSEHOLD_OPTIONS = [
  { label: "Just me", value: 1 },
  { label: "2 people", value: 2 },
  { label: "3-4 people", value: 4 },
  { label: "5 or more", value: 5 },
] as const

type ShareStage = "choose" | "invite" | "join"

export function OnboardingFlow({ prefillName }: { prefillName: string }) {
  const router = useRouter()
  const [step, setStep] = useState(1)

  const [name, setName] = useState(prefillName)
  const [savingName, setSavingName] = useState(false)

  const [householdSize, setHouseholdSize] = useState<number | null>(null)
  const [savingSize, setSavingSize] = useState(false)

  const [shareStage, setShareStage] = useState<ShareStage>("choose")
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [copied, setCopied] = useState(false)
  const [joinCode, setJoinCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [joinError, setJoinError] = useState<string | null>(null)

  const [finishing, setFinishing] = useState(false)

  function next() {
    setStep((s) => Math.min(TOTAL_STEPS, s + 1))
  }

  function back() {
    if (step === 4 && shareStage !== "choose") {
      setShareStage("choose")
      return
    }
    setStep((s) => Math.max(1, s - 1))
  }

  async function handleNameContinue() {
    const trimmed = name.trim()
    if (!trimmed) {
      next()
      return
    }
    setSavingName(true)
    await updateProfile(trimmed)
    setSavingName(false)
    next()
  }

  async function handleSizeContinue() {
    if (householdSize == null) return
    setSavingSize(true)
    await updateHouseholdSize(householdSize)
    setSavingSize(false)
    next()
  }

  async function handleGenerateInvite() {
    setGeneratingInvite(true)
    try {
      const res = await fetch("/api/household/invite", { method: "POST" })
      const json = await res.json()
      if (!res.ok) return
      setInviteCode(json.invite_code)
      setInviteLink(json.link)
      setShareStage("invite")
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
      if (!res.ok) {
        setJoinError(json.error ?? "Invalid code.")
        return
      }
      next()
    } finally {
      setJoining(false)
    }
  }

  async function handleFinish() {
    setFinishing(true)
    await completeOnboarding()
    router.push("/inventory?addItem=1")
  }

  return (
    <main className="min-h-screen flex flex-col bg-background px-4 pt-safe">
      <div className="w-full max-w-sm mx-auto flex flex-col flex-1 py-6">
        {/* Progress + back */}
        <div className="flex items-center gap-3 mb-10">
          {step > 1 ? (
            <button
              type="button"
              onClick={back}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 -ml-1"
              aria-label="Back"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <div className="w-5 shrink-0" />
          )}
          <Progress value={(step / TOTAL_STEPS) * 100} className="flex-1 h-1.5" />
          <span className="text-xs text-muted-foreground font-medium tabular-nums shrink-0">
            {step} of {TOTAL_STEPS}
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {step === 1 && (
            <div className="flex flex-col items-center text-center gap-6 animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                <ShoppingCart className="w-10 h-10 text-primary" strokeWidth={1.75} />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">Welcome to Remto</h1>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Smart pantry tracking that does the thinking for you.
                </p>
              </div>
              <Button className="w-full h-12 text-base font-semibold" onClick={next}>
                Get Started
              </Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-xl font-bold tracking-tight text-center">
                What should we call you?
              </h1>
              <div className="space-y-2">
                <Label htmlFor="onboarding-name">Name</Label>
                <Input
                  id="onboarding-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  maxLength={80}
                  autoComplete="name"
                  className="h-12 text-base"
                />
              </div>
              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleNameContinue}
                disabled={savingName}
              >
                {savingName ? "Saving…" : "Continue"}
              </Button>
              <button
                type="button"
                onClick={next}
                className="w-full text-xs text-center text-muted-foreground hover:text-foreground transition-colors"
              >
                Skip
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              <h1 className="text-xl font-bold tracking-tight text-center">
                How many people are in your household?
              </h1>
              <div className="grid grid-cols-2 gap-3">
                {HOUSEHOLD_OPTIONS.map((opt) => (
                  <button
                    key={opt.label}
                    type="button"
                    onClick={() => setHouseholdSize(opt.value)}
                    className={`rounded-2xl border px-4 py-7 text-sm font-semibold transition-all active:scale-[0.98] ${
                      householdSize === opt.value
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border bg-card hover:bg-secondary/40 text-foreground"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleSizeContinue}
                disabled={householdSize == null || savingSize}
              >
                {savingSize ? "Saving…" : "Continue"}
              </Button>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-2 text-center">
                <h1 className="text-xl font-bold tracking-tight">Want to share your pantry?</h1>
                <p className="text-sm text-muted-foreground">
                  You can always do this later from your Profile.
                </p>
              </div>

              {shareStage === "choose" && (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleGenerateInvite}
                    disabled={generatingInvite}
                    className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-4 text-left hover:bg-secondary/40 active:scale-[0.98] transition-all"
                  >
                    <Users className="h-5 w-5 text-primary shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">
                        {generatingInvite ? "Generating…" : "Invite someone"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Share a code or link for them to join
                      </p>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShareStage("join")}
                    className="w-full flex items-center gap-3 bg-card border border-border rounded-2xl px-4 py-4 text-left hover:bg-secondary/40 active:scale-[0.98] transition-all"
                  >
                    <Users className="h-5 w-5 text-muted-foreground shrink-0" />
                    <div>
                      <p className="font-semibold text-sm">Join a household</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Enter an invite code you received
                      </p>
                    </div>
                  </button>

                  <Button className="w-full h-12 text-base font-semibold" onClick={next}>
                    Skip for now
                  </Button>
                </div>
              )}

              {shareStage === "invite" && inviteCode && (
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Share this code or link, it expires in 7 days.
                  </p>
                  <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-3">
                    <span className="font-mono text-lg font-bold tracking-widest flex-1">
                      {inviteCode}
                    </span>
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
                  <Button className="w-full h-12 text-base font-semibold" onClick={next}>
                    Continue
                  </Button>
                </div>
              )}

              {shareStage === "join" && (
                <form onSubmit={handleJoinSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="onboarding-join-code">Invite code</Label>
                    <Input
                      id="onboarding-join-code"
                      placeholder="e.g. A3X7K9P2"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                      className="h-12 text-base font-mono tracking-widest"
                      maxLength={12}
                      autoComplete="off"
                    />
                  </div>
                  {joinError && <p className="text-sm text-destructive">{joinError}</p>}
                  <Button
                    type="submit"
                    className="w-full h-12 text-base font-semibold"
                    disabled={joining || !joinCode.trim()}
                  >
                    {joining ? "Joining…" : "Join Household"}
                  </Button>
                </form>
              )}
            </div>
          )}

          {step === 5 && (
            <div className="flex flex-col items-center text-center gap-6 animate-fade-in">
              <div className="w-20 h-20 rounded-3xl bg-primary/10 flex items-center justify-center">
                <CheckCircle2 className="w-10 h-10 text-primary" strokeWidth={1.75} />
              </div>
              <div className="space-y-2">
                <h1 className="text-2xl font-bold tracking-tight">You&apos;re all set!</h1>
                <p className="text-sm text-muted-foreground max-w-xs">
                  Start by adding a few items from your pantry so Remto can start tracking for you.
                </p>
              </div>
              <Button
                className="w-full h-12 text-base font-semibold"
                onClick={handleFinish}
                disabled={finishing}
              >
                {finishing ? "Just a moment…" : "Add Your First Item"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </main>
  )
}

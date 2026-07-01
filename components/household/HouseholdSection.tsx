"use client"

import { useEffect, useState } from "react"
import { Users, Copy, Check, Mail, LogOut, UserMinus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/useToast"
import { getHouseholdData, updateHouseholdSize } from "@/app/settings/actions"
import type { Household, HouseholdMemberWithProfile } from "@/lib/supabase/types"

interface HouseholdState {
  householdId: string
  household: Household | null
  members: HouseholdMemberWithProfile[]
  currentUserId: string
}

export function HouseholdSection() {
  const { toast } = useToast()
  const [data, setData] = useState<HouseholdState | null>(null)
  const [loading, setLoading] = useState(true)

  // Invite code state
  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [inviteLink, setInviteLink] = useState<string | null>(null)
  const [generatingInvite, setGeneratingInvite] = useState(false)
  const [copied, setCopied] = useState(false)

  // Email invite state
  const [emailInput, setEmailInput] = useState("")
  const [sendingEmail, setSendingEmail] = useState(false)

  // Join household state
  const [joinCode, setJoinCode] = useState("")
  const [joining, setJoining] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  // Household size state
  const [sizeInput, setSizeInput] = useState<string>("")
  const [savingSize, setSavingSize] = useState(false)

  // Leaving/removing member
  const [removingUserId, setRemovingUserId] = useState<string | null>(null)

  useEffect(() => {
    reload()
  }, [])

  async function reload() {
    setLoading(true)
    const res = await getHouseholdData()
    if (res.success && res.householdId) {
      setData({
        householdId: res.householdId,
        household: res.household ?? null,
        members: res.members ?? [],
        currentUserId: res.currentUserId ?? "",
      })
      setSizeInput(String(res.household?.household_size ?? 2))
    }
    setLoading(false)
  }

  async function handleGenerateInvite() {
    setGeneratingInvite(true)
    try {
      const res = await fetch("/api/household/invite", { method: "POST" })
      const json = await res.json()
      if (!res.ok) { toast(`❌ ${json.error}`); return }
      setInviteCode(json.invite_code)
      setInviteLink(json.link)
    } finally {
      setGeneratingInvite(false)
    }
  }

  async function handleCopy() {
    if (!inviteLink) return
    await navigator.clipboard.writeText(inviteLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
    toast("✅ Link copied to clipboard")
  }

  async function handleEmailInvite(e: React.FormEvent) {
    e.preventDefault()
    if (!emailInput.trim()) return
    setSendingEmail(true)
    try {
      const res = await fetch("/api/household/email-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailInput.trim() }),
      })
      const json = await res.json()
      if (!res.ok) { toast(`❌ ${json.error}`); return }
      toast(`✅ Invite sent to ${emailInput.trim()}`)
      setEmailInput("")
    } finally {
      setSendingEmail(false)
    }
  }

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault()
    const code = joinCode.trim().toUpperCase()
    if (!code) return
    setJoining(true)
    try {
      const res = await fetch("/api/household/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      })
      const json = await res.json()
      if (!res.ok) { toast(`❌ ${json.error}`); return }
      toast("✅ Joined household!")
      setJoinCode("")
      setShowJoin(false)
      // Reload the page so householdId propagates from the server
      window.location.reload()
    } finally {
      setJoining(false)
    }
  }

  async function handleSaveSize(e: React.FormEvent) {
    e.preventDefault()
    const size = parseInt(sizeInput, 10)
    if (isNaN(size)) return
    setSavingSize(true)
    const res = await updateHouseholdSize(size)
    setSavingSize(false)
    if (res.error) toast(`❌ ${res.error}`)
    else { toast("✅ Household size updated"); reload() }
  }

  async function handleRemoveMember(targetUserId: string) {
    setRemovingUserId(targetUserId)
    try {
      const res = await fetch("/api/household/remove-member", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: targetUserId }),
      })
      const json = await res.json()
      if (!res.ok) { toast(`❌ ${json.error}`); return }
      if (targetUserId === data?.currentUserId) {
        // Self-removal: reload page to get new household context
        window.location.reload()
      } else {
        toast("✅ Member removed")
        reload()
      }
    } finally {
      setRemovingUserId(null)
    }
  }

  if (loading) {
    return (
      <div className="space-y-2">
        {[1, 2].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-card animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {/* Members list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {(data?.members ?? []).length === 0 ? (
          <div className="px-4 py-3.5 text-sm text-muted-foreground">No members found.</div>
        ) : (
          (data?.members ?? []).map((member) => {
            const isMe = member.user_id === data?.currentUserId
            const displayName = member.full_name ?? member.email ?? member.user_id
            return (
              <div key={member.id} className="flex items-center justify-between px-4 py-3.5">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">
                    {displayName}{isMe && <span className="ml-1.5 text-xs text-muted-foreground">(you)</span>}
                  </p>
                  {member.full_name && member.email && (
                    <p className="text-xs text-muted-foreground truncate">{member.email}</p>
                  )}
                </div>
                <button
                  onClick={() => handleRemoveMember(member.user_id as string)}
                  disabled={removingUserId === member.user_id}
                  className="shrink-0 ml-3 text-muted-foreground hover:text-destructive transition-colors p-1"
                  title={isMe ? "Leave household" : "Remove member"}
                  aria-label={isMe ? "Leave household" : `Remove ${displayName}`}
                >
                  {isMe
                    ? <LogOut className="h-4 w-4" />
                    : <UserMinus className="h-4 w-4" />
                  }
                </button>
              </div>
            )
          })
        )}
      </div>

      {/* Household size */}
      <form onSubmit={handleSaveSize} className="bg-card border border-border rounded-2xl px-4 py-3.5 space-y-2">
        <Label className="text-xs text-muted-foreground">Household size</Label>
        <div className="flex gap-2">
          <Input
            type="number"
            min={1}
            max={20}
            value={sizeInput}
            onChange={(e) => setSizeInput(e.target.value)}
            className="h-9 text-sm bg-background w-20"
          />
          <Button
            type="submit"
            size="sm"
            className="h-9 px-3 shrink-0"
            disabled={savingSize || sizeInput === String(data?.household?.household_size)}
          >
            {savingSize ? "Saving…" : "Save"}
          </Button>
        </div>
      </form>

      {/* Generate invite */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden divide-y divide-border">
        {!inviteCode ? (
          <button
            type="button"
            onClick={handleGenerateInvite}
            disabled={generatingInvite}
            className="w-full flex items-center gap-3 px-4 py-3.5 text-sm hover:bg-secondary/40 transition-colors text-left"
          >
            <Users className="h-4 w-4 text-muted-foreground shrink-0" />
            <span className="font-medium">{generatingInvite ? "Generating…" : "Generate invite code"}</span>
          </button>
        ) : (
          <div className="px-4 py-3.5 space-y-2">
            <p className="text-xs text-muted-foreground">Share this code or link, it expires in 7 days</p>
            <div className="flex items-center gap-2 bg-secondary rounded-lg px-3 py-2">
              <span className="font-mono text-sm font-bold tracking-widest flex-1">{inviteCode}</span>
              <button
                onClick={handleCopy}
                className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                title="Copy link"
              >
                {copied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
              </button>
            </div>
            <button
              onClick={handleGenerateInvite}
              disabled={generatingInvite}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Generate a new code
            </button>
          </div>
        )}

        {/* Email invite */}
        <form onSubmit={handleEmailInvite} className="px-4 py-3.5 space-y-2">
          <Label className="text-xs text-muted-foreground">Invite by email</Label>
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="partner@example.com"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="h-9 text-sm bg-background"
              maxLength={254}
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              className="h-9 px-3 shrink-0 gap-1.5"
              disabled={sendingEmail || !emailInput.trim()}
            >
              <Mail className="h-3.5 w-3.5" />
              {sendingEmail ? "Sending…" : "Send"}
            </Button>
          </div>
        </form>
      </div>

      {/* Join a household */}
      {!showJoin ? (
        <button
          type="button"
          onClick={() => setShowJoin(true)}
          className="w-full text-sm text-muted-foreground hover:text-foreground transition-colors py-2 text-center"
        >
          Have an invite code? Join a different household →
        </button>
      ) : (
        <form onSubmit={handleJoin} className="bg-card border border-border rounded-2xl px-4 py-3.5 space-y-2">
          <Label className="text-xs text-muted-foreground">Join a household</Label>
          <p className="text-xs text-muted-foreground">
            Your current pantry items will move to the new household.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="Enter invite code"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              className="h-9 text-sm bg-background font-mono tracking-widest"
              maxLength={12}
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 px-3 shrink-0"
              disabled={joining || !joinCode.trim()}
            >
              {joining ? "Joining…" : "Join"}
            </Button>
          </div>
          <button
            type="button"
            onClick={() => setShowJoin(false)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </form>
      )}
    </div>
  )
}

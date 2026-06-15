import { NextRequest, NextResponse } from "next/server"
import Anthropic from "@anthropic-ai/sdk"
import { createServerClient } from "@/lib/supabase/server"

// ANTHROPIC_API_KEY is intentionally NOT prefixed with NEXT_PUBLIC_,
// so it only exists server-side, inside this route handler.
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

// ── Rate limiting: 10 requests per minute per user ──────────────────────────
// In-memory sliding window. Per server instance, which is acceptable here:
// Fluid Compute reuses instances, and the limit is a cost guard, not a hard SLA.
const RATE_LIMIT = 10
const WINDOW_MS = 60_000
const requestLog = new Map<string, number[]>()

function isRateLimited(userId: string): boolean {
  const now = Date.now()
  const recent = (requestLog.get(userId) ?? []).filter((t) => now - t < WINDOW_MS)
  if (recent.length >= RATE_LIMIT) {
    requestLog.set(userId, recent)
    return true
  }
  recent.push(now)
  requestLog.set(userId, recent)
  return false
}

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const
const MAX_IMAGE_BYTES = 5 * 1024 * 1024 // 5MB

const VALID_CATEGORIES = ["Protein", "Vegetable", "Grain", "Dairy", "Essential", "Other"]

export async function POST(request: NextRequest) {
  // Require an authenticated user
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Sign in to use AI Vision." }, { status: 401 })
  }

  if (isRateLimited(user.id)) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a minute and try again." },
      { status: 429 }
    )
  }

  try {
    const formData = await request.formData()
    const image = formData.get("image")

    if (!image || !(image instanceof File)) {
      return NextResponse.json({ error: "No image provided" }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(image.type as (typeof ALLOWED_TYPES)[number])) {
      return NextResponse.json({ error: "Unsupported image type. Use JPEG, PNG, WebP, or GIF." }, { status: 400 })
    }
    if (image.size > MAX_IMAGE_BYTES) {
      return NextResponse.json({ error: "Image too large. Maximum size is 5MB." }, { status: 400 })
    }

    const buffer = await image.arrayBuffer()
    const base64 = Buffer.from(buffer).toString("base64")
    const mediaType = image.type as "image/jpeg" | "image/png" | "image/webp" | "image/gif"

    const response = await anthropic.messages.create({
      model: "claude-opus-4-6",
      max_tokens: 256,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType,
                data: base64,
              },
            },
            {
              type: "text",
              text: 'Identify this grocery item. Return ONLY valid JSON (no markdown, no explanation): { "item_name": string, "category": "Protein" | "Vegetable" | "Grain" | "Dairy" | "Essential" | "Other", "estimated_quantity": number, "unit": string }',
            },
          ],
        },
      ],
    })

    const text = response.content[0].type === "text" ? response.content[0].text : ""

    // Strip markdown code fences if Claude wraps the JSON
    const clean = text.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim()
    const parsed = JSON.parse(clean)

    // Validate the model output before returning it to the client
    const result = {
      item_name: typeof parsed.item_name === "string" ? parsed.item_name.slice(0, 120) : "",
      category: VALID_CATEGORIES.includes(parsed.category) ? parsed.category : null,
      estimated_quantity:
        typeof parsed.estimated_quantity === "number" && parsed.estimated_quantity > 0
          ? parsed.estimated_quantity
          : null,
      unit: typeof parsed.unit === "string" ? parsed.unit.slice(0, 12) : null,
    }

    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: "Vision analysis failed. Could not parse item." }, { status: 500 })
  }
}

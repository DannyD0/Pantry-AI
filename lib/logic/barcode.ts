export interface BarcodeProduct {
  item_name: string
  brand: string | null
  quantity: string | null
  expiry_date: string | null // YYYY-MM-DD
}

export type BarcodeLookup =
  | { status: "found"; product: BarcodeProduct }
  | { status: "not_found" }
  | { status: "timeout" }
  | { status: "error" }

const LOOKUP_TIMEOUT_MS = 8_000

/** Normalise OFF expiration dates ("2026-07-01", "01/07/2026", "07/2026") to YYYY-MM-DD. */
function parseExpiryDate(raw: unknown): string | null {
  if (typeof raw !== "string" || !raw.trim()) return null
  const value = raw.trim()
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return Number.isNaN(new Date(value).getTime()) ? null : value
  }
  const dmy = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (dmy) {
    const [, d, m, y] = dmy
    const iso = `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
    return Number.isNaN(new Date(iso).getTime()) ? null : iso
  }
  const my = value.match(/^(\d{1,2})\/(\d{4})$/)
  if (my) {
    const [, m, y] = my
    const iso = `${y}-${m.padStart(2, "0")}-01`
    return Number.isNaN(new Date(iso).getTime()) ? null : iso
  }
  return null
}

/**
 * Fetch product info from Open Food Facts by barcode.
 * Aborts after 8 seconds so the UI can offer manual entry.
 */
export async function fetchBarcode(barcode: string): Promise<BarcodeLookup> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), LOOKUP_TIMEOUT_MS)

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${encodeURIComponent(barcode)}.json`,
      { signal: controller.signal }
    )
    if (!res.ok) return { status: "error" }

    const data = await res.json()
    if (data.status !== 1 || !data.product) return { status: "not_found" }

    const p = data.product
    const item_name = p.product_name ?? p.product_name_en ?? ""
    if (!item_name) return { status: "not_found" }

    return {
      status: "found",
      product: {
        item_name,
        brand: p.brands ?? null,
        quantity: p.quantity ?? p.serving_size ?? null,
        expiry_date: parseExpiryDate(p.expiration_date),
      },
    }
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") return { status: "timeout" }
    return { status: "error" }
  } finally {
    clearTimeout(timer)
  }
}

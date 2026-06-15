// Shared input validation helpers, used on both client forms and server actions.

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function isValidEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_RE.test(email)
}

/** Non-empty, trimmed, capped text field (names, brands, units). */
export function sanitizeText(value: string, maxLength = 120): string {
  return value.trim().slice(0, maxLength)
}

/** Positive finite number within sane bounds for weights/quantities. */
export function isValidWeight(value: number, max = 100_000): boolean {
  return Number.isFinite(value) && value > 0 && value <= max
}

/** Integer quantity between 1 and 99. */
export function isValidQuantity(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 99
}

/** YYYY-MM-DD string that parses to a real date. */
export function isValidDateString(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  return !Number.isNaN(new Date(value).getTime())
}

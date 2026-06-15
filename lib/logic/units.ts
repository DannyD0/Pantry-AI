// Unit options for the Add/Edit Item forms, grouped for the dropdown.

export const UNIT_GROUPS = [
  {
    label: "Solid",
    units: [
      { value: "oz", label: "oz — ounces" },
      { value: "lbs", label: "lbs — pounds" },
      { value: "g", label: "g — grams" },
      { value: "kg", label: "kg — kilograms" },
      { value: "count", label: "count — quantity" },
    ],
  },
  {
    label: "Liquid",
    units: [
      { value: "fl oz", label: "fl oz — fluid ounces" },
      { value: "cups", label: "cups — cups" },
      { value: "ml", label: "ml — milliliters" },
      { value: "L", label: "L — liters" },
    ],
  },
] as const

export const ALL_UNITS: string[] = UNIT_GROUPS.flatMap((g) => g.units.map((u) => u.value))

const UNIT_ALIASES: Record<string, string> = {
  oz: "oz", ounce: "oz", ounces: "oz",
  lb: "lbs", lbs: "lbs", pound: "lbs", pounds: "lbs",
  g: "g", gr: "g", gram: "g", grams: "g",
  kg: "kg", kgs: "kg", kilogram: "kg", kilograms: "kg",
  count: "count", ct: "count", ea: "count", each: "count",
  pc: "count", pcs: "count", piece: "count", pieces: "count", pack: "count",
  ml: "ml", milliliter: "ml", milliliters: "ml", millilitre: "ml", millilitres: "ml",
  l: "L", liter: "L", liters: "L", litre: "L", litres: "L",
  "fl oz": "fl oz", floz: "fl oz", "fluid ounce": "fl oz", "fluid ounces": "fl oz",
  cup: "cups", cups: "cups",
}

/**
 * Map a free-form unit string (e.g. from Open Food Facts) to one of the
 * dropdown values. Returns null when the unit isn't recognised.
 */
export function normalizeUnit(raw: string | null | undefined): string | null {
  if (!raw) return null
  return UNIT_ALIASES[raw.trim().toLowerCase()] ?? null
}

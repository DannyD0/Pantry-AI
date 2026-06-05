import type { Category, PriorityTier } from "@/lib/supabase/types"

const HIGH_KEYWORDS = [
  "milk", "egg", "bread", "yogurt", "cream", "cheese",
  "lettuce", "spinach", "kale", "tomato", "avocado",
  "banana", "apple", "berry", "strawberry", "blueberry",
  "chicken", "beef", "salmon", "fish", "shrimp", "turkey",
  "pork", "lamb", "deli", "fresh", "produce",
]

const LOW_KEYWORDS = [
  "salt", "pepper", "spice", "seasoning", "oil", "vinegar",
  "rice", "flour", "sugar", "honey", "pasta", "noodle",
  "oat", "bean", "lentil", "canned", "baking", "soda",
  "sauce", "ketchup", "mustard", "syrup", "broth", "stock",
]

export function assignPriorityTier(
  itemName: string,
  category: Category | null
): PriorityTier {
  const name = itemName.toLowerCase()

  if (
    category === "Dairy" ||
    category === "Vegetable" ||
    HIGH_KEYWORDS.some((k) => name.includes(k))
  ) {
    return "HIGH"
  }

  if (
    category === "Essential" ||
    category === "Grain" ||
    LOW_KEYWORDS.some((k) => name.includes(k))
  ) {
    return "LOW"
  }

  return "MEDIUM"
}

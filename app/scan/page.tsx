import { redirect } from "next/navigation"

// Scanning now lives inside the Add Item flow on the Pantry page.
export default function ScanPage() {
  redirect("/inventory")
}

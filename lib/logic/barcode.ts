export interface BarcodeResult {
  item_name: string
  brand: string | null
  quantity: string | null
}

/**
 * Fetch product info from Open Food Facts by barcode.
 */
export async function fetchBarcode(barcode: string): Promise<BarcodeResult | null> {
  const res = await fetch(
    `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`
  )
  if (!res.ok) return null

  const data = await res.json()
  if (data.status !== 1 || !data.product) return null

  const p = data.product
  return {
    item_name: p.product_name ?? p.product_name_en ?? "",
    brand: p.brands ?? null,
    quantity: p.quantity ?? p.serving_size ?? null,
  }
}

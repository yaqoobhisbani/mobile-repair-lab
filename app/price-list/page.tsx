import { db } from "@/db"
import { inventory, settings } from "@/db/schema"
import { eq } from "drizzle-orm"

export const revalidate = 30

export default async function PriceListPage() {
  let currency = "PKR"
  let shopName = "Mobile Repair Lab"

  try {
    const [shop] = await db
      .select({
        shopName: settings.shopName,
        currency: settings.currency,
      })
      .from(settings)
      .where(eq(settings.id, 1))
      .limit(1)

    currency = shop?.currency ?? "PKR"
    shopName = shop?.shopName ?? "Mobile Repair Lab"
  } catch {
    // database may not be available during prerender/build
  }

  let items: {
    id: number
    partName: string
    sku: string
    compatibility: string | null
    stockQty: number
    sellingPrice: string | null
  }[] = []

  try {
    items = await db
      .select({
        id: inventory.id,
        partName: inventory.partName,
        sku: inventory.sku,
        compatibility: inventory.compatibility,
        stockQty: inventory.stockQty,
        sellingPrice: inventory.sellingPrice,
      })
      .from(inventory)
      .orderBy(inventory.partName)
  } catch {
    // database may not be available during prerender/build
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <header className="text-center mb-12">
        <h1 className="text-3xl sm:text-5xl font-bold tracking-tight">{shopName}</h1>
        <p className="text-xl sm:text-2xl text-muted-foreground mt-3">Price List</p>
      </header>

      {items.length === 0 ? (
        <p className="text-center text-base sm:text-xl text-muted-foreground">No items available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm sm:text-base">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-2 sm:pb-4 pr-4 sm:pr-6 font-medium whitespace-nowrap">Part Name</th>
                <th className="pb-2 sm:pb-4 pr-4 sm:pr-6 font-medium whitespace-nowrap">SKU</th>
                <th className="pb-2 sm:pb-4 pr-4 sm:pr-6 font-medium whitespace-nowrap hidden sm:table-cell">Compatibility</th>
                <th className="pb-2 sm:pb-4 pr-4 sm:pr-6 font-medium whitespace-nowrap">Stock</th>
                <th className="pb-2 sm:pb-4 text-right font-medium whitespace-nowrap">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-2 sm:py-4 pr-4 sm:pr-6 font-semibold whitespace-nowrap">{item.partName}</td>
                  <td className="py-2 sm:py-4 pr-4 sm:pr-6 text-muted-foreground whitespace-nowrap">{item.sku}</td>
                  <td className="py-2 sm:py-4 pr-4 sm:pr-6 whitespace-nowrap hidden sm:table-cell">{item.compatibility ?? "—"}</td>
                  <td className="py-2 sm:py-4 pr-4 sm:pr-6 whitespace-nowrap">
                    {item.stockQty > 0 ? (
                      <span>{item.stockQty}</span>
                    ) : (
                      <span className="text-destructive font-bold">Out of Stock</span>
                    )}
                  </td>
                  <td className="py-2 sm:py-4 text-right font-bold tabular-nums whitespace-nowrap">
                    {item.sellingPrice
                      ? `${currency} ${Number(item.sellingPrice).toLocaleString()}`
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

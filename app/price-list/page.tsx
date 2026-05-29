import { db } from "@/db"
import { inventory, settings } from "@/db/schema"
import { eq } from "drizzle-orm"

export const revalidate = 30

export default async function PriceListPage() {
  const [shop] = await db
    .select({
      shopName: settings.shopName,
      currency: settings.currency,
    })
    .from(settings)
    .where(eq(settings.id, 1))
    .limit(1)

  const currency = shop?.currency ?? "PKR"
  const shopName = shop?.shopName ?? "Mobile Repair Lab"

  const items = await db
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

  return (
    <div className="max-w-6xl mx-auto py-10 px-6">
      <header className="text-center mb-12">
        <h1 className="text-5xl font-bold tracking-tight">{shopName}</h1>
        <p className="text-2xl text-muted-foreground mt-3">Price List</p>
      </header>

      {items.length === 0 ? (
        <p className="text-center text-xl text-muted-foreground">No items available.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-xl">
            <thead>
              <tr className="border-b text-left text-muted-foreground">
                <th className="pb-4 pr-6 font-medium">Part Name</th>
                <th className="pb-4 pr-6 font-medium">SKU</th>
                <th className="pb-4 pr-6 font-medium">Compatibility</th>
                <th className="pb-4 pr-6 font-medium">Stock</th>
                <th className="pb-4 text-right font-medium">Price</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b last:border-0">
                  <td className="py-4 pr-6 font-semibold">{item.partName}</td>
                  <td className="py-4 pr-6 text-muted-foreground">{item.sku}</td>
                  <td className="py-4 pr-6">{item.compatibility ?? "—"}</td>
                  <td className="py-4 pr-6">
                    {item.stockQty > 0 ? (
                      <span>{item.stockQty}</span>
                    ) : (
                      <span className="text-destructive font-bold">Out of Stock</span>
                    )}
                  </td>
                  <td className="py-4 text-right font-bold tabular-nums">
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

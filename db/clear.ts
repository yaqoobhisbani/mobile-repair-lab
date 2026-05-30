import { db } from "./index"
import { sql } from "drizzle-orm"

async function clear() {
  console.log("Clearing all data...")

  await db.execute(sql`
    TRUNCATE TABLE
      ticket_items,
      ticket_status_history,
      invoices,
      sale_items,
      transactions,
      expenses,
      tickets,
      sale_orders,
      inventory,
      customers,
      accounts,
      settings,
      users
    RESTART IDENTITY CASCADE
  `)

  console.log("All tables cleared. Run `db:seed` to re-populate defaults.")
  process.exit(0)
}

clear().catch((err) => {
  console.error("Clear failed:", err)
  process.exit(1)
})

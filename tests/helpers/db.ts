import { Pool } from "pg"

export const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export async function truncateAll() {
  const client = await pool.connect()
  try {
    await client.query("BEGIN")
    await client.query(`
      TRUNCATE TABLE
        ticket_status_history, ticket_items, tickets, invoices,
        sale_items, sale_orders, expenses, transactions,
        inventory, accounts, customers, users, settings,
        dividend_distributions, share_transactions, business_assets, business_members
      CASCADE
    `)
    await client.query("COMMIT")
  } finally {
    client.release()
  }
}

import { loadEnvFile } from "process"
loadEnvFile(".env.test")

import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import * as schema from "../db/schema"

export async function setup() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const db = drizzle(pool, { schema })
  try {
    await migrate(db, { migrationsFolder: "./db/migrations" })
  } catch {
    // already migrated
  }
  await pool.end()
}

export async function teardown() {
  const pool = new Pool({ connectionString: process.env.DATABASE_URL })
  const client = await pool.connect()
  try {
    await client.query(`
      TRUNCATE TABLE
        ticket_status_history, ticket_items, tickets, invoices,
        sale_items, sale_orders, expenses, transactions,
        inventory, accounts, customers, users, settings
      CASCADE
    `)
  } catch {
    // tables may not exist
  } finally {
    client.release()
  }
  await pool.end()
}

import { Pool } from "pg"
import { drizzle } from "drizzle-orm/node-postgres"
import * as schema from "../../db/schema"
import { hashPassword, signToken } from "../../lib/auth-server"

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const db = drizzle(pool, { schema })

export async function createUser(overrides: Partial<typeof schema.users.$inferInsert> = {}) {
  const passwordHash = await hashPassword("password123")
  const [user] = await db
    .insert(schema.users)
    .values({
      email: "test@example.com",
      passwordHash,
      name: "Test User",
      ...overrides,
    })
    .returning({ id: schema.users.id, email: schema.users.email, name: schema.users.name })
  return user
}

export async function loginAsUser(user: { id: number; email: string }) {
  return signToken({ userId: user.id, email: user.email })
}

export async function createAccount(overrides: Partial<typeof schema.accounts.$inferInsert> = {}) {
  const [account] = await db
    .insert(schema.accounts)
    .values({
      name: "Test Account",
      type: "cash",
      balance: "1000",
      ...overrides,
    })
    .returning()
  return account
}

export async function createCustomer(overrides: Partial<typeof schema.customers.$inferInsert> = {}) {
  const [customer] = await db
    .insert(schema.customers)
    .values({
      name: "Test Customer",
      phone: "555-0100",
      ...overrides,
    })
    .returning()
  return customer
}

export async function createPart(overrides: Partial<typeof schema.inventory.$inferInsert> = {}) {
  const [item] = await db
    .insert(schema.inventory)
    .values({
      sku: `SKU-${Date.now()}`,
      partName: "Test Part",
      stockQty: 10,
      costPrice: "50",
      sellingPrice: "100",
      ...overrides,
    })
    .returning()
  return item
}

export async function createTicket(
  ticketId: string,
  overrides: Partial<typeof schema.tickets.$inferInsert> = {},
) {
  const [ticket] = await db
    .insert(schema.tickets)
    .values({
      id: ticketId,
      customerId: overrides.customerId || 0,
      brand: "Apple",
      model: "iPhone 15",
      problemCategory: "Screen Repair",
      ...overrides,
    })
    .returning()
  return ticket
}

export async function createSale(
  saleId: string,
  overrides: Partial<typeof schema.saleOrders.$inferInsert> = {},
) {
  const [sale] = await db
    .insert(schema.saleOrders)
    .values({
      id: saleId,
      paymentAccountId: overrides.paymentAccountId || 0,
      totalAmount: "500",
      ...overrides,
    })
    .returning()
  return sale
}

export async function createExpense(overrides: Partial<typeof schema.expenses.$inferInsert> = {}) {
  const [expense] = await db
    .insert(schema.expenses)
    .values({
      description: "Test expense",
      amount: "100",
      accountId: overrides.accountId || 0,
      ...overrides,
    })
    .returning()
  return expense
}

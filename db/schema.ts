import {
  pgTable,
  serial,
  varchar,
  text,
  integer,
  decimal,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core"

export const ticketStatusEnum = pgEnum("ticket_status", [
  "received",
  "diagnosing",
  "awaiting_parts",
  "repairing",
  "ready_for_pickup",
  "completed",
  "cancelled",
])

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "partially_paid",
  "paid",
])

export const users = pgTable(
  "users",
  {
    id: serial("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull(),
    passwordHash: varchar("password_hash", { length: 255 }).notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [uniqueIndex("email_idx").on(table.email)]
)

export const paymentMethodEnum = pgEnum("payment_method", [
  "cash",
  "card",
  "mobile_wallet",
])

export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  phone: varchar("phone", { length: 50 }).notNull(),
  email: varchar("email", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const inventory = pgTable("inventory", {
  id: serial("id").primaryKey(),
  sku: varchar("sku", { length: 100 }).notNull().unique(),
  partName: varchar("part_name", { length: 255 }).notNull(),
  compatibility: varchar("compatibility", { length: 255 }),
  stockQty: integer("stock_qty").notNull().default(0),
  lowStockThreshold: integer("low_stock_threshold").default(0),
  costPrice: decimal("cost_price", { precision: 10, scale: 2 }),
  sellingPrice: decimal("selling_price", { precision: 10, scale: 2 }),
})

export const accountTypeEnum = pgEnum("account_type", ["bank", "cash", "wallet"])

export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  type: accountTypeEnum("type").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const tickets = pgTable("tickets", {
  id: varchar("id", { length: 20 }).primaryKey(),
  customerId: integer("customer_id")
    .notNull()
    .references(() => customers.id),
  brand: varchar("brand", { length: 100 }).notNull(),
  model: varchar("model", { length: 255 }).notNull(),
  imei: varchar("imei", { length: 100 }),
  passcode: varchar("passcode", { length: 255 }),
  problemCategory: varchar("problem_category", { length: 100 }),
  problemDescription: text("problem_description"),
  status: ticketStatusEnum("status").default("received").notNull(),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  paymentAccountId: integer("payment_account_id").references(() => accounts.id),
  amountPaid: decimal("amount_paid", { precision: 10, scale: 2 }).default("0").notNull(),
  laborCost: decimal("labor_cost", { precision: 10, scale: 2 }),

  createdAt: timestamp("created_at").defaultNow().notNull(),
})

export const ticketItems = pgTable("ticket_items", {
  id: serial("id").primaryKey(),
  ticketId: varchar("ticket_id", { length: 20 })
    .notNull()
    .references(() => tickets.id),
  inventoryId: integer("inventory_id")
    .notNull()
    .references(() => inventory.id),
  quantityUsed: integer("quantity_used").notNull().default(1),
})

export const ticketStatusHistory = pgTable("ticket_status_history", {
  id: serial("id").primaryKey(),
  ticketId: varchar("ticket_id", { length: 20 })
    .notNull()
    .references(() => tickets.id),
  status: ticketStatusEnum("status").notNull(),
  changedAt: timestamp("changed_at").defaultNow().notNull(),
})

export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  ticketId: varchar("ticket_id", { length: 20 })
    .notNull()
    .references(() => tickets.id),
  paymentStatus: paymentStatusEnum("payment_status").default("unpaid").notNull(),
  paymentMethod: paymentMethodEnum("payment_method"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  issuedAt: timestamp("issued_at").defaultNow().notNull(),
})

export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: varchar("description", { length: 500 }).notNull(),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  category: varchar("category", { length: 100 }),
  accountId: integer("account_id")
    .notNull()
    .references(() => accounts.id),
  date: timestamp("date").defaultNow().notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

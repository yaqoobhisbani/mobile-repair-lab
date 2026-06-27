# Product Requirements Document (PRD)
## Business Management & Shareholding Portal

---

### 1. Overview & Objectives

The **Business Management Portal** is a secure, admin-only space within the Mobile Repair Lab system designed to track capital partners, capital contributions, physical asset ownership, and share-based equity distribution. 

#### Core Business Logic:
1. **Equity & Share Creation**: The business tracks its value in the form of shares.
2. **Asset-Backed Share Creation**: When new business assets are purchased and recorded, the company's valuation increases. This value is converted into shares, where each share is priced at a flat rate of **Rs. 1,000**.
3. **Asset Purchasing**: Assets can be purchased by individual members (as capital injections) or by the business directly.
4. **Internal Share Trading**: Members can buy and sell shares among themselves. The system must track these transactions to keep a real-time ledger of who owns what percentage of the company.

---

### 2. Navigation & Portal Route

#### 2.1 Profile Dropdown Entry
A new entry is added to the user profile dropdown menu in the main dashboard header ([components/dashboard-header.tsx](file:///Volumes/Data/Personal/mobile-repair-lab/components/dashboard-header.tsx)).
- **Label**: `Business Portal`
- **Icon**: `Briefcase` (from `lucide-react`)
- **Action**: Routes to `/dashboard/business`

#### 2.2 Routing Structure
All portal routes reside under `/app/dashboard/business/*` to inherit the main dashboard layouts, authentication checks, and styles:
- **Dashboard Overview**: `/dashboard/business`
- **Members Management**: `/dashboard/business/members`
- **Assets Directory**: `/dashboard/business/assets`
- **Share Trading Ledger**: `/dashboard/business/shares`

---

### 3. Conceptual Database Schema

To support this model, the database schema will be extended with four tables. Here is the Drizzle ORM layout matching the style of [db/schema.ts](file:///Volumes/Data/Personal/mobile-repair-lab/db/schema.ts):

```typescript
import { pgTable, serial, varchar, text, integer, decimal, timestamp } from "drizzle-orm/pg-core"

// 1. Business Members / Owners
export const businessMembers = pgTable("business_members", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }),
  phone: varchar("phone", { length: 50 }),
  role: varchar("role", { length: 100 }).notNull().default("partner"), // "owner" | "partner" | "investor"
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// 2. Business Assets
export const businessAssets = pgTable("business_assets", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  costPrice: decimal("cost_price", { precision: 12, scale: 2 }).notNull(),
  currentValue: decimal("current_value", { precision: 12, scale: 2 }).notNull(),
  purchaseDate: timestamp("purchase_date").defaultNow().notNull(),
  // Links to who bought the asset (Capital contribution identifier)
  purchasedByMemberId: integer("purchased_by_member_id")
    .references(() => businessMembers.id, { onDelete: "set null" }),
  // Track if asset was bought with shop money (cash/bank) vs out-of-pocket by member
  fundingSource: varchar("funding_source", { length: 50 }).notNull().default("member_equity"), // "member_equity" | "shop_funds"
  depreciationRate: decimal("depreciation_rate", { precision: 5, scale: 2 }).default("0.00"), // Annual %
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// 3. Shares & Capital Transactions Ledger
// Double-entry ledger for equity transfers and cash contributions
export const shareTransactions = pgTable("share_transactions", {
  id: serial("id").primaryKey(),
  transactionType: varchar("transaction_type", { length: 50 }).notNull(), // "initial_issuance" | "internal_transfer" | "equity_withdrawal"
  sellerMemberId: integer("seller_member_id")
    .references(() => businessMembers.id, { onDelete: "cascade" }), // NULL for initial issuances / treasury buybacks
  buyerMemberId: integer("buyer_member_id")
    .references(() => businessMembers.id, { onDelete: "cascade" }), // NULL if a member sells shares back to company
  sharesCount: integer("shares_count").notNull(),
  pricePerShare: decimal("price_per_share", { precision: 10, scale: 2 }).notNull().default("1000.00"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(), // shares_count * price_per_share
  transactionDate: timestamp("transaction_date").defaultNow().notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})

// 4. Dividend & Profit Distribution Ledger
export const dividendDistributions = pgTable("dividend_distributions", {
  id: serial("id").primaryKey(),
  memberId: integer("member_id")
    .notNull()
    .references(() => businessMembers.id, { onDelete: "cascade" }),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  payoutDate: timestamp("payout_date").defaultNow().notNull(),
  shareholdingPercentage: decimal("shareholding_percentage", { precision: 5, scale: 2 }).notNull(), // Historical snapshot
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
})
```

---

### 4. Core Features

#### 4.1 Business Members CRUD
- **Create**: Add a member with Name, Email, Phone, and Role.
- **Read**: List all members in a responsive table, showing their role, join date, and key holdings (shares count, total value, asset count).
- **Update**: Edit member details or roles.
- **Delete**: Soft-delete or block deletion if the member currently owns shares or assets (protecting integrity).

#### 4.2 Business Assets CRUD
- **Create**: Add an asset. Form fields include:
  - Asset Name & Description
  - Cost Price
  - Purchase Date
  - Purchaser Dropdown (select from Business Members)
  - Funding Source Toggle:
    - *Member Equity*: Purchased by the member out-of-pocket as a capital injection (automatically generates an initial share issuance equivalent to `Cost Price / 1000` to the purchaser).
    - *Shop Funds*: Paid from the store's cash/bank accounts (optional hook to deduct from a selected account in the `accounts` table).
  - Annual Depreciation Rate (%)
- **Read**: Directory listing showing all assets, initial prices, current values, purchase dates, and owner (purchased-by member).
- **Update/Delete**: Adjust properties, or deprecate manually.

#### 4.3 Share Ledger & Internal Trading
- **Initial Share Issuance**: Automatically creates shares for members when they buy assets out-of-pocket, or allows the Admin to log manual cash capital contributions (Cash Injection -> Share Issuance).
- **Peer-to-Peer Trading Dialog**:
  - **Seller Dropdown**: Filters to members holding shares. Show their available shares balance.
  - **Buyer Dropdown**: Select receiving member.
  - **Shares to Trade**: Input field. Real-time validation checks that `Seller's balance >= trade quantity`.
  - **Price per Share**: Default to **Rs. 1,000**, with options to customize the transfer price.
  - **Trade Execution**: Creates a row in `share_transactions` deducting from Seller and adding to Buyer.

---

### 5. Advanced Ideas & Value-Add Requirements

To make this portal a robust business tool rather than a simple tracker, we propose the following advanced sub-features:

#### 5.1 Dynamic Share Valuations (NAV - Net Asset Value)
- While the nominal/par value of a share is fixed at Rs. 1,000 for purchasing power, the business should calculate the **Book Value (NAV) per Share**.
- **Formula**: `NAV per Share = (Total Assets Valuation + Available Shop Cash) / Total Shares Outstanding`.
- This gauge helps owners see if their capital has grown in value due to shop profitability and asset acquisition.

#### 5.2 Straight-Line Asset Depreciation
- Physical assets (diagnostic computers, microscopes, inventory cabinets) lose value over time.
- Implement an automated calculation using the asset's `depreciationRate` and time elapsed since `purchaseDate` to show the **Current Value** vs **Original Cost**.
- The depreciated difference should reduce the business's total assets valuation and adjust the NAV.

#### 5.3 Dividend Distribution Engine
- A screen allowing owners to distribute shop profits.
- **Workflow**:
  1. Admin enters a total profit amount to distribute (e.g., Rs. 50,000).
  2. The system lists all current shareholders, their current share counts, and calculated shareholding percentages.
  3. The system shows a preview table detailing how much each member will receive:
     `Member Dividend = Total Distribution Amount * Shareholding %`.
  4. Upon confirmation, a bulk transaction is recorded in the `dividend_distributions` table and can optionally be linked as debits in the shop's accounts.

#### 5.4 Shareholder Ledgers & Transaction History
- A comprehensive audit tab displaying the chronological list of all equity transfers.
- Search/filter transactions by member or date range.
- Provide a printable/PDF "Capital Statement" for each member showing their historical buys, sells, dividends received, and current portfolio value.

---

### 6. User Interface Design & Layout Mockups

#### 6.1 Main Business Dashboard (`/dashboard/business`)
A clean dashboard split into key sections:
```
+------------------------------------------------------------------------------------+
|  [Briefcase Icon] Business Management Portal                                       |
+------------------------------------------------------------------------------------+
|  [Summary Cards]                                                                   |
|  +-------------------+  +-------------------+  +-------------------+  +----------+ |
|  | Total Valuation   |  | Total Shares      |  | NAV Per Share     |  | Members  | |
|  | Rs. 450,000       |  | 450               |  | Rs. 1,120         |  | 4 Active | |
|  +-------------------+  +-------------------+  +-------------------+  +----------+ |
+------------------------------------------------------------------------------------+
|  [Charts Grid]                                                                     |
|  +-------------------------------------+  +--------------------------------------+ |
|  | Shareholding Distribution (Pie Chart)|  | Asset Value vs Depreciation (Bar)    | |
|  |   - Member A: 45% (202.5 shares)    |  |   - Original Cost: Rs. 350,000       | |
|  |   - Member B: 35% (157.5 shares)    |  |   - Depreciated Value: Rs. 310,000   | |
|  |   - Member C: 20% (90 shares)       |  |                                      | |
|  +-------------------------------------+  +--------------------------------------+ |
+------------------------------------------------------------------------------------+
|  [Shareholding Ledger]                                                             |
|  Name        Shares Owned    Ownership %    Asset Contribution    Cash Contribution|
|  Member A    202.5           45.0%          Rs. 150,000           Rs. 52,500       |
|  Member B    157.5           35.0%          Rs. 100,000           Rs. 57,500       |
+------------------------------------------------------------------------------------+
```

#### 6.2 Members Management Tab (`/dashboard/business/members`)
- Form to add new members (Modal or inline drawer).
- Table displaying active owners/partners, contact info, their roles, and an action button to "View Individual Ledger".

#### 6.3 Assets Management Tab (`/dashboard/business/assets`)
- **Add Asset Modal**: Captures asset specs, buyer info, price, and depreciation.
- **Assets Grid / Table**:
  - Highlights who bought the asset (promoting ownership visibility).
  - Displays original cost vs depreciated value side-by-side.
  - Highlights assets bought with shop funds vs personal member funds.

#### 6.4 Shares Trading Console (`/dashboard/business/shares`)
- **Action Buttons**:
  - `[+] Issue Initial Shares (Cash Injection)`
  - `[⇄] Sell/Transfer Shares`
  - `[💸] Distribute Dividends`
- **Audit Table**: Shows all historical transfers with tooltips displaying notes and dates.

---

### 7. Proposed API Endpoint Structure

To facilitate seamless client-server interaction in Next.js, the developer should implement the following endpoints under `app/api/business/`:

#### 7.1 Members API (`/api/business/members`)
- `GET`: Retrieve list of all members with calculated share balances.
- `POST`: Add a new member.
- `PUT / DELETE`: Update details or remove a member.

#### 7.2 Assets API (`/api/business/assets`)
- `GET`: Retrieve all assets. Calculate current depreciated values on-the-fly or return database records.
- `POST`: Register a new asset. If `fundingSource` is `member_equity`, trigger share generation.

#### 7.3 Shares Transactions API (`/api/business/shares`)
- `GET`: Retrieve transaction history.
- `POST`: Create a new trade or issuance. Must wrap database queries in a SQL transaction:
  1. Validate seller's current share balance.
  2. Write transaction log.
  3. (Optional) Adjust cash balances in accounts table.

#### 7.4 Dividends API (`/api/business/dividends`)
- `POST`: Distribute profit.
  1. Fetch current share percentages.
  2. Loop and insert records to `dividend_distributions`.
  3. Create transaction logs for corresponding bank/cash accounts.

---

### 8. Verification & Test Plan

#### 8.1 Data Consistency & Edge Case Tests
1. **Zero Shares Sale**: Ensure a member cannot sell 0 or negative shares.
2. **Insufficient Shares Error**: If Member A owns 50 shares, transferring 51 shares to Member B must fail and rollback.
3. **Integer Allocation**: Ensure share math handles fractional allocations correctly if allowed, or strictly rounds shares to the nearest whole number (Rs. 1,000 increments).
4. **Cascade Safety**: Confirm that deleting a member is blocked if they hold active shares to prevent orphan records.

#### 8.2 Accounting Integrations
1. Verify that when an asset is purchased via `shop_funds`, the transaction successfully registers a debit against the main cash/bank account.
2. Verify that when dividends are distributed, the total payout amount matches the sum of individual disbursements.

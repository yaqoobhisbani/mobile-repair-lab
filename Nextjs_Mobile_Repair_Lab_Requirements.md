# Product Requirements Document (PRD) & Technical Specifications

## Project Name: Mobile Repair Lab Management System (Single-Admin)

---

### 1. Document Overview

This document outlines the functional requirements, system architecture, database design, and technical specifications for building a single-user Mobile Repair Lab Management System using **Next.js**. This application serves as an internal operational tool for a single Admin / Shop Owner to track device repairs, manage spare parts inventory, and handle customer billing/receipts.

---

### 2. User Roles & Access Control

- **Admin / Shop Owner (Only Account):** Full, unrestricted access to the entire application. This includes dashboard analytics, ticket lifecycle management, inventory controls, invoicing, and configuration settings.
- **Authentication:** Secured via an authentication layer (e.g., NextAuth.js or Clerk). Only the registered admin email/password can access internal routes (`/dashboard/*`).
- _Note: No customer login, multi-tenant registration, or separate technician roles are required._

---

### 3. Core Modules & Functional Requirements

#### Module 1: Ticket & Workflow Management

This module tracks a mobile device from the moment it is brought into the lab until it is picked up by the customer.

- **Ticket Creation Form:** Admin can create a new ticket with the following data fields:
  - **Customer Data:** Full Name, Phone Number, Email Address (Optional).
  - **Device Data:** Brand (e.g., Apple, Samsung), Model (e.g., iPhone 15 Pro, Galaxy S24), Serial/IMEI Number, Passcode/Pattern (for testing).
  - **Issue Data:** Problem Category (e.g., Screen, Battery, Liquid Damage, Software), Custom Problem Description, Initial Estimated Cost, Target Completion Date.
- **Repair Workflow Statuses:** The Admin manually transitions tickets through the following linear states:
  `Received` ➔ `Diagnosing` ➔ `Awaiting Parts` ➔ `Repairing` ➔ `Ready for Pickup` ➔ `Completed` / `Cancelled`
- **Public Status Tracking (No Login Required):**
  - A public-facing route (e.g., `/track`) containing a simple input field where a customer can enter their unique **Ticket ID** or **Phone Number**.
  - Displays a clean, read-only status timeline showing exactly where their device stands in the workflow, preventing the need for incoming phone inquiries.

#### Module 2: Inventory Management System

Tracks spare parts availability to prevent stockouts and automatically link component costs directly to repair bills.

- **Spare Parts Catalog:** Admin can manage inventory items with the following fields:
  - Unique SKU / Part ID
  - Part Name (e.g., "iPhone 13 OLED Screen Replacement")
  - Device Compatibility (Models supported)
  - Stock Quantity (Current physical count)
  - Low-Stock Threshold Trigger (e.g., alert when count is < 3)
  - Cost Price (What the shop paid)
  - Selling Price (What the customer is charged)
- **Inventory Deduction Logic:**
  - When editing a repair ticket, the Admin can select part(s) from an auto-complete dropdown populated from the Inventory Catalog.
  - When a part is attached to a ticket and the state moves past `Diagnosing`, the inventory system automatically deducts `1` unit from that part’s stock.
  - If a ticket is marked `Cancelled`, any allocated parts are restored to the inventory counts automatically.
- **Visual Low-Stock Indicators:** The main dashboard flags any item whose quantity falls below its low-stock threshold.

#### Module 3: Invoicing, Receipts & Payments

Handles financial tracking, dynamic itemized calculations, and printable documentation.

- **Dynamic Invoice Generation:** When generating an invoice for a ticket, the system automatically aggregates costs:
  - `Total Parts Cost` (Sum of all items attached from the inventory selection)
  - `Labor / Service Fee` (Flat or custom manually input fee determined by the Admin)
  - `Tax Rate` (Configurable percentage, e.g., 5%, 10%, or flat)
  - **Final Formula:** `Total = (Parts + Labor) * (1 + Tax Rate)`
- **Payment Tracking Statuses:**
  - `Unpaid` (Device received/diagnosing)
  - `Partially Paid` (For upfront diagnostic fees or expensive part deposits)
  - `Paid` (Full balance cleared upon delivery)
- **Payment Methods Logged:** Cash, Credit/Debit Card, Mobile/Digital Wallet.
- **Printable Receipt Interface:** A dedicated printable view layout optimized for clean formatting on A4 sheets or desktop thermal receipt printers, including a "Save to PDF" function.

---

### 4. Technical Specifications & Stack

#### Recommended Stack

- **Framework:** Next.js (App Router architecture with Server Actions for clean state/form handling).
- **Language:** TypeScript (for type safety across inventory counts and invoice math).
- **Database:** SQLite (ideal for single-user desktop run-time environments due to zero configuration) or PostgreSQL.
- **ORM:** Prisma or Drizzle ORM.
- **UI Components & Styling:** Tailwind CSS combined with Shadcn UI or NextUI for a polished, responsive dashboard theme.

#### Conceptual Database Schema (Relationships)

```
[Customer] 1 ─── 𝚺 [Ticket] 1 ─── 1 [Invoice]
                        │
                        └─── 𝚺 [TicketItems] 𝚺 ─── 1 [Inventory]
```

- **Customer Table:** `id`, `name`, `phone`, `email`, `created_at`
- **Ticket Table:** `id` (Short Unique Slug), `customer_id`, `brand`, `model`, `imei`, `passcode`, `problem_description`, `status` (Enum), `labor_cost`, `estimated_completion`, `created_at`
- **TicketItems Table (Junction):** `id`, `ticket_id`, `inventory_id`, `quantity_used`
- **Inventory Table:** `id`, `sku`, `part_name`, `compatibility`, `stock_qty`, `low_stock_threshold`, `cost_price`, `selling_price`
- **Invoice Table:** `id`, `ticket_id`, `tax_applied`, `payment_status`, `payment_method`, `total_amount`, `issued_at`

---

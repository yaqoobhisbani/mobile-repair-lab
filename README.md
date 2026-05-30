# Mobile Repair Lab

A full-stack mobile device repair shop management system built with Next.js 16. Manage repair tickets, inventory, sales, customers, and finances in one place.

## Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | Next.js 16 (App Router, React 19) |
| **Language** | TypeScript |
| **Database** | PostgreSQL |
| **ORM** | Drizzle ORM |
| **Auth** | bcryptjs (password hashing), jose (JWT), httpOnly cookies |
| **State / Data Fetching** | TanStack React Query |
| **UI** | Tailwind CSS v4, shadcn/ui (Radix primitives) |
| **Charts** | Recharts |
| **Toasts** | Sonner |
| **Icons** | Lucide React |
| **Testing** | Vitest v4, Testing Library, jsdom |

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database
- npm / bun

### Setup

1. **Clone and install**

```bash
git clone <repo-url>
cd mobile-repair-lab
npm install
```

2. **Configure environment**

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | PostgreSQL connection string (e.g. `postgres://user:pass@localhost:5432/mobile_repair_lab`) |
| `JWT_SECRET` | Cryptographically random secret for JWT signing (`openssl rand -base64 32`) |

3. **Set up the database**

```bash
npm run db:generate   # Generate SQL migration
npm run db:migrate    # Apply migration to database
npm run db:seed       # Seed default admin user
```

4. **Run**

```bash
npm run dev           # http://localhost:3000
```

### Default credentials

After seeding, login with:

- Email: `admin@example.com`
- Password: `password123`

## Public Routes (no login required)

| Route | Description |
|---|---|
| `/` | Landing page |
| `/login` | Login form |
| `/track` | Public ticket status lookup by ticket ID |
| `/price-list` | Public inventory price list (ISR, revalidates every 30s) |

## Dashboard Routes (login required)

| Route | Description |
|---|---|
| `/dashboard` | Overview with active tickets, stock, balance, expenses, and sales stats |
| `/dashboard/tickets` | Repair ticket list with search, filter, and pagination |
| `/dashboard/tickets/[id]` | Ticket detail with edit form, parts management, status history, and payment |
| `/dashboard/tickets/[id]/invoice` | Printable invoice view |
| `/dashboard/sales` | Over-the-counter sales list |
| `/dashboard/sales/[id]` | Sale receipt detail |
| `/dashboard/customers` | Customer list with CRUD |
| `/dashboard/inventory` | Inventory/parts list with CRUD |
| `/dashboard/accounts` | Financial accounts management |
| `/dashboard/accounts/[id]` | Account detail with transaction history |
| `/dashboard/expenses` | Business expense list with CRUD |
| `/dashboard/reports` | Profit reports with chart and summary |
| `/dashboard/settings` | Shop settings (name, address, phone, currency) |

## API Routes

All API routes are protected by JWT-based proxy middleware (except login and logout).

### Auth
| Method | Route | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate user, returns JWT in httpOnly cookie |
| POST | `/api/auth/logout` | Clear auth cookie |
| GET | `/api/auth/me` | Get current user info |

### Tickets
| Method | Route | Description |
|---|---|---|
| GET | `/api/tickets` | List tickets (supports `?search=` and `?limit=`) |
| POST | `/api/tickets` | Create ticket with auto-generated ID (`TKT-xxx`) |
| GET | `/api/tickets/[id]` | Get ticket with items and status history |
| PUT | `/api/tickets/[id]` | Update ticket, recalculate totals, handle payment |
| DELETE | `/api/tickets/[id]` | Delete ticket, restore stock, reverse payment |
| POST | `/api/tickets/[id]/items` | Add part to ticket, decrement stock |
| DELETE | `/api/tickets/[id]/items` | Remove part from ticket, restore stock |

### Customers
| Method | Route | Description |
|---|---|---|
| GET | `/api/customers` | List customers (supports `?search=` and `?limit=`) |
| POST | `/api/customers` | Create customer |
| GET | `/api/customers/[id]` | Get customer |
| PUT | `/api/customers/[id]` | Update customer |
| DELETE | `/api/customers/[id]` | Delete customer (checks for dependencies) |

### Inventory
| Method | Route | Description |
|---|---|---|
| GET | `/api/inventory` | List inventory (supports `?search=` and `?limit=`) |
| POST | `/api/inventory` | Create inventory item, optionally debit account for purchase cost |
| GET | `/api/inventory/[id]` | Get item by ID or SKU |
| PUT | `/api/inventory/[id]` | Update item, handle stock increase with cost accounting |
| DELETE | `/api/inventory/[id]` | Delete item |

### Sales
| Method | Route | Description |
|---|---|---|
| GET | `/api/sales` | List sales (supports `?search=` and `?limit=`) |
| POST | `/api/sales` | Create sale with auto-generated ID (`SALE-xxx`), validate/decrement stock, credit account |
| GET | `/api/sales/[id]` | Get sale with line items |
| DELETE | `/api/sales/[id]` | Delete sale, restore stock, reverse credit |

### Accounts / Finance
| Method | Route | Description |
|---|---|---|
| GET | `/api/accounts` | List accounts |
| POST | `/api/accounts` | Create account (bank/cash) with optional opening balance |
| GET | `/api/accounts/[id]` | Get account |
| PUT | `/api/accounts/[id]` | Update account name/type/description |
| DELETE | `/api/accounts/[id]` | Delete account (checks for dependencies) |
| POST | `/api/accounts/[id]/topup` | Add funds to account |
| POST | `/api/accounts/[id]/transfer` | Transfer between accounts |
| GET | `/api/accounts/[id]/transactions` | Get transaction history |

### Expenses
| Method | Route | Description |
|---|---|---|
| GET | `/api/expenses` | List expenses with account names |
| POST | `/api/expenses` | Create expense, debit account |
| DELETE | `/api/expenses/[id]` | Delete expense, restore balance, record reversal |

### Settings & Reports
| Method | Route | Description |
|---|---|---|
| GET | `/api/settings` | Get shop settings (auto-creates defaults) |
| PUT | `/api/settings` | Update shop settings |
| GET | `/api/reports/profit` | Profit report with period grouping (`?period=daily\|weekly\|monthly\|yearly`) |

## Database Schema

13 tables in a PostgreSQL database:

| Table | Purpose |
|---|---|
| `users` | Admin/staff authentication |
| `customers` | Walk-in customer records |
| `inventory` | Repair parts with stock tracking and pricing |
| `accounts` | Financial accounts (bank/cash) with balance |
| `tickets` | Repair tickets with status workflow |
| `ticket_items` | Parts used on each ticket |
| `ticket_status_history` | Audit trail for status changes |
| `invoices` | Invoice records tied to tickets |
| `expenses` | Business expense tracking |
| `settings` | Single-row shop configuration |
| `sale_orders` | Over-the-counter parts sales |
| `sale_items` | Line items for sale orders |
| `transactions` | Double-entry ledger for all financial movements |

## Authentication

The auth system uses a **stateless JWT** approach:

1. **Login**: User submits email/password → server verifies with bcrypt → signs a JWT (HS256, 7-day expiry) → sets `mrl_session` httpOnly cookie
2. **API protection**: `proxy.ts` (Next.js v16 proxy/middleware) verifies the JWT on every `/api/*` request, except login and logout
3. **Client-side**: `AuthProvider` reads `/api/auth/me` on mount to restore session; `useAuth()` hook provides `user`, `login()`, `logout()`
4. **Dashboard guard**: `app/dashboard/layout.tsx` redirects to `/login` if unauthenticated

## Security

- **Password hashing**: bcryptjs with 12 salt rounds
- **SQL injection**: All queries use Drizzle ORM parameterized queries — no raw SQL
- **Cookie**: `httpOnly` + `secure` (in production) + `sameSite: lax`
- **JWT secret**: Required via `JWT_SECRET` environment variable; no fallback

## Testing

### Test suites

```bash
npm test               # Run all tests (API + components)
npm run test:api       # API/integration tests (Vitest, node environment)
npm run test:components # Component tests (Vitest, jsdom environment)
```

- **API tests** (71 tests): Test all route handlers directly with mocked requests, a real PostgreSQL test database with `DATABASE_URL_TEST`, and automatic truncation between tests
- **Component tests** (181 tests): Test all UI components and forms with Testing Library, mocking auth context as needed

### Test infrastructure

- `tests/global-setup.ts` — Test database setup/teardown
- `tests/setup.ts` — Test helpers (mockRequest, createUser, truncateAll)
- `tests/components/setup.tsx` — Component test wrappers
- `.env.test` — Test database configuration

## Project Structure

```
mobile-repair-lab/
├── app/                    # Next.js App Router pages and API routes
│   ├── api/               # API route handlers
│   ├── dashboard/         # Protected dashboard pages
│   ├── login/             # Login page
│   ├── price-list/        # Public price list page
│   ├── track/             # Public ticket tracking page
│   ├── layout.tsx         # Root layout with providers
│   └── page.tsx           # Landing page
├── components/            # React components
│   ├── forms/            # Form components (create/edit for each resource)
│   └── ui/               # shadcn/ui primitive components
├── db/                    # Database layer
│   ├── schema.ts         # Drizzle ORM schema definitions
│   ├── index.ts          # Database client initialization
│   ├── seed.ts           # Admin user seeder
│   ├── settings.ts       # Settings CRUD
│   └── transactions.ts   # Transaction log helper
├── lib/                   # Shared utilities
│   ├── auth-server.ts    # Server-side auth (JWT, password, cookies)
│   ├── auth-context.tsx   # Client-side auth context
│   ├── api.ts             # Generic fetch wrapper
│   ├── query-client.ts   # TanStack Query client factory
│   ├── query-keys.ts     # Typed query keys
│   ├── utils.ts           # Utility functions (cn, capitalize)
│   └── privacy-mode-context.tsx  # Privacy mode toggle
├── hooks/                 # Custom React hooks
├── tests/                 # Test suites
│   ├── api/              # API/integration tests
│   └── components/       # Component tests
├── proxy.ts              # Next.js v16 proxy (auth middleware)
├── vitest.config.ts      # Vitest test configuration
├── drizzle.config.ts     # Drizzle Kit configuration
└── next.config.ts        # Next.js configuration
```

## NPM Scripts

| Script | Description |
|---|---|
| `dev` | Start development server |
| `build` | Build for production |
| `start` | Start production server |
| `lint` | Run ESLint |
| `test` | Run all tests |
| `test:api` | Run API tests |
| `test:components` | Run component tests |
| `db:generate` | Generate Drizzle migrations |
| `db:migrate` | Apply migrations |
| `db:seed` | Seed admin user |

## Deployment

Deploy as a standard Next.js application to any Node.js host (Vercel, Railway, Docker, etc.). The PostgreSQL database must be accessible from the deployment environment. Set both `DATABASE_URL` and `JWT_SECRET` environment variables in your deployment environment.

```bash
npm run build
npm run start
```

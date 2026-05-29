CREATE TABLE IF NOT EXISTS "sale_orders" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"customer_name" varchar(255),
	"customer_phone" varchar(50),
	"payment_account_id" integer NOT NULL REFERENCES "accounts"("id"),
	"total_amount" numeric(10, 2) NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS "sale_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"sale_id" varchar(20) NOT NULL REFERENCES "sale_orders"("id"),
	"inventory_id" integer NOT NULL REFERENCES "inventory"("id"),
	"quantity" integer DEFAULT 1 NOT NULL,
	"unit_price" numeric(10, 2) NOT NULL
);

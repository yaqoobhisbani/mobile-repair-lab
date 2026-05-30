ALTER TABLE "invoices" ADD COLUMN "labor_cost" numeric(10,2);
ALTER TABLE "invoices" ADD COLUMN "discount_type" varchar(20);
ALTER TABLE "invoices" ADD COLUMN "discount_value" numeric(10,2);

CREATE TABLE IF NOT EXISTS "invoice_items" (
  "id" serial PRIMARY KEY NOT NULL,
  "invoice_id" integer NOT NULL REFERENCES "invoices"("id"),
  "part_name" varchar(255) NOT NULL,
  "sku" varchar(100) NOT NULL,
  "unit_price" numeric(10,2) NOT NULL,
  "quantity" integer NOT NULL DEFAULT 1
);

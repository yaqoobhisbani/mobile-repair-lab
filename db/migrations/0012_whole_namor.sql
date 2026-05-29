ALTER TABLE "sale_orders" ADD COLUMN "customer_id" integer REFERENCES "customers"("id");

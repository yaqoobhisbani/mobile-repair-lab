ALTER TABLE "sale_orders" ADD COLUMN "discount_type" varchar(20);
ALTER TABLE "sale_orders" ADD COLUMN "discount_value" numeric(10, 2);
ALTER TABLE "tickets" ADD COLUMN "discount_type" varchar(20);
ALTER TABLE "tickets" ADD COLUMN "discount_value" numeric(10, 2);

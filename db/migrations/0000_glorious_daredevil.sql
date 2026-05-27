CREATE TYPE "public"."payment_method" AS ENUM('cash', 'card', 'mobile_wallet');--> statement-breakpoint
CREATE TYPE "public"."payment_status" AS ENUM('unpaid', 'partially_paid', 'paid');--> statement-breakpoint
CREATE TYPE "public"."ticket_status" AS ENUM('received', 'diagnosing', 'awaiting_parts', 'repairing', 'ready_for_pickup', 'completed', 'cancelled');--> statement-breakpoint
CREATE TABLE "customers" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"phone" varchar(50) NOT NULL,
	"email" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "inventory" (
	"id" serial PRIMARY KEY NOT NULL,
	"sku" varchar(100) NOT NULL,
	"part_name" varchar(255) NOT NULL,
	"compatibility" varchar(255),
	"stock_qty" integer DEFAULT 0 NOT NULL,
	"low_stock_threshold" integer DEFAULT 0,
	"cost_price" numeric(10, 2),
	"selling_price" numeric(10, 2),
	CONSTRAINT "inventory_sku_unique" UNIQUE("sku")
);
--> statement-breakpoint
CREATE TABLE "invoices" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" varchar(20) NOT NULL,
	"payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL,
	"payment_method" "payment_method",
	"total_amount" numeric(10, 2) NOT NULL,
	"issued_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ticket_items" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" varchar(20) NOT NULL,
	"inventory_id" integer NOT NULL,
	"quantity_used" integer DEFAULT 1 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tickets" (
	"id" varchar(20) PRIMARY KEY NOT NULL,
	"customer_id" integer NOT NULL,
	"brand" varchar(100) NOT NULL,
	"model" varchar(255) NOT NULL,
	"imei" varchar(100),
	"passcode" varchar(255),
	"problem_category" varchar(100),
	"problem_description" text,
	"status" "ticket_status" DEFAULT 'received' NOT NULL,
	"labor_cost" numeric(10, 2),
	"estimated_completion" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ticket_items" ADD CONSTRAINT "ticket_items_inventory_id_inventory_id_fk" FOREIGN KEY ("inventory_id") REFERENCES "public"."inventory"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_customer_id_customers_id_fk" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE no action ON UPDATE no action;
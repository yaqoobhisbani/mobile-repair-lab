CREATE TABLE "business_assets" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"cost_price" numeric(12, 2) NOT NULL,
	"purchase_date" timestamp DEFAULT now() NOT NULL,
	"purchased_by_member_id" integer,
	"funding_source" varchar(50) DEFAULT 'member_equity' NOT NULL,
	"depreciation_rate" numeric(5, 2) DEFAULT '0.00',
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "business_members" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"email" varchar(255),
	"phone" varchar(50),
	"role" varchar(100) DEFAULT 'partner' NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dividend_distributions" (
	"id" serial PRIMARY KEY NOT NULL,
	"member_id" integer NOT NULL,
	"amount" numeric(12, 2) NOT NULL,
	"payout_date" timestamp DEFAULT now() NOT NULL,
	"shareholding_percentage" numeric(5, 2) NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "share_transactions" (
	"id" serial PRIMARY KEY NOT NULL,
	"transaction_type" varchar(50) NOT NULL,
	"seller_member_id" integer,
	"buyer_member_id" integer,
	"shares_count" numeric(12, 2) NOT NULL,
	"price_per_share" numeric(10, 2) DEFAULT '1000.00' NOT NULL,
	"total_amount" numeric(12, 2) NOT NULL,
	"transaction_date" timestamp DEFAULT now() NOT NULL,
	"notes" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "business_assets" ADD CONSTRAINT "business_assets_purchased_by_member_id_business_members_id_fk" FOREIGN KEY ("purchased_by_member_id") REFERENCES "public"."business_members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dividend_distributions" ADD CONSTRAINT "dividend_distributions_member_id_business_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."business_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_transactions" ADD CONSTRAINT "share_transactions_seller_member_id_business_members_id_fk" FOREIGN KEY ("seller_member_id") REFERENCES "public"."business_members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "share_transactions" ADD CONSTRAINT "share_transactions_buyer_member_id_business_members_id_fk" FOREIGN KEY ("buyer_member_id") REFERENCES "public"."business_members"("id") ON DELETE cascade ON UPDATE no action;
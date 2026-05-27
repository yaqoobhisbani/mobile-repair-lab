ALTER TABLE "tickets" ADD COLUMN "payment_status" "payment_status" DEFAULT 'unpaid' NOT NULL;--> statement-breakpoint
ALTER TABLE "tickets" ADD COLUMN "payment_account_id" integer;--> statement-breakpoint
ALTER TABLE "tickets" ADD CONSTRAINT "tickets_payment_account_id_accounts_id_fk" FOREIGN KEY ("payment_account_id") REFERENCES "public"."accounts"("id") ON DELETE no action ON UPDATE no action;
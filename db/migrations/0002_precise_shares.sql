ALTER TABLE "share_transactions" ALTER COLUMN "shares_count" SET DATA TYPE numeric(16, 6);--> statement-breakpoint
ALTER TABLE "share_transactions" ALTER COLUMN "price_per_share" SET DATA TYPE numeric(12, 4);--> statement-breakpoint
ALTER TABLE "share_transactions" ALTER COLUMN "price_per_share" SET DEFAULT '1000.0000';--> statement-breakpoint
ALTER TABLE "share_transactions" ALTER COLUMN "total_amount" SET DATA TYPE numeric(16, 4);

ALTER TABLE "inventory" ADD COLUMN "account_id" integer REFERENCES "accounts"("id");

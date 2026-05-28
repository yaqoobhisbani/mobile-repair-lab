CREATE TABLE "settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"shop_name" varchar(255) DEFAULT 'Mobile Repair Lab' NOT NULL,
	"shop_address" varchar(500) DEFAULT '123 Repair Street, City, State 12345' NOT NULL,
	"shop_phone" varchar(50) DEFAULT '(555) 987-6543' NOT NULL,
	"currency" varchar(10) DEFAULT 'PKR' NOT NULL
);

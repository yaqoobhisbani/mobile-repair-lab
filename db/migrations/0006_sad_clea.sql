CREATE TABLE "ticket_status_history" (
	"id" serial PRIMARY KEY NOT NULL,
	"ticket_id" varchar(20) NOT NULL,
	"status" "ticket_status" NOT NULL,
	"changed_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ticket_status_history" ADD CONSTRAINT "ticket_status_history_ticket_id_tickets_id_fk" FOREIGN KEY ("ticket_id") REFERENCES "public"."tickets"("id") ON DELETE no action ON UPDATE no action;
CREATE TABLE "invoice" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"organization_to_feed_id" uuid NOT NULL,
	"invoice_number" varchar(255) NOT NULL,
	"amount" numeric NOT NULL,
	"status" varchar(50) DEFAULT 'pending' NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"paid_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organization_to_feed_id_organization_to_feed_id_fk" FOREIGN KEY ("organization_to_feed_id") REFERENCES "public"."organization_to_feed"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "invoice_org_idx" ON "invoice" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "invoice_org_feed_idx" ON "invoice" USING btree ("organization_to_feed_id");--> statement-breakpoint
CREATE INDEX "invoice_number_idx" ON "invoice" USING btree ("invoice_number");--> statement-breakpoint
CREATE INDEX "invoice_status_idx" ON "invoice" USING btree ("status");
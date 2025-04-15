ALTER TABLE "invoice" DROP CONSTRAINT "invoice_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "invoice" DROP CONSTRAINT "invoice_organization_to_feed_id_organization_to_feed_id_fk";
--> statement-breakpoint
ALTER TABLE "organization_to_feed" DROP CONSTRAINT "organization_to_feed_feed_id_feed_id_fk";
--> statement-breakpoint
ALTER TABLE "organization_to_feed" DROP CONSTRAINT "organization_to_feed_organization_id_organization_id_fk";
--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invoice" ADD CONSTRAINT "invoice_organization_to_feed_id_organization_to_feed_id_fk" FOREIGN KEY ("organization_to_feed_id") REFERENCES "public"."organization_to_feed"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_to_feed" ADD CONSTRAINT "organization_to_feed_feed_id_feed_id_fk" FOREIGN KEY ("feed_id") REFERENCES "public"."feed"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "organization_to_feed" ADD CONSTRAINT "organization_to_feed_organization_id_organization_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organization"("id") ON DELETE cascade ON UPDATE no action;
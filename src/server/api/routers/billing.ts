import { z } from "zod";
import { eq, and, sql, desc, inArray } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  organizationToFeed,
  organizations,
  invoices,
} from "~/server/db/schema";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { elevatedProcedure, adminProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";

dayjs.extend(isBetween);

// Input validation schemas
const generateInvoiceSchema = z.object({
  organizationId: z.string(),
  subscriptionIds: z.array(z.string()).optional(),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
});

const updateInvoiceStatusSchema = z.object({
  invoiceId: z.string(),
  status: z.enum(["pending", "paid", "cancelled"]),
  paidAt: z.date().optional(),
});

export const billingRouter = createTRPCRouter({
  // Generate invoice for an organization
  generateInvoice: adminProcedure
    .input(generateInvoiceSchema)
    .mutation(async ({ input }) => {
      const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, input.organizationId),
      });

      if (!organization || input.subscriptionIds?.length === 0)
        throw new Error("Invalid input");

      // Get subscriptions for the organization
      const subscriptions = await db.query.organizationToFeed.findMany({
        where: and(
          eq(organizationToFeed.organizationId, input.organizationId),
          input.subscriptionIds
            ? inArray(organizationToFeed.id, input.subscriptionIds)
            : undefined,
        ),
        with: {
          feed: true,
        },
      });

      // Calculate billing amounts
      const line_items = subscriptions.map((sub) => ({
        feedName: sub.feed.name,
        amount: sub.billingAmount,
        period: sub.billingFrequency ?? "one-time",
      }));

      const total_amount = line_items.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      );

      const due_date = dayjs(input.dueDate).toDate();
      const invoice_number = `INV-${Date.now()}`;

      // Create invoice record in database
      const [invoice] = await db
        .insert(invoices)
        .values({
          organizationId: organization.id,
          organizationToFeedId: subscriptions[0]?.id ?? "", // Handle potential undefined,
          amount: total_amount.toString(), // Convert to string for decimal type
          dueDate: due_date,
          status: "pending",
          invoiceNumber: invoice_number,
        })
        .returning();

      return invoice;
    }),

  // Update invoice status
  updateInvoiceStatus: adminProcedure
    .input(updateInvoiceStatusSchema)
    .mutation(async ({ input }) => {
      const [updatedInvoice] = await db
        .update(invoices)
        .set({
          status: input.status,
          paidAt: input.status === "paid" ? (input.paidAt ?? new Date()) : null,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.invoiceId))
        .returning();

      return updatedInvoice;
    }),

  // Get billing summary for an organization
  getBillingSummary: elevatedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      try {
        const subscriptions = await db.query.organizationToFeed.findMany({
          where: eq(organizationToFeed.organizationId, input.organizationId),
          with: {
            feed: true,
          },
        });

        const monthly_total = subscriptions
          .filter((sub) => sub.billingFrequency === "monthly")
          .reduce((sum, sub) => sum + Number(sub.billingAmount), 0);

        const yearly_total = subscriptions
          .filter((sub) => sub.billingFrequency === "yearly")
          .reduce((sum, sub) => sum + Number(sub.billingAmount), 0);

        return {
          monthly_recurring: monthly_total,
          yearly_recurring: yearly_total,
          total_subscriptions: subscriptions.length,
        };
      } catch (error) {
        console.error(error);
        return {
          monthly_recurring: 0,
          yearly_recurring: 0,
          total_subscriptions: 0,
        };
      }
    }),

  // Get billing metrics for all organizations
  getBillingMetrics: protectedProcedure
    .input(
      z.object({
        months: z.number().optional().default(12), // Number of months of history to return
      }),
    )
    .query(async ({ input }) => {
      // Fetch both invoices and active subscriptions with their timestamps
      const invoices_data = await db.query.invoices.findMany({
        with: {
          organizationToFeed: true,
        },
        orderBy: [desc(invoices.createdAt)],
      });
      const subscriptions = await db.query.organizationToFeed.findMany({
        with: {
          feed: true,
        },
      });

      // Calculate monthly metrics for the past N months
      const monthly_metrics = [];
      const today = new Date();
      for (let i = 0; i < (input.months ?? 12); i++) {
        const target_date = dayjs(today).subtract(i, "month");
        const start_of_month = target_date.startOf("month").toDate();
        const end_of_month = target_date.endOf("month").toDate();

        // Filter invoices and subscriptions for this month
        const month_invoices = invoices_data.filter((inv) =>
          dayjs(inv.createdAt).isBetween(
            start_of_month,
            end_of_month,
            null,
            "[]",
          ),
        );

        const month_subscriptions = subscriptions.filter(
          (sub) =>
            (!sub.accessUntil ||
              dayjs(sub.accessUntil).isAfter(start_of_month)) &&
            dayjs(sub.createdAt).isBefore(end_of_month),
        );

        const month_metrics = {
          month: dayjs(start_of_month).format("YYYY-MM"),
          mrr: month_subscriptions
            .filter((sub) => sub.billingFrequency === "monthly")
            .reduce((sum, sub) => sum + Number(sub.billingAmount), 0),
          arr: month_subscriptions
            .filter((sub) => sub.billingFrequency === "yearly")
            .reduce((sum, sub) => sum + Number(sub.billingAmount), 0),
          total_invoiced: month_invoices.reduce(
            (sum, inv) => sum + Number(inv.amount),
            0,
          ),
          active_subscriptions: month_subscriptions.length,
          new_subscriptions: subscriptions.filter((sub) =>
            dayjs(sub.createdAt).isBetween(
              start_of_month,
              end_of_month,
              null,
              "[]",
            ),
          ).length,
        };

        monthly_metrics.push(month_metrics);
      }

      // Calculate current metrics (existing code)
      const invoice_metrics = {
        total_invoiced: invoices_data.reduce(
          (sum, inv) => sum + Number(inv.amount),
          0,
        ),
        total_paid: invoices_data
          .filter((inv) => inv.status === "paid")
          .reduce((sum, inv) => sum + Number(inv.amount), 0),
        total_pending: invoices_data
          .filter((inv) => inv.status === "pending")
          .reduce((sum, inv) => sum + Number(inv.amount), 0),
        invoice_count: invoices_data.length,
        paid_invoice_count: invoices_data.filter((inv) => inv.status === "paid")
          .length,
      };

      const subscription_metrics = {
        total_mrr: subscriptions
          .filter((sub) => sub.billingFrequency === "monthly")
          .reduce((sum, sub) => sum + Number(sub.billingAmount), 0),
        total_arr: subscriptions
          .filter((sub) => sub.billingFrequency === "yearly")
          .reduce((sum, sub) => sum + Number(sub.billingAmount), 0),
        organization_count: new Set(
          subscriptions.map((sub) => sub.organizationId),
        ).size,
        subscription_count: subscriptions.length,
        monthly_subscriptions: subscriptions.filter(
          (sub) => sub.billingFrequency === "monthly",
        ).length,
        yearly_subscriptions: subscriptions.filter(
          (sub) => sub.billingFrequency === "yearly",
        ).length,
        average_subscription_value:
          subscriptions.length > 0
            ? subscriptions.reduce(
                (sum, sub) => sum + Number(sub.billingAmount),
                0,
              ) / subscriptions.length
            : 0,
      };

      const derived_metrics = {
        average_invoice_value:
          invoices_data.length > 0
            ? invoice_metrics.total_invoiced / invoices_data.length
            : 0,
        collection_rate:
          invoice_metrics.total_invoiced > 0
            ? (invoice_metrics.total_paid / invoice_metrics.total_invoiced) *
              100
            : 0,
      };

      return {
        current: {
          ...invoice_metrics,
          ...subscription_metrics,
          ...derived_metrics,
        },
        historical: monthly_metrics.reverse(),
      };
    }),

  getAllBillingHistory: protectedProcedure.query(async () => {
    return db.query.invoices.findMany({
      orderBy: [desc(invoices.createdAt)],
      with: {
        organizationToFeed: {
          with: {
            feed: true,
          },
        },
      },
    });
  }),

  // Get billing history for an organization
  getBillingHistory: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      return db.query.invoices.findMany({
        where: eq(invoices.organizationId, input.organizationId),
        limit: input.limit ?? 10,
        orderBy: [desc(invoices.createdAt)],
        with: {
          organizationToFeed: {
            with: {
              feed: true,
            },
          },
        },
      });
    }),

  updateInvoice: adminProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        amount: z.number(),
        status: z.enum(["paid", "pending", "overdue"]),
        date: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const [updated_invoice] = await db
        .update(invoices)
        .set({
          amount: input.amount.toString(), // Convert to string for decimal type
          status: input.status,
          dueDate: new Date(input.date),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.invoiceId))
        .returning();

      return updated_invoice;
    }),

  deleteInvoice: adminProcedure
    .input(
      z.object({
        invoiceId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const [deleted_invoice] = await db
        .delete(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .returning();

      return deleted_invoice;
    }),
});

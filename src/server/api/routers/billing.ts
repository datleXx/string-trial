import { z } from "zod";
import { eq, and, sql, desc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  organizationToFeed,
  organizations,
  invoices,
} from "~/server/db/schema";
import dayjs from "dayjs";
import { elevatedProcedure, adminProcedure } from "~/server/api/trpc";

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
    .mutation(async ({ ctx, input }) => {
      const organization = await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, input.organizationId),
      });

      if (!organization) throw new Error("Organization not found");

      // Get subscriptions for the organization
      const subscriptions = await ctx.db.query.organizationToFeed.findMany({
        where: and(
          eq(organizationToFeed.organizationId, input.organizationId),
          input.subscriptionIds
            ? sql`${organizationToFeed.id} = ANY(${input.subscriptionIds})`
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
      const [invoice] = await ctx.db
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
    .mutation(async ({ ctx, input }) => {
      const [updatedInvoice] = await ctx.db
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
    .query(async ({ ctx, input }) => {
      try {
        const subscriptions = await ctx.db.query.organizationToFeed.findMany({
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
  getBillingMetrics: protectedProcedure.query(async ({ ctx }) => {
    const subscriptions = await ctx.db.query.organizationToFeed.findMany({
      with: {
        organization: true,
        feed: true,
      },
    });

    // Calculate metrics
    const metrics = {
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
      average_subscription_value:
        subscriptions.length > 0
          ? subscriptions.reduce(
              (sum, sub) => sum + Number(sub.billingAmount),
              0,
            ) / subscriptions.length
          : 0,
    };

    return metrics;
  }),

  getAllBillingHistory: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.invoices.findMany({
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
    .query(async ({ ctx, input }) => {
      return ctx.db.query.invoices.findMany({
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
    .mutation(async ({ ctx, input }) => {
      const [updated_invoice] = await ctx.db
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
    .mutation(async ({ ctx, input }) => {
      const [deleted_invoice] = await ctx.db
        .delete(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .returning();

      return deleted_invoice;
    }),
});

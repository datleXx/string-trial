import { z } from "zod";
import { desc, eq, and, sql } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { organizationToFeed, organizations, feeds } from "~/server/db/schema";

// Input validation schemas
const generateInvoiceSchema = z.object({
  organizationId: z.number(),
  subscriptionIds: z.array(z.number()).optional(),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

const billingPeriodSchema = z.object({
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
});

export const billingRouter = createTRPCRouter({
  // Generate invoice for an organization
  generateInvoice: protectedProcedure
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
      const lineItems = subscriptions.map((sub) => ({
        feedName: sub.feed.name,
        amount: sub.billingAmount,
        period: sub.billingFrequency,
      }));

      const totalAmount = lineItems.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      );

      // Generate invoice JSON
      return {
        invoiceNumber: `INV-${Date.now()}`,
        organization: {
          id: organization.id,
          name: organization.name,
          billingEmail: organization.billingEmail,
        },
        billingPeriod: {
          startDate: input.startDate,
          endDate: input.endDate,
        },
        lineItems,
        totalAmount,
        generatedAt: new Date().toISOString(),
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
      };
    }),

  // Get billing summary for an organization
  getBillingSummary: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ ctx, input }) => {
      try {
        const subscriptions = await ctx.db.query.organizationToFeed.findMany({
          where: eq(organizationToFeed.organizationId, input.organizationId),
          with: {
            feed: true,
          },
        });

        const monthlyTotal = subscriptions
          .filter((sub) => sub.billingFrequency === "monthly")
          .reduce((sum, sub) => sum + Number(sub.billingAmount), 0);

        const yearlyTotal = subscriptions
          .filter((sub) => sub.billingFrequency === "yearly")
          .reduce((sum, sub) => sum + Number(sub.billingAmount), 0);

        return {
          monthlyRecurring: monthlyTotal,
          yearlyRecurring: yearlyTotal,
          totalSubscriptions: subscriptions.length,
        };
      } catch (error) {
        console.error(error);
        return {
          monthlyRecurring: 0,
          yearlyRecurring: 0,
          totalSubscriptions: 0,
        };
      }
    }),

  // Get billing metrics for all organizations
  getBillingMetrics: protectedProcedure
    .input(billingPeriodSchema)
    .query(async ({ ctx, input }) => {
      const subscriptions = await ctx.db.query.organizationToFeed.findMany({
        with: {
          organization: true,
          feed: true,
        },
      });

      // Calculate metrics
      const metrics = {
        totalMRR: subscriptions
          .filter((sub) => sub.billingFrequency === "monthly")
          .reduce((sum, sub) => sum + Number(sub.billingAmount), 0),
        totalARR: subscriptions
          .filter((sub) => sub.billingFrequency === "yearly")
          .reduce((sum, sub) => sum + Number(sub.billingAmount), 0),
        organizationCount: new Set(
          subscriptions.map((sub) => sub.organizationId),
        ).size,
        subscriptionCount: subscriptions.length,
        averageSubscriptionValue:
          subscriptions.length > 0
            ? subscriptions.reduce(
                (sum, sub) => sum + Number(sub.billingAmount),
                0,
              ) / subscriptions.length
            : 0,
      };

      return metrics;
    }),

  // Get billing history for an organization
  getBillingHistory: protectedProcedure
    .input(
      z.object({
        organizationId: z.number(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // This is a stub that would normally pull from a billing_history or invoices table
      // For now, we'll return mock data based on the subscriptions
      const subscriptions = await ctx.db.query.organizationToFeed.findMany({
        where: eq(organizationToFeed.organizationId, input.organizationId),
        with: {
          feed: true,
        },
        limit: input.limit ?? 10,
      });

      return subscriptions.map((sub) => ({
        id: `BILL-${sub.id}`,
        date: sub.createdAt,
        amount: sub.billingAmount,
        status: "paid",
        description: `Subscription to ${sub.feed.name}`,
        billingFrequency: sub.billingFrequency,
      }));
    }),
});

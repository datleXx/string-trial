import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { organizationToFeed, organizations, feeds } from "~/server/db/schema";

// Input validation schemas
const subscriptionIdSchema = z.object({ id: z.string() });

const createSubscriptionSchema = z.object({
  organizationId: z.string(),
  feedId: z.string(),
  accessUntil: z.string().datetime(),
  dashboardUrl: z.string().url().optional(),
  deliveryMethod: z.enum(["api", "sftp", "email"]).optional(),
  deliveryConfig: z.record(z.unknown()).optional(),
  successEmails: z.array(z.string().email()).optional(),
  failEmails: z.array(z.string().email()).optional(),
  schemaUpdateEmails: z.array(z.string().email()).optional(),
  billingAmount: z.number(),
  billingFrequency: z.enum(["monthly", "yearly"]),
});

const updateSubscriptionSchema = createSubscriptionSchema.partial().extend({
  id: z.string(),
});

export const subscriptionRouter = createTRPCRouter({
  // Get all subscriptions with organization and feed details
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.organizationToFeed.findMany({
      with: {
        organization: true,
        feed: true,
      },
      orderBy: [desc(organizationToFeed.createdAt)],
    });
  }),

  // Get a single subscription by ID
  getById: protectedProcedure
    .input(subscriptionIdSchema)
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.organizationToFeed.findFirst({
        where: eq(organizationToFeed.id, input.id),
        with: {
          organization: true,
          feed: true,
        },
      });
    }),

  // Create a new subscription
  create: protectedProcedure
    .input(createSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      // Verify organization and feed exist
      const [org, feed] = await Promise.all([
        ctx.db.query.organizations.findFirst({
          where: eq(organizations.id, input.organizationId),
        }),
        ctx.db.query.feeds.findFirst({
          where: eq(feeds.id, input.feedId),
        }),
      ]);

      if (!org) throw new Error("Organization not found");
      if (!feed) throw new Error("Feed not found");

      return await ctx.db.insert(organizationToFeed).values({
        organizationId: input.organizationId,
        feedId: input.feedId,
        accessUntil: new Date(input.accessUntil),
        dashboardUrl: input.dashboardUrl,
        deliveryMethod: input.deliveryMethod,
        deliveryConfig: input.deliveryConfig,
        successEmails: input.successEmails,
        failEmails: input.failEmails,
        schemaUpdateEmails: input.schemaUpdateEmails,
        billingAmount: input.billingAmount.toString(),
        billingFrequency: input.billingFrequency,
      });
    }),

  // Update a subscription
  update: protectedProcedure
    .input(updateSubscriptionSchema)
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;

      // Convert types for database
      const processedData = {
        ...updateData,
        accessUntil: updateData.accessUntil
          ? new Date(updateData.accessUntil)
          : undefined,
        billingAmount: updateData.billingAmount?.toString(),
      };

      return await ctx.db
        .update(organizationToFeed)
        .set(processedData)
        .where(eq(organizationToFeed.id, id));
    }),

  // Delete a subscription
  delete: protectedProcedure
    .input(subscriptionIdSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(organizationToFeed)
        .where(eq(organizationToFeed.id, input.id));
    }),

  // Get subscriptions by organization
  getByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.organizationToFeed.findMany({
        where: eq(organizationToFeed.organizationId, input.organizationId),
        with: {
          feed: true,
        },
        orderBy: [desc(organizationToFeed.createdAt)],
      });
    }),

  // Get active subscriptions (not expired)
  getActive: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.organizationToFeed.findMany({
      where: sql`${organizationToFeed.accessUntil} > CURRENT_TIMESTAMP`,
      with: {
        organization: true,
        feed: true,
      },
      orderBy: [desc(organizationToFeed.createdAt)],
    });
  }),
});

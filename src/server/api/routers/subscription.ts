import { z } from "zod";
import { desc, eq, sql } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { organizationToFeed, organizations, feeds } from "~/server/db/schema";
import { db } from "~/server/db";

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
  getAll: protectedProcedure.query(async () => {
    return await db.query.organizationToFeed.findMany({
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
    .query(async ({ input }) => {
      return await db.query.organizationToFeed.findFirst({
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
    .mutation(async ({ input }) => {
      const [org, feed] = await Promise.all([
        db.query.organizations.findFirst({
          where: eq(organizations.id, input.organizationId),
        }),
        db.query.feeds.findFirst({
          where: eq(feeds.id, input.feedId),
        }),
      ]);

      if (!org) throw new Error("Organization not found");
      if (!feed) throw new Error("Feed not found");

      return await db.insert(organizationToFeed).values({
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
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;

      const processedData = {
        ...updateData,
        accessUntil: updateData.accessUntil
          ? new Date(updateData.accessUntil)
          : undefined,
        billingAmount: updateData.billingAmount?.toString(),
      };

      return await db
        .update(organizationToFeed)
        .set(processedData)
        .where(eq(organizationToFeed.id, id));
    }),

  // Delete a subscription
  delete: protectedProcedure
    .input(subscriptionIdSchema)
    .mutation(async ({ input }) => {
      return await db
        .delete(organizationToFeed)
        .where(eq(organizationToFeed.id, input.id));
    }),

  // Get subscriptions by organization
  getByOrganization: protectedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      return await db.query.organizationToFeed.findMany({
        where: eq(organizationToFeed.organizationId, input.organizationId),
        with: {
          feed: true,
        },
        orderBy: [desc(organizationToFeed.createdAt)],
      });
    }),

  // Get active subscriptions (not expired)
  getActive: protectedProcedure.query(async () => {
    return await db.query.organizationToFeed.findMany({
      where: sql`${organizationToFeed.accessUntil} > CURRENT_TIMESTAMP`,
      with: {
        organization: true,
        feed: true,
      },
      orderBy: [desc(organizationToFeed.createdAt)],
    });
  }),

  // Get paginated subscriptions
  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        page_size: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ input }) => {
      const { page, page_size } = input;

      const [items, total_count] = await Promise.all([
        db.query.organizationToFeed.findMany({
          with: {
            organization: true,
            feed: true,
          },
          limit: page_size,
          offset: (page - 1) * page_size,
          orderBy: [desc(organizationToFeed.createdAt)],
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(organizationToFeed)
          .then((res) => Number(res[0]?.count ?? 0)),
      ]);

      return {
        items,
        metadata: {
          total_count,
          page_count: Math.ceil(total_count / page_size),
          current_page: page,
          page_size,
        },
      };
    }),
});

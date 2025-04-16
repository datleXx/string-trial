import { z } from "zod";
import { and, asc, desc, eq, sql } from "drizzle-orm";

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
        sorting_state: z.object({
          id: z.string(),
          direction: z.enum(["asc", "desc"]),
        }),
        filter_state: z.array(
          z.object({
            id: z.string(),
            value: z.string(),
          }),
        ),
      }),
    )
    .query(async ({ input }) => {
      const { page, page_size, sorting_state, filter_state } = input;

      let sort_by = undefined;
      switch (sorting_state.id) {
        case "organization_name":
          if (sorting_state.direction === "asc") {
            sort_by = asc(organizationToFeed.organizationId);
          } else {
            sort_by = desc(organizationToFeed.organizationId);
          }
          break;
        case "feed_name":
          if (sorting_state.direction === "asc") {
            sort_by = asc(feeds.name);
          } else {
            sort_by = desc(feeds.name);
          }
          break;
        case "status":
          if (sorting_state.direction === "asc") {
            sort_by = asc(organizationToFeed.accessUntil);
          } else {
            sort_by = desc(organizationToFeed.accessUntil);
          }
          break;
        case "accessUntil":
          if (sorting_state.direction === "asc") {
            sort_by = asc(organizationToFeed.accessUntil);
          } else {
            sort_by = desc(organizationToFeed.accessUntil);
          }
          break;
        case "billing":
          if (sorting_state.direction === "asc") {
            sort_by = asc(organizationToFeed.billingAmount);
          } else {
            sort_by = desc(organizationToFeed.billingAmount);
          }
          break;
        default:
          sort_by = desc(organizationToFeed.createdAt);
      }

      let where_clause;
      const status_filter = filter_state.find((f) => f.id === "status")?.value;
      const organization_filter = filter_state.find(
        (f) => f.id === "organization_name",
      )?.value;
      if (status_filter === "active") {
        where_clause = sql`${organizationToFeed.accessUntil} > CURRENT_TIMESTAMP`;
      } else if (status_filter === "expired") {
        where_clause = sql`${organizationToFeed.accessUntil} <= CURRENT_TIMESTAMP`;
      }

      if (organization_filter) {
        where_clause = and(
          where_clause,
          eq(organizationToFeed.organizationId, organization_filter),
        );
      }

      const [items, total_count] = await Promise.all([
        db.query.organizationToFeed.findMany({
          with: {
            organization: true,
            feed: true,
          },
          where: where_clause,
          limit: page_size,
          offset: (page - 1) * page_size,
          orderBy: [sort_by],
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

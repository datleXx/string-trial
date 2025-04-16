import { z } from "zod";
import { desc, eq, ilike, sql } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { organizations } from "~/server/db/schema";
import { db } from "~/server/db";

const createOrganizationSchema = z.object({
  name: z.string().min(1),
  billingEmail: z.string().email(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const organizationRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async () => {
    return await db.query.organizations.findMany({
      orderBy: [desc(organizations.name)],
    });
  }),

  getOrganizationWithFilters: protectedProcedure
    .input(
      z.object({
        global_search: z.string().optional(),
      }),
    )
    .query(async ({ input }) => {
      const { global_search } = input;

      const query = db.query.organizations.findMany({
        orderBy: [desc(organizations.name)],
        where: global_search
          ? (org, { ilike }) =>
              ilike(org.name, `%${global_search}%`) ||
              ilike(org.billingEmail, `%${global_search}%`)
          : undefined,
        limit: global_search ? undefined : 20,
      });

      return query;
    }),

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
        db.query.organizations.findMany({
          limit: page_size,
          offset: (page - 1) * page_size,
          orderBy: [desc(organizations.name)],
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(organizations)
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

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.query.organizations.findFirst({
        where: eq(organizations.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ input }) => {
      try {
        const result = await db
          .insert(organizations)
          .values({
            name: input.name,
            billingEmail: input.billingEmail,
            status: input.status,
          })
          .returning();

        if (!result[0]) {
          throw new Error("Failed to create organization");
        }

        return result[0];
      } catch (error) {
        console.error("Error creating organization:", error);
        throw error;
      }
    }),

  update: protectedProcedure
    .input(createOrganizationSchema.extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id, ...updateData } = input;
      return await db
        .update(organizations)
        .set(updateData)
        .where(eq(organizations.id, id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db
        .delete(organizations)
        .where(eq(organizations.id, input.id));
    }),
});

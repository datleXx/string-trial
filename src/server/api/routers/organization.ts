import { z } from "zod";
import { and, asc, between, desc, eq, ilike, or, sql } from "drizzle-orm";

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
        sorting_state: z.object({
          id: z.string(),
          direction: z.enum(["asc", "desc"]).default("asc"),
        }),

        column_filters: z.array(
          z.object({
            id: z.string(),
            value: z.union([
              z.string(),
              z.object({
                from: z.number().optional(),
                to: z.number().optional(),
              }),
            ]),
          }),
        ),
      }),
    )
    .query(async ({ input }) => {
      const { page, page_size, sorting_state, column_filters } = input;

      let sort_by;
      const sort_id = sorting_state.id;
      const sort_direction = sorting_state.direction;
      switch (sort_id) {
        case "name":
          sort_by =
            sort_direction === "asc"
              ? [asc(organizations.name)]
              : [desc(organizations.name)];
          break;
        case "billingEmail":
          sort_by =
            sort_direction === "asc"
              ? [asc(organizations.billingEmail)]
              : [desc(organizations.billingEmail)];
          break;
        case "status":
          sort_by =
            sort_direction === "asc"
              ? [asc(organizations.status)]
              : [desc(organizations.status)];
          break;
        case "createdAt":
          sort_by =
            sort_direction === "asc"
              ? [asc(organizations.createdAt)]
              : [desc(organizations.createdAt)];
          break;
        case "updatedAt":
          sort_by =
            sort_direction === "asc"
              ? [asc(organizations.updatedAt)]
              : [desc(organizations.updatedAt)];
          break;
        default:
          sort_by = [desc(organizations.name)];
          break;
      }

      const where_clauses = [];
      for (const filter of column_filters) {
        const { id, value } = filter;
        switch (id) {
          case "name":
            where_clauses.push(
              or(
                ilike(organizations.billingEmail, `%${value as string}%`),
                ilike(organizations.name, `%${value as string}%`),
              ),
            );
            break;
          case "status":
            where_clauses.push(eq(organizations.status, value as string));
            break;
          case "createdAt":
            if (typeof value !== "string" && value.from && value.to) {
              where_clauses.push(
                between(
                  organizations.createdAt,
                  new Date(value.from),
                  new Date(value.to),
                ),
              );
            }
            break;
          case "updatedAt":
            if (typeof value !== "string" && value.from && value.to) {
              where_clauses.push(
                between(
                  organizations.updatedAt,
                  new Date(value.from),
                  new Date(value.to),
                ),
              );
            }
            break;

          default:
            break;
        }
      }
      const [items, total_count] = await Promise.all([
        db.query.organizations.findMany({
          limit: page_size,
          offset: (page - 1) * page_size,
          orderBy: sort_by,
          where: where_clauses.length > 0 ? and(...where_clauses) : undefined,
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(organizations)
          .where(where_clauses.length > 0 ? and(...where_clauses) : undefined)
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

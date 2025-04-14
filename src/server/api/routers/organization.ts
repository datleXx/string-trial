import { z } from "zod";
import { desc, eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { organizations } from "~/server/db/schema";

const createOrganizationSchema = z.object({
  name: z.string().min(1),
  billingEmail: z.string().email(),
  status: z.enum(["active", "inactive"]).default("active"),
});

export const organizationRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.organizations.findMany({
      orderBy: [desc(organizations.name)],
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      try {
        const result = await ctx.db
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
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return await ctx.db
        .update(organizations)
        .set(updateData)
        .where(eq(organizations.id, id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(organizations)
        .where(eq(organizations.id, input.id));
    }),
});

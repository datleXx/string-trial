import { z } from "zod";
import { desc, eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { organizations } from "~/server/db/schema";

const createOrganizationSchema = z.object({
  name: z.string().min(1),
  billingEmail: z.string().email(),
  status: z.string().optional(),
});

export const organizationRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.query.organizations.findMany({
      orderBy: [desc(organizations.name)],
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.query.organizations.findFirst({
        where: eq(organizations.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(createOrganizationSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.insert(organizations).values({
        name: input.name,
        billingEmail: input.billingEmail,
        status: input.status ?? "active",
      });
    }),

  update: protectedProcedure
    .input(createOrganizationSchema.extend({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const { id, ...updateData } = input;
      return await ctx.db
        .update(organizations)
        .set(updateData)
        .where(eq(organizations.id, id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db
        .delete(organizations)
        .where(eq(organizations.id, input.id));
    }),
});

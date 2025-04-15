import { z } from "zod";
import { desc, eq } from "drizzle-orm";

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

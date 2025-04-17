import { z } from "zod";
import { desc, eq } from "drizzle-orm";

import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { feeds } from "~/server/db/schema";
import { db } from "~/server/db";

const createFeedSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  basePrice: z.number().min(0),
});

export const feedRouter = createTRPCRouter({
  getAll: protectedProcedure.query(async () => {
    return await db.query.feeds.findMany({
      orderBy: [desc(feeds.name)],
    });
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input }) => {
      return await db.query.feeds.findFirst({
        where: eq(feeds.id, input.id),
      });
    }),

  create: protectedProcedure
    .input(createFeedSchema)
    .mutation(async ({ input }) => {
      return await db.insert(feeds).values({
        name: input.name,
        description: input.description,
        basePrice: input.basePrice.toString(),
      });
    }),

  update: protectedProcedure
    .input(createFeedSchema.extend({ id: z.string() }))
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      return await db
        .update(feeds)
        .set({
          ...data,
          basePrice: data.basePrice.toString(),
        })
        .where(eq(feeds.id, id));
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      return await db.delete(feeds).where(eq(feeds.id, input.id));
    }),
});

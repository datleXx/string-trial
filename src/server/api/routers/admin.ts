import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { users } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";
import { db } from "~/server/db";

export const adminRouter = createTRPCRouter({
  // Get all users
  getAllUsers: protectedProcedure.query(async () => {
    const allUsers = await db.query.users.findMany({
      orderBy: [desc(users.id)],
    });

    return allUsers;
  }),

  // Update user role
  updateUserRole: adminProcedure
    .input(
      z.object({
        userId: z.string(),
        role: z.enum(["admin", "user", "viewer"]),
      }),
    )
    .mutation(async ({ input }) => {
      // Check if user exists
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Update user role
      await db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Get user details
  getUserDetails: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ input }) => {
      const user = await db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return user;
    }),
});

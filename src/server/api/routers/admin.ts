import { z } from "zod";
import { TRPCError } from "@trpc/server";
import {
  adminProcedure,
  createTRPCRouter,
  protectedProcedure,
} from "~/server/api/trpc";
import { users } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const adminRouter = createTRPCRouter({
  // Get all users
  getAllUsers: protectedProcedure.query(async ({ ctx }) => {
    const allUsers = await ctx.db.query.users.findMany({
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
    .mutation(async ({ ctx, input }) => {
      // Check if user exists
      const user = await ctx.db.query.users.findFirst({
        where: eq(users.id, input.userId),
      });

      if (!user) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Update user role
      await ctx.db
        .update(users)
        .set({ role: input.role })
        .where(eq(users.id, input.userId));

      return { success: true };
    }),

  // Get user details
  getUserDetails: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const user = await ctx.db.query.users.findFirst({
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

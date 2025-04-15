import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { users } from "~/server/db/schema";
import { eq, desc } from "drizzle-orm";

export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (ctx.session?.user?.role !== "admin") {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be an admin to access this resource",
    });
  }
  return next();
});

export const elevatedProcedure = protectedProcedure.use(async ({ ctx, next }) => {
  if (
    ctx.session?.user?.role !== "admin" &&
    ctx.session?.user?.role !== "viewer"
  ) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
      message: "You must be an admin or viewer to access this resource",
    });
  }
  return next();
});

export const adminRouter = createTRPCRouter({
  // Get all users
  getAllUsers: elevatedProcedure.query(async ({ ctx }) => {
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
  getUserDetails: elevatedProcedure
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

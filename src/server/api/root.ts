import { subscriptionRouter } from "~/server/api/routers/subscription";
import { billingRouter } from "~/server/api/routers/billing";
import { organizationRouter } from "~/server/api/routers/organization";
import { feedRouter } from "~/server/api/routers/feed";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";
import { adminRouter } from "~/server/api/routers/admin";
/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  subscription: subscriptionRouter,
  billing: billingRouter,
  organization: organizationRouter,
  feed: feedRouter,
  admin: adminRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);

import { desc } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { invoices, users } from "~/server/db/schema";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { db } from "~/server/db";
import { z } from "zod";

dayjs.extend(isBetween);

export const metricsRouter = createTRPCRouter({
  // Get billing metrics for all organizations
  getBillingMetrics: protectedProcedure
    .input(
      z.object({
        months: z.number().optional().default(12), // Number of months of history to return
      }),
    )
    .query(async ({ input }) => {
      // Fetch both invoices and active subscriptions with their timestamps
      const invoices_data = await db.query.invoices.findMany({
        with: {
          organizationToFeed: true,
        },
        orderBy: [desc(invoices.createdAt)],
      });
      const subscriptions = await db.query.organizationToFeed.findMany({
        with: {
          feed: true,
        },
      });

      // Calculate monthly metrics for the past N months
      const monthly_metrics = [];
      const today = new Date();
      for (let i = 0; i < (input.months ?? 12); i++) {
        const target_date = dayjs(today).subtract(i, "month");
        const start_of_month = target_date.startOf("month").toDate();
        const end_of_month = target_date.endOf("month").toDate();

        // Filter invoices and subscriptions for this month
        const month_invoices = invoices_data.filter((inv) =>
          dayjs(inv.createdAt).isBetween(
            start_of_month,
            end_of_month,
            null,
            "[]",
          ),
        );

        const month_subscriptions = subscriptions.filter(
          (sub) =>
            (!sub.accessUntil ||
              dayjs(sub.accessUntil).isAfter(start_of_month)) &&
            dayjs(sub.createdAt).isBefore(end_of_month),
        );

        const month_metrics = {
          month: dayjs(start_of_month).format("YYYY-MM"),
          mrr: month_subscriptions
            .filter((sub) => sub.billingFrequency === "monthly")
            .reduce((sum, sub) => sum + Number(sub.billingAmount), 0),
          arr: month_subscriptions
            .filter((sub) => sub.billingFrequency === "yearly")
            .reduce((sum, sub) => sum + Number(sub.billingAmount), 0),
          total_invoiced: month_invoices.reduce(
            (sum, inv) => sum + Number(inv.amount),
            0,
          ),
          active_subscriptions: month_subscriptions.length,
          new_subscriptions: subscriptions.filter((sub) =>
            dayjs(sub.createdAt).isBetween(
              start_of_month,
              end_of_month,
              null,
              "[]",
            ),
          ).length,
        };

        monthly_metrics.push(month_metrics);
      }

      // Calculate current metrics (existing code)
      const invoice_metrics = {
        total_invoiced: invoices_data.reduce(
          (sum, inv) => sum + Number(inv.amount),
          0,
        ),
        total_paid: invoices_data
          .filter((inv) => inv.status === "paid")
          .reduce((sum, inv) => sum + Number(inv.amount), 0),
        total_pending: invoices_data
          .filter((inv) => inv.status === "pending")
          .reduce((sum, inv) => sum + Number(inv.amount), 0),
        invoice_count: invoices_data.length,
        paid_invoice_count: invoices_data.filter((inv) => inv.status === "paid")
          .length,
      };

      const subscription_metrics = {
        total_mrr: subscriptions
          .filter((sub) => sub.billingFrequency === "monthly")
          .reduce((sum, sub) => sum + Number(sub.billingAmount), 0),
        total_arr: subscriptions
          .filter((sub) => sub.billingFrequency === "yearly")
          .reduce((sum, sub) => sum + Number(sub.billingAmount), 0),
        organization_count: new Set(
          subscriptions.map((sub) => sub.organizationId),
        ).size,
        subscription_count: subscriptions.length,
        monthly_subscriptions: subscriptions.filter(
          (sub) => sub.billingFrequency === "monthly",
        ).length,
        yearly_subscriptions: subscriptions.filter(
          (sub) => sub.billingFrequency === "yearly",
        ).length,
        average_subscription_value:
          subscriptions.length > 0
            ? subscriptions.reduce(
                (sum, sub) => sum + Number(sub.billingAmount),
                0,
              ) / subscriptions.length
            : 0,
      };

      const derived_metrics = {
        average_invoice_value:
          invoices_data.length > 0
            ? invoice_metrics.total_invoiced / invoices_data.length
            : 0,
        collection_rate:
          invoice_metrics.total_invoiced > 0
            ? (invoice_metrics.total_paid / invoice_metrics.total_invoiced) *
              100
            : 0,
      };

      return {
        current: {
          ...invoice_metrics,
          ...subscription_metrics,
          ...derived_metrics,
        },
        historical: monthly_metrics.reverse(),
      };
    }),

  // Get advanced user metrics
  getUserMetrics: protectedProcedure
    .input(
      z.object({
        months: z.number().optional().default(12), // Number of months of history to return
        include_inactive: z.boolean().optional().default(false), // Whether to include users who haven't logged in recently
        inactivity_threshold: z.number().optional().default(30), // Days of inactivity to consider a user inactive
      }),
    )
    .query(async ({ input }) => {
      // Fetch all users
      const all_users = await db.query.users.findMany({
        orderBy: [desc(users.createdAt)],
      });

      // Calculate monthly metrics for the past N months
      const monthly_metrics = [];
      const today = new Date();

      for (let i = 0; i < input.months; i++) {
        const target_date = dayjs(today).subtract(i, "month");
        const start_of_month = target_date.startOf("month").toDate();
        const end_of_month = target_date.endOf("month").toDate();

        // Filter users for this month
        const users_in_month = all_users.filter((user) =>
          dayjs(user.createdAt).isBetween(
            start_of_month,
            end_of_month,
            null,
            "[]",
          ),
        );

        const active_users = all_users.filter((user) =>
          dayjs(user.lastLogin).isBetween(
            start_of_month,
            end_of_month,
            null,
            "[]",
          ),
        );

        const month_metrics = {
          month: dayjs(start_of_month).format("YYYY-MM"),
          new_users: users_in_month.length,
          active_users: active_users.length,
          users_by_role: {
            admin: active_users.filter((u) => u.role === "admin").length,
            user: active_users.filter((u) => u.role === "user").length,
            viewer: active_users.filter((u) => u.role === "viewer").length,
          },
        };

        monthly_metrics.push(month_metrics);
      }

      // Calculate current metrics
      const inactive_threshold = dayjs()
        .subtract(input.inactivity_threshold, "days")
        .toDate();

      const current_metrics = {
        total_users: all_users.length,
        active_users: input.include_inactive
          ? all_users.length
          : all_users.filter((u) =>
              dayjs(u.lastLogin).isAfter(inactive_threshold),
            ).length,
        users_by_role: {
          admin: all_users.filter((u) => u.role === "admin").length,
          user: all_users.filter((u) => u.role === "user").length,
          viewer: all_users.filter((u) => u.role === "viewer").length,
        },
        verified_users: all_users.filter((u) => u.emailVerified).length,
        unverified_users: all_users.filter((u) => !u.emailVerified).length,
        user_growth_rate:
          monthly_metrics.length >= 2 &&
          monthly_metrics[0]?.new_users &&
          monthly_metrics[1]?.new_users
            ? ((monthly_metrics[0].new_users - monthly_metrics[1].new_users) /
                monthly_metrics[1].new_users) *
              100
            : 0,
        average_monthly_new_users:
          monthly_metrics.reduce((sum, month) => sum + month.new_users, 0) /
          monthly_metrics.length,
        inactive_users: all_users.filter((u) =>
          dayjs(u.lastLogin).isBefore(inactive_threshold),
        ).length,
      };

      // Calculate engagement metrics
      const engagement_metrics = {
        daily_active_users: all_users.filter((u) =>
          dayjs(u.lastLogin).isAfter(dayjs().subtract(1, "day")),
        ).length,
        weekly_active_users: all_users.filter((u) =>
          dayjs(u.lastLogin).isAfter(dayjs().subtract(7, "days")),
        ).length,
        monthly_active_users: all_users.filter((u) =>
          dayjs(u.lastLogin).isAfter(dayjs().subtract(30, "days")),
        ).length,
        retention_rate:
          monthly_metrics.length >= 2 &&
          monthly_metrics[0]?.active_users &&
          monthly_metrics[1]?.active_users
            ? (monthly_metrics[0].active_users /
                monthly_metrics[1].active_users) *
              100
            : 100,
      };

      return {
        current: {
          ...current_metrics,
          ...engagement_metrics,
        },
        historical: monthly_metrics.reverse(),
      };
    }),

  getPaymentPatterns: protectedProcedure
    .input(
      z.object({
        months: z.number().optional().default(12),
      }),
    )
    .query(async ({ input }) => {
      const invoices_data = await db.query.invoices.findMany({
        orderBy: [desc(invoices.createdAt)],
      });

      const monthly_metrics = [];
      const today = new Date();

      for (let i = 0; i < input.months; i++) {
        const target_date = dayjs(today).subtract(i, "month");
        const start_of_month = target_date.startOf("month");
        const end_of_month = target_date.endOf("month");

        const month_invoices = invoices_data.filter((inv) =>
          dayjs(inv.createdAt).isBetween(
            start_of_month,
            end_of_month,
            null,
            "[]",
          ),
        );

        const total_amount = month_invoices.reduce(
          (sum, inv) => sum + Number(inv.amount),
          0,
        );

        const paid_on_time = month_invoices.filter(
          (inv) =>
            inv.status === "paid" &&
            inv.paidAt &&
            dayjs(inv.paidAt).isBefore(inv.dueDate),
        ).length;

        const paid_late = month_invoices.filter(
          (inv) =>
            inv.status === "paid" &&
            inv.paidAt &&
            dayjs(inv.paidAt).isAfter(inv.dueDate),
        ).length;

        const unpaid = month_invoices.filter(
          (inv) => inv.status === "pending",
        ).length;

        monthly_metrics.push({
          month: start_of_month.format("YYYY-MM"),
          "Total Amount": total_amount,
          "Paid On Time": paid_on_time,
          "Paid Late": paid_late,
          Unpaid: unpaid,
          "Payment Rate":
            month_invoices.length > 0
              ? ((paid_on_time + paid_late) / month_invoices.length) * 100
              : 0,
        });
      }

      return monthly_metrics.reverse();
    }),

  getRevenueForecasting: protectedProcedure
    .input(
      z.object({
        months: z.number().optional().default(12),
      }),
    )
    .query(async ({ input }) => {
      const subscriptions = await db.query.organizationToFeed.findMany();
      const invoices_data = await db.query.invoices.findMany({
        orderBy: [desc(invoices.createdAt)],
      });

      const monthly_metrics = [];
      const today = new Date();

      for (let i = 0; i < input.months; i++) {
        const target_date = dayjs(today).subtract(i, "month");
        const start_of_month = target_date.startOf("month");
        const end_of_month = target_date.endOf("month");

        const month_invoices = invoices_data.filter((inv) =>
          dayjs(inv.dueDate).isBetween(
            start_of_month,
            end_of_month,
            null,
            "[]",
          ),
        );

        const committed_revenue = subscriptions
          .filter(
            (sub) =>
              !sub.accessUntil || dayjs(sub.accessUntil).isAfter(end_of_month),
          )
          .reduce((sum, sub) => {
            const amount = Number(sub.billingAmount);
            return (
              sum + (sub.billingFrequency === "yearly" ? amount / 12 : amount)
            );
          }, 0);

        const actual_revenue = month_invoices
          .filter((inv) => inv.status === "paid")
          .reduce((sum, inv) => sum + Number(inv.amount), 0);

        const projected_revenue = month_invoices.reduce(
          (sum, inv) => sum + Number(inv.amount),
          0,
        );

        monthly_metrics.push({
          month: start_of_month.format("YYYY-MM"),
          "Committed MRR": committed_revenue,
          "Actual Revenue": actual_revenue,
          "Projected Revenue": projected_revenue,
          "Collection Efficiency":
            projected_revenue > 0
              ? (actual_revenue / projected_revenue) * 100
              : 0,
        });
      }

      return monthly_metrics.reverse();
    }),
});

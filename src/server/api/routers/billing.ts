import { z } from "zod";
import { eq, and, desc, inArray } from "drizzle-orm";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  organizationToFeed,
  organizations,
  invoices,
} from "~/server/db/schema";
import dayjs from "dayjs";
import isBetween from "dayjs/plugin/isBetween";
import { elevatedProcedure, adminProcedure } from "~/server/api/trpc";
import { db } from "~/server/db";
import { generateInvoicePDF } from "~/server/services/pdf";
import { TRPCError } from "@trpc/server";
import { sql } from "drizzle-orm";

dayjs.extend(isBetween);

// Input validation schemas
const generateInvoiceSchema = z.object({
  organizationId: z.string(),
  subscriptionIds: z.array(z.string()).optional(),
  amount: z.number().positive(),
  dueDate: z.string().datetime(),
});

const updateInvoiceStatusSchema = z.object({
  invoiceId: z.string(),
  status: z.enum(["pending", "paid", "cancelled"]),
  paidAt: z.date().optional(),
});

export const billingRouter = createTRPCRouter({
  // Generate invoice for an organization
  generateInvoice: adminProcedure
    .input(generateInvoiceSchema)
    .mutation(async ({ input }) => {
      const organization = await db.query.organizations.findFirst({
        where: eq(organizations.id, input.organizationId),
      });

      if (!organization || input.subscriptionIds?.length === 0)
        throw new Error("Invalid input");

      // Get subscriptions for the organization
      const subscriptions = await db.query.organizationToFeed.findMany({
        where: and(
          eq(organizationToFeed.organizationId, input.organizationId),
          input.subscriptionIds
            ? inArray(organizationToFeed.id, input.subscriptionIds)
            : undefined,
        ),
        with: {
          feed: true,
        },
      });

      // Calculate billing amounts
      const line_items = subscriptions.map((sub) => ({
        feedName: sub.feed.name,
        amount: sub.billingAmount,
        period: sub.billingFrequency ?? "one-time",
      }));

      const total_amount = line_items.reduce(
        (sum, item) => sum + Number(item.amount),
        0,
      );

      const due_date = dayjs(input.dueDate).toDate();
      const invoice_number = `INV-${Date.now()}`;

      // Create invoice record in database
      const [invoice] = await db
        .insert(invoices)
        .values({
          organizationId: organization.id,
          organizationToFeedId: subscriptions[0]?.id ?? "", // Handle potential undefined,
          amount: total_amount.toString(), // Convert to string for decimal type
          dueDate: due_date,
          status: "pending",
          invoiceNumber: invoice_number,
        })
        .returning();

      return invoice;
    }),

  // Update invoice status
  updateInvoiceStatus: adminProcedure
    .input(updateInvoiceStatusSchema)
    .mutation(async ({ input }) => {
      const [updatedInvoice] = await db
        .update(invoices)
        .set({
          status: input.status,
          paidAt: input.status === "paid" ? (input.paidAt ?? new Date()) : null,
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.invoiceId))
        .returning();

      return updatedInvoice;
    }),

  // Get billing summary for an organization
  getBillingSummary: elevatedProcedure
    .input(z.object({ organizationId: z.string() }))
    .query(async ({ input }) => {
      try {
        const subscriptions = await db.query.organizationToFeed.findMany({
          where: eq(organizationToFeed.organizationId, input.organizationId),
          with: {
            feed: true,
          },
        });

        const monthly_total = subscriptions
          .filter((sub) => sub.billingFrequency === "monthly")
          .reduce((sum, sub) => sum + Number(sub.billingAmount), 0);

        const yearly_total = subscriptions
          .filter((sub) => sub.billingFrequency === "yearly")
          .reduce((sum, sub) => sum + Number(sub.billingAmount), 0);

        return {
          monthly_recurring: monthly_total,
          yearly_recurring: yearly_total,
          total_subscriptions: subscriptions.length,
        };
      } catch (error) {
        console.error(error);
        return {
          monthly_recurring: 0,
          yearly_recurring: 0,
          total_subscriptions: 0,
        };
      }
    }),

  getAllBillingHistory: protectedProcedure.query(async () => {
    return db.query.invoices.findMany({
      orderBy: [desc(invoices.createdAt)],
      with: {
        organizationToFeed: {
          with: {
            feed: true,
          },
        },
      },
    });
  }),

  getPaginated: protectedProcedure
    .input(
      z.object({
        page: z.number().min(1).default(1),
        page_size: z.number().min(1).max(100).default(10),
      }),
    )
    .query(async ({ input }) => {
      const { page, page_size } = input;

      const [items, total_count] = await Promise.all([
        db.query.invoices.findMany({
          with: {
            organizationToFeed: {
              with: {
                feed: true,
              },
            },
          },
          limit: page_size,
          offset: (page - 1) * page_size,
          orderBy: [desc(invoices.createdAt)],
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(invoices)
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

  // Get billing history for an organization
  getBillingHistory: protectedProcedure
    .input(
      z.object({
        organizationId: z.string(),
        limit: z.number().optional(),
      }),
    )
    .query(async ({ input }) => {
      return db.query.invoices.findMany({
        where: eq(invoices.organizationId, input.organizationId),
        limit: input.limit ?? 10,
        orderBy: [desc(invoices.createdAt)],
        with: {
          organizationToFeed: {
            with: {
              feed: true,
            },
          },
        },
      });
    }),

  updateInvoice: adminProcedure
    .input(
      z.object({
        invoiceId: z.string(),
        amount: z.number(),
        status: z.enum(["paid", "pending", "overdue"]),
        date: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const [updated_invoice] = await db
        .update(invoices)
        .set({
          amount: input.amount.toString(), // Convert to string for decimal type
          status: input.status,
          dueDate: new Date(input.date),
          updatedAt: new Date(),
        })
        .where(eq(invoices.id, input.invoiceId))
        .returning();

      return updated_invoice;
    }),

  deleteInvoice: adminProcedure
    .input(
      z.object({
        invoiceId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      const [deleted_invoice] = await db
        .delete(invoices)
        .where(eq(invoices.id, input.invoiceId))
        .returning();

      return deleted_invoice;
    }),

  // Generate downloadable PDF for an invoice
  generateInvoicePDF: protectedProcedure
    .input(
      z.object({
        invoiceId: z.string(),
      }),
    )
    .mutation(async ({ input }) => {
      // Fetch invoice with related data
      const invoice = await db.query.invoices.findFirst({
        where: eq(invoices.id, input.invoiceId),
        with: {
          organizationToFeed: {
            with: {
              feed: true,
              organization: true,
            },
          },
        },
      });

      if (!invoice) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Invoice not found",
        });
      }

      // Prepare data for PDF generation
      const invoice_data = {
        invoice_number: invoice.invoiceNumber,
        organization: {
          id: invoice.organizationToFeed.organization.id,
          name: invoice.organizationToFeed.organization.name,
          billing_email: invoice.organizationToFeed.organization.billingEmail,
        },
        billing_period: {
          start_date: invoice.createdAt.toISOString(),
          end_date: invoice.dueDate.toISOString(),
        },
        line_items: [
          {
            feed_name: invoice.organizationToFeed.feed.name,
            amount: invoice.amount.toString(),
            period: invoice.organizationToFeed.billingFrequency ?? "one-time",
          },
        ],
        total_amount: Number(invoice.amount),
        generated_at: invoice.createdAt.toISOString(),
        due_date: invoice.dueDate.toISOString(),
      };

      // Generate PDF
      const pdf_buffer = await generateInvoicePDF(invoice_data);

      // Convert buffer to base64 for client-side download
      return {
        fileName: `invoice-${invoice.invoiceNumber}.pdf`,
        content: pdf_buffer.toString("base64"),
      };
    }),
});

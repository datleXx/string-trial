import { faker } from "@faker-js/faker";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { organizationToFeed, invoices } from "~/server/db/schema";

interface MockInvoice {
  id: string;
  organizationId: string;
  organizationToFeedId: string;
  invoiceNumber: string;
  amount: string;
  status: "pending" | "paid" | "overdue";
  dueDate: Date;
  paidAt: Date | null;
  createdAt: Date;
  updatedAt: Date | null;
}

async function generateInvoices(): Promise<MockInvoice[]> {
  // Fetch existing organization to feed relationships
  const subscriptions = await db.query.organizationToFeed.findMany({
    orderBy: [desc(organizationToFeed.createdAt)],
  });

  if (subscriptions.length === 0) {
    throw new Error("No organization to feed relationships found");
  }

  const mock_invoices: MockInvoice[] = [];

  for (const subscription of subscriptions) {
    // Calculate number of billing periods between created_at and access_until
    const start_date = subscription.createdAt;
    const end_date = subscription.accessUntil;
    const billing_frequency = subscription.billingFrequency ?? "monthly";

    const months_diff = Math.ceil(
      (end_date.getTime() - start_date.getTime()) /
        (1000 * 60 * 60 * 24 * (billing_frequency === "monthly" ? 30 : 365)),
    );

    // Generate an invoice for each billing period
    for (let i = 0; i < months_diff; i++) {
      const invoice_date = new Date(start_date);
      if (billing_frequency === "monthly") {
        invoice_date.setMonth(invoice_date.getMonth() + i);
      } else {
        invoice_date.setFullYear(invoice_date.getFullYear() + i);
      }

      // Don't generate invoices past the access_until date
      if (invoice_date > end_date) break;

      const due_date = new Date(invoice_date);
      due_date.setDate(due_date.getDate() + 30); // Due in 30 days

      const status = faker.helpers.arrayElement([
        "pending",
        "paid",
        "overdue",
      ] as const);

      const invoice: MockInvoice = {
        id: faker.string.uuid(),
        organizationId: subscription.organizationId,
        organizationToFeedId: subscription.id,
        invoiceNumber: `INV-${faker.string.alphanumeric(8).toUpperCase()}`,
        amount: subscription.billingAmount,
        status,
        dueDate: due_date,
        paidAt:
          status === "paid"
            ? faker.date.between({
                from: invoice_date,
                to: due_date,
              })
            : null,
        createdAt: invoice_date,
        updatedAt:
          status === "paid" && invoice_date <= new Date()
            ? faker.date.between({
                from: invoice_date,
                to: new Date(),
              })
            : null,
      };

      mock_invoices.push(invoice);
    }
  }

  return mock_invoices;
}

export async function GET(request: Request) {
  try {
    const generated_invoices = await generateInvoices();

    // Insert the generated invoices into the database
    await db.insert(invoices).values(generated_invoices);

    return NextResponse.json({
      message: "Invoices created successfully",
      count: generated_invoices.length,
    });
  } catch (error) {
    console.error("Error creating invoices:", error);
    return NextResponse.json(
      { error: "Failed to create invoices" },
      { status: 500 },
    );
  }
}

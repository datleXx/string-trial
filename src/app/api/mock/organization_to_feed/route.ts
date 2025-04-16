import { faker } from "@faker-js/faker";
import { desc } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { organizations, feeds, organizationToFeed } from "~/server/db/schema";

interface OrganizationToFeed {
  id: string;
  organizationId: string;
  feedId: string;
  accessUntil: Date;
  dashboardUrl: string | null;
  deliveryMethod: "api" | "sftp" | "email" | null;
  deliveryConfig: Record<string, unknown> | null;
  successEmails: string[] | null;
  failEmails: string[] | null;
  schemaUpdateEmails: string[] | null;
  billingAmount: string;
  billingFrequency: "monthly" | "yearly";
  createdAt: Date;
  updatedAt: Date | null;
}

async function generateOrganizationToFeed(): Promise<OrganizationToFeed[]> {
  // Fetch existing organizations and feeds
  const [existing_organizations, existing_feeds] = await Promise.all([
    db.query.organizations.findMany({
      orderBy: [desc(organizations.createdAt)],
    }),
    db.query.feeds.findMany({
      orderBy: [desc(feeds.createdAt)],
    }),
  ]);

  if (existing_organizations.length === 0 || existing_feeds.length === 0) {
    throw new Error("No organizations or feeds found in the database");
  }

  // Generate 1-3 subscriptions for each organization
  const subscriptions: OrganizationToFeed[] = [];

  for (const org of existing_organizations) {
    // Randomly select 1-3 feeds for this organization
    const num_feeds = faker.number.int({ min: 1, max: 3 });
    const selected_feeds = faker.helpers
      .shuffle(existing_feeds)
      .slice(0, num_feeds);

    for (const feed of selected_feeds) {
      const delivery_method = faker.helpers.arrayElement([
        "api",
        "sftp",
        "email",
        null,
      ] as const);

      const billing_frequency = faker.helpers.arrayElement([
        "monthly",
        "yearly",
      ] as const);

      const subscription: OrganizationToFeed = {
        id: faker.string.uuid(),
        organizationId: org.id,
        feedId: feed.id,
        accessUntil: faker.date.future(),
        dashboardUrl:
          faker.helpers.maybe(() => faker.internet.url(), {
            probability: 0.7,
          }) ?? null,
        deliveryMethod: delivery_method,
        deliveryConfig: delivery_method
          ? {
              ...(delivery_method === "api" && {
                apiKey: faker.string.alphanumeric(32),
                endpoint: faker.internet.url(),
              }),
              ...(delivery_method === "sftp" && {
                host: faker.internet.ip(),
                username: faker.internet.displayName(),
                path: `/feeds/${faker.string.alphanumeric(8)}`,
              }),
              ...(delivery_method === "email" && {
                recipients: Array.from(
                  { length: faker.number.int({ min: 1, max: 3 }) },
                  () => faker.internet.email(),
                ),
              }),
            }
          : null,
        successEmails:
          faker.helpers.maybe(
            () =>
              Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
                faker.internet.email(),
              ),
            { probability: 0.6 },
          ) ?? null,
        failEmails:
          faker.helpers.maybe(
            () =>
              Array.from({ length: faker.number.int({ min: 1, max: 3 }) }, () =>
                faker.internet.email(),
              ),
            { probability: 0.8 },
          ) ?? null,
        schemaUpdateEmails:
          faker.helpers.maybe(
            () =>
              Array.from({ length: faker.number.int({ min: 1, max: 2 }) }, () =>
                faker.internet.email(),
              ),
            { probability: 0.4 },
          ) ?? null,
        billingAmount: faker.commerce.price({
          min: 100,
          max: 10000,
          dec: 2,
        }),
        billingFrequency: billing_frequency,
        createdAt: faker.date.past(),
        updatedAt:
          faker.helpers.maybe(() => faker.date.recent(), {
            probability: 0.7,
          }) ?? null,
      };

      subscriptions.push(subscription);
    }
  }

  return subscriptions;
}

export async function GET(req: Request) {
  try {
    const subscriptions = await generateOrganizationToFeed();

    // Insert the generated subscriptions into the database
    await db.insert(organizationToFeed).values(subscriptions);

    return NextResponse.json({
      message: "Organization to feed relationships created successfully",
      count: subscriptions.length,
    });
  } catch (error) {
    console.error("Error creating organization to feed relationships:", error);
    return NextResponse.json(
      { error: "Failed to create organization to feed relationships" },
      { status: 500 },
    );
  }
}

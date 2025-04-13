import { relations, sql } from "drizzle-orm";
import {
  decimal,
  pgEnum,
  index,
  integer,
  jsonb,
  pgTableCreator,
  primaryKey,
  serial,
  text,
  timestamp,
  unique,
  varchar,
} from "drizzle-orm/pg-core";
import { type AdapterAccount } from "next-auth/adapters";

/**
 * This is an example of how to use the multi-project schema feature of Drizzle ORM. Use the same
 * database instance for multiple projects.
 *
 * @see https://orm.drizzle.team/docs/goodies#multi-project-schema
 */
export const createTable = pgTableCreator((name) => `${name}`);

// Enums
export const deliveryMethodEnum = pgEnum("delivery_method", [
  "api",
  "sftp",
  "email",
]);
export const billingFrequencyEnum = pgEnum("billing_frequency", [
  "monthly",
  "yearly",
]);

// Organizations table
export const organizations = createTable(
  "organization",
  (d) => ({
    id: serial("id").primaryKey().notNull(),
    name: varchar("name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),
    billingEmail: varchar("billing_email", { length: 255 }).notNull(),
    status: varchar("status", { length: 50 }).default("active").notNull(),
  }),
  (t) => [index("org_name_idx").on(t.name)],
);

// Feeds table
export const feeds = createTable("feed", (d) => ({
  id: serial("id").primaryKey().notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
    () => new Date(),
  ),
  basePrice: decimal("base_price").notNull(),
}));

// Organization to Feed relationship table
export const organizationToFeed = createTable(
  "organization_to_feed",
  (d) => ({
    id: serial("id").primaryKey().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).$onUpdate(
      () => new Date(),
    ),

    feedId: integer("feed_id")
      .notNull()
      .references(() => feeds.id),
    organizationId: integer("organization_id")
      .notNull()
      .references(() => organizations.id),

    accessUntil: timestamp("access_until", { withTimezone: true }).notNull(),
    dashboardUrl: varchar("dashboard_url", { length: 255 }),

    deliveryMethod: deliveryMethodEnum("delivery_method"),
    deliveryConfig: jsonb("delivery_config").$type<Record<string, unknown>>(),

    successEmails: text("success_emails").array(),
    failEmails: text("fail_emails").array(),
    schemaUpdateEmails: text("schema_update_emails").array(),

    billingAmount: decimal("billing_amount").notNull(),
    billingFrequency: billingFrequencyEnum("billing_frequency"),
  }),
  (t) => [
    unique().on(t.feedId, t.organizationId),
    index("org_feed_org_idx").on(t.organizationId),
    index("org_feed_feed_idx").on(t.feedId),
  ],
);

// Relations
export const organizationsRelations = relations(organizations, ({ many }) => ({
  feeds: many(organizationToFeed),
}));

export const feedsRelations = relations(feeds, ({ many }) => ({
  organizations: many(organizationToFeed),
}));

export const organizationToFeedRelations = relations(
  organizationToFeed,
  ({ one }) => ({
    organization: one(organizations, {
      fields: [organizationToFeed.organizationId],
      references: [organizations.id],
    }),
    feed: one(feeds, {
      fields: [organizationToFeed.feedId],
      references: [feeds.id],
    }),
  }),
);

export const posts = createTable(
  "post",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    name: d.varchar({ length: 256 }),
    createdById: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    createdAt: d
      .timestamp({ withTimezone: true })
      .default(sql`CURRENT_TIMESTAMP`)
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [
    index("created_by_idx").on(t.createdById),
    index("name_idx").on(t.name),
  ],
);

export const users = createTable("user", (d) => ({
  id: d
    .varchar({ length: 255 })
    .notNull()
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  name: d.varchar({ length: 255 }),
  email: d.varchar({ length: 255 }).notNull(),
  emailVerified: d
    .timestamp({
      mode: "date",
      withTimezone: true,
    })
    .default(sql`CURRENT_TIMESTAMP`),
  image: d.varchar({ length: 255 }),
  role: varchar("role", { length: 50 }).default("user").notNull(),
  lastLogin: d
    .timestamp({ mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`),

  createdAt: d
    .timestamp({ mode: "date", withTimezone: true })
    .default(sql`CURRENT_TIMESTAMP`)
    .notNull(),
}));

export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
}));

export const accounts = createTable(
  "account",
  (d) => ({
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    type: d.varchar({ length: 255 }).$type<AdapterAccount["type"]>().notNull(),
    provider: d.varchar({ length: 255 }).notNull(),
    providerAccountId: d.varchar({ length: 255 }).notNull(),
    refresh_token: d.text(),
    access_token: d.text(),
    expires_at: d.integer(),
    token_type: d.varchar({ length: 255 }),
    scope: d.varchar({ length: 255 }),
    id_token: d.text(),
    session_state: d.varchar({ length: 255 }),
  }),
  (t) => [
    primaryKey({ columns: [t.provider, t.providerAccountId] }),
    index("account_user_id_idx").on(t.userId),
  ],
);

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, { fields: [accounts.userId], references: [users.id] }),
}));

export const sessions = createTable(
  "session",
  (d) => ({
    sessionToken: d.varchar({ length: 255 }).notNull().primaryKey(),
    userId: d
      .varchar({ length: 255 })
      .notNull()
      .references(() => users.id),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [index("t_user_id_idx").on(t.userId)],
);

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const verificationTokens = createTable(
  "verification_token",
  (d) => ({
    identifier: d.varchar({ length: 255 }).notNull(),
    token: d.varchar({ length: 255 }).notNull(),
    expires: d.timestamp({ mode: "date", withTimezone: true }).notNull(),
  }),
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

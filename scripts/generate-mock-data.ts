import { faker } from "@faker-js/faker";
import fs from "fs";
import path from "path";

// Helper function to generate random date within a range
const randomDate = (start: Date, end: Date) => {
  return new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime()),
  );
};

// Generate Organizations
const generateOrganizations = () => {
  const organizations = [];
  for (let i = 1; i <= 100; i++) {
    organizations.push(`
COPY public.organization (id, name, billing_email, status, created_at, updated_at) FROM stdin;
${i}\t${faker.company.name().replace(/\t/g, " ")}\t${faker.internet.email().toLowerCase()}\t${faker.helpers.arrayElement(["active", "inactive"])}\t${faker.date.past({ years: 2 }).toISOString()}\t${faker.date.recent({ days: 90 }).toISOString()}
\\.
    `);
  }
  return organizations.join("\n");
};

// Generate Feeds
const generateFeeds = () => {
  const feeds = [];
  for (let i = 1; i <= 100; i++) {
    feeds.push(`
COPY public.feed (id, name, description, base_price, created_at, updated_at) FROM stdin;
${i}\t${faker.commerce.productName().replace(/\t/g, " ")} Feed\t${faker.commerce.productDescription().replace(/\t/g, " ")}\t${faker.number.float({ min: 99, max: 999, fractionDigits: 2 })}\t${faker.date.past({ years: 2 }).toISOString()}\t${faker.date.recent({ days: 90 }).toISOString()}
\\.
    `);
  }
  return feeds.join("\n");
};

// Generate Organization to Feed relationships
const generateOrganizationToFeed = () => {
  const relationships = [];
  for (let i = 1; i <= 100; i++) {
    const deliveryConfig = {
      endpoint: faker.internet.url(),
      apiKey: faker.string.uuid(),
      format: faker.helpers.arrayElement(["json", "xml", "csv"]) as string,
    };

    relationships.push(`
COPY public.organization_to_feed (id, feed_id, organization_id, access_until, dashboard_url, delivery_method, delivery_config, success_emails, fail_emails, schema_update_emails, billing_amount, billing_frequency, created_at, updated_at) FROM stdin;
${i}\t${faker.number.int({ min: 1, max: 100 })}\t${faker.number.int({ min: 1, max: 100 })}\t${faker.date.future({ years: 1 }).toISOString()}\t${faker.internet.url()}\t${faker.helpers.arrayElement(["api", "sftp", "email"])}\t${JSON.stringify(deliveryConfig).replace(/\t/g, " ")}\t{${faker.internet.email()},${faker.internet.email()}}\t{${faker.internet.email()}}\t{${faker.internet.email()},${faker.internet.email()}}\t${faker.number.float({ min: 99, max: 999, fractionDigits: 2 })}\t${faker.helpers.arrayElement(["monthly", "yearly"])}\t${faker.date.past({ years: 1 }).toISOString()}\t${faker.date.recent({ days: 30 }).toISOString()}
\\.
    `);
  }
  return relationships.join("\n");
};

// Generate Accounts
const generateAccounts = () => {
  const accounts = [];
  for (let i = 1; i <= 100; i++) {
    accounts.push(`
COPY public.account (user_id, type, provider, provider_account_id, refresh_token, access_token, expires_at, token_type, scope, id_token, session_state) FROM stdin;
(SELECT id FROM public.user ORDER BY RANDOM() LIMIT 1)\toauth\tgoogle\t${faker.string.numeric(21)}\t${faker.string.alphanumeric(64)}\t${faker.string.alphanumeric(64)}\t${Math.floor(Date.now() / 1000) + 3600}\tbearer\topenid profile email\t${faker.string.alphanumeric(128)}\t${faker.string.uuid()}
\\.
    `);
  }
  return accounts.join("\n");
};

// Generate all mock data
const generateAllMockData = () => {
  const sql = `--
-- PostgreSQL database dump
--

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

-- Clean existing data
TRUNCATE TABLE public.account CASCADE;
TRUNCATE TABLE public.user CASCADE;
TRUNCATE TABLE public.organization_to_feed CASCADE;
TRUNCATE TABLE public.feed CASCADE;
TRUNCATE TABLE public.organization CASCADE;

-- Reset sequences
ALTER SEQUENCE organization_id_seq RESTART WITH 1;
ALTER SEQUENCE feed_id_seq RESTART WITH 1;
ALTER SEQUENCE organization_to_feed_id_seq RESTART WITH 1;

-- Insert mock data
${generateOrganizations()}

${generateFeeds()}

${generateOrganizationToFeed()}

${generateAccounts()}

-- Set sequence values
SELECT pg_catalog.setval('public.organization_id_seq', 101, true);
SELECT pg_catalog.setval('public.feed_id_seq', 101, true);
SELECT pg_catalog.setval('public.organization_to_feed_id_seq', 101, true);

--
-- PostgreSQL database dump complete
--
`;

  // Write to file
  const outputDir = path.join(process.cwd(), "scripts");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }
  fs.writeFileSync(path.join(outputDir, "mock-data.dump"), sql);
  console.log("Generated mock data dump at scripts/mock-data.dump");
};

generateAllMockData();

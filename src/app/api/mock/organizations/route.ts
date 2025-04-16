import { faker } from "@faker-js/faker";
import { NextResponse } from "next/server";
import { db } from "~/server/db";
import { organizations } from "~/server/db/schema";

interface Organization {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  billingEmail: string;
  status: string;
}

function generateOrganization(): Organization {
  return {
    id: faker.string.uuid(),
    name: faker.company.name(),
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    billingEmail: faker.internet.email(),
    status: faker.helpers.arrayElement(["active", "inactive", "pending"]),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = Math.min(parseInt(searchParams.get("count") ?? "10", 10), 50);

  const organizations_mock_data = Array.from(
    { length: count },
    generateOrganization,
  );
  try {
    await db.insert(organizations).values(organizations_mock_data);
  } catch (error) {
    console.error(error);
  }

  return NextResponse.json({
    organizations: organizations_mock_data,
    total: organizations_mock_data.length,
  });
}

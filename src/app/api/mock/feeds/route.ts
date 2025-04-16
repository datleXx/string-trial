import { faker } from "@faker-js/faker";
import { NextResponse } from "next/server";
import { feeds } from "~/server/db/schema";
import { db } from "~/server/db";

interface Feed {
  id: string;
  name: string;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
  basePrice: string;
}

function generateFeed(): Feed {
  return {
    id: faker.string.uuid(),
    name: faker.commerce.productName(),
    description:
      faker.helpers.maybe(() => faker.lorem.paragraph(), {
        probability: 0.7,
      }) ?? null,
    createdAt: faker.date.past(),
    updatedAt: faker.date.recent(),
    basePrice: faker.commerce.price({ min: 100, max: 1000, dec: 2 }),
  };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const count = Math.min(parseInt(searchParams.get("count") ?? "10", 10), 50);

  const feeds_mock_data = Array.from({ length: count }, generateFeed);
  try {
    await db.insert(feeds).values(feeds_mock_data);
  } catch (error) {
    console.error(error);
  }

  return NextResponse.json({
    feeds: feeds_mock_data,
    total: feeds_mock_data.length,
  });
}

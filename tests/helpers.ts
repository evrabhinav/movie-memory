import { randomUUID } from "node:crypto";
import { vi } from "vitest";
import { prisma } from "@/lib/db";

// Throwaway users (deleted afterwards; Fact rows cascade) so real data is never touched.
const createdUserIds: string[] = [];

export async function makeUser(favoriteMovie: string | null = "Inception") {
  const user = await prisma.user.create({
    data: { email: `test-${randomUUID()}@example.test`, name: "Test User", favoriteMovie },
  });
  createdUserIds.push(user.id);
  return user.id;
}

export async function cleanupTestUsers() {
  await prisma.user.deleteMany({ where: { id: { in: createdUserIds } } });
  await prisma.$disconnect();
}

// Fake "OpenAI": returns "Fact 1", "Fact 2", ... so we can see exactly which one came back.
export function fakeGenerator(delayMs = 0) {
  let n = 0;
  return vi.fn(async () => {
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
    return `Fact ${++n}`;
  });
}

export const failingGenerator = () => vi.fn(async () => Promise.reject(new Error("OpenAI is down")));

// Set createdAt manually instead of waiting for real time to pass.
export const ageFactsBy = (userId: string, seconds: number) =>
  prisma.fact.updateMany({ where: { userId }, data: { createdAt: new Date(Date.now() - seconds * 1000) } });

export const addFact = (userId: string, movie: string, text: string, ageSeconds: number) =>
  prisma.fact.create({
    data: { userId, movie, text, createdAt: new Date(Date.now() - ageSeconds * 1000) },
  });

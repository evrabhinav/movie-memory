import { prisma } from "@/lib/db";
import { generateFactText } from "@/lib/openai";

export const CACHE_WINDOW_MS = 60_000;
export const LOCK_LEASE_MS = 30_000;
const WAIT_FOR_OTHER_MS = 1_000;

export type FactResult =
  | { kind: "fact"; text: string; createdAt: Date; source: "cache" | "new" | "stale" }
  | { kind: "generating" }
  | { kind: "error"; message: string };

type Generator = (movie: string) => Promise<string>;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function newestFact(userId: string, movie: string) {
  return prisma.fact.findFirst({
    where: { userId, movie },
    orderBy: { createdAt: "desc" },
  });
}

const isFresh = (f: { createdAt: Date }) => Date.now() - f.createdAt.getTime() < CACHE_WINDOW_MS;

// Every query is scoped to userId, which always comes from the session.
// `generate` is injectable so tests can use a fake instead of calling OpenAI.
export async function getFact(userId: string, generate: Generator = generateFactText): Promise<FactResult> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { favoriteMovie: true } });
  const movie = user?.favoriteMovie;
  if (!movie) return { kind: "error", message: "No favorite movie set yet." };

  // 1. Cache: a fact under 60 seconds old is returned without calling OpenAI.
  const newest = await newestFact(userId, movie);
  if (newest && isFresh(newest)) return { kind: "fact", text: newest.text, createdAt: newest.createdAt, source: "cache" };

  // 2. Lock: ONE atomic conditional UPDATE. Only one caller can match the WHERE clause.
  const lock = await prisma.user.updateMany({
    where: {
      id: userId,
      OR: [{ factLockedAt: null }, { factLockedAt: { lt: new Date(Date.now() - LOCK_LEASE_MS) } }],
    },
    data: { factLockedAt: new Date() },
  });

  if (lock.count === 0) {
    // Someone else is generating right now.
    if (newest) return { kind: "fact", text: newest.text, createdAt: newest.createdAt, source: "stale" };
    await sleep(WAIT_FOR_OTHER_MS);
    const appeared = await newestFact(userId, movie);
    if (appeared) return { kind: "fact", text: appeared.text, createdAt: appeared.createdAt, source: "cache" };
    return { kind: "generating" };
  }

  try {
    // Re-check now that we hold the lock: another request may have finished between
    // our cache check and our lock, and generating again would waste a call.
    const latest = await newestFact(userId, movie);
    if (latest && isFresh(latest)) return { kind: "fact", text: latest.text, createdAt: latest.createdAt, source: "cache" };

    // 3. Generate (the real generator enforces a 10 second timeout) and store.
    const text = await generate(movie);
    const fact = await prisma.fact.create({ data: { userId, movie, text } });
    return { kind: "fact", text: fact.text, createdAt: fact.createdAt, source: "new" };
  } catch (err) {
    // 4. Fallback: newest existing fact of any age, otherwise a friendly error.
    console.error("Fact generation failed:", err instanceof Error ? err.message : err);
    if (newest) return { kind: "fact", text: newest.text, createdAt: newest.createdAt, source: "stale" };
    return { kind: "error", message: "We couldn't fetch a fun fact right now. Please try again in a moment." };
  } finally {
    // 5. Always release the lock.
    await prisma.user.update({ where: { id: userId }, data: { factLockedAt: null } });
  }
}

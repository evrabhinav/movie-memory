import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { getFact } from "@/lib/facts";
import { addFact, cleanupTestUsers, failingGenerator, fakeGenerator, makeUser } from "./helpers";

afterAll(cleanupTestUsers);

const lockOf = async (userId: string) =>
  (await prisma.user.findUnique({ where: { id: userId } }))?.factLockedAt ?? null;

describe("OpenAI failure fallback", () => {
  it("returns the old fact when OpenAI fails and one exists", async () => {
    const userId = await makeUser();
    await addFact(userId, "Inception", "Old fact", 120); // stale, so a refresh is attempted
    const generate = failingGenerator();

    const result = await getFact(userId, generate);

    expect(generate).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ kind: "fact", text: "Old fact", source: "stale" });
    expect(await lockOf(userId)).toBeNull(); // finally released the lock
  });

  it("returns a friendly error when OpenAI fails and there is no fact", async () => {
    const userId = await makeUser();
    const result = await getFact(userId, failingGenerator());

    expect(result.kind).toBe("error");
    if (result.kind === "error") expect(result.message).not.toMatch(/OpenAI is down/); // no internals leaked
    expect(await prisma.fact.count({ where: { userId } })).toBe(0);
    expect(await lockOf(userId)).toBeNull();
  });
});

describe("lock", () => {
  it("does not call OpenAI when the lock is held, and serves the existing fact", async () => {
    const userId = await makeUser();
    await addFact(userId, "Inception", "Existing fact", 120);
    await prisma.user.update({ where: { id: userId }, data: { factLockedAt: new Date() } });
    const generate = fakeGenerator();

    const result = await getFact(userId, generate);

    expect(generate).not.toHaveBeenCalled();
    expect(result).toMatchObject({ kind: "fact", text: "Existing fact", source: "stale" });
  });

  it("returns 'generating' when the lock is held and there is no fact yet", async () => {
    const userId = await makeUser();
    await prisma.user.update({ where: { id: userId }, data: { factLockedAt: new Date() } });
    const generate = fakeGenerator();

    expect(await getFact(userId, generate)).toEqual({ kind: "generating" });
    expect(generate).not.toHaveBeenCalled();
    expect(await lockOf(userId)).not.toBeNull(); // we must not release someone else's lock
  });

  it("takes over a crashed holder's lock once it is older than 30s", async () => {
    const userId = await makeUser();
    await prisma.user.update({
      where: { id: userId },
      data: { factLockedAt: new Date(Date.now() - 31_000) },
    });
    const generate = fakeGenerator();

    expect(await getFact(userId, generate)).toMatchObject({ text: "Fact 1", source: "new" });
    expect(await lockOf(userId)).toBeNull();
  });
});

describe("authorization and scoping", () => {
  it("user A never receives user B's facts", async () => {
    const a = await makeUser("Inception");
    const b = await makeUser("Inception"); // same movie on purpose
    await addFact(b, "Inception", "B's private fact", 5);
    const generate = fakeGenerator();

    const result = await getFact(a, generate);

    expect(result).toMatchObject({ kind: "fact", text: "Fact 1", source: "new" }); // generated for A
    expect(JSON.stringify(result)).not.toContain("B's private fact");
    expect(await prisma.fact.count({ where: { userId: a } })).toBe(1);
    expect(await prisma.fact.count({ where: { userId: b } })).toBe(1); // B untouched
  });

  it("an unknown user id gets an error and never reaches OpenAI", async () => {
    const generate = fakeGenerator();
    expect((await getFact("does-not-exist", generate)).kind).toBe("error");
    expect(generate).not.toHaveBeenCalled();
  });

  it("a user with no favorite movie gets an error and never reaches OpenAI", async () => {
    const userId = await makeUser(null);
    const generate = fakeGenerator();
    expect((await getFact(userId, generate)).kind).toBe("error");
    expect(generate).not.toHaveBeenCalled();
  });

  it("facts are scoped to the current movie, not just the user", async () => {
    const userId = await makeUser("Inception");
    await addFact(userId, "Inception", "Inception fact", 5);
    await prisma.user.update({ where: { id: userId }, data: { favoriteMovie: "RRR" } });
    const generate = fakeGenerator();

    expect(await getFact(userId, generate)).toMatchObject({ text: "Fact 1", source: "new" });
    expect(generate).toHaveBeenCalledWith("RRR");
  });
});

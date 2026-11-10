import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { getFact } from "@/lib/facts";
import { ageFactsBy, cleanupTestUsers, fakeGenerator, makeUser } from "./helpers";

afterAll(cleanupTestUsers);

describe("60 second cache window", () => {
  it("returns Fact 1 again inside 60s, and a new Fact 2 after 60s", async () => {
    const userId = await makeUser();
    const generate = fakeGenerator();

    const first = await getFact(userId, generate);
    expect(first).toMatchObject({ kind: "fact", text: "Fact 1", source: "new" });
    expect(generate).toHaveBeenCalledTimes(1);

    const second = await getFact(userId, generate);
    expect(second).toMatchObject({ kind: "fact", text: "Fact 1", source: "cache" });
    expect(generate).toHaveBeenCalledTimes(1); // OpenAI NOT called again

    await ageFactsBy(userId, 59); // 59s old: still inside the window
    expect(await getFact(userId, generate)).toMatchObject({ text: "Fact 1", source: "cache" });
    expect(generate).toHaveBeenCalledTimes(1);

    await ageFactsBy(userId, 61); // 61s old: window has passed
    expect(await getFact(userId, generate)).toMatchObject({ kind: "fact", text: "Fact 2", source: "new" });
    expect(generate).toHaveBeenCalledTimes(2);

    expect(await prisma.fact.count({ where: { userId } })).toBe(2);
    expect((await prisma.user.findUnique({ where: { id: userId } }))?.factLockedAt).toBeNull();
  });

  it("does not restart the window when a cached fact is read", async () => {
    const userId = await makeUser();
    const generate = fakeGenerator();
    await getFact(userId, generate); // Fact 1 at t=0
    await ageFactsBy(userId, 45); // t=45
    await getFact(userId, generate); // cache hit must not refresh createdAt
    await ageFactsBy(userId, 65); // t=65 from the original creation
    expect(await getFact(userId, generate)).toMatchObject({ text: "Fact 2", source: "new" });
  });
});

describe("burst protection", () => {
  it("5 simultaneous requests generate only ONE fact", async () => {
    const userId = await makeUser();
    const generate = fakeGenerator(300); // slow enough that all 5 overlap

    const results = await Promise.all(Array.from({ length: 5 }, () => getFact(userId, generate)));

    expect(generate).toHaveBeenCalledTimes(1);
    expect(await prisma.fact.count({ where: { userId } })).toBe(1);
    for (const r of results) expect(r).toMatchObject({ kind: "fact", text: "Fact 1" });
  });
});

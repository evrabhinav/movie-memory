import { describe, expect, it } from "vitest";
import { favoriteMovieSchema } from "@/lib/validation";

const parse = (v: unknown) => favoriteMovieSchema.safeParse(v);

describe("favoriteMovieSchema", () => {
  it("trims surrounding whitespace", () => {
    expect(parse("   Heat   ")).toMatchObject({ success: true, data: "Heat" });
  });

  it("collapses newlines, tabs and repeated spaces into single spaces", () => {
    expect(parse("The\n  Dark\tKnight")).toMatchObject({ success: true, data: "The Dark Knight" });
  });

  it.each([["empty", ""], ["only spaces", "     "], ["missing field", null], ["not a string", 42]])(
    "rejects %s",
    (_label, value) => {
      expect(parse(value).success).toBe(false);
    },
  );

  it("accepts exactly 100 characters and rejects 101 (measured after trimming)", () => {
    expect(parse("a".repeat(100)).success).toBe(true);
    expect(parse("  " + "a".repeat(100) + "  ").success).toBe(true);
    expect(parse("a".repeat(101)).success).toBe(false);
  });

  it("keeps quotes and instruction-like text as plain data (the prompt escapes them)", () => {
    expect(parse('Say "hi" now')).toMatchObject({ success: true, data: 'Say "hi" now' });
  });
});

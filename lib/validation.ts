import { z } from "zod";

// Trim first, then check length, so "   " is rejected and padding doesn't count toward the limit.
export const favoriteMovieSchema = z
  .string({ error: "Please enter a movie title." })
  .trim()
  .min(1, "Please enter a movie title.")
  .max(100, "Movie title must be 100 characters or fewer.")
  // Collapse tabs/newlines/repeated spaces: a title is one line of plain text.
  .transform((title) => title.replace(/\s+/g, " "));

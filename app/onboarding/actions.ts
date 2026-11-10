"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/session";
import { favoriteMovieSchema } from "@/lib/validation";

export type OnboardingState = { error?: string; movie?: string };

export async function saveFavoriteMovie(
  _prev: OnboardingState,
  formData: FormData,
): Promise<OnboardingState> {
  // The user comes from the session; nothing identifying is read from the form.
  const user = await requireUser();
  if (user.favoriteMovie) redirect("/dashboard");

  const raw = formData.get("movie");
  const parsed = favoriteMovieSchema.safeParse(raw);
  if (!parsed.success) {
    return {
      error: parsed.error.issues[0].message,
      movie: typeof raw === "string" ? raw : "",
    };
  }

  // Only writes while favoriteMovie is still null, so a double submit can't overwrite it.
  await prisma.user.updateMany({
    where: { id: user.id, favoriteMovie: null },
    data: { favoriteMovie: parsed.data },
  });

  redirect("/dashboard");
}

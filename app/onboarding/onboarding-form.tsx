"use client";

import { useActionState } from "react";
import { saveFavoriteMovie, type OnboardingState } from "./actions";

export function OnboardingForm() {
  const [state, action, pending] = useActionState<OnboardingState, FormData>(
    saveFavoriteMovie,
    {},
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <label htmlFor="movie" className="text-sm font-medium">
        Favorite movie
      </label>
      <input
        id="movie"
        name="movie"
        type="text"
        defaultValue={state.movie}
        // Browser hint only; the server re-validates everything.
        maxLength={150}
        placeholder="e.g. The Shawshank Redemption"
        autoComplete="off"
        autoFocus
        aria-invalid={state.error ? true : undefined}
        aria-describedby={state.error ? "movie-error" : undefined}
        className="rounded-xl border border-border bg-black/30 px-4 py-3 text-lg outline-none transition placeholder:text-muted/60 focus:border-accent focus:ring-2 focus:ring-accent/30"
      />
      {state.error && (
        <p id="movie-error" role="alert" className="text-sm text-red-400">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="cursor-pointer rounded-xl bg-accent px-5 py-3 font-semibold text-neutral-900 transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : "Save and continue"}
      </button>
    </form>
  );
}

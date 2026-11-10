import { redirect } from "next/navigation";
import { Suspense } from "react";
import { signOut } from "@/auth";
import { requireUser } from "@/lib/session";
import { FactSection, FactSkeleton } from "./fact-section";

function initialsFor(name: string | null, email: string | null) {
  const source = name?.trim() || email?.trim() || "?";
  const parts = source.split(/\s+/).filter(Boolean);
  const letters = parts.length > 1 ? parts[0][0] + parts[parts.length - 1][0] : source.slice(0, 2);
  return letters.toUpperCase();
}

export default async function DashboardPage() {
  const user = await requireUser();
  if (!user.favoriteMovie) redirect("/onboarding");

  // Google may omit the name or photo, so every field has a fallback.
  const displayName = user.name?.trim() || "Movie fan";
  const displayEmail = user.email || "No email on file";

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-12">
      <header className="rise-in flex items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Movie Memory</h1>
        <form
          action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:border-red-400/60 hover:text-red-300"
          >
            Log out
          </button>
        </form>
      </header>

      <section className="rise-in flex items-center gap-5 rounded-2xl border border-border bg-surface p-6 backdrop-blur">
        {user.image ? (
          // Plain <img>: Google avatar URLs are external and don't need Next's optimizer.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={user.image}
            alt={`${displayName}'s profile photo`}
            referrerPolicy="no-referrer"
            className="h-16 w-16 rounded-full border border-border object-cover"
          />
        ) : (
          <div
            aria-hidden
            className="flex h-16 w-16 items-center justify-center rounded-full bg-linear-to-br from-accent to-accent-2 text-xl font-bold text-neutral-900"
          >
            {initialsFor(user.name, user.email)}
          </div>
        )}
        <div className="min-w-0">
          <p className="truncate text-xl font-semibold">{displayName}</p>
          <p className="truncate text-muted">{displayEmail}</p>
        </div>
      </section>

      <section className="rise-in rounded-2xl border border-border bg-surface p-6 backdrop-blur">
        <h2 className="text-sm font-medium uppercase tracking-wider text-accent">Favorite movie</h2>
        <p className="mt-2 text-3xl font-bold tracking-tight break-words">{user.favoriteMovie}</p>
      </section>

      <Suspense fallback={<FactSkeleton />}>
        <FactSection userId={user.id} />
      </Suspense>
    </main>
  );
}

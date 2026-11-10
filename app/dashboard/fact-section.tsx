import { getFact, type FactResult } from "@/lib/facts";
import { NewFactButton } from "./new-fact-button";

// Isolated so a slow or failing fact never blocks or breaks the rest of the dashboard.
export async function FactSection({ userId }: { userId: string }) {
  let result: FactResult;
  try {
    result = await getFact(userId);
  } catch (err) {
    // getFact handles OpenAI failures itself; this only catches unexpected errors (e.g. DB down).
    console.error("getFact crashed:", err);
    result = { kind: "error", message: "Something went wrong loading your fun fact." };
  }

  return (
    <section className="rounded-2xl border border-border bg-surface p-6 backdrop-blur">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium uppercase tracking-wider text-accent">Fun fact</h2>
        <NewFactButton />
      </div>

      {result.kind === "fact" && (
        <>
          <p className="mt-4 text-lg leading-relaxed">{result.text}</p>
          {result.source === "stale" && (
            <p className="mt-3 text-sm text-muted">
              We couldn&apos;t get a fresh fact just now, so here&apos;s the latest one we have.
            </p>
          )}
        </>
      )}
      {result.kind === "generating" && (
        <p className="mt-4 text-lg text-muted">
          A fun fact is being generated. Give it a moment, then press &ldquo;New fact&rdquo;.
        </p>
      )}
      {result.kind === "error" && (
        <p role="alert" className="mt-4 text-lg text-red-400">
          {result.message}
        </p>
      )}
    </section>
  );
}

export function FactSkeleton() {
  return (
    <section
      aria-busy="true"
      className="rounded-2xl border border-border bg-surface p-6 backdrop-blur"
    >
      <h2 className="text-sm font-medium uppercase tracking-wider text-accent">Fun fact</h2>
      <div className="mt-4 space-y-3">
        <div className="h-4 w-full animate-pulse rounded bg-white/10" />
        <div className="h-4 w-4/5 animate-pulse rounded bg-white/10" />
      </div>
    </section>
  );
}

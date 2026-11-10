"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";

// Re-renders the server tree, which makes <FactSection /> ask the server for a fact again.
export function NewFactButton() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => startTransition(() => router.refresh())}
      className="cursor-pointer rounded-lg border border-border bg-surface px-4 py-2 text-sm font-medium transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? "Fetching…" : "New fact"}
    </button>
  );
}

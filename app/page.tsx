import { redirect } from "next/navigation";
import { signIn } from "@/auth";
import { getCurrentUser } from "@/lib/session";

const steps = [
  { n: "1", title: "Sign in", text: "One click with Google." },
  { n: "2", title: "Pick a film", text: "Tell us your all-time favorite." },
  { n: "3", title: "Get a fact", text: "A fun fact, powered by AI." },
];

export default async function Home() {
  const user = await getCurrentUser();
  if (user) redirect(user.favoriteMovie ? "/dashboard" : "/onboarding");

  return (
    <main className="relative flex flex-1 items-center justify-center overflow-hidden px-6 py-16">
      {/* Decorative film strips */}
      <div aria-hidden className="film-strip absolute inset-y-0 left-6 hidden sm:block" />
      <div aria-hidden className="film-strip absolute inset-y-0 right-6 hidden sm:block" />

      <div className="rise-in flex w-full max-w-xl flex-col items-center gap-8 text-center">
        <div className="flex items-center gap-2 rounded-full border border-border bg-surface px-4 py-1.5 text-sm text-muted backdrop-blur">
          <svg viewBox="0 0 24 24" className="h-4 w-4 text-accent" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M4 11h16v9a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
            <path d="m4 11-.9-3.6a1 1 0 0 1 .7-1.2l13.5-3.6a1 1 0 0 1 1.2.7L19 7" />
            <path d="m8 7.5 1.5 3.3M13 6.2l1.5 3.3" />
          </svg>
          Movie Memory
        </div>

        <h1 className="text-5xl font-bold tracking-tight sm:text-6xl">
          Your favorite movie,{" "}
          <span className="bg-linear-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            remembered.
          </span>
        </h1>

        <p className="max-w-md text-lg text-muted">
          Tell us the film you love most and we&apos;ll serve up a fun fact about it.
        </p>

        <form
          action={async () => {
            "use server";
            // Land back on "/" so the routing rules above decide where the user goes next.
            await signIn("google", { redirectTo: "/" });
          }}
        >
          <button
            type="submit"
            className="group flex cursor-pointer items-center gap-3 rounded-xl bg-white px-6 py-3 font-medium text-neutral-900 shadow-lg shadow-accent/10 transition hover:-translate-y-0.5 hover:shadow-accent/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <svg viewBox="0 0 48 48" className="h-5 w-5" aria-hidden>
              <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z" />
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
              <path fill="#FBBC05" d="M10.5 28.6a14.5 14.5 0 0 1 0-9.2l-7.9-6.1a24 24 0 0 0 0 21.4l7.9-6.1z" />
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.9l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
            </svg>
            Sign in with Google
          </button>
        </form>

        <ol className="mt-4 grid w-full grid-cols-1 gap-3 sm:grid-cols-3">
          {steps.map((s) => (
            <li
              key={s.n}
              className="rounded-xl border border-border bg-surface p-4 text-left backdrop-blur"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/15 text-xs font-semibold text-accent">
                {s.n}
              </span>
              <p className="mt-3 font-medium">{s.title}</p>
              <p className="mt-1 text-sm text-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </main>
  );
}

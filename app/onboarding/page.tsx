import { redirect } from "next/navigation";
import { requireUser } from "@/lib/session";
import { OnboardingForm } from "./onboarding-form";

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.favoriteMovie) redirect("/dashboard");

  const firstName = user.name?.split(" ")[0];

  return (
    <main className="flex flex-1 items-center justify-center px-6 py-16">
      <div className="rise-in w-full max-w-md rounded-2xl border border-border bg-surface p-8 backdrop-blur">
        <p className="text-sm font-medium text-accent">Welcome{firstName ? `, ${firstName}` : ""}</p>
        <h1 className="mt-1 text-3xl font-bold tracking-tight">What&apos;s your favorite movie?</h1>
        <p className="mb-6 mt-2 text-muted">
          You only do this once. We&apos;ll use it to find you a fun fact.
        </p>
        <OnboardingForm />
      </div>
    </main>
  );
}

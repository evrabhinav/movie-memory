import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

// The user id always comes from the server-side session, never from the client.
export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return prisma.user.findUnique({ where: { id: session.user.id } });
}

// For protected pages and actions: logged-out visitors are sent to the landing page.
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) redirect("/");
  return user;
}

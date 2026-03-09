import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export type { UserRole };

// Hardcoded admin email list - update this to add/remove admins
const ADMIN_EMAILS = [
  "kilinkod@gmail.com", // Replace with actual admin email(s)
];

export async function requireAdmin() {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const userEmail = user.primaryEmailAddress?.emailAddress;
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
    redirect("/dashboard");
  }

  return { user };
}

// Requires the user to have a specific role. Redirects to /dashboard if not.
export async function requireRole(role: UserRole) {
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: user.id },
    select: { role: true },
  });

  if (!profile || profile.role !== role) {
    redirect("/dashboard");
  }

  return { user, role: profile.role };
}

// Returns the current user's role from DB, or null if not found.
export async function getUserRole(): Promise<UserRole | null> {
  const user = await currentUser();
  if (!user) return null;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: user.id },
    select: { role: true },
  });

  return profile?.role ?? null;
}

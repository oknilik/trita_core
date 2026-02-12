import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";

// Hardcoded admin email list - update this to add/remove admins
const ADMIN_EMAILS = [
  "kilinkod@gmail.com", // Replace with actual admin email(s)
];

export async function requireAdmin() {
  // 1. Check Clerk authentication (same as dashboard/page.tsx lines 46-51)
  const user = await currentUser();
  if (!user) redirect("/sign-in");

  // 2. Check if user email is in admin list
  const userEmail = user.primaryEmailAddress?.emailAddress;
  if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
    redirect("/dashboard"); // Soft redirect for non-admins
  }

  return { user };
}

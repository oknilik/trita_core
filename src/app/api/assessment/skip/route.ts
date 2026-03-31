import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { getActiveOrgMembership } from "@/lib/org-context";

// POST /api/assessment/skip
// Marks the assessment as skipped for org managers/admins.
// Only accessible by ORG_MANAGER or ORG_ADMIN.
export async function POST() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const orgMembership = await getActiveOrgMembership(profile.id);
  if (!orgMembership || !hasOrgRole(orgMembership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  await prisma.userProfile.update({
    where: { id: profile.id },
    data: { assessmentSkippedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

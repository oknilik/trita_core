import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1).max(80),
  orgId: z.string().optional(),
});

// POST /api/team — create a new team
// - MANAGER role: can create standalone teams (no orgId)
// - Org ADMIN: can create teams under their org (orgId required)
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const { name, orgId } = body.data;

  if (orgId) {
    // Org-context team creation: verify org admin membership
    const membership = await prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId: profile.id } },
      select: { role: true },
    });
    if (!membership || !hasOrgRole(membership.role, "ORG_MANAGER")) {
      return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    }

    const team = await prisma.team.create({
      data: { name, ownerId: profile.id, orgId },
      select: { id: true, name: true, createdAt: true },
    });
    return NextResponse.json({ team }, { status: 201 });
  }

  // Standalone team: requires MANAGER role
  if (profile.role !== "MANAGER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const team = await prisma.team.create({
    data: { name, ownerId: profile.id },
    select: { id: true, name: true, createdAt: true },
  });

  return NextResponse.json({ team }, { status: 201 });
}

// GET /api/team — list teams owned by the current coach
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true },
  });
  if (!profile || profile.role !== "MANAGER") {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const teams = await prisma.team.findMany({
    where: { ownerId: profile.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      createdAt: true,
      _count: { select: { members: true } },
    },
  });

  return NextResponse.json({ teams });
}

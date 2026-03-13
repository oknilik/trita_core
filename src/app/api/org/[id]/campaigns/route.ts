import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
});

// GET /api/org/[id]/campaigns — list org campaigns
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const campaigns = await prisma.campaign.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      closedAt: true,
      creator: { select: { username: true } },
      _count: { select: { participants: true } },
    },
  });

  return NextResponse.json({ campaigns });
}

// POST /api/org/[id]/campaigns — create a campaign (ORG_MANAGER+)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId } = await params;

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership || !hasOrgRole(membership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const campaign = await prisma.campaign.create({
    data: {
      orgId,
      name: body.data.name,
      description: body.data.description,
      createdBy: profile.id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}

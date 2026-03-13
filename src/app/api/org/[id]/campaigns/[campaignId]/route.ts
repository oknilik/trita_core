import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";

const patchSchema = z.object({
  status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]),
});

const addParticipantsSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(50),
});

async function resolveContext(orgId: string, campaignId: string, userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return null;

  const [membership, campaign] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId: profile.id } },
      select: { role: true },
    }),
    prisma.campaign.findUnique({
      where: { id: campaignId, orgId },
      select: { id: true, orgId: true, status: true },
    }),
  ]);

  if (!membership || !campaign) return null;
  return { profileId: profile.id, role: membership.role, campaign };
}

// GET /api/org/[id]/campaigns/[campaignId] — campaign detail
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string; campaignId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId, campaignId } = await params;

  const ctx = await resolveContext(orgId, campaignId, userId);
  if (!ctx) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      createdAt: true,
      closedAt: true,
      creator: { select: { username: true } },
      participants: {
        orderBy: { addedAt: "asc" },
        select: {
          id: true,
          addedAt: true,
          user: { select: { id: true, username: true, email: true } },
        },
      },
    },
  });

  return NextResponse.json({ campaign });
}

// PATCH /api/org/[id]/campaigns/[campaignId] — update status (ORG_MANAGER+)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string; campaignId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId, campaignId } = await params;

  const ctx = await resolveContext(orgId, campaignId, userId);
  if (!ctx) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!hasOrgRole(ctx.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: body.data.status,
      ...(body.data.status === "CLOSED" ? { closedAt: new Date() } : {}),
    },
    select: { id: true, status: true, closedAt: true },
  });

  return NextResponse.json({ campaign });
}

// POST /api/org/[id]/campaigns/[campaignId] — add participants (ORG_MANAGER+)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string; campaignId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId, campaignId } = await params;

  const ctx = await resolveContext(orgId, campaignId, userId);
  if (!ctx) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (!hasOrgRole(ctx.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = addParticipantsSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  // Verify all userIds are org members
  const memberships = await prisma.organizationMember.findMany({
    where: { orgId, userId: { in: body.data.userIds } },
    select: { userId: true },
  });
  const validIds = new Set(memberships.map((m) => m.userId));
  const invalid = body.data.userIds.filter((id) => !validIds.has(id));
  if (invalid.length > 0) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  await prisma.campaignParticipant.createMany({
    data: body.data.userIds.map((uid) => ({
      campaignId,
      userId: uid,
    })),
    skipDuplicates: true,
  });

  return NextResponse.json({ ok: true });
}

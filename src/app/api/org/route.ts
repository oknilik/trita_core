import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TRIAL_DAYS } from "@/lib/stripe";
import { checkRateLimit } from "@/lib/rate-limit";

const createSchema = z.object({
  name: z.string().min(1).max(100),
});

// POST /api/org — create a new organization (any authed user, 1-org limit)
export async function POST(req: Request) {
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // 1-org enforcement: user may only belong to one organization
  const existingMembership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
  });
  if (existingMembership) {
    return NextResponse.json({ error: "ALREADY_IN_ORG" }, { status: 409 });
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  try {
    const org = await prisma.$transaction(async (tx) => {
      // Double-check membership inside transaction to prevent race conditions
      const existing = await tx.organizationMember.findUnique({
        where: { userId: profile.id },
      });
      if (existing) throw new Error("ALREADY_IN_ORG");

      const newOrg = await tx.organization.create({
        data: {
          name: body.data.name,
          ownerId: profile.id,
          status: "PENDING_SETUP",
          members: {
            create: { userId: profile.id, role: "ORG_ADMIN" },
          },
        },
        select: { id: true, name: true, createdAt: true, status: true },
      });

      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

      await tx.subscription.create({
        data: {
          orgId: newOrg.id,
          status: "trialing",
          trialEndsAt,
        },
      });

      console.log(`[Org] Created org ${newOrg.id} with trialing subscription (ends ${trialEndsAt.toISOString()})`);
      return newOrg;
    });

    return NextResponse.json({ org }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "ALREADY_IN_ORG") {
      return NextResponse.json({ error: "ALREADY_IN_ORG" }, { status: 409 });
    }
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "ALREADY_IN_ORG" }, { status: 409 });
    }
    throw err;
  }
}

// GET /api/org — list orgs where I'm a member
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: profile.id },
    orderBy: { joinedAt: "desc" },
    select: {
      role: true,
      joinedAt: true,
      org: {
        select: {
          id: true,
          name: true,
          status: true,
          createdAt: true,
          _count: { select: { members: true, teams: true } },
        },
      },
    },
  });

  const orgs = memberships.map((m) => ({
    ...m.org,
    myRole: m.role,
    joinedAt: m.joinedAt,
  }));

  return NextResponse.json({ orgs });
}

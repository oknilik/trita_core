import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TRIAL_DAYS } from "@/lib/subscription";
import { checkRateLimit } from "@/lib/rate-limit";
import { getActiveOrgMembership, setActiveOrgContext } from "@/lib/org-context";
import { isConsultingLed } from "@/lib/operating-mode";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  // Consulting-led mód: a tanácsadó ügyfél-szervezetet hoz létre, amelybe
  // ORG_CONSULTANT-ként lép be (nem admin) — a kliens admin később csatlakozik.
  asConsultant: z.boolean().optional(),
});

// POST /api/org — create a new organization (multi-org membership supported)
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

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  // Tanácsadói org-létrehozás: csak consulting-led módban, és csak olyan
  // usernek, aki már kijelölt tanácsadó legalább egy szervezetben (a
  // tanácsadói identitást a trita admin adja az /admin felületen).
  let creatorRole: "ORG_ADMIN" | "ORG_CONSULTANT" = "ORG_ADMIN";
  if (body.data.asConsultant) {
    if (!isConsultingLed()) {
      return NextResponse.json({ error: "NOT_CONSULTING_MODE" }, { status: 403 });
    }
    const consultantMembership = await prisma.organizationMember.findFirst({
      where: { userId: profile.id, role: "ORG_CONSULTANT", leftAt: null },
      select: { id: true },
    });
    if (!consultantMembership) {
      return NextResponse.json({ error: "NOT_CONSULTANT" }, { status: 403 });
    }
    creatorRole = "ORG_CONSULTANT";
  }

  try {
    const org = await prisma.$transaction(async (tx) => {
      const newOrg = await tx.organization.create({
        data: {
          name: body.data.name,
          ownerId: profile.id,
          status: "PENDING_SETUP",
          members: {
            create: { userId: profile.id, role: creatorRole },
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
    await setActiveOrgContext(profile.id, org.id);

    return NextResponse.json({ org }, { status: 201 });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "CONFLICT" }, { status: 409 });
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
  const activeMembership = await getActiveOrgMembership(profile.id);

  const memberships = await prisma.organizationMember.findMany({
    where: { userId: profile.id, leftAt: null },
    orderBy: { joinedAt: "desc" },
    select: {
      orgId: true,
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
    isActiveContext: activeMembership?.orgId === m.orgId,
  }));

  return NextResponse.json({ orgs });
}

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { TRIAL_DAYS } from "@/lib/subscription";
import { checkRateLimit } from "@/lib/rate-limit";
import { getActiveOrgMembership, setActiveOrgContext } from "@/lib/org-context";
import { isConsultingLed } from "@/lib/operating-mode";
import { isPlatformAdminEmail } from "@/lib/measurement-auth";
import { sanitizeOrgBillingProfile } from "@/lib/org-billing";
import { getRequestLogger } from "@/lib/logger.server";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  // Consulting-led mód: a tanácsadó ügyfél-szervezetet hoz létre, amelybe
  // ORG_CONSULTANT-ként lép be (nem admin) — a kliens admin később csatlakozik.
  asConsultant: z.boolean().optional(),
  // Cégadatok (opcionális) — már létrehozáskor megadhatók; a mezőket a
  // sanitizeOrgBillingProfile szűri. Később az admin felületen bővíthető.
  billing: z.record(z.string(), z.string()).optional(),
});

// POST /api/org — create a new organization (multi-org membership supported)
export async function POST(req: Request) {
  const log = await getRequestLogger("org");
  const rateLimitResponse = await checkRateLimit("api");
  if (rateLimitResponse) return rateLimitResponse;

  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  // Tanácsadói org-létrehozás: csak consulting-led módban. Tanácsadónak
  // számít a platform-tanácsadó (isConsultant), a platform-admin
  // (ADMIN_EMAILS) és a már kiosztott ORG_CONSULTANT is — így az ELSŐ
  // szervezet is létrehozható (nincs tyúk-tojás).
  let creatorRole: "ORG_ADMIN" | "ORG_CONSULTANT" = "ORG_ADMIN";

  // Consulting-led módban org-ot KIZÁRÓLAG tanácsadó hozhat létre
  // (asConsultant ág) — a self-serve org-létrehozás zárva. Self-serve
  // módra váltásnál (operating-mode.ts) ez a kapu magától kinyílik.
  if (isConsultingLed() && !body.data.asConsultant) {
    return NextResponse.json({ error: "CONSULTING_MODE_ONLY" }, { status: 403 });
  }

  if (body.data.asConsultant) {
    if (!isConsultingLed()) {
      return NextResponse.json({ error: "NOT_CONSULTING_MODE" }, { status: 403 });
    }
    const consultantMembership = await prisma.organizationMember.findFirst({
      where: { userId: profile.id, role: "ORG_CONSULTANT", leftAt: null },
      select: { id: true },
    });
    const isTrustedConsultant =
      profile.isConsultant ||
      isPlatformAdminEmail(profile.email) ||
      Boolean(consultantMembership);
    if (!isTrustedConsultant) {
      return NextResponse.json({ error: "NOT_CONSULTANT" }, { status: 403 });
    }
    creatorRole = "ORG_CONSULTANT";
  }

  try {
    const org = await prisma.$transaction(async (tx) => {
      const billingProfile = sanitizeOrgBillingProfile(body.data.billing);
      const newOrg = await tx.organization.create({
        data: {
          name: body.data.name,
          ownerId: profile.id,
          status: "PENDING_SETUP",
          ...(Object.keys(billingProfile).length > 0
            ? { billingProfile: billingProfile as Record<string, string> }
            : {}),
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

      log.info({ event: "org.created", orgId: newOrg.id, trialEndsAt: trialEndsAt.toISOString() }, "Org created with trialing subscription");
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

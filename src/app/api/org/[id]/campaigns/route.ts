import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveOrgCapabilityDecision, resolveOrgPolicySnapshot } from "@/lib/policy-service";
import { canManageMeasurements } from "@/lib/measurement-auth";
import { normalizeCampaignSteps } from "@/lib/campaign-steps-core";

const createSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  type: z.enum(["OBSERVER_360", "TEAM_ROLE", "TEAM_ROLE_360", "TRUST_360", "PSYCH_SAFETY"]).default("OBSERVER_360"),
  // Több-lépéses kampány: a kiválasztott mérések (kanonikus sorrendbe rendezzük).
  types: z
    .array(z.enum(["OBSERVER_360", "TEAM_ROLE", "TEAM_ROLE_360", "TRUST_360", "PSYCH_SAFETY"]))
    .min(1)
    .max(3)
    .optional(),
  teamId: z.string().min(1).optional(),
  allowExternalObservers: z.boolean().optional().default(false),
  stepIntervalHours: z.number().int().min(0).max(168).optional().default(24),
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
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  // Mérést csak tanácsadó indít (ORG_CONSULTANT vagy platform-admin).
  if (!canManageMeasurements(membership.role, profile.email, profile.isConsultant)) {
    return NextResponse.json({ error: "CONSULTANT_ONLY" }, { status: 403 });
  }
  const policySnapshot = await resolveOrgPolicySnapshot({
    orgId,
    orgRole: membership.role,
  });
  const decision = resolveOrgCapabilityDecision(policySnapshot, "launchCampaign");
  if (!decision.allowed) {
    return NextResponse.json(
      {
        error: "CAPABILITY_DENIED",
        reason: decision.reason,
        upgradeHint: decision.upgradeHint?.code ?? null,
      },
      { status: 403 },
    );
  }

  const body = createSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  // Csapat-célzásnál a csapatnak ehhez az org-hoz kell tartoznia.
  if (body.data.teamId) {
    const team = await prisma.team.findUnique({
      where: { id: body.data.teamId },
      select: { orgId: true },
    });
    if (!team || team.orgId !== orgId) {
      return NextResponse.json({ error: "INVALID_TEAM" }, { status: 400 });
    }
  }
  // Lépések: a types-ból (vagy legacy type-ból), kanonikus sorrendben.
  const steps = normalizeCampaignSteps(body.data.types ?? [body.data.type]);
  if (steps.length === 0) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  // Szerep-kört vagy pszich. biztonságot tartalmazó kampány csak csapatra
  // indítható (a kör a csapaton él, az anonim aggregátum csapatszintű).
  if (
    steps.some(
      (st) =>
        st === "TEAM_ROLE" ||
        st === "TEAM_ROLE_360" ||
        st === "TRUST_360" ||
        st === "PSYCH_SAFETY",
    ) &&
    !body.data.teamId
  ) {
    return NextResponse.json({ error: "TEAM_REQUIRED" }, { status: 400 });
  }

  const campaign = await prisma.campaign.create({
    data: {
      orgId,
      name: body.data.name,
      description: body.data.description,
      type: steps[0],
      steps,
      teamId: body.data.teamId,
      allowExternalObservers: body.data.allowExternalObservers,
      stepIntervalHours: body.data.stepIntervalHours,
      createdBy: profile.id,
    },
    select: {
      id: true,
      name: true,
      description: true,
      type: true,
      teamId: true,
      status: true,
      createdAt: true,
    },
  });

  return NextResponse.json({ campaign }, { status: 201 });
}

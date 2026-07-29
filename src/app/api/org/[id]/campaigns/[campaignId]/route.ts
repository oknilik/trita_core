import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveOrgCapabilityDecision, resolveOrgPolicySnapshot } from "@/lib/policy-service";
import { canManageMeasurements } from "@/lib/measurement-auth";
import { normalizeCampaignSteps } from "@/lib/campaign-steps-core";

const patchSchema = z.union([
  z.object({
    status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]),
  }),
  // DRAFT-kampány szerkesztése: mérések, cél-csapat, ütem, név — aktiválás
  // előtt bármi módosítható; aktiválás után a kampány összetétele fix.
  z.object({
    action: z.literal("edit_draft"),
    types: z
      .array(z.enum(["OBSERVER_360", "TEAM_ROLE", "TEAM_ROLE_360", "TRUST_360", "PSYCH_SAFETY", "PEER_FEEDBACK"]))
      .min(1)
      .max(4)
      .optional(),
    teamId: z.string().min(1).nullable().optional(),
    stepIntervalHours: z.number().int().min(0).max(168).optional(),
    peerFeedbackAnonymous: z.boolean().optional(),
    name: z.string().min(1).max(100).optional(),
    description: z.string().max(500).nullable().optional(),
  }),
]);

const TEAM_LOCKED_STEPS = new Set(["TEAM_ROLE", "TEAM_ROLE_360", "TRUST_360", "PSYCH_SAFETY", "PEER_FEEDBACK"]);

const addParticipantsSchema = z.object({
  userIds: z.array(z.string().min(1)).min(1).max(50),
});

async function resolveContext(orgId: string, campaignId: string, userId: string) {
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return null;

  const [membership, campaign] = await Promise.all([
    prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId: profile.id } },
      select: { role: true },
    }),
    prisma.campaign.findUnique({
      where: { id: campaignId, orgId },
      select: { id: true, orgId: true, status: true, type: true, teamId: true, steps: true, activatedAt: true },
    }),
  ]);

  if (!membership || !campaign) return null;
  return {
    profileId: profile.id,
    email: profile.email,
    isConsultant: profile.isConsultant,
    role: membership.role,
    campaign,
  };
}

async function resolveManageCapabilityDecision(orgId: string, role: string) {
  const snapshot = await resolveOrgPolicySnapshot({
    orgId,
    orgRole: role,
  });
  return resolveOrgCapabilityDecision(snapshot, "manage");
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
  // Mérést csak tanácsadó kezel (ORG_CONSULTANT vagy platform-admin).
  if (!canManageMeasurements(ctx.role, ctx.email, ctx.isConsultant)) {
    return NextResponse.json({ error: "CONSULTANT_ONLY" }, { status: 403 });
  }
  const decision = await resolveManageCapabilityDecision(orgId, ctx.role);
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

  const body = patchSchema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  // ── DRAFT-szerkesztés ág ──────────────────────────────────────────────
  if ("action" in body.data) {
    if (ctx.campaign.status !== "DRAFT") {
      return NextResponse.json({ error: "CAMPAIGN_NOT_DRAFT" }, { status: 409 });
    }
    const edit = body.data;

    const steps = edit.types
      ? normalizeCampaignSteps(edit.types)
      : ctx.campaign.steps.length > 0
        ? ctx.campaign.steps
        : [ctx.campaign.type];
    if (steps.length === 0) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    // teamId: undefined = marad, null = célzás törlése, string = új csapat
    const nextTeamId =
      edit.teamId === undefined ? ctx.campaign.teamId : edit.teamId;
    if (steps.some((st) => TEAM_LOCKED_STEPS.has(st)) && !nextTeamId) {
      return NextResponse.json({ error: "TEAM_REQUIRED" }, { status: 400 });
    }
    if (nextTeamId && nextTeamId !== ctx.campaign.teamId) {
      const team = await prisma.team.findUnique({
        where: { id: nextTeamId },
        select: { orgId: true },
      });
      if (!team || team.orgId !== orgId) {
        return NextResponse.json({ error: "INVALID_TEAM" }, { status: 400 });
      }
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        steps,
        type: steps[0],
        teamId: nextTeamId,
        ...(edit.stepIntervalHours !== undefined
          ? { stepIntervalHours: edit.stepIntervalHours }
          : {}),
        ...(edit.peerFeedbackAnonymous !== undefined
          ? { peerFeedbackAnonymous: edit.peerFeedbackAnonymous }
          : {}),
        ...(edit.name ? { name: edit.name } : {}),
        ...(edit.description !== undefined ? { description: edit.description } : {}),
      },
      select: {
        id: true,
        name: true,
        status: true,
        type: true,
        steps: true,
        teamId: true,
        stepIntervalHours: true,
      },
    });
    return NextResponse.json({ campaign: updated });
  }

  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      status: body.data.status,
      ...(body.data.status === "CLOSED" ? { closedAt: new Date() } : {}),
      // A fresh-ellenőrzés referencia-pontja; az első aktiválás számít.
      ...(body.data.status === "ACTIVE" && !ctx.campaign.activatedAt
        ? { activatedAt: new Date() }
        : {}),
    },
    select: { id: true, name: true, status: true, closedAt: true },
  });

  // Szerep-kört tartalmazó kampány: az aktiválás/zárás a csapat kérdőív-körét vezérli.
  const campaignSteps =
    ctx.campaign.steps.length > 0 ? ctx.campaign.steps : [ctx.campaign.type];
  if (campaignSteps.includes("TEAM_ROLE") && ctx.campaign.teamId) {
    if (body.data.status === "ACTIVE") {
      await prisma.team.update({
        where: { id: ctx.campaign.teamId },
        data: { teamRoleRoundActive: true, teamRoleRoundStartedAt: new Date() },
      });
    }
    if (body.data.status === "CLOSED") {
      await prisma.team.update({
        where: { id: ctx.campaign.teamId },
        data: { teamRoleRoundActive: false },
      });
    }
  }

  // Több-lépéses kampány: résztvevők haladásának inicializálása +
  // lépés-nyitó értesítések (fire-and-forget).
  if (body.data.status === "ACTIVE") {
    import("@/lib/campaign-steps").then(({ initializeCampaignProgress }) =>
      initializeCampaignProgress(campaignId).catch(() => {}),
    );
  }

  // Notify org members about campaign status change via orchestrator (fire-and-forget)
  if (body.data.status === "ACTIVE") {
    import("@/lib/notifications").then(({ handleCampaignLaunched }) =>
      handleCampaignLaunched({
        orgId,
        campaignId,
        campaignName: campaign.name ?? "",
      }).catch((err) => console.error("[Notification] Campaign launched error:", err)),
    );
  }
  if (body.data.status === "CLOSED") {
    import("@/lib/notifications").then(({ handleCampaignClosed }) =>
      handleCampaignClosed({
        orgId,
        campaignId,
        campaignName: campaign.name ?? "",
      }).catch((err) => console.error("[Notification] Campaign closed error:", err)),
    );
  }

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
  // Mérést csak tanácsadó kezel (ORG_CONSULTANT vagy platform-admin).
  if (!canManageMeasurements(ctx.role, ctx.email, ctx.isConsultant)) {
    return NextResponse.json({ error: "CONSULTANT_ONLY" }, { status: 403 });
  }
  const decision = await resolveManageCapabilityDecision(orgId, ctx.role);
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

  // Aktív kampánynál az új résztvevők azonnal megkapják az első nyitott
  // lépésüket (fast-forward + értesítés).
  if (ctx.campaign.status === "ACTIVE") {
    import("@/lib/campaign-steps").then(({ initializeCampaignProgress }) =>
      initializeCampaignProgress(campaignId, body.data.userIds).catch(() => {}),
    );
  }

  return NextResponse.json({ ok: true });
}

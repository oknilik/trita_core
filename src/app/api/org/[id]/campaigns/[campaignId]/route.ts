import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveOrgCapabilityDecision, resolveOrgPolicySnapshot } from "@/lib/policy-service";
import { canManageMeasurements } from "@/lib/measurement-auth";
import {
  CAMPAIGN_STEP_ORDER,
  normalizeCampaignSteps,
} from "@/lib/campaign-steps-core";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";

const patchSchema = z.union([
  z.object({
    status: z.enum(["DRAFT", "ACTIVE", "CLOSED"]),
  }),
  // DRAFT-kampány szerkesztése: custom körnél mérések, minden körnél
  // cél-csapat, ütem és név. Nevesített preset lépéssora draftban is fix;
  // aktiválás után a teljes kampányösszetétel rögzül.
  z.object({
    action: z.literal("edit_draft"),
    // Nincs termékoldali darab-limit — minden katalógus-lépés mehet.
    types: z
      .array(z.enum(CAMPAIGN_STEP_ORDER))
      .min(1)
      .max(CAMPAIGN_STEP_ORDER.length)
      .optional(),
    teamId: z.string().min(1).nullable().optional(),
    // Több cél-csapat (2026-07-29): üres tömb = célzás törlése.
    teamIds: z.array(z.string().min(1)).max(50).optional(),
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
      select: { role: true, leftAt: true },
    }),
    prisma.campaign.findUnique({
      where: { id: campaignId, orgId },
      select: {
        id: true,
        orgId: true,
        status: true,
        presetId: true,
        type: true,
        teamId: true,
        teamIds: true,
        steps: true,
        activatedAt: true,
      },
    }),
  ]);

  if (!membership || membership.leftAt || !campaign) return null;
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
      presetId: true,
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
  const log = await getRequestLogger("campaign");
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

    // A nevesített preset mérési készlete szerződés, nem kiinduló sablon.
    // Célzás és pacing tovább szerkeszthető, a steps csak CUSTOM körnél.
    if (ctx.campaign.presetId && edit.types !== undefined) {
      return NextResponse.json(
        { error: "PRESET_STEPS_IMMUTABLE" },
        { status: 409 },
      );
    }

    const steps = edit.types
      ? normalizeCampaignSteps(edit.types)
      : ctx.campaign.steps.length > 0
        ? ctx.campaign.steps
        : [ctx.campaign.type];
    if (steps.length === 0) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }

    // Cél-csapatok: a teamIds az igazság (undefined = marad); a legacy
    // teamId paraméter egy-elemű listaként értelmeződik.
    const currentTeamIds =
      ctx.campaign.teamIds.length > 0
        ? ctx.campaign.teamIds
        : ctx.campaign.teamId
          ? [ctx.campaign.teamId]
          : [];
    const nextTeamIds =
      edit.teamIds !== undefined
        ? [...new Set(edit.teamIds)]
        : edit.teamId !== undefined
          ? edit.teamId
            ? [edit.teamId]
            : []
          : currentTeamIds;
    if (steps.some((st) => TEAM_LOCKED_STEPS.has(st)) && nextTeamIds.length === 0) {
      return NextResponse.json({ error: "TEAM_REQUIRED" }, { status: 400 });
    }
    const newIds = nextTeamIds.filter((id) => !currentTeamIds.includes(id));
    if (newIds.length > 0) {
      const teams = await prisma.team.findMany({
        where: { id: { in: newIds } },
        select: { id: true, orgId: true },
      });
      if (teams.length !== newIds.length || teams.some((team) => team.orgId !== orgId)) {
        return NextResponse.json({ error: "INVALID_TEAM" }, { status: 400 });
      }
    }

    const updated = await prisma.campaign.update({
      where: { id: campaignId },
      data: {
        steps,
        type: steps[0],
        teamId: nextTeamIds[0] ?? null,
        teamIds: nextTeamIds,
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
        presetId: true,
        type: true,
        steps: true,
        teamId: true,
        teamIds: true,
        stepIntervalHours: true,
      },
    });
    return NextResponse.json({ campaign: updated });
  }

  // Vázlat nem zárható le közvetlenül: az elvetés útja a DELETE — így a
  // „Lezárt körök" listába csak ténylegesen futott mérés kerülhet.
  if (body.data.status === "CLOSED" && ctx.campaign.status === "DRAFT") {
    return NextResponse.json({ error: "DRAFT_CANNOT_CLOSE" }, { status: 409 });
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

  // Szerep-kört tartalmazó kampány: az aktiválás/zárás a csapat(ok)
  // kérdőív-körét vezérli — több-csapatos kampánynál mindegyiken.
  const campaignSteps =
    ctx.campaign.steps.length > 0 ? ctx.campaign.steps : [ctx.campaign.type];
  const campaignTeamIds =
    ctx.campaign.teamIds.length > 0
      ? ctx.campaign.teamIds
      : ctx.campaign.teamId
        ? [ctx.campaign.teamId]
        : [];
  if (campaignSteps.includes("TEAM_ROLE") && campaignTeamIds.length > 0) {
    if (body.data.status === "ACTIVE") {
      await prisma.team.updateMany({
        where: { id: { in: campaignTeamIds } },
        data: { teamRoleRoundActive: true, teamRoleRoundStartedAt: new Date() },
      });
    }
    if (body.data.status === "CLOSED") {
      await prisma.team.updateMany({
        where: { id: { in: campaignTeamIds } },
        data: { teamRoleRoundActive: false },
      });
    }
  }

  // Analitika: a kampány élesítése az ügyfélsiker-tölcsér mérföldköve (A7).
  // Sem a szervezet, sem a kampány neve nem kerül eseménybe.
  if (body.data.status === "ACTIVE") {
    trackServerEvent("campaign.step_launch", { step_type: "campaign_activated" });
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
      }).catch((err) => log.error({ event: "campaign.campaign_launched_error", err: err }, "Campaign launched error")),
    );
  }
  if (body.data.status === "CLOSED") {
    import("@/lib/notifications").then(({ handleCampaignClosed }) =>
      handleCampaignClosed({
        orgId,
        campaignId,
        campaignName: campaign.name ?? "",
      }).catch((err) => log.error({ event: "campaign.campaign_closed_error", err: err }, "Campaign closed error")),
    );
  }

  return NextResponse.json({ campaign });
}

// DELETE /api/org/[id]/campaigns/[campaignId] — mérés törlése (bármely
// státuszban, tanácsadó/admin döntése). A kör-adatok (résztvevők,
// trust/szerep-megfigyelések, peer-visszajelzések, pulse-válaszok)
// cascade-del törlődnek; a userek SAJÁT eredményei (self teszt,
// szerep-kérdőív) megmaradnak (SetNull). Törölt kampány sehol — a lezárt
// listában sem — jelenik meg többé.
export async function DELETE(
  _req: Request,
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
  // A riportált mérési kör auditbizonyíték: nem törölhető úgy, hogy a
  // publikált snapshot forráskapcsolata megszűnjön. A riportot (ha vázlat)
  // előbb explicit törölni kell; publikált kör a pilot auditnyom része.
  const linkedReport = await prisma.teamReport.findFirst({
    where: { campaignId },
    select: { id: true },
  });
  if (linkedReport) {
    return NextResponse.json({ error: "CAMPAIGN_HAS_REPORT" }, { status: 409 });
  }
  // Futó szerep-körös kampány törlésekor a csapat(ok) kör-flagje ne
  // ragadjon be.
  const delSteps =
    ctx.campaign.steps.length > 0 ? ctx.campaign.steps : [ctx.campaign.type];
  const delTeamIds =
    ctx.campaign.teamIds.length > 0
      ? ctx.campaign.teamIds
      : ctx.campaign.teamId
        ? [ctx.campaign.teamId]
        : [];
  if (
    ctx.campaign.status === "ACTIVE" &&
    delSteps.includes("TEAM_ROLE") &&
    delTeamIds.length > 0
  ) {
    await prisma.team.updateMany({
      where: { id: { in: delTeamIds } },
      data: { teamRoleRoundActive: false },
    });
  }

  await prisma.campaign.delete({ where: { id: campaignId } });
  return NextResponse.json({ ok: true });
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
    where: { orgId, userId: { in: body.data.userIds }, leftAt: null },
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

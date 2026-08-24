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
import type { CampaignActivationResult } from "@/lib/campaign-steps";
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

async function notifyCampaignLaunch(params: {
  orgId: string;
  campaignId: string;
  campaignName: string;
}) {
  const { handleCampaignLaunched } = await import("@/lib/notifications");
  await handleCampaignLaunched(params);
}

/**
 * ACTIVE retry recovery: both notification families are rebuilt from the
 * committed campaign state. Their DB dedupe keys make repeated calls safe.
 */
async function reconcileActiveCampaignNotifications(params: {
  orgId: string;
  campaignId: string;
  campaignName: string;
}) {
  const { reconcileCampaignStepOpenings } = await import("@/lib/campaign-steps");
  await reconcileCampaignStepOpenings({ campaignId: params.campaignId });
  await notifyCampaignLaunch(params);
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
    if (
      ctx.campaign.presetId === "SCAN_V1" &&
      steps.includes("PSYCH_SAFETY") &&
      nextTeamIds.length !== 1
    ) {
      return NextResponse.json(
        { error: "PSYCH_SAFETY_SINGLE_TEAM_REQUIRED" },
        { status: 409 },
      );
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

    const draftUpdate = await (
      await import("@/lib/campaign-steps")
    ).updateDraftCampaignAtomically(campaignId, {
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
    });
    if (draftUpdate.outcome !== "updated") {
      return NextResponse.json(
        { error: "CAMPAIGN_NOT_DRAFT", campaign: draftUpdate.campaign },
        { status: 409 },
      );
    }
    return NextResponse.json({ campaign: draftUpdate.campaign });
  }

  if (!("status" in body.data)) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const nextStatus = body.data.status;

  // Vázlat nem zárható le közvetlenül: az elvetés útja a DELETE — így a
  // „Lezárt körök" listába csak ténylegesen futott mérés kerülhet.
  if (nextStatus === "CLOSED" && ctx.campaign.status === "DRAFT") {
    return NextResponse.json({ error: "DRAFT_CANNOT_CLOSE" }, { status: 409 });
  }

  if (nextStatus === ctx.campaign.status) {
    const campaign = await prisma.campaign.findUniqueOrThrow({
      where: { id: campaignId },
      select: {
        id: true,
        name: true,
        status: true,
        activatedAt: true,
        closedAt: true,
      },
    });
    if (campaign.status !== nextStatus) {
      return NextResponse.json(
        { error: "INVALID_CAMPAIGN_TRANSITION", campaign },
        { status: 409 },
      );
    }
    // Egy aktiválás DB-commitja és az értesítés írása nem lehet közös
    // tranzakció. Az azonos ACTIVE kérés ezért nem üres no-op: a DB-ből
    // újraépíti a nyitott lépések és a kampányindítás deduplikált
    // értesítéseit.
    if (nextStatus === "ACTIVE") {
      try {
        await reconcileActiveCampaignNotifications({
          orgId,
          campaignId,
          campaignName: campaign.name ?? "",
        });
      } catch (err) {
        log.error(
          { event: "campaign.notification_reconcile_error", campaignId, err },
          "Campaign notification reconciliation failed",
        );
        return NextResponse.json(
          { error: "CAMPAIGN_NOTIFICATION_PENDING", campaign },
          { status: 503 },
        );
      }
    }
    return NextResponse.json({ campaign });
  }
  const validTransition =
    (ctx.campaign.status === "DRAFT" && nextStatus === "ACTIVE") ||
    (ctx.campaign.status === "ACTIVE" && nextStatus === "CLOSED");
  if (!validTransition) {
    return NextResponse.json({ error: "INVALID_CAMPAIGN_TRANSITION" }, { status: 409 });
  }

  const campaignSteps =
    ctx.campaign.steps.length > 0 ? ctx.campaign.steps : [ctx.campaign.type];
  const campaignTeamIds =
    ctx.campaign.teamIds.length > 0
      ? ctx.campaign.teamIds
      : ctx.campaign.teamId
        ? [ctx.campaign.teamId]
        : [];

  let transition:
    | CampaignActivationResult
    | {
        outcome: "closed";
        campaign: {
          id: string;
          name: string;
          status: string;
          activatedAt: Date | null;
          closedAt: Date | null;
        };
        openings: [];
      };
  if (nextStatus === "ACTIVE") {
    const campaignStepModule = await import("@/lib/campaign-steps");
    try {
      transition = await campaignStepModule.activateCampaignAtomically(campaignId);
    } catch (error) {
      if (campaignStepModule.isCampaignActivationPreconditionError(error)) {
        return NextResponse.json({ error: error.code }, { status: 409 });
      }
      throw error;
    }
    if (transition.outcome === "conflict") {
      return NextResponse.json(
        { error: "INVALID_CAMPAIGN_TRANSITION", campaign: transition.campaign },
        { status: 409 },
      );
    }
  } else {
    transition = await prisma.$transaction(async (tx) => {
      const campaign = await tx.campaign.update({
        where: { id: campaignId },
        data: { status: "CLOSED", closedAt: new Date() },
        select: {
          id: true,
          name: true,
          status: true,
          activatedAt: true,
          closedAt: true,
        },
      });
      if (campaignSteps.includes("TEAM_ROLE") && campaignTeamIds.length > 0) {
        await tx.team.updateMany({
          where: { id: { in: campaignTeamIds } },
          data: { teamRoleRoundActive: false },
        });
      }
      return { outcome: "closed" as const, campaign, openings: [] as const };
    });
  }

  const { campaign, openings } = transition;
  let notificationPending = false;
  try {
    if (transition.outcome === "already_active") {
      // Párhuzamos aktiválás vesztes kérése: ugyanazt az állapotot adja
      // vissza, közben biztosítja, hogy a nyertes mindkét post-commit
      // értesítése akkor se vesszen el, ha annak folyamata hibázik.
      await reconcileActiveCampaignNotifications({
        orgId,
        campaignId,
        campaignName: campaign.name ?? "",
      });
    } else if (transition.outcome === "activated") {
      if (openings.length > 0) {
        await (await import("@/lib/campaign-steps")).notifyCampaignStepOpenings(openings);
      }
      // Nem fire-and-forget: hibánál 503 jelzi, hogy az ACTIVE állapot már
      // commitált, de az idempotens értesítési retry még szükséges.
      await notifyCampaignLaunch({
        orgId,
        campaignId,
        campaignName: campaign.name ?? "",
      });
    }
  } catch (err) {
    notificationPending = true;
    log.error(
      { event: "campaign.notification_error", campaignId, err },
      "Campaign notification failed",
    );
  }

  // Analitika: a kampány élesítése az ügyfélsiker-tölcsér mérföldköve (A7).
  // Sem a szervezet, sem a kampány neve nem kerül eseménybe.
  if (nextStatus === "ACTIVE" && transition.outcome === "activated") {
    trackServerEvent("campaign.step_launch", { step_type: "campaign_activated" });
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

  if (notificationPending) {
    return NextResponse.json(
      { error: "CAMPAIGN_NOTIFICATION_PENDING", campaign },
      { status: 503 },
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

  const campaignStepsModule = await import("@/lib/campaign-steps");
  const participantMutation = await prisma.$transaction(async (tx) => {
    const locked = await campaignStepsModule.lockCampaignForParticipantMutation(
      tx,
      campaignId,
      orgId,
    );
    if (!locked) return { ok: false as const, error: "NOT_FOUND" as const };

    // A campaign config es status csak a kozos sorzar utan autoritativ. Ha
    // az aktivalas nyert, az uj tag ugyanebben a tranzakcioban inicializalva
    // lesz; ha a POST nyert, az aktivalas mar a kibovitett listat validalja.
    const campaign = await tx.campaign.findUnique({
      where: { id: campaignId },
      select: { status: true, teamId: true, teamIds: true },
    });
    if (!campaign) return { ok: false as const, error: "NOT_FOUND" as const };
    if (campaign.status === "CLOSED") {
      return { ok: false as const, error: "CAMPAIGN_CLOSED" as const };
    }

    const currentMemberships = await tx.organizationMember.findMany({
      where: { orgId, userId: { in: body.data.userIds }, leftAt: null },
      select: { userId: true },
    });
    const currentOrgMemberIds = new Set(
      currentMemberships.map((membership) => membership.userId),
    );
    if (body.data.userIds.some((id) => !currentOrgMemberIds.has(id))) {
      return { ok: false as const, error: "INVALID_INPUT" as const };
    }

    const targetTeamIds =
      campaign.teamIds.length > 0
        ? campaign.teamIds
        : campaign.teamId
          ? [campaign.teamId]
          : [];
    if (targetTeamIds.length > 0) {
      const targetMembers = await tx.teamMember.findMany({
        where: {
          teamId: { in: targetTeamIds },
          userId: { in: body.data.userIds },
        },
        select: { userId: true },
        distinct: ["userId"],
      });
      const targetMemberIds = new Set(
        targetMembers.map((member) => member.userId),
      );
      if (body.data.userIds.some((id) => !targetMemberIds.has(id))) {
        return {
          ok: false as const,
          error: "PARTICIPANT_OUTSIDE_TARGET_TEAMS" as const,
        };
      }
    }

    await tx.campaignParticipant.createMany({
      data: body.data.userIds.map((uid) => ({ campaignId, userId: uid })),
      skipDuplicates: true,
    });
    const openings =
      campaign.status === "ACTIVE"
        ? await campaignStepsModule.initializeCampaignProgress(
            campaignId,
            body.data.userIds,
            { db: tx, emitNotifications: false },
          )
        : [];
    return { ok: true as const, openings };
  });
  if (!participantMutation.ok) {
    const status =
      participantMutation.error === "NOT_FOUND"
        ? 404
        : participantMutation.error === "INVALID_INPUT"
          ? 400
          : 409;
    return NextResponse.json(
      { error: participantMutation.error },
      { status },
    );
  }
  if (participantMutation.openings.length > 0) {
    await (await import("@/lib/campaign-steps")).notifyCampaignStepOpenings(
      participantMutation.openings,
    );
  }

  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canViewRawTeamResults } from "@/lib/team-auth";
import { isConsultantSurface } from "@/lib/measurement-auth";
import { getRequestLogger } from "@/lib/logger.server";
import {
  buildDraftNarrativePrefill,
  buildTeamReportAggregates,
  parseActionItems,
  serializeTeamReport,
  type TeamReportActionItem,
  validateTeamReportForPublish,
} from "@/lib/team-report";
import { teamActionTargetSchema } from "@/lib/team-action-target-schema";
import crypto from "node:crypto";
import type { Prisma } from "@prisma/client";

// Csapatriport (TeamReport) írási API — kizárólag tanácsadónak.
// Terv: docs/product/team-report-gating-plan.md

const narrativeFields = {
  title: z.string().max(200).nullish(),
  summary: z.string().max(8000).nullish(),
  strengths: z.string().max(8000).nullish(),
  risks: z.string().max(8000).nullish(),
  recommendations: z.string().max(8000).nullish(),
  interviewFindings: z.string().max(8000).nullish(),
  leadershipGuide: z.string().max(8000).nullish(),
  actionItems: z
    .array(
      z.object({
        id: z.string().min(1).max(191).optional(),
        title: z.string().max(200),
        description: z.string().max(2000),
        timeframe: z.enum(["30", "60", "90"]),
        owner: z.string().max(120).optional(),
        dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u).optional(),
        status: z.enum(["not_started", "in_progress", "blocked", "done"]).optional(),
        targetMetric: teamActionTargetSchema.optional(),
        evidenceUrl: z.string().url().max(2000).optional(),
        note: z.string().max(2000).optional(),
      }),
    )
    .max(20)
    .nullish(),
  internalNotes: z.string().max(8000).nullish(),
};

// Angol fordítás-csomag (gépi fordítás + tanácsadói jóváhagyás) — a
// TeamReport.translationsEn JSON-oszlopba kerül; szerkezet: team-report-i18n.ts.
const translationsEnSchema = z
  .object({
    en: z.object({
      status: z.enum(["draft", "approved"]),
      translatedAt: z.string().max(64),
      approvedAt: z.string().max(64).nullish(),
      summary: z.string().max(8000).nullish(),
      strengths: z.string().max(8000).nullish(),
      risks: z.string().max(8000).nullish(),
      recommendations: z.string().max(8000).nullish(),
      interviewFindings: z.string().max(8000).nullish(),
      leadershipGuide: z.string().max(8000).nullish(),
      actionItems: z
        .array(
          z.object({
            title: z.string().max(200),
            description: z.string().max(2000),
            timeframe: z.enum(["30", "60", "90"]),
            owner: z.string().max(120).optional(),
            dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u).optional(),
            status: z.enum(["not_started", "in_progress", "blocked", "done"]).optional(),
          }),
        )
        .max(20)
        .nullish(),
    }),
  })
  .nullish();

const patchSchema = z.object({
  reportId: z.string().min(1),
  action: z.enum(["save", "preview", "publish", "unpublish"]).default("save"),
  translationsEn: translationsEnSchema,
  ...narrativeFields,
});

const createSchema = z.object({ campaignId: z.string().min(1) });

type ActionItem = TeamReportActionItem;

function normalizeActionIds(incoming: ActionItem[], previous: ActionItem[]): ActionItem[] {
  return incoming.map((item, index) => ({
    ...item,
    id: item.id ?? previous[index]?.id ?? `action:${crypto.randomUUID()}`,
  }));
}

function buildActionEvents(previous: ActionItem[], next: ActionItem[]) {
  const before = new Map(previous.filter((item) => item.id).map((item) => [item.id!, item]));
  const after = new Map(next.filter((item) => item.id).map((item) => [item.id!, item]));
  const events: Array<{
    actionKey: string;
    eventType: string;
    payload: Prisma.InputJsonValue;
    evidenceUrl?: string;
    note?: string;
  }> = [];
  for (const [actionKey, item] of after) {
    const old = before.get(actionKey);
    if (!old || JSON.stringify(old) !== JSON.stringify(item)) {
      events.push({
        actionKey,
        eventType: old ? "UPDATED" : "CREATED",
        payload: item as unknown as Prisma.InputJsonValue,
        ...(item.evidenceUrl ? { evidenceUrl: item.evidenceUrl } : {}),
        ...(item.note ? { note: item.note } : {}),
      });
    }
  }
  for (const [actionKey, item] of before) {
    if (!after.has(actionKey)) {
      events.push({
        actionKey,
        eventType: "REMOVED",
        payload: item as unknown as Prisma.InputJsonValue,
      });
    }
  }
  return events;
}

async function updateReportWithHistory(input: {
  reportId: string;
  actorUserId: string;
  data: Prisma.TeamReportUpdateInput;
  previous: ActionItem[];
  next: ActionItem[];
}) {
  const events = buildActionEvents(input.previous, input.next);
  return prisma.$transaction(async (tx) => {
    const report = await tx.teamReport.update({
      where: { id: input.reportId },
      data: input.data,
    });
    if (events.length > 0) {
      await tx.teamActionEvent.createMany({
        data: events.map((event) => ({
          reportId: input.reportId,
          actorUserId: input.actorUserId,
          ...event,
        })),
      });
    }
    return report;
  });
}

async function validateReportCampaign(teamId: string, orgId: string, campaignId: string) {
  const campaign = await prisma.campaign.findFirst({
    where: { id: campaignId, orgId },
    select: { id: true, status: true, presetId: true, teamId: true, teamIds: true },
  });
  if (!campaign) return "REPORT_CAMPAIGN_NOT_FOUND" as const;
  if (campaign.status !== "CLOSED") return "REPORT_CAMPAIGN_NOT_CLOSED" as const;
  if (campaign.presetId !== "SCAN_V1") return "REPORT_CAMPAIGN_NOT_SCAN_V1" as const;
  if (campaign.teamId !== teamId && !campaign.teamIds.includes(teamId)) {
    return "REPORT_CAMPAIGN_TEAM_MISMATCH" as const;
  }
  return null;
}

async function requireConsultant(teamId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "UNAUTHORIZED" as const, status: 401 };

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return { error: "UNAUTHORIZED" as const, status: 401 };

  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { id: true, orgId: true },
  });
  if (!team) return { error: "NOT_FOUND" as const, status: 404 };
  if (!team.orgId) return { error: "FORBIDDEN" as const, status: 403 };

  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true, leftAt: true },
  });
  if (
    !membership ||
    membership.leftAt ||
    !(
      canViewRawTeamResults(membership.role) ||
      isConsultantSurface(membership.role, profile.email, profile.isConsultant)
    )
  ) {
    return { error: "FORBIDDEN" as const, status: 403 };
  }

  return { profileId: profile.id, orgId: team.orgId };
}

// GET /api/team/[id]/report?reportId=... — append-only akciótörténet.
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const ctx = await requireConsultant(teamId);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }
  const reportId = new URL(req.url).searchParams.get("reportId");
  if (!reportId) return NextResponse.json({ error: "REPORT_ID_REQUIRED" }, { status: 400 });
  const report = await prisma.teamReport.findFirst({
    where: { id: reportId, teamId },
    select: { id: true },
  });
  if (!report) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  const events = await prisma.teamActionEvent.findMany({
    where: { reportId },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ events });
}

// POST /api/team/[id]/report — új riport-vázlat (aggregátum-előnézettel)
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const ctx = await requireConsultant(teamId);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const parsed = createSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "REPORT_CAMPAIGN_REQUIRED" }, { status: 400 });
  }
  const { campaignId } = parsed.data;
  const campaignError = await validateReportCampaign(teamId, ctx.orgId, campaignId);
  if (campaignError) {
    return NextResponse.json({ error: campaignError }, { status: 409 });
  }

  // Kampányonként és csapatonként egyetlen riport lehet. Másik nyitott
  // vázlatot nem veszünk át csendben, mert az másik mérési körből származhat.
  const existingReport = await prisma.teamReport.findFirst({
    where: { teamId, campaignId },
    orderBy: { createdAt: "desc" },
  });
  if (existingReport) {
    return NextResponse.json({
      ok: true,
      report: serializeTeamReport(existingReport, { includeInternalNotes: true }),
    });
  }
  const otherDraft = await prisma.teamReport.findFirst({
    where: { teamId, status: "DRAFT" },
    select: { id: true },
  });
  if (otherDraft) {
    return NextResponse.json({ error: "DRAFT_EXISTS" }, { status: 409 });
  }

  const aggregates = await buildTeamReportAggregates(teamId, {
    assessmentCampaignId: campaignId,
  });
  if (!aggregates) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // A narratív mezőket generált javaslattal töltjük elő — a tanácsadó
  // szerkeszthető kiindulópontot kap, nem üres űrlapot.
  const prefill = buildDraftNarrativePrefill(aggregates);
  const initialActions = normalizeActionIds(prefill?.actionItems ?? [], []);

  const report = await prisma.teamReport.upsert({
    where: { campaignId_teamId: { campaignId, teamId } },
    update: {},
    create: {
      teamId,
      campaignId,
      orgId: ctx.orgId,
      status: "DRAFT",
      aggregates: aggregates as object,
      createdById: ctx.profileId,
      ...(prefill
        ? {
            ...prefill,
            // Prisma Json input: a típusos tömböt plain JSON-ként adjuk át.
            actionItems: initialActions as unknown as object[],
          }
        : {}),
    },
  });
  if (initialActions.length > 0) {
    const existingEvents = await prisma.teamActionEvent.count({ where: { reportId: report.id } });
    if (existingEvents === 0) {
      await prisma.teamActionEvent.createMany({
        data: initialActions.map((item) => ({
          reportId: report.id,
          actionKey: item.id!,
          eventType: "CREATED",
          actorUserId: ctx.profileId,
          payload: item as unknown as Prisma.InputJsonValue,
        })),
      });
    }
  }

  return NextResponse.json({
    ok: true,
    report: serializeTeamReport(report, { includeInternalNotes: true }),
  });
}

// DELETE /api/team/[id]/report — vázlat (pl. visszavont riport) végleges törlése
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const ctx = await requireConsultant(teamId);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const parsed = z
    .object({ reportId: z.string().min(1) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const existing = await prisma.teamReport.findFirst({
    where: { id: parsed.data.reportId, teamId },
    select: { id: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (existing.status === "PUBLISHED") {
    // Korábbi (nem aktuális) publikált riport törölhető; az aktuális,
    // szervezet felé látható riportot előbb vissza kell vonni.
    const latestPublished = await prisma.teamReport.findFirst({
      where: { teamId, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { id: true },
    });
    if (latestPublished?.id === existing.id) {
      return NextResponse.json({ error: "ALREADY_PUBLISHED" }, { status: 409 });
    }
  }

  await prisma.teamReport.delete({ where: { id: existing.id } });
  return NextResponse.json({ ok: true });
}

// PATCH /api/team/[id]/report — narratíva mentése / publikálás
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const log = await getRequestLogger("team-report");
  const { id: teamId } = await params;
  const ctx = await requireConsultant(teamId);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const { reportId, action, translationsEn, ...fields } = parsed.data;

  const existing = await prisma.teamReport.findFirst({
    where: { id: reportId, teamId },
    select: {
      id: true,
      status: true,
      campaignId: true,
      title: true,
      summary: true,
      recommendations: true,
      actionItems: true,
    },
  });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const previousActions = parseActionItems(existing.actionItems) ?? [];
  const nextActions = fields.actionItems
    ? normalizeActionIds(fields.actionItems, previousActions)
    : previousActions;
  if (fields.actionItems) fields.actionItems = nextActions;

  // Publikálás visszavonása: a riport vázlatként újra szerkeszthető, a
  // szervezet felé eltűnik. Csak a legutolsó publikált riport vonható
  // vissza, és csak ha nincs éppen nyitott vázlat (különben kettő lenne).
  if (action === "unpublish") {
    if (existing.status !== "PUBLISHED") {
      return NextResponse.json({ error: "NOT_PUBLISHED" }, { status: 409 });
    }
    const openDraft = await prisma.teamReport.findFirst({
      where: { teamId, status: "DRAFT" },
      select: { id: true },
    });
    if (openDraft) {
      return NextResponse.json({ error: "DRAFT_EXISTS" }, { status: 409 });
    }
    const latestPublished = await prisma.teamReport.findFirst({
      where: { teamId, status: "PUBLISHED" },
      orderBy: { publishedAt: "desc" },
      select: { id: true },
    });
    if (latestPublished?.id !== reportId) {
      return NextResponse.json({ error: "NOT_LATEST" }, { status: 409 });
    }
    const report = await prisma.teamReport.update({
      where: { id: reportId },
      data: { status: "DRAFT", publishedAt: null, publishedById: null },
    });
    return NextResponse.json({
      ok: true,
      report: serializeTeamReport(report, { includeInternalNotes: true }),
    });
  }

  if (existing.status === "PUBLISHED") {
    // A publikált (validált) riport közvetlenül nem szerkeszthető —
    // előbb vissza kell vonni (unpublish), vagy új riportot nyitni.
    return NextResponse.json({ error: "ALREADY_PUBLISHED" }, { status: 409 });
  }

  // null-t is kiszűrjük: a kliens üres stringet/üres tömböt küld törléskor,
  // és a nullable Json mező (actionItems) plain null-t nem fogad.
  const narrativeData: Record<string, unknown> = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined && value !== null),
  );
  // Fordítás-csomag mentése (a régi Prisma-kliens típusa még nem ismeri a
  // translationsEn oszlopot — a migráció + generate után szükségtelen a cast).
  if (translationsEn !== undefined && translationsEn !== null) {
    narrativeData.translationsEn = translationsEn as object;
  }

  if (action === "publish") {
    if (!existing.campaignId) {
      return NextResponse.json({ error: "REPORT_CAMPAIGN_REQUIRED" }, { status: 409 });
    }
    const campaignError = await validateReportCampaign(teamId, ctx.orgId, existing.campaignId);
    if (campaignError) {
      return NextResponse.json({ error: campaignError }, { status: 409 });
    }
    // Publikáláskor frissítjük ÉS befagyasztjuk az aggregátumokat.
    const aggregates = await buildTeamReportAggregates(teamId, {
      assessmentCampaignId: existing.campaignId,
    });
    const publishError = validateTeamReportForPublish({
      campaignId: existing.campaignId,
      aggregates,
      title: fields.title ?? existing.title,
      summary: fields.summary ?? existing.summary,
      recommendations: fields.recommendations ?? existing.recommendations,
      actionItems: fields.actionItems ?? existing.actionItems,
    });
    if (publishError) {
      return NextResponse.json({ error: publishError }, { status: 409 });
    }
    const report = await updateReportWithHistory({
      reportId,
      actorUserId: ctx.profileId,
      previous: previousActions,
      next: nextActions,
      data: {
        ...narrativeData,
        aggregates: aggregates as object,
        status: "PUBLISHED",
        publishedAt: new Date(),
        publishedById: ctx.profileId,
      },
    });

    const team = await prisma.team.findUnique({
      where: { id: teamId },
      select: { name: true },
    });
    import("@/lib/notifications").then(({ handleTeamReportPublished }) =>
      handleTeamReportPublished({
        teamId,
        teamName: team?.name ?? "—",
        reportId: report.id,
        orgId: ctx.orgId,
      }).catch((err: unknown) => log.error({ event: "team-report.team_report_published_error", err: err }, "Team report published error")),
    );

    return NextResponse.json({
      ok: true,
      report: serializeTeamReport(report, { includeInternalNotes: true }),
    });
  }

  // "preview" mentéskor az aggregátumokat is újraépítjük, hogy az előnézet
  // pontosan azt mutassa, amit a publikálás rögzítene.
  const aggregates =
    action === "preview" && existing.campaignId
      ? await buildTeamReportAggregates(teamId, {
          assessmentCampaignId: existing.campaignId,
        })
      : null;

  const report = await updateReportWithHistory({
    reportId,
    actorUserId: ctx.profileId,
    previous: previousActions,
    next: nextActions,
    data: {
      ...narrativeData,
      ...(aggregates ? { aggregates: aggregates as object } : {}),
    },
  });
  return NextResponse.json({
    ok: true,
    report: serializeTeamReport(report, { includeInternalNotes: true }),
  });
}

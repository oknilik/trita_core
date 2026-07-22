import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canViewRawTeamResults } from "@/lib/team-auth";
import {
  buildDraftNarrativePrefill,
  buildTeamReportAggregates,
  serializeTeamReport,
} from "@/lib/team-report";

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
        title: z.string().max(200),
        description: z.string().max(2000),
        timeframe: z.enum(["30", "60", "90"]),
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

async function requireConsultant(teamId: string) {
  const { userId } = await auth();
  if (!userId) return { error: "UNAUTHORIZED" as const, status: 401 };

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
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
    select: { role: true },
  });
  if (!membership || !canViewRawTeamResults(membership.role)) {
    return { error: "FORBIDDEN" as const, status: 403 };
  }

  return { profileId: profile.id, orgId: team.orgId };
}

// POST /api/team/[id]/report — új riport-vázlat (aggregátum-előnézettel)
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: teamId } = await params;
  const ctx = await requireConsultant(teamId);
  if ("error" in ctx) {
    return NextResponse.json({ error: ctx.error }, { status: ctx.status });
  }

  // Idempotens: ha már van vázlat, azt adjuk vissza — nem nyitunk másodikat.
  const existingDraft = await prisma.teamReport.findFirst({
    where: { teamId, status: "DRAFT" },
    orderBy: { createdAt: "desc" },
  });
  if (existingDraft) {
    return NextResponse.json({
      ok: true,
      report: serializeTeamReport(existingDraft, { includeInternalNotes: true }),
    });
  }

  const aggregates = await buildTeamReportAggregates(teamId);
  if (!aggregates) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  // A narratív mezőket generált javaslattal töltjük elő — a tanácsadó
  // szerkeszthető kiindulópontot kap, nem üres űrlapot.
  const prefill = buildDraftNarrativePrefill(aggregates);

  const report = await prisma.teamReport.create({
    data: {
      teamId,
      orgId: ctx.orgId,
      status: "DRAFT",
      aggregates: aggregates as object,
      createdById: ctx.profileId,
      ...(prefill
        ? {
            ...prefill,
            // Prisma Json input: a típusos tömböt plain JSON-ként adjuk át.
            actionItems: prefill.actionItems as unknown as object[],
          }
        : {}),
    },
  });

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
    select: { id: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

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
    // Publikáláskor frissítjük ÉS befagyasztjuk az aggregátumokat.
    const aggregates = await buildTeamReportAggregates(teamId);
    const report = await prisma.teamReport.update({
      where: { id: reportId },
      data: {
        ...narrativeData,
        aggregates: (aggregates ?? undefined) as object | undefined,
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
      }).catch((err: unknown) => console.error("[Notification] Team report published error:", err)),
    );

    return NextResponse.json({
      ok: true,
      report: serializeTeamReport(report, { includeInternalNotes: true }),
    });
  }

  // "preview" mentéskor az aggregátumokat is újraépítjük, hogy az előnézet
  // pontosan azt mutassa, amit a publikálás rögzítene.
  const aggregates =
    action === "preview" ? await buildTeamReportAggregates(teamId) : null;

  const report = await prisma.teamReport.update({
    where: { id: reportId },
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

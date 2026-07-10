import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canViewRawTeamResults } from "@/lib/team-auth";
import {
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
  internalNotes: z.string().max(8000).nullish(),
};

const patchSchema = z.object({
  reportId: z.string().min(1),
  action: z.enum(["save", "publish"]).default("save"),
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

  const aggregates = await buildTeamReportAggregates(teamId);
  if (!aggregates) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const report = await prisma.teamReport.create({
    data: {
      teamId,
      orgId: ctx.orgId,
      status: "DRAFT",
      aggregates: aggregates as object,
      createdById: ctx.profileId,
    },
  });

  return NextResponse.json({
    ok: true,
    report: serializeTeamReport(report, { includeInternalNotes: true }),
  });
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
  const { reportId, action, ...fields } = parsed.data;

  const existing = await prisma.teamReport.findFirst({
    where: { id: reportId, teamId },
    select: { id: true, status: true },
  });
  if (!existing) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  if (existing.status === "PUBLISHED") {
    // A publikált (validált) riport nem szerkeszthető — új riportot kell nyitni.
    return NextResponse.json({ error: "ALREADY_PUBLISHED" }, { status: 409 });
  }

  const narrativeData = Object.fromEntries(
    Object.entries(fields).filter(([, value]) => value !== undefined),
  );

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
      }).catch((err: unknown) => console.error("[Notification] Team report published error:", err)),
    );

    return NextResponse.json({
      ok: true,
      report: serializeTeamReport(report, { includeInternalNotes: true }),
    });
  }

  const report = await prisma.teamReport.update({
    where: { id: reportId },
    data: narrativeData,
  });
  return NextResponse.json({
    ok: true,
    report: serializeTeamReport(report, { includeInternalNotes: true }),
  });
}

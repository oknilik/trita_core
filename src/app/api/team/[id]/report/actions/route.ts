import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canViewRawTeamResults } from "@/lib/team-auth";
import { hasOrgRole } from "@/lib/org-roles";
import { parseActionItems, serializeTeamReport } from "@/lib/team-report";
import { teamActionTargetSchema } from "@/lib/team-action-target-schema";

const actionItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  timeframe: z.enum(["30", "60", "90"]),
  owner: z.string().max(120).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u).optional(),
  status: z.enum(["not_started", "in_progress", "blocked", "done"]),
  targetMetric: teamActionTargetSchema.optional(),
});

const requestSchema = z.object({
  reportId: z.string().min(1),
  actionItems: z.array(actionItemSchema).max(20),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const [{ userId }, { id: teamId }, parsed] = await Promise.all([
    auth(),
    params,
    request.json().then((body) => requestSchema.safeParse(body)).catch(() => null),
  ]);
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  if (!parsed?.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  const team = await prisma.team.findUnique({
    where: { id: teamId },
    select: { orgId: true },
  });
  if (!profile || !team?.orgId) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId: team.orgId, userId: profile.id } },
    select: { role: true, leftAt: true },
  });
  if (
    !membership ||
    membership.leftAt ||
    (!hasOrgRole(membership.role, "ORG_MANAGER") &&
      !canViewRawTeamResults(membership.role))
  ) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const latestPublished = await prisma.teamReport.findFirst({
    where: { teamId, status: "PUBLISHED" },
    orderBy: { publishedAt: "desc" },
    select: { id: true, campaign: { select: { programKey: true } } },
  });
  if (latestPublished?.id !== parsed.data.reportId) {
    return NextResponse.json({ error: "NOT_LATEST" }, { status: 409 });
  }

  if (latestPublished.campaign?.programKey) {
    // Tracking may update execution fields, never the approved diagnostic plan.
    const result = await prisma.$transaction(async (tx) => {
      await tx.$queryRaw`SELECT "id" FROM "TeamReport" WHERE "id" = ${parsed.data.reportId} FOR UPDATE`;
      const current = await tx.teamReport.findUnique({ where: { id: parsed.data.reportId } });
      if (!current || current.status !== "PUBLISHED") return null;
      const approved = parseActionItems(current.actionItems) ?? [];
      const submitted = parsed.data.actionItems;
      if (approved.length !== submitted.length || approved.some((item, index) => {
        const next = submitted[index];
        return item.title !== next.title || item.description !== next.description ||
          item.timeframe !== next.timeframe || JSON.stringify(item.targetMetric) !== JSON.stringify(next.targetMetric);
      })) return null;
      const actionItems = approved.map((item, index) => ({
        ...item, owner: submitted[index].owner, dueDate: submitted[index].dueDate, status: submitted[index].status,
      }));
      const updated = await tx.teamReport.update({ where: { id: current.id }, data: { actionItems: actionItems as unknown as object[] } });
      await tx.teamActionEvent.create({ data: {
        reportId: current.id, actionKey: "report:tracking", eventType: "TRACKING_UPDATED", actorUserId: profile.id,
        payload: { revision: current.revision },
      } });
      return updated;
    });
    if (!result) return NextResponse.json({ error: "PROGRAM_REVIEW_REQUIRED" }, { status: 409 });
    return NextResponse.json({ ok: true, report: serializeTeamReport(result, { includeInternalNotes: false }) });
  }

  const report = await prisma.teamReport.update({
    where: { id: parsed.data.reportId },
    data: { actionItems: parsed.data.actionItems as unknown as object[] },
  });
  return NextResponse.json({
    ok: true,
    report: serializeTeamReport(report, { includeInternalNotes: false }),
  });
}

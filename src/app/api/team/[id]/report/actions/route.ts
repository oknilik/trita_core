import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { canViewRawTeamResults } from "@/lib/team-auth";
import { hasOrgRole } from "@/lib/org-roles";
import { serializeTeamReport } from "@/lib/team-report";

const actionItemSchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().max(2000),
  timeframe: z.enum(["30", "60", "90"]),
  owner: z.string().max(120).optional(),
  dueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/u).optional(),
  status: z.enum(["not_started", "in_progress", "blocked", "done"]),
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
    select: { id: true },
  });
  if (latestPublished?.id !== parsed.data.reportId) {
    return NextResponse.json({ error: "NOT_LATEST" }, { status: 409 });
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

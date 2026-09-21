import { getServerAuth } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCandidateConsultant } from "@/lib/candidate-programs/service.server";
import {
  candidateReportMutation,
  mutateCandidateReport,
} from "@/lib/candidate-programs/report.server";
import { candidateError } from "@/lib/candidate-programs/http";
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const { userId } = await getServerAuth();
  const input = candidateReportMutation.safeParse(
    await req.json().catch(() => null),
  );
  if (!input.success)
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  const invite = await prisma.candidateInvite.findUnique({
    where: { id },
    select: { orgId: true },
  });
  if (!invite?.orgId)
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  try {
    const actor = await requireCandidateConsultant(userId, invite.orgId);
    return NextResponse.json(
      await mutateCandidateReport(invite.orgId, id, actor, input.data),
    );
  } catch (e) {
    return candidateError(e);
  }
}

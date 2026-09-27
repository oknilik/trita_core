import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";
import { syncOpportunity, sendOpportunity } from "@/lib/lifecycle/service";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  let actorId: string;
  try { actorId = (await requireAdmin()).userId; }
  catch { return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 }); }
  const limited = await checkRateLimit("contact", actorId);
  if (limited) return limited;
  const { id } = await params;
  const draft = await prisma.assessmentDraft.findUnique({ where: { id } });
  if (!draft || draft.scope !== "self") return NextResponse.json({ error: "INELIGIBLE" }, { status: 409 });
  const opportunityId = await syncOpportunity(draft.userProfileId);
  const opportunity = opportunityId ? await prisma.lifecycleOpportunity.findUnique({ where: { id: opportunityId } }) : null;
  if (!opportunity || opportunity.rule !== "RESUME_SELF" || opportunity.goalKey !== id) return NextResponse.json({ error: "ASSESSMENT_ALREADY_COMPLETED" }, { status: 409 });
  const result = await sendOpportunity(opportunity.id, "manual", actorId);
  return result.ok
    ? NextResponse.json({ ok: true, sentAt: result.sentAt.toISOString() })
    : NextResponse.json({ error: result.reason }, { status: 409 });
}

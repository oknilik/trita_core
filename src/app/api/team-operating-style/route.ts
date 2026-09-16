import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { OperatingSubmissionSchema, OperatingError } from "@/lib/team-operating-style/submission";
import { saveOperatingResponse } from "@/lib/team-operating-style/service.server";
import { notifyCampaignStepOpenings } from "@/lib/campaign-steps";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const profile = await prisma.userProfile.findUnique({ where: { clerkId: userId }, select: { id: true, deleted: true } });
  if (!profile || profile.deleted) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = OperatingSubmissionSchema.safeParse(await req.json().catch(() => null));
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  try {
    const result = await saveOperatingResponse(profile.id, body.data);
    // Submission/advancement are already committed; notification reconciliation can retry later.
    await notifyCampaignStepOpenings(result.openings).catch(() => {});
    return NextResponse.json({ ok: true, replayed: result.replayed });
  } catch (error) {
    if (error instanceof OperatingError) return NextResponse.json({ error: error.code }, { status: error.status });
    throw error;
  }
}

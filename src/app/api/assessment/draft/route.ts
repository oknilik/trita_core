import { getServerAuth } from "@/lib/auth-server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resolveActiveSelfAssessmentCampaign } from "@/lib/campaign-steps";

const draftSchema = z.object({
  answers: z.record(z.string(), z.number().int().min(1).max(5)),
  currentPage: z.number().int().min(0),
  campaignId: z.string().min(1).max(191).optional(),
});

function draftScope(campaignId?: string): string {
  return campaignId ? `campaign:${campaignId}` : "self";
}

export async function POST(req: Request) {
  const { userId } = await getServerAuth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, testType: true },
  });
  if (!profile?.testType) {
    return NextResponse.json({ error: "No test type assigned" }, { status: 400 });
  }

  const body = await req.json();
  const parsed = draftSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  if (parsed.data.campaignId) {
    const active = await resolveActiveSelfAssessmentCampaign(profile.id, {
      campaignId: parsed.data.campaignId,
    });
    if (active?.campaignId !== parsed.data.campaignId) {
      return NextResponse.json({ error: "CAMPAIGN_STEP_NOT_OPEN" }, { status: 409 });
    }
  }

  const scope = draftScope(parsed.data.campaignId);

  await prisma.assessmentDraft.upsert({
    where: { userProfileId_scope: { userProfileId: profile.id, scope } },
    create: {
      userProfileId: profile.id,
      scope,
      testType: profile.testType,
      answers: parsed.data.answers,
      currentPage: parsed.data.currentPage,
    },
    update: {
      answers: parsed.data.answers,
      currentPage: parsed.data.currentPage,
    },
  });

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  const { userId } = await getServerAuth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!profile) {
    return NextResponse.json({ ok: true });
  }

  const campaignId = new URL(req.url).searchParams.get("campaignId") ?? undefined;
  await prisma.assessmentDraft.deleteMany({
    where: { userProfileId: profile.id, scope: draftScope(campaignId) },
  });

  return NextResponse.json({ ok: true });
}

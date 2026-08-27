import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { canManageMeasurements } from "@/lib/measurement-auth";
import { countCampaignStepsDone, getCampaignSteps } from "@/lib/campaign-steps-core";
import { sendMeasurementStepEmail } from "@/lib/emails";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import { normalizeLocale } from "@/lib/i18n/core";

// POST /api/org/[id]/campaigns/[campaignId]/remind
// Emlékeztető email a kampány saját lépéseiből semmit sem teljesítő
// résztvevőknek (lépés-tudatos „nem kezdte" számítás). A CTA a /tasks
// feladatlistára visz — az mutatja a user épp nyitott lépését.
// Returns { ok: true, remindedCount: number } — a ténylegesen elküldött
// emailek száma (a UI „{count} személynek küldtünk emlékeztetőt" szövege
// ettől igaz).
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string; campaignId: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id: orgId, campaignId } = await params;

  // Resolve profile
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  // Check org membership + role
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true, leftAt: true },
  });
  if (!membership || membership.leftAt) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  if (!hasOrgRole(membership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }
  // Mérést csak tanácsadó kezel (ORG_CONSULTANT vagy platform-admin).
  if (!canManageMeasurements(membership.role, profile.email, profile.isConsultant)) {
    return NextResponse.json({ error: "CONSULTANT_ONLY" }, { status: 403 });
  }

  // Email-küldő végpont — rate limit a spam-kattintás ellen.
  const rateLimited = await checkRateLimit("contact", `remind:${campaignId}`);
  if (rateLimited) return rateLimited;

  // Check campaign exists and is ACTIVE
  const campaign = await prisma.campaign.findUnique({
    where: { id: campaignId, orgId },
    select: {
      id: true,
      name: true,
      status: true,
      type: true,
      steps: true,
      requireFreshResults: true,
      activatedAt: true,
      participants: {
        select: { userId: true, currentStep: true, stepCompletions: true },
      },
    },
  });
  if (!campaign) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "CAMPAIGN_NOT_ACTIVE" }, { status: 400 });
  }

  const participantUserIds = campaign.participants.map((p) => p.userId);

  if (participantUserIds.length === 0) {
    return NextResponse.json({ ok: true, remindedCount: 0 });
  }

  // Lépés-tudatos „nem kezdte" számítás (2026-07-29): a kampány SAJÁT
  // lépéseiből semmit sem teljesítők – nem a self-teszt kitöltetlensége.
  // Újrafelvételi körben csak az aktiválás utáni self-eredmény számít.
  const selfDoneResults = await prisma.assessmentResult.findMany({
    where: {
      userProfileId: { in: participantUserIds },
      isSelfAssessment: true,
      ...(campaign.requireFreshResults
        ? campaign.activatedAt
          ? {
              OR: [
                { campaignId: campaign.id },
                { campaignId: null, createdAt: { gte: campaign.activatedAt } },
              ],
            }
          : { campaignId: campaign.id }
        : {}),
    },
    select: { userProfileId: true },
    distinct: ["userProfileId"],
  });

  const selfDoneSet = new Set(
    selfDoneResults.map((r) => r.userProfileId).filter(Boolean) as string[]
  );

  const steps = getCampaignSteps(campaign);
  const notStarted = campaign.participants.filter(
    (p) => countCampaignStepsDone(steps, p, selfDoneSet.has(p.userId)) === 0,
  );

  if (notStarted.length === 0) {
    return NextResponse.json({ ok: true, remindedCount: 0 });
  }

  const recipients = await prisma.userProfile.findMany({
    where: {
      id: { in: notStarted.map((p) => p.userId) },
      deleted: false,
      email: { not: null },
    },
    select: { id: true, email: true, locale: true },
  });

  const log = await getRequestLogger("campaign-remind");
  const results = await Promise.allSettled(
    recipients.map((r) =>
      sendMeasurementStepEmail({
        to: r.email as string,
        campaignName: campaign.name,
        link: "/tasks",
        variant: "reminder",
        locale: normalizeLocale(r.locale),
      }),
    ),
  );
  const remindedCount = results.filter(
    (r) => r.status === "fulfilled" && r.value === true,
  ).length;

  log.info(
    {
      event: "campaign.reminders_sent",
      campaignId,
      notStarted: notStarted.length,
      attempted: recipients.length,
      sent: remindedCount,
    },
    "Campaign reminder emails sent",
  );

  return NextResponse.json({ ok: true, remindedCount });
}

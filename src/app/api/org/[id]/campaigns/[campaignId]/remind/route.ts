import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { canManageMeasurements } from "@/lib/measurement-auth";
import {
  getCampaignStepLink,
  isCampaignStepType,
  selectStepReminderCohort,
} from "@/lib/campaign-steps-core";
import { sendMeasurementStepEmail } from "@/lib/emails";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import { normalizeLocale } from "@/lib/i18n/core";

// POST /api/org/[id]/campaigns/[campaignId]/remind
// P1-OPS-02: lépés-célzott emlékeztető. Minden befejezetlen résztvevő a
// SAJÁT nyitott lépéséhez kap emailt (a self-kész/trust-függő és a
// trust-kész/pulse-függő kohorsz is), közvetlen lépés-linkkel. Ugyanarra a
// lépésre 48 órán belül nem megy második levél (lastRemindedAt/-Step), így a
// kézi gomb — és egy jövőbeli cron — idempotens. A számláló csak a provider
// által elfogadott küldést lépteti; a bukott küldés a következő futásban
// újrapróbálható.
// Returns { ok, remindedCount, failedCount, skippedRecent, gated, done }.
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
        select: {
          userId: true,
          currentStep: true,
          nextStepOpensAt: true,
          lastRemindedAt: true,
          lastRemindedStep: true,
        },
      },
    },
  });
  if (!campaign) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (campaign.status !== "ACTIVE") {
    return NextResponse.json({ error: "CAMPAIGN_NOT_ACTIVE" }, { status: 400 });
  }

  if (campaign.participants.length === 0) {
    return NextResponse.json({
      ok: true,
      remindedCount: 0,
      failedCount: 0,
      skippedRecent: 0,
      gated: 0,
      done: 0,
    });
  }

  const now = new Date();
  const cohort = selectStepReminderCohort(campaign, campaign.participants, now);

  if (cohort.pending.length === 0) {
    return NextResponse.json({
      ok: true,
      remindedCount: 0,
      failedCount: 0,
      skippedRecent: cohort.skippedRecent,
      gated: cohort.gated,
      done: cohort.done,
    });
  }

  const recipients = await prisma.userProfile.findMany({
    where: {
      id: { in: cohort.pending.map((p) => p.userId) },
      deleted: false,
      email: { not: null },
    },
    select: { id: true, email: true, locale: true },
  });
  const recipientById = new Map(recipients.map((r) => [r.id, r]));

  const log = await getRequestLogger("campaign-remind");
  let remindedCount = 0;
  let failedCount = 0;
  for (const pending of cohort.pending) {
    const recipient = recipientById.get(pending.userId);
    if (!recipient) continue;
    const link = isCampaignStepType(pending.stepType)
      ? getCampaignStepLink(pending.stepType, campaign.id)
      : "/tasks";
    let sent = false;
    try {
      sent = await sendMeasurementStepEmail({
        to: recipient.email as string,
        campaignName: campaign.name,
        link,
        variant: "reminder",
        locale: normalizeLocale(recipient.locale),
      });
    } catch (err) {
      log.error(
        { event: "campaign.reminder_send_failed", campaignId, err },
        "Campaign reminder email failed",
      );
    }
    if (!sent) {
      failedCount += 1;
      continue;
    }
    remindedCount += 1;
    // Az idempotencia-ablak CSAK sikeres küldés után záródik — bukott
    // küldésre a következő futás újrapróbál.
    await prisma.campaignParticipant.update({
      where: { campaignId_userId: { campaignId, userId: pending.userId } },
      data: { lastRemindedAt: now, lastRemindedStep: pending.stepIndex },
    });
  }

  log.info(
    {
      event: "campaign.reminders_sent",
      campaignId,
      attempted: cohort.pending.length,
      sent: remindedCount,
      failed: failedCount,
      skippedRecent: cohort.skippedRecent,
      gated: cohort.gated,
    },
    "Campaign reminder emails sent",
  );

  return NextResponse.json({
    ok: true,
    remindedCount,
    failedCount,
    skippedRecent: cohort.skippedRecent,
    gated: cohort.gated,
    done: cohort.done,
  });
}

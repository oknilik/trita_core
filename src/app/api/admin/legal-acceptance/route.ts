import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestLogger } from "@/lib/logger.server";
import {
  LEGAL_EFFECTIVE_DATE,
  PLATFORM_TERMS_VERSION,
  PRIVACY_NOTICE_VERSION,
} from "@/lib/legal/versions";
import { getCurrentLegalAcceptanceStats } from "@/lib/legal/acceptance.server";
import { persistNotificationBatch } from "@/lib/notifications/repository";
import { sendLegalAcceptanceRequiredEmail } from "@/lib/emails";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

const requestSchema = z.object({ dryRun: z.boolean().optional() }).strict();

export async function GET() {
  await requireAdmin();
  return NextResponse.json(await getCurrentLegalAcceptanceStats());
}

export async function POST(req: Request) {
  const { userId } = await requireAdmin();
  const parsed = requestSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const admin = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true },
  });
  if (!admin) {
    return NextResponse.json({ error: "ADMIN_PROFILE_NOT_FOUND" }, { status: 404 });
  }

  const pendingRecipients = await prisma.userProfile.findMany({
    where: {
      deleted: false,
      clerkId: { not: null },
      email: { not: null },
      OR: [
        { platformTermsVersion: null },
        { platformTermsVersion: { not: PLATFORM_TERMS_VERSION } },
        { privacyNoticeVersion: null },
        { privacyNoticeVersion: { not: PRIVACY_NOTICE_VERSION } },
      ],
    },
    select: { id: true, email: true, locale: true },
    orderBy: { createdAt: "asc" },
  });

  if (parsed.data.dryRun) {
    return NextResponse.json({
      ok: true,
      dryRun: true,
      recipients: pendingRecipients.length,
      versions: {
        platformTerms: PLATFORM_TERMS_VERSION,
        privacyNotice: PRIVACY_NOTICE_VERSION,
        effectiveDate: LEGAL_EFFECTIVE_DATE,
      },
    });
  }

  const now = new Date();
  const campaign = await prisma.legalAcceptanceCampaign.upsert({
    where: {
      platformTermsVersion_privacyNoticeVersion: {
        platformTermsVersion: PLATFORM_TERMS_VERSION,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      },
    },
    create: {
      platformTermsVersion: PLATFORM_TERMS_VERSION,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      effectiveAt: new Date(`${LEGAL_EFFECTIVE_DATE}T00:00:00.000Z`),
      lastSentAt: now,
      recipientCount: pendingRecipients.length,
      sendCount: 1,
      createdById: admin.id,
    },
    update: {
      lastSentAt: now,
      recipientCount: pendingRecipients.length,
      sendCount: { increment: 1 },
    },
    select: { id: true, sendCount: true },
  });

  await persistNotificationBatch(
    pendingRecipients.map((recipient) => ({
      userId: recipient.id,
      type: "LEGAL_ACCEPTANCE_REQUIRED" as const,
      category: "system" as const,
      priority: "high" as const,
      link: "/dashboard",
      sourceType: "legal_campaign" as const,
      sourceId: campaign.id,
      actorUserId: admin.id,
      dedupeKey: `LEGAL_ACCEPTANCE_REQUIRED:${campaign.id}`,
    })),
  );

  let emailAccepted = 0;
  let emailFailed = 0;
  for (let offset = 0; offset < pendingRecipients.length; offset += 10) {
    const batch = pendingRecipients.slice(offset, offset + 10);
    const results = await Promise.all(
      batch.map(async (recipient) => {
        if (!recipient.email) return false;
        return sendLegalAcceptanceRequiredEmail({
          to: recipient.email,
          locale: recipient.locale === "en" ? "en" : "hu",
          campaignId: campaign.id,
          recipientId: recipient.id,
          sendNumber: campaign.sendCount,
        });
      }),
    );
    for (const accepted of results) {
      if (accepted) emailAccepted += 1;
      else emailFailed += 1;
    }
  }

  const log = await getRequestLogger("legal-acceptance-admin");
  log.info(
    {
      event: "legal_acceptance.sent",
      campaignId: campaign.id,
      recipients: pendingRecipients.length,
      emailAccepted,
      emailFailed,
      sendNumber: campaign.sendCount,
    },
    "Legal acceptance request sent",
  );

  return NextResponse.json({
    ok: true,
    dryRun: false,
    campaignId: campaign.id,
    recipients: pendingRecipients.length,
    emailAccepted,
    emailFailed,
    sendNumber: campaign.sendCount,
  });
}

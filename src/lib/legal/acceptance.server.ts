import { prisma } from "@/lib/prisma";
import {
  LEGAL_EFFECTIVE_DATE,
  PLATFORM_TERMS_VERSION,
  PRIVACY_NOTICE_VERSION,
} from "@/lib/legal/versions";
import { requiresLegalAcceptance } from "@/lib/legal/acceptance";

export interface PendingLegalAcceptance {
  campaignId: string;
  platformTermsVersion: string;
  privacyNoticeVersion: string;
  effectiveAt: string;
}

/**
 * A kampány csak az admin aktiválása után kötelező. Egy friss regisztráló a
 * kódban publikált legújabb verziót már elfogadta, ezért egy korábbi aktív
 * kampány miatt soha nem kérjük tőle egy régebbi verzió elfogadását.
 */
export async function getPendingLegalAcceptanceByClerkId(
  clerkId: string,
): Promise<PendingLegalAcceptance | null> {
  const [profile, campaign] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { clerkId },
      select: {
        platformTermsVersion: true,
        privacyNoticeVersion: true,
      },
    }),
    prisma.legalAcceptanceCampaign.findFirst({
      orderBy: { activatedAt: "desc" },
      select: {
        id: true,
        platformTermsVersion: true,
        privacyNoticeVersion: true,
        effectiveAt: true,
      },
    }),
  ]);

  if (!profile || !campaign) return null;
  if (!requiresLegalAcceptance({
    accepted: profile,
    activeCampaign: campaign,
    publishedCurrent: {
      platformTermsVersion: PLATFORM_TERMS_VERSION,
      privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
    },
  })) {
    return null;
  }

  return {
    campaignId: campaign.id,
    platformTermsVersion: campaign.platformTermsVersion,
    privacyNoticeVersion: campaign.privacyNoticeVersion,
    effectiveAt: campaign.effectiveAt.toISOString(),
  };
}

export async function getCurrentLegalAcceptanceStats() {
  const [eligible, accepted, activeCampaign] = await Promise.all([
    prisma.userProfile.count({
      where: { deleted: false, clerkId: { not: null }, email: { not: null } },
    }),
    prisma.userProfile.count({
      where: {
        deleted: false,
        clerkId: { not: null },
        email: { not: null },
        platformTermsVersion: PLATFORM_TERMS_VERSION,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      },
    }),
    prisma.legalAcceptanceCampaign.findFirst({
      orderBy: { activatedAt: "desc" },
      select: {
        id: true,
        platformTermsVersion: true,
        privacyNoticeVersion: true,
        effectiveAt: true,
        activatedAt: true,
        lastSentAt: true,
        recipientCount: true,
        sendCount: true,
      },
    }),
  ]);

  return {
    versions: {
      platformTerms: PLATFORM_TERMS_VERSION,
      privacyNotice: PRIVACY_NOTICE_VERSION,
      effectiveDate: LEGAL_EFFECTIVE_DATE,
    },
    eligible,
    accepted,
    pending: Math.max(0, eligible - accepted),
    activeCampaign,
    currentCampaignActive: Boolean(
      activeCampaign
      && activeCampaign.platformTermsVersion === PLATFORM_TERMS_VERSION
      && activeCampaign.privacyNoticeVersion === PRIVACY_NOTICE_VERSION
    ),
  };
}

export async function acceptActiveLegalCampaign(clerkId: string, campaignId: string) {
  const [profile, campaign] = await Promise.all([
    prisma.userProfile.findUnique({ where: { clerkId }, select: { id: true } }),
    prisma.legalAcceptanceCampaign.findFirst({
      orderBy: { activatedAt: "desc" },
      select: {
        id: true,
        platformTermsVersion: true,
        privacyNoticeVersion: true,
      },
    }),
  ]);
  if (!profile) return { ok: false as const, error: "PROFILE_NOT_FOUND" as const };
  if (!campaign) return { ok: false as const, error: "NO_ACTIVE_CAMPAIGN" as const };
  if (campaign.id !== campaignId) {
    return { ok: false as const, error: "STALE_CAMPAIGN" as const };
  }

  const acceptedAt = new Date();
  await prisma.$transaction([
    prisma.userProfile.update({
      where: { id: profile.id },
      data: {
        platformTermsVersion: campaign.platformTermsVersion,
        platformTermsAcceptedAt: acceptedAt,
        privacyNoticeVersion: campaign.privacyNoticeVersion,
        privacyNoticeAcceptedAt: acceptedAt,
      },
    }),
    prisma.legalAcceptanceRecord.upsert({
      where: {
        userId_platformTermsVersion_privacyNoticeVersion: {
          userId: profile.id,
          platformTermsVersion: campaign.platformTermsVersion,
          privacyNoticeVersion: campaign.privacyNoticeVersion,
        },
      },
      create: {
        userId: profile.id,
        campaignId: campaign.id,
        platformTermsVersion: campaign.platformTermsVersion,
        privacyNoticeVersion: campaign.privacyNoticeVersion,
        acceptedAt,
        source: "REACCEPTANCE",
      },
      update: {},
    }),
    prisma.notification.updateMany({
      where: {
        userId: profile.id,
        type: "LEGAL_ACCEPTANCE_REQUIRED",
        sourceId: campaign.id,
      },
      data: {
        read: true,
        readAt: acceptedAt,
        dismissed: true,
        dismissedAt: acceptedAt,
      },
    }),
  ]);

  return { ok: true as const };
}

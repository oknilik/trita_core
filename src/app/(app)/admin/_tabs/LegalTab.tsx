import { AdminLegalSection, type AdminLegalStats } from "@/app/(app)/admin/_components/AdminLegalSection";
import { getCurrentLegalAcceptanceStats } from "@/lib/legal/acceptance.server";

export async function LegalTab() {
  const stats = await getCurrentLegalAcceptanceStats();
  const serializable: AdminLegalStats = {
    ...stats,
    activeCampaign: stats.activeCampaign
      ? {
          platformTermsVersion: stats.activeCampaign.platformTermsVersion,
          privacyNoticeVersion: stats.activeCampaign.privacyNoticeVersion,
          activatedAt: stats.activeCampaign.activatedAt.toISOString(),
          lastSentAt: stats.activeCampaign.lastSentAt?.toISOString() ?? null,
          recipientCount: stats.activeCampaign.recipientCount,
          sendCount: stats.activeCampaign.sendCount,
        }
      : null,
  };

  return <AdminLegalSection stats={serializable} />;
}

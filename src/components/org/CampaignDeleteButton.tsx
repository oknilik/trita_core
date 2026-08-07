"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

// Mérés végleges törlése (tanácsadó/admin) — bármely státuszban, inline
// kétfázisú megerősítéssel (nincs natív browser-dialog). A kör-adatok
// (beadott értékelésekkel együtt) törlődnek; a lezárt listában sem
// jelenik meg többé. A userek saját eredményei megmaradnak.

export function CampaignDeleteButton({
  orgId,
  campaignId,
  locale,
}: {
  orgId: string;
  campaignId: string;
  locale: Locale;
}) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(false);

  const remove = async () => {
    setDeleting(true);
    setError(false);
    try {
      const res = await fetch(`/api/org/${orgId}/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setError(true);
        return;
      }
      router.push(`/org/${orgId}?tab=campaigns`);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="mt-4 border-t border-sand pt-4">
      {confirming ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4">
          <p className="text-xs font-semibold text-rose-800">
            {t("org.campaign.deleteConfirm", locale)}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={deleting}
              onClick={remove}
              className="min-h-[36px] rounded-lg bg-rose-600 px-4 text-xs font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
            >
              {deleting
                ? t("org.campaign.deleting", locale)
                : t("org.campaign.deleteConfirmCta", locale)}
            </button>
            <button
              type="button"
              disabled={deleting}
              onClick={() => setConfirming(false)}
              className="min-h-[36px] rounded-lg border border-sand bg-surface-card px-4 text-xs font-semibold text-ink-body transition hover:text-ink disabled:opacity-50"
            >
              {t("org.campaign.discardCancel", locale)}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-xs text-rose-700">
              {t("org.campaign.deleteFailed", locale)}
            </p>
          )}
        </div>
      ) : (
        <>
          <button
            type="button"
            onClick={() => setConfirming(true)}
            className="min-h-[36px] rounded-lg border border-rose-200 bg-surface-card px-4 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
          >
            {t("org.campaign.deleteCampaign", locale)}
          </button>
          <p className="mt-1.5 text-micro text-muted">
            {t("org.campaign.deleteHint", locale)}
          </p>
        </>
      )}
    </div>
  );
}

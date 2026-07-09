"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface PlanUpgradeModalProps {
  currentPlanName: string;
  targetPlanName: string;
  targetPriceKey: string;
  locale: string;
  onClose: () => void;
}

export function PlanUpgradeModal({
  currentPlanName,
  targetPlanName,
  targetPriceKey,
  locale,
  onClose,
}: PlanUpgradeModalProps) {
  const loc = locale as Locale;
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConfirm() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetPriceKey }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? "UPGRADE_FAILED");
      }
      router.refresh();
      onClose();
    } catch {
      setError(t("org.billing.upgradeError", loc));
    }
    setLoading(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-sand bg-white p-6 shadow-xl">
        <h3 className="font-fraunces text-lg text-ink">
          {t("org.billing.upgradeModalTitle", loc)}
        </h3>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 rounded-lg border border-sand bg-cream p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-muted">
              {t("org.billing.upgradeModalFrom", loc)}
            </p>
            <p className="mt-1 font-semibold text-ink">{currentPlanName}</p>
          </div>
          <svg className="h-5 w-5 shrink-0 text-muted" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 10h10M12 7l3 3-3 3" />
          </svg>
          <div className="flex-1 rounded-lg border border-sage/30 bg-sage-soft p-3 text-center">
            <p className="text-[10px] uppercase tracking-wide text-sage">
              {t("org.billing.upgradeModalTo", loc)}
            </p>
            <p className="mt-1 font-semibold text-ink">{targetPlanName}</p>
          </div>
        </div>

        <p className="mt-4 text-xs leading-relaxed text-muted">
          {t("org.billing.upgradeModalProration", loc)}
        </p>

        {error && (
          <p className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
            {error}
          </p>
        )}

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="flex-1 min-h-[44px] rounded-lg border border-sand text-sm font-semibold text-muted transition hover:border-ink hover:text-ink disabled:opacity-50"
          >
            {t("org.billing.upgradeModalCancel", loc)}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="flex-1 min-h-[44px] rounded-lg bg-sage text-sm font-semibold text-white transition hover:bg-sage-dark disabled:opacity-60"
          >
            {loading
              ? t("org.billing.upgradeModalProcessing", loc)
              : t("org.billing.upgradeModalConfirm", loc)}
          </button>
        </div>
      </div>
    </div>
  );
}

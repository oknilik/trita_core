"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface OrgDeactivateButtonProps {
  orgId: string;
  locale: string;
}

export function OrgDeactivateButton({ orgId, locale }: OrgDeactivateButtonProps) {
  const router = useRouter();
  const loc = locale as Locale;
  const [confirm, setConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDeactivate() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/${orgId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "INACTIVE" }),
      });
      if (!res.ok) {
        setError(t("org.actions.deactivateError", loc));
        return;
      }
      router.push("/org/suspended");
    } catch {
      setError(t("org.actions.deactivateNetworkError", loc));
    } finally {
      setLoading(false);
    }
  }

  if (!confirm) {
    return (
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="min-h-[44px] rounded-lg border border-rose-300 bg-white px-5 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
      >
        {t("org.actions.deactivateButton", loc)}
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm font-semibold text-rose-800">
        {t("org.actions.deactivateConfirm", loc)}
      </p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleDeactivate}
          disabled={loading}
          className="min-h-[44px] rounded-lg bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:opacity-50"
        >
          {loading ? "..." : t("org.actions.deactivateYes", loc)}
        </button>
        <button
          type="button"
          onClick={() => setConfirm(false)}
          className="min-h-[44px] rounded-lg border border-sand px-5 text-sm font-semibold text-ink-body transition hover:bg-cream"
        >
          {t("org.actions.deactivateCancel", loc)}
        </button>
      </div>
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

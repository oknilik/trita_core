"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

interface OrgRemoveMemberButtonProps {
  orgId: string;
  userId: string;
  isHu: boolean;
}

export function OrgRemoveMemberButton({ orgId, userId, isHu }: OrgRemoveMemberButtonProps) {
  const router = useRouter();
  const loc: Locale = isHu ? "hu" : "en";
  const [loading, setLoading] = useState(false);
  const [confirm, setConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRemove() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/org/${orgId}/members/${userId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.error === "LAST_ADMIN") {
          setError(t("org.actions.removeLastAdmin", loc));
        } else {
          setError(t("org.actions.removeError", loc));
        }
        return;
      }
      router.refresh();
    } catch {
      setError(t("org.actions.removeNetworkError", loc));
    } finally {
      setLoading(false);
      setConfirm(false);
    }
  }

  // Kétlépcsős törlés + diszkrét trigger (UX-audit #16): korábban EGY katt
  // eltávolította a tagot a szervezetből – most megerősítés kell, és a
  // nyugalmi állapot halvány szöveg-link, nem piros gomb.
  if (confirm) {
    return (
      <div className="flex flex-col items-start gap-1 md:items-end">
        {/* Destruktív megerősítés: 44px-es érintési célok és nagyobb térköz –
            mobilon ne lehessen a „Mégse" helyett az „Eltávolítás"-t nyomni. */}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="min-h-[44px] inline-flex items-center rounded-lg bg-[var(--color-action-destructive-bg)] px-4 text-xs font-semibold text-[var(--color-action-destructive-fg)] transition hover:bg-[var(--color-action-destructive-bg-hover)] disabled:opacity-50"
          >
            {loading ? "…" : isHu ? "Eltávolítás" : "Remove"}
          </button>
          <button
            type="button"
            onClick={() => setConfirm(false)}
            disabled={loading}
            className="min-h-[44px] inline-flex items-center rounded-lg border border-sand bg-surface-card px-4 text-xs font-semibold text-ink-body transition hover:border-sage/30"
          >
            {isHu ? "Mégse" : "Cancel"}
          </button>
        </div>
        <p className="max-w-xs text-xs leading-relaxed text-muted md:text-right">
          {isHu
            ? "A személyes profilja és saját eredményei megmaradnak; csak a szervezeti és csapathozzáférése szűnik meg."
            : "Their personal profile and self results will remain; only organization and team access will be removed."}
        </p>
        {error && <p className="text-xs text-state-error-fg">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1 md:items-end">
      {/* Láthatatlan 44px-es érintési sáv (before:-inset-y) – a diszkrét
          szöveg-trigger vizuális mérete nem nő, a sor nem feszül szét. */}
      <button
        type="button"
        onClick={() => setConfirm(true)}
        className="relative min-h-[32px] inline-flex items-center rounded-lg px-2 text-xs font-medium text-ink-body/60 transition before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[''] hover:bg-state-error-bg hover:text-state-error-fg"
      >
        {t("org.actions.removeButton", loc)}
      </button>
      {error && (
        <p className="text-xs text-state-error-fg">{error}</p>
      )}
    </div>
  );
}

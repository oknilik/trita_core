"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";
import { t, type Locale } from "@/lib/i18n";

interface Props {
  inviteId: string;
  isHu: boolean;
}

export function CandidateRevokeButton({ inviteId, isHu }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const locale: Locale = isHu ? "hu" : "en";

  async function handleConfirm() {
    setLoading(true);
    try {
      await fetch(`/api/manager/candidates/${inviteId}`, { method: "DELETE" });
      setOpen(false);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-[36px] inline-flex items-center rounded-lg border border-sand bg-surface-card px-3 text-note font-semibold text-ink-body transition hover:border-[var(--color-state-error-border)] hover:text-[var(--color-state-error-fg)]"
      >
        {t("manager.candidateRevoke.revoke", locale)}
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        eyebrow={isHu ? "meghívó kezelése" : "invite action"}
        title={t("manager.candidateRevoke.revokeTitle", locale)}
        description={t("manager.candidateRevoke.revokeDescription", locale)}
        variant="danger"
        design="brand"
      >
        <div className="flex flex-col-reverse items-center gap-2 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="min-h-[44px] rounded-[10px] border border-sand bg-surface-card px-5 text-sm font-semibold text-ink-body transition hover:bg-cream disabled:opacity-50"
          >
            {t("manager.candidateRevoke.cancel", locale)}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="min-h-[44px] rounded-[10px] bg-[var(--color-action-destructive-bg)] px-5 text-sm font-semibold text-white transition hover:bg-[var(--color-action-destructive-bg-hover)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? t("manager.candidateRevoke.revoking", locale)
              : t("manager.candidateRevoke.revoke", locale)}
          </button>
        </div>
      </Modal>
    </>
  );
}

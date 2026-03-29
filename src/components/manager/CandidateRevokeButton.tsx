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
        className="min-h-[36px] inline-flex items-center rounded-lg border border-rose-200 bg-white px-3 text-xs font-semibold text-rose-700 transition hover:bg-rose-50"
      >
        {t("manager.candidateRevoke.revoke", locale)}
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={t("manager.candidateRevoke.revokeTitle", locale)}
        description={t("manager.candidateRevoke.revokeDescription", locale)}
        variant="danger"
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="min-h-[44px] rounded-lg border border-sand bg-white px-5 text-sm font-semibold text-ink-body transition hover:bg-cream disabled:opacity-50"
          >
            {t("manager.candidateRevoke.cancel", locale)}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="min-h-[44px] rounded-lg bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
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

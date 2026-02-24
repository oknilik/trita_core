"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { ConfirmModal } from "@/components/ui/Modal";
import { t } from "@/lib/i18n";

export function DiscardDraftButton() {
  const router = useRouter();
  const { locale } = useLocale();
  const [showModal, setShowModal] = useState(false);
  const [isDiscarding, setIsDiscarding] = useState(false);

  const handleDiscard = async () => {
    setIsDiscarding(true);
    try {
      await fetch("/api/assessment/draft", { method: "DELETE" });
      router.refresh();
    } finally {
      setIsDiscarding(false);
      setShowModal(false);
    }
  };

  return (
    <>
      <button
        type="button"
        disabled={isDiscarding}
        onClick={() => setShowModal(true)}
        className="text-sm text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50"
      >
        {t("dashboard.discardDraft", locale)}
      </button>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleDiscard}
        title={t("dashboard.discardDraftConfirmTitle", locale)}
        description={t("dashboard.discardDraftConfirmBody", locale)}
        confirmText={t("dashboard.discardDraftConfirm", locale)}
        cancelText={t("dashboard.retakeCancel", locale)}
      />
    </>
  );
}

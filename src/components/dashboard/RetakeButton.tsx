"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "@/components/LocaleProvider";
import { ConfirmModal } from "@/components/ui/Modal";
import { t } from "@/lib/i18n";

export function RetakeButton() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { locale } = useLocale();
  const shouldAutoOpen = searchParams.get("retake") === "true";
  const [showModal, setShowModal] = useState(shouldAutoOpen);
  const cleanedUrl = useRef(false);

  useEffect(() => {
    if (cleanedUrl.current || !shouldAutoOpen) {
      return;
    }
    const url = new URL(window.location.href);
    url.searchParams.delete("retake");
    const nextPath = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState({}, "", nextPath || "/dashboard");
    cleanedUrl.current = true;
  }, [shouldAutoOpen]);

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        className="flex min-h-[44px] items-center rounded-lg border border-indigo-600 bg-transparent px-6 text-sm font-semibold text-indigo-600 transition hover:bg-indigo-50"
      >
        {t("dashboard.retake", locale)}
      </button>

      <ConfirmModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={() => router.push("/assessment?confirmed=true")}
        title={t("dashboard.retakeConfirmTitle", locale)}
        description={t("dashboard.retakeConfirmBody", locale)}
        confirmText={t("dashboard.retakeConfirm", locale)}
        cancelText={t("dashboard.retakeCancel", locale)}
      />
    </>
  );
}

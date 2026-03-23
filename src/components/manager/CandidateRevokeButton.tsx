"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal } from "@/components/ui/Modal";

interface Props {
  inviteId: string;
  isHu: boolean;
}

export function CandidateRevokeButton({ inviteId, isHu }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
        {isHu ? "Visszavon" : "Revoke"}
      </button>

      <Modal
        isOpen={open}
        onClose={() => setOpen(false)}
        title={isHu ? "Meghívó visszavonása" : "Revoke invite"}
        description={
          isHu
            ? "A meghívólink érvénytelenné válik, a jelölt nem tudja majd kitölteni a felmérést. Ez a művelet nem visszavonható."
            : "The invite link will become invalid and the candidate will no longer be able to complete the assessment. This cannot be undone."
        }
        variant="danger"
      >
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-end sm:gap-3">
          <button
            type="button"
            onClick={() => setOpen(false)}
            disabled={loading}
            className="min-h-[44px] rounded-lg border border-sand bg-white px-5 text-sm font-semibold text-ink-body transition hover:bg-cream disabled:opacity-50"
          >
            {isHu ? "Mégsem" : "Cancel"}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={loading}
            className="min-h-[44px] rounded-lg bg-rose-600 px-5 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? (isHu ? "Visszavonás…" : "Revoking…")
              : (isHu ? "Visszavonás" : "Revoke")}
          </button>
        </div>
      </Modal>
    </>
  );
}

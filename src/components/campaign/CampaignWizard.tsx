"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";

interface Member {
  userId: string;
  displayName: string;
}

interface CampaignWizardProps {
  orgId: string;
  members: Member[];
  locale: Locale;
}

type Step = 1 | 2 | 3;

export function CampaignWizard({ orgId, members, locale }: CampaignWizardProps) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const STEP_LABELS: Record<Step, string> = {
    1: t("campaignWiz.stepDetails", locale),
    2: t("campaignWiz.stepMembers", locale),
    3: t("campaignWiz.stepConfirm", locale),
  };

  function toggleMember(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(members.map((m) => m.userId)));
    }
  }

  async function handleSubmit() {
    setLoading(true);
    setError(null);
    try {
      // Step 1: create campaign
      const createRes = await fetch(`/api/org/${orgId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(data.error ?? "CREATE_FAILED");
      }
      const { campaign } = await createRes.json();

      // Step 2: add participants if any selected
      if (selectedIds.size > 0) {
        const addRes = await fetch(
          `/api/org/${orgId}/campaigns/${campaign.id}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds: Array.from(selectedIds) }),
          }
        );
        if (!addRes.ok) {
          const data = await addRes.json().catch(() => ({}));
          throw new Error(data.error ?? "ADD_PARTICIPANTS_FAILED");
        }
      }

      router.push(`/org/${orgId}?tab=campaigns`);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : t("campaignWiz.unknownError", locale)
      );
      setLoading(false);
    }
  }

  const selectedMembers = members.filter((m) => selectedIds.has(m.userId));

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex items-center gap-0">
        {([1, 2, 3] as Step[]).map((s, i) => (
          <div key={s} className="flex items-center">
            <div className="flex items-center gap-2">
              <div
                className={[
                  "flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors",
                  step === s
                    ? "bg-sage text-white"
                    : step > s
                    ? "bg-sage/20 text-bronze"
                    : "bg-sand text-muted",
                ].join(" ")}
              >
                {step > s ? (
                  <svg viewBox="0 0 12 12" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M2 6l3 3 5-5" />
                  </svg>
                ) : (
                  s
                )}
              </div>
              <span
                className={[
                  "text-[13px] font-medium",
                  step === s ? "text-ink" : "text-muted",
                ].join(" ")}
              >
                {STEP_LABELS[s]}
              </span>
            </div>
            {i < 2 && (
              <div className="mx-3 h-px w-8 bg-sand" />
            )}
          </div>
        ))}
      </div>

      {/* Step 1: Details */}
      {step === 1 && (
        <Card spacing="lg">
          <h2 className="mb-5 font-fraunces text-xl text-ink">
            {t("campaignWiz.detailsTitle", locale)}
          </h2>
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-ink">
                {t("campaignWiz.nameLabel", locale)}
                <span className="ml-1 text-bronze">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={100}
                placeholder={t("campaignWiz.namePlaceholder", locale)}
                className="min-h-[44px] w-full rounded-lg border border-sand bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-sage/50 focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[13px] font-semibold text-ink">
                {t("campaignWiz.descLabel", locale)}
                <span className="ml-1.5 text-[11px] font-normal text-muted">
                  {t("campaignWiz.optional", locale)}
                </span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                rows={3}
                placeholder={t("campaignWiz.descPlaceholder", locale)}
                className="w-full resize-none rounded-lg border border-sand bg-white px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-sage/50 focus:outline-none"
              />
              <p className="text-right font-mono text-[10px] text-muted">
                {description.length}/500
              </p>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              disabled={!name.trim()}
              onClick={() => setStep(2)}
              variant="primary"
            >
              {t("campaignWiz.next", locale)}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Members */}
      {step === 2 && (
        <Card spacing="lg">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-fraunces text-xl text-ink">
              {t("campaignWiz.selectParticipants", locale)}
            </h2>
            {members.length > 0 && (
              <button
                type="button"
                onClick={toggleAll}
                className="text-[12px] font-semibold text-bronze hover:underline"
              >
                {selectedIds.size === members.length
                  ? t("campaignWiz.deselectAll", locale)
                  : t("campaignWiz.selectAll", locale)}
              </button>
            )}
          </div>

          {members.length === 0 ? (
            <p className="text-sm text-muted">
              {t("campaignWiz.noMembers", locale)}
            </p>
          ) : (
            <div className="flex flex-col divide-y divide-sand">
              {members.map((m) => {
                const checked = selectedIds.has(m.userId);
                return (
                  <label
                    key={m.userId}
                    className="flex cursor-pointer items-center gap-3 py-3 transition-colors hover:bg-cream"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleMember(m.userId)}
                      className="h-4 w-4 accent-sage"
                    />
                    <span className="text-sm text-ink">{m.displayName}</span>
                  </label>
                );
              })}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <Button
              type="button"
              onClick={() => setStep(1)}
              variant="secondary"
              iconLeft="←"
            >
              {t("campaignWiz.back", locale)}
            </Button>
            <Button
              type="button"
              onClick={() => setStep(3)}
              variant="primary"
            >
              {t("campaignWiz.next", locale)}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && (
        <Card spacing="lg">
          <h2 className="mb-5 font-fraunces text-xl text-ink">
            {t("campaignWiz.summary", locale)}
          </h2>

          <div className="flex flex-col gap-4">
            {/* Campaign details */}
            <div className="rounded-xl border border-sand bg-cream p-4">
              <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted">
                {t("campaignWiz.campaignNameLabel", locale)}
              </p>
              <p className="text-[15px] font-semibold text-ink">{name}</p>
              {description && (
                <p className="mt-1 text-sm text-ink-body">{description}</p>
              )}
            </div>

            {/* Participants */}
            <div className="rounded-xl border border-sand bg-cream p-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted">
                {tf("campaignWiz.participantsLabel", locale, { count: selectedIds.size })}
              </p>
              {selectedIds.size === 0 ? (
                <p className="text-sm text-muted">
                  {t("campaignWiz.noneSelected", locale)}
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedMembers.map((m) => (
                    <span
                      key={m.userId}
                      className="rounded-full border border-sand bg-white px-2.5 py-0.5 text-[12px] text-ink-body"
                    >
                      {m.displayName}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Status note */}
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
              <span className="mt-0.5 text-amber-600">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6.5" />
                  <path d="M8 5v3.5M8 11v.5" />
                </svg>
              </span>
              <p className="text-[11px] text-amber-800">
                {t("campaignWiz.draftNote", locale)}
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-rose-100 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <Button
              type="button"
              onClick={() => setStep(2)}
              disabled={loading}
              variant="secondary"
              iconLeft="←"
            >
              {t("campaignWiz.back", locale)}
            </Button>
            <Button
              type="button"
              onClick={handleSubmit}
              loading={loading}
              variant="primary"
            >
              {loading
                ? t("campaignWiz.creating", locale)
                : t("campaignWiz.createCampaign", locale)}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

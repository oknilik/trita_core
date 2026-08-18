"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import {
  CAMPAIGN_STEP_ORDER,
  type CampaignStepType,
} from "@/lib/campaign-steps-core";

// DRAFT-kampány szerkesztő: custom kampánynál a mérés-lépések, minden
// kampánynál a cél-csapat és a lépés-ütem módosítható. Nevesített presetnél a
// lépéssor a termékszerződés része, ezért draftban is fix (az API is védi).

type CampaignType = CampaignStepType;

const STEP_ORDER: CampaignType[] = [...CAMPAIGN_STEP_ORDER];

const TYPE_NAME_KEYS: Record<CampaignType, string> = {
  SELF_ASSESSMENT: "campaignWiz.typeSelfName",
  OBSERVER_360: "campaignWiz.typeObserverName",
  TEAM_ROLE: "campaignWiz.typeRoleName",
  TEAM_ROLE_360: "campaignWiz.typeRole360Name",
  TRUST_360: "campaignWiz.typeTrustName",
  PSYCH_SAFETY: "campaignWiz.typePsychName",
  PEER_FEEDBACK: "campaignWiz.typePeerFbName",
};

const TEAM_LOCKED = new Set<CampaignType>([
  "TEAM_ROLE",
  "TEAM_ROLE_360",
  "TRUST_360",
  "PSYCH_SAFETY",
  "PEER_FEEDBACK",
]);

export function DraftCampaignEditor({
  orgId,
  campaignId,
  initialPresetId,
  initialSteps,
  initialTeamIds,
  initialIntervalHours,
  teams,
  locale,
}: {
  orgId: string;
  campaignId: string;
  initialPresetId: string | null;
  initialSteps: CampaignType[];
  initialTeamIds: string[];
  initialIntervalHours: number;
  teams: Array<{ id: string; name: string; memberCount: number }>;
  locale: Locale;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<CampaignType>>(new Set(initialSteps));
  // Több cél-csapat (2026-07-29): a lista az igazság.
  const [teamIds, setTeamIds] = useState<Set<string>>(new Set(initialTeamIds));
  const [intervalHours, setIntervalHours] = useState(initialIntervalHours);
  const [saving, setSaving] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  // Elvetés kétfázisú, inline megerősítéssel — natív confirm() nélkül.
  const [confirmingDiscard, setConfirmingDiscard] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const hasFixedPreset = initialPresetId !== null;

  const chosenSteps = STEP_ORDER.filter((tp) => selected.has(tp));
  const needsTeam = chosenSteps.some((tp) => TEAM_LOCKED.has(tp));
  const teamMissing = needsTeam && teamIds.size === 0;

  const toggleType = (tp: CampaignType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tp)) next.delete(tp);
      else {
        next.add(tp);
        if (tp === "OBSERVER_360") next.delete("SELF_ASSESSMENT");
        if (tp === "SELF_ASSESSMENT") next.delete("OBSERVER_360");
      }
      return next;
    });
    setNotice(null);
  };

  const save = async () => {
    setSaving(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/org/${orgId}/campaigns/${campaignId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "edit_draft",
          ...(hasFixedPreset ? {} : { types: chosenSteps }),
          teamIds: Array.from(teamIds),
          stepIntervalHours: intervalHours,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setNotice({
          kind: "error",
          text:
            json.error === "TEAM_REQUIRED"
              ? t("org.campaign.editTeamRequired", locale)
              : t("org.campaign.editFailed", locale),
        });
        return;
      }
      setNotice({ kind: "ok", text: t("org.campaign.editSaved", locale) });
      router.refresh();
    } finally {
      setSaving(false);
    }
  };

  // Vázlat elvetése: csak DRAFT-ban létezik a gomb; a szerver is őrzi
  // (CAMPAIGN_NOT_DRAFT). Beadott adat vázlatnál nincs, a törlés végleges.
  const discard = async () => {
    setDiscarding(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/org/${orgId}/campaigns/${campaignId}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        setNotice({ kind: "error", text: t("org.campaign.discardFailed", locale) });
        return;
      }
      router.push(`/org/${orgId}?tab=campaigns`);
      router.refresh();
    } finally {
      setDiscarding(false);
    }
  };

  return (
    <Card as="section" spacing="lg" className="md:p-8">
      <SectionEyebrow className="mb-1">
        {t("org.campaign.editDraftEyebrow", locale)}
      </SectionEyebrow>
      <h2 className="mb-1 text-sm font-semibold text-ink">
        {t("org.campaign.editDraftTitle", locale)}
      </h2>
      <p className="mb-4 text-xs text-ink-body/60">
        {t(
          hasFixedPreset
            ? "org.campaign.editPresetDraftHint"
            : "org.campaign.editDraftHint",
          locale,
        )}
      </p>

      {/* Mérések */}
      <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
        {t("org.campaign.editTypesLabel", locale)}
      </p>
      <div className="mb-5 flex flex-col gap-2">
        {STEP_ORDER.map((tp) => {
          const checked = selected.has(tp);
          const orderIndex = chosenSteps.indexOf(tp);
          const disabled = hasFixedPreset;
          return (
            <label
              key={tp}
              className={[
                "flex items-center justify-between gap-3 rounded-[12px] border px-3.5 py-2.5 transition",
                disabled
                  ? "cursor-not-allowed border-sand bg-cream/40 opacity-60"
                  : checked
                    ? "cursor-pointer border-sage bg-sage/5"
                    : "cursor-pointer border-sand bg-surface-card hover:bg-cream",
              ].join(" ")}
            >
              <span className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled}
                  onChange={() => toggleType(tp)}
                  className="h-4 w-4 accent-sage"
                />
                <span className="text-sm font-medium text-ink">
                  {t(TYPE_NAME_KEYS[tp], locale)}
                </span>
              </span>
              {checked && (
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage text-micro font-bold text-[var(--color-action-primary-fg)]">
                  {orderIndex + 1}
                </span>
              )}
            </label>
          );
        })}
      </div>

      {/* Cél-csapat */}
      <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
        {t("org.campaign.editTeamLabel", locale)}
      </p>
      <div className="mb-2 flex flex-col gap-2">
        {!needsTeam && (
          <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-sand bg-surface-card px-3.5 py-2.5 transition hover:bg-cream">
            <input
              type="checkbox"
              checked={teamIds.size === 0}
              onChange={() => setTeamIds(new Set())}
              className="h-4 w-4 accent-sage"
            />
            <span className="text-sm text-ink-body">{t("org.campaign.editNoTeam", locale)}</span>
          </label>
        )}
        {teams.map((team) => (
          <label
            key={team.id}
            className={[
              "flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border px-3.5 py-2.5 transition",
              teamIds.has(team.id) ? "border-sage bg-sage/5" : "border-sand bg-surface-card hover:bg-cream",
            ].join(" ")}
          >
            <span className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={teamIds.has(team.id)}
                onChange={() =>
                  setTeamIds((prev) => {
                    const next = new Set(prev);
                    if (next.has(team.id)) next.delete(team.id);
                    else next.add(team.id);
                    return next;
                  })
                }
                className="h-4 w-4 accent-sage"
              />
              <span className="text-sm font-medium text-ink">{team.name}</span>
            </span>
            <span className="text-xs text-muted">{team.memberCount} fő</span>
          </label>
        ))}
      </div>
      <p className="mb-5 text-note text-muted">{t("org.campaign.editTeamNote", locale)}</p>

      {/* Lépés-ütem */}
      {chosenSteps.length > 1 && (
        <>
          <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
            {t("campaignWiz.intervalLabel", locale)}
          </p>
          <div className="mb-5 flex flex-wrap gap-2">
            {[
              { value: 0, key: "campaignWiz.intervalNone" },
              { value: 12, key: "campaignWiz.interval12h" },
              { value: 24, key: "campaignWiz.interval24h" },
              { value: 48, key: "campaignWiz.interval48h" },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setIntervalHours(opt.value)}
                className={[
                  "min-h-[36px] rounded-[10px] border px-3.5 text-xs font-semibold transition",
                  intervalHours === opt.value
                    ? "border-[var(--color-surface-inverse)] bg-[var(--color-surface-inverse)] text-[var(--color-text-on-inverse)]"
                    : "border-sand bg-surface-card text-ink-body hover:border-ink/40",
                ].join(" ")}
              >
                {t(opt.key, locale)}
              </button>
            ))}
          </div>
        </>
      )}

      {notice && (
        <p
          className={[
            "mb-3 text-xs",
            notice.kind === "ok" ? "text-state-success-fg" : "text-state-error-fg",
          ].join(" ")}
        >
          {notice.text}
        </p>
      )}

      <Button
        type="button"
        variant="primary"
        size="sm"
        loading={saving}
        disabled={chosenSteps.length === 0 || teamMissing}
        onClick={save}
      >
        {t("org.campaign.editSave", locale)}
      </Button>
      {teamMissing && (
        <span className="ml-3 text-xs text-state-error-fg">
          {t("org.campaign.editTeamRequired", locale)}
        </span>
      )}

      {/* Vázlat elvetése — vizuálisan elválasztva a mentéstől; a
          megerősítés inline (nincs natív browser-dialog) */}
      <div className="mt-5 border-t border-sand pt-4">
        {confirmingDiscard ? (
          <div className="rounded-xl border border-state-error-border bg-state-error-bg p-4">
            <p className="text-xs font-semibold text-text-error-strong">
              {t("org.campaign.discardConfirm", locale)}
            </p>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={discarding}
                onClick={discard}
                className="min-h-[36px] rounded-lg bg-[var(--color-action-destructive-bg)] px-4 text-xs font-semibold text-[var(--color-action-destructive-fg)] transition hover:bg-[var(--color-action-destructive-bg-hover)] disabled:opacity-50"
              >
                {discarding
                  ? t("org.campaign.discarding", locale)
                  : t("org.campaign.discardConfirmCta", locale)}
              </button>
              <button
                type="button"
                disabled={discarding}
                onClick={() => setConfirmingDiscard(false)}
                className="min-h-[36px] rounded-lg border border-sand bg-surface-card px-4 text-xs font-semibold text-ink-body transition hover:text-ink disabled:opacity-50"
              >
                {t("org.campaign.discardCancel", locale)}
              </button>
            </div>
          </div>
        ) : (
          <>
            <button
              type="button"
              onClick={() => setConfirmingDiscard(true)}
              className="min-h-[36px] rounded-lg border border-state-error-border bg-surface-card px-4 text-xs font-semibold text-state-error-fg transition hover:bg-state-error-bg"
            >
              {t("org.campaign.discardDraft", locale)}
            </button>
            <p className="mt-1.5 text-micro text-muted">
              {t("org.campaign.discardHint", locale)}
            </p>
          </>
        )}
      </div>
    </Card>
  );
}

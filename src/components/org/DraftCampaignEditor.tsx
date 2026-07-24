"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";

// DRAFT-kampány szerkesztő: amíg a kampány nincs aktiválva, a mérés-lépések,
// a cél-csapat és a lépés-ütem szabadon módosítható. Aktiválás után a
// kampány összetétele fix (az API is 409-cel véd).

type CampaignType =
  | "OBSERVER_360"
  | "TEAM_ROLE"
  | "TEAM_ROLE_360"
  | "TRUST_360"
  | "PSYCH_SAFETY";

const STEP_ORDER: CampaignType[] = [
  "OBSERVER_360",
  "TEAM_ROLE",
  "TEAM_ROLE_360",
  "TRUST_360",
  "PSYCH_SAFETY",
];

const TYPE_NAME_KEYS: Record<CampaignType, string> = {
  OBSERVER_360: "campaignWiz.typeObserverName",
  TEAM_ROLE: "campaignWiz.typeRoleName",
  TEAM_ROLE_360: "campaignWiz.typeRole360Name",
  TRUST_360: "campaignWiz.typeTrustName",
  PSYCH_SAFETY: "campaignWiz.typePsychName",
};

const TEAM_LOCKED = new Set<CampaignType>([
  "TEAM_ROLE",
  "TEAM_ROLE_360",
  "TRUST_360",
  "PSYCH_SAFETY",
]);

export function DraftCampaignEditor({
  orgId,
  campaignId,
  initialSteps,
  initialTeamId,
  initialIntervalHours,
  teams,
  locale,
}: {
  orgId: string;
  campaignId: string;
  initialSteps: CampaignType[];
  initialTeamId: string | null;
  initialIntervalHours: number;
  teams: Array<{ id: string; name: string; memberCount: number }>;
  locale: Locale;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<CampaignType>>(new Set(initialSteps));
  const [teamId, setTeamId] = useState<string | null>(initialTeamId);
  const [intervalHours, setIntervalHours] = useState(initialIntervalHours);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  const chosenSteps = STEP_ORDER.filter((tp) => selected.has(tp));
  const needsTeam = chosenSteps.some((tp) => TEAM_LOCKED.has(tp));
  const teamMissing = needsTeam && !teamId;
  // Max 3 mérés / kampány (a create-séma limitje).
  const atLimit = chosenSteps.length >= 3;

  const toggleType = (tp: CampaignType) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(tp)) next.delete(tp);
      else if (next.size < 3) next.add(tp);
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
          types: chosenSteps,
          teamId,
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

  return (
    <section className="rounded-2xl border border-sand bg-white p-6 shadow-sm md:p-8">
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-bronze">
        {t("org.campaign.editDraftEyebrow", locale)}
      </p>
      <h2 className="mb-1 text-sm font-semibold text-ink">
        {t("org.campaign.editDraftTitle", locale)}
      </h2>
      <p className="mb-4 text-xs text-ink-body/60">{t("org.campaign.editDraftHint", locale)}</p>

      {/* Mérések */}
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
        {t("org.campaign.editTypesLabel", locale)}
      </p>
      <div className="mb-5 flex flex-col gap-2">
        {STEP_ORDER.map((tp) => {
          const checked = selected.has(tp);
          const orderIndex = chosenSteps.indexOf(tp);
          const disabled = !checked && atLimit;
          return (
            <label
              key={tp}
              className={[
                "flex items-center justify-between gap-3 rounded-[12px] border px-3.5 py-2.5 transition",
                disabled
                  ? "cursor-not-allowed border-sand bg-cream/40 opacity-60"
                  : checked
                    ? "cursor-pointer border-sage bg-sage/5"
                    : "cursor-pointer border-sand bg-white hover:bg-cream",
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
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-sage text-[10px] font-bold text-white">
                  {orderIndex + 1}
                </span>
              )}
            </label>
          );
        })}
      </div>

      {/* Cél-csapat */}
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
        {t("org.campaign.editTeamLabel", locale)}
      </p>
      <div className="mb-2 flex flex-col gap-2">
        {!needsTeam && (
          <label className="flex cursor-pointer items-center gap-3 rounded-[12px] border border-sand bg-white px-3.5 py-2.5 transition hover:bg-cream">
            <input
              type="radio"
              name="draftTeam"
              checked={teamId === null}
              onChange={() => setTeamId(null)}
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
              teamId === team.id ? "border-sage bg-sage/5" : "border-sand bg-white hover:bg-cream",
            ].join(" ")}
          >
            <span className="flex items-center gap-3">
              <input
                type="radio"
                name="draftTeam"
                checked={teamId === team.id}
                onChange={() => setTeamId(team.id)}
                className="h-4 w-4 accent-sage"
              />
              <span className="text-sm font-medium text-ink">{team.name}</span>
            </span>
            <span className="text-xs text-muted">{team.memberCount} fő</span>
          </label>
        ))}
      </div>
      <p className="mb-5 text-[11px] text-muted">{t("org.campaign.editTeamNote", locale)}</p>

      {/* Lépés-ütem */}
      {chosenSteps.length > 1 && (
        <>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
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
                  "min-h-[36px] rounded-[10px] border px-3.5 text-[12px] font-semibold transition",
                  intervalHours === opt.value
                    ? "border-ink bg-ink text-white"
                    : "border-sand bg-white text-ink-body hover:border-ink/40",
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
    </section>
  );
}

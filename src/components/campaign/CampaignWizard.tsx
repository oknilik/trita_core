"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";
import { TextField } from "@/components/ui/primitives/TextField";
import { TextareaField } from "@/components/ui/primitives/TextareaField";

interface Member {
  userId: string;
  displayName: string;
}

interface TeamOption {
  id: string;
  name: string;
  members: Member[];
}

interface CampaignWizardProps {
  orgId: string;
  members: Member[];
  teams: TeamOption[];
  preselectedTeamId?: string | null;
  locale: Locale;
}

type Step = 1 | 2 | 3 | 4;
type CampaignType = "OBSERVER_360" | "TEAM_ROLE" | "PSYCH_SAFETY";

// Kanonikus lépés-sorrend: személyiség → szerepek → biztonság.
const STEP_ORDER: CampaignType[] = ["OBSERVER_360", "TEAM_ROLE", "PSYCH_SAFETY"];

const TYPE_NAME_KEYS: Record<CampaignType, string> = {
  OBSERVER_360: "campaignWiz.typeObserverName",
  TEAM_ROLE: "campaignWiz.typeRoleName",
  PSYCH_SAFETY: "campaignWiz.typePsychName",
};

// A mérés-katalógus: mit mér, mennyi idő, mit kapsz belőle.
const TYPE_CARDS: Array<{
  type: CampaignType | "PSYCH_SAFETY";
  nameKey: string;
  descKey: string;
  metaKey?: string;
  outKey?: string;
  comingSoon?: boolean;
}> = [
  {
    type: "OBSERVER_360",
    nameKey: "campaignWiz.typeObserverName",
    descKey: "campaignWiz.typeObserverDesc",
    metaKey: "campaignWiz.typeObserverMeta",
    outKey: "campaignWiz.typeObserverOut",
  },
  {
    type: "TEAM_ROLE",
    nameKey: "campaignWiz.typeRoleName",
    descKey: "campaignWiz.typeRoleDesc",
    metaKey: "campaignWiz.typeRoleMeta",
    outKey: "campaignWiz.typeRoleOut",
  },
  {
    type: "PSYCH_SAFETY",
    nameKey: "campaignWiz.typePsychName",
    descKey: "campaignWiz.typePsychDesc",
    metaKey: "campaignWiz.typePsychMeta",
    outKey: "campaignWiz.typePsychOut",
  },
];

export function CampaignWizard({
  orgId,
  members,
  teams,
  preselectedTeamId = null,
  locale,
}: CampaignWizardProps) {
  const router = useRouter();
  const preselectedTeam = teams.find((tm) => tm.id === preselectedTeamId) ?? null;
  const [step, setStep] = useState<Step>(1);
  // Több mérés is választható — a tagoknak sorban nyílnak meg.
  const [selectedTypes, setSelectedTypes] = useState<Set<CampaignType>>(new Set());
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(preselectedTeam ? preselectedTeam.members.map((m) => m.userId) : []),
  );
  const [targetTeamId, setTargetTeamId] = useState<string | null>(preselectedTeamId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const STEP_LABELS: Record<Step, string> = {
    1: t("campaignWiz.stepType", locale),
    2: t("campaignWiz.stepDetails", locale),
    3: t("campaignWiz.stepTargeting", locale),
    4: t("campaignWiz.stepConfirm", locale),
  };

  const targetTeam = teams.find((tm) => tm.id === targetTeamId) ?? null;

  const chosenSteps = STEP_ORDER.filter((tp) => selectedTypes.has(tp));
  const type: CampaignType | null = chosenSteps[0] ?? null;

  // Auto-név: "Marketing — Kollégai visszajelzés (360°) · 2026. július"
  // több lépésnél: "Marketing — Mérés-sorozat (3) · 2026. július"
  function buildSuggestedName(nextSteps: CampaignType[], teamName?: string | null): string {
    const monthYear = new Date().toLocaleDateString(locale === "hu" ? "hu-HU" : "en-GB", {
      year: "numeric",
      month: "long",
    });
    const label =
      nextSteps.length > 1
        ? `${t("campaignWiz.seriesName", locale)} (${nextSteps.length})`
        : nextSteps[0]
          ? t(TYPE_NAME_KEYS[nextSteps[0]], locale)
          : "";
    return `${teamName ? `${teamName} — ` : ""}${label} · ${monthYear}`.slice(0, 100);
  }

  function toggleType(nextType: CampaignType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(nextType)) next.delete(nextType);
      else next.add(nextType);
      if (!nameTouched) {
        setName(buildSuggestedName(STEP_ORDER.filter((tp) => next.has(tp)), targetTeam?.name));
      }
      return next;
    });
  }

  function toggleMember(userId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  }

  function isTeamFullySelected(team: TeamOption): boolean {
    return team.members.length > 0 && team.members.every((m) => selectedIds.has(m.userId));
  }

  function toggleTeam(team: TeamOption) {
    const fully = isTeamFullySelected(team);
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const m of team.members) {
        if (fully) next.delete(m.userId);
        else next.add(m.userId);
      }
      return next;
    });
    setTargetTeamId(fully ? null : team.id);
  }

  // Csapathoz kötött mérésnél a célzás = egyetlen csapat (radio-jellegű választás).
  function pickRoleTeam(team: TeamOption) {
    setTargetTeamId(team.id);
    setSelectedIds(new Set(team.members.map((m) => m.userId)));
    if (!nameTouched && chosenSteps.length > 0) setName(buildSuggestedName(chosenSteps, team.name));
  }

  function toggleAll() {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
      setTargetTeamId(null);
    } else {
      setSelectedIds(new Set(members.map((m) => m.userId)));
    }
  }

  async function handleSubmit() {
    if (!type) return;
    setLoading(true);
    setError(null);
    try {
      const createRes = await fetch(`/api/org/${orgId}/campaigns`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          type,
          types: chosenSteps,
          teamId: targetTeamId ?? undefined,
        }),
      });
      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(data.error ?? "CREATE_FAILED");
      }
      const { campaign } = await createRes.json();

      if (selectedIds.size > 0) {
        const addRes = await fetch(`/api/org/${orgId}/campaigns/${campaign.id}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: Array.from(selectedIds) }),
        });
        if (!addRes.ok) {
          const data = await addRes.json().catch(() => ({}));
          throw new Error(data.error ?? "ADD_PARTICIPANTS_FAILED");
        }
      }

      router.push(`/org/${orgId}?tab=campaigns`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("campaignWiz.unknownError", locale));
      setLoading(false);
    }
  }

  const selectedMembers = members.filter((m) => selectedIds.has(m.userId));
  const typeLabel =
    chosenSteps.length > 1
      ? chosenSteps.map((tp, i) => `${i + 1}. ${t(TYPE_NAME_KEYS[tp], locale)}`).join(" → ")
      : type
        ? t(TYPE_NAME_KEYS[type], locale)
        : "";
  // Résztvevő nélkül is mehet tovább (később hozzáadható) — kivéve a
  // szerep-kört, ahol kötelező a cél-csapat.
  // Csapathoz kötött mérések: a szerep-kör és a pszich. biztonság pulse
  // egyetlen cél-csapaton él (az anonim aggregátum is csapatszintű).
  const isTeamLocked = chosenSteps.some(
    (tp) => tp === "TEAM_ROLE" || tp === "PSYCH_SAFETY",
  );
  const canProceedTargeting = isTeamLocked ? targetTeamId !== null : true;

  return (
    <div className="flex flex-col gap-6">
      {/* Step indicator */}
      <div className="flex flex-wrap items-center gap-y-2">
        {([1, 2, 3, 4] as Step[]).map((s, i) => (
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
            {i < 3 && <div className="mx-3 h-px w-6 bg-sand" />}
          </div>
        ))}
      </div>

      {/* Step 1: Type catalog */}
      {step === 1 && (
        <Card spacing="lg">
          <h2 className="mb-5 font-fraunces text-xl text-ink">
            {t("campaignWiz.typeTitle", locale)}
          </h2>
          <p className="mb-4 text-[13px] leading-relaxed text-ink-body">
            {t("campaignWiz.typeMultiHint", locale)}
          </p>
          <div className="flex flex-col gap-3">
            {TYPE_CARDS.map((card) => {
              const isSelected = selectedTypes.has(card.type as CampaignType);
              const orderIndex = chosenSteps.indexOf(card.type as CampaignType);
              return (
              <button
                key={card.type}
                type="button"
                disabled={card.comingSoon}
                onClick={() => !card.comingSoon && toggleType(card.type as CampaignType)}
                className={[
                  "rounded-[14px] border p-4 text-left transition",
                  card.comingSoon
                    ? "cursor-not-allowed border-dashed border-sand bg-cream/40 opacity-70"
                    : isSelected
                    ? "border-sage bg-sage/5"
                    : "border-sand bg-white hover:border-sage/50 hover:bg-sage/5",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-[15px] font-semibold text-ink">{t(card.nameKey, locale)}</p>
                  {isSelected ? (
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-[11px] font-bold text-white">
                      {orderIndex + 1}
                    </span>
                  ) : card.comingSoon ? (
                    <span className="rounded-full bg-sand px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                      {t("campaignWiz.typeComingSoon", locale)}
                    </span>
                  ) : null}
                </div>
                <p className="mt-1 text-[13px] leading-relaxed text-ink-body">
                  {t(card.descKey, locale)}
                </p>
                {card.metaKey && (
                  <p className="mt-2 font-mono text-[10px] uppercase tracking-wide text-muted">
                    {t(card.metaKey, locale)}
                  </p>
                )}
                {card.outKey && (
                  <p className="mt-1 text-[11px] text-bronze">{t(card.outKey, locale)}</p>
                )}
              </button>
              );
            })}
          </div>
          <div className="mt-6 flex justify-end">
            <Button
              type="button"
              disabled={chosenSteps.length === 0}
              onClick={() => {
                if (!nameTouched) setName(buildSuggestedName(chosenSteps, targetTeam?.name));
                setStep(2);
              }}
              variant="primary"
            >
              {t("campaignWiz.next", locale)}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 2: Details (auto-filled name) */}
      {step === 2 && (
        <Card spacing="lg">
          <h2 className="mb-5 font-fraunces text-xl text-ink">
            {t("campaignWiz.detailsTitle", locale)}
          </h2>
          <div className="flex flex-col gap-4">
            <TextField
              label={t("campaignWiz.nameLabel", locale)}
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setNameTouched(true);
              }}
              maxLength={100}
              placeholder={t("campaignWiz.namePlaceholder", locale)}
              helpText={nameTouched ? undefined : t("campaignWiz.autoNameHint", locale)}
            />
            <TextareaField
              label={
                <>
                  {t("campaignWiz.descLabel", locale)}
                  <span className="ml-1.5 text-[11px] font-normal text-muted">
                    {t("campaignWiz.optional", locale)}
                  </span>
                </>
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={500}
              rows={3}
              placeholder={t("campaignWiz.descPlaceholder", locale)}
              textareaClassName="resize-none"
              helpText={`${description.length}/500`}
              helpTextClassName="text-right font-mono text-[10px] text-muted"
            />
          </div>
          <div className="mt-6 flex items-center justify-between gap-4">
            <Button type="button" onClick={() => setStep(1)} variant="secondary" iconLeft="←">
              {t("campaignWiz.back", locale)}
            </Button>
            <Button
              type="button"
              disabled={!name.trim()}
              onClick={() => setStep(3)}
              variant="primary"
            >
              {t("campaignWiz.next", locale)}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 3: Targeting — teams first */}
      {step === 3 && (
        <Card spacing="lg">
          <div className="mb-5 flex items-center justify-between gap-4">
            <h2 className="font-fraunces text-xl text-ink">
              {t("campaignWiz.selectParticipants", locale)}
            </h2>
            {!isTeamLocked && members.length > 0 && (
              <Button
                type="button"
                onClick={toggleAll}
                variant="ghost"
                size="sm"
                className="min-h-0 px-0 text-[12px] text-bronze hover:bg-transparent hover:underline"
              >
                {selectedIds.size === members.length
                  ? t("campaignWiz.deselectAll", locale)
                  : t("campaignWiz.selectAll", locale)}
              </Button>
            )}
          </div>

          {isTeamLocked && (
            <p className="mb-4 text-[13px] text-ink-body">{t("campaignWiz.roleTeamHint", locale)}</p>
          )}

          {teams.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                {t("campaignWiz.teamsTitle", locale)}
              </p>
              <div className="flex flex-col gap-2">
                {teams.map((team) => {
                  const checked =
                    isTeamLocked ? targetTeamId === team.id : isTeamFullySelected(team);
                  return (
                    <label
                      key={team.id}
                      className={[
                        "flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border px-3.5 py-2.5 transition",
                        checked ? "border-sage bg-sage/5" : "border-sand bg-white hover:bg-cream",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type={isTeamLocked ? "radio" : "checkbox"}
                          name={isTeamLocked ? "roleTeam" : undefined}
                          checked={checked}
                          onChange={() =>
                            isTeamLocked ? pickRoleTeam(team) : toggleTeam(team)
                          }
                          className="h-4 w-4 accent-sage"
                        />
                        <span className="text-sm font-medium text-ink">{team.name}</span>
                      </span>
                      <span className="text-xs text-muted">
                        {tf("campaignWiz.teamMemberCount", locale, { count: team.members.length })}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {!isTeamLocked && (
            <>
              {teams.length === 0 && (
                <p className="mb-3 text-sm text-muted">{t("campaignWiz.noTeams", locale)}</p>
              )}
              <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                {t("campaignWiz.individualTitle", locale)}
              </p>
              {members.length === 0 ? (
                <p className="text-sm text-muted">{t("campaignWiz.noMembers", locale)}</p>
              ) : (
                <div className="flex max-h-72 flex-col divide-y divide-sand overflow-y-auto">
                  {members.map((m) => {
                    const checked = selectedIds.has(m.userId);
                    return (
                      <label
                        key={m.userId}
                        className="flex cursor-pointer items-center gap-3 py-2.5 transition-colors hover:bg-cream"
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
            </>
          )}

          <div className="mt-6 flex items-center justify-between gap-4">
            <Button type="button" onClick={() => setStep(2)} variant="secondary" iconLeft="←">
              {t("campaignWiz.back", locale)}
            </Button>
            <Button
              type="button"
              disabled={!canProceedTargeting}
              onClick={() => setStep(4)}
              variant="primary"
            >
              {t("campaignWiz.next", locale)}
            </Button>
          </div>
        </Card>
      )}

      {/* Step 4: Confirm */}
      {step === 4 && (
        <Card spacing="lg">
          <h2 className="mb-5 font-fraunces text-xl text-ink">
            {t("campaignWiz.summary", locale)}
          </h2>

          <div className="flex flex-col gap-4">
            <div className="rounded-xl border border-sand bg-cream p-4">
              <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted">
                {t("campaignWiz.typeSummaryLabel", locale)}
              </p>
              <p className="text-[15px] font-semibold text-ink">{typeLabel}</p>
            </div>

            <div className="rounded-xl border border-sand bg-cream p-4">
              <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-muted">
                {t("campaignWiz.campaignNameLabel", locale)}
              </p>
              <p className="text-[15px] font-semibold text-ink">{name}</p>
              {description && <p className="mt-1 text-sm text-ink-body">{description}</p>}
              {targetTeam && (
                <p className="mt-2 font-mono text-[9px] uppercase tracking-widest text-muted">
                  {t("campaignWiz.targetTeamLabel", locale)}{" "}
                  <span className="font-sans text-[12px] normal-case tracking-normal text-ink-body">
                    {targetTeam.name}
                  </span>
                </p>
              )}
            </div>

            <div className="rounded-xl border border-sand bg-cream p-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-muted">
                {tf("campaignWiz.participantsLabel", locale, { count: selectedIds.size })}
              </p>
              {selectedIds.size === 0 ? (
                <p className="text-sm text-muted">{t("campaignWiz.noneSelected", locale)}</p>
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

            <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2.5">
              <span className="mt-0.5 text-amber-600">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6.5" />
                  <path d="M8 5v3.5M8 11v.5" />
                </svg>
              </span>
              <p className="text-[11px] text-amber-800">{t("campaignWiz.draftNote", locale)}</p>
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
              onClick={() => setStep(3)}
              disabled={loading}
              variant="secondary"
              iconLeft="←"
            >
              {t("campaignWiz.back", locale)}
            </Button>
            <Button type="button" onClick={handleSubmit} loading={loading} variant="primary">
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

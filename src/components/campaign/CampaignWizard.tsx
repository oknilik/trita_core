"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { t, tf } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { Button } from "@/components/ui/primitives/Button";
import { Card } from "@/components/ui/primitives/Card";
import { TextField } from "@/components/ui/primitives/TextField";
import { TextareaField } from "@/components/ui/primitives/TextareaField";
import {
  CAMPAIGN_PRESETS,
  CAMPAIGN_STEP_ORDER,
  type CampaignPresetId,
  type CampaignStepType,
} from "@/lib/campaign-steps-core";

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
type CampaignType = CampaignStepType;
type CampaignPackage = CampaignPresetId | "CUSTOM";

// Kanonikus lépés-sorrend: személyiség → szerepek → reláció → biztonság.
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

// A mérés-katalógus: mit mér, mennyi idő, mit kapsz belőle.
const TYPE_CARDS: Array<{
  type: CampaignType;
  nameKey: string;
  descKey: string;
  metaKey?: string;
  outKey?: string;
  comingSoon?: boolean;
}> = [
  {
    type: "SELF_ASSESSMENT",
    nameKey: "campaignWiz.typeSelfName",
    descKey: "campaignWiz.typeSelfDesc",
    metaKey: "campaignWiz.typeSelfMeta",
    outKey: "campaignWiz.typeSelfOut",
  },
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
    type: "TEAM_ROLE_360",
    nameKey: "campaignWiz.typeRole360Name",
    descKey: "campaignWiz.typeRole360Desc",
    metaKey: "campaignWiz.typeRole360Meta",
    outKey: "campaignWiz.typeRole360Out",
  },
  {
    type: "TRUST_360",
    nameKey: "campaignWiz.typeTrustName",
    descKey: "campaignWiz.typeTrustDesc",
    metaKey: "campaignWiz.typeTrustMeta",
    outKey: "campaignWiz.typeTrustOut",
  },
  {
    type: "PSYCH_SAFETY",
    nameKey: "campaignWiz.typePsychName",
    descKey: "campaignWiz.typePsychDesc",
    metaKey: "campaignWiz.typePsychMeta",
    outKey: "campaignWiz.typePsychOut",
  },
  {
    type: "PEER_FEEDBACK",
    nameKey: "campaignWiz.typePeerFbName",
    descKey: "campaignWiz.typePeerFbDesc",
    metaKey: "campaignWiz.typePeerFbMeta",
    outKey: "campaignWiz.typePeerFbOut",
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
  // A reprodukálható Scan v1 az alapértelmezett. A haladó egyedi mód
  // megőrzi a meglévő, egycélú kampányokat és kiegészítő köröket.
  const [campaignPackage, setCampaignPackage] =
    useState<CampaignPackage>("SCAN_V1");
  const [selectedTypes, setSelectedTypes] = useState<Set<CampaignType>>(
    new Set(CAMPAIGN_PRESETS.SCAN_V1.steps),
  );
  const [name, setName] = useState("");
  const [nameTouched, setNameTouched] = useState(false);
  const [description, setDescription] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(preselectedTeam ? preselectedTeam.members.map((m) => m.userId) : []),
  );
  // Több cél-csapat is választható (2026-07-29) — a résztvevő-lista a
  // kiválasztott csapatok uniója (+ egyéni hozzáadás nem-kötött mérésnél).
  const [targetTeamIds, setTargetTeamIds] = useState<Set<string>>(
    new Set(preselectedTeamId ? [preselectedTeamId] : []),
  );
  // Külső observer-meghívók jóváhagyás nélkül mehetnek-e ebben a kampányban.
  const [allowExternalObservers, setAllowExternalObservers] = useState(false);
  // Peer feedback kör: a feedforward-elemek anonim-aggregált módban menjenek-e.
  const [peerFeedbackAnonymous, setPeerFeedbackAnonymous] = useState(false);
  const [requireFreshResults, setRequireFreshResults] = useState(false);
  // Lépés-ütem: a teljesített kérdőív után hány órával nyílik a következő.
  const [stepIntervalHours, setStepIntervalHours] = useState(24);
  // Azonnali aktiválás a létrehozás után (DRAFT→ACTIVE visszafordíthatatlan!)
  const [activateNow, setActivateNow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Újrapróbálás-védelem: ha a létrehozás sikerült, de egy későbbi hívás
  // (résztvevők / aktiválás) elhasal, a retry NEM hoz létre duplikát kampányt.
  const createdRef = useRef<{ campaignId: string; participantsAdded: boolean } | null>(null);

  const STEP_LABELS: Record<Step, string> = {
    1: t("campaignWiz.stepType", locale),
    2: t("campaignWiz.stepDetails", locale),
    3: t("campaignWiz.stepTargeting", locale),
    4: t("campaignWiz.stepConfirm", locale),
  };

  const targetTeams = teams.filter((tm) => targetTeamIds.has(tm.id));
  const targetTeam = targetTeams[0] ?? null;

  const chosenSteps =
    campaignPackage === "CUSTOM"
      ? STEP_ORDER.filter((tp) => selectedTypes.has(tp))
      : [...CAMPAIGN_PRESETS[campaignPackage].steps];
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

  function selectCampaignPackage(nextPackage: CampaignPackage) {
    setCampaignPackage(nextPackage);
    const nextSteps =
      nextPackage === "CUSTOM"
        ? STEP_ORDER.filter((tp) => selectedTypes.has(tp))
        : [...CAMPAIGN_PRESETS[nextPackage].steps];
    if (!nameTouched) setName(buildSuggestedName(nextSteps, targetTeam?.name));
  }

  function toggleType(nextType: CampaignType) {
    setSelectedTypes((prev) => {
      const next = new Set(prev);
      if (next.has(nextType)) next.delete(nextType);
      else {
        next.add(nextType);
        // Az OBSERVER_360 eleve tartalmaz selfet; a két lépés egy sorozatban
        // duplikálná ugyanazt a kérdőívet.
        if (nextType === "OBSERVER_360") next.delete("SELF_ASSESSMENT");
        if (nextType === "SELF_ASSESSMENT") next.delete("OBSERVER_360");
      }
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
    setTargetTeamIds((prev) => {
      const next = new Set(prev);
      if (fully) next.delete(team.id);
      else next.add(team.id);
      return next;
    });
  }

  // Csapathoz kötött mérésnél is TÖBB csapat választható — a résztvevők a
  // kiválasztott csapatok uniója; kikapcsoláskor a csapat tagjai kikerülnek.
  function toggleRoleTeam(team: TeamOption) {
    const isOn = targetTeamIds.has(team.id);
    setTargetTeamIds((prev) => {
      const next = new Set(prev);
      if (isOn) next.delete(team.id);
      else next.add(team.id);
      if (!nameTouched && chosenSteps.length > 0) {
        const firstTeam = teams.find((tm) => next.has(tm.id));
        setName(buildSuggestedName(chosenSteps, firstTeam?.name));
      }
      return next;
    });
    setSelectedIds((prev) => {
      const next = new Set(prev);
      for (const m of team.members) {
        if (isOn) next.delete(m.userId);
        else next.add(m.userId);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedIds.size === members.length) {
      setSelectedIds(new Set());
      setTargetTeamIds(new Set());
    } else {
      setSelectedIds(new Set(members.map((m) => m.userId)));
    }
  }

  async function handleSubmit() {
    if (!type) return;
    setLoading(true);
    setError(null);
    try {
      let campaignId = createdRef.current?.campaignId ?? null;

      if (!campaignId) {
        const createRes = await fetch(`/api/org/${orgId}/campaigns`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: name.trim(),
            description: description.trim() || undefined,
            type,
            presetId: campaignPackage === "CUSTOM" ? undefined : campaignPackage,
            types: campaignPackage === "CUSTOM" ? chosenSteps : undefined,
            teamIds: targetTeamIds.size > 0 ? Array.from(targetTeamIds) : undefined,
            allowExternalObservers,
            stepIntervalHours,
            requireFreshResults,
          }),
        });
        if (!createRes.ok) {
          const data = await createRes.json().catch(() => ({}));
          throw new Error(data.error ?? "CREATE_FAILED");
        }
        const { campaign } = await createRes.json();
        campaignId = campaign.id as string;
        createdRef.current = { campaignId, participantsAdded: false };
      }

      if (selectedIds.size > 0 && !createdRef.current?.participantsAdded) {
        const addRes = await fetch(`/api/org/${orgId}/campaigns/${campaignId}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userIds: Array.from(selectedIds) }),
        });
        if (!addRes.ok) {
          const data = await addRes.json().catch(() => ({}));
          throw new Error(data.error ?? "ADD_PARTICIPANTS_FAILED");
        }
        if (createdRef.current) createdRef.current.participantsAdded = true;
      }

      // Azonnali aktiválás — a meglévő PATCH útvonalon, hogy minden
      // mellékhatás (lépés-inicializálás, értesítések, szerep-kör flag)
      // ugyanúgy fusson, mint a kampány-oldali aktiválásnál.
      if (activateNow) {
        const activateRes = await fetch(`/api/org/${orgId}/campaigns/${campaignId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status: "ACTIVE" }),
        });
        if (!activateRes.ok) {
          throw new Error("ACTIVATE_FAILED");
        }
      }

      router.push(`/org/${orgId}?tab=campaigns`);
      router.refresh();
    } catch (err) {
      const code = err instanceof Error ? err.message : "";
      setError(
        code === "ACTIVATE_FAILED"
          ? t("campaignWiz.activateFailed", locale)
          : code || t("campaignWiz.unknownError", locale),
      );
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
    (tp) =>
      tp === "TEAM_ROLE" ||
      tp === "TEAM_ROLE_360" ||
      tp === "TRUST_360" ||
      tp === "PSYCH_SAFETY" ||
      tp === "PEER_FEEDBACK",
  );
  const canProceedTargeting = isTeamLocked ? targetTeamIds.size > 0 : true;

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
                    ? "bg-sage text-[var(--color-action-primary-fg)]"
                    : step > s
                    ? "bg-sage/20 text-[var(--color-accent-primary-strong)]"
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
                  "text-caption font-medium",
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
          <div className="grid gap-3 md:grid-cols-2">
            <button
              type="button"
              aria-pressed={campaignPackage === "SCAN_V1"}
              onClick={() => selectCampaignPackage("SCAN_V1")}
              className={[
                "rounded-[14px] border p-4 text-left transition",
                campaignPackage === "SCAN_V1"
                  ? "border-sage bg-sage/5"
                  : "border-sand bg-surface-card hover:border-sage/50",
              ].join(" ")}
            >
              <span className="flex items-center justify-between gap-3">
                <span className="text-body font-semibold text-ink">
                  {CAMPAIGN_PRESETS.SCAN_V1.label[locale]}
                </span>
                <span className="rounded-full bg-sage/15 px-2.5 py-1 text-micro font-bold uppercase tracking-wide text-sage-dark">
                  {t("campaignWiz.packageRecommended", locale)}
                </span>
              </span>
              <span className="mt-2 block text-caption leading-relaxed text-ink-body">
                {CAMPAIGN_PRESETS.SCAN_V1.description[locale]}
              </span>
              <span className="mt-2 block font-mono text-micro uppercase tracking-wide text-muted">
                {t("campaignWiz.scanV1Meta", locale)}
              </span>
            </button>
            <button
              type="button"
              aria-pressed={campaignPackage === "CUSTOM"}
              onClick={() => selectCampaignPackage("CUSTOM")}
              className={[
                "rounded-[14px] border p-4 text-left transition",
                campaignPackage === "CUSTOM"
                  ? "border-sage bg-sage/5"
                  : "border-sand bg-surface-card hover:border-sage/50",
              ].join(" ")}
            >
              <span className="text-body font-semibold text-ink">
                {t("campaignWiz.packageCustomName", locale)}
              </span>
              <span className="mt-2 block text-caption leading-relaxed text-ink-body">
                {t("campaignWiz.packageCustomDesc", locale)}
              </span>
            </button>
          </div>

          {campaignPackage === "CUSTOM" && (
            <div className="mt-5 border-t border-sand pt-4">
              <p className="mb-4 text-caption leading-relaxed text-ink-body">
                {t("campaignWiz.typeMultiHint", locale)}
              </p>
              {/* A haladó mód megtartja az egyedi mérés-sorozatokat. */}
              <div className="flex flex-col gap-2">
                {TYPE_CARDS.map((card) => {
                  const isSelected = selectedTypes.has(card.type);
                  const orderIndex = chosenSteps.indexOf(card.type);
                  return (
                    <div
                      key={card.type}
                      className={[
                        "rounded-[14px] border transition",
                        card.comingSoon
                          ? "border-dashed border-sand bg-cream/40 opacity-70"
                          : isSelected
                            ? "border-sage bg-sage/5"
                            : "border-sand bg-surface-card hover:border-sage/50",
                      ].join(" ")}
                    >
                      <label
                        className={[
                          "flex items-center gap-3 p-3.5",
                          card.comingSoon ? "cursor-not-allowed" : "cursor-pointer",
                        ].join(" ")}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={card.comingSoon}
                          onChange={() => !card.comingSoon && toggleType(card.type)}
                          className="h-4.5 w-4.5 shrink-0 accent-[var(--color-accent-primary)]"
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-body font-semibold text-ink">{t(card.nameKey, locale)}</p>
                          {card.metaKey && (
                            <p className="mt-0.5 font-mono text-micro uppercase tracking-wide text-muted">
                              {t(card.metaKey, locale)}
                            </p>
                          )}
                        </div>
                        {isSelected ? (
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sage text-[11px] font-bold text-[var(--color-action-primary-fg)]">
                            {orderIndex + 1}
                          </span>
                        ) : card.comingSoon ? (
                          <span className="rounded-full bg-sand px-2.5 py-0.5 text-micro font-semibold uppercase tracking-wide text-muted">
                            {t("campaignWiz.typeComingSoon", locale)}
                          </span>
                        ) : null}
                      </label>
                      <details className="border-t border-sand/60 px-3.5 pb-3">
                        <summary className="cursor-pointer select-none pt-2 text-[11px] font-medium text-muted transition-colors hover:text-ink-body">
                          {locale === "hu" ? "Részletek" : "Details"}
                        </summary>
                        <p className="mt-1.5 text-caption leading-relaxed text-ink-body">
                          {t(card.descKey, locale)}
                        </p>
                        {card.outKey && (
                          <p className="mt-1 text-[11px] text-[var(--color-accent-primary-strong)]">{t(card.outKey, locale)}</p>
                        )}
                      </details>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Élő sorrend-előnézet (UX-audit #24): a lényeg — a tagoknak
              EBBEN a sorrendben nyílnak a lépések — ne fejben álljon össze. */}
          <div className="mt-5 flex flex-col gap-3 border-t border-sand pt-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="min-w-0 text-caption text-ink-body">
              {chosenSteps.length === 0 ? (
                <span className="text-muted">
                  {locale === "hu" ? "Válassz legalább egy mérést." : "Pick at least one measurement."}
                </span>
              ) : (
                <>
                  <span className="font-semibold text-ink">
                    {locale === "hu" ? "Sorozatod: " : "Your sequence: "}
                  </span>
                  {chosenSteps
                    .map((tp, i) => `${i + 1}. ${t(TYPE_NAME_KEYS[tp], locale)}`)
                    .join(" → ")}
                </>
              )}
            </p>
            <Button
              type="button"
              disabled={chosenSteps.length === 0}
              onClick={() => {
                if (!nameTouched) setName(buildSuggestedName(chosenSteps, targetTeam?.name));
                setStep(2);
              }}
              variant="primary"
              className="shrink-0"
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
              helpTextClassName="text-right font-mono text-micro text-muted"
            />
            {chosenSteps.length > 1 ? (
              <div className="rounded-xl border border-sand bg-cream/60 px-4 py-3.5">
                <p className="text-caption font-semibold text-ink">
                  {t("campaignWiz.intervalLabel", locale)}
                </p>
                <p className="mt-0.5 text-[12px] leading-relaxed text-ink-body">
                  {t("campaignWiz.intervalHint", locale)}
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2">
                  {[
                    { value: 0, key: "campaignWiz.intervalNone" },
                    { value: 12, key: "campaignWiz.interval12h" },
                    { value: 24, key: "campaignWiz.interval24h" },
                    { value: 48, key: "campaignWiz.interval48h" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setStepIntervalHours(opt.value)}
                      className={[
                        "min-h-[36px] rounded-[10px] border px-3.5 text-[12px] font-semibold transition",
                        stepIntervalHours === opt.value
                          ? "border-[var(--color-surface-inverse)] bg-[var(--color-surface-inverse)] text-[var(--color-text-on-inverse)]"
                          : "border-sand bg-surface-card text-ink-body hover:border-ink/40",
                      ].join(" ")}
                    >
                      {t(opt.key, locale)}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand bg-cream/60 px-4 py-3.5">
              <input
                type="checkbox"
                checked={requireFreshResults}
                onChange={(e) => setRequireFreshResults(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded accent-sage"
              />
              <span className="text-caption leading-relaxed text-ink-body">
                <span className="font-semibold text-ink">
                  {t("campaignWiz.freshLabel", locale)}
                </span>{" "}
                {t("campaignWiz.freshHint", locale)}
              </span>
            </label>
            {chosenSteps.includes("PEER_FEEDBACK") ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand bg-cream/60 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={peerFeedbackAnonymous}
                  onChange={(e) => setPeerFeedbackAnonymous(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded accent-sage"
                />
                <span className="text-caption leading-relaxed text-ink-body">
                  <span className="font-semibold text-ink">
                    {t("campaignWiz.peerFbAnonLabel", locale)}
                  </span>{" "}
                  {t("campaignWiz.peerFbAnonHint", locale)}
                </span>
              </label>
            ) : null}
            {chosenSteps.includes("OBSERVER_360") ? (
              <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-sand bg-cream/60 px-4 py-3.5">
                <input
                  type="checkbox"
                  checked={allowExternalObservers}
                  onChange={(e) => setAllowExternalObservers(e.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded accent-sage"
                />
                <span className="text-caption leading-relaxed text-ink-body">
                  <span className="font-semibold text-ink">
                    {t("campaignWiz.allowExternalLabel", locale)}
                  </span>{" "}
                  {t("campaignWiz.allowExternalHint", locale)}
                </span>
              </label>
            ) : null}
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
                className="min-h-0 px-0 text-[12px] text-[var(--color-accent-primary-strong)] hover:bg-transparent hover:underline"
              >
                {selectedIds.size === members.length
                  ? t("campaignWiz.deselectAll", locale)
                  : t("campaignWiz.selectAll", locale)}
              </Button>
            )}
          </div>

          {isTeamLocked && (
            <p className="mb-4 text-caption text-ink-body">{t("campaignWiz.roleTeamHint", locale)}</p>
          )}

          {teams.length > 0 && (
            <div className="mb-5">
              <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
                {t("campaignWiz.teamsTitle", locale)}
              </p>
              <div className="flex flex-col gap-2">
                {teams.map((team) => {
                  const checked = isTeamLocked
                    ? targetTeamIds.has(team.id)
                    : isTeamFullySelected(team);
                  return (
                    <label
                      key={team.id}
                      className={[
                        "flex cursor-pointer items-center justify-between gap-3 rounded-[12px] border px-3.5 py-2.5 transition",
                        checked ? "border-sage bg-sage/5" : "border-sand bg-surface-card hover:bg-cream",
                      ].join(" ")}
                    >
                      <span className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() =>
                            isTeamLocked ? toggleRoleTeam(team) : toggleTeam(team)
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
              <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
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
              <p className="mb-1 text-label uppercase text-muted">
                {t("campaignWiz.typeSummaryLabel", locale)}
              </p>
              <p className="text-body font-semibold text-ink">{typeLabel}</p>
            </div>

            <div className="rounded-xl border border-sand bg-cream p-4">
              <p className="mb-1 text-label uppercase text-muted">
                {t("campaignWiz.campaignNameLabel", locale)}
              </p>
              <p className="text-body font-semibold text-ink">{name}</p>
              {description && <p className="mt-1 text-sm text-ink-body">{description}</p>}
              {targetTeams.length > 0 && (
                <p className="mt-2 text-label uppercase text-muted">
                  {t("campaignWiz.targetTeamLabel", locale)}{" "}
                  <span className="font-sans text-[12px] normal-case tracking-normal text-ink-body">
                    {targetTeams.map((tm) => tm.name).join(" · ")}
                  </span>
                </p>
              )}
            </div>

            <div className="rounded-xl border border-sand bg-cream p-4">
              <p className="mb-2 text-label uppercase text-muted">
                {tf("campaignWiz.participantsLabel", locale, { count: selectedIds.size })}
              </p>
              {selectedIds.size === 0 ? (
                <p className="text-sm text-muted">{t("campaignWiz.noneSelected", locale)}</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {selectedMembers.map((m) => (
                    <span
                      key={m.userId}
                      className="rounded-full border border-sand bg-surface-card px-2.5 py-0.5 text-[12px] text-ink-body"
                    >
                      {m.displayName}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Azonnali aktiválás opció */}
            <label
              className={[
                "flex items-start gap-3 rounded-xl border px-4 py-3.5",
                selectedIds.size === 0
                  ? "cursor-not-allowed border-sand bg-cream/50 opacity-60"
                  : "cursor-pointer border-sand bg-cream/60",
              ].join(" ")}
            >
              <input
                type="checkbox"
                checked={activateNow}
                disabled={selectedIds.size === 0}
                onChange={(e) => setActivateNow(e.target.checked)}
                className="mt-0.5 h-5 w-5 shrink-0 rounded accent-sage"
              />
              <span className="text-caption leading-relaxed text-ink-body">
                <span className="font-semibold text-ink">
                  {t("campaignWiz.activateNowLabel", locale)}
                </span>{" "}
                {selectedIds.size === 0
                  ? t("campaignWiz.activateNowNoParticipants", locale)
                  : t("campaignWiz.activateNowHint", locale)}
              </span>
            </label>

            <div className="flex items-start gap-2 rounded-lg bg-state-warning-bg px-3 py-2.5">
              <span className="mt-0.5 text-state-warning-fg">
                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="8" cy="8" r="6.5" />
                  <path d="M8 5v3.5M8 11v.5" />
                </svg>
              </span>
              <p className="text-[11px] text-bronze-700">
                {activateNow
                  ? t("campaignWiz.activateNowNote", locale)
                  : t("campaignWiz.draftNote", locale)}
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-state-error-bg bg-state-error-bg px-4 py-3 text-sm text-state-error-fg">
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
                : activateNow
                  ? t("campaignWiz.createAndActivate", locale)
                  : t("campaignWiz.createCampaign", locale)}
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}

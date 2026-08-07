"use client";

import { useState } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t, tf } from "@/lib/i18n";
import { withHuArticle } from "@/lib/hu-grammar";
import { TRITAN_DIMENSIONS } from "@/lib/tritan";
import { ProgressRing } from "@/components/ui/ProgressRing";
import { INDUSTRIES } from "@/lib/industry-fit";
import { ExplainerLink } from "@/components/results/ExplainerLink";
import type { CareerFitView, CareerResultView } from "@/lib/career/service";

// Klaszteres eredmény-nézet. A legfontosabb elvi különbség a v1-hez képest:
// ahol a szerepek különbsége a mérési hibán belül van, ott NEM állítunk
// sorrendet — a csoport tagjai egyenrangúan jelennek meg.

// Szöveg-gombok érintőcélja: a látható magasság marad ~18px (a sűrű
// disclosure-sorok nem nyílnak szét), de a ::before egy 44px magas,
// láthatatlan hit-area-t feszít a gomb fölé — mobilon ez a kattintható rész.
const TEXT_TAP_TARGET =
  "relative inline-flex items-center before:absolute before:inset-x-0 before:top-1/2 before:h-11 before:-translate-y-1/2 before:content-['']";

const ENTRY_KEY: Record<string, string> = {
  open: "results.cfEntryOpen",
  course: "results.cfEntryCourse",
  vocational: "results.cfEntryVocational",
  higher: "results.cfEntryHigher",
  specialized: "results.cfEntrySpecialized",
};

// A hozzáférés SZÖVEGE az állapotból jön, nem a puszta szintből: a diploma
// megléte önmagában nem képesít egy másik szakirányú munkára.
const ACCESS_KEY: Record<string, string> = {
  "field-match": "results.cfAccessFieldMatch",
  "level-only": "results.cfAccessLevelOnly",
  "licence-needed": "results.cfAccessLicence",
  "training-needed": "results.cfAccessTraining",
};

const GAP_KEY: Record<string, string> = {
  ready: "results.cfGapReady",
  course: "results.cfGapCourse",
  vocational: "results.cfGapVocational",
  degree: "results.cfGapDegree",
  licence: "results.cfGapLicence",
};

// Vétó-címkék megjelenítési kulcsai (a wizard chip-jeivel azonosak).
const VETO_LABEL_KEYS: Record<string, string> = {
  children: "results.ccVetoChildren",
  care: "results.ccVetoCare",
  blood: "results.ccVetoBlood",
  customers: "results.ccVetoCustomers",
  sales: "results.ccVetoSales",
  conflict: "results.ccVetoConflict",
  shift: "results.ccVetoShift",
  physical: "results.ccVetoPhysical",
  outdoor: "results.ccVetoOutdoor",
  screen: "results.ccVetoScreen",
  driving: "results.ccVetoDriving",
  heights: "results.ccVetoHeights",
  hazard: "results.ccVetoHazard",
  monotony: "results.ccVetoMonotony",
  animals: "results.ccVetoAnimals",
};

function dimLabel(code: string, isHu: boolean): string {
  const dim = TRITAN_DIMENSIONS[code as keyof typeof TRITAN_DIMENSIONS];
  if (!dim) return code;
  return `${dim.letter} ${isHu ? dim.hu : dim.en}`;
}

// Illeszkedés-szín az értékelő rampról (zsálya→bronz→neutrális) — a korábbi
// emerald/amber (státusz-hue-k + AA-bukó amber) kivezetve.
function fitColor(score: number): string {
  if (score >= 70) return "var(--color-eval-high-accent)";
  if (score >= 55) return "var(--color-eval-mid-accent)";
  return "var(--color-eval-low-accent)";
}

function OccupationCard({
  fit,
  hero,
  delayMs = 0,
}: {
  fit: CareerFitView;
  hero: boolean;
  delayMs?: number;
}) {
  const { locale } = useLocale();
  const isHu = locale === "hu";
  const [open, setOpen] = useState(false);
  const [feedback, setFeedback] = useState<"sent" | null>(null);

  async function sendFeedback(verdict: "accurate" | "inaccurate") {
    setFeedback("sent");
    try {
      await fetch("/api/industry-fit/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          occupationId: fit.id,
          fitScore: fit.demandFit,
          verdict,
        }),
      });
    } catch {
      /* kalibrációs jel — hiba esetén csendben elengedjük */
    }
  }

  return (
    <div
      className={
        hero
          ? "rounded-[16px] border-2 border-sage/50 bg-gradient-to-br from-sage/10 to-white p-5"
          : "rounded-[12px] border border-[var(--color-border-soft)] bg-surface-card p-4"
      }
      style={{ animation: "cc-step-in 0.35s ease-out both", animationDelay: `${delayMs}ms` }}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p
            className={`font-semibold text-[var(--color-text-primary)] ${
              hero ? "font-fraunces text-xl" : "text-sm"
            }`}
          >
            {fit.hu}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-left sm:text-right">
            <p className="font-mono text-micro text-[var(--color-text-muted)]">
              {fit.band.low}–{fit.band.high}%
            </p>
            <p className="text-[11px] text-[var(--color-text-secondary)]">
              {t("results.cfDemandLabel", locale)}
            </p>
          </div>
          <ProgressRing
            percent={fit.demandFit}
            size={hero ? 60 : 46}
            strokeWidth={hero ? 6 : 5}
            trackColor="var(--color-border-soft)"
            color={fitColor(fit.demandFit)}
            label={`${fit.demandFit}%`}
            labelClassName="fill-[var(--color-text-primary)]"
          />
        </div>
      </div>

      <p className="mt-2 text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
        {fit.desc}
      </p>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 text-micro text-[var(--color-text-secondary)]">
          🎓 {t(ENTRY_KEY[fit.entry] ?? ENTRY_KEY.open, locale)}
        </span>
        <span
          className={`rounded-full px-2 py-0.5 text-micro font-medium ${
            fit.feasibility.state === "field-match"
              ? "bg-state-success-bg text-state-success-fg"
              : fit.feasibility.state === "level-only"
                ? "bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)]"
                : "bg-state-warning-bg text-bronze-700"
          }`}
          title={
            fit.feasibility.state === "training-needed"
              ? t(GAP_KEY[fit.feasibility.gap] ?? GAP_KEY.ready, locale)
              : undefined
          }
        >
          {t(ACCESS_KEY[fit.feasibility.state] ?? ACCESS_KEY["level-only"], locale)}
          {fit.feasibility.state === "training-needed" &&
            ` — ${t(GAP_KEY[fit.feasibility.gap] ?? GAP_KEY.ready, locale)}`}
        </span>
        {fit.interest !== null && (
          <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 text-micro text-[var(--color-text-secondary)]">
            🎯 {tf("results.cfInterestMatch", locale, { value: fit.interest })}
            {fit.riasecTop && (
              <span className="ml-1 font-mono font-semibold">{fit.riasecTop}</span>
            )}
          </span>
        )}
        {fit.flags.includes("industry-intersect") && (
          <span className="rounded-full bg-sage/15 px-2 py-0.5 text-micro font-semibold text-sage-dark">
            {t("results.cfIntersectBadge", locale)}
          </span>
        )}
        {fit.flags.includes("industry-pick") && !fit.flags.includes("industry-intersect") && (
          <span className="rounded-full bg-sage/10 px-2 py-0.5 text-micro font-medium text-sage-dark">
            {t("results.cfIndustryPick", locale)}
          </span>
        )}
        {fit.interest !== null && fit.interest < 55 && (
          <span className="rounded-full bg-state-warning-bg px-2 py-0.5 text-micro font-medium text-bronze-700">
            {tf("results.cfInterestDiverges", locale, { value: fit.interest })}
          </span>
        )}
        {fit.demandFit < 55 && (
          <span className="rounded-full bg-state-warning-bg px-2 py-0.5 text-micro font-medium text-bronze-700">
            {t("results.cfPersonalityTension", locale)}
          </span>
        )}
        {fit.preference !== null && (
          <span className="rounded-full bg-[var(--color-surface-subtle)] px-2 py-0.5 text-micro text-[var(--color-text-secondary)]">
            ⚙️ {tf("results.cfPreferenceMatch", locale, { value: fit.preference })}
          </span>
        )}
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`mt-2.5 text-[12px] font-semibold text-[var(--color-accent-primary-strong)] transition-colors hover:text-ink ${TEXT_TAP_TARGET}`}
      >
        {t("results.cfWhy", locale)} {open ? "▴" : "▾"}
      </button>

      {open && (
        <div className="mt-3 flex flex-col gap-2 border-t border-[var(--color-border-soft)] pt-3">
          {fit.components.map((component) => (
            <div key={component.dim} className="flex flex-wrap items-center gap-2 sm:gap-3">
              <span className="w-24 shrink-0 text-micro leading-tight text-[var(--color-text-secondary)] sm:w-44 sm:text-[11px]">
                {dimLabel(component.dim, isHu)}
                <span className="block text-micro text-[var(--color-text-muted)]">
                  {tf("results.cfTargetHint", locale, {
                    target: Math.round(component.target),
                    user: component.userValue,
                  })}{" "}
                  · {Math.round(component.weight * 100)}%
                </span>
              </span>
              <div className="h-2 min-w-[48px] flex-1 overflow-hidden rounded-full bg-[var(--color-border-soft)] md:min-w-[60px]">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${component.alignment}%`,
                    backgroundColor: fitColor(component.alignment),
                  }}
                />
              </div>
              <span className="ml-auto w-12 shrink-0 text-right text-micro text-[var(--color-text-muted)] md:w-16">
                {t(
                  component.position === "in"
                    ? "results.cfPositionIn"
                    : component.position === "over"
                      ? "results.cfPositionOver"
                      : "results.cfPositionUnder",
                  locale,
                )}
              </span>
            </div>
          ))}

          {/* Kétlépcsős rendezés: külön mondat arról, MIÉRT van a listán és
              miért ott van a sorrendben. */}
          {fit.orderedBy === "demandFit" && fit.choiceScore !== null && (
            <p className="rounded-[10px] bg-sage/5 p-2.5 text-micro leading-relaxed text-[var(--color-text-secondary)]">
              {tf("results.cfWhyInList", locale, { value: fit.choiceScore })}{" "}
              {fit.components[0] &&
                tf("results.cfWhyThisOrder", locale, {
                  // HU: kész névelős alak megy a sablonba („az Extraverzió").
                  dim: isHu
                    ? withHuArticle(dimLabel(fit.components[0].dim, isHu))
                    : dimLabel(fit.components[0].dim, isHu),
                  target: Math.round(fit.components[0].target),
                  user: fit.components[0].userValue,
                })}
            </p>
          )}

          {fit.flags.includes("h-floor") && (
            <p className="rounded-[10px] bg-[var(--color-surface-subtle)] p-2.5 text-micro leading-relaxed text-[var(--color-text-secondary)]">
              ⚖️ {t("results.cfHFloorNote", locale)}
            </p>
          )}
          {fit.flags.includes("above-target") && (
            <p className="text-micro leading-relaxed text-[var(--color-text-muted)]">
              {t("results.cfAboveTargetNote", locale)}
            </p>
          )}

          <div className="mt-1 border-t border-[var(--color-border-soft)] pt-2.5">
            {feedback === "sent" ? (
              <p className="text-[11px] text-state-success-fg">
                {t("results.industryFitFeedbackThanks", locale)}
              </p>
            ) : (
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <span className="text-[11px] text-[var(--color-text-secondary)]">
                  {t("results.industryFitFeedbackQ", locale)}
                </span>
                <div className="flex shrink-0 items-center gap-2">
                  <button
                    type="button"
                    onClick={() => sendFeedback("accurate")}
                    className="inline-flex min-h-[36px] items-center rounded-full border border-state-success-border bg-surface-card px-3 py-1 text-[11px] font-medium text-state-success-fg transition hover:bg-state-success-bg"
                  >
                    👍 {t("results.industryFitFeedbackYes", locale)}
                  </button>
                  <button
                    type="button"
                    onClick={() => sendFeedback("inaccurate")}
                    className="inline-flex min-h-[36px] items-center rounded-full border border-state-error-border bg-surface-card px-3 py-1 text-[11px] font-medium text-state-error-fg transition hover:bg-state-error-bg"
                  >
                    👎 {t("results.industryFitFeedbackNo", locale)}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Egy klaszter kártyái. A csoport tagjai egyenrangúak, de 5-nél többet nem
 * zúdítunk a felhasználóra: a többi egy kattintással nyílik.
 */
function ClusterCards({ cluster, hero }: { cluster: CareerFitView[]; hero: boolean }) {
  const { locale } = useLocale();
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? cluster : cluster.slice(0, 5);
  const hidden = cluster.length - visible.length;

  return (
    <div className="flex flex-col gap-3">
      {visible.map((fit, i) => (
        <OccupationCard
          key={fit.id}
          fit={fit}
          hero={hero && cluster.length === 1}
          delayMs={i * 60}
        />
      ))}
      {hidden > 0 && (
        <button
          type="button"
          onClick={() => setExpanded(true)}
          className={`self-start text-[12px] font-semibold text-[var(--color-accent-primary-strong)] transition hover:text-ink ${TEXT_TAP_TARGET}`}
        >
          {tf("results.cfClusterMore", locale, { count: hidden })} ▾
        </button>
      )}
      {expanded && cluster.length > 5 && (
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className={`self-start text-[12px] font-semibold text-[var(--color-text-muted)] transition hover:text-ink ${TEXT_TAP_TARGET}`}
        >
          {t("results.ccLessOptions", locale)} ▴
        </button>
      )}
    </div>
  );
}

/**
 * Egy szakasz (most elérhető / tanulással elérhető / végzettséged alatti).
 * A szakaszon belül a klaszterek sorrendje értelmes, a klaszteren belül nem.
 */
function CareerSection({
  title,
  hint,
  clusters,
  hero = false,
  collapsible = false,
}: {
  title: string;
  hint: string;
  clusters: CareerFitView[][];
  hero?: boolean;
  collapsible?: boolean;
}) {
  const { locale } = useLocale();
  const [open, setOpen] = useState(!collapsible);
  if (clusters.length === 0) return null;
  const count = clusters.reduce((sum, cluster) => sum + cluster.length, 0);

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-caption font-semibold text-[var(--color-text-primary)]">
          {title}{" "}
          <span className="font-normal text-[var(--color-text-muted)]">({count})</span>
        </p>
        {collapsible && (
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className={`text-[12px] font-semibold text-[var(--color-accent-primary-strong)] transition hover:text-ink ${TEXT_TAP_TARGET}`}
          >
            {open ? `${t("results.ccLessOptions", locale)} ▴` : `${t("results.cfSectionShow", locale)} ▾`}
          </button>
        )}
      </div>
      <p className="mt-0.5 text-micro leading-relaxed text-[var(--color-text-muted)]">{hint}</p>

      {open && (
        <div className="mt-3 flex flex-col gap-5">
          {clusters.map((cluster, index) => (
            <div key={cluster[0]?.id ?? index}>
              {cluster.length > 1 && (
                <p className="mb-2 text-micro text-[var(--color-text-muted)]">
                  {tf("results.cfClusterTie", locale, { count: cluster.length })} ·{" "}
                  {t("results.cfClusterOrder", locale)}
                </p>
              )}
              <ClusterCards cluster={cluster} hero={hero && index === 0} />
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export function CareerResults({
  result,
  onEditAnswers,
  onReset,
  onToggleScope,
  extra,
}: {
  result: CareerResultView;
  onEditAnswers?: () => void;
  /** Teljes visszaállítás: minden mentett válasz törlése (Holland-teszt is) */
  onReset?: () => Promise<void> | void;
  /** a bejelölt-terület szűrő ki/bekapcsolása */
  onToggleScope?: () => void;
  /** a wizard-hoz kötött kiegészítők (érdeklődés-kérdőív CTA, observer CTA) */
  extra?: React.ReactNode;
}) {
  const { locale } = useLocale();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetting, setResetting] = useState(false);
  const totalClusters =
    result.sections.atLevel.length +
    result.sections.belowLevel.length +
    result.sections.afterTraining.length;

  if (totalClusters === 0) {
    return (
      <p className="text-caption text-[var(--color-text-secondary)]">
        {t("results.cfEmpty", locale)}
      </p>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-[var(--color-text-primary)]">
          {t("results.cfTitle", locale)}
        </p>
        <div className="flex flex-wrap items-center gap-3">
          {onEditAnswers && (
            <button
              type="button"
              onClick={onEditAnswers}
              className={`text-[12px] font-semibold text-[var(--color-accent-primary-strong)] transition hover:text-ink ${TEXT_TAP_TARGET}`}
            >
              {t("results.ccEditAnswers", locale)}
            </button>
          )}
          {onReset && !confirmReset && (
            <button
              type="button"
              onClick={() => setConfirmReset(true)}
              className={`text-[12px] font-medium text-[var(--color-text-muted)] transition hover:text-ink ${TEXT_TAP_TARGET}`}
            >
              {t("results.cfReset", locale)}
            </button>
          )}
        </div>
      </div>

      {/* Teljes visszaállítás — kétlépcsős, mert minden mentett választ töröl */}
      {onReset && confirmReset && (
        <div className="mt-3 rounded-[12px] border border-state-warning-border bg-state-warning-bg/70 p-3.5">
          <p className="text-[12px] leading-relaxed text-accent-earth-strong">
            {t("results.cfResetConfirm", locale)}
          </p>
          <div className="mt-2.5 flex flex-wrap items-center gap-2">
            <button
              type="button"
              disabled={resetting}
              onClick={async () => {
                setResetting(true);
                try {
                  await onReset();
                } finally {
                  setResetting(false);
                  setConfirmReset(false);
                }
              }}
              className="min-h-[36px] rounded-lg bg-[var(--color-accent-primary)] px-3.5 text-[12px] font-semibold text-[var(--color-text-on-accent)] transition hover:bg-[var(--color-accent-primary-strong)] disabled:opacity-50"
            >
              {t(resetting ? "results.cfResetBusy" : "results.cfResetYes", locale)}
            </button>
            <button
              type="button"
              disabled={resetting}
              onClick={() => setConfirmReset(false)}
              className="min-h-[36px] rounded-lg border border-[var(--color-border-default)] bg-surface-card px-3.5 text-[12px] font-semibold text-[var(--color-text-secondary)] transition hover:text-ink"
            >
              {t("results.cfResetCancel", locale)}
            </button>
          </div>
        </div>
      )}

      {/* Profil-szintű mutatók: általános alap + a kép forrása */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[var(--color-surface-subtle)] px-2.5 py-1 text-micro text-[var(--color-text-secondary)]">
          {t(
            result.interestSource === "measured"
              ? "results.cfInterestMeasured"
              : result.interestSource === "tags"
                ? "results.cfInterestTags"
                : "results.cfInterestEstimated",
            locale,
          )}
        </span>
        {result.observerWeight > 0 && (
          <span className="rounded-full bg-[var(--color-surface-highlight-warm)] px-2.5 py-1 text-micro font-medium text-[var(--color-accent-primary-strong)]">
            {tf("results.cfObserverWeight", locale, {
              value: Math.round(result.observerWeight * 100),
            })}
          </span>
        )}
      </div>

      {/* A user Holland-kódja — enélkül nem látszik, mi alapján rangsorolunk */}
      {result.interests && (
        <div className="mt-3 rounded-[12px] border border-[var(--color-border-soft)] bg-[var(--color-surface-subtle)] p-3.5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
              {t("results.cfYourHolland", locale)}
            </span>
            <span className="rounded-full bg-sage/15 px-2.5 py-0.5 font-mono text-[12px] font-semibold text-sage-dark">
              {result.interests.top}
            </span>
            <span className="text-micro text-[var(--color-text-muted)]">
              {tf("results.cfHollandWeight", locale, {
                value: Math.round(result.interests.weight * 100),
              })}
            </span>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {(["R", "I", "A", "S", "E", "C"] as const).map((letter) => (
              <span
                key={letter}
                className="flex items-center gap-1.5 rounded-full bg-surface-card px-2 py-0.5 text-micro text-[var(--color-text-secondary)] ring-1 ring-[var(--color-border-soft)]"
                title={t(`results.cfHolland${letter}`, locale)}
              >
                <span className="font-mono font-semibold">{letter}</span>
                {result.interests?.vector[letter] ?? 0}
              </span>
            ))}
          </div>
          <ExplainerLink
            className="mt-3"
            label={t("results.hollandExplainerLabel", locale)}
            hint={t("results.hollandExplainerHint", locale)}
            href="/holland-kod"
          />
          {result.industryMismatch && (
            <p className="mt-2 text-micro leading-relaxed text-bronze-700">
              {t("results.cfIndustryMismatch", locale)}
            </p>
          )}
        </div>
      )}

      {/* Mi rendezi a listát — a jelszint-hierarchia kimondva */}
      <div className="mt-3 rounded-[10px] bg-[var(--color-surface-subtle)] p-2.5">
        <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
          {result.scope.active
            ? tf("results.cfStrategyScoped", locale, {
                areas: result.scope.keys
                  .map((key) => {
                    const industry = INDUSTRIES.find((entry) => entry.key === key);
                    return industry ? (locale === "hu" ? industry.hu : industry.en) : key;
                  })
                  .join(" + "),
              })
            : t(
                result.meta.strategy === "interest-led"
                  ? "results.cfStrategyInterestLed"
                  : "results.cfStrategyComposite",
                locale,
              )}
        </p>
        {result.scope.widened && (
          <p className="mt-1 text-micro leading-relaxed text-bronze-700">
            {t("results.cfScopeWidened", locale)}
          </p>
        )}
        {onToggleScope && result.scope.keys.length > 0 && (
          <button
            type="button"
            onClick={onToggleScope}
            className={`mt-1.5 text-[12px] font-semibold text-[var(--color-accent-primary-strong)] transition hover:text-ink ${TEXT_TAP_TARGET}`}
          >
            {t(
              result.scope.ignored
                ? "results.cfScopeToggleOn"
                : "results.cfScopeToggleOff",
              locale,
            )}
          </button>
        )}
      </div>

      {/* Vétók — a kizárás LÁTHATÓ: mit zártál ki, és hány szerep esett ki miatta */}
      {result.veto.keys.length > 0 && (
        <div className="mt-2 rounded-[10px] bg-[var(--color-surface-subtle)] p-2.5">
          <p className="text-[12px] leading-relaxed text-[var(--color-text-secondary)]">
            🚫{" "}
            {tf("results.cfVetoActive", locale, {
              list: result.veto.keys
                .map((key) => t(VETO_LABEL_KEYS[key] ?? key, locale))
                .join(" · "),
              count: result.veto.excluded,
            })}
          </p>
        </div>
      )}

      {result.interestDifferentiation === "low" && (
        <p className="mt-2 rounded-[10px] bg-state-warning-bg/70 p-2.5 text-micro leading-relaxed text-accent-earth-strong">
          {t("results.cfLowDifferentiation", locale)}
        </p>
      )}

      {extra}

      <CareerSection
        title={t("results.cfSectionAtLevel", locale)}
        hint={t("results.cfSectionAtLevelHint", locale)}
        clusters={result.sections.atLevel}
        hero
      />
      <CareerSection
        title={t("results.cfSectionTraining", locale)}
        hint={t("results.cfSectionTrainingHint", locale)}
        clusters={result.sections.afterTraining}
        collapsible
      />
      <CareerSection
        title={t("results.cfSectionBelow", locale)}
        hint={t("results.cfSectionBelowHint", locale)}
        clusters={result.sections.belowLevel}
        collapsible
      />

      {result.currentField.length > 0 && (
        <section className="mt-6">
          <p className="mb-2 font-mono text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
            {t("results.ccResultCurrent", locale)}
          </p>
          <div className="flex flex-col gap-3">
            {result.currentField.map((fit, i) => (
              <OccupationCard key={fit.id} fit={fit} hero={false} delayMs={i * 60} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-5 text-micro leading-relaxed text-[var(--color-text-muted)]">
        {tf("results.cfCatalogNote", locale, {
          count: result.meta.occupationCount,
          version: result.meta.catalogVersion,
        })}
      </p>
    </div>
  );
}

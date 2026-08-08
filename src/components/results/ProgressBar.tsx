"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { SELF_PAYWALL_ENABLED } from "@/lib/operating-mode";

interface ProgressBarProps {
  hasSelfPlus: boolean;
  observersSent: boolean;
  observersCompleted: boolean;
  sentCount: number;
  receivedCount: number;
  onNavigateToComparison?: () => void;
  onNavigateToInvites?: () => void;
}

// ─── Package card ────────────────────────────────────────────────────────────

interface PackageCardProps {
  name: string;
  price: string | null;
  oldPrice?: string | null;
  owned: boolean;
  recommended?: boolean;
  includes?: string | null;
  features: string[];
  buttonLabel: string;
  buttonStyle: "ghost" | "bronze" | "done";
  onButtonClick?: () => void;
  locale: "hu" | "en";
}

function PackageCard({
  name,
  price,
  oldPrice,
  owned,
  recommended,
  includes,
  features,
  buttonLabel,
  buttonStyle,
  onButtonClick,
  locale,
}: PackageCardProps) {
  return (
    <div
      className={[
        "flex flex-1 flex-col rounded-xl border-[1.5px] p-3.5 transition-all",
        owned && "border-[var(--color-action-primary-bg)] bg-[var(--color-surface-self-accent-soft)] opacity-70",
        recommended && !owned && "border-[var(--color-accent-primary)] bg-[var(--color-surface-highlight-warm)]",
        !owned && !recommended && "border-[var(--color-border-soft)] hover:-translate-y-px hover:border-[var(--color-action-primary-bg)]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {owned && (
        <span className="mb-1.5 inline-flex self-start rounded bg-[var(--color-action-primary-bg)] px-[7px] py-[2px] text-micro font-bold uppercase tracking-wide text-[var(--color-action-primary-fg)]">
          {t("progress.active", locale)}
        </span>
      )}
      {recommended && !owned && (
        <span className="mb-1.5 inline-flex self-start rounded bg-[var(--color-accent-primary)] px-[7px] py-[2px] text-micro font-bold uppercase tracking-wide text-[var(--color-text-on-accent)]">
          {t("progress.recommended", locale)}
        </span>
      )}

      <p className="font-fraunces text-body text-[var(--color-text-primary)]">{name}</p>

      {price && (
        <p className="font-fraunces text-lg text-[var(--color-text-primary)]">
          {oldPrice && (
            <span className="mr-1 text-caption text-[var(--color-text-muted)] line-through">
              {oldPrice}
            </span>
          )}
          <span className={oldPrice ? "text-[var(--color-accent-primary)]" : ""}>{price}</span>
        </p>
      )}
      {owned && (
        <p className="font-fraunces text-sm text-[var(--color-text-muted)]">
          {t("progress.owned", locale)}
        </p>
      )}

      {includes && (
        <span className="mt-1.5 inline-flex self-start rounded bg-[var(--color-surface-self-accent-soft)] px-2 py-1 text-micro font-medium text-[var(--color-action-primary-bg)]">
          {includes}
        </span>
      )}

      <div className="mt-2 flex flex-col gap-1">
        {features.map((f) => (
          <span key={f} className="text-[11px] text-[var(--color-text-secondary)]">
            <span className="mr-1 font-bold text-[var(--color-accent-self)]">✓</span>
            {f}
          </span>
        ))}
      </div>

      <button
        type="button"
        onClick={onButtonClick}
        disabled={buttonStyle === "done"}
        className={[
          "mt-3 min-h-[44px] w-full rounded-lg py-2 text-center text-[11px] font-semibold transition",
          buttonStyle === "bronze" &&
            "bg-[var(--color-accent-primary)] text-[var(--color-text-on-accent)] hover:brightness-110",
          buttonStyle === "ghost" &&
            "border border-[var(--color-border-soft)] bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-subtle)]",
          buttonStyle === "done" &&
            "cursor-default bg-[var(--color-surface-self-accent-soft)] text-[var(--color-accent-self-deep)]",
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {buttonLabel}
      </button>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function ProgressBar({
  hasSelfPlus,
  observersSent,
  observersCompleted,
  sentCount,
  receivedCount,
  onNavigateToComparison,
  onNavigateToInvites,
}: ProgressBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [upgradeLoading, setUpgradeLoading] = useState(false);
  const router = useRouter();
  const { locale } = useLocale();

  function handlePlusUpgrade() {
    if (upgradeLoading) return;
    setUpgradeLoading(true);
    router.push("/contact");
  }

  // Kikapcsolt paywallnál a csomag-lépés nem létezik a checklistben.
  const steps = [
    { key: "test", done: true },
    { key: "results", done: true },
    ...(SELF_PAYWALL_ENABLED ? [{ key: "package", done: hasSelfPlus }] : []),
    { key: "observers", done: hasSelfPlus && observersSent },
    { key: "feedback", done: hasSelfPlus && observersCompleted },
  ];
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);

  const nextStepText = t("progress.next", locale);
  const nextStepName = (() => {
    if (!hasSelfPlus)
      return t("progress.choosePlan", locale);
    if (!observersSent)
      return t("progress.sendFeedback", locale);
    if (!observersCompleted)
      return t("progress.waitFeedback", locale);
    return t("progress.profileDone", locale);
  })();

  const completedSteps = [
    {
      name: t("progress.stepTest", locale),
      desc: t("progress.stepTestDesc", locale),
    },
    {
      name: t("progress.stepResults", locale),
      desc: t("progress.stepResultsDesc", locale),
    },
  ];

  // Plus features
  const plusFeatures = [
    t("progress.plusFeature1", locale),
    t("progress.plusFeature2", locale),
    t("progress.plusFeature3", locale),
    t("progress.plusFeature4", locale),
    t("progress.plusFeature5", locale),
  ];

  return (
    <div className="overflow-hidden rounded-xl border-[1.5px] border-[var(--color-border-soft)] bg-surface-card">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[var(--color-surface-subtle)]"
      >
        <div className="flex-1">
          <div className="mb-1.5 flex justify-between">
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">
              {t("progress.title", locale)}
            </span>
            <span className="text-[11px] text-[var(--color-text-muted)]">
              {completed} / {total} {t("progress.done", locale)}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-sm bg-[var(--color-border-default)]">
            <div
              className="h-full rounded-sm bg-[var(--color-action-primary-bg)] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[var(--color-text-muted)]">
            {nextStepText}:{" "}
            <strong className="font-semibold text-[var(--color-action-primary-bg)]">
              {nextStepName}
            </strong>
          </p>
        </div>
        <svg
          className={`h-5 w-5 shrink-0 text-[var(--color-text-muted)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          viewBox="0 0 20 20"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M6 8l4 4 4-4" />
        </svg>
      </button>

      {/* Body */}
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: "auto" }}
            exit={{ height: 0 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--color-border-soft)]">
              {/* Completed steps */}
              {completedSteps.map((step) => (
                <div
                  key={step.name}
                  className="flex items-center gap-3 border-b border-[var(--color-border-soft)] px-5 py-3 opacity-65"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--color-action-primary-bg)] text-micro text-[var(--color-action-primary-fg)]">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="text-caption font-medium text-[var(--color-text-muted)] line-through">
                      {step.name}
                    </p>
                    <p className="text-[11px] text-[var(--color-text-muted)]">{step.desc}</p>
                  </div>
                  <span className="rounded bg-[var(--color-surface-self-accent-soft)] px-2 py-0.5 text-micro font-semibold text-[var(--color-accent-self-deep)]">
                    {t("progress.stepDone", locale)}
                  </span>
                </div>
              ))}

              {/* Csomag-blokk csak aktív paywall mellett */}
              {SELF_PAYWALL_ENABLED && (
                <>
                  {/* Divider */}
                  <div className="flex items-center gap-2.5 border-b border-[var(--color-border-soft)] px-5 py-2">
                    <div className="h-px flex-1 bg-[var(--color-border-default)]" />
                    <span className="text-micro uppercase tracking-widest text-[var(--color-text-muted)]">
                      {t("progress.deepenDivider", locale)}
                    </span>
                    <div className="h-px flex-1 bg-[var(--color-border-default)]" />
                  </div>

                  {/* Package card */}
                  <div className="flex gap-2.5 border-b border-[var(--color-border-soft)] px-5 py-3">
                    <PackageCard
                      name="Plus"
                      price={hasSelfPlus ? null : "€9"}
                      owned={hasSelfPlus}
                      recommended={!hasSelfPlus}
                      features={plusFeatures}
                      buttonLabel={
                        hasSelfPlus
                          ? t("progress.buttonActive", locale)
                          : t("progress.buttonUnlock", locale)
                      }
                      buttonStyle={hasSelfPlus ? "done" : "bronze"}
                      onButtonClick={hasSelfPlus ? undefined : handlePlusUpgrade}
                      locale={locale}
                    />
                  </div>
                </>
              )}

              {/* Observer step: send invitations */}
              <div
                className={`flex items-center gap-3 border-b border-[var(--color-border-soft)] px-5 py-3 ${!hasSelfPlus ? "opacity-45" : ""}`}
              >
                <div
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    observersSent
                      ? "bg-[var(--color-action-primary-bg)] text-micro text-[var(--color-action-primary-fg)]"
                      : hasSelfPlus
                        ? "border-2 border-[var(--color-accent-primary)]"
                        : "border-[1.5px] border-dashed border-[var(--color-border-soft)]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {observersSent && "✓"}
                </div>
                <div className="flex-1">
                  <p className="text-caption font-medium text-[var(--color-text-primary)]">
                    {t("progress.sendInvitations", locale)}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {hasSelfPlus
                      ? t("progress.sendInvitationsDesc", locale)
                      : t("progress.afterPlus", locale)}
                  </p>
                </div>
                {hasSelfPlus && !observersSent && (
                  <button
                    type="button"
                    onClick={onNavigateToInvites}
                    className="min-h-[44px] shrink-0 rounded-lg bg-[var(--color-action-primary-bg)] px-3.5 py-1.5 text-[11px] font-semibold text-[var(--color-action-primary-fg)]"
                  >
                    {t("progress.sendInvitationCta", locale)}
                  </button>
                )}
                {!hasSelfPlus && (
                  <button
                    type="button"
                    disabled
                    className="shrink-0 rounded-lg bg-[var(--color-border-default)] px-3.5 py-1.5 text-[11px] font-semibold text-[var(--color-text-muted)]"
                  >
                    {t("progress.availableAfterPlus", locale)}
                  </button>
                )}
              </div>

              {/* Observer step: receive feedback */}
              <div
                className={`flex items-center gap-3 px-5 py-3 ${!observersSent ? "opacity-45" : ""}`}
              >
                <div
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    observersCompleted
                      ? "bg-[var(--color-action-primary-bg)] text-micro text-[var(--color-action-primary-fg)]"
                      : observersSent
                        ? "border-2 border-[var(--color-accent-primary)]"
                        : "border-[1.5px] border-dashed border-[var(--color-border-soft)]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {observersCompleted && "✓"}
                </div>
                <div className="flex-1">
                  <p className="text-caption font-medium text-[var(--color-text-primary)]">
                    {t("progress.receiveFeedback", locale)}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-muted)]">
                    {observersSent
                      ? `${receivedCount} / ${sentCount} ${t("progress.feedbackReceived", locale)}`
                      : t("progress.afterSending", locale)}
                  </p>
                </div>
                {observersSent && !observersCompleted && (
                  <span className="text-[11px] font-medium text-[var(--color-accent-primary-strong)]">
                    {t("progress.waiting", locale)}
                  </span>
                )}
                {observersCompleted && (
                  <button
                    type="button"
                    onClick={onNavigateToComparison}
                    className="min-h-[44px] shrink-0 rounded-lg bg-[var(--color-action-primary-bg)] px-3.5 py-1.5 text-[11px] font-semibold text-[var(--color-action-primary-fg)]"
                  >
                    {t("progress.viewResults", locale)}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

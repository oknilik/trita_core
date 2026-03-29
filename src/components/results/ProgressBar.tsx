"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

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
  locale,
}: PackageCardProps) {
  return (
    <div
      className={[
        "flex flex-1 flex-col rounded-xl border-[1.5px] p-3.5 transition-all",
        owned && "border-[#3d6b5e] bg-[#e8f2f0] opacity-70",
        recommended && !owned && "border-[#c17f4a] bg-[#fdf5ee]",
        !owned && !recommended && "border-[#ddd5c8] hover:-translate-y-px hover:border-[#3d6b5e]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {owned && (
        <span className="mb-1.5 inline-flex self-start rounded bg-[#3d6b5e] px-[7px] py-[2px] text-[8px] font-bold uppercase tracking-wide text-white">
          {t("progress.active", locale)}
        </span>
      )}
      {recommended && !owned && (
        <span className="mb-1.5 inline-flex self-start rounded bg-[#c17f4a] px-[7px] py-[2px] text-[8px] font-bold uppercase tracking-wide text-white">
          {t("progress.recommended", locale)}
        </span>
      )}

      <p className="font-fraunces text-[15px] text-[#1a1a2e]">{name}</p>

      {price && (
        <p className="font-fraunces text-lg text-[#1a1a2e]">
          {oldPrice && (
            <span className="mr-1 text-[13px] text-[#8a8a9a] line-through">
              {oldPrice}
            </span>
          )}
          <span className={oldPrice ? "text-[#c17f4a]" : ""}>{price}</span>
        </p>
      )}
      {owned && (
        <p className="font-fraunces text-sm text-[#8a8a9a]">
          {t("progress.owned", locale)}
        </p>
      )}

      {includes && (
        <span className="mt-1.5 inline-flex self-start rounded bg-[#e8f2f0] px-2 py-1 text-[10px] font-medium text-[#3d6b5e]">
          {includes}
        </span>
      )}

      <div className="mt-2 flex flex-col gap-1">
        {features.map((f) => (
          <span key={f} className="text-[11px] text-[#4a4a5e]">
            <span className="mr-1 font-bold text-[#5a8f7f]">✓</span>
            {f}
          </span>
        ))}
      </div>

      <button
        type="button"
        className={[
          "mt-3 min-h-[44px] w-full rounded-lg py-2 text-center text-[11px] font-semibold transition",
          buttonStyle === "bronze" &&
            "bg-[#c17f4a] text-white hover:brightness-110",
          buttonStyle === "ghost" &&
            "border border-[#ddd5c8] bg-transparent text-[#8a8a9a] hover:bg-[#f2ede6]",
          buttonStyle === "done" &&
            "cursor-default bg-[#e8f2f0] text-[#1e3d34]",
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
  const { locale } = useLocale();

  const steps = [
    { key: "test", done: true },
    { key: "results", done: true },
    { key: "package", done: hasSelfPlus },
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
    <div className="overflow-hidden rounded-xl border-[1.5px] border-[#ddd5c8] bg-white">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#f2ede6]"
      >
        <div className="flex-1">
          <div className="mb-1.5 flex justify-between">
            <span className="text-xs font-semibold text-[#1a1a2e]">
              {t("progress.title", locale)}
            </span>
            <span className="text-[11px] text-[#8a8a9a]">
              {completed} / {total} {t("progress.done", locale)}
            </span>
          </div>
          <div className="h-1 w-full overflow-hidden rounded-sm bg-[#e8e0d3]">
            <div
              className="h-full rounded-sm bg-[#3d6b5e] transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
          <p className="mt-1.5 text-[11px] text-[#8a8a9a]">
            {nextStepText}:{" "}
            <strong className="font-semibold text-[#3d6b5e]">
              {nextStepName}
            </strong>
          </p>
        </div>
        <svg
          className={`h-5 w-5 shrink-0 text-[#8a8a9a] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
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
            <div className="border-t border-[#ddd5c8]">
              {/* Completed steps */}
              {completedSteps.map((step) => (
                <div
                  key={step.name}
                  className="flex items-center gap-3 border-b border-[#ddd5c8] px-5 py-3 opacity-65"
                >
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3d6b5e] text-[10px] text-white">
                    ✓
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-medium text-[#8a8a9a] line-through">
                      {step.name}
                    </p>
                    <p className="text-[11px] text-[#8a8a9a]">{step.desc}</p>
                  </div>
                  <span className="rounded bg-[#e8f2f0] px-2 py-0.5 text-[9px] font-semibold text-[#1e3d34]">
                    {t("progress.stepDone", locale)}
                  </span>
                </div>
              ))}

              {/* Divider */}
              <div className="flex items-center gap-2.5 border-b border-[#ddd5c8] px-5 py-2">
                <div className="h-px flex-1 bg-[#e8e0d3]" />
                <span className="text-[9px] uppercase tracking-widest text-[#8a8a9a]">
                  {t("progress.deepenDivider", locale)}
                </span>
                <div className="h-px flex-1 bg-[#e8e0d3]" />
              </div>

              {/* Package card */}
              <div className="flex gap-2.5 border-b border-[#ddd5c8] px-5 py-3">
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
                  locale={locale}
                />
              </div>

              {/* Observer step: send invitations */}
              <div
                className={`flex items-center gap-3 border-b border-[#ddd5c8] px-5 py-3 ${!hasSelfPlus ? "opacity-45" : ""}`}
              >
                <div
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    observersSent
                      ? "bg-[#3d6b5e] text-[10px] text-white"
                      : hasSelfPlus
                        ? "border-2 border-[#c17f4a]"
                        : "border-[1.5px] border-dashed border-[#ddd5c8]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {observersSent && "✓"}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[#1a1a2e]">
                    {t("progress.sendInvitations", locale)}
                  </p>
                  <p className="text-[11px] text-[#8a8a9a]">
                    {hasSelfPlus
                      ? t("progress.sendInvitationsDesc", locale)
                      : t("progress.afterPlus", locale)}
                  </p>
                </div>
                {hasSelfPlus && !observersSent && (
                  <button
                    type="button"
                    onClick={onNavigateToInvites}
                    className="min-h-[44px] shrink-0 rounded-lg bg-[#3d6b5e] px-3.5 py-1.5 text-[11px] font-semibold text-white"
                  >
                    {t("progress.sendInvitationCta", locale)}
                  </button>
                )}
                {!hasSelfPlus && (
                  <button
                    type="button"
                    disabled
                    className="shrink-0 rounded-lg bg-[#e8e0d3] px-3.5 py-1.5 text-[11px] font-semibold text-[#8a8a9a]"
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
                      ? "bg-[#3d6b5e] text-[10px] text-white"
                      : observersSent
                        ? "border-2 border-[#c17f4a]"
                        : "border-[1.5px] border-dashed border-[#ddd5c8]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {observersCompleted && "✓"}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[#1a1a2e]">
                    {t("progress.receiveFeedback", locale)}
                  </p>
                  <p className="text-[11px] text-[#8a8a9a]">
                    {observersSent
                      ? `${receivedCount} / ${sentCount} ${t("progress.feedbackReceived", locale)}`
                      : t("progress.afterSending", locale)}
                  </p>
                </div>
                {observersSent && !observersCompleted && (
                  <span className="text-[11px] font-medium text-[#c17f4a]">
                    {t("progress.waiting", locale)}
                  </span>
                )}
                {observersCompleted && (
                  <button
                    type="button"
                    onClick={onNavigateToComparison}
                    className="min-h-[44px] shrink-0 rounded-lg bg-[#3d6b5e] px-3.5 py-1.5 text-[11px] font-semibold text-white"
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

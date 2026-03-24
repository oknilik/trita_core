"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

interface ProgressBarProps {
  hasSelfPlus: boolean;
  hasSelfReflect: boolean;
  observersSent: boolean;
  observersCompleted: boolean;
  sentCount: number;
  receivedCount: number;
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
}: PackageCardProps) {
  return (
    <div
      className={[
        "flex flex-1 flex-col rounded-xl border-[1.5px] p-3.5 transition-all",
        owned && "border-[#3d6b5e] bg-[#e8f2f0] opacity-70",
        recommended && !owned && "border-[#c17f4a] bg-[#fdf5ee]",
        !owned && !recommended && "border-[#e8e0d3] hover:-translate-y-px hover:border-[#3d6b5e]",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {owned && (
        <span className="mb-1.5 inline-flex self-start rounded bg-[#3d6b5e] px-[7px] py-[2px] text-[8px] font-bold uppercase tracking-wide text-white">
          {t("progress.active", "hu")}
        </span>
      )}
      {recommended && !owned && (
        <span className="mb-1.5 inline-flex self-start rounded bg-[#c17f4a] px-[7px] py-[2px] text-[8px] font-bold uppercase tracking-wide text-white">
          {t("progress.recommended", "hu")}
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
          {t("progress.owned", "hu")}
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
            "border border-[#e8e0d3] bg-transparent text-[#8a8a9a] hover:bg-[#f2ede6]",
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
  hasSelfReflect,
  observersSent,
  observersCompleted,
  sentCount,
  receivedCount,
}: ProgressBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { locale } = useLocale();
  const isHu = locale === "hu";

  const steps = [
    { key: "test", done: true },
    { key: "results", done: true },
    { key: "package", done: hasSelfPlus || hasSelfReflect },
    { key: "observers", done: hasSelfReflect && observersSent },
    { key: "feedback", done: hasSelfReflect && observersCompleted },
  ];
  const completed = steps.filter((s) => s.done).length;
  const total = steps.length;
  const pct = Math.round((completed / total) * 100);

  const nextStepText = isHu ? "Következő" : "Next";
  const nextStepName = (() => {
    if (!hasSelfPlus && !hasSelfReflect)
      return isHu ? "válassz csomagot" : "choose a plan";
    if (!hasSelfReflect)
      return isHu
        ? "Self Reflect feloldás — csak €7"
        : "Unlock Self Reflect — only €7";
    if (!observersSent)
      return isHu
        ? "visszajelzési meghívók küldése"
        : "send feedback invitations";
    if (!observersCompleted)
      return isHu
        ? "visszajelzések beérkezése"
        : "waiting for feedback";
    return isHu ? "profilod kész!" : "profile complete!";
  })();

  const completedSteps = [
    {
      name: isHu ? "Teszt kitöltése" : "Complete the assessment",
      desc: isHu ? "A személyiségteszted eredménye elkészült" : "Your personality assessment results are ready",
    },
    {
      name: isHu ? "Eredmény megtekintése" : "View results",
      desc: isHu ? "Áttekinted a fő dimenziókat" : "You reviewed the key dimensions",
    },
  ];

  // Plus features
  const plusFeatures = isHu
    ? ["25 alskála részletesen", "Karrierillesztés", "Fejlődési fókusz"]
    : ["25 facets in detail", "Career fit", "Growth focus"];
  const reflectFeatures = isHu
    ? ["Observer visszajelzés", "Vakfolt elemzés", "Önkép vs. mások képe"]
    : ["Observer feedback", "Blind spot analysis", "Self-image vs. others"];

  // Reflect pricing logic
  const reflectPrice = hasSelfReflect
    ? null
    : hasSelfPlus
      ? "€7"
      : "€12";
  const reflectOldPrice =
    hasSelfPlus && !hasSelfReflect ? "€12" : null;
  const reflectIncludes = hasSelfReflect
    ? null
    : !hasSelfPlus
      ? (isHu ? "Tartalmazza a Self Plus-t is" : "Includes Self Plus")
      : (isHu ? "€5 kedvezmény, mert van Plus-od" : "€5 discount because you have Plus");

  return (
    <div className="overflow-hidden rounded-[14px] border-[1.5px] border-[#e8e0d3] bg-white">
      {/* Header */}
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className="flex w-full cursor-pointer items-center gap-3 px-5 py-3.5 text-left transition-colors hover:bg-[#f2ede6]"
      >
        <div className="flex-1">
          <div className="mb-1.5 flex justify-between">
            <span className="text-xs font-semibold text-[#1a1a2e]">
              {isHu ? "Profilod készülőben" : "Your profile is in progress"}
            </span>
            <span className="text-[11px] text-[#8a8a9a]">
              {completed} / {total} {isHu ? "kész" : "done"}
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
            <div className="border-t border-[#e8e0d3]">
              {/* Completed steps */}
              {completedSteps.map((step) => (
                <div
                  key={step.name}
                  className="flex items-center gap-3 border-b border-[#e8e0d3] px-5 py-3 opacity-65"
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
                    {isHu ? "Kész" : "Done"}
                  </span>
                </div>
              ))}

              {/* Divider */}
              <div className="flex items-center gap-2.5 border-b border-[#e8e0d3] px-5 py-2">
                <div className="h-px flex-1 bg-[#e8e0d3]" />
                <span className="text-[9px] uppercase tracking-widest text-[#8a8a9a]">
                  {isHu ? "Mélyíts a profilodon" : "Deepen your profile"}
                </span>
                <div className="h-px flex-1 bg-[#e8e0d3]" />
              </div>

              {/* Package cards */}
              <div className="flex gap-2.5 border-b border-[#e8e0d3] px-5 py-3">
                <PackageCard
                  name="Self Plus"
                  price={hasSelfPlus ? null : "€7"}
                  owned={hasSelfPlus}
                  features={plusFeatures}
                  buttonLabel={
                    hasSelfPlus
                      ? (isHu ? "Aktív" : "Active")
                      : (isHu ? "Feloldom — €7" : "Unlock — €7")
                  }
                  buttonStyle={hasSelfPlus ? "done" : "ghost"}
                />
                <PackageCard
                  name="Self Reflect"
                  price={reflectPrice}
                  oldPrice={reflectOldPrice}
                  owned={hasSelfReflect}
                  recommended={!hasSelfReflect}
                  includes={reflectIncludes}
                  features={reflectFeatures}
                  buttonLabel={
                    hasSelfReflect
                      ? (isHu ? "Aktív" : "Active")
                      : hasSelfPlus
                        ? (isHu ? "Feloldom — €7" : "Unlock — €7")
                        : (isHu ? "Feloldom — €12" : "Unlock — €12")
                  }
                  buttonStyle={hasSelfReflect ? "done" : "bronze"}
                />
              </div>

              {/* Observer step: send invitations */}
              <div
                className={`flex items-center gap-3 border-b border-[#e8e0d3] px-5 py-3 ${!hasSelfReflect ? "opacity-45" : ""}`}
              >
                <div
                  className={[
                    "flex h-5 w-5 shrink-0 items-center justify-center rounded-full",
                    observersSent
                      ? "bg-[#3d6b5e] text-[10px] text-white"
                      : hasSelfReflect
                        ? "border-2 border-[#c17f4a]"
                        : "border-[1.5px] border-dashed border-[#e8e0d3]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {observersSent && "✓"}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[#1a1a2e]">
                    {isHu
                      ? "Visszajelzési meghívók küldése"
                      : "Send feedback invitations"}
                  </p>
                  <p className="text-[11px] text-[#8a8a9a]">
                    {hasSelfReflect
                      ? (isHu
                          ? "Kérd meg 2-3 kollégádat, hogy adjanak visszajelzést rólad"
                          : "Ask 2-3 colleagues to give feedback about you")
                      : (isHu
                          ? "Self Reflect feloldása után érhető el"
                          : "Available after unlocking Self Reflect")}
                  </p>
                </div>
                {hasSelfReflect && !observersSent && (
                  <button
                    type="button"
                    className="min-h-[44px] shrink-0 rounded-lg bg-[#3d6b5e] px-3.5 py-1.5 text-[11px] font-semibold text-white"
                  >
                    {isHu ? "Meghívó küldése →" : "Send invitation →"}
                  </button>
                )}
                {!hasSelfReflect && (
                  <button
                    type="button"
                    disabled
                    className="shrink-0 rounded-lg bg-[#e8e0d3] px-3.5 py-1.5 text-[11px] font-semibold text-[#8a8a9a]"
                  >
                    {isHu ? "Elérhető Reflect után" : "Available after Reflect"}
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
                        : "border-[1.5px] border-dashed border-[#e8e0d3]",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {observersCompleted && "✓"}
                </div>
                <div className="flex-1">
                  <p className="text-[13px] font-medium text-[#1a1a2e]">
                    {isHu
                      ? "Visszajelzések beérkezése és értelmezése"
                      : "Receive and interpret feedback"}
                  </p>
                  <p className="text-[11px] text-[#8a8a9a]">
                    {observersSent
                      ? `${receivedCount} / ${sentCount} ${isHu ? "visszajelzés érkezett" : "feedback received"}`
                      : (isHu
                          ? "Meghívók küldése után elérhető"
                          : "Available after sending invitations")}
                  </p>
                </div>
                {observersSent && !observersCompleted && (
                  <span className="text-[11px] font-medium text-[#c17f4a]">
                    {isHu ? "Várakozás..." : "Waiting..."}
                  </span>
                )}
                {observersCompleted && (
                  <button
                    type="button"
                    className="min-h-[44px] shrink-0 rounded-lg bg-[#3d6b5e] px-3.5 py-1.5 text-[11px] font-semibold text-white"
                  >
                    {isHu ? "Megnézem →" : "View →"}
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

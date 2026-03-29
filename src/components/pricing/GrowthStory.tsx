import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

const STEP_TYPES = ["free", "one-time", "one-time", "one-time", "subscription"];

const typeStyles: Record<string, string> = {
  free: "border-sand bg-white text-muted",
  "one-time": "border-sand bg-white text-ink-body",
  subscription: "border-sage/30 bg-sage-ghost text-bronze",
};

export function GrowthStory({ locale }: { locale: Locale }) {
  const steps = STEP_TYPES.map((type, i) => ({
    tier: t(`pricing.growthStep${i + 1}Tier`, locale),
    label: t(`pricing.growthStep${i + 1}Label`, locale),
    desc: t(`pricing.growthStep${i + 1}Desc`, locale),
    type,
  }));

  return (
    <section className="border-t border-sand px-6 py-12 lg:px-16 lg:py-14">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-px w-4 bg-[#c17f4a]" />
          <span className="text-[9px] font-medium uppercase tracking-[2px] text-[#c17f4a]">{t("pricing.growthEyebrow", locale)}</span>
        </div>
        <h2 className="mt-2 font-fraunces text-3xl text-ink md:text-4xl">
          {t("pricing.growthHeading", locale)}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-ink-body">{t("pricing.growthSub", locale)}</p>

        <div className="mt-8 flex flex-wrap items-center gap-2">
          {steps.map((step, i) => (
            <div key={step.label} className="flex items-center gap-2">
              <div
                className={`rounded-xl border p-4 ${typeStyles[step.type] ?? typeStyles["one-time"]}`}
              >
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {step.tier}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-ink">
                  {step.label}
                </p>
                <p className="mt-0.5 text-[11px] text-ink-body">{step.desc}</p>
              </div>
              {i < steps.length - 1 && (
                <span className="text-sand select-none" aria-hidden="true">
                  →
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

"use client";

import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";

export function InlineUpsell() {
  const { locale } = useLocale();

  const features = [
    t("results.upsellFeature1", locale),
    t("results.upsellFeature2", locale),
    t("results.upsellFeature3", locale),
    t("results.upsellFeature4", locale),
  ];

  return (
    <div
      className="mt-8 flex flex-col items-center gap-6 rounded-2xl px-8 py-7 sm:flex-row"
      style={{ background: "linear-gradient(135deg, var(--color-text-primary) 0%, var(--color-text-strong-deep) 100%)" }}
    >
      <div className="flex-1">
        <p className="mb-1.5 text-[9px] uppercase tracking-widest text-[var(--color-accent-primary-soft)]">
          Plus
        </p>
        <h3 className="mb-1.5 font-fraunces text-xl leading-tight text-white">
          {t("results.upsellTitle", locale)}
        </h3>
        <p className="mb-3 text-[13px] leading-relaxed text-white/[0.38]">
          {t("results.upsellDesc", locale)}
        </p>
        <div className="flex flex-wrap gap-4">
          {features.map((f) => (
            <span key={f} className="text-[11px] text-white/[0.45]">
              <span className="font-bold text-[var(--color-accent-self)]">✓</span> {f}
            </span>
          ))}
        </div>
      </div>
      <div className="flex shrink-0 flex-col items-center gap-2">
        <span className="font-fraunces text-[32px] tracking-tight text-white">€9</span>
        <span className="text-[10px] text-white/[0.25]">
          {t("results.upsellOnetime", locale)}
        </span>
        <button
          type="button"
          className="min-h-[44px] rounded-[11px] bg-[var(--color-accent-primary)] px-7 py-[13px] text-sm font-semibold text-white transition-all hover:-translate-y-px hover:brightness-110"
        >
          {t("results.upsellBuy", locale)}
        </button>
      </div>
    </div>
  );
}

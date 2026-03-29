import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

export function PricingHero({ locale }: { locale: Locale }) {
  return (
    <section className="px-5 pb-8 pt-10 lg:px-14 lg:pt-12">
      <div className="mx-auto max-w-5xl">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-px w-4 bg-[#c17f4a]" />
          <span className="text-[9px] font-medium uppercase tracking-[2px] text-[#c17f4a]">
            {t("pricing.heroEyebrow", locale)}
          </span>
        </div>
        <h1 className="mb-2 font-fraunces text-[24px] leading-[1.12] tracking-tight text-[#1a1a2e] lg:text-[34px]">
          {t("pricing.heroHeading", locale)}<em className="not-italic text-[#c17f4a]">{t("pricing.heroHeadingEm", locale)}</em>
        </h1>
        <p className="max-w-lg text-sm leading-relaxed text-[#8a8a9a]">
          {t("pricing.heroSub", locale)}
        </p>
      </div>
    </section>
  );
}

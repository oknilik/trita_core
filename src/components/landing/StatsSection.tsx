import { FadeIn } from "@/components/landing/FadeIn";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface StatsSectionProps {
  locale: Locale;
}

export function StatsSection({ locale }: StatsSectionProps) {
  return (
    <section className="border-y border-gray-100 bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <FadeIn>
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
              {t("landing.aboutTag", locale)}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900 md:text-3xl">
              {t("landing.aboutTitle", locale)}
            </h2>
            <p className="mx-auto mt-3 max-w-2xl text-sm text-gray-600">
              {t("landing.aboutBody", locale)}
            </p>
          </div>
        </FadeIn>

        <FadeIn delay={0.15}>
          <div className="grid grid-cols-3 divide-x divide-gray-200 overflow-hidden rounded-2xl border border-gray-100 bg-white">
            <div className="flex flex-col items-center justify-center px-4 py-6">
              <p className="text-3xl font-bold text-indigo-600 md:text-4xl">3</p>
              <p className="mt-1 text-center text-xs text-gray-500 md:text-sm">
                {t("landing.testTypes", locale)}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-6">
              <p className="text-3xl font-bold text-indigo-600 md:text-4xl">
                {t("landing.completionTimeValue", locale)}
              </p>
              <p className="mt-1 text-center text-xs text-gray-500 md:text-sm">
                {t("landing.completionTime", locale)}
              </p>
            </div>
            <div className="flex flex-col items-center justify-center px-4 py-6">
              <p className="text-3xl font-bold text-indigo-600 md:text-4xl">3</p>
              <p className="mt-1 text-center text-xs text-gray-500 md:text-sm">
                {t("landing.statsLanguages", locale)}
              </p>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}

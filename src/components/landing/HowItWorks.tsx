import { FadeIn } from "@/components/landing/FadeIn";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";

interface HowItWorksProps {
  locale: Locale;
}

const STEP_DOODLES = [
  "/doodles/sleek.svg",
  "/doodles/sitting-reading.svg",
  "/doodles/unboxing.svg",
];

export function HowItWorks({ locale }: HowItWorksProps) {
  const steps = [
    { title: t("landing.step1Title", locale), body: t("landing.step1Body", locale) },
    { title: t("landing.step2Title", locale), body: t("landing.step2Body", locale) },
    { title: t("landing.step3Title", locale), body: t("landing.step3Body", locale) },
  ];

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <FadeIn>
          <div className="mb-10 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
              {t("landing.howTag", locale)}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900 md:text-3xl">
              {t("landing.howTitle", locale)}
            </h2>
          </div>
        </FadeIn>

        <div className="relative">
          {/* Connecting line (desktop only) */}
          <div className="absolute left-[16.67%] right-[16.67%] top-6 hidden h-0.5 bg-indigo-100 md:block" />

          <div className="grid gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, i) => (
              <FadeIn key={i} delay={i * 0.15}>
                <div className="flex h-full flex-col items-center rounded-xl border border-indigo-100 bg-indigo-50/50 p-3 text-center md:border-0 md:bg-transparent md:p-0">
                  <div className="relative z-10 flex h-10 w-10 items-center justify-center rounded-full bg-indigo-600 text-base font-bold text-white shadow-lg shadow-indigo-200 md:h-12 md:w-12 md:text-lg">
                    {i + 1}
                  </div>

                  <div className="mt-4 h-36 w-full overflow-hidden rounded-xl bg-transparent py-2 md:bg-indigo-50/50">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={STEP_DOODLES[i]}
                      alt=""
                      className="h-full w-full object-contain"
                      loading="lazy"
                    />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-gray-900 md:text-lg">
                    {step.title}
                  </h3>
                  <p className="mt-2 text-sm text-gray-600">{step.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

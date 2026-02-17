"use client";

import { FadeIn } from "@/components/landing/FadeIn";
import { t } from "@/lib/i18n";
import { useLocale } from "@/components/LocaleProvider";

interface FeatureCardProps {
  title: string;
  description: string;
  doodle: string;
  large?: boolean;
}

function FeatureCard({ title, description, doodle, large }: FeatureCardProps) {
  return (
    <div className="flex h-full flex-col items-start gap-3 rounded-2xl border border-gray-100 bg-white p-6 shadow-lg transition-all duration-300 hover:border-indigo-100 hover:shadow-xl">
      <div
        className={`h-28 w-full overflow-hidden rounded-xl bg-indigo-50/50 ${large ? "md:h-32" : "md:h-20"}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={doodle}
          alt=""
          className="h-full w-full object-contain"
          loading="lazy"
        />
      </div>
      <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
      <p className="text-sm text-gray-600">{description}</p>
    </div>
  );
}

export function FeatureCards() {
  const { locale } = useLocale();
  const features = [
    {
      title: t("landing.feature1Title", locale),
      description: t("landing.feature1Desc", locale),
      doodle: "/doodles/reading-side.svg",
    },
    {
      title: t("landing.feature2Title", locale),
      description: t("landing.feature2Desc", locale),
      doodle: "/doodles/jumping.svg",
    },
    {
      title: t("landing.feature3Title", locale),
      description: t("landing.feature3Desc", locale),
      doodle: "/doodles/strolling.svg",
    },
    {
      title: t("landing.feature4Title", locale),
      description: t("landing.feature4Desc", locale),
      doodle: "/doodles/meditating.svg",
    },
    {
      title: t("landing.feature5Title", locale),
      description: t("landing.feature5Desc", locale),
      doodle: "/doodles/laying.svg",
    },
  ];

  return (
    <section className="bg-gray-50">
      <div className="mx-auto max-w-5xl px-4 py-12 md:py-16">
        <FadeIn>
          <div className="mb-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-indigo-500">
              {t("landing.featuresTag", locale)}
            </p>
            <h2 className="mt-3 text-2xl font-semibold text-gray-900 md:text-3xl">
              {t("landing.featuresTitle", locale)}
            </h2>
          </div>
        </FadeIn>

        <div className="flex flex-col gap-4">
          {/* Top row: 2 larger cards */}
          <div className="grid gap-4 md:grid-cols-2">
            {features.slice(0, 2).map((f, i) => (
              <FadeIn key={f.title} delay={i * 0.1}>
                <FeatureCard {...f} large />
              </FadeIn>
            ))}
          </div>
          {/* Bottom row: 3 cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {features.slice(2).map((f, i) => (
              <FadeIn key={f.title} delay={(i + 2) * 0.1}>
                <FeatureCard {...f} />
              </FadeIn>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

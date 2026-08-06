"use client";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n";
import { Reveal } from "@/components/landing/Reveal";
import type { SiteMode } from "@/components/landing/ModeSwitcher";

export function Features({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();
  const accentColor = mode === "self" ? "var(--color-accent-primary)" : "var(--color-action-primary-bg)";

  const features = mode === "self"
    ? [
        { badge: t("landing.selfFeat1Badge", locale), title: t("landing.selfFeat1Title", locale), desc: t("landing.selfFeat1Desc", locale), featured: true },
        { badge: t("landing.selfFeat2Badge", locale), title: t("landing.selfFeat2Title", locale), desc: t("landing.selfFeat2Desc", locale), featured: false },
        { badge: t("landing.selfFeat3Badge", locale), title: t("landing.selfFeat3Title", locale), desc: t("landing.selfFeat3Desc", locale), featured: false },
      ]
    : [
        { badge: t("landing.teamFeat1Badge", locale), title: t("landing.teamFeat1Title", locale), desc: t("landing.teamFeat1Desc", locale), featured: true },
        { badge: t("landing.teamFeat2Badge", locale), title: t("landing.teamFeat2Title", locale), desc: t("landing.teamFeat2Desc", locale), featured: false },
        { badge: t("landing.teamFeat3Badge", locale), title: t("landing.teamFeat3Title", locale), desc: t("landing.teamFeat3Desc", locale), featured: false },
      ];

  return (
    <section className="px-7 py-12 md:py-20">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-8 text-center md:mb-16">
          <h2 className="font-fraunces text-fluid-title font-medium tracking-tight text-ink">
            {t("landing.featuresTitleBefore", locale)}
            <em className="italic" style={{ color: accentColor }}>{t("landing.featuresTitleEm", locale)}</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 0.08}
              className={[
                // A korábbi framer `whileHover={{ y: -4 }}` CSS-ben: ugyanaz a
                // 4px-es emelés, ugyanaz a 0.2s — layout-tulajdonság nélkül.
                // FONTOS: a Tailwind v4 `-translate-y-*` NEM a `transform`, hanem
                // az önálló `translate` property-t írja, ezért a transition-listán
                // is `translate`-nek kell szerepelnie — `transform`-mal az emelés
                // átmenet nélkül, ugrásszerűen történne.
                "flex flex-col rounded-2xl border border-[var(--color-border-default)] p-7 shadow-sm transition-[translate,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(26,26,46,0.06)]",
                f.featured ? "bg-[var(--color-surface-subtle)]" : "bg-white",
                i === 0 ? "lg:col-span-1" : "",
              ].join(" ")}
            >
              <span
                className="mb-4 self-start rounded px-2 py-0.5 text-micro font-semibold uppercase tracking-wide"
                style={{ background: `${accentColor}15`, color: accentColor }}
              >
                {f.badge}
              </span>
              <h3 className="font-fraunces mb-2 text-lg text-ink">{f.title}</h3>
              <p className="flex-1 text-caption leading-relaxed text-ink-body">{f.desc}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

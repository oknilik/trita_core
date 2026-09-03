"use client";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { Reveal } from "@/components/landing/Reveal";
import type { SiteMode } from "@/components/landing/types";

export function Features({ mode }: { mode: SiteMode }) {
  const { locale } = useLocale();
  const accentColor = mode === "self" ? "var(--color-accent-primary)" : "var(--color-action-primary-bg)";

  const features = mode === "self"
    ? [
        { badge: t("landing.selfFeat1Badge", locale), title: t("landing.selfFeat1Title", locale), desc: t("landing.selfFeat1Desc", locale) },
        { badge: t("landing.selfFeat2Badge", locale), title: t("landing.selfFeat2Title", locale), desc: t("landing.selfFeat2Desc", locale) },
        { badge: t("landing.selfFeat3Badge", locale), title: t("landing.selfFeat3Title", locale), desc: t("landing.selfFeat3Desc", locale) },
      ]
    : [
        { badge: t("landing.teamFeat1Badge", locale), title: t("landing.teamFeat1Title", locale), desc: t("landing.teamFeat1Desc", locale) },
        { badge: t("landing.teamFeat2Badge", locale), title: t("landing.teamFeat2Title", locale), desc: t("landing.teamFeat2Desc", locale) },
        { badge: t("landing.teamFeat3Badge", locale), title: t("landing.teamFeat3Title", locale), desc: t("landing.teamFeat3Desc", locale) },
      ];

  return (
    <section className="px-7 py-16 md:py-24">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-10 text-center md:mb-14">
          <h2 className="font-fraunces text-fluid-title font-medium tracking-tight text-ink">
            {t(mode === "self" ? "landing.featuresTitleBefore" : "landing.teamFeaturesTitleBefore", locale)}
            <em className="italic" style={{ color: accentColor }}>{t("landing.featuresTitleEm", locale)}</em>
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {features.map((f, i) => (
            <Reveal
              key={f.title}
              delay={i * 0.08}
              // A korábbi framer `whileHover={{ y: -4 }}` CSS-ben: ugyanaz a
              // 4px-es emelés, ugyanaz a 0.2s — layout-tulajdonság nélkül.
              // FONTOS: a Tailwind v4 `-translate-y-*` NEM a `transform`, hanem
              // az önálló `translate` property-t írja, ezért a transition-listán
              // is `translate`-nek kell szerepelnie — `transform`-mal az emelés
              // átmenet nélkül, ugrásszerűen történne.
              // A három kártya EGYFORMA hátteret kap (2026-09-03): az első
              // kiemelése színben rangsort sugallt a három egyenrangú réteg közt.
              className="flex flex-col rounded-[24px] border border-[var(--color-border-default)] bg-surface-card p-7 shadow-sm transition-[translate,box-shadow] duration-200 hover:-translate-y-1 hover:shadow-[0_12px_32px_rgba(26,26,46,0.06)]"
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

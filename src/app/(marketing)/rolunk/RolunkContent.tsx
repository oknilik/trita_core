"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { PageWidthDivider } from "@/components/marketing/PageWidthDivider";
import { MarketingActions } from "@/components/marketing/MarketingActions";
import { EditorialArt, SectionTransition, artKeyFrom } from "@/components/ui/EditorialArt";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { t } from "@/lib/i18n/public";

export function RolunkContent() {
  const { locale } = useLocale();

  const principles = [
    { title: t("aboutUs.how1Title", locale), desc: t("aboutUs.how1Desc", locale) },
    { title: t("aboutUs.how2Title", locale), desc: t("aboutUs.how2Desc", locale) },
    { title: t("aboutUs.how3Title", locale), desc: t("aboutUs.how3Desc", locale) },
  ];

  return (
    <main className="bg-cream text-ink selection:bg-bronze/20">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-[1120px] px-7 pb-16 pt-12 md:pb-24 md:pt-20">
          <SectionEyebrow className="mb-6">{t("aboutUs.heroEyebrow", locale)}</SectionEyebrow>

          <h1 className="max-w-[24ch] font-fraunces text-[clamp(2.4rem,6vw,4.2rem)] leading-[1.02] tracking-tight text-ink">
            {t("aboutUs.heroTitleBefore", locale)}
            <em className="not-italic text-[var(--color-accent-primary-strong)]">
              {t("aboutUs.heroTitleEm", locale)}
            </em>
          </h1>

          <p className="mt-6 max-w-[640px] text-lg leading-[1.8] text-ink-body md:text-heading">
            {t("aboutUs.heroLead", locale)}
          </p>

          {/* Szabad konstelláció — dekoráció, nem állít semmit. */}
          <EditorialArt
            artKey={artKeyFrom("rolunk", "hero")}
            width={720}
            height={150}
            quiet
            className="mt-10 max-w-[720px]"
          />
        </div>
      </section>

      {/* ── Miért építjük ──────────────────────────────────────────── */}
      <EditorialSection
        eyebrow={t("aboutUs.storyEyebrow", locale)}
        title={t("aboutUs.storyTitle", locale)}
      >
        <div className="grid max-w-[62ch] gap-6">
          <p className="text-base leading-8 text-ink-body md:text-lg md:leading-[1.85]">
            {t("aboutUs.storyP1", locale)}
          </p>
          <p className="text-base leading-8 text-ink-body md:text-lg md:leading-[1.85]">
            {t("aboutUs.storyP2", locale)}
          </p>
          <p className="text-base leading-8 text-ink-body md:text-lg md:leading-[1.85]">
            {t("aboutUs.storyP3", locale)}
          </p>
        </div>
      </EditorialSection>

      {/* ── Így dolgozunk ──────────────────────────────────────────── */}
      <EditorialSection eyebrow={t("aboutUs.howEyebrow", locale)} title={t("aboutUs.howTitle", locale)}>
        <div className="grid gap-5 md:grid-cols-3">
          {principles.map((item) => (
            <article
              key={item.title}
              className="rounded-[24px] border border-sand bg-surface-card p-6 shadow-[0_16px_40px_rgba(26,26,46,0.04)]"
            >
              <h3 className="font-fraunces text-title leading-tight text-ink">{item.title}</h3>
              <p className="mt-3 text-base leading-8 text-ink-body">{item.desc}</p>
            </article>
          ))}
        </div>
      </EditorialSection>

      <div>
        <PageWidthDivider />
        <div className="py-10 md:py-12">
          <SectionTransition artKey={artKeyFrom("rolunk", "cta")} />
        </div>
      </div>

      {/* ── Záró CTA ───────────────────────────────────────────────── */}
      <section>
        <div className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
          <div className="rounded-[28px] border border-sand bg-surface-card px-6 py-10 text-center shadow-[0_24px_60px_rgba(26,26,46,0.06)] md:px-12">
            <h2 className="mx-auto max-w-[22ch] font-fraunces text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-tight text-ink">
              {t("aboutUs.ctaTitle", locale)}
            </h2>
            <p className="mx-auto mt-5 max-w-[52ch] text-base leading-8 text-ink-body">
              {t("aboutUs.ctaBody", locale)}
            </p>
            <MarketingActions
              className="mt-8"
              align="center"
              primary={{ href: "/contact", label: t("aboutUs.ctaPrimary", locale) }}
              secondary={{ href: "/about", label: t("aboutUs.ctaSecondary", locale) }}
            />
          </div>
        </div>
      </section>
    </main>
  );
}

function EditorialSection({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <PageWidthDivider />
      <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-16 md:py-24 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
        </div>
        <div>
          <h2 className="max-w-[20ch] font-fraunces text-[clamp(2.1rem,4.5vw,3.2rem)] leading-[1.04] tracking-tight text-ink">
            {title}
          </h2>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

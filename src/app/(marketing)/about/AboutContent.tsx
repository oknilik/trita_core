"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { EditorialArt, SectionTransition, artKeyFrom } from "@/components/ui/EditorialArt";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { LayerDiagram, PathDiagram, PurposeDiagram } from "@/components/about/AboutDiagrams";
import { t } from "@/lib/i18n/public";

export function AboutContent() {
  const { locale } = useLocale();

  const layers = [
    {
      number: "01",
      title: t("about.layer1Title", locale),
      desc: t("about.layer1Desc", locale),
      tag: t("about.layer1Tag", locale),
    },
    {
      number: "02",
      title: t("about.layer2Title", locale),
      desc: t("about.layer2Desc", locale),
      tag: t("about.layer2Tag", locale),
    },
    {
      number: "03",
      title: t("about.layer3Title", locale),
      desc: t("about.layer3Desc", locale),
      tag: t("about.layer3Tag", locale),
    },
    {
      number: "04",
      title: t("about.layer4Title", locale),
      desc: t("about.layer4Desc", locale),
      tag: t("about.layer4Tag", locale),
    },
  ];

  const pathSteps = [
    { title: t("about.path1Title", locale), desc: t("about.path1Desc", locale) },
    { title: t("about.path2Title", locale), desc: t("about.path2Desc", locale) },
    { title: t("about.path3Title", locale), desc: t("about.path3Desc", locale) },
    { title: t("about.path4Title", locale), desc: t("about.path4Desc", locale) },
  ];

  const values = [
    { title: t("about.value1Title", locale), desc: t("about.value1Desc", locale) },
    { title: t("about.value2Title", locale), desc: t("about.value2Desc", locale) },
    { title: t("about.value3Title", locale), desc: t("about.value3Desc", locale) },
    { title: t("about.value4Title", locale), desc: t("about.value4Desc", locale) },
  ];

  return (
    <main className="bg-cream text-ink selection:bg-bronze/20">
      {/* ── Hero ───────────────────────────────────────────────────── */}
      <section className="border-b border-sand">
        <div className="mx-auto max-w-[1120px] px-7 pb-14 pt-12 md:pb-20 md:pt-20">
          <div className="grid gap-10 lg:grid-cols-[minmax(0,1.05fr)_380px] lg:items-start">
            <div>
              <SectionEyebrow className="mb-6">{t("about.heroEyebrow", locale)}</SectionEyebrow>

              <h1 className="max-w-[13ch] font-fraunces text-[clamp(2.6rem,7vw,4.6rem)] leading-[1.0] tracking-tight text-ink">
                {t("about.heroTitleBefore", locale)}
                <em className="not-italic text-[var(--color-accent-primary-strong)]">
                  {t("about.heroTitleEm", locale)}
                </em>
              </h1>

              <p className="mt-6 max-w-[620px] text-lg leading-[1.8] text-ink-body md:text-[19px]">
                {t("about.heroBody", locale)}
              </p>
              <p className="mt-4 max-w-[620px] text-base leading-8 text-ink-body/85">
                {t("about.heroLead", locale)}
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
                <Link
                  href="/contact"
                  className={getButtonClassName({ size: "lg", className: "min-h-[54px] px-7 text-base" })}
                >
                  {t("about.heroCtaPrimary", locale)}
                </Link>
                <Link
                  href="/try"
                  className={getButtonClassName({
                    variant: "secondary",
                    size: "lg",
                    className: "min-h-[54px] px-7 text-base",
                  })}
                >
                  {t("about.heroCtaSecondary", locale)}
                </Link>
              </div>

              <div className="mt-6 flex flex-wrap gap-2.5">
                <MetaChip>{t("about.heroChip1", locale)}</MetaChip>
                <MetaChip>{t("about.heroChip2", locale)}</MetaChip>
                <MetaChip>{t("about.heroChip3", locale)}</MetaChip>
              </div>
            </div>

            <aside className="overflow-hidden rounded-[24px] border border-sand bg-surface-card shadow-[0_24px_60px_rgba(26,26,46,0.06)]">
              {/* Szabad konstelláció — itt DEKORÁCIÓ, nem magyaráz semmit.
                  Az oldal saját, jelentést hordozó ábrái lentebb élnek. */}
              <div className="border-b border-sand bg-warm px-6 pb-2 pt-6">
                <EditorialArt
                  artKey={artKeyFrom("about", "hero")}
                  width={400}
                  height={132}
                  className="mx-auto max-w-[320px]"
                />
              </div>
              <div className="px-6 py-6">
                <SectionEyebrow>{t("about.asideEyebrow", locale)}</SectionEyebrow>
                <p className="mt-3 font-fraunces text-[26px] leading-tight text-ink">
                  {t("about.asideTitle", locale)}
                </p>
                <p className="mt-3 text-sm leading-7 text-ink-body">{t("about.asideBody", locale)}</p>
                <Link
                  href="/rolunk"
                  className="mt-4 inline-flex min-h-[44px] items-center font-medium text-[var(--color-accent-primary-strong)] transition-colors hover:text-bronze"
                >
                  {t("about.asideLink", locale)}
                </Link>
              </div>
            </aside>
          </div>
        </div>
      </section>

      {/* ── Kinek szól ─────────────────────────────────────────────────
          Korán jön, mert a látogató első kérdése nem a módszertan, hanem
          hogy „ez nekem szól-e". A két kártya a két réteg-színt viszi
          (self = zsálya, team = réteg-bronz), ahogy a journey is. */}
      <EditorialSection
        eyebrow={t("about.audienceEyebrow", locale)}
        title={t("about.audienceTitle", locale)}
      >
        <div className="grid gap-5 md:grid-cols-2">
          <article className="flex flex-col rounded-[24px] border border-sage/15 bg-sage-soft px-6 py-6">
            <SectionEyebrow tone="self">{t("about.audienceSelfTitle", locale)}</SectionEyebrow>
            <p className="mt-3 flex-1 text-base leading-8 text-ink-body">
              {t("about.audienceSelfDesc", locale)}
            </p>
            {/* A soft-zsálya alapon a világosabb text-sage kontrasztja kevés —
                itt a sötét árnyalat az alap, a hover világosít. */}
            <Link
              href="/try"
              className="mt-4 inline-flex min-h-[44px] items-center self-start font-medium text-sage-dark transition-colors hover:text-sage"
            >
              {t("about.audienceSelfCta", locale)}
            </Link>
          </article>

          <article className="flex flex-col rounded-[24px] border border-sand bg-surface-card px-6 py-6 shadow-[0_16px_40px_rgba(26,26,46,0.04)]">
            <SectionEyebrow tone="team">{t("about.audienceTeamTitle", locale)}</SectionEyebrow>
            <p className="mt-3 flex-1 text-base leading-8 text-ink-body">
              {t("about.audienceTeamDesc", locale)}
            </p>
            <Link
              href="/contact"
              className="mt-4 inline-flex min-h-[44px] items-center self-start font-medium text-[var(--color-accent-primary-strong)] transition-colors hover:text-bronze"
            >
              {t("about.audienceTeamCta", locale)}
            </Link>
          </article>
        </div>
      </EditorialSection>

      <div className="border-t border-sand py-10 md:py-12">
        <SectionTransition artKey={artKeyFrom("about", "build")} />
      </div>

      {/* ── Hogyan épül fel — rétegábra ────────────────────────────── */}
      <section id="felepites" className="border-t border-sand">
        <div className="mx-auto max-w-[1120px] px-7 py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <SectionEyebrow>{t("about.buildEyebrow", locale)}</SectionEyebrow>
            </div>
            <div>
              <h2 className="max-w-[16ch] font-fraunces text-[clamp(2.1rem,4.5vw,3.4rem)] leading-[1.02] tracking-tight text-ink">
                {t("about.buildTitle", locale)}
              </h2>
              <p className="mt-5 max-w-[58ch] text-base leading-8 text-ink-body">
                {t("about.buildLead", locale)}
              </p>

              <div className="mt-9 grid gap-8 lg:grid-cols-[260px_minmax(0,1fr)] lg:items-start lg:gap-10">
                {/* Az ábra asztalon együtt görget a listával — a négy kártya
                    pont a négy csomópontot mondja el szavakkal. */}
                <div className="rounded-[24px] border border-sand bg-warm px-6 py-7 lg:sticky lg:top-24">
                  <LayerDiagram
                    label={t("about.buildDiagramAlt", locale)}
                    className="mx-auto max-w-[240px]"
                  />
                </div>

                <div className="grid gap-4">
                  {layers.map((layer) => (
                    <article
                      key={layer.number}
                      className="rounded-[22px] border border-sand bg-surface-card p-6 shadow-[0_16px_40px_rgba(26,26,46,0.04)]"
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-3">
                        <span className="font-dm-sans text-label uppercase text-[var(--color-accent-primary-strong)]">
                          {layer.number}
                        </span>
                        <div className="h-px flex-1 bg-sand" />
                        <span className="rounded-full border border-sand bg-warm px-3 py-1 text-caption text-ink-body">
                          {layer.tag}
                        </span>
                      </div>
                      <h3 className="font-fraunces text-[24px] leading-tight text-ink">{layer.title}</h3>
                      <p className="mt-3 text-base leading-8 text-ink-body">{layer.desc}</p>
                    </article>
                  ))}

                  <article className="rounded-[22px] border border-sage/15 bg-sage-soft px-6 py-6">
                    <SectionEyebrow tone="self">{t("about.buildOutcomeLabel", locale)}</SectionEyebrow>
                    <h3 className="mt-2 font-fraunces text-[26px] leading-tight text-ink">
                      {t("about.buildOutcomeTitle", locale)}
                    </h3>
                    <p className="mt-3 text-base leading-8 text-ink-body">
                      {t("about.buildOutcomeDesc", locale)}
                    </p>
                  </article>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Az út — táguló kör ─────────────────────────────────────── */}
      <EditorialSection eyebrow={t("about.pathEyebrow", locale)} title={t("about.pathTitle", locale)}>
        <p className="-mt-3 mb-8 max-w-[58ch] text-base leading-8 text-ink-body">
          {t("about.pathLead", locale)}
        </p>

        <div className="rounded-[24px] border border-sand bg-warm px-5 py-7 md:px-8">
          <PathDiagram label={t("about.pathDiagramAlt", locale)} className="mx-auto max-w-[620px]" />
        </div>

        <ol className="mt-5 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {pathSteps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-[22px] border border-sand bg-surface-card p-5 shadow-[0_16px_40px_rgba(26,26,46,0.04)]"
            >
              <span className="font-dm-sans text-label uppercase text-[var(--color-accent-primary-strong)]">
                {`0${i + 1}`}
              </span>
              <h3 className="mt-2 font-fraunces text-[22px] leading-tight text-ink">{step.title}</h3>
              <p className="mt-2 text-caption leading-7 text-ink-body">{step.desc}</p>
            </li>
          ))}
        </ol>
      </EditorialSection>

      {/* ── Amit betartunk ─────────────────────────────────────────── */}
      <EditorialSection eyebrow={t("about.valuesEyebrow", locale)} title={t("about.valuesTitle", locale)}>
        <div className="grid gap-4 md:grid-cols-2">
          {values.map((value) => (
            <article key={value.title} className="rounded-[24px] border border-sand bg-warm px-6 py-6">
              <h3 className="font-fraunces text-[24px] leading-tight text-ink">{value.title}</h3>
              <p className="mt-3 text-base leading-8 text-ink-body">{value.desc}</p>
            </article>
          ))}
        </div>
      </EditorialSection>

      <div className="border-t border-sand py-10 md:py-12">
        <SectionTransition artKey={artKeyFrom("about", "goal")} />
      </div>

      {/* ── Mi a célunk ────────────────────────────────────────────── */}
      <section className="border-t border-sand">
        <div className="mx-auto max-w-[1120px] px-7 py-14 md:py-20">
          <div className="grid gap-10 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <SectionEyebrow>{t("about.goalEyebrow", locale)}</SectionEyebrow>
            </div>
            <div>
              <h2 className="max-w-[16ch] font-fraunces text-[clamp(2.1rem,4.5vw,3.4rem)] leading-[1.02] tracking-tight text-ink">
                {t("about.goalTitle", locale)}
              </h2>

              <div className="mt-8 rounded-[24px] border border-sand bg-warm px-5 py-7 md:px-8">
                <PurposeDiagram
                  label={t("about.goalDiagramAlt", locale)}
                  className="mx-auto max-w-[560px]"
                />
                <div className="mt-6 grid gap-4 border-t border-sand pt-6 md:grid-cols-2">
                  <div>
                    <SectionEyebrow tone="muted">{t("about.goalBeforeLabel", locale)}</SectionEyebrow>
                    <p className="mt-2 text-base leading-8 text-ink-body">
                      {t("about.goalBeforeText", locale)}
                    </p>
                  </div>
                  <div>
                    <SectionEyebrow>{t("about.goalAfterLabel", locale)}</SectionEyebrow>
                    <p className="mt-2 text-base leading-8 text-ink">{t("about.goalAfterText", locale)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 grid gap-5 md:grid-cols-2">
                <p className="text-base leading-8 text-ink-body">{t("about.goalBody1", locale)}</p>
                <p className="text-base leading-8 text-ink-body">{t("about.goalBody2", locale)}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Záró CTA ───────────────────────────────────────────────── */}
      <section className="border-t border-sand">
        <div className="mx-auto max-w-[1120px] px-7 py-14 md:py-20">
          <div className="rounded-[28px] border border-sand bg-surface-card px-6 py-10 text-center shadow-[0_24px_60px_rgba(26,26,46,0.06)] md:px-12">
            <h2 className="mx-auto max-w-[18ch] font-fraunces text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-tight text-ink">
              {t("about.ctaTitle", locale)}
            </h2>
            <p className="mx-auto mt-5 max-w-[52ch] text-base leading-8 text-ink-body">
              {t("about.ctaBody", locale)}
            </p>
            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                href="/contact"
                className={getButtonClassName({ size: "lg", className: "min-h-[54px] px-7 text-base" })}
              >
                {t("about.ctaPrimary", locale)}
              </Link>
              <Link
                href="/try"
                className={getButtonClassName({
                  variant: "secondary",
                  size: "lg",
                  className: "min-h-[54px] px-7 text-base",
                })}
              >
                {t("about.ctaSecondary", locale)}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function EditorialSection({
  id,
  eyebrow,
  title,
  children,
}: {
  id?: string;
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="border-t border-sand">
      <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-14 md:py-20 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div>
          <SectionEyebrow>{eyebrow}</SectionEyebrow>
        </div>
        <div>
          <h2 className="max-w-[16ch] font-fraunces text-[clamp(2.1rem,4.5vw,3.4rem)] leading-[1.02] tracking-tight text-ink">
            {title}
          </h2>
          <div className="mt-8">{children}</div>
        </div>
      </div>
    </section>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-sand bg-surface-card px-3 py-1.5 text-sm text-ink-body">
      {children}
    </span>
  );
}

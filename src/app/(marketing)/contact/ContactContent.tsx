"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { MarketingActions } from "@/components/marketing/MarketingActions";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { t } from "@/lib/i18n/public";
import { ContactForm } from "./ContactForm";

export function ContactContent() {
  const { locale } = useLocale();

  return (
    <main className="min-h-dvh overflow-hidden bg-cream text-ink selection:bg-bronze/20">
      <section className="relative">
        <div className="absolute inset-x-0 top-0 h-[470px] bg-gradient-to-b from-[var(--color-layer-team-soft)]/65 to-transparent" />
        <div className="relative mx-auto grid max-w-[1120px] gap-12 px-7 pb-20 pt-12 md:pb-28 md:pt-20 lg:grid-cols-[minmax(0,1.05fr)_400px] lg:items-center">
          <div>
            <SectionEyebrow tone="team" className="mb-6">
              {t("contact.eyebrow", locale)}
            </SectionEyebrow>
            <h1 className="max-w-[14ch] font-fraunces text-fluid-display tracking-tight text-ink">
              {t("contact.title", locale)}
            </h1>
            <p className="mt-6 max-w-[610px] text-base leading-relaxed text-ink-body">
              {t("contact.subtitle", locale)}
            </p>
            <MarketingActions
              className="mt-8"
              primary={{ href: "#contact-form", label: t("contact.heroCta", locale) }}
              secondary={{ href: "mailto:hello@trita.io", label: "hello@trita.io" }}
            />
            <div className="mt-7 flex flex-wrap gap-2.5">
              <MetaChip>{t("contact.chipResponseTime", locale)}</MetaChip>
              <MetaChip>hello@trita.io</MetaChip>
            </div>
          </div>

          <ContactVisual locale={locale} />
        </div>
      </section>

      <section id="contact-form" className="bg-warm">
        <div className="mx-auto h-px w-[calc(100%-1.5rem)] max-w-[1180px] bg-sand" />
        <div className="mx-auto max-w-[1120px] px-7 py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[250px_minmax(0,1fr)]">
            <div>
              <SectionEyebrow>{t("contact.sectionEyebrow", locale)}</SectionEyebrow>
              <h2 className="mt-4 max-w-[12ch] font-fraunces text-fluid-title tracking-tight text-ink">
                {t("contact.sectionTitle", locale)}
              </h2>
              <p className="mt-5 max-w-[24rem] text-sm leading-relaxed text-ink-body">
                {t("contact.sectionLead", locale)}
              </p>
            </div>

            <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
              <div className="rounded-[28px] border border-sand bg-surface-card p-6 shadow-[0_24px_70px_rgba(26,26,46,0.07)] md:p-8">
                <ContactForm locale={locale} />
              </div>

              <div className="grid gap-4 self-start">
                <InfoCard number="01" title={t("contact.infoTitle", locale)} body={t("contact.infoBody", locale)} tone="team" />
                <InfoCard number="02" title={t("contact.responseTitle", locale)} body={t("contact.responseBody", locale)} />
                <InfoCard number="03" title={t("contact.legalTitle", locale)} body={t("contact.legalBody", locale)} tone="warm" />
              </div>
            </div>
          </div>
        </div>
        <div className="mx-auto h-px w-[calc(100%-1.5rem)] max-w-[1180px] bg-sand" />
      </section>
    </main>
  );
}

function ContactVisual({ locale }: { locale: "hu" | "en" }) {
  const steps = locale === "hu"
    ? ["Megírjátok, mi foglalkoztat", "Személyesen válaszolunk", "Kijelöljük a következő lépést"]
    : ["Tell us what is on your mind", "We reply personally", "We define the next step"];

  return (
    <aside aria-hidden="true" className="relative min-h-[370px] overflow-hidden rounded-[28px] bg-[var(--color-layer-team-hero-from)] p-6 shadow-[0_28px_80px_rgba(26,26,46,0.16)] md:p-7">
      <div className="absolute -right-16 -top-20 size-64 rounded-full border border-white/10" />
      <div className="absolute -right-4 -top-8 size-40 rounded-full border border-white/10" />
      <div className="relative flex min-h-[316px] flex-col">
        <div className="flex items-center justify-between">
          <p className="text-label uppercase text-[var(--color-text-on-inverse-muted)]">
            {locale === "hu" ? "Innen indul" : "It starts here"}
          </p>
          <span className="size-2 rounded-full bg-[var(--color-layer-team-glow)]" />
        </div>
        <div className="my-auto space-y-3 py-7">
          {steps.map((step, index) => (
            <div key={step} className={`flex items-center gap-4 rounded-2xl border px-4 py-4 ${index === 0 ? "border-[var(--color-layer-team-glow)]/45 bg-white/15" : "border-white/15 bg-white/[0.08]"}`}>
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-[var(--color-layer-team-badge)] font-fraunces text-sm text-[var(--color-layer-team-hero-to)]">
                {index + 1}
              </span>
              <p className="text-sm font-semibold text-[var(--color-text-on-inverse)]">{step}</p>
            </div>
          ))}
        </div>
        <p className="border-t border-white/10 pt-4 text-note text-[var(--color-text-on-inverse-muted)]">
          {t("contact.chipResponseTime", locale)} · hello@trita.io
        </p>
      </div>
    </aside>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-sand bg-surface-card/75 px-3 py-1.5 text-caption text-ink-body backdrop-blur-sm">{children}</span>;
}

function InfoCard({ number, title, body, tone = "default" }: { number: string; title: string; body: string; tone?: "default" | "warm" | "team" }) {
  const className = tone === "team"
    ? "border-[var(--color-layer-team-accent)]/20 bg-[var(--color-layer-team-soft)]"
    : tone === "warm" ? "border-sand bg-cream" : "border-sand bg-surface-card";

  return (
    <article className={`rounded-[20px] border px-5 py-5 ${className}`}>
      <p className={`text-label uppercase ${tone === "team" ? "text-[var(--color-layer-team-accent)]" : "text-[var(--color-accent-primary-strong)]"}`}>{number}</p>
      <h3 className="mt-2 font-fraunces text-xl leading-tight text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-ink-body">{body}</p>
    </article>
  );
}

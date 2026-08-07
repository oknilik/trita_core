"use client";

import type { ReactNode } from "react";
import { useLocale } from "@/components/LocaleProvider";
import { t } from "@/lib/i18n/public";
import { ContactForm } from "./ContactForm";

export function ContactContent() {
  const { locale } = useLocale();

  return (
    <main className="min-h-dvh bg-cream text-ink">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="border-b border-sand">
        <div className="mx-auto max-w-[1120px] px-7 pb-14 pt-12 md:pb-20 md:pt-20">
          <div className="mb-5 flex items-center gap-3">
            <div className="h-px w-8 bg-bronze" />
            <span className="font-dm-sans text-[11px] font-semibold uppercase tracking-widest text-bronze">
              {t("contact.eyebrow", locale)}
            </span>
          </div>

          <h1 className="max-w-[14ch] font-fraunces text-[clamp(2.6rem,6vw,4.4rem)] leading-[1.02] tracking-tight text-ink">
            {t("contact.title", locale)}
          </h1>

          <p className="mt-5 max-w-[580px] text-lg leading-[1.8] text-ink-body">
            {t("contact.subtitle", locale)}
          </p>

          <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <a
              href="#contact-form"
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl bg-bronze px-7 py-3.5 text-base font-semibold text-white transition-all hover:-translate-y-0.5 hover:bg-bronze-dark hover:shadow-lg"
            >
              {t("contact.heroCta", locale)}
            </a>
            <a
              href="mailto:hello@trita.io"
              className="inline-flex min-h-[52px] items-center justify-center rounded-xl border border-sand bg-surface-card px-7 py-3.5 text-base font-semibold text-ink transition-colors hover:border-sage/25 hover:text-sage"
            >
              hello@trita.io
            </a>
          </div>

          <div className="mt-5 flex flex-wrap gap-2.5">
            <MetaChip>{t("contact.chipResponseTime", locale)}</MetaChip>
            <MetaChip>hello@trita.io</MetaChip>
          </div>
        </div>
      </section>

      {/* ── Form + info cards ───────────────────────────────────────────── */}
      <section id="contact-form" className="border-t border-sand">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-7 py-14 md:py-20 lg:grid-cols-[220px_minmax(0,1fr)]">
          {/* Left label */}
          <div>
            <p className="font-dm-sans text-[11px] font-semibold uppercase tracking-widest text-bronze">
              {t("contact.sectionEyebrow", locale)}
            </p>
            <h2 className="mt-3 max-w-[12ch] font-fraunces text-[clamp(2rem,4vw,3rem)] leading-[1.05] tracking-tight text-ink">
              {t("contact.sectionTitle", locale)}
            </h2>
            <p className="mt-4 max-w-[24rem] text-sm leading-7 text-ink-body">
              {t("contact.sectionLead", locale)}
            </p>
          </div>

          {/* Right: form + cards */}
          <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
            <div className="rounded-[24px] border border-sand bg-surface-card p-6 shadow-[0_24px_60px_rgba(26,26,46,0.04)] md:p-8">
              <ContactForm locale={locale} />
            </div>

            <div className="grid gap-4 self-start">
              <InfoCard
                number="01"
                title={t("contact.infoTitle", locale)}
                body={t("contact.infoBody", locale)}
              />
              <InfoCard
                number="02"
                title={t("contact.responseTitle", locale)}
                body={t("contact.responseBody", locale)}
              />
              <InfoCard
                number="03"
                title={t("contact.legalTitle", locale)}
                body={t("contact.legalBody", locale)}
                tone="warm"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function MetaChip({ children }: { children: ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-sand bg-surface-card px-3 py-1.5 text-sm text-ink-body">
      {children}
    </span>
  );
}

function InfoCard({
  number,
  title,
  body,
  tone = "default",
}: {
  number: string;
  title: string;
  body: string;
  tone?: "default" | "warm";
}) {
  return (
    <article className={`rounded-2xl border border-sand px-5 py-5 ${tone === "warm" ? "bg-warm" : "bg-surface-card"}`}>
      <p className="font-dm-sans text-micro font-semibold uppercase tracking-widest text-bronze/80">
        {number}
      </p>
      <h3 className="mt-2 font-fraunces text-xl leading-tight text-ink">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-ink-body">{body}</p>
    </article>
  );
}

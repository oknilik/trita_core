"use client";

import { useLocale } from "@/components/LocaleProvider";
import { ContactSignalArt } from "@/components/marketing/ContactSignalArt";
import { LocalizedPageMeta } from "@/components/marketing/LocalizedPageMeta";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { t } from "@/lib/i18n/public";
import { ContactForm } from "./ContactForm";

export function ContactContent() {
  const { locale } = useLocale();

  return (
    <main className="min-h-dvh overflow-hidden bg-cream text-ink selection:bg-bronze/20">
      <LocalizedPageMeta titleKey="contact.metaTitle" descriptionKey="contact.metaDescription" />
      <section className="relative overflow-hidden bg-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -left-[8%] top-[18%] h-[56%] w-[44%] rounded-full bg-[var(--color-surface-highlight-warm)]/55 blur-3xl"
        />

        <div className="relative mx-auto grid max-w-[1080px] gap-10 px-7 pb-20 pt-12 md:pb-24 md:pt-20 lg:grid-cols-[minmax(0,0.82fr)_minmax(470px,1.18fr)] lg:gap-[72px] lg:items-start">
          <section className="lg:pt-5">
            <SectionEyebrow tone="bronze" className="mb-6">
              {t("contact.eyebrow", locale)}
            </SectionEyebrow>
            <h1 className="max-w-[11ch] font-fraunces text-fluid-display tracking-tight text-ink">
              {t("contact.title", locale)}{" "}
              <em className="not-italic text-[var(--color-accent-primary-strong)]">
                {t("contact.titleEm", locale)}
              </em>
            </h1>
            <p className="mt-6 max-w-[39ch] text-base leading-relaxed text-ink-body">
              {t("contact.subtitle", locale)}
            </p>

            <div className="mt-7 grid gap-3 text-caption text-ink-body">
              <p className="flex items-center gap-2.5">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[var(--color-action-primary-bg)]" />
                {t("contact.chipResponseTime", locale)}
              </p>
              <a className="flex items-center gap-2.5 hover:underline" href="mailto:hello@trita.io">
                <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-[var(--color-action-primary-bg)]" />
                hello@trita.io
              </a>
            </div>

            <ContactSignalArt className="mt-7 block h-auto w-full max-w-[430px]" />
          </section>

          <section
            id="contact-form"
            className="scroll-mt-28 rounded-[28px] border border-sand bg-surface-card p-6 shadow-[0_24px_70px_rgba(26,26,46,0.08)] md:p-8"
          >
            <h2 className="font-fraunces text-fluid-title tracking-tight text-ink">
              {t("contact.sectionTitle", locale)}
            </h2>
            <p className="mb-6 mt-2 text-sm leading-relaxed text-ink-body">
              {t("contact.sectionLead", locale)}
            </p>
            <ContactForm locale={locale} />
          </section>
        </div>
      </section>

      <section className="border-y border-sand bg-warm">
        <div className="mx-auto flex max-w-[1024px] flex-col gap-2 px-7 py-7 md:flex-row md:items-center md:justify-between md:gap-8">
          <h2 className="font-fraunces text-xl text-ink">
            {t("contact.emailStripTitle", locale)}
          </h2>
          <p className="max-w-[44ch] text-caption leading-relaxed text-ink-body">
            {t("contact.emailStripBody", locale)}
          </p>
          <a
            href="mailto:hello@trita.io"
            className="shrink-0 text-caption font-semibold text-[var(--color-accent-primary-strong)] hover:underline"
          >
            hello@trita.io →
          </a>
        </div>
      </section>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { PageWidthDivider } from "@/components/marketing/PageWidthDivider";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { LEGAL_REVIEW_DOCUMENTS } from "@/lib/legal/review-documents";

export function LegalHubContent() {
  const { locale } = useLocale();
  const hu = locale === "hu";

  return (
    <main className="min-h-dvh bg-cream">
      <section className="mx-auto max-w-[1120px] px-7 pb-14 pt-12 md:pb-18 md:pt-20">
        <SectionEyebrow className="mb-6">{hu ? "jogi" : "legal"}</SectionEyebrow>
        <h1 className="max-w-[18ch] font-fraunces text-fluid-display tracking-tight text-ink">
          {hu ? "Jogi dokumentumok" : "Legal documents"}
        </h1>
        <p className="mt-6 max-w-[760px] text-lg leading-relaxed text-ink-body">
          {hu
            ? "A Trita jelenlegi jogi dokumentumai és a kiadás előtt álló szerződéses tervezetek egy helyen."
            : "Trita’s current legal notice and pre-release contractual drafts in one place."}
        </p>
        <div className="mt-8 max-w-[860px] rounded-lg border border-bronze/40 bg-surface-card px-5 py-4">
          <p className="text-label uppercase text-[var(--color-accent-primary-strong)]">
            {hu ? "Review-státusz" : "Review status"}
          </p>
          <p className="mt-2 text-body leading-relaxed text-ink-body">
            {hu
              ? "A három RD1 dokumentum ügyvédi review-draft, nem jóváhagyott és még nem hatályos. A jelenleg hatályos Adatvédelmi tájékoztató külön érhető el."
              : "The three RD1 documents are legal review drafts: they are not approved and not yet effective. The currently effective Privacy Notice is available separately."}
          </p>
        </div>
      </section>

      <PageWidthDivider />

      <section className="px-7 py-12 lg:py-16">
        <div className="mx-auto grid max-w-[1120px] gap-5 md:grid-cols-3">
          {LEGAL_REVIEW_DOCUMENTS.map((document) => (
            <article key={document.slug} className="flex flex-col rounded-lg border border-sand bg-surface-card p-6">
              <p className="text-micro font-semibold uppercase tracking-wider text-[var(--color-accent-primary-strong)]">
                {document.documentId} · {hu ? "tervezet" : "draft"}
              </p>
              <h2 className="mt-4 font-fraunces text-title text-ink">{document.title[locale]}</h2>
              <p className="mt-3 flex-1 text-body leading-relaxed text-ink-body">
                {document.description[locale]}
              </p>
              <Link
                href={`/legal/${document.slug}`}
                className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full bg-[var(--color-accent-primary-strong)] px-5 text-caption font-semibold text-white transition-opacity hover:opacity-90"
              >
                {hu ? "Dokumentum megnyitása" : "Open document"}
              </Link>
            </article>
          ))}
        </div>

        <div className="mx-auto mt-8 max-w-[1120px] rounded-lg border border-sand bg-surface-card p-6 md:flex md:items-center md:justify-between md:gap-6">
          <div>
            <h2 className="font-fraunces text-heading text-ink">
              {hu ? "Adatvédelmi tájékoztató" : "Privacy Notice"}
            </h2>
            <p className="mt-2 text-body text-ink-body">
              {hu ? "Hatályos: 2026. augusztus 25-től." : "Effective from 25 August 2026."}
            </p>
          </div>
          <Link
            href="/privacy"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full border border-sand px-5 text-caption font-semibold text-ink transition-colors hover:bg-cream md:mt-0"
          >
            {hu ? "Tájékoztató megnyitása" : "Open notice"}
          </Link>
        </div>
      </section>
    </main>
  );
}

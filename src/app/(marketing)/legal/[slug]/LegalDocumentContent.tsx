"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { PageWidthDivider } from "@/components/marketing/PageWidthDivider";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import {
  getLegalDocumentDownloadPath,
  type LegalReviewDocument,
} from "@/lib/legal/review-documents";

export function LegalDocumentContent({ document }: { document: LegalReviewDocument }) {
  const { locale } = useLocale();
  const hu = locale === "hu";

  return (
    <main className="min-h-dvh bg-cream">
      <section className="mx-auto grid max-w-[1120px] gap-9 px-7 pb-14 pt-12 md:pb-18 md:pt-20 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div>
          <SectionEyebrow className="mb-6">{hu ? "jogi tervezet" : "legal draft"}</SectionEyebrow>
          <h1 className="max-w-[18ch] font-fraunces text-fluid-display tracking-tight text-ink">
            {document.title[locale]}
          </h1>
          <p className="mt-6 max-w-[720px] text-lg leading-relaxed text-ink-body">
            {document.description[locale]}
          </p>
        </div>
        <aside className="rounded-lg border border-bronze/40 bg-surface-card px-6 py-5">
          <p className="text-label uppercase text-[var(--color-accent-primary-strong)]">
            {hu ? "Dokumentum állapota" : "Document status"}
          </p>
          <div className="mt-4 space-y-3 text-caption leading-relaxed text-ink-body">
            <p>{document.documentId}</p>
            <p className="border-t border-sand pt-3">
              {hu ? "Ügyvédi review-draft · nem jóváhagyott" : "Legal review draft · not approved"}
            </p>
            <p className="border-t border-sand pt-3">
              {hu ? "Tervezett hatálybalépés: döntendő" : "Planned effective date: pending"}
            </p>
          </div>
        </aside>
      </section>

      <PageWidthDivider />

      <section className="px-7 py-12 lg:py-16">
        <div className="mx-auto grid max-w-[1120px] gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-6">
            <article className="rounded-lg border border-sand bg-surface-card p-6 md:p-8">
              <p className="text-label uppercase text-[var(--color-accent-primary-strong)]">
                {hu ? "Hatály" : "Scope"}
              </p>
              <p className="mt-4 text-body leading-relaxed text-ink-body">{document.scope[locale]}</p>
            </article>

            <article className="rounded-lg border border-sand bg-surface-card p-6 md:p-8">
              <h2 className="font-fraunces text-title text-ink">{hu ? "Lényegi pontok" : "Key points"}</h2>
              <ul className="mt-5 space-y-3">
                {document.highlights[locale].map((item) => (
                  <li key={item} className="relative pl-5 text-body leading-relaxed text-ink-body before:absolute before:left-0 before:top-[0.7em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-bronze">
                    {item}
                  </li>
                ))}
              </ul>
            </article>

            <article className="rounded-lg border border-bronze/40 bg-surface-card p-6 md:p-8">
              <h2 className="font-fraunces text-title text-ink">
                {hu ? "Publikálás előtt lezárandó" : "To close before publication"}
              </h2>
              <ol className="mt-5 space-y-3">
                {document.reviewItems[locale].map((item, index) => (
                  <li key={item} className="flex gap-3 text-body leading-relaxed text-ink-body">
                    <span className="font-semibold text-[var(--color-accent-primary-strong)]">{index + 1}.</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ol>
            </article>
          </div>

          <aside className="h-fit rounded-lg border border-sand bg-surface-card p-6 lg:sticky lg:top-28">
            <h2 className="font-fraunces text-heading text-ink">{hu ? "Teljes dokumentum" : "Full document"}</h2>
            <p className="mt-3 text-caption leading-relaxed text-ink-body">
              {hu
                ? "A pontos RD1 szöveg szerkeszthető Word-formátumban tölthető le ügyvédi és üzleti review-ra."
                : "Download the exact RD1 wording as an editable Word file for legal and business review."}
            </p>
            <a
              href={getLegalDocumentDownloadPath(document)}
              download
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-[var(--color-accent-primary-strong)] px-5 text-center text-caption font-semibold text-white transition-opacity hover:opacity-90"
            >
              {hu ? "Word-tervezet letöltése" : "Download Word draft"}
            </a>
            <Link
              href="/legal"
              className="mt-3 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-sand px-5 text-caption font-semibold text-ink transition-colors hover:bg-cream"
            >
              {hu ? "Vissza a dokumentumokhoz" : "Back to documents"}
            </Link>
          </aside>
        </div>
      </section>
    </main>
  );
}

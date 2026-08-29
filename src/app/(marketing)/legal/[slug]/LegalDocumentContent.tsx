"use client";

import Link from "next/link";
import { useLocale } from "@/components/LocaleProvider";
import { PageWidthDivider } from "@/components/marketing/PageWidthDivider";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import {
  type LegalContentBlock,
  type LegalDocument,
} from "@/lib/legal/documents";

function LegalBlock({ block }: { block: LegalContentBlock }) {
  switch (block.kind) {
    case "heading": {
      if (block.level === 1) {
        return (
          <h2 id={block.id} className="scroll-mt-28 border-t border-sand pt-8 font-fraunces text-title text-ink first:border-0 first:pt-0">
            {block.text}
          </h2>
        );
      }

      if (block.level === 2) {
        return (
          <h3 id={block.id} className="scroll-mt-28 pt-3 font-fraunces text-heading text-ink">
            {block.text}
          </h3>
        );
      }

      return (
        <h4 id={block.id} className="scroll-mt-28 pt-2 text-body font-semibold text-ink">
          {block.text}
        </h4>
      );
    }

    case "p":
      return <p className="text-body leading-relaxed text-ink-body">{block.text}</p>;

    case "ul":
      return (
        <ul className="space-y-2.5">
          {block.items.map((item) => (
            <li key={item} className="relative pl-5 text-body leading-relaxed text-ink-body before:absolute before:left-0 before:top-[0.7em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-bronze">
              {item}
            </li>
          ))}
        </ul>
      );

    case "ol":
      return (
        <ol className="list-decimal space-y-2.5 pl-5 text-body leading-relaxed text-ink-body">
          {block.items.map((item) => <li key={item}>{item}</li>)}
        </ol>
      );

    case "table":
      return (
        <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <table className="w-full min-w-[620px] border-collapse text-left">
            <thead>
              <tr className="border-b border-sand">
                {block.rows[0].map((cell) => (
                  <th key={cell} scope="col" className="pb-2 pr-4 text-label uppercase text-[var(--color-accent-primary-strong)] last:pr-0">
                    {cell}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.slice(1).map((row, rowIndex) => (
                <tr key={`${rowIndex}-${row.join("|")}`} className="border-b border-sand/70 last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td key={`${cellIndex}-${cell}`} className={`whitespace-pre-line py-3 pr-4 align-top text-caption leading-relaxed last:pr-0 ${cellIndex === 0 ? "font-medium text-ink" : "text-ink-body"}`}>
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
  }
}

export function LegalDocumentContent({ document }: { document: LegalDocument }) {
  const { locale } = useLocale();
  const hu = locale === "hu";
  const tableOfContents = document.content.filter(
    (block): block is Extract<LegalContentBlock, { kind: "heading" }> =>
      block.kind === "heading" && block.level === 1,
  );

  return (
    <main id="top" className="min-h-dvh bg-cream">
      <section className="mx-auto grid max-w-[1120px] gap-9 px-7 pb-14 pt-12 md:pb-18 md:pt-20 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
        <div>
          <SectionEyebrow className="mb-6">{hu ? "jogi dokumentum" : "legal document"}</SectionEyebrow>
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
              {hu ? "Hatályos dokumentum" : "Effective document"}
            </p>
            <p className="border-t border-sand pt-3">
              {hu ? "Hatályos: 2026. augusztus 29-től" : "Effective from 29 August 2026"}
            </p>
          </div>
        </aside>
      </section>

      <PageWidthDivider />

      <section className="px-7 py-12 lg:py-16">
        <div className="mx-auto max-w-[1120px]">
          {!hu ? (
            <p className="mb-6 rounded-lg border border-bronze/40 bg-surface-card px-5 py-4 text-caption leading-relaxed text-ink-body">
              The complete legal text is currently available in Hungarian. The Hungarian text is controlling.
            </p>
          ) : null}

          <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
            <aside className="h-fit rounded-lg border border-sand bg-surface-card p-4 lg:sticky lg:top-28">
              <p className="mb-3 text-label uppercase text-ink-body">{hu ? "Tartalom" : "Contents"}</p>
              <nav className="space-y-1">
                {tableOfContents.map((heading, index) => (
                  <a key={heading.id} href={`#${heading.id}`} className="group flex min-h-11 items-baseline gap-2 rounded px-2 py-1.5 transition-colors hover:bg-surface-highlight-warm lg:min-h-0">
                    <span className="text-micro text-[var(--color-accent-primary-strong)]">{String(index + 1).padStart(2, "0")}</span>
                    <span className="text-caption text-ink-body transition-colors group-hover:text-ink">{heading.text}</span>
                  </a>
                ))}
              </nav>
              <Link
                href="/legal"
                className="mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-full border border-sand px-4 text-center text-caption font-semibold text-ink transition-colors hover:bg-cream"
              >
                {hu ? "Összes dokumentum" : "All documents"}
              </Link>
            </aside>

            <article className="min-w-0 rounded-lg border border-sand bg-surface-card p-5 md:p-8">
              <div className="mb-8 rounded-lg border border-bronze/40 bg-cream px-5 py-4">
                <p className="text-label uppercase text-[var(--color-accent-primary-strong)]">{hu ? "Hatály" : "Scope"}</p>
                <p className="mt-2 text-caption leading-relaxed text-ink-body">{document.scope[locale]}</p>
              </div>

              <div className="space-y-5">
                {document.content.map((block, index) => (
                  <LegalBlock key={block.kind === "heading" ? block.id : `${block.kind}-${index}`} block={block} />
                ))}
              </div>

              <p className="mt-10 border-t border-sand pt-5 text-right">
                <a href="#top" className="text-caption text-[var(--color-accent-primary-strong)] underline-offset-4 hover:underline">
                  ↑ {hu ? "Vissza a tetejére" : "Back to top"}
                </a>
              </p>
            </article>
          </div>
        </div>
      </section>
    </main>
  );
}

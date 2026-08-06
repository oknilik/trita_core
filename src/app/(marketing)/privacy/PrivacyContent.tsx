"use client";

import { useLocale } from "@/components/LocaleProvider";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { LEGAL_DOCS_ARE_DRAFT } from "@/lib/legal/company";
import { getPrivacyPolicy, type PolicyBlock } from "@/lib/legal/privacy-policy";

/**
 * Adatvédelmi tájékoztató — megjelenítés.
 *
 * A tartalom a `src/lib/legal/privacy-policy.ts` tipizált dokumentumából jön;
 * ez a komponens CSAK a blokk-típusok (bekezdés, felsorolás, fogalom-lista,
 * táblázat, kiemelés) renderelését ismeri. Új szakasz vagy táblázat a
 * tartalom-modulban keletkezik, itt nem kell hozzányúlni semmihez.
 *
 * DESIGN: a lap a token-rendszerből dolgozik — szerep-tipográfia
 * (text-display/title/heading/body/caption/label/micro), `border-sand`,
 * `bg-cream`, `text-ink`/`text-ink-body`, `text-bronze`; nyers hex és
 * arbitrary `text-[Npx]` nincs benne (ui-contribution-guide).
 */

function BlockView({ block }: { block: PolicyBlock }) {
  switch (block.kind) {
    case "p":
      return <p className="text-body leading-relaxed text-ink-body">{block.text}</p>;

    case "ul":
      return (
        <ul className="space-y-2.5">
          {block.items.map((item) => (
            <li
              key={item}
              className="relative pl-5 text-body leading-relaxed text-ink-body before:absolute before:left-0 before:top-[0.7em] before:h-1.5 before:w-1.5 before:rounded-full before:bg-bronze"
            >
              {item}
            </li>
          ))}
        </ul>
      );

    case "dl":
      return (
        <dl className="divide-y divide-sand">
          {block.items.map((item) => (
            <div key={item.term} className="py-3 first:pt-0 last:pb-0 md:grid md:grid-cols-[minmax(0,200px)_1fr] md:gap-6">
              <dt className="text-caption font-semibold text-ink">{item.term}</dt>
              <dd className="mt-1 text-body leading-relaxed text-ink-body md:mt-0">
                {item.description}
              </dd>
            </div>
          ))}
        </dl>
      );

    case "table":
      // A táblázat SAJÁT vízszintes görgetőt kap: a jogalap-oszlop hosszú, és
      // 320px-en a lap törzse nem tolódhat el tőle.
      return (
        <div className="-mx-5 overflow-x-auto px-5 md:mx-0 md:px-0">
          <table className="w-full min-w-[520px] border-collapse text-left">
            <thead>
              <tr className="border-b border-sand">
                {block.columns.map((column) => (
                  <th
                    key={column}
                    scope="col"
                    className="pb-2 pr-4 text-label uppercase text-bronze last:pr-0"
                  >
                    {column}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row) => (
                <tr key={row.join("|")} className="border-b border-sand/70 last:border-0">
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cell}
                      className={`py-3 pr-4 align-top text-caption leading-relaxed last:pr-0 ${
                        cellIndex === 0 ? "font-medium text-ink" : "text-ink-body"
                      }`}
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );

    case "note":
      return (
        <p className="rounded-lg border border-sand bg-cream px-4 py-3 text-caption leading-relaxed text-ink-body">
          {block.text}
        </p>
      );
  }
}

export function PrivacyContent() {
  const { locale } = useLocale();
  const doc = getPrivacyPolicy(locale);

  return (
    <main id="top" className="min-h-dvh bg-cream">
      {/* ── Fejléc ── */}
      <section className="border-b border-sand bg-action-primary-bg px-6 py-14 lg:px-16 lg:py-16">
        <div className="mx-auto max-w-6xl">
          <SectionEyebrow tone="onDark" className="mb-4">
            {doc.eyebrow}
          </SectionEyebrow>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="font-fraunces text-fluid-title tracking-tight text-cream">{doc.title}</h1>
            {LEGAL_DOCS_ARE_DRAFT && (
              <span className="rounded-full border border-cream/30 px-2.5 py-1 text-label uppercase text-cream/70">
                {doc.draftBadge}
              </span>
            )}
          </div>
          <p className="mt-4 max-w-3xl text-body leading-relaxed text-cream/80">{doc.lead}</p>
          <p className="mt-5 text-label uppercase text-cream/55">
            {doc.lastUpdated} · {doc.effectiveFrom}
          </p>
        </div>
      </section>

      <section className="px-6 py-10 lg:px-16 lg:py-14">
        <div className="mx-auto max-w-6xl">
          {LEGAL_DOCS_ARE_DRAFT && (
            // Amíg a cégadatok helykitöltők, ezt ki KELL mondani: egy joginak
            // látszó, de kitalált azonosítókat közlő lap félrevezeti az
            // érintettet. A jelölés a `company.ts` egyetlen konstansával
            // tűnik el, amikor a valós adatok bekerülnek.
            <div className="mb-8 rounded-lg border border-bronze/40 bg-white px-5 py-4">
              <p className="text-label uppercase text-bronze">{doc.draftBadge}</p>
              <p className="mt-2 text-caption leading-relaxed text-ink-body">{doc.draftNote}</p>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[240px_1fr] lg:gap-10">
            {/* ── Tartalomjegyzék ── */}
            <aside className="h-fit rounded-lg border border-sand bg-white p-4 lg:sticky lg:top-28">
              <p className="mb-3 text-label uppercase text-ink-body">{doc.tocLabel}</p>
              <nav className="space-y-1">
                {doc.sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="group flex min-h-[44px] items-baseline gap-2 rounded px-2 py-1.5 transition-colors hover:bg-surface-highlight-warm lg:min-h-0"
                  >
                    <span className="text-micro text-bronze">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span className="text-caption text-ink-body transition-colors group-hover:text-ink">
                      {section.title}
                    </span>
                  </a>
                ))}
              </nav>
            </aside>

            {/* ── Szakaszok ── */}
            <div className="space-y-4">
              {doc.sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 rounded-lg border border-sand bg-white p-5 md:p-7"
                >
                  <p className="mb-3 text-label uppercase text-bronze">
                    {String(index + 1).padStart(2, "0")}
                  </p>
                  <h2 className="mb-4 font-fraunces text-title text-ink">{section.title}</h2>
                  <div className="space-y-4">
                    {section.blocks.map((block, blockIndex) => (
                      <BlockView key={`${section.id}-${blockIndex}`} block={block} />
                    ))}
                  </div>
                </section>
              ))}

              <p className="pt-2 text-right">
                <a
                  href="#top"
                  className="text-caption text-bronze underline-offset-4 hover:underline"
                >
                  ↑ {doc.backToTop}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

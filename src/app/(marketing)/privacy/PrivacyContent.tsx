"use client";

import { useLocale } from "@/components/LocaleProvider";
import { PageWidthDivider } from "@/components/marketing/PageWidthDivider";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
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
 * `bg-cream`, `text-ink`/`text-ink-body`, `text-[var(--color-accent-primary-strong)]`; nyers hex és
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
                    className="pb-2 pr-4 text-label uppercase text-[var(--color-accent-primary-strong)] last:pr-0"
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
      <section className="relative overflow-hidden bg-cream">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[5%] top-[8%] h-[76%] w-[42%] rounded-full bg-bronze/5 blur-3xl"
        />
        <div className="relative mx-auto grid max-w-[1120px] gap-10 px-7 pb-16 pt-12 md:pb-20 md:pt-20 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-end">
          <div>
            <SectionEyebrow className="mb-6">{doc.eyebrow}</SectionEyebrow>
            <h1 className="max-w-[16ch] font-fraunces text-fluid-display tracking-tight text-ink">{doc.title}</h1>
            <p className="mt-6 max-w-[680px] text-lg leading-relaxed text-ink-body">{doc.lead}</p>
          </div>
          <aside className="rounded-[24px] border border-sand bg-surface-card/80 px-6 py-5 shadow-[0_20px_60px_rgba(26,26,46,0.05)] backdrop-blur-sm">
            <p className="text-label uppercase text-[var(--color-accent-primary-strong)]">
              {locale === "hu" ? "Dokumentum állapota" : "Document status"}
            </p>
            <div className="mt-4 space-y-3 text-caption leading-relaxed text-ink-body">
              <p>{doc.lastUpdated}</p>
              <p className="border-t border-sand pt-3">{doc.effectiveFrom}</p>
            </div>
          </aside>
        </div>
      </section>

      <section>
        <PageWidthDivider />
        <div className="px-6 py-10 lg:px-16 lg:py-14">
          <div className="mx-auto max-w-6xl">
          {/* min-w-0 a rács-elemeken: a grid-item alapértelmezett
              `min-width: auto` a TARTALOM min-content méretét veszi, és a
              jogalap-táblázat `min-w-[520px]`-je így 520px-re feszítette a
              sávot — 390px-es kijelzőn az egész lap 586px széles lett és
              oldalra csúszott. A táblázat saját vízszintes görgetője csak
              akkor tud dolgozni, ha a sáv szűkebb lehet nála.
              (A `lg:grid-cols-[240px_minmax(0,1fr)]` ugyanezt teszi a
              kétsávos elrendezésben.) */}
            <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
            {/* ── Tartalomjegyzék ── */}
            <aside className="h-fit min-w-0 rounded-lg border border-sand bg-surface-card p-4 lg:sticky lg:top-28">
              <p className="mb-3 text-label uppercase text-ink-body">{doc.tocLabel}</p>
              <nav className="space-y-1">
                {doc.sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    className="group flex min-h-[44px] items-baseline gap-2 rounded px-2 py-1.5 transition-colors hover:bg-surface-highlight-warm lg:min-h-0"
                  >
                    <span className="text-micro text-[var(--color-accent-primary-strong)]">
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
            <div className="min-w-0 space-y-4">
              {doc.sections.map((section, index) => (
                <section
                  key={section.id}
                  id={section.id}
                  className="scroll-mt-28 rounded-lg border border-sand bg-surface-card p-5 md:p-7"
                >
                  <p className="mb-3 text-label uppercase text-[var(--color-accent-primary-strong)]">
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
                  className="text-caption text-[var(--color-accent-primary-strong)] underline-offset-4 hover:underline"
                >
                  ↑ {doc.backToTop}
                </a>
              </p>
            </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";
import Image from "next/image";
import { t, type Locale } from "@/lib/i18n";
import { presentTeamStyle } from "@/lib/team-operating-style/presentation";
import { cataloguePattern } from "@/lib/team-operating-style/catalogue";
import { AXES } from "@/lib/team-operating-style/questions";
import { COMPOSITION_AXES, type TeamStyleSnapshot } from "@/lib/team-operating-style/comparison";

import { TeamPersonalityLayers } from "./TeamPersonalityLayers";

type Props = { snapshot?: TeamStyleSnapshot | null; locale: Locale; legacyPattern?: string | null };
const number = (value: number | null, locale: Locale) => value === null ? "–" : value.toLocaleString(locale === "hu" ? "hu-HU" : "en-GB", { maximumFractionDigits: 1 });

export function TeamOperatingStyleReport({ snapshot, locale, legacyPattern, mode = "standalone", averages, spread, personalityCount }: Props & {
  mode?: "standalone" | "overview"; averages?: Record<string, number> | null; spread?: Record<string, number> | null; personalityCount?: number;
}) {
  const [operating, , comparison] = presentTeamStyle(snapshot, locale, legacyPattern);
  const op = snapshot?.operating;
  const hu = locale === "hu";
  const tr = (key: string) => t(`tos.report.${key}`, locale);
  const nearMiddle = op && AXES.every((axis) => op.axes[axis].status === "available" && op.axes[axis].flags.includes("near_midpoint"));
  const pattern = !nearMiddle && !op?.patternUnavailableReason && op?.pattern ? cataloguePattern(op.pattern.code) : null;
  const heading = nearMiddle ? tr("nearMiddleSummary") : operating.heading ?? tr("mixed");
  return <div className={mode === "overview" ? "divide-y divide-sand" : "divide-y divide-sand rounded-2xl border border-sand bg-surface-card px-5 sm:px-8"} data-testid="team-style-report">
    <section className="pb-7 pt-5 sm:pt-7">
      <div className="grid items-center gap-6 rounded-2xl bg-[var(--color-layer-self-hero-mid)] p-6 text-[var(--color-text-on-inverse)] sm:p-8 md:grid-cols-[1fr_auto]">
        <div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-on-inverse-muted)]">{hu ? "01 / Mért működés" : "01 / Measured operating style"}</p><h2 className="mt-3 font-fraunces text-3xl leading-tight sm:text-4xl">{heading}</h2>
          {pattern && op?.pattern?.status === "descriptive" && <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[var(--color-text-on-inverse-muted)]">{pattern.description[locale]}</p>}
          {pattern && op?.pattern?.status === "tentative" && <p className="mt-4 text-sm leading-relaxed text-[var(--color-text-on-inverse-muted)]">{hu ? "Tájékozódó besorolás: a tengelyek között középhez közeli vagy eltérően megélt működés is van. A pontos képet az alábbi eredmények és alternatívák adják." : "Tentative classification: some axes are near the midpoint or reflect different experiences. Read the axis results and alternatives below for the full picture."}</p>}
          {nearMiddle && <p className="mt-4 text-sm text-[var(--color-text-on-inverse-muted)]">{tr("nearMiddleHelp")}</p>}
          {!op && <p className="mt-4 text-sm text-[var(--color-text-on-inverse-muted)]">{tr("noOperating")}</p>}
          <p className="mt-4 text-xs text-[var(--color-text-on-inverse-muted)]">{hu ? "Viselkedési beszámolók · Kísérleti mérés" : "Behavioral reports · Experimental measure"}</p>
        </div>
        {op && <div className="flex min-w-0 flex-col items-center gap-3 text-center md:w-64 lg:w-72">
          <div className="w-full max-w-xs rounded-xl bg-[var(--color-text-on-inverse)] p-3">
            <Image
              src={`/illustrations/operating-patterns/${pattern && op.pattern?.status === "descriptive" ? pattern.code : "MIXED"}.svg`}
              alt={pattern && op.pattern?.status === "descriptive"
                ? (hu ? `${pattern.name.hu} – együttműködő csapat absztrakt figurákkal` : `${pattern.name.en} – abstract figures working together`)
                : (hu ? "Vegyes csapatkép – különböző absztrakt karakterek" : "Mixed team picture – different abstract characters")}
              width={400} height={224} className="h-auto w-full"
            />
          </div>
          {pattern && <div><p className="mt-2 font-fraunces text-3xl">{pattern.code}</p><Link href={`/operating-patterns?pattern=${pattern.code}&lang=${locale}`} className="mt-2 inline-flex min-h-11 items-center text-xs underline underline-offset-4">{hu ? "A minta megismerése" : "Explore this pattern"}</Link></div>}
        </div>}
      </div>
      <div className="mt-5 space-y-2">{operating.notes.slice(1).filter((note) => op || note !== tr("noOperating")).map((note) => <p key={note} className="text-xs leading-relaxed text-muted">{note}</p>)}</div>
      {op && <div className="mt-5"><h3 className="font-fraunces text-xl text-ink">{hu ? "Így rajzolódik ki a működésetek" : "How your operating pattern takes shape"}</h3>
        {AXES.map((axis) => {
          const a = op.axes[axis]; const label = t(`tos.axes.${axis}.name`, locale);
          return <div key={axis} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-5 gap-y-2 py-3 sm:grid-cols-[9rem_minmax(0,1fr)_auto]">
            <h4 className="col-span-2 text-sm font-medium text-ink sm:col-span-1">{label}</h4><div><div className="flex justify-between gap-3 text-xs text-muted"><span className={a.pole === "left" ? "font-semibold text-ink" : ""}>{t(`tos.axes.${axis}.left`, locale)}</span><span className={`text-right ${a.pole === "right" ? "font-semibold text-ink" : ""}`}>{t(`tos.axes.${axis}.right`, locale)}</span></div>
              {a.mean === null ? <p className="mt-2 text-sm text-muted">{tr("insufficient")}</p> : <div role="img" aria-label={`${label}: ${tr("mean")}: ${number(a.mean, locale)}/100. ${tr("centerLegend")}`} className="relative mx-1.5 mb-1 mt-3 h-1.5 rounded-full bg-sand"><span aria-hidden="true" className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-y-1/2 bg-ink/30" /><span aria-hidden="true" className={`absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full ${a.flags.length ? "bg-bronze" : "bg-sage"}`} style={{ left: `${a.mean}%` }} /></div>}
            </div><div className="text-right text-xs tabular-nums"><span className="block text-ink">{number(a.mean, locale)} /100</span><span className="text-muted"><span className="sr-only">{tr("validAnswers")}: </span>{a.n}/{op.eligibleCount}</span></div>
            {a.flags.map((flag) => <p key={flag} className="col-span-2 border-l-2 border-bronze pl-3 text-xs text-ink-body sm:col-start-2">{tr(`flags.${flag}`)}{flag === "near_midpoint" && (hu ? " — nincs egyértelmű pólus ezen a tengelyen." : " — neither pole clearly dominates on this axis.")}</p>)}
          </div>;
        })}<p className="mt-3 text-xs leading-relaxed text-muted">{tr("centerLegend")} {hu ? "A magasabb érték nem jobb eredmény. Jobb oldalon az átlag és az értékelhető válaszok száma látható." : "Higher is not better. The right column shows the mean and usable response count."}</p></div>}
      <p className="mt-4 text-xs leading-relaxed text-muted">{tr("experimental")}</p>
    </section>
    <TeamPersonalityLayers composition={snapshot?.composition} averages={averages} spread={spread} count={personalityCount} locale={locale} legacyPattern={legacyPattern} />
    <section className="py-7"><h2 className="font-fraunces text-2xl text-ink">{hu ? "04 / A két réteg együtt" : "04 / The two layers together"}</h2>
      <div className="mt-4 rounded-xl bg-sage-soft p-5"><p className="text-sm leading-relaxed text-ink-body">{tr("comparisonNote")}</p>{comparison.notes.slice(1).map((note) => <p key={note} className="mt-3 text-sm text-ink-body">{note}</p>)}</div>
      {comparison.prompts.length > 0 && <div className="mt-4 divide-y divide-sand">{comparison.prompts.map((prompt, index) => <details key={prompt.title} open={index === 0} className="py-1"><summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-ink">{prompt.title}</summary><div className="grid gap-5 pb-4 sm:grid-cols-2"><div className="border-l-2 border-sage/40 pl-4"><h3 className="text-xs font-semibold text-sage-dark">{tr("support")}</h3><p className="mt-2 text-sm leading-relaxed text-ink-body">{prompt.support}</p></div><div className="border-l-2 border-bronze/40 pl-4"><h3 className="text-xs font-semibold text-bronze-dark">{tr("tension")}</h3><p className="mt-2 text-sm leading-relaxed text-ink-body">{prompt.tension}</p></div><p className="text-xs text-muted sm:col-span-2">{prompt.context}</p></div></details>)}</div>}
    </section>
    {mode === "standalone" && <details className="py-5"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-sage-dark">{tr("measurementDetails")}</summary><TeamStyleMeasurements snapshot={snapshot} locale={locale} legacyPattern={legacyPattern} /></details>}
  </div>;
}

export function TeamStyleMeasurements({ snapshot, locale, legacyPattern }: Props) {
  const sections = presentTeamStyle(snapshot, locale, legacyPattern);
  const tr = (key: string) => t(`tos.report.${key}`, locale);
  const op = snapshot?.operating;
  const comp = snapshot?.composition;
  const rows = [op ? AXES.map((axis) => ({ label: t(`tos.axes.${axis}.name`, locale), ...op.axes[axis], count: `${op.axes[axis].n}/${op.eligibleCount}` })) : [],
    comp ? COMPOSITION_AXES.map((axis) => ({ label: tr(axis), ...comp.axes[axis], count: String(comp.memberCount) })) : []];
  return <div className="divide-y divide-sand rounded-2xl border border-sand bg-surface-card px-5 sm:px-8">
    {sections.slice(0, 2).map((section, index) => <section key={section.title} className="py-6">
      <h3 className="font-fraunces text-xl text-ink">{section.title.replace(/^\d+\.\s*/, "")}</h3>
      {section.notes.map((note) => <p key={note} className="mt-2 text-sm leading-relaxed text-muted">{note}</p>)}
      {rows[index].length > 0 && <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-sm">
        <caption className="sr-only">{section.title}</caption>
        <thead><tr>{[locale === "hu" ? "Terület" : "Dimension", `${tr("mean")} /100`, tr("sd"), tr("validAnswers")].map((label) => <th key={label} scope="col" className="border-b border-sand px-2 py-3 font-medium text-muted first:pl-0">{label}</th>)}</tr></thead>
        <tbody>{rows[index].map((row) => <tr key={row.label}><th scope="row" className="border-b border-sand py-3 pr-2 font-medium text-ink">{row.label}</th>{[number(row.mean, locale), number(row.sd, locale), row.count].map((cell, i) => <td key={i} className="border-b border-sand px-2 py-3 tabular-nums text-ink-body">{cell}</td>)}</tr>)}</tbody>
      </table></div>}
      {index === 0 && op && <details className="mt-3"><summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-sage-dark">{tr("frequencies")} · {tr("coverage")}</summary><dl className="space-y-3">{section.rows.map((row) => <div key={row.label}><dt className="text-sm font-semibold text-ink">{row.label}</dt><dd className="mt-1 text-sm leading-relaxed text-muted">{row.detail}</dd></div>)}</dl></details>}
    </section>)}
    <p className="py-5 text-sm leading-relaxed text-muted">{locale === "hu" ? "Az átlag a közös irányt, a mintaszórás a tagok közötti eltérést jelzi. A két réteg eltérő konstrukciókat mér; pontszámaikból nem képezünk közös illeszkedési százalékot." : "The mean shows the shared direction; sample SD describes differences between members. The layers measure different constructs; their scores do not form a joint compatibility percentage."}</p>
  </div>;
}

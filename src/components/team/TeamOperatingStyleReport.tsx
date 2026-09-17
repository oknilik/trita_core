import { t, type Locale } from "@/lib/i18n";
import { presentTeamStyle } from "@/lib/team-operating-style/presentation";
import { AXES } from "@/lib/team-operating-style/questions";
import { COMPOSITION_AXES, type TeamStyleSnapshot } from "@/lib/team-operating-style/comparison";

type Props = { snapshot?: TeamStyleSnapshot | null; locale: Locale; legacyPattern?: string | null };
const number = (value: number | null, locale: Locale) => value === null ? "–" : value.toLocaleString(locale === "hu" ? "hu-HU" : "en-GB", { maximumFractionDigits: 1 });

export function TeamOperatingStyleReport({ snapshot, locale, legacyPattern, mode = "standalone" }: Props & { mode?: "standalone" | "overview" }) {
  const sections = presentTeamStyle(snapshot, locale, legacyPattern);
  const op = snapshot?.operating;
  const comp = snapshot?.composition;
  const tr = (key: string) => t(`tos.report.${key}`, locale);
  const nearMiddle = op && AXES.every((axis) => op.axes[axis].status === "available" && op.axes[axis].flags.includes("near_midpoint"));
  return <div className={mode === "overview" ? "divide-y divide-sand" : "divide-y divide-sand rounded-2xl border border-sand bg-surface-card px-5 sm:px-8"} data-testid="team-style-report">
    {sections.map((section, index) => {
      const [methodology, ...notices] = section.notes;
      const heading = index === 0 && nearMiddle ? tr("nearMiddleSummary") : section.heading;
      return <section key={section.title} className="py-6 sm:py-7">
        <h2 className="font-fraunces text-xl leading-snug text-ink sm:text-2xl">{section.title}</h2>
        <div className={index === 1 && comp ? "mt-5 grid gap-6 md:grid-cols-2 md:gap-10" : "mt-4"}>
          <div>
            {heading && <p className={`${index === 1 ? "font-fraunces text-2xl text-[var(--color-layer-team-accent)] sm:text-3xl" : "text-base font-semibold text-ink"} max-w-3xl leading-snug`}>{heading}</p>}
            {index === 0 && nearMiddle && <p className="mt-2 max-w-3xl text-sm leading-relaxed text-ink-body">{tr("nearMiddleHelp")}</p>}
            <p className="mt-3 text-xs leading-relaxed text-muted">{index === 0 ? (locale === "hu" ? "Viselkedési beszámolók · Kísérleti mérés" : "Behavioral reports · Experimental measure") : index === 1 ? (comp ? (locale === "hu" ? `${comp.memberCount} egyéni profil összesítése` : `${comp.memberCount} individual profiles aggregated`) : tr("compositionSource")) : tr("comparisonNote")}</p>
            {notices.length > 0 && <div className="mt-3 space-y-2">{notices.map((note) => <p key={note} className="max-w-3xl text-sm leading-relaxed text-muted">{note}</p>)}</div>}
          </div>
          {index === 1 && comp && <div className="space-y-4">
            {COMPOSITION_AXES.map((axis) => <div key={axis}>
              <div className="flex items-baseline justify-between gap-3"><h3 className="text-sm font-medium text-ink">{tr(axis)}</h3><span className="text-sm tabular-nums text-ink">{number(comp.axes[axis].mean, locale)}<span className="text-muted"> /100</span></span></div>
              <div role="img" aria-label={`${tr(axis)}: ${number(comp.axes[axis].mean, locale)}/100`} className="mt-2 h-1.5 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-sage" style={{ width: `${comp.axes[axis].mean}%` }} /></div>
            </div>)}
          </div>}
        </div>
        {index === 0 && op && <div className="mt-4">
          {AXES.map((axis) => {
            const value = op.axes[axis];
            const label = t(`tos.axes.${axis}.name`, locale);
            return <div key={axis} className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-2 py-3 sm:grid-cols-[7rem_minmax(0,1fr)_auto] sm:gap-x-6">
              <h3 className="col-span-2 text-sm font-semibold text-ink sm:col-span-1">{label}</h3>
              <div>
                <div className="flex justify-between gap-3 text-xs text-muted"><span>{t(`tos.axes.${axis}.left`, locale)}</span><span className="text-right">{t(`tos.axes.${axis}.right`, locale)}</span></div>
                {value.mean === null ? <p className="mt-2 text-sm text-muted">{tr("insufficient")}</p> :
                  <div role="img" aria-label={`${label}: ${tr("mean")}: ${number(value.mean, locale)}/100. ${tr("centerLegend")}`} className="relative mx-1.5 mb-1 mt-3 h-1.5 rounded-full bg-sand">
                    <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-3.5 w-px -translate-y-1/2 bg-ink/30" />
                    <span aria-hidden="true" className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage" style={{ left: `${value.mean}%` }} />
                  </div>}
              </div>
              <span className="text-xs tabular-nums text-muted"><span className="sr-only">{tr("validAnswers")}: </span>{value.n}/{op.eligibleCount}</span>
              {value.flags.filter((flag) => flag !== "near_midpoint").map((flag) => <p key={flag} className="col-span-2 text-xs text-muted sm:col-start-2">{tr(`flags.${flag}`)}</p>)}
            </div>;
          })}
          <p className="mt-3 text-xs leading-relaxed text-muted">{tr("centerLegend")} {locale === "hu" ? "Jobb oldalon: értékelhető válaszok." : "Right: usable responses."}</p>
        </div>}
        {index === 1 && comp && <p className="mt-5 text-xs leading-relaxed text-muted">{tr("cohesionCaveat")}</p>}
        {section.prompts.length > 0 && <div className="mt-4 divide-y divide-sand">
          {section.prompts.map((prompt, promptIndex) => <details key={prompt.title} open={promptIndex === 0} className="group py-1">
            <summary className="min-h-11 cursor-pointer py-3 text-sm font-semibold text-ink">{prompt.title}</summary>
            <div className="grid gap-5 pb-4 sm:grid-cols-2">
              <div className="border-l-2 border-sage/40 pl-4"><h3 className="text-xs font-semibold text-sage-dark">{tr("support")}</h3><p className="mt-2 text-sm leading-relaxed text-ink-body">{prompt.support}</p></div>
              <div className="border-l-2 border-bronze/40 pl-4"><h3 className="text-xs font-semibold text-bronze">{tr("tension")}</h3><p className="mt-2 text-sm leading-relaxed text-ink-body">{prompt.tension}</p></div>
              <p className="text-xs text-muted sm:col-span-2">{prompt.context}</p>
            </div>
          </details>)}
        </div>}
        {mode === "standalone" && <details className="mt-4 border-t border-sand pt-2">
          <summary className="min-h-11 cursor-pointer py-3 text-sm font-medium text-sage-dark">{tr(index === 2 ? "interpretationDetails" : "measurementDetails")}</summary>
          <p className="mt-2 text-sm leading-relaxed text-muted">{methodology}</p>
          {section.rows.length > 0 && <dl className="mt-4 space-y-4">{section.rows.map((row) => <div key={row.label}><dt className="text-sm font-semibold text-ink">{row.label}</dt><dd className="mt-1 text-sm leading-relaxed text-ink-body">{row.detail}</dd></div>)}</dl>}
        </details>}
      </section>;
    })}
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

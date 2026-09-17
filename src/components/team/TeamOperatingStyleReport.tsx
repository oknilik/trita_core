import { t, type Locale } from "@/lib/i18n";
import { presentTeamStyle } from "@/lib/team-operating-style/presentation";
import { AXES } from "@/lib/team-operating-style/questions";
import { COMPOSITION_AXES, type TeamStyleSnapshot } from "@/lib/team-operating-style/comparison";

export function TeamOperatingStyleReport({ snapshot, locale, legacyPattern }: {
  snapshot?: TeamStyleSnapshot | null; locale: Locale; legacyPattern?: string | null;
}) {
  const sections = presentTeamStyle(snapshot, locale, legacyPattern);
  const op = snapshot?.operating;
  const comp = snapshot?.composition;
  const tr = (key: string) => t(`tos.report.${key}`, locale);
  const num = (value: number) => value.toLocaleString(locale === "hu" ? "hu-HU" : "en-GB", { maximumFractionDigits: 1 });
  const nearMiddle = op && AXES.every((axis) => op.axes[axis].status === "available" && op.axes[axis].flags.includes("near_midpoint"));
  return <div className="space-y-8" data-testid="team-style-report">
    {sections.map((section, index) => {
      // Keep absent-data, coverage, cohort and uncertainty notices visible.
      // Only the introductory methodology moves into the disclosure.
      const [methodology, ...notices] = section.notes;
      const heading = index === 0 && nearMiddle ? tr("nearMiddleSummary") : section.heading;
      return <section key={section.title} className="rounded-2xl border border-sand bg-surface-card p-5 sm:p-8">
        <h2 className="text-sm font-medium text-muted">{section.title}</h2>
        {heading && <p className="mt-4 max-w-2xl font-fraunces text-title text-ink">{heading}</p>}
        {index === 0 && nearMiddle && <p className="mt-3 max-w-2xl text-body text-ink-body">{tr("nearMiddleHelp")}</p>}
        <div className="mt-4 space-y-2">{notices.map((note) => <p key={note} className="max-w-3xl text-sm leading-relaxed text-muted">{note}</p>)}</div>
        {index === 0 && op && <div className="mt-6 divide-y divide-sand">
          {AXES.map((axis) => {
            const value = op.axes[axis];
            const label = t(`tos.axes.${axis}.name`, locale);
            return <div key={axis} className="py-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-body font-semibold text-ink">{label}</h3>
                <span className="text-sm text-muted">{tr("validAnswers")}: {value.n}/{op.eligibleCount}</span>
              </div>
              <div className="mt-3 flex justify-between gap-4 text-sm text-muted">
                <span>{t(`tos.axes.${axis}.left`, locale)}</span><span className="text-right">{t(`tos.axes.${axis}.right`, locale)}</span>
              </div>
              {value.mean === null ? <p className="mt-3 text-sm text-muted">{tr("insufficient")}</p> :
                <div role="img" aria-label={`${label}: ${tr("mean")}: ${num(value.mean)}/100. ${tr("centerLegend")}`} className="relative mx-2 my-4 h-2 rounded-full bg-sand">
                  <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-5 w-px -translate-y-1/2 bg-ink/30" />
                  <span aria-hidden="true" className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-sage" style={{ left: `${value.mean}%` }} />
                </div>}
              {value.flags.filter((flag) => flag !== "near_midpoint").map((flag) => <p key={flag} className="mt-2 text-sm text-muted">{tr(`flags.${flag}`)}</p>)}
            </div>;
          })}
          <p className="pt-4 text-sm text-muted">{tr("centerLegend")}</p>
        </div>}
        {index === 1 && comp && <div className="mt-6 grid gap-x-10 gap-y-5 sm:grid-cols-2">
          {COMPOSITION_AXES.map((axis) => <div key={axis}>
            <div className="flex items-baseline justify-between gap-3"><h3 className="text-sm font-medium text-ink">{tr(axis)}</h3><span className="text-sm tabular-nums text-ink">{num(comp.axes[axis].mean)}<span className="text-muted"> /100</span></span></div>
            <div role="img" aria-label={`${tr(axis)}: ${num(comp.axes[axis].mean)}/100`} className="mt-3 h-2 overflow-hidden rounded-full bg-sand"><div className="h-full rounded-full bg-sage" style={{ width: `${comp.axes[axis].mean}%` }} /></div>
          </div>)}
          <p className="text-sm text-muted sm:col-span-2">{tr("cohesionCaveat")}</p>
        </div>}
        {section.prompts.length > 0 && <div className="mt-6 divide-y divide-sand">
          {section.prompts.map((prompt) => <details key={prompt.title} className="group py-2">
            <summary className="min-h-[44px] cursor-pointer py-3 text-body font-medium text-ink">{prompt.title}</summary>
            <div className="grid gap-6 pb-5 pt-2 sm:grid-cols-2">
              <div><h3 className="text-sm font-semibold text-ink">{tr("support")}</h3><p className="mt-2 text-body text-ink-body">{prompt.support}</p></div>
              <div><h3 className="text-sm font-semibold text-ink">{tr("tension")}</h3><p className="mt-2 text-body text-ink-body">{prompt.tension}</p></div>
              <p className="text-sm text-muted sm:col-span-2">{prompt.context}</p>
            </div>
          </details>)}
        </div>}
        <details className="mt-6 border-t border-sand pt-3">
          <summary className="min-h-[44px] cursor-pointer py-3 text-sm font-medium text-bronze">{tr(index === 2 ? "interpretationDetails" : "measurementDetails")}</summary>
          <p className="mt-2 text-sm leading-relaxed text-muted">{methodology}</p>
          {section.rows.length > 0 && <dl className="mt-4 space-y-4">{section.rows.map((row) => <div key={row.label}><dt className="text-sm font-semibold text-ink">{row.label}</dt><dd className="mt-1 text-sm leading-relaxed text-ink-body">{row.detail}</dd></div>)}</dl>}
        </details>
      </section>;
    })}
  </div>;
}

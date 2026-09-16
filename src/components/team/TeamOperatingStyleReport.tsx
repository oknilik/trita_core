import { t, type Locale } from "@/lib/i18n";
import { presentTeamStyle } from "@/lib/team-operating-style/presentation";
import type { TeamStyleSnapshot } from "@/lib/team-operating-style/comparison";

export function TeamOperatingStyleReport({ snapshot, locale, legacyPattern }: {
  snapshot?: TeamStyleSnapshot | null; locale: Locale; legacyPattern?: string | null;
}) {
  return <div className="space-y-6" data-testid="team-style-report">
    {presentTeamStyle(snapshot, locale, legacyPattern).map((section) => <section key={section.title} className="rounded-2xl border border-sand bg-surface-card p-5 sm:p-6">
      <h2 className="font-fraunces text-heading text-ink">{section.title}</h2>
      {section.heading && <p className="mt-3 font-fraunces text-title text-ink">{section.heading}</p>}
      <div className="mt-3 space-y-2">{section.notes.map((note) => <p key={note} className="text-sm leading-relaxed text-muted">{note}</p>)}</div>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        {section.rows.map((row) => <div key={row.label} className="rounded-xl bg-cream p-4">
          <dt className="text-sm font-semibold text-ink">{row.label}</dt>
          <dd className="mt-2 text-sm leading-relaxed text-ink-body">{row.detail}</dd>
        </div>)}
      </dl>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{section.prompts.map((prompt) => <div key={prompt.title} className="rounded-xl border border-sand p-4">
        <h3 className="text-body font-semibold text-ink">{prompt.title}</h3>
        <p className="mt-2 text-sm text-muted">{prompt.context}</p>
        <p className="mt-4 text-sm font-semibold text-ink">{t("tos.report.support", locale)}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-body">{prompt.support}</p>
        <p className="mt-4 text-sm font-semibold text-ink">{t("tos.report.tension", locale)}</p>
        <p className="mt-1 text-sm leading-relaxed text-ink-body">{prompt.tension}</p>
      </div>)}</div>
    </section>)}
  </div>;
}

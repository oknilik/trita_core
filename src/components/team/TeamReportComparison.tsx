import type { SerializedTeamReport } from "@/lib/team-report";
import {
  compareTeamReports,
  type NumericChange,
} from "@/lib/team-report-comparison";
import { PSYCH_SAFETY_ITEMS } from "@/lib/psych-safety";
import { TEAM_ROLES } from "@/lib/team-role-scoring";
import { teamActionTargetLabel } from "@/lib/team-action-target";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";

const DIMENSION_LABELS: Record<string, { hu: string; en: string }> = {
  H: { hu: "Becsületesség-Alázat", en: "Honesty-Humility" },
  E: { hu: "Emocionalitás", en: "Emotionality" },
  X: { hu: "Extraverzió", en: "Extraversion" },
  A: { hu: "Barátságosság", en: "Agreeableness" },
  C: { hu: "Lelkiismeretesség", en: "Conscientiousness" },
  O: { hu: "Nyitottság", en: "Openness" },
};

const ROLE_COUNT = Object.keys(TEAM_ROLES).length;

function deltaLabel(value: number): string {
  return `${value > 0 ? "+" : ""}${value}`;
}

function transitionLabel(
  change: NumericChange,
  suffix = "",
  includeDelta = true,
): string {
  const delta = includeDelta ? ` (${deltaLabel(change.delta)}${suffix})` : "";
  return `${change.previous}${suffix} → ${change.current}${suffix}${delta}`;
}

function psychItemLabel(id: string, isHu: boolean): string {
  const item = PSYCH_SAFETY_ITEMS.find((candidate) => candidate.id === id);
  return item?.area[isHu ? "hu" : "en"] ?? id;
}

function roleLabel(code: string, isHu: boolean): string {
  const role = TEAM_ROLES[code as keyof typeof TEAM_ROLES];
  return role?.[isHu ? "hu" : "en"] ?? code;
}

function actionOutcomeMetric(
  outcome: ReturnType<typeof compareTeamReports>["actionOutcomes"][number],
  isHu: boolean,
): string {
  if (!outcome.metric) return isHu ? "Nincs összevethető adat" : "No comparable data";
  if (outcome.target.kind === "role_gap") {
    const state = (value: number) =>
      value === 1
        ? isHu ? "hézag" : "gap"
        : isHu ? "lefedett" : "covered";
    return `${state(outcome.metric.previous)} → ${state(outcome.metric.current)}`;
  }
  const suffix = outcome.target.kind === "trust_coverage" ? "%" : "";
  return transitionLabel(outcome.metric, suffix, outcome.direction !== "context_only");
}

function actionOutcomeGate(
  outcome: ReturnType<typeof compareTeamReports>["actionOutcomes"][number],
  isHu: boolean,
): string {
  if (outcome.gate === "unavailable") return isHu ? "nincs adat" : "no data";
  if (outcome.gate === "categorical") {
    return isHu ? "kategória szerinti állapot" : "categorical state";
  }
  if (outcome.gate === "descriptive") {
    return isHu ? "még nincs meghatározott mérési küszöb" : "no calibrated gate yet";
  }
  return outcome.significant
    ? isHu ? "igen · meghaladja a mérési küszöböt" : "yes · beyond measurement gate"
    : isHu ? "nem · mérési hibán belül" : "no · within measurement error";
}

function actionOutcomeDirection(
  direction: ReturnType<typeof compareTeamReports>["actionOutcomes"][number]["direction"],
  isHu: boolean,
): string {
  const labels = {
    improved: isHu ? "kedvező irány" : "favourable direction",
    worsened: isHu ? "kedvezőtlen irány" : "unfavourable direction",
    unchanged: isHu ? "változatlan" : "unchanged",
    no_clear_change: isHu ? "nem igazolható elmozdulás" : "no defensible movement",
    context_only: isHu ? "csak az összetétel értelmezését segíti" : "composition context only",
    unavailable: isHu ? "nem mérhető" : "not measurable",
  } as const;
  return labels[direction];
}

export function TeamReportComparison({
  current,
  previous,
  isHu,
}: {
  current: SerializedTeamReport;
  previous: SerializedTeamReport;
  isHu: boolean;
}) {
  const comparison = compareTeamReports(current, previous);
  const significantDimensionChanges = comparison.stableCoreDimensionChanges.filter(
    (item) => item.significant,
  );
  const significantPsychItems = comparison.psychSafetyItemChanges.filter(
    (item) => item.significant,
  );
  const withinErrorCount =
    comparison.stableCoreDimensionChanges.length - significantDimensionChanges.length;
  const compositionComparable = comparison.composition.status === "comparable";
  const currentDate = current.publishedAt
    ? new Date(current.publishedAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB")
    : "–";
  const previousDate = previous.publishedAt
    ? new Date(previous.publishedAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB")
    : "–";

  return (
    <section aria-labelledby="round-comparison-title">
      <SectionEyebrow>{isHu ? "mérési körök" : "measurement rounds"}</SectionEyebrow>
      <h2 id="round-comparison-title" className="mt-1 font-fraunces text-xl text-ink">
        {isHu ? "Mi változott az előző kör óta?" : "What changed since the previous round?"}
      </h2>
      <p className="mt-1 text-xs text-muted">
        {previousDate} → {currentDate}
      </p>

      {comparison.composition.status === "unknown" ? (
        <div
          className="mt-3 rounded-xl border border-state-warning-border bg-state-warning-bg p-3 text-xs text-state-warning-fg"
          role="status"
        >
          {isHu
            ? "A régebbi riportban nem rögzítettük, kiknek az eredményeiből készült. Ezért nem ellenőrizhető, mennyire egyezik a két kör résztvevőinek összetétele. A kapcsolati és szerepmutatók külön-külön értelmezhetők; a személyiségprofil változása nem ellenőrizhető."
            : "The older report has no contributor snapshot. Composition cannot be verified; relationship and role metrics are descriptive snapshots only, and the profile control is not interpretable."}
        </div>
      ) : comparison.composition.status === "changed" ? (
        <div
          className="mt-3 rounded-xl border border-state-warning-border bg-state-warning-bg p-3 text-xs text-state-warning-fg"
          role="alert"
        >
          <p className="font-semibold">
            {isHu
              ? "A két kör résztvevőinek összetétele túlságosan eltér ahhoz, hogy az eredményekből a csapat változására következtessünk."
              : "Round composition is not similar enough to claim team change."}
          </p>
          <p className="mt-1">
            {isHu
              ? `Közös kitöltők: ${comparison.composition.common} · új ebben a körben: ${comparison.composition.joined} · kimaradt: ${comparison.composition.left} · átfedés: ${comparison.composition.overlapPct}%`
              : `Common contributors: ${comparison.composition.common} · new this round: ${comparison.composition.joined} · absent this round: ${comparison.composition.left} · overlap: ${comparison.composition.overlapPct}%`}
          </p>
        </div>
      ) : (
        <div
          className="mt-3 rounded-xl border border-sage/30 bg-sage/5 p-3 text-xs text-ink-body"
          role="status"
        >
          {isHu
            ? `Stabil mag: ${comparison.composition.common} közös kitöltő · új ebben a körben: ${comparison.composition.joined} · kimaradt: ${comparison.composition.left}. A személyiségprofil változását csak a mindkét körben részt vevő tagok adatai alapján ellenőrizzük.`
            : `Stable core: ${comparison.composition.common} common contributors · new this round: ${comparison.composition.joined} · absent: ${comparison.composition.left}. Profile control uses common members only.`}
        </div>
      )}

      <h3 className="mt-5 font-fraunces text-lg text-ink">
        {isHu ? "A közös munka alakításával változtatható területek" : "Mutable, intervention-sensitive layers"}
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <DashboardPanel className="p-4">
          <p className="text-micro uppercase tracking-widest text-muted">
            {isHu ? "Pszichológiai biztonság" : "Psychological safety"}
          </p>
          {comparison.psychSafetyDelta === null ? (
            <p className="mt-2 text-xs text-muted">
              {isHu ? "Nincs két összevethető pulzusmérés." : "Two comparable pulses are not available."}
            </p>
          ) : (
            <>
              <p className="mt-1 font-fraunces text-2xl text-ink">
                {comparison.psychSafetySignificant
                  ? deltaLabel(comparison.psychSafetyDelta)
                  : isHu
                    ? "mérési hibán belül"
                    : "within measurement error"}
              </p>
              {significantPsychItems.length > 0 ? (
                <ul className="mt-3 space-y-1.5 border-t border-sand pt-3">
                  {significantPsychItems.slice(0, 4).map((item) => (
                    <li key={item.id} className="flex justify-between gap-3 text-xs text-ink-body">
                      <span>
                        {psychItemLabel(item.id, isHu)}
                        {item.weakness === "resolved"
                          ? isHu
                            ? " · gyenge területből kilépett"
                            : " · no longer a weak area"
                          : item.weakness === "emerged"
                            ? isHu
                              ? " · új gyenge terület"
                              : " · new weak area"
                            : ""}
                      </span>
                      <span className="shrink-0 font-semibold text-ink">
                        {deltaLabel(item.delta)}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-xs text-muted">
                  {isHu
                    ? "Egyik állításnál sem látszik a mérési küszöböt meghaladó változás."
                    : "No item-level movement exceeds the measurement gate."}
                </p>
              )}
            </>
          )}
        </DashboardPanel>

        <DashboardPanel className="p-4">
          <p className="text-micro uppercase tracking-widest text-muted">
            {isHu ? "Bizalmi háló" : "Trust network"}
          </p>
          {comparison.trustNetwork ? (
            <div className="mt-2 space-y-1.5 text-xs text-ink-body">
              <p className="font-semibold text-ink">
                {comparison.trustNetwork.coveragePct
                  ? transitionLabel(
                      comparison.trustNetwork.coveragePct,
                      "%",
                      compositionComparable,
                    )
                  : transitionLabel(
                      comparison.trustNetwork.measuredPairs,
                      "",
                      compositionComparable,
                    )}
              </p>
              <p>
                {isHu ? "Mért kapcsolatok" : "Measured relationships"}: {transitionLabel(
                  comparison.trustNetwork.measuredPairs,
                  "",
                  compositionComparable,
                )}
              </p>
              {comparison.trustNetwork.hubCount ? (
                <p>
                  {isHu ? "Összekötők" : "Hubs"}: {transitionLabel(
                    comparison.trustNetwork.hubCount,
                    "",
                    compositionComparable,
                  )}
                </p>
              ) : null}
              {comparison.trustNetwork.isolatedCount ? (
                <p>
                  {isHu ? "Erős bizalmi kapcsolat nélküli tagok" : "Isolated members"}: {transitionLabel(
                    comparison.trustNetwork.isolatedCount,
                    "",
                    compositionComparable,
                  )}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">
              {isHu
                ? "Nincs két összevethető, mért bizalmi háló."
                : "Two comparable measured trust networks are not available."}
            </p>
          )}
        </DashboardPanel>

        <DashboardPanel className="p-4">
          <p className="text-micro uppercase tracking-widest text-muted">
            {isHu ? "Csapatszerep-lefedettség" : "Team-role coverage"}
          </p>
          {comparison.roleCoverage ? (
            <div className="mt-2 space-y-1.5 text-xs text-ink-body">
              <p className="font-semibold text-ink">
                {comparison.roleCoverage.coveredRoles.previous}/{ROLE_COUNT} → {comparison.roleCoverage.coveredRoles.current}/{ROLE_COUNT}
                {compositionComparable
                  ? ` (${deltaLabel(comparison.roleCoverage.coveredRoles.delta)})`
                  : ""}
              </p>
              <p>
                {isHu ? "Mért szerepkérdőívek" : "Measured role questionnaires"}: {transitionLabel(
                  comparison.roleCoverage.questionnaireCount,
                  "",
                  compositionComparable,
                )}
              </p>
              {compositionComparable && comparison.roleCoverage.resolvedGaps.length > 0 ? (
                <p className="text-state-success-fg">
                  {isHu ? "Már lefedett" : "Now covered"}: {comparison.roleCoverage.resolvedGaps
                    .map((code) => roleLabel(code, isHu))
                    .join(", ")}
                </p>
              ) : null}
              {compositionComparable && comparison.roleCoverage.newGaps.length > 0 ? (
                <p className="text-state-warning-fg">
                  {isHu ? "Új hézag" : "New gap"}: {comparison.roleCoverage.newGaps
                    .map((code) => roleLabel(code, isHu))
                    .join(", ")}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">
              {isHu
                ? "Nincs két összevethető csapatszerepmérés."
                : "Two comparable role snapshots are not available."}
            </p>
          )}
        </DashboardPanel>

        <DashboardPanel className="p-4">
          <p className="text-micro uppercase tracking-widest text-muted">
            {isHu ? "Önkép ↔ külső kép" : "Self-view ↔ external view"}
          </p>
          {comparison.externalPerspective || comparison.peerRolePerspective ? (
            <div className="mt-2 space-y-2 text-xs text-ink-body">
              {comparison.externalPerspective ? (
                <div>
                  <p className="font-semibold text-ink">
                    {isHu ? "Személyiségkép" : "Personality view"}: {transitionLabel(
                      comparison.externalPerspective.gapSharePct,
                      "%",
                      compositionComparable,
                    )}
                  </p>
                  <p className="mt-0.5 text-muted">
                    {isHu ? "Tagok, akiknél érdemi eltérés látszik" : "Members with a material gap"}: {comparison.externalPerspective.gapCount.current}/{comparison.externalPerspective.coveredCount.current}
                  </p>
                </div>
              ) : null}
              {comparison.peerRolePerspective ? (
                <div className="border-t border-sand pt-2">
                  <p className="font-semibold text-ink">
                    {isHu ? "Saját és csapattársi szerepértékelés" : "Role self-view and peer view"}: {transitionLabel(
                      comparison.peerRolePerspective.mismatchSharePct,
                      "%",
                      compositionComparable,
                    )}
                  </p>
                  <p className="mt-0.5 text-muted">
                    {isHu ? "Eltérés a három vezető szerepben" : "Different top-three view"}: {comparison.peerRolePerspective.mismatchCount.current}/{comparison.peerRolePerspective.comparedCount.current}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">
              {isHu
                ? "Nincs két olyan összesített visszajelzés, amely eléri a névtelenséget védő minimális válaszszámot."
                : "Two external-view snapshots above the anonymity floor are not available."}
            </p>
          )}
        </DashboardPanel>
      </div>

      {comparison.actionOutcomes.length > 0 ? (
        <div className="mt-5">
          <h3 className="font-fraunces text-lg text-ink">
            {isHu ? "Vállalt lépés → mért eredmény" : "Committed action → measured outcome"}
          </h3>
          <div className="mt-3 overflow-x-auto rounded-xl border border-sand">
            <table className="min-w-full border-collapse text-left text-xs">
              <thead className="bg-cream text-micro uppercase tracking-widest text-muted">
                <tr>
                  <th className="px-3 py-2 font-semibold">{isHu ? "Akció" : "Action"}</th>
                  <th className="px-3 py-2 font-semibold">{isHu ? "Célmutató" : "Target"}</th>
                  <th className="px-3 py-2 font-semibold">{isHu ? "Kimenet" : "Outcome"}</th>
                  <th className="px-3 py-2 font-semibold">{isHu ? "Mérési küszöb" : "Measurement gate"}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-sand bg-surface-card">
                {comparison.actionOutcomes.map((outcome, index) => (
                  <tr key={`${outcome.title}-${index}`}>
                    <td className="px-3 py-3 align-top text-ink">
                      <p className="font-semibold">{outcome.title}</p>
                      <p className="mt-0.5 text-micro text-muted">
                        {outcome.status === "done"
                          ? isHu ? "kész" : "done"
                          : outcome.status === "in_progress"
                            ? isHu ? "folyamatban" : "in progress"
                            : outcome.status === "blocked"
                              ? isHu ? "elakadt" : "blocked"
                              : isHu ? "nem indult" : "not started"}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top text-ink-body">
                      {teamActionTargetLabel(outcome.target, isHu ? "hu" : "en")}
                    </td>
                    <td className="px-3 py-3 align-top text-ink-body">
                      <p className="font-semibold text-ink">
                        {actionOutcomeMetric(outcome, isHu)}
                      </p>
                      <p className="mt-0.5 text-micro text-muted">
                        {actionOutcomeDirection(outcome.direction, isHu)}
                      </p>
                    </td>
                    <td className="px-3 py-3 align-top text-ink-body">
                      {actionOutcomeGate(outcome, isHu)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}

      <h3 className="mt-5 font-fraunces text-lg text-ink">
        {isHu ? "Mérési kontrollok" : "Measurement controls"}
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <DashboardPanel className="p-4">
          <p className="text-micro uppercase tracking-widest text-muted">
            {isHu ? "Kitöltöttség" : "Completion"}
          </p>
          <p className="mt-1 font-fraunces text-2xl text-ink">
            {comparison.completionDelta === null
              ? "–"
              : `${deltaLabel(comparison.completionDelta)} pp`}
          </p>
        </DashboardPanel>
        <DashboardPanel className="p-4">
          <p className="text-micro uppercase tracking-widest text-muted">
            {isHu ? "Stabil mag profilkontrollja" : "Stable-core profile control"}
          </p>
          {!compositionComparable ? (
            <p className="mt-2 text-xs text-muted">
              {isHu ? "Nem értelmezhető" : "Not interpretable"}
            </p>
          ) : significantDimensionChanges.length > 0 ? (
            <>
              <p className="mt-2 text-xs font-semibold text-state-warning-fg">
                {isHu
                  ? "Az ellenőrzés eltérést mutat a várhatóan stabil személyiségprofilban:"
                  : "A control difference appears in the expected-stable profile:"}
              </p>
              <ul className="mt-2 space-y-1.5">
                {significantDimensionChanges.slice(0, 3).map((item) => (
                  <li key={item.code} className="flex justify-between gap-3 text-xs text-ink-body">
                    <span>
                      {DIMENSION_LABELS[item.code]?.[isHu ? "hu" : "en"] ??
                        (isHu ? "Dimenzió" : "Dimension")}
                    </span>
                    <span className="font-semibold text-ink">{deltaLabel(item.delta)}</span>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-2 text-xs text-ink-body">
              {isHu
                ? "A profil stabil: nincs a mérési hibát meghaladó eltérés."
                : "Stable: no profile difference exceeds measurement error."}
            </p>
          )}
        </DashboardPanel>
      </div>

      {withinErrorCount > 0 ? (
        <p className="mt-2 text-micro text-muted">
          {isHu
            ? `${withinErrorCount} személyiségdimenzióban az eltérés a mérési hibán belül maradt, ezért ezeket nem rangsoroljuk.`
            : `${withinErrorCount} profile dimension difference${withinErrorCount === 1 ? "" : "s"} remained within measurement error and is not ranked.`}
        </p>
      ) : null}
      <p className="mt-2 text-micro text-muted">
        {isHu
          ? "A pulzusmérés minden alkalommal névtelen pillanatképet ad a csapatról. Az állításoknál csak az óvatosan meghatározott mérési küszöböt meghaladó eltérést emeljük ki. A kapcsolatok, a szerepek és a másoktól kapott visszajelzések mutatói a két időpontot írják le; önmagukban nem bizonyítják a változás okát. Ha a résztvevők köre változott, a nyilak csak az értelmezést segítik."
          : "The pulse is a repeated anonymous cross-section; a conservative measurement gate protects item claims. Network, role and external-view metrics are descriptive before–after signals, not causal evidence on their own. When composition changes, arrows provide context only."}
      </p>
    </section>
  );
}

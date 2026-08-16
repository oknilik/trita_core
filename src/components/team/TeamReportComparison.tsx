import type { SerializedTeamReport } from "@/lib/team-report";
import {
  compareTeamReports,
  type NumericChange,
} from "@/lib/team-report-comparison";
import { PSYCH_SAFETY_ITEMS } from "@/lib/psych-safety";
import { TEAM_ROLES } from "@/lib/team-role-scoring";
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
    : "—";
  const previousDate = previous.publishedAt
    ? new Date(previous.publishedAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB")
    : "—";

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
            ? "A régebbi riport nem tartalmaz hozzájáruló-pillanatképet. Az összetétel nem ellenőrizhető; a relációs és szerep-mutatók csak két leíró pillanatképként olvashatók, a profilkontroll nem értelmezhető."
            : "The older report has no contributor snapshot. Composition cannot be verified; relationship and role metrics are descriptive snapshots only, and the profile control is not interpretable."}
        </div>
      ) : comparison.composition.status === "changed" ? (
        <div
          className="mt-3 rounded-xl border border-state-warning-border bg-state-warning-bg p-3 text-xs text-state-warning-fg"
          role="alert"
        >
          <p className="font-semibold">
            {isHu
              ? "A két kör összetétele nem elég hasonló a csapatváltozás állításához."
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
            ? `Stabil mag: ${comparison.composition.common} közös kitöltő · új ebben a körben: ${comparison.composition.joined} · kimaradt: ${comparison.composition.left}. A profilkontroll csak a közös tagokból készül.`
            : `Stable core: ${comparison.composition.common} common contributors · new this round: ${comparison.composition.joined} · absent: ${comparison.composition.left}. Profile control uses common members only.`}
        </div>
      )}

      <h3 className="mt-5 font-fraunces text-lg text-ink">
        {isHu ? "Változékony, beavatkozás-érzékeny rétegek" : "Mutable, intervention-sensitive layers"}
      </h3>
      <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
        <DashboardPanel className="p-4">
          <p className="text-micro uppercase tracking-widest text-muted">
            {isHu ? "Pszichológiai biztonság" : "Psychological safety"}
          </p>
          {comparison.psychSafetyDelta === null ? (
            <p className="mt-2 text-xs text-muted">
              {isHu ? "Nincs két összevethető pulse." : "Two comparable pulses are not available."}
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
                    ? "Nincs item-szintű, mérési kapun túli elmozdulás."
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
                  {isHu ? "Beágyazatlan tagok" : "Isolated members"}: {transitionLabel(
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
                ? "Nincs két összevethető szerep-pillanatkép."
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
                    {isHu ? "Személyiség-kép" : "Personality view"}: {transitionLabel(
                      comparison.externalPerspective.gapSharePct,
                      "%",
                      compositionComparable,
                    )}
                  </p>
                  <p className="mt-0.5 text-muted">
                    {isHu ? "Érdemi eltérésű tagok" : "Members with a material gap"}: {comparison.externalPerspective.gapCount.current}/{comparison.externalPerspective.coveredCount.current}
                  </p>
                </div>
              ) : null}
              {comparison.peerRolePerspective ? (
                <div className="border-t border-sand pt-2">
                  <p className="font-semibold text-ink">
                    {isHu ? "Szerep-önkép és peer-kép" : "Role self-view and peer view"}: {transitionLabel(
                      comparison.peerRolePerspective.mismatchSharePct,
                      "%",
                      compositionComparable,
                    )}
                  </p>
                  <p className="mt-0.5 text-muted">
                    {isHu ? "Eltérő top-3 kép" : "Different top-three view"}: {comparison.peerRolePerspective.mismatchCount.current}/{comparison.peerRolePerspective.comparedCount.current}
                  </p>
                </div>
              ) : null}
            </div>
          ) : (
            <p className="mt-2 text-xs text-muted">
              {isHu
                ? "Nincs két, anonimitási padló feletti külső kép."
                : "Two external-view snapshots above the anonymity floor are not available."}
            </p>
          )}
        </DashboardPanel>
      </div>

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
              ? "—"
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
                  ? "A stabilnak várt profilban kontroll-eltérés látszik:"
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
                ? "Stabil: nincs mérési hibán túli profil-eltérés."
                : "Stable: no profile difference exceeds measurement error."}
            </p>
          )}
        </DashboardPanel>
      </div>

      {withinErrorCount > 0 ? (
        <p className="mt-2 text-micro text-muted">
          {isHu
            ? `${withinErrorCount} profil-dimenzió eltérése a mérési hibán belül maradt, ezért nem rangsoroljuk.`
            : `${withinErrorCount} profile dimension difference${withinErrorCount === 1 ? "" : "s"} remained within measurement error and is not ranked.`}
        </p>
      ) : null}
      <p className="mt-2 text-micro text-muted">
        {isHu
          ? "A pulse ismételt anonim keresztmetszet; az itemeket konzervatív mérési kapu védi. A háló-, szerep- és külsőkép-mutatók leíró előtte–utána jelek, nem önmagukban oksági bizonyítékok. Összetétel-változásnál a nyilak kizárólag kontextust adnak."
          : "The pulse is a repeated anonymous cross-section; a conservative measurement gate protects item claims. Network, role and external-view metrics are descriptive before–after signals, not causal evidence on their own. When composition changes, arrows provide context only."}
      </p>
    </section>
  );
}

import { TEAM_ROLES } from "@/lib/team-role-scoring";
import { TEAM_ROLE_PEER_MIN_RATERS } from "@/lib/team-role-peer";
import { t, type Locale } from "@/lib/i18n";
import {
  PSYCH_SAFETY_ITEMS,
  PSYCH_SAFETY_ACTIONS,
  leaderTrapsForWeakItems,
  getPsychSafetyItem,
} from "@/lib/psych-safety";
import type { SerializedTeamReport } from "@/lib/team-report";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { TEAM_PRESSURE_CONTENT, TEAM_PRESSURE_POLARIZED_TEXT } from "@/lib/team-pressure";
import type { HexacoCode } from "@/lib/hexaco";

const DIM_LABELS: Record<string, { hu: string; en: string }> = {
  H: { hu: "Becsületesség-Alázat", en: "Honesty-Humility" },
  E: { hu: "Emocionalitás", en: "Emotionality" },
  X: { hu: "Extraverzió", en: "Extraversion" },
  A: { hu: "Barátságosság", en: "Agreeableness" },
  C: { hu: "Lelkiismeretesség", en: "Conscientiousness" },
  O: { hu: "Nyitottság", en: "Openness" },
};

// Dimenzió-színek — a kanonikus HEXACO-paletta (color-system.ts); mark-
// (base) forma, a team oldal dimConfigs palettájával azonos forrásból.
import { DIMENSION_BASE, DYNAMICS_COLORS_CSS } from "@/lib/color-system";

const DIM_COLORS: Record<string, string> = DIMENSION_BASE;

const DIM_ORDER = ["H", "E", "X", "A", "C", "O"] as const;

// Hiányzó csapatszerep rövid következménye a vezető nyelvén.
const ROLE_GAP_HINTS: Record<string, { hu: string; en: string }> = {
  OG: { hu: "új ötletek külső impulzus nélkül elmaradhatnak", en: "fresh ideas may need outside stimulus" },
  KE: { hu: "külső lehetőségek feltárása gyengülhet", en: "exploring outside opportunities may weaken" },
  KO: { hu: "a célok összehangolása és a delegálás sérülhet", en: "goal alignment and delegation may suffer" },
  HA: { hu: "akadályoknál hiányozhat a lendület", en: "momentum may stall at obstacles" },
  ER: { hu: "a döntések kritikus mérlegelése gyengülhet", en: "critical evaluation of decisions may weaken" },
  CS: { hu: "a feszültségoldás és a kohézió sérülhet", en: "tension defusing and cohesion may suffer" },
  MV: { hu: "az ötletek gyakorlati megvalósítása lassulhat", en: "turning ideas into practice may slow down" },
  MI: { hu: "a feladatok gondos, határidőre történő befejezése nehezebbé válhat", en: "quality closure and deadlines may slip" },
  SZ: { hu: "a mély szakértői tudás hiányozhat", en: "deep specialist knowledge may be missing" },
};

// Szerep-mátrix oszlopok: gondolkodó / cselekvő / emberközpontú szerepek.
const ROLE_MATRIX: Array<{ hu: string; en: string; roles: string[] }> = [
  { hu: "Gondolkodó", en: "Thinking", roles: ["OG", "ER", "SZ"] },
  { hu: "Cselekvő", en: "Action", roles: ["HA", "MV", "MI"] },
  { hu: "Emberközpontú", en: "People", roles: ["KO", "CS", "KE"] },
];

const QUALITY_LABELS: Record<string, { hu: string; en: string }> = {
  none: { hu: "Nincs elegendő adat", en: "Insufficient data" },
  partial: { hu: "Részleges adatalap", en: "Partial data basis" },
  sufficient: { hu: "Megbízható adatalap", en: "Reliable data basis" },
};

// Dinamika-kategóriák — dokumentált KIVÉTEL: státusz-jellegű színkódolás
// adat-kontextusban (color-system DYNAMICS_COLORS_CSS), mindig felirattal
// (sosem csak színnel) jelölve. Paletta CVD-validálva (dataviz validator).
//
// A kategória-magyarázat FORRÁSFÜGGŐ (hitelességi alapelv): a profil-becslés
// éle munkastílus-hasonlóságot, a mért bizalmi kör éle BIZALMAT kódol —
// mért élt hasonlóságként magyarázni hamis állítás lenne. Vegyes forrásnál
// mindkét olvasatot megnevezzük, egyiket sem állítjuk minden párra.
type DynamicsSourceKind = "trust_round" | "profile_estimate" | "mixed";

const DYNAMICS_SEGMENTS = [
  {
    key: "alignedCount",
    color: DYNAMICS_COLORS_CSS.aligned,
    chip: "bg-[var(--color-state-success-bg)] text-[var(--color-state-success-fg)]",
    hu: "Összehangolt",
    en: "Aligned",
    explain: {
      profile_estimate: {
        hu: "hasonló munkastílusú páros – kevés egyeztetéssel is gördülékenyen dolgoznak együtt.",
        en: "similar working styles – they collaborate smoothly with little alignment effort.",
      },
      trust_round: {
        hu: "erős, kölcsönös bizalmi kapcsolat – a mért bizalmi kör szerint gördülékeny az együttműködésük.",
        en: "a strong, mutual trust connection – per the measured trust round, their collaboration runs smoothly.",
      },
      mixed: {
        hu: "összehangolt páros – mért erős bizalom vagy hasonló munkastílus (a forrás páronként eltér).",
        en: "an aligned pair – measured strong trust or similar working styles (the source varies by pair).",
      },
    },
  },
  {
    key: "complementaryCount",
    color: DYNAMICS_COLORS_CSS.complementary,
    chip: "bg-[var(--color-state-info-bg)] text-[var(--color-state-info-fg)]",
    hu: "Kiegészítő",
    en: "Complementary",
    explain: {
      profile_estimate: {
        hu: "eltérő, de egymáshoz illeszthető munkastílusok: más-más helyzetben lehetnek erősek, ami segítheti a feladatok megosztását.",
        en: "different but compatible styles – strong in different situations, a good basis for dividing work.",
      },
      trust_round: {
        hu: "közepes mért bizalom: működő kapcsolat, amely tovább erősíthető.",
        en: "moderate measured trust – a working relationship with room to deepen.",
      },
      mixed: {
        hu: "köztes páros – közepes mért bizalom vagy eltérő, de összeférő stílusok (a forrás páronként eltér).",
        en: "an in-between pair – moderate measured trust or different but compatible styles (the source varies by pair).",
      },
    },
  },
  {
    key: "frictionCount",
    color: DYNAMICS_COLORS_CSS.friction,
    chip: "bg-[var(--color-state-warning-bg)] text-[var(--color-state-warning-fg)]",
    hu: "Súrlódási potenciál",
    en: "Friction potential",
    explain: {
      profile_estimate: {
        hu: "nagy munkastílus-különbség (pl. lelkiismeretesség, kommunikáció) – tisztázott normák nélkül feszültségforrás lehet. Nem jelent tényleges konfliktust.",
        en: "big working-style differences (e.g. structure, communication) – a potential source of tension without agreed norms. It does not mean actual conflict.",
      },
      trust_round: {
        hu: "alacsony mért bizalom a párban – figyelmet érdemlő kapcsolat. Nem jelent tényleges konfliktust.",
        en: "low measured trust in the pair – a relationship worth attention. It does not mean actual conflict.",
      },
      mixed: {
        hu: "feszültség-jelzés – alacsony mért bizalom vagy nagy munkastílus-különbség (a forrás páronként eltér). Nem jelent tényleges konfliktust.",
        en: "a tension signal – low measured trust or big working-style differences (the source varies by pair). It does not mean actual conflict.",
      },
    },
  },
] as const;

function SectionHead({
  no,
  label,
  subtitle,
}: {
  no: string;
  label: string;
  subtitle?: string;
}) {
  return (
    <div className="mb-4 grid grid-cols-[2rem_minmax(0,1fr)] items-start gap-3 border-b border-sand/70 pb-4 md:mb-4 md:grid-cols-[2.5rem_minmax(0,1fr)] md:gap-4">
      <span className="pt-0.5 font-fraunces text-xl leading-none tabular-nums text-[var(--color-accent-primary-strong)]/70">
        {no}
      </span>
      <div className="min-w-0">
        <h2 className="font-fraunces text-xl leading-tight text-ink">{label}</h2>
        {subtitle ? <p className="mt-1 max-w-2xl text-caption leading-relaxed text-muted">{subtitle}</p> : null}
      </div>
    </div>
  );
}

export function TeamReportMeasurements({ report, isHu }: { report: SerializedTeamReport; isHu: boolean }) {
  const loc: Locale = isHu ? "hu" : "en";
  const agg = report.aggregates;
  const dynamicsTotal = agg?.dynamics ? agg.dynamics.alignedCount + agg.dynamics.complementaryCount + agg.dynamics.frictionCount : 0;
  const dynSource: DynamicsSourceKind = agg?.dynamics?.source ?? "profile_estimate";
  const radarDimensions = agg?.dimensionAverages ? DIM_ORDER.filter((dim) => typeof agg.dimensionAverages?.[dim] === "number").map((dim) => ({ code: dim, color: DIM_COLORS[dim], score: agg.dimensionAverages![dim] })) : [];
  let sectionCounter = 0;
  const secNo = () => String(++sectionCounter).padStart(2, "0");
  return <div className="space-y-6">
      {/* Csapatprofil: radar + szórás-sávok */}
      {agg?.dimensionAverages && (
        <section>
          <SectionHead
            no={secNo()}
            label={isHu ? "Összesített csapatprofil" : "Aggregate team profile"}
            subtitle={isHu
              ? "A csapat személyiségprofilja: az átlagok és a tagok közötti különbségek."
              : "The team's collective character – averages and internal diversity."}
          />
          <DashboardPanel className="p-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 md:items-center">
              <div className="mx-auto w-full max-w-[320px]">
                <RadarChart dimensions={radarDimensions} uid={`report-${report.id}`} />
              </div>

              <div className="flex flex-col gap-2.5">
                {Object.entries(agg.dimensionAverages).map(([dim, value]) => {
                  const spread = agg.dimensionSpread?.[dim];
                  const bandStart = spread !== undefined ? Math.max(0, value - spread) : null;
                  const bandEnd = spread !== undefined ? Math.min(100, value + spread) : null;
                  return (
                    <div
                      key={dim}
                      className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3"
                    >
                      <span className="text-xs text-ink-body md:w-36 md:shrink-0">
                        {DIM_LABELS[dim] ? (isHu ? DIM_LABELS[dim].hu : DIM_LABELS[dim].en) : dim}
                      </span>
                      <div className="flex min-w-0 flex-1 items-center gap-3">
                        <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-sand">
                          {bandStart !== null && bandEnd !== null && (
                            <div
                              className="absolute inset-y-0 rounded-full opacity-30"
                              style={{
                                left: `${bandStart}%`,
                                width: `${bandEnd - bandStart}%`,
                                backgroundColor: DIM_COLORS[dim] ?? "var(--color-sage)",
                              }}
                            />
                          )}
                          <div
                            className="absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
                            style={{
                              left: `${value}%`,
                              backgroundColor: DIM_COLORS[dim] ?? "var(--color-sage)",
                            }}
                          />
                        </div>
                        {/* Csak az átlag-szám látszik – a ±szórás-szám
                            2026-08-11-i termékdöntéssel lekerült a felületről;
                            a szórást a halvány sáv hordozza vizuálisan. */}
                        <span className="w-14 shrink-0 text-right font-mono text-xs text-ink">
                          {value}
                        </span>
                      </div>
                    </div>
                  );
                })}
                <p className="mt-1 text-micro text-muted">
                  {isHu
                    ? "Pont = csapatátlag, sáv = szórás (a csapaton belüli eltérés). Egyéni értékek nem jelennek meg."
                    : "Dot = team average, band = spread (in-team variation). Individual values are not shown."}
                </p>
              </div>
            </div>
          </DashboardPanel>
        </section>
      )}

      {/* Szerep-lefedettség: 3×3 mátrix */}
      {agg?.roleDistribution && (
        <section>
          <SectionHead
            no={secNo()}
            label={isHu ? "Szereplefedettség" : "Role coverage"}
            subtitle={isHu
              ? "Mely szerepek vannak lefedve, és hol vannak valódi hiányok."
              : "Which roles are covered and where the true gaps are."}
          />
          <DashboardPanel className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {ROLE_MATRIX.map((column) => (
                <div key={column.hu} className="flex flex-col gap-2">
                  <p className="text-caption font-semibold text-ink">
                    {isHu ? column.hu : column.en}
                  </p>
                  {column.roles.map((role) => {
                    const primaryCount = agg.roleDistribution!.counts[role] ?? 0;
                    const secondaryCount = agg.roleDistribution!.secondaryCounts?.[role] ?? 0;
                    const state =
                      primaryCount > 0 ? "primary" : secondaryCount > 0 ? "secondary" : "missing";
                    const roleDef = TEAM_ROLES[role as keyof typeof TEAM_ROLES];
                    return (
                      <div
                        key={role}
                        className={`flex min-h-[52px] items-center justify-between rounded-[12px] px-3.5 py-2 ${
                          state === "primary"
                            ? "border border-sage/35 bg-sage/10"
                            : state === "secondary"
                              ? "border border-state-info-border bg-state-info-bg/60"
                              : "border border-dashed border-sand bg-surface-card"
                        }`}
                      >
                        <span
                          className={`text-caption ${
                            state === "primary"
                              ? "font-semibold text-ink"
                              : state === "secondary"
                                ? "text-ink-body"
                                : "text-muted"
                          }`}
                        >
                          {roleDef ? (isHu ? roleDef.hu : roleDef.en) : role}
                        </span>
                        {state === "primary" ? (
                          <span className="flex items-center gap-1">
                            <span className="rounded-full bg-sage px-2 py-0.5 font-mono text-note font-semibold text-[var(--color-action-primary-fg)]">
                              {primaryCount}
                            </span>
                            {secondaryCount > 0 && (
                              <span className="rounded-full bg-layer-org-soft px-2 py-0.5 font-mono text-note font-semibold text-layer-org-bright">
                                +{secondaryCount}
                              </span>
                            )}
                          </span>
                        ) : state === "secondary" ? (
                          <span className="rounded-full bg-layer-org-soft px-2 py-0.5 font-mono text-note font-semibold text-layer-org-bright">
                            +{secondaryCount}
                          </span>
                        ) : (
                          <span className="text-micro uppercase tracking-wide text-muted">
                            {isHu ? "hiányzik" : "missing"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-note text-ink-body">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[4px] border border-sage/35 bg-sage/10" />
                {isHu ? "Elsődleges szerep a csapatban" : "Primary role in the team"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[4px] border border-state-info-border bg-state-info-bg" />
                {isHu ? "Csak tartalék (2-3. legerősebb szerepként)" : "Backup only (2nd–3rd strongest role)"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[4px] border border-dashed border-sand bg-surface-card" />
                {isHu ? "Senki nem fedi le" : "Covered by no one"}
              </span>
            </div>

            {agg.roleGaps && agg.roleGaps.length > 0 && (
              <div className="mt-4 border-t border-sand pt-4">
                <p className="mb-2 text-caption font-semibold text-ink">
                  {isHu ? "Hiányzó szerepek – mit jelenthetnek?" : "True gaps – what it may mean"}
                </p>
                <ul className="flex flex-col gap-1">
                  {agg.roleGaps.map((role) => (
                    <li key={role} className="text-xs text-ink-body">
                      <span className="font-semibold text-ink">
                        {TEAM_ROLES[role as keyof typeof TEAM_ROLES]
                          ? isHu
                            ? TEAM_ROLES[role as keyof typeof TEAM_ROLES].hu
                            : TEAM_ROLES[role as keyof typeof TEAM_ROLES].en
                          : role}
                      </span>
                      {ROLE_GAP_HINTS[role] && (
                        <span className="text-muted">
                          {" – "}
                          {isHu ? ROLE_GAP_HINTS[role].hu : ROLE_GAP_HINTS[role].en}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-3 text-micro text-muted">
              {isHu
                ? `Tagonként a 3 legerősebb szerepet számoljuk: az 1. elsődlegesként, a 2-3. tartalékként. ${agg.roleDistribution.questionnaireCount} valódi kitöltés · ${agg.roleDistribution.estimateCount} becslés.`
                : `We count each member's 3 strongest roles: the 1st as primary, the 2nd–3rd as backup. ${agg.roleDistribution.questionnaireCount} real fill-out · ${agg.roleDistribution.estimateCount} estimated.`}
            </p>

            {agg.peerRoles && agg.peerRoles.ratedCount > 0 && (
              <div className="mt-4 border-t border-sand pt-4">
                <p className="mb-2 text-caption font-semibold text-ink">
                  {isHu
                    ? "Csapatkép – társértékelésből (névtelen, összesített)"
                    : "Team view – from peer feedback (anonymous, aggregated)"}
                </p>
                <p className="text-xs leading-relaxed text-ink-body">
                  {isHu
                    ? `${agg.peerRoles.ratedCount} / ${agg.peerRoles.memberCount} tagnál állt össze a csapatkép (legalább ${TEAM_ROLE_PEER_MIN_RATERS} értékelő).`
                    : `Team view available for ${agg.peerRoles.ratedCount} / ${agg.peerRoles.memberCount} members (at least ${TEAM_ROLE_PEER_MIN_RATERS} raters).`}
                  {agg.peerRoles.comparedCount > 0 && (
                    <>
                      {" "}
                      {isHu
                        ? `Önkép–csapatkép összevetés ${agg.peerRoles.comparedCount} tagnál: ${agg.peerRoles.mismatchCount} tagnál eltérés látszik. Ezeket érdemes átbeszélni a vezetői eredményfeldolgozáson.`
                        : `Self-image vs. team view compared for ${agg.peerRoles.comparedCount} members: ${agg.peerRoles.mismatchCount} with differences – key talking points for the leadership debrief.`}
                    </>
                  )}
                </p>
                {Object.keys(agg.peerRoles.topRoleCounts).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {Object.entries(agg.peerRoles.topRoleCounts)
                      .sort((a, b) => b[1] - a[1])
                      .map(([role, count]) => (
                        <span
                          key={role}
                          className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-note font-semibold text-ink-body"
                        >
                          {TEAM_ROLES[role as keyof typeof TEAM_ROLES]
                            ? isHu
                              ? TEAM_ROLES[role as keyof typeof TEAM_ROLES].hu
                              : TEAM_ROLES[role as keyof typeof TEAM_ROLES].en
                            : role}
                          <span className="font-mono text-muted">×{count}</span>
                        </span>
                      ))}
                  </div>
                )}
              </div>
            )}
          </DashboardPanel>
        </section>
      )}

      {/* Együttműködési dinamika: stacked bar */}
      {agg?.dynamics && dynamicsTotal > 0 && (
        <section>
          <SectionHead
            no={secNo()}
            label={isHu ? "Együttműködési dinamika" : "Collaboration dynamics"}
            subtitle={
              dynSource === "trust_round"
                ? isHu
                  ? "Milyen erősek a felmért munkakapcsolatok – összkép, egyéni párok nélkül."
                  : "How strong the assessed working relationships are – an overview, without individual pairs."
                : dynSource === "mixed"
                  ? isHu
                    ? "A felmért kapcsolatok együttműködési képe – részben mért, részben becsült; összkép, egyéni párok nélkül."
                    : "The collaboration picture across the assessed relationships – partly measured, partly estimated; an overview, without individual pairs."
                  : isHu
                    ? "Mennyire hasonlóan dolgoznak a felmért kapcsolatok tagjai – összkép, egyéni párok nélkül."
                    : "How similarly people work across the assessed relationships – an overview, without individual pairs."
            }
          />
          <DashboardPanel className="p-6">
            <p className="mb-3 text-sm text-ink-body">
              {/* Forrás-hű fejléc: mért bizalmi kör élei NEM munkastílus-
                  összevetésből jönnek – annak nevezni hamis attribúció.
                  A darabszám FELMÉRT KAPCSOLAT (él), nem az összes tagpár:
                  profil-él csak felmért tagok közt épül, a kapcsolat nélküli
                  (disconnected) mért pár pedig nem kerül a képbe. */}
              {dynSource === "trust_round"
                ? isHu
                  ? `A csapat ${dynamicsTotal} felmért kapcsolatának mért bizalmi képe – milyen erős és kölcsönös a két ember munkakapcsolata.`
                  : `A measured trust picture of the team's ${dynamicsTotal} assessed relationships – how strong and mutual each working relationship is.`
                : dynSource === "mixed"
                  ? isHu
                    ? `A csapat ${dynamicsTotal} felmért kapcsolatának képe – részben mért bizalmi körből, részben profilalapú munkastílus-összevetésből.`
                    : `The picture of the team's ${dynamicsTotal} assessed relationships – partly from a measured trust round, partly from a profile-based working-style comparison.`
                  : isHu
                    ? `A csapat ${dynamicsTotal} felmért kapcsolatának munkastílus-összevetése – mennyire hasonlóan vagy eltérően dolgozik két ember.`
                    : `A working-style comparison of the team's ${dynamicsTotal} assessed relationships – how similarly or differently two people work.`}
            </p>

            <div className="flex h-5 w-full gap-[2px] overflow-hidden rounded-full">
              {DYNAMICS_SEGMENTS.map((segment) => {
                const count = agg.dynamics![segment.key];
                if (count === 0) return null;
                return (
                  <div
                    key={segment.key}
                    className="h-full rounded-[4px]"
                    style={{
                      width: `${(count / dynamicsTotal) * 100}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {DYNAMICS_SEGMENTS.map((segment) => {
                const count = agg.dynamics![segment.key];
                const pct = Math.round((count / dynamicsTotal) * 100);
                return (
                  <span
                    key={segment.key}
                    className={`rounded-full px-2.5 py-1 text-xs font-medium ${segment.chip}`}
                  >
                    {isHu ? segment.hu : segment.en} · {count} ({pct}%)
                  </span>
                );
              })}
            </div>

            {/* A kategória-magyarázó alapból csukva – a sűrűség csökkentésére. */}
            <details className="mt-4 rounded-[12px] border border-sand bg-cream/40">
              <summary className="cursor-pointer select-none px-4 py-2.5 text-xs font-semibold text-ink-body transition-colors hover:text-ink">
                {isHu ? "Mit jelentenek a kategóriák?" : "What do the categories mean?"}
              </summary>
              <ul className="flex flex-col gap-2 px-4 pb-3.5">
                {DYNAMICS_SEGMENTS.map((segment) => (
                  <li key={segment.key} className="flex items-start gap-2 text-xs text-ink-body">
                    <span
                      className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: segment.color }}
                    />
                    <span>
                      <span className="font-semibold text-ink">{isHu ? segment.hu : segment.en}:</span>{" "}
                      {isHu
                        ? segment.explain[dynSource].hu
                        : segment.explain[dynSource].en}
                    </span>
                  </li>
                ))}
              </ul>
            </details>

            <div className="mt-4 rounded-[12px] border border-sand bg-cream/60 p-3.5">
              <p className="text-xs leading-relaxed text-ink-body">
                <span className="font-semibold text-ink">
                  {isHu ? "Mit jelent ez a csapatra? " : "What does this mean for the team? "}
                </span>
                {(() => {
                  // Forrás-kapuzott értelmezés: hasonlóság/homogenitás/vakfolt
                  // KIZÁRÓLAG tisztán profil-becslésből állítható; mért
                  // bizalmi körnél az aligned többség MAGAS BIZALOM (egy
                  // sokszínű, magas bizalmú csapatnak tilos azt mondani,
                  // hogy a párjai személyiségben hasonlók), vegyes forrásnál
                  // egyik olvasat sem általánosítható.
                  const alignedShare = agg.dynamics!.alignedCount / dynamicsTotal;
                  const frictionShare = agg.dynamics!.frictionCount / dynamicsTotal;
                  if (frictionShare >= 0.4) {
                    if (dynSource === "trust_round") {
                      return isHu
                        ? "A párok jelentős részénél alacsony a mért bizalom. Érdemes a kapcsolatok minőségével közvetlenül foglalkozni – közös munkára szánt alkalmak, világos elvárások és vezetői figyelem erősítik a hálót."
                        : "A large share of pairs shows low measured trust. Work on relationship quality directly – shared working sessions, clear expectations and leadership attention strengthen the network.";
                    }
                    if (dynSource === "mixed") {
                      return isHu
                        ? "A párok jelentős részénél feszültségre utal a kép – részben alacsony mért bizalom, részben nagy munkastílus-különbség. Tisztázott működési normák és a gyengébb kapcsolatok célzott erősítése együtt segít."
                        : "A large share of pairs signals tension – partly low measured trust, partly big working-style differences. Agreed working norms together with targeted strengthening of the weaker relationships help.";
                    }
                    return isHu
                      ? "A párok jelentős részénél nagy a munkastílus-különbség. Tisztázott működési normák (döntéshozatal, határidő-kezelés, kommunikációs csatornák) nélkül ez visszatérő konfliktusforrás lehet – normákkal viszont a sokféleség szélesebb perspektívát ad."
                      : "A large share of pairs shows big working-style differences. Without agreed working norms (decision-making, deadlines, communication channels) this can become a recurring source of conflict – with norms, the diversity brings broader perspective.";
                  }
                  if (alignedShare >= 0.5) {
                    if (dynSource === "trust_round") {
                      return isHu
                        ? "A párok többségénél erős, kölcsönös a mért bizalom – stabil együttműködési alap, amire építeni lehet. Ez a bizalom erejét mutatja, nem azt, hogy a tagok személyisége hasonló."
                        : "Most pairs show strong, mutual measured trust – a stable collaboration base to build on. This reflects the strength of trust, not that members' personalities are similar.";
                    }
                    if (dynSource === "mixed") {
                      return isHu
                        ? "A párok többségénél összehangolt működésre utalnak az adatok: egy részüknél erős bizalmat mértünk, másoknál a profilból hasonló munkastílust becsültünk. A vegyes forrásokból nem következtetünk hasonló személyiségre vagy közös vakfoltokra."
                        : "Most pairs operate in an aligned way – partly from measured strong trust, partly from similar working-style estimates. From this mixed data source we do not infer profile similarity (shared blind spots).";
                    }
                    return isHu
                      ? "A párok többsége hasonló munkastílusú: gyors összecsiszolódás, kevés belső súrlódás várható. A kockázat a közös vakfolt – amit senki sem vesz észre a csapatban, az kimaradhat; külső visszajelzés tudatos behozása segít."
                      : "Most pairs share a similar working style: quick gelling and little internal friction expected. The risk is shared blind spots – what no one in the team notices may get missed; deliberately inviting outside feedback helps.";
                  }
                  if (dynSource === "trust_round") {
                    return isHu
                      ? "A mért kapcsolati kép vegyes: erős és gyengébb bizalmi kapcsolatok egyaránt vannak. A gyengébb párokra irányuló célzott figyelem (közös feladatok, tiszta átadási pontok) erősíti a hálót."
                      : "The measured relationship picture is mixed: both strong and weaker trust connections exist. Targeted attention to the weaker pairs (shared tasks, clear hand-off points) strengthens the network.";
                  }
                  if (dynSource === "mixed") {
                    return isHu
                      ? "A kapcsolati kép vegyes – mért és becsült jelzések egyaránt. Tudatos szereposztás, világos átadási pontok és a gyengébb kapcsolatok erősítése segíti, hogy az eltérések erősséggé forduljanak."
                      : "The relationship picture is mixed – both measured and estimated signals. Deliberate role division, clear hand-off points and strengthening the weaker relationships help turn differences into strengths.";
                  }
                  return isHu
                    ? "A csapat vegyes profilú: az eltérő munkastílusok tudatos szereposztással és világos átadási pontokkal erősséggé fordíthatók – enélkül koordinációs többletköltségként jelentkeznek."
                    : "The team has a mixed profile: differing working styles can become a strength with deliberate role division and clear hand-off points – without those, they show up as coordination overhead.";
                })()}
              </p>
              {/* Dimenzió-attribúció csak profil-alapú (vagy részben az)
                  képnél – tisztán mért bizalmi él nem dimenzió-eltérésből
                  jön, arra a szórás-magyarázat hamis ok-tulajdonítás lenne. */}
              {dynSource !== "trust_round" && agg.dynamics.topFrictionDims.length > 0 && (
                <p className="mt-2 text-xs text-ink-body">
                  {isHu ? "A munkastílus-különbségek elsősorban itt jelentkeznek: " : "The working-style differences show up mainly in: "}
                  <span className="font-semibold text-ink">
                    {agg.dynamics.topFrictionDims
                      .map((dim) => (DIM_LABELS[dim] ? (isHu ? DIM_LABELS[dim].hu : DIM_LABELS[dim].en) : dim))
                      .join(", ")}
                  </span>
                  {isHu
                    ? " – ezekben a legnagyobb a csapaton belüli szórás, itt érdemes közös alapszabályokat rögzíteni."
                    : " – these dimensions show the widest in-team spread; agree on shared minimum rules here."}
                </p>
              )}
            </div>

            <p className="mt-2 text-micro text-muted">
              {agg.dynamics.source === "trust_round"
                ? isHu ? "Mért bizalmi körön (360°) alapul." : "Based on a measured trust round (360°)."
                : agg.dynamics.source === "mixed"
                  ? isHu ? "Részben mért bizalmi kör, részben profilalapú becslés." : "Partly a measured trust round, partly profile-based estimate."
                  : isHu ? "Profilalapú becslés – kapcsolatpáronkénti adatok nem jelennek meg." : "Profile-based estimate – pair-level data is not shown."}
            </p>
          </DashboardPanel>
        </section>
      )}

      {/* Kapcsolati háló kiemelések – hub / beágyazatlan tag a debriefhez.
          Summary-orientált (viz-policy): névvel jelölt tagok, nem külön chart. */}
      {agg?.trustHighlights &&
        (agg.trustHighlights.hubs.length > 0 ||
          agg.trustHighlights.isolated.length > 0) && (
          <section>
            <SectionHead
              no={secNo()}
              label={isHu ? "Kapcsolati háló – kiemelések" : "Relationship network – highlights"}
              subtitle={isHu
                ? "Kik kötik össze a csapatot, és kiknek lehet szükségük több kapcsolódási lehetőségre?"
                : "Who connects the team, and who isn't embedded yet."}
            />
            <DashboardPanel className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink-body">
                  {isHu
                    ? "A csapat összekötői és a kapcsolódásban támogatást igénylő tagok: két fontos téma a tanácsadói eredményfeldolgozáshoz."
                    : "Who carries the team's relational fabric – two key talking points for the consultant debrief."}
                </p>
                {agg.trustHighlights.source === "trust_round" ? (
                  <span className="rounded-full bg-sage/15 px-2.5 py-1 text-note font-semibold text-sage-dark">
                    {isHu ? "mért" : "measured"}
                  </span>
                ) : (
                  <span className="rounded-full bg-state-warning-bg px-2.5 py-1 text-note font-semibold text-state-warning-fg">
                    {isHu ? "becsült" : "estimated"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {agg.trustHighlights.hubs.length > 0 && (
                  <div className="rounded-[14px] border border-sage/35 bg-sage/10 p-4">
                    <p className="text-caption font-semibold text-sage-dark">
                      {isHu
                        ? agg.trustHighlights.hubs.length > 1
                          ? "A csapat összekötői"
                          : "A csapat összekötője"
                        : agg.trustHighlights.hubs.length > 1
                          ? "Team connectors"
                          : "Team connector"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {agg.trustHighlights.hubs.map((name) => (
                        <span
                          key={name}
                          className="rounded-full bg-surface-card px-2.5 py-1 text-caption font-semibold text-ink"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink-body">
                      {agg.trustHighlights.source === "trust_round"
                        ? isHu
                          ? "A legtöbb erős, kölcsönös bizalmi kapcsolattal – rájuk támaszkodik a csapat információáramlása és összetartása."
                          : "With the most strong, mutual trust connections – the team's information flow and cohesion rest on them."
                        : isHu
                          ? "A legtöbb hasonló személyiségprofilú kapcsolattal rendelkező tagok, a profilokból készült becslés alapján. Bizalmi körrel pontosítható a kép."
                          : "With the most similar-profile connections (profile-based estimate) – a measured trust round would sharpen this."}
                    </p>
                  </div>
                )}

                {agg.trustHighlights.isolated.length > 0 && (
                  <div className="rounded-[14px] border border-state-warning-border bg-state-warning-bg/60 p-4">
                    <p className="text-caption font-semibold text-state-warning-fg">
                      {isHu
                        ? agg.trustHighlights.isolated.length > 1
                          ? "Erős bizalmi kapcsolat nélküli tagok"
                          : "Erős bizalmi kapcsolat nélküli tag"
                        : agg.trustHighlights.isolated.length > 1
                          ? "Not-yet-embedded members"
                          : "Not-yet-embedded member"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {agg.trustHighlights.isolated.map((name) => (
                        <span
                          key={name}
                          className="rounded-full bg-surface-card px-2.5 py-1 text-caption font-semibold text-ink"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink-body">
                      {isHu
                        ? "Több kapcsolatukról is van mérési adat, de egyik sem jelez erős bizalmat. Érdemes átbeszélni, mi nehezíti a kapcsolódásukat. Ez nem a teljesítményük értékelése."
                        : "They have several measured connections but no strong trust edge – worth exploring what keeps them at the network's edge. Not a performance judgment."}
                    </p>
                  </div>
                )}
              </div>

              <p className="mt-4 text-micro text-muted">
                {agg.trustHighlights.source === "trust_round"
                  ? isHu
                    ? `Mért bizalmi körből${
                        agg.trustHighlights.possiblePairCount
                          ? `: ${agg.trustHighlights.measuredPairCount}/${agg.trustHighlights.possiblePairCount} lehetséges pár`
                          : `: ${agg.trustHighlights.measuredPairCount} mért pár`
                      }${
                        agg.trustHighlights.coveragePct !== null
                          ? ` (${agg.trustHighlights.coveragePct}% lefedettség)`
                          : ""
                      }. A kiemelés láthatósága a kapcsolati térképpel azonos; egyéni válasz nem visszakereshető.`
                    : `From a measured trust round${
                        agg.trustHighlights.possiblePairCount
                          ? `: ${agg.trustHighlights.measuredPairCount}/${agg.trustHighlights.possiblePairCount} possible pairs`
                          : `: ${agg.trustHighlights.measuredPairCount} measured pairs`
                      }${
                        agg.trustHighlights.coveragePct !== null
                          ? ` (${agg.trustHighlights.coveragePct}% coverage)`
                          : ""
                      }. Visibility matches the dynamics map; individual answers cannot be traced back.`
                  : isHu
                    ? "A személyiségprofilokból készült becslés. Egy 360°-os bizalmi körrel mért adatokkal egészíthető ki a kép, és az is láthatóvá válhat, kiknek nincs erős bizalmi kapcsolatuk a csapatban."
                    : "Profile-based estimate – running a 360° trust round replaces it with measured data and also unlocks not-yet-embedded member detection."}
              </p>
            </DashboardPanel>
          </section>
        )}

      {/* Csapat nyomás alatt — kollektív pressure-minták. Az egyéni
          túlpörgés-tartalmak (SOLO_DIM_PRESSURE) csapat-párja: ha egy
          dimenzió-pólus koncentrálódik, nyomás alatt kollektív mintává
          adódhat össze. Hipotézis-nyelv + akció-mondat, max 3 állítás. */}
      {agg?.pressure && agg.pressure.concentrations.length > 0 && (
        <section>
          <SectionHead
            no={secNo()}
            label={isHu ? "Csapat nyomás alatt" : "Team under pressure"}
            subtitle={isHu
              ? "A nyugodt helyzetben hasznos vonások terhelés alatt felerősíthetik egymás hatását."
              : "A strength in calm times – under load it can compound into a collective pattern."}
          />
          <DashboardPanel className="p-6">
            <div className="flex flex-col gap-4">
              {agg.pressure.concentrations.map((c) => {
                const content =
                  c.pole === "polarized"
                    ? TEAM_PRESSURE_POLARIZED_TEXT
                    : TEAM_PRESSURE_CONTENT[c.dim as HexacoCode]?.[c.pole];
                if (!content) return null;
                const dimLabel = DIM_LABELS[c.dim]
                  ? isHu
                    ? DIM_LABELS[c.dim].hu
                    : DIM_LABELS[c.dim].en
                  : c.dim;
                return (
                  <div
                    key={`${c.dim}-${c.pole}`}
                    className="rounded-[14px] border border-state-warning-border bg-state-warning-bg p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: DIM_COLORS[c.dim] ?? "var(--color-sage)" }}
                      />
                      <p className="text-sm font-semibold text-ink">
                        {dimLabel} –{" "}
                        {c.pole === "polarized"
                          ? t("teamComp.polePolarized", loc)
                          : c.pole === "high"
                            ? t("teamComp.poleHigh", loc)
                            : t("teamComp.poleLow", loc)}
                      </p>
                      <span className="ml-auto rounded-full border border-state-warning-border bg-surface-card px-2 py-0.5 text-micro font-medium text-bronze-700">
                        {c.count}/{c.assessedCount} {isHu ? "tag" : "members"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink-body">
                      {isHu ? content.hu : content.en}
                    </p>
                  </div>
                );
              })}
            </div>
            <p className="mt-4 text-micro text-muted">
              {isHu
                ? "Az önértékelésekből becsült közös mintázat: megbeszélendő felvetés, nem diagnózis. Kérdezd meg a vezetőt, ráismer-e a csapatára. Az is segíti az értelmezést, ha nem ismeri fel a leírt működést. Egyéni értékek nem jelennek meg."
                : "A collective pattern estimated from self-assessments – a hypothesis, not a diagnosis. Ask the leader whether they recognize it; if not, that is data too. Individual values are not shown."}
            </p>
          </DashboardPanel>
        </section>
      )}

      {/* Pszichológiai biztonság – anonim pulse-aggregátum */}
      {agg?.psychSafety && (
        <section>
          <SectionHead
            no={secNo()}
            label={isHu ? "Pszichológiai biztonság" : "Psychological safety"}
            subtitle={isHu
              ? "Mennyire mernek a tagok őszintén megszólalni."
              : "How safe members feel to speak up honestly."}
          />
          <DashboardPanel className="p-6">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
              <p className="font-fraunces text-5xl text-ink">
                {agg.psychSafety.index}
                <span className="ml-1 font-sans text-sm font-normal text-muted">/ 100</span>
              </p>
              <div>
                <p className="text-sm font-semibold text-ink">
                  {agg.psychSafety.band === "high"
                    ? isHu ? "Erős biztonságérzet" : "Strong sense of safety"
                    : agg.psychSafety.band === "mid"
                      ? isHu ? "Közepes biztonságérzet" : "Moderate sense of safety"
                      : isHu ? "Törékeny biztonságérzet" : "Fragile sense of safety"}
                </p>
                {/* A ±szóródás-szám nem jelenik meg (2026-08-11 termékdöntés)
                    – az aggregátumban a spread tovább él, csak a kijelzés
                    szűnt meg. */}
                <p className="mt-0.5 text-xs text-ink-body/60">
                  {agg.psychSafety.count}{" "}
                  {isHu ? "névtelen válasz" : "anonymous responses"} ·{" "}
                  {new Date(agg.psychSafety.measuredAt).toLocaleDateString(
                    isHu ? "hu-HU" : "en-GB",
                    { year: "numeric", month: "short" },
                  )}
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              {PSYCH_SAFETY_ITEMS.map((item) => {
                const mean = agg.psychSafety!.itemMeans[item.id];
                if (typeof mean !== "number") return null;
                const pct = Math.max(0, Math.min(100, ((mean - 1) / 4) * 100));
                const isWeak = agg.psychSafety!.weakItemIds.includes(item.id);
                return (
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3"
                  >
                    <span
                      className={`text-xs leading-snug md:w-64 md:shrink-0 ${
                        isWeak ? "font-semibold text-bronze-700" : "text-ink-body"
                      }`}
                    >
                      {isHu ? item.area.hu : item.area.en}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-sand">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isWeak ? "bg-bronze-300" : "bg-sage"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-9 shrink-0 text-right text-xs tabular-nums text-muted">
                        {mean.toFixed(1)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {agg.psychSafety.weakItemIds.length > 0 ? (
              <div className="mt-5 flex flex-col gap-3">
                <p className="text-caption font-semibold text-state-warning-fg">
                  {isHu ? "Gyenge területek – javasolt lépések" : "Weak areas – suggested steps"}
                </p>
                {agg.psychSafety.weakItemIds.map((id) => {
                  const item = getPsychSafetyItem(id);
                  const action = PSYCH_SAFETY_ACTIONS[id];
                  if (!item || !action) return null;
                  return (
                    <div
                      key={id}
                      className="rounded-xl border border-state-warning-border bg-state-warning-bg/60 px-4 py-3"
                    >
                      <p className="text-caption font-semibold text-ink">
                        {isHu ? item.area.hu : item.area.en}
                        <span className="ml-2 font-normal tabular-nums text-state-warning-fg">
                          {agg.psychSafety!.itemMeans[id]?.toFixed(1)} / 5
                        </span>
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-body">
                        {isHu ? action.hu : action.en}
                      </p>
                    </div>
                  );
                })}

                {/* Vezetői akciókártyák – a gyenge területek mögött tipikus
                    vezetői mintázat és ellenszere. Keret: HBR 2026/07
                    („4 Hidden Traps of Team Dynamics"), saját adaptáció.
                    Alapból csukva – a sűrűség csökkentésére. */}
                {(() => {
                  const traps = leaderTrapsForWeakItems(agg.psychSafety!.weakItemIds);
                  if (traps.length === 0) return null;
                  return (
                    <details className="mt-1 rounded-[12px] border border-sand bg-surface-card">
                      <summary className="cursor-pointer select-none px-4 py-2.5 text-caption font-semibold text-[var(--color-accent-primary-strong)] transition-colors hover:text-bronze-dark">
                        {isHu
                          ? `Javasolt vezetői lépések (${traps.length})`
                          : `Leader action cards (${traps.length})`}
                      </summary>
                      <div className="flex flex-col gap-3 px-4 pb-4">
                        {traps.map((trap) => (
                          <div
                            key={trap.id}
                            className="rounded-xl border border-sand bg-cream/40 px-4 py-3"
                          >
                            <p className="text-caption font-semibold text-ink">
                              {isHu ? trap.title.hu : trap.title.en}
                            </p>
                            <p className="mt-1 text-xs leading-relaxed text-muted">
                              {isHu ? trap.trap.hu : trap.trap.en}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-ink-body">
                              <span className="font-semibold text-ink">
                                {isHu ? "Ellenszer: " : "Antidote: "}
                              </span>
                              {isHu ? trap.antidote.hu : trap.antidote.en}
                            </p>
                          </div>
                        ))}
                        <p className="text-micro text-muted">
                          {isHu
                            ? "Keret: Harvard Business Review (2026/07), a trita saját adaptációjában."
                            : "Framework: Harvard Business Review (2026/07), in trita's own adaptation."}
                        </p>
                      </div>
                    </details>
                  );
                })()}
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-sage/5 px-4 py-3 text-xs leading-relaxed text-ink-body">
                {isHu
                  ? "Nincs kirívóan gyenge terület: a biztonságérzet kiegyensúlyozott. Érdemes rendszeres pulzusméréssel követni az alakulását."
                  : "No conspicuously weak area – the sense of safety is balanced. Track it with a regular pulse to keep it that way."}
              </p>
            )}

            <p className="mt-4 text-micro text-muted">
              {isHu
                ? "Névtelen mérés: csak csapatszintű összesítés, egyéni válasz nem visszakereshető (min. 3 kitöltés)."
                : "Anonymous measurement: team-level aggregate only, individual answers cannot be traced back (min. 3 responses)."}
            </p>
          </DashboardPanel>
        </section>
      )}

      {agg?.feedbackCulture && <section>
        <SectionHead no={secNo()} label={isHu ? "Önkép és külső kép" : "Self and observer views"} subtitle={isHu ? "Mért csapattársi visszajelzések összesítése." : "Aggregate of measured observer feedback."} />
        <DashboardPanel className="p-6"><p className="text-sm text-ink-body">{isHu ? "Lefedettség" : "Coverage"}: {agg.feedbackCulture.coveredCount}/{agg.feedbackCulture.memberCount} · {isHu ? "Összhang" : "Aligned"}: {agg.feedbackCulture.alignedCount} · {isHu ? "Érdemi eltérés" : "Meaningful difference"}: {agg.feedbackCulture.gapCount}</p></DashboardPanel>
      </section>}

      {/* Módszertani lábléc */}
      {agg?.evidence && (
        <DashboardPanel className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                agg.evidence.quality === "sufficient"
                  ? "bg-state-success-bg text-state-success-fg"
                  : agg.evidence.quality === "partial"
                    ? "bg-state-warning-bg text-state-warning-fg"
                    : "bg-state-error-bg text-state-error-fg"
              }`}
            >
              {QUALITY_LABELS[agg.evidence.quality]
                ? isHu
                  ? QUALITY_LABELS[agg.evidence.quality].hu
                  : QUALITY_LABELS[agg.evidence.quality].en
                : agg.evidence.quality}
            </span>
            <span className="text-xs text-ink-body">
              {isHu
                ? `${agg.completedCount}/${agg.memberCount} kitöltött felmérés · ${agg.evidence.measuredEdgeCount ?? 0} mért és ${agg.evidence.estimatedEdgeCount} becsült kapcsolati adat`
                : `${agg.completedCount}/${agg.memberCount} completed assessments · ${agg.evidence.measuredEdgeCount ?? 0} measured and ${agg.evidence.estimatedEdgeCount} estimated relationship data points`}
            </span>
          </div>
          <p className="mt-2 text-micro text-muted">
            {isHu
              ? "A riport a közzétételkor rögzített összesített adatokon alapul; egyéni eredmények nem jelennek meg. A becsült elemek profilalapú modellből származnak."
              : "This report is based on aggregate data frozen at publication; individual results are not shown. Estimated elements come from a profile-based model."}
          </p>
        </DashboardPanel>
      )}
  </div>;
}

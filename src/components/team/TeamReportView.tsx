import { TEAM_ROLES } from "@/lib/team-role-scoring";
import {
  PSYCH_SAFETY_ITEMS,
  PSYCH_SAFETY_ACTIONS,
  getPsychSafetyItem,
} from "@/lib/psych-safety";
import type { SerializedTeamReport } from "@/lib/team-report";
import { DashboardPanel, DashboardSectionHeader } from "@/components/dashboard/DashboardPrimitives";
import { RadarChart } from "@/components/dashboard/RadarChart";

const DIM_LABELS: Record<string, { hu: string; en: string }> = {
  INTE: { hu: "Integritás", en: "Integrity" },
  RESO: { hu: "Rezonancia", en: "Resonance" },
  TEMP: { hu: "Társas energia", en: "Tempo" },
  ADAP: { hu: "Alkalmazkodás", en: "Adaptability" },
  THOR: { hu: "Tervezettség", en: "Thoroughness" },
  OPEN: { hu: "Nyitottság", en: "Openness" },
};

// Dimenzió-színek — a team oldal dimConfigs palettájával azonos.
const DIM_COLORS: Record<string, string> = {
  INTE: "#6366F1",
  RESO: "#EC4899",
  TEMP: "#F59E0B",
  ADAP: "#10B981",
  THOR: "#8B5CF6",
  OPEN: "#06B6D4",
};

const DIM_ORDER = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"] as const;

// Hiányzó csapatszerep rövid következménye a vezető nyelvén.
const ROLE_GAP_HINTS: Record<string, { hu: string; en: string }> = {
  PL: { hu: "új ötletek külső impulzus nélkül elmaradhatnak", en: "fresh ideas may need outside stimulus" },
  RI: { hu: "külső lehetőségek feltárása gyengülhet", en: "exploring outside opportunities may weaken" },
  CO: { hu: "a célok összehangolása és a delegálás sérülhet", en: "goal alignment and delegation may suffer" },
  SH: { hu: "akadályoknál hiányozhat a lendület", en: "momentum may stall at obstacles" },
  ME: { hu: "a döntések kritikus mérlegelése gyengülhet", en: "critical evaluation of decisions may weaken" },
  TW: { hu: "a feszültségoldás és a kohézió sérülhet", en: "tension defusing and cohesion may suffer" },
  IM: { hu: "az ötletek gyakorlati megvalósítása lassulhat", en: "turning ideas into practice may slow down" },
  CF: { hu: "a minőségi lezárás és a határidők csúszhatnak", en: "quality closure and deadlines may slip" },
  SP: { hu: "a mély szakértői tudás hiányozhat", en: "deep specialist knowledge may be missing" },
};

// Szerep-mátrix oszlopok: gondolkodó / cselekvő / emberközpontú szerepek.
const ROLE_MATRIX: Array<{ hu: string; en: string; roles: string[] }> = [
  { hu: "Gondolkodó", en: "Thinking", roles: ["PL", "ME", "SP"] },
  { hu: "Cselekvő", en: "Action", roles: ["SH", "IM", "CF"] },
  { hu: "Emberközpontú", en: "People", roles: ["CO", "TW", "RI"] },
];

const QUALITY_LABELS: Record<string, { hu: string; en: string }> = {
  none: { hu: "Nincs elegendő adat", en: "Insufficient data" },
  partial: { hu: "Részleges adatalap", en: "Partial data basis" },
  sufficient: { hu: "Megbízható adatalap", en: "Reliable data basis" },
};

// Dinamika-kategóriák — státusz-jellegű színek, mindig felirattal (sosem
// csak színnel) jelölve. Paletta CVD-validálva (dataviz validator, PASS).
const DYNAMICS_SEGMENTS = [
  {
    key: "alignedCount",
    color: "#10B981",
    chip: "bg-emerald-50 text-emerald-700",
    hu: "Összehangolt",
    en: "Aligned",
    explainHu: "hasonló munkastílusú páros — kevés egyeztetéssel is gördülékenyen dolgoznak együtt.",
    explainEn: "similar working styles — they collaborate smoothly with little alignment effort.",
  },
  {
    key: "complementaryCount",
    color: "#0EA5E9",
    chip: "bg-sky-50 text-sky-700",
    hu: "Kiegészítő",
    en: "Complementary",
    explainHu: "eltérő, de összeférő stílusok — más-más helyzetben erősek, jó munkamegosztás-alap.",
    explainEn: "different but compatible styles — strong in different situations, a good basis for dividing work.",
  },
  {
    key: "frictionCount",
    color: "#F59E0B",
    chip: "bg-amber-50 text-amber-700",
    hu: "Súrlódási potenciál",
    en: "Friction potential",
    explainHu: "nagy munkastílus-különbség (pl. tervezettség, kommunikáció) — tisztázott normák nélkül feszültségforrás lehet. Nem jelent tényleges konfliktust.",
    explainEn: "big working-style differences (e.g. structure, communication) — a potential source of tension without agreed norms. It does not mean actual conflict.",
  },
] as const;

function NarrativeSection({
  label,
  text,
}: {
  label: string;
  text: string | null;
}) {
  if (!text || text.trim().length === 0) return null;
  return (
    <div>
      <p className="mb-1.5 font-mono text-[10px] uppercase tracking-widest text-muted">
        {label}
      </p>
      <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-body">{text}</p>
    </div>
  );
}

function KpiTile({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return (
    <div className="rounded-[14px] border border-sand bg-white p-3.5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{label}</p>
      <p className={`mt-1 font-fraunces text-2xl leading-none ${accent ?? "text-ink"}`}>{value}</p>
    </div>
  );
}

export function TeamReportView({
  report,
  isHu,
}: {
  report: SerializedTeamReport;
  isHu: boolean;
}) {
  const agg = report.aggregates;
  const isDraft = report.status === "DRAFT";
  const publishedDate = report.publishedAt
    ? new Date(report.publishedAt).toLocaleDateString(isHu ? "hu-HU" : "en-GB", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const dynamicsTotal = agg?.dynamics
    ? agg.dynamics.alignedCount + agg.dynamics.complementaryCount + agg.dynamics.frictionCount
    : 0;
  const frictionPct =
    agg?.dynamics && dynamicsTotal > 0
      ? Math.round((agg.dynamics.frictionCount / dynamicsTotal) * 100)
      : null;

  const radarDimensions = agg?.dimensionAverages
    ? DIM_ORDER.filter((dim) => typeof agg.dimensionAverages?.[dim] === "number").map((dim) => ({
        code: dim,
        color: DIM_COLORS[dim],
        score: agg.dimensionAverages![dim],
      }))
    : [];

  return (
    <div className="flex flex-col gap-6">
      {/* Fejléc + KPI-sáv */}
      <DashboardPanel className="p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-bronze">
              {isDraft
                ? isHu ? "// csapatkép — előnézet" : "// team picture — preview"
                : isHu ? "// validált csapatkép" : "// validated team picture"}
            </p>
            <h2 className="mt-1 font-fraunces text-2xl text-ink">
              {report.title ?? (isHu ? "Csapatkép" : "Team picture")}
            </h2>
            {publishedDate && (
              <p className="mt-1 text-xs text-muted">
                {isHu ? "Tanácsadó által validálva · " : "Validated by consultant · "}
                {publishedDate}
              </p>
            )}
          </div>
          {isDraft ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {isHu ? "Vázlat-előnézet" : "Draft preview"}
            </span>
          ) : (
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
              {isHu ? "Publikált" : "Published"}
            </span>
          )}
        </div>

        {agg && (
          <div className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-4">
            <KpiTile label={isHu ? "Tagok" : "Members"} value={String(agg.memberCount)} />
            <KpiTile label={isHu ? "Kitöltöttség" : "Completion"} value={`${agg.completionPct}%`} />
            {agg.evidence && (
              <KpiTile
                label={isHu ? "Adatminőség" : "Data quality"}
                value={
                  QUALITY_LABELS[agg.evidence.quality]
                    ? isHu
                      ? QUALITY_LABELS[agg.evidence.quality].hu.split(" ")[0]
                      : QUALITY_LABELS[agg.evidence.quality].en.split(" ")[0]
                    : agg.evidence.quality
                }
                accent={
                  agg.evidence.quality === "sufficient"
                    ? "text-emerald-700"
                    : agg.evidence.quality === "partial"
                      ? "text-amber-700"
                      : "text-rose-700"
                }
              />
            )}
            {frictionPct !== null && (
              <KpiTile
                label={isHu ? "Súrlódási arány" : "Friction ratio"}
                value={`${frictionPct}%`}
                accent={frictionPct >= 40 ? "text-amber-700" : "text-ink"}
              />
            )}
          </div>
        )}
      </DashboardPanel>

      {/* Csapatprofil: radar + szórás-sávok */}
      {agg?.dimensionAverages && (
        <section>
          <DashboardSectionHeader
            label={isHu ? "Aggregált csapatprofil" : "Aggregate team profile"}
            className="mb-4"
          />
          <DashboardPanel className="p-6">
            {agg.pattern && (
              <div className="mb-5 rounded-[14px] border border-sand bg-cream/60 p-4">
                <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                  {isHu ? "Csapatmintázat" : "Team pattern"}
                </p>
                <p className="mt-1 font-fraunces text-lg leading-tight text-ink">
                  {agg.pattern.label}
                </p>
              </div>
            )}

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
                    <div key={dim} className="flex items-center gap-3">
                      <span className="w-36 shrink-0 text-xs text-ink-body">
                        {DIM_LABELS[dim] ? (isHu ? DIM_LABELS[dim].hu : DIM_LABELS[dim].en) : dim}
                      </span>
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
                      <span className="w-14 shrink-0 text-right font-mono text-xs text-ink">
                        {value}
                        {spread !== undefined && <span className="text-muted"> ±{spread}</span>}
                      </span>
                    </div>
                  );
                })}
                <p className="mt-1 text-[10px] text-muted">
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
          <DashboardSectionHeader
            label={isHu ? "Szerep-lefedettség" : "Role coverage"}
            className="mb-4"
          />
          <DashboardPanel className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {ROLE_MATRIX.map((column) => (
                <div key={column.hu} className="flex flex-col gap-2">
                  <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
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
                              ? "border border-sky-200 bg-sky-50/60"
                              : "border border-dashed border-sand bg-white"
                        }`}
                      >
                        <span
                          className={`text-[13px] ${
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
                            <span className="rounded-full bg-sage px-2 py-0.5 font-mono text-[11px] font-semibold text-white">
                              {primaryCount}
                            </span>
                            {secondaryCount > 0 && (
                              <span className="rounded-full bg-sky-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-700">
                                +{secondaryCount}
                              </span>
                            )}
                          </span>
                        ) : state === "secondary" ? (
                          <span className="rounded-full bg-sky-100 px-2 py-0.5 font-mono text-[11px] font-semibold text-sky-700">
                            +{secondaryCount}
                          </span>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wide text-muted">
                            {isHu ? "hiányzik" : "missing"}
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-ink-body">
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[4px] border border-sage/35 bg-sage/10" />
                {isHu ? "Elsődleges szerep a csapatban" : "Primary role in the team"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[4px] border border-sky-200 bg-sky-50" />
                {isHu ? "Csak tartalék (2-3. legerősebb szerepként)" : "Backup only (2nd–3rd strongest role)"}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3 w-3 rounded-[4px] border border-dashed border-sand bg-white" />
                {isHu ? "Senki nem fedi le" : "Covered by no one"}
              </span>
            </div>

            {agg.roleGaps && agg.roleGaps.length > 0 && (
              <div className="mt-4 border-t border-sand pt-4">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted">
                  {isHu ? "Valódi hiányok — mit jelenthet" : "True gaps — what it may mean"}
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
                          {" — "}
                          {isHu ? ROLE_GAP_HINTS[role].hu : ROLE_GAP_HINTS[role].en}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-3 text-[10px] text-muted">
              {isHu
                ? `Tagonként a 3 legerősebb szerepet számoljuk: az 1. elsődlegesként, a 2-3. tartalékként. ${agg.roleDistribution.questionnaireCount} valódi kitöltés · ${agg.roleDistribution.estimateCount} becslés.`
                : `We count each member's 3 strongest roles: the 1st as primary, the 2nd–3rd as backup. ${agg.roleDistribution.questionnaireCount} real fill-out · ${agg.roleDistribution.estimateCount} estimated.`}
            </p>
          </DashboardPanel>
        </section>
      )}

      {/* Együttműködési dinamika: stacked bar */}
      {agg?.dynamics && dynamicsTotal > 0 && (
        <section>
          <DashboardSectionHeader
            label={isHu ? "Együttműködési dinamika" : "Collaboration dynamics"}
            className="mb-4"
          />
          <DashboardPanel className="p-6">
            <p className="mb-3 text-sm text-ink-body">
              {isHu
                ? `A csapat mind a ${dynamicsTotal} tagpárjának munkastílus-összevetése — mennyire hasonlóan vagy eltérően dolgozik két ember.`
                : `A working-style comparison of all ${dynamicsTotal} member pairs — how similarly or differently two people work.`}
            </p>

            <div className="flex h-4 w-full gap-[2px] overflow-hidden rounded-full">
              {DYNAMICS_SEGMENTS.map((segment) => {
                const count = agg.dynamics![segment.key];
                if (count === 0) return null;
                return (
                  <div
                    key={segment.key}
                    className="h-full rounded-[3px]"
                    style={{
                      width: `${(count / dynamicsTotal) * 100}%`,
                      backgroundColor: segment.color,
                    }}
                  />
                );
              })}
            </div>

            <div className="mt-3 flex flex-wrap gap-1.5">
              {DYNAMICS_SEGMENTS.map((segment) => (
                <span
                  key={segment.key}
                  className={`rounded-full px-2.5 py-1 text-xs font-medium ${segment.chip}`}
                >
                  {isHu ? segment.hu : segment.en} · {agg.dynamics![segment.key]}
                </span>
              ))}
            </div>

            <ul className="mt-4 flex flex-col gap-2 border-t border-sand pt-4">
              {DYNAMICS_SEGMENTS.map((segment) => (
                <li key={segment.key} className="flex items-start gap-2 text-xs text-ink-body">
                  <span
                    className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span>
                    <span className="font-semibold text-ink">{isHu ? segment.hu : segment.en}:</span>{" "}
                    {isHu ? segment.explainHu : segment.explainEn}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-4 rounded-[12px] border border-sand bg-cream/60 p-3.5">
              <p className="text-xs leading-relaxed text-ink-body">
                <span className="font-semibold text-ink">
                  {isHu ? "Mit jelent ez a csapatra? " : "What does this mean for the team? "}
                </span>
                {(() => {
                  const alignedShare = agg.dynamics!.alignedCount / dynamicsTotal;
                  const frictionShare = agg.dynamics!.frictionCount / dynamicsTotal;
                  if (frictionShare >= 0.4) {
                    return isHu
                      ? "A párok jelentős részénél nagy a munkastílus-különbség. Tisztázott működési normák (döntéshozatal, határidő-kezelés, kommunikációs csatornák) nélkül ez visszatérő konfliktusforrás lehet — normákkal viszont a sokféleség szélesebb perspektívát ad."
                      : "A large share of pairs shows big working-style differences. Without agreed working norms (decision-making, deadlines, communication channels) this can become a recurring source of conflict — with norms, the diversity brings broader perspective.";
                  }
                  if (alignedShare >= 0.5) {
                    return isHu
                      ? "A párok többsége hasonló munkastílusú: gyors összecsiszolódás, kevés belső súrlódás várható. A kockázat a közös vakfolt — amit senki sem vesz észre a csapatban, az kimaradhat; külső visszajelzés tudatos behozása segít."
                      : "Most pairs share a similar working style: quick gelling and little internal friction expected. The risk is shared blind spots — what no one in the team notices may get missed; deliberately inviting outside feedback helps.";
                  }
                  return isHu
                    ? "A csapat vegyes profilú: az eltérő munkastílusok tudatos szereposztással és világos átadási pontokkal erősséggé fordíthatók — enélkül koordinációs többletköltségként jelentkeznek."
                    : "The team has a mixed profile: differing working styles can become a strength with deliberate role division and clear hand-off points — without those, they show up as coordination overhead.";
                })()}
              </p>
              {agg.dynamics.topFrictionDims.length > 0 && (
                <p className="mt-2 text-xs text-ink-body">
                  {isHu ? "A különbségek elsősorban itt jelentkeznek: " : "The differences show up mainly in: "}
                  <span className="font-semibold text-ink">
                    {agg.dynamics.topFrictionDims
                      .map((dim) => (DIM_LABELS[dim] ? (isHu ? DIM_LABELS[dim].hu : DIM_LABELS[dim].en) : dim))
                      .join(", ")}
                  </span>
                  {isHu
                    ? " — ezekben a legnagyobb a csapaton belüli szórás, itt érdemes közös minimum-szabályokat rögzíteni."
                    : " — these dimensions show the widest in-team spread; agree on shared minimum rules here."}
                </p>
              )}
            </div>

            <p className="mt-2 text-[10px] text-muted">
              {agg.dynamics.source === "observer"
                ? isHu ? "Kollégai (observer) visszajelzésen alapul." : "Based on observer feedback."
                : agg.dynamics.source === "mixed"
                  ? isHu ? "Részben kollégai visszajelzés, részben profil-alapú becslés." : "Partly observer feedback, partly profile-based estimate."
                  : isHu ? "Profil-alapú becslés — kapcsolatpáronkénti adatok nem jelennek meg." : "Profile-based estimate — pair-level data is not shown."}
            </p>
          </DashboardPanel>
        </section>
      )}

      {/* Pszichológiai biztonság — anonim pulse-aggregátum */}
      {agg?.psychSafety && (
        <section>
          <DashboardSectionHeader
            label={isHu ? "Pszichológiai biztonság" : "Psychological safety"}
            className="mb-4"
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
                    ? isHu ? "Erős biztonság-élmény" : "Strong sense of safety"
                    : agg.psychSafety.band === "mid"
                      ? isHu ? "Közepes biztonság-élmény" : "Moderate sense of safety"
                      : isHu ? "Törékeny biztonság-élmény" : "Fragile sense of safety"}
                </p>
                <p className="mt-0.5 text-xs text-ink-body/60">
                  {agg.psychSafety.count}{" "}
                  {isHu ? "névtelen válasz" : "anonymous responses"} ·{" "}
                  {isHu ? "szóródás" : "spread"} ±{agg.psychSafety.spread} ·{" "}
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
                  <div key={item.id} className="flex items-center gap-3">
                    <span
                      className={`w-56 shrink-0 text-xs leading-snug md:w-64 ${
                        isWeak ? "font-semibold text-amber-800" : "text-ink-body"
                      }`}
                    >
                      {isHu ? item.area.hu : item.area.en}
                    </span>
                    <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-sand">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${
                          isWeak ? "bg-amber-500" : "bg-sage"
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-9 text-right text-xs tabular-nums text-muted">
                      {mean.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>

            {agg.psychSafety.weakItemIds.length > 0 ? (
              <div className="mt-5 flex flex-col gap-3">
                <p className="font-mono text-[10px] uppercase tracking-widest text-amber-700">
                  {isHu ? "Gyenge területek — javasolt lépések" : "Weak areas — suggested steps"}
                </p>
                {agg.psychSafety.weakItemIds.map((id) => {
                  const item = getPsychSafetyItem(id);
                  const action = PSYCH_SAFETY_ACTIONS[id];
                  if (!item || !action) return null;
                  return (
                    <div
                      key={id}
                      className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3"
                    >
                      <p className="text-[13px] font-semibold text-ink">
                        {isHu ? item.area.hu : item.area.en}
                        <span className="ml-2 font-normal tabular-nums text-amber-700">
                          {agg.psychSafety!.itemMeans[id]?.toFixed(1)} / 5
                        </span>
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-ink-body">
                        {isHu ? action.hu : action.en}
                      </p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-sage/5 px-4 py-3 text-xs leading-relaxed text-ink-body">
                {isHu
                  ? "Nincs kirívóan gyenge terület — a biztonság-élmény kiegyensúlyozott. Érdemes rendszeres pulse-szal követni, hogy így is maradjon."
                  : "No conspicuously weak area — the sense of safety is balanced. Track it with a regular pulse to keep it that way."}
              </p>
            )}

            <p className="mt-4 text-[10px] text-muted">
              {isHu
                ? "Névtelen mérés: csak csapatszintű összesítés, egyéni válasz nem visszakereshető (min. 3 kitöltés)."
                : "Anonymous measurement: team-level aggregate only, individual answers cannot be traced back (min. 3 responses)."}
            </p>
          </DashboardPanel>
        </section>
      )}

      {/* Tanácsadói narratíva */}
      <section>
        <DashboardSectionHeader
          label={isHu ? "Tanácsadói értékelés" : "Consultant assessment"}
          className="mb-4"
        />
        <div className="flex flex-col gap-4">
          {report.summary && (
            <DashboardPanel className="p-6">
              <NarrativeSection label={isHu ? "Összefoglaló" : "Summary"} text={report.summary} />
            </DashboardPanel>
          )}
          {(report.strengths || report.risks) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {report.strengths && (
                <DashboardPanel className="border-l-4 border-l-emerald-500/60 p-5">
                  <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-emerald-700">
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8.5l3 3 7-7" />
                    </svg>
                    {isHu ? "Erősségek" : "Strengths"}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-body">
                    {report.strengths}
                  </p>
                </DashboardPanel>
              )}
              {report.risks && (
                <DashboardPanel className="border-l-4 border-l-amber-500/60 p-5">
                  <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-widest text-amber-700">
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3v6M8 12.5v.5" />
                    </svg>
                    {isHu ? "Kockázatok" : "Risks"}
                  </p>
                  <p className="whitespace-pre-wrap text-sm leading-relaxed text-ink-body">
                    {report.risks}
                  </p>
                </DashboardPanel>
              )}
            </div>
          )}
          {(report.recommendations || report.interviewFindings || report.leadershipGuide || report.summary) ? (
            <DashboardPanel className="flex flex-col gap-5 p-6">
              <NarrativeSection
                label={isHu ? "Ajánlások" : "Recommendations"}
                text={report.recommendations}
              />
              <NarrativeSection
                label={isHu ? "Interjúk tanulságai" : "Interview insights"}
                text={report.interviewFindings}
              />
              <NarrativeSection
                label={isHu ? "Hogyan vezesd ezt a csapatot" : "How to lead this team"}
                text={report.leadershipGuide}
              />
              {!report.recommendations && !report.interviewFindings && !report.leadershipGuide && (
                <p className="text-sm text-muted">
                  {isHu ? "Nincs további narratív értékelés." : "No further narrative assessment."}
                </p>
              )}
            </DashboardPanel>
          ) : (
            !report.strengths &&
            !report.risks && (
              <DashboardPanel className="p-6">
                <p className="text-sm text-muted">
                  {isHu ? "Nincs narratív értékelés." : "No narrative assessment."}
                </p>
              </DashboardPanel>
            )
          )}
        </div>
      </section>

      {/* Akcióterv: 30/60/90 napos idővonal */}
      {report.actionItems && report.actionItems.length > 0 && (
        <section>
          <DashboardSectionHeader
            label={isHu ? "Akcióterv" : "Action plan"}
            className="mb-4"
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(["30", "60", "90"] as const).map((timeframe) => {
              const items = report.actionItems!.filter((item) => item.timeframe === timeframe);
              return (
                <DashboardPanel key={timeframe} className="p-5">
                  <p className="mb-3 border-b border-sand pb-2 font-mono text-[10px] uppercase tracking-widest text-bronze">
                    {timeframe} {isHu ? "napon belül" : "days"}
                  </p>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted">—</p>
                  ) : (
                    <ul className="flex flex-col gap-3">
                      {items.map((item, index) => (
                        <li key={index} className="rounded-lg border border-sand bg-cream/40 p-3">
                          <p className="text-sm font-semibold text-ink">{item.title}</p>
                          {item.description && (
                            <p className="mt-1 whitespace-pre-wrap text-xs leading-relaxed text-ink-body">
                              {item.description}
                            </p>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </DashboardPanel>
              );
            })}
          </div>
        </section>
      )}

      {/* Módszertani lábléc */}
      {agg?.evidence && (
        <DashboardPanel className="p-4">
          <div className="flex flex-wrap items-center gap-2">
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                agg.evidence.quality === "sufficient"
                  ? "bg-emerald-50 text-emerald-700"
                  : agg.evidence.quality === "partial"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-rose-50 text-rose-700"
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
                ? `${agg.completedCount}/${agg.memberCount} kitöltött felmérés · ${agg.evidence.observerEdgeCount} mért és ${agg.evidence.estimatedEdgeCount} becsült kapcsolati adat`
                : `${agg.completedCount}/${agg.memberCount} completed assessments · ${agg.evidence.observerEdgeCount} measured and ${agg.evidence.estimatedEdgeCount} estimated relationship data points`}
            </span>
          </div>
          <p className="mt-2 text-[10px] text-muted">
            {isHu
              ? "A riport a publikáláskor rögzített aggregált adatokon alapul; egyéni eredmények nem jelennek meg. A becsült elemek profil-alapú modellből származnak."
              : "This report is based on aggregate data frozen at publication; individual results are not shown. Estimated elements come from a profile-based model."}
          </p>
        </DashboardPanel>
      )}
    </div>
  );
}

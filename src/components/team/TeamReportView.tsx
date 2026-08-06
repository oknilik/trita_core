import { TEAM_ROLES } from "@/lib/team-role-scoring";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import {
  PSYCH_SAFETY_ITEMS,
  PSYCH_SAFETY_ACTIONS,
  leaderTrapsForWeakItems,
  getPsychSafetyItem,
} from "@/lib/psych-safety";
import type { SerializedTeamReport } from "@/lib/team-report";
import {
  hasApprovedEnTranslation,
  localizeTeamReport,
} from "@/lib/team-report-i18n";
import { DashboardPanel } from "@/components/dashboard/DashboardPrimitives";
import { RadarChart } from "@/components/dashboard/RadarChart";
import { AXIS_LABELS } from "@/lib/team-pattern";
import { TEAM_PRESSURE_CONTENT } from "@/lib/team-pressure";
import type { TritanDimCode } from "@/lib/tritan";

const DIM_LABELS: Record<string, { hu: string; en: string }> = {
  INTE: { hu: "Becsületesség-Alázat", en: "Honesty-Humility" },
  RESO: { hu: "Emocionalitás", en: "Emotionality" },
  TEMP: { hu: "Extraverzió", en: "Extraversion" },
  ADAP: { hu: "Barátságosság", en: "Agreeableness" },
  THOR: { hu: "Lelkiismeretesség", en: "Conscientiousness" },
  OPEN: { hu: "Nyitottság", en: "Openness" },
};

// Dimenzió-színek — a kanonikus HEXACO-paletta (color-system.ts); mark-
// (base) forma, a team oldal dimConfigs palettájával azonos forrásból.
import { DIMENSION_BASE, DYNAMICS_COLORS } from "@/lib/color-system";

const DIM_COLORS: Record<string, string> = DIMENSION_BASE;

const DIM_ORDER = ["INTE", "RESO", "TEMP", "ADAP", "THOR", "OPEN"] as const;

// Hiányzó csapatszerep rövid következménye a vezető nyelvén.
const ROLE_GAP_HINTS: Record<string, { hu: string; en: string }> = {
  OG: { hu: "új ötletek külső impulzus nélkül elmaradhatnak", en: "fresh ideas may need outside stimulus" },
  KE: { hu: "külső lehetőségek feltárása gyengülhet", en: "exploring outside opportunities may weaken" },
  KO: { hu: "a célok összehangolása és a delegálás sérülhet", en: "goal alignment and delegation may suffer" },
  HA: { hu: "akadályoknál hiányozhat a lendület", en: "momentum may stall at obstacles" },
  ER: { hu: "a döntések kritikus mérlegelése gyengülhet", en: "critical evaluation of decisions may weaken" },
  CS: { hu: "a feszültségoldás és a kohézió sérülhet", en: "tension defusing and cohesion may suffer" },
  MV: { hu: "az ötletek gyakorlati megvalósítása lassulhat", en: "turning ideas into practice may slow down" },
  MI: { hu: "a minőségi lezárás és a határidők csúszhatnak", en: "quality closure and deadlines may slip" },
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
// adat-kontextusban (color-system DYNAMICS_COLORS), mindig felirattal
// (sosem csak színnel) jelölve. Paletta CVD-validálva (dataviz validator).
const DYNAMICS_SEGMENTS = [
  {
    key: "alignedCount",
    color: DYNAMICS_COLORS.aligned,
    chip: "bg-[var(--color-state-success-bg)] text-[var(--color-state-success-fg)]",
    hu: "Összehangolt",
    en: "Aligned",
    explainHu: "hasonló munkastílusú páros — kevés egyeztetéssel is gördülékenyen dolgoznak együtt.",
    explainEn: "similar working styles — they collaborate smoothly with little alignment effort.",
  },
  {
    key: "complementaryCount",
    color: DYNAMICS_COLORS.complementary,
    chip: "bg-[var(--color-state-info-bg)] text-[var(--color-state-info-fg)]",
    hu: "Kiegészítő",
    en: "Complementary",
    explainHu: "eltérő, de összeférő stílusok — más-más helyzetben erősek, jó munkamegosztás-alap.",
    explainEn: "different but compatible styles — strong in different situations, a good basis for dividing work.",
  },
  {
    key: "frictionCount",
    color: DYNAMICS_COLORS.friction,
    chip: "bg-[var(--color-state-warning-bg)] text-[var(--color-state-warning-fg)]",
    hu: "Súrlódási potenciál",
    en: "Friction potential",
    explainHu: "nagy munkastílus-különbség (pl. lelkiismeretesség, kommunikáció) — tisztázott normák nélkül feszültségforrás lehet. Nem jelent tényleges konfliktust.",
    explainEn: "big working-style differences (e.g. structure, communication) — a potential source of tension without agreed norms. It does not mean actual conflict.",
  },
] as const;

// ── Narratíva-megjelenítés ──────────────────────────────────────────────────
// A tanácsadói szöveg tipikusan „• " kezdetű felsorolás-sorokból áll (az
// előtöltés így generálja). A bullet-sorokat ikonos sorokká/kártyákká
// alakítjuk; a sima bekezdések változatlan prózaként jelennek meg — a
// szabad kézzel írt szöveg így is jól néz ki.

type NarrativeBlock =
  | { type: "bullets"; items: string[] }
  | { type: "para"; text: string };

function parseNarrativeBlocks(text: string): NarrativeBlock[] {
  const blocks: NarrativeBlock[] = [];
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) continue;
    const m = line.match(/^[•\-*]\s+(.*)$/);
    if (m) {
      const last = blocks[blocks.length - 1];
      if (last?.type === "bullets") last.items.push(m[1]);
      else blocks.push({ type: "bullets", items: [m[1]] });
    } else {
      blocks.push({ type: "para", text: line });
    }
  }
  return blocks;
}

const NARRATIVE_TONES = {
  sage: {
    circle: "bg-sage/15 text-sage-dark",
    path: "M3 8h10M9 4l4 4-4 4",
  },
  sky: {
    circle: "bg-sky-100 text-sky-700",
    path: "M4 13.5V3h7.5L10 5.5 11.5 8H4",
  },
  bronze: {
    circle: "bg-bronze-soft/60 text-bronze-dark",
    path: "M3 4h10v7H8.5L5.5 13.5V11H3z",
  },
  emerald: {
    circle: "bg-emerald-100 text-emerald-700",
    path: "M3 8.5l3 3 7-7",
  },
  amber: {
    circle: "bg-amber-100 text-amber-700",
    path: "M8 3v6M8 12.5v.5",
  },
} as const;

export function NarrativeRich({
  label,
  text,
  tone,
  card = true,
}: {
  label?: string;
  text: string | null;
  tone: keyof typeof NARRATIVE_TONES;
  /** true → a bullet-sorok kártya-hátteret kapnak; false → könnyű ikonos sor. */
  card?: boolean;
}) {
  if (!text || text.trim().length === 0) return null;
  const blocks = parseNarrativeBlocks(text);
  const t = NARRATIVE_TONES[tone];
  return (
    <div>
      {label ? (
        <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
          {label}
        </p>
      ) : null}
      <div className="flex flex-col gap-2">
        {blocks.map((block, i) =>
          block.type === "para" ? (
            <p key={i} className="text-sm leading-relaxed text-ink-body">
              {block.text}
            </p>
          ) : (
            <ul key={i} className="flex flex-col gap-2">
              {block.items.map((item, j) => (
                <li
                  key={j}
                  className={`flex items-start gap-2.5 ${
                    card
                      ? "rounded-[12px] border border-sand bg-cream/40 px-3.5 py-2.5"
                      : ""
                  }`}
                >
                  <span
                    className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full ${t.circle}`}
                  >
                    <svg
                      viewBox="0 0 16 16"
                      className="h-3.5 w-3.5"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d={t.path} />
                    </svg>
                  </span>
                  <span className="text-sm leading-relaxed text-ink-body">{item}</span>
                </li>
              ))}
            </ul>
          ),
        )}
      </div>
    </div>
  );
}

function KpiTile({
  label,
  value,
  accent,
  progressPct,
}: {
  label: string;
  value: string;
  accent?: string;
  /** Opcionális mini progress-sáv a szám alatt (0–100). */
  progressPct?: number;
}) {
  return (
    <div className="min-w-0 rounded-[14px] border border-sand bg-white p-3.5">
      <p className="break-words font-mono text-micro uppercase tracking-wide text-muted md:tracking-widest">
        {label}
      </p>
      <p
        title={value}
        className={`mt-1 break-words font-fraunces text-xl leading-tight md:text-2xl md:leading-none ${accent ?? "text-ink"}`}
      >
        {value}
      </p>
      {typeof progressPct === "number" && (
        <div className="mt-2 h-1 w-full overflow-hidden rounded-full bg-sand">
          <div
            className="h-full rounded-full bg-sage"
            style={{ width: `${Math.max(0, Math.min(100, progressPct))}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Számozott szekció-fejléc egy soros „mit nézz itt" alcímmel — a riport
// olvasási útvonalát vezeti (a sorszám a renderelt szekciók sorrendjét követi).
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
    <div className="mb-4 flex items-start gap-3">
      <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[10px] bg-white font-mono text-[11px] font-bold text-bronze shadow-sm ring-1 ring-sand">
        {no}
      </span>
      <div className="min-w-0 pt-0.5">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-bronze">
          {label}
        </p>
        {subtitle ? <p className="mt-0.5 text-xs text-muted">{subtitle}</p> : null}
      </div>
    </div>
  );
}

// A 30/60/90 akcióterv-oszlopok akcentus-színei — idővonal-érzet.
const TIMEFRAME_TONES: Record<
  "30" | "60" | "90",
  { dot: string; text: string; edge: string }
> = {
  "30": { dot: "bg-sage", text: "text-sage-dark", edge: "border-l-sage/50" },
  "60": { dot: "bg-sky-500", text: "text-sky-700", edge: "border-l-sky-400/50" },
  "90": { dot: "bg-bronze", text: "text-bronze", edge: "border-l-bronze/50" },
};

export function TeamReportView({
  report: reportInput,
  isHu,
}: {
  report: SerializedTeamReport;
  isHu: boolean;
}) {
  // Angol lekérésnél a JÓVÁHAGYOTT tanácsadói fordítás mezői lépnek életbe
  // (mezőnkénti fallback az eredetire) — ld. lib/team-report-i18n.ts.
  const report = localizeTeamReport(reportInput, isHu);
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

  // A renderelt szekciók futó sorszáma — a fejlécekben olvasási útvonalat ad.
  let sectionCounter = 0;
  const secNo = () => String(++sectionCounter).padStart(2, "0");

  return (
    <div className="flex flex-col gap-7">
      {/* Fejléc + KPI-sáv — gradiens sáv adja meg a riport alaphangját */}
      <DashboardPanel className="overflow-hidden p-0">
        <div
          className={`p-6 ${
            isDraft
              ? "bg-gradient-to-r from-amber-100/50 via-cream/70 to-white"
              : "bg-gradient-to-r from-sage/15 via-cream/70 to-white"
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionEyebrow>
                {isDraft
                  ? isHu ? "csapatkép — előnézet" : "team picture — preview"
                  : isHu ? "validált csapatkép" : "validated team picture"}
              </SectionEyebrow>
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
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-amber-700 shadow-sm ring-1 ring-amber-200">
                {isHu ? "Vázlat-előnézet" : "Draft preview"}
              </span>
            ) : (
              <span className="rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-emerald-700 shadow-sm ring-1 ring-emerald-200">
                {isHu ? "Publikált" : "Published"}
              </span>
            )}
          </div>
        </div>

        {agg && (
          <div className="grid grid-cols-2 gap-3 p-6 pt-5 md:grid-cols-4">
            <KpiTile label={isHu ? "Tagok" : "Members"} value={String(agg.memberCount)} />
            <KpiTile
              label={isHu ? "Kitöltöttség" : "Completion"}
              value={`${agg.completionPct}%`}
              progressPct={agg.completionPct}
            />
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
          <SectionHead
            no={secNo()}
            label={isHu ? "Aggregált csapatprofil" : "Aggregate team profile"}
            subtitle={isHu
              ? "A csapat együttes karaktere — átlagok és a belső sokféleség."
              : "The team's collective character — averages and internal diversity."}
          />
          <DashboardPanel className="p-6">
            {agg.pattern && (
              <div className="mb-5 rounded-[14px] border border-sand bg-cream/60 p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-mono text-micro uppercase tracking-widest text-muted">
                      {isHu ? "Csapatmintázat" : "Team pattern"}
                    </p>
                    <p className="mt-1 font-fraunces text-lg leading-tight text-ink">
                      {agg.pattern.label}
                    </p>
                  </div>
                  {agg.pattern.confidence ? (
                    <span className="rounded-full border border-sand bg-white px-2.5 py-0.5 text-micro font-semibold text-ink-body">
                      {agg.pattern.confidence}{" "}
                      {isHu ? "konfidencia" : "confidence"}
                    </span>
                  ) : null}
                </div>
                {/* Stabilitás-jelzés a mintázat-motorból: küszöb-közeli tengelynél
                    a mintázat kontextusfüggő — a tanácsadói debrifen ezt ki kell
                    mondani, ezért a riportban is látszania kell. */}
                {agg.pattern.stability && agg.pattern.stability !== "stabil" && agg.pattern.stabilityNote ? (
                  <div className="mt-3 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
                    {agg.pattern.stabilityNote}
                    {agg.pattern.unstableAxes && agg.pattern.unstableAxes.length > 0 ? (
                      <span>
                        {" "}
                        {isHu ? "Érintett tengely: " : "Axes involved: "}
                        {agg.pattern.unstableAxes
                          .map((axis) =>
                            isHu
                              ? AXIS_LABELS[axis as keyof typeof AXIS_LABELS]?.name ?? axis
                              : axis,
                          )
                          .join(", ")}
                        .
                      </span>
                    ) : null}
                  </div>
                ) : null}
                {typeof agg.pattern.tensionMemberCount === "number" &&
                agg.pattern.tensionMemberCount > 0 ? (
                  <p className="mt-2 text-micro text-muted">
                    {isHu
                      ? `${agg.pattern.tensionMemberCount} tagnál 20+ pontos egyéni eltérés van a csapatmintától — a minta rájuk kevésbé illik (név nélkül, az egyéni riport tárgya).`
                      : `${agg.pattern.tensionMemberCount} member(s) deviate 20+ points from the team pattern — the label fits them less (no names; that belongs to individual reports).`}
                  </p>
                ) : null}
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
                        <span className="w-14 shrink-0 text-right font-mono text-xs text-ink">
                          {value}
                          {spread !== undefined && <span className="text-muted"> ±{spread}</span>}
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
            label={isHu ? "Szerep-lefedettség" : "Role coverage"}
            subtitle={isHu
              ? "Mely szerepek vannak lefedve, és hol vannak valódi hiányok."
              : "Which roles are covered and where the true gaps are."}
          />
          <DashboardPanel className="p-6">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {ROLE_MATRIX.map((column) => (
                <div key={column.hu} className="flex flex-col gap-2">
                  <p className="font-mono text-micro uppercase tracking-widest text-muted">
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
                <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
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

            <p className="mt-3 text-micro text-muted">
              {isHu
                ? `Tagonként a 3 legerősebb szerepet számoljuk: az 1. elsődlegesként, a 2-3. tartalékként. ${agg.roleDistribution.questionnaireCount} valódi kitöltés · ${agg.roleDistribution.estimateCount} becslés.`
                : `We count each member's 3 strongest roles: the 1st as primary, the 2nd–3rd as backup. ${agg.roleDistribution.questionnaireCount} real fill-out · ${agg.roleDistribution.estimateCount} estimated.`}
            </p>

            {agg.peerRoles && agg.peerRoles.ratedCount > 0 && (
              <div className="mt-4 border-t border-sand pt-4">
                <p className="mb-2 font-mono text-micro uppercase tracking-widest text-muted">
                  {isHu
                    ? "Csapatkép — társértékelésből (névtelen, összesített)"
                    : "Team view — from peer feedback (anonymous, aggregated)"}
                </p>
                <p className="text-xs leading-relaxed text-ink-body">
                  {isHu
                    ? `${agg.peerRoles.ratedCount} / ${agg.peerRoles.memberCount} tagnál állt össze a csapatkép (legalább 3 értékelő).`
                    : `Team view available for ${agg.peerRoles.ratedCount} / ${agg.peerRoles.memberCount} members (at least 3 raters).`}
                  {agg.peerRoles.comparedCount > 0 && (
                    <>
                      {" "}
                      {isHu
                        ? `Önkép–csapatkép összevetés ${agg.peerRoles.comparedCount} tagnál: ${agg.peerRoles.mismatchCount} eltéréssel — az eltérések a vezetői debrief kiemelt beszélgetőpontjai.`
                        : `Self-image vs. team view compared for ${agg.peerRoles.comparedCount} members: ${agg.peerRoles.mismatchCount} with differences — key talking points for the leadership debrief.`}
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
                          className="inline-flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[11px] font-semibold text-ink-body"
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
            subtitle={isHu
              ? "Mennyire hasonlóan dolgoznak a tagpárok — összkép, egyéni párok nélkül."
              : "How similarly member pairs work — an overview, without individual pairs."}
          />
          <DashboardPanel className="p-6">
            <p className="mb-3 text-sm text-ink-body">
              {isHu
                ? `A csapat mind a ${dynamicsTotal} tagpárjának munkastílus-összevetése — mennyire hasonlóan vagy eltérően dolgozik két ember.`
                : `A working-style comparison of all ${dynamicsTotal} member pairs — how similarly or differently two people work.`}
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

            {/* A kategória-magyarázó alapból csukva — a sűrűség csökkentésére. */}
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
                      {isHu ? segment.explainHu : segment.explainEn}
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

            <p className="mt-2 text-micro text-muted">
              {agg.dynamics.source === "trust_round"
                ? isHu ? "Mért bizalmi körön (360°) alapul." : "Based on a measured trust round (360°)."
                : agg.dynamics.source === "mixed"
                  ? isHu ? "Részben mért bizalmi kör, részben profil-alapú becslés." : "Partly a measured trust round, partly profile-based estimate."
                  : isHu ? "Profil-alapú becslés — kapcsolatpáronkénti adatok nem jelennek meg." : "Profile-based estimate — pair-level data is not shown."}
            </p>
          </DashboardPanel>
        </section>
      )}

      {/* Kapcsolati háló kiemelések — hub / beágyazatlan tag a debriefhez.
          Summary-orientált (viz-policy): névvel jelölt tagok, nem külön chart. */}
      {agg?.trustHighlights &&
        (agg.trustHighlights.hubs.length > 0 ||
          agg.trustHighlights.isolated.length > 0) && (
          <section>
            <SectionHead
              no={secNo()}
              label={isHu ? "Kapcsolati háló — kiemelések" : "Relationship network — highlights"}
              subtitle={isHu
                ? "Ki köti össze a csapatot, és ki nincs még beágyazva."
                : "Who connects the team, and who isn't embedded yet."}
            />
            <DashboardPanel className="p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm text-ink-body">
                  {isHu
                    ? "Kik viszik a csapat kapcsolati szövetét — a tanácsadói debrief két kiemelt beszélgetőpontja."
                    : "Who carries the team's relational fabric — two key talking points for the consultant debrief."}
                </p>
                {agg.trustHighlights.source === "trust_round" ? (
                  <span className="rounded-full bg-sage/15 px-2.5 py-1 font-mono text-micro uppercase tracking-wide text-sage-dark">
                    {isHu ? "mért" : "measured"}
                  </span>
                ) : (
                  <span className="rounded-full bg-amber-50 px-2.5 py-1 font-mono text-micro uppercase tracking-wide text-amber-700">
                    {isHu ? "becsült" : "estimated"}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {agg.trustHighlights.hubs.length > 0 && (
                  <div className="rounded-[14px] border border-sage/35 bg-sage/10 p-4">
                    <p className="font-mono text-micro uppercase tracking-widest text-sage-dark">
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
                          className="rounded-full bg-white px-2.5 py-1 text-caption font-semibold text-ink"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink-body">
                      {agg.trustHighlights.source === "trust_round"
                        ? isHu
                          ? "A legtöbb erős, kölcsönös bizalmi kapcsolattal — rájuk támaszkodik a csapat információáramlása és összetartása."
                          : "With the most strong, mutual trust connections — the team's information flow and cohesion rest on them."
                        : isHu
                          ? "A legtöbb hasonló-profilú kapcsolattal (profil-alapú becslés) — mért bizalmi kör pontosítaná a képet."
                          : "With the most similar-profile connections (profile-based estimate) — a measured trust round would sharpen this."}
                    </p>
                  </div>
                )}

                {agg.trustHighlights.isolated.length > 0 && (
                  <div className="rounded-[14px] border border-amber-200 bg-amber-50/60 p-4">
                    <p className="font-mono text-micro uppercase tracking-widest text-amber-700">
                      {isHu
                        ? agg.trustHighlights.isolated.length > 1
                          ? "Beágyazatlan tagok"
                          : "Beágyazatlan tag"
                        : agg.trustHighlights.isolated.length > 1
                          ? "Not-yet-embedded members"
                          : "Not-yet-embedded member"}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {agg.trustHighlights.isolated.map((name) => (
                        <span
                          key={name}
                          className="rounded-full bg-white px-2.5 py-1 text-caption font-semibold text-ink"
                        >
                          {name}
                        </span>
                      ))}
                    </div>
                    <p className="mt-2 text-xs leading-relaxed text-ink-body">
                      {isHu
                        ? "Több mért kapcsolatuk van, de egyetlen erős bizalmi él nélkül — érdemes megnézni, mi tartja őket a háló szélén. Nem teljesítmény-ítélet."
                        : "They have several measured connections but no strong trust edge — worth exploring what keeps them at the network's edge. Not a performance judgment."}
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
                      }. A kiemelés láthatósága a dinamika-térképpel azonos; egyéni válasz nem visszakereshető.`
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
                    ? "Profil-alapú becslés — bizalmi kör (360°) indításával mért adatra cserélhető, ami a beágyazatlan-tag felismerést is elérhetővé teszi."
                    : "Profile-based estimate — running a 360° trust round replaces it with measured data and also unlocks not-yet-embedded member detection."}
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
              ? "Békeidőben erősség — terhelés alatt összeadódó kollektív minta lehet."
              : "A strength in calm times — under load it can compound into a collective pattern."}
          />
          <DashboardPanel className="p-6">
            <div className="flex flex-col gap-4">
              {agg.pressure.concentrations.map((c) => {
                const content =
                  TEAM_PRESSURE_CONTENT[c.dim as TritanDimCode]?.[c.pole];
                if (!content) return null;
                const dimLabel = DIM_LABELS[c.dim]
                  ? isHu
                    ? DIM_LABELS[c.dim].hu
                    : DIM_LABELS[c.dim].en
                  : c.dim;
                return (
                  <div
                    key={`${c.dim}-${c.pole}`}
                    className="rounded-[14px] border border-amber-200 bg-amber-50 p-4"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: DIM_COLORS[c.dim] ?? "var(--color-sage)" }}
                      />
                      <p className="text-sm font-semibold text-ink">
                        {dimLabel} —{" "}
                        {c.pole === "high"
                          ? isHu ? "magas pólus" : "high pole"
                          : isHu ? "alacsony pólus" : "low pole"}
                      </p>
                      <span className="ml-auto rounded-full border border-amber-200 bg-white px-2 py-0.5 text-micro font-medium text-amber-800">
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
                ? "Önértékelésekből becsült kollektív minta — hipotézis, nem diagnózis. Kérdezd meg a vezetőt: ráismer-e; ha nem, az is adat. Egyéni értékek nem jelennek meg."
                : "A collective pattern estimated from self-assessments — a hypothesis, not a diagnosis. Ask the leader whether they recognize it; if not, that is data too. Individual values are not shown."}
            </p>
          </DashboardPanel>
        </section>
      )}

      {/* Pszichológiai biztonság — anonim pulse-aggregátum */}
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
                  <div
                    key={item.id}
                    className="flex flex-col gap-1 md:flex-row md:items-center md:gap-3"
                  >
                    <span
                      className={`text-xs leading-snug md:w-64 md:shrink-0 ${
                        isWeak ? "font-semibold text-amber-800" : "text-ink-body"
                      }`}
                    >
                      {isHu ? item.area.hu : item.area.en}
                    </span>
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="h-[6px] flex-1 overflow-hidden rounded-full bg-sand">
                        <div
                          className={`h-full rounded-full transition-all duration-700 ${
                            isWeak ? "bg-amber-500" : "bg-sage"
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
                <p className="font-mono text-micro uppercase tracking-widest text-amber-700">
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
                      <p className="text-caption font-semibold text-ink">
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

                {/* Vezetői akciókártyák — a gyenge területek mögött tipikus
                    vezetői mintázat és ellenszere. Keret: HBR 2026/07
                    („4 Hidden Traps of Team Dynamics"), saját adaptáció.
                    Alapból csukva — a sűrűség csökkentésére. */}
                {(() => {
                  const traps = leaderTrapsForWeakItems(agg.psychSafety!.weakItemIds);
                  if (traps.length === 0) return null;
                  return (
                    <details className="mt-1 rounded-[12px] border border-sand bg-white">
                      <summary className="cursor-pointer select-none px-4 py-2.5 font-mono text-micro uppercase tracking-widest text-bronze transition-colors hover:text-bronze-dark">
                        {isHu
                          ? `Vezetői akciókártyák (${traps.length})`
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
                            ? "Keret: Harvard Business Review (2026/07), a Trita saját adaptációjában."
                            : "Framework: Harvard Business Review (2026/07), in Trita's own adaptation."}
                        </p>
                      </div>
                    </details>
                  );
                })()}
              </div>
            ) : (
              <p className="mt-5 rounded-xl bg-sage/5 px-4 py-3 text-xs leading-relaxed text-ink-body">
                {isHu
                  ? "Nincs kirívóan gyenge terület — a biztonság-élmény kiegyensúlyozott. Érdemes rendszeres pulse-szal követni, hogy így is maradjon."
                  : "No conspicuously weak area — the sense of safety is balanced. Track it with a regular pulse to keep it that way."}
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

      {/* Tanácsadói narratíva */}
      <section>
        <SectionHead
          no={secNo()}
          label={isHu ? "Tanácsadói értékelés" : "Consultant assessment"}
          subtitle={isHu
            ? "A tanácsadó összegzése: erősségek, kockázatok, ajánlások."
            : "The consultant's synthesis: strengths, risks, recommendations."}
        />
        {/* EN lekérés jóváhagyott fordítás nélkül: explicit jelzés, hogy a
            tanácsadói szövegek magyar eredetiben jelennek meg. */}
        {!isHu && !hasApprovedEnTranslation(reportInput) && report.summary ? (
          <p className="mb-3 rounded-[10px] border border-amber-200 bg-amber-50/60 px-3.5 py-2 text-xs text-amber-800">
            Consultant-written sections below appear in the Hungarian original — the
            English translation hasn&apos;t been approved yet.
          </p>
        ) : null}
        <div className="flex flex-col gap-4">
          {report.summary && (
            <DashboardPanel className="border-l-4 border-l-bronze/50 p-6">
              <p className="mb-2 font-mono text-micro uppercase tracking-widest text-bronze">
                {isHu ? "Összefoglaló" : "Summary"}
              </p>
              {/* Lead-tipográfia: az összefoglaló a riport „első bekezdése". */}
              <p className="whitespace-pre-wrap font-fraunces text-[16px] leading-relaxed text-ink">
                {report.summary}
              </p>
            </DashboardPanel>
          )}
          {(report.strengths || report.risks) && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {report.strengths && (
                <DashboardPanel className="border-l-4 border-l-emerald-500/60 p-5">
                  <p className="mb-1.5 flex items-center gap-1.5 font-mono text-micro uppercase tracking-widest text-emerald-700">
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 8.5l3 3 7-7" />
                    </svg>
                    {isHu ? "Erősségek" : "Strengths"}
                  </p>
                  <NarrativeRich text={report.strengths} tone="emerald" card={false} />
                </DashboardPanel>
              )}
              {report.risks && (
                <DashboardPanel className="border-l-4 border-l-amber-500/60 p-5">
                  <p className="mb-1.5 flex items-center gap-1.5 font-mono text-micro uppercase tracking-widest text-amber-700">
                    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M8 3v6M8 12.5v.5" />
                    </svg>
                    {isHu ? "Kockázatok" : "Risks"}
                  </p>
                  <NarrativeRich text={report.risks} tone="amber" card={false} />
                </DashboardPanel>
              )}
            </div>
          )}
          {(report.recommendations || report.interviewFindings || report.leadershipGuide || report.summary) ? (
            <DashboardPanel className="flex flex-col gap-6 p-6">
              <NarrativeRich
                label={isHu ? "Ajánlások" : "Recommendations"}
                text={report.recommendations}
                tone="sage"
              />
              <NarrativeRich
                label={isHu ? "Interjúk tanulságai" : "Interview insights"}
                text={report.interviewFindings}
                tone="bronze"
              />
              <NarrativeRich
                label={isHu ? "Hogyan vezesd ezt a csapatot" : "How to lead this team"}
                text={report.leadershipGuide}
                tone="sky"
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

      {/* Akcióterv: 30/60/90 napos idővonal — oszloponként saját akcentus */}
      {report.actionItems && report.actionItems.length > 0 && (
        <section>
          <SectionHead
            no={secNo()}
            label={isHu ? "Akcióterv" : "Action plan"}
            subtitle={isHu
              ? "Konkrét lépések 30 / 60 / 90 napos bontásban."
              : "Concrete steps across 30 / 60 / 90 days."}
          />
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {(["30", "60", "90"] as const).map((timeframe) => {
              const items = report.actionItems!.filter((item) => item.timeframe === timeframe);
              const tone = TIMEFRAME_TONES[timeframe];
              return (
                <DashboardPanel key={timeframe} className={`border-l-4 p-5 ${tone.edge}`}>
                  <p className={`mb-3 flex items-center gap-2 border-b border-sand pb-2 font-mono text-micro uppercase tracking-widest ${tone.text}`}>
                    <span className={`h-2 w-2 rounded-full ${tone.dot}`} />
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
                ? `${agg.completedCount}/${agg.memberCount} kitöltött felmérés · ${agg.evidence.measuredEdgeCount ?? 0} mért és ${agg.evidence.estimatedEdgeCount} becsült kapcsolati adat`
                : `${agg.completedCount}/${agg.memberCount} completed assessments · ${agg.evidence.measuredEdgeCount ?? 0} measured and ${agg.evidence.estimatedEdgeCount} estimated relationship data points`}
            </span>
          </div>
          <p className="mt-2 text-micro text-muted">
            {isHu
              ? "A riport a publikáláskor rögzített aggregált adatokon alapul; egyéni eredmények nem jelennek meg. A becsült elemek profil-alapú modellből származnak."
              : "This report is based on aggregate data frozen at publication; individual results are not shown. Estimated elements come from a profile-based model."}
          </p>
        </DashboardPanel>
      )}
    </div>
  );
}

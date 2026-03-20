"use client";

import type { TeamPatternResult, AxisDetail } from "@/lib/team-pattern";
import { AXIS_LABELS, PATTERN_NAMES } from "@/lib/team-pattern";

// Remap a team-pattern axis value (0–100, asymmetric threshold) to a
// PatternExplorer slider value (0–100, symmetric 50 = midpoint).
// The team-pattern threshold becomes 50 on the slider.
const PATTERN_THRESHOLDS = { drive: 55, cohesion: 60, discipline: 62.5, openness: 57.5 };
function remapToSlider(value: number, threshold: number): number {
  const remapped =
    value < threshold
      ? (value / threshold) * 50
      : 50 + ((value - threshold) / (100 - threshold)) * 50;
  return Math.round(Math.max(0, Math.min(100, remapped)));
}

interface TeamPatternCardProps {
  patternResult: TeamPatternResult | null;
  totalMembers: number;
  isHu: boolean;
}

// ── Helpers ────────────────────────────────────────────────

const CONFIDENCE_COLORS = {
  magas:    { bg: "bg-emerald-50",  text: "text-emerald-700",  border: "border-emerald-200" },
  közepes:  { bg: "bg-amber-50",    text: "text-amber-700",    border: "border-amber-200"   },
  alacsony: { bg: "bg-rose-50",     text: "text-rose-700",     border: "border-rose-200"    },
};

/**
 * 5-zone axis bar.
 * The bar is split into 5 equal zones. A dot marks the actual value.
 * The middle zone is subtly highlighted as "balanced".
 */
function AxisBar({ axis, label }: { axis: AxisDetail; label: typeof AXIS_LABELS[keyof typeof AXIS_LABELS] }) {
  // value is 0-100; clamp for display
  const pct = Math.max(0, Math.min(100, axis.value));

  // Dot color by grade
  const dotColor =
    axis.grade === "balanced"
      ? "#a09a90"
      : axis.grade === "strong_high" || axis.grade === "slight_high"
      ? "#c8410a"
      : "#3d3a35";

  const diversityColors = {
    homogén: "text-emerald-600",
    vegyes:  "text-amber-600",
    diverz:  "text-rose-600",
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-semibold text-[#1a1814]">{label.name}</span>
          {"tooltip" in label && (
            <span
              title={label.tooltip as string}
              className="inline-flex h-4 w-4 cursor-help items-center justify-center rounded-full bg-[#e8e4dc] text-[9px] font-semibold text-[#5a5650]"
            >
              i
            </span>
          )}
        </div>
        <span className={`text-[10px] font-mono ${diversityColors[axis.diversityLabel]}`}>
          {axis.diversityLabel}
        </span>
      </div>

      {/* Bar */}
      <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-[#e8e4dc]">
        {/* Balanced zone highlight (middle 20% → approx zone 2-3 of 5) */}
        <div
          className="absolute inset-y-0 bg-[#f0ede6]"
          style={{ left: "40%", width: "20%" }}
        />
        {/* Dot */}
        <div
          className="absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-sm"
          style={{ left: `${pct}%`, backgroundColor: dotColor }}
        />
      </div>

      {/* Pole labels */}
      <div className="mt-0.5 flex items-center justify-between">
        <span className="font-mono text-[9px] uppercase tracking-wider text-[#a09a90]">
          {label.low}
        </span>
        <span className="font-mono text-[9px] uppercase tracking-wider text-[#a09a90]">
          {label.high}
        </span>
      </div>
    </div>
  );
}

// ── Main component ──────────────────────────────────────────

export function TeamPatternCard({ patternResult: data, totalMembers, isHu }: TeamPatternCardProps) {
  // Not enough data
  if (!data) {
    return (
      <div className="rounded-2xl border border-[#e8e4dc] bg-white shadow-sm">
        <div className="border-b border-[#f0ede6] px-6 py-4">
          <p className="font-mono text-[10px] uppercase tracking-widest text-[#c8410a]">
            // {isHu ? "csapatminta" : "team pattern"}
          </p>
          <h2 className="mt-0.5 font-playfair text-xl text-[#1a1814]">
            {isHu ? "Domináns működési mintázat" : "Dominant operating pattern"}
          </h2>
        </div>
        <div className="p-6">
          <p className="text-sm text-[#5a5650]">
            {isHu
              ? `A mintázat kiszámításához legalább 3 kitöltött értékelés szükséges. Jelenleg: ${totalMembers} tagból ${0} töltötte ki.`
              : `Pattern calculation requires at least 3 completed assessments.`}
          </p>
        </div>
      </div>
    );
  }

  const content = PATTERN_NAMES[data.patternCode];
  const confColors = CONFIDENCE_COLORS[data.confidence];

  return (
    <div className="rounded-2xl border border-[#e8e4dc] bg-white shadow-sm">
      {/* Header */}
      <div className="border-b border-[#f0ede6] px-6 py-4">
        <p className="font-mono text-[10px] uppercase tracking-widest text-[#c8410a]">
          // {isHu ? "csapatminta" : "team pattern"}
        </p>
        <div className="mt-1 flex flex-wrap items-start justify-between gap-2">
          <h2 className="font-playfair text-3xl text-[#1a1814] md:text-4xl">
            {data.patternName}
            <span className="ml-3 text-lg font-normal text-[#a09a90]">
              — {data.diversitySuffix}
            </span>
          </h2>
          {/* Confidence badge */}
          <span
            className={`rounded-full border px-2.5 py-0.5 text-xs font-semibold ${confColors.bg} ${confColors.text} ${confColors.border}`}
            title={`${isHu ? "Minta" : "Sample"}: ${data.confidenceFactors.sampleSize} · ${isHu ? "Stabilitás" : "Stability"}: ${data.confidenceFactors.thresholdProximity} · ${isHu ? "Mintázat-tisztaság" : "Pattern clarity"}: ${data.confidenceFactors.patternClarity}`}
          >
            {data.confidence} {isHu ? "pontosság" : "confidence"}
          </span>
        </div>
        {content && (
          <p className="mt-1 text-xs text-[#5a5650]">{content.subtitle}</p>
        )}
      </div>

      <div className="p-6">
        {/* Stability warning */}
        {data.stability !== "stabil" && (
          <div className="mb-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
            {data.stabilityNote}
          </div>
        )}

        {/* Description */}
        {content && (
          <p className="mb-5 text-sm leading-relaxed text-[#3d3a35]">
            {content.description}
          </p>
        )}

        {/* Axis bars */}
        <div className="mb-5 flex flex-col gap-4">
          {(["drive", "cohesion", "discipline", "openness"] as const).map((key) => (
            <AxisBar key={key} axis={data.axes[key]} label={AXIS_LABELS[key]} />
          ))}
        </div>

        {/* Strengths + Blind spots */}
        {content && (
          <div className="mb-5 grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl bg-[#f0fdf4] border border-[#a0d8c4] p-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[#059669]">
                // {isHu ? "erősségek" : "strengths"}
              </p>
              <ul className="space-y-1">
                {content.strengths.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[#3d3a35]">
                    <span className="mt-0.5 shrink-0 text-[#059669]">✓</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-xl bg-[#fff8ee] border border-[#f5d99a] p-4">
              <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-[#b45309]">
                // {isHu ? "vakfoltok" : "blind spots"}
              </p>
              <ul className="space-y-1">
                {content.blindSpots.map((s, i) => (
                  <li key={i} className="flex items-start gap-1.5 text-xs text-[#3d3a35]">
                    <span className="mt-0.5 shrink-0 text-[#b45309]">△</span>
                    {s}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {/* Next steps — 3 timed action cards */}
        {content && content.leaderActions.length >= 3 && (
          <div className="mb-5">
            <p className="mb-3 font-mono text-[9px] uppercase tracking-widest text-[#c8410a]">
              // {isHu ? "ajánlott következő lépések" : "recommended next steps"}
            </p>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
              {[
                { timing: isHu ? "Ezen a héten" : "This week",    action: content.leaderActions[0], accent: "#c8410a" },
                { timing: isHu ? "Ezen a hónapban" : "This month", action: content.leaderActions[1], accent: "#8B5CF6" },
                { timing: isHu ? "Rendszeresen" : "Ongoing",       action: content.leaderActions[2], accent: "#10B981" },
              ].map(({ timing, action, accent }) => (
                <div
                  key={timing}
                  className="relative overflow-hidden rounded-xl border border-[#e8e4dc] bg-[#faf9f6] p-4 pt-5"
                >
                  <div
                    className="absolute left-0 right-0 top-0 h-[3px]"
                    style={{ backgroundColor: accent }}
                  />
                  <p className="mb-1 font-mono text-[9px] uppercase tracking-widest" style={{ color: accent }}>
                    {timing}
                  </p>
                  <p className="text-xs leading-relaxed text-[#3d3a35]">{action}</p>
                </div>
              ))}
            </div>
            <a
              href={`/patterns?drive=${remapToSlider(data.axes.drive.value, PATTERN_THRESHOLDS.drive)}&cohesion=${remapToSlider(data.axes.cohesion.value, PATTERN_THRESHOLDS.cohesion)}&discipline=${remapToSlider(data.axes.discipline.value, PATTERN_THRESHOLDS.discipline)}&openness=${remapToSlider(data.axes.openness.value, PATTERN_THRESHOLDS.openness)}`}
              className="mt-4 inline-flex min-h-[44px] items-center rounded-lg border border-[#c8410a]/30 bg-white px-5 text-sm font-semibold text-[#c8410a] transition hover:bg-[#c8410a] hover:text-white"
            >
              {isHu ? "Megnézem a csapatmintát →" : "Explore team pattern →"}
            </a>
          </div>
        )}

        {/* Alternative pattern */}
        {data.alternativeName && (
          <p className="mb-4 text-sm text-[#5a5650]">
            {isHu ? "Közeli alternatív mintázat:" : "Closest alternative pattern:"}{" "}
            <span className="font-semibold text-[#1a1814]">{data.alternativeName}</span>
          </p>
        )}

        {/* Meta */}
        <p className="mb-4 font-mono text-[10px] text-[#a09a90]">
          {data.membersWithAssessment}/{data.memberCount}{" "}
          {isHu ? "tag értékelése alapján" : "member assessments"}
          {data.missingMembers > 0 && (
            <> · {data.missingMembers} {isHu ? "hiányzó adat" : "missing"}</>
          )}
        </p>

        {/* Framing note */}
        <p className="border-t border-[#e8e4dc] pt-4 text-xs italic text-[#a09a90]">
          {isHu
            ? "A csapat jelenlegi önértékelés-alapú működési mintázatának értelmezése. Nem diagnózis, nem teljesítménycímke — idővel változhat."
            : "This is an interpretation of the team's current self-assessment-based operating pattern. Not a diagnosis or performance label — it can change over time."}
        </p>
      </div>
    </div>
  );
}

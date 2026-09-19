import { CandidateMeasurementNote } from "./CandidateMeasurementNote";
import { HEXACO_DIMENSIONS, HEXACO_ORDER } from "@/lib/hexaco";
import { t, type Locale } from "@/lib/i18n";
export function CandidateRadar({
  dimensions,
  baseline,
  locale,
  compact = false,
  name,
  teamName,
}: {
  dimensions: Record<string, number>;
  baseline?: Record<string, number>;
  locale: Locale;
  compact?: boolean;
  name: string;
  teamName?: string;
}) {
  const point = (i: number, value: number) => {
    const a = (i * Math.PI) / 3 - Math.PI / 2;
    return `${170 + Math.cos(a) * value * 1.12},${158 + Math.sin(a) * value * 1.12}`;
  };
  const polygon = (values: Record<string, number>) =>
    HEXACO_ORDER.map((d, i) =>
      point(i, Math.max(0, Math.min(100, values[d] ?? 0))),
    ).join(" ");
  const valid = (values: Record<string, number>) =>
    HEXACO_ORDER.every(
      (d) => Number.isFinite(values[d]) && values[d] >= 0 && values[d] <= 100,
    );
  if (!valid(dimensions) || (baseline && !valid(baseline)))
    return (
      <p className="text-caption text-muted">
        {t("candidateProgram.chartMissing", locale)}
      </p>
    );
  return (
    <div>
      <svg
        viewBox="0 0 340 316"
        role="img"
        aria-label={`${name}${teamName ? ` · ${teamName}` : ""}`}
        className="mx-auto w-full max-w-md"
      >
        <title>{t("candidateProgram.radarTitle", locale)}</title>
        {[25, 50, 75, 100].map((v) => (
          <polygon
            key={v}
            points={HEXACO_ORDER.map((_, i) => point(i, v)).join(" ")}
            fill="none"
            stroke="currentColor"
            className="text-sand"
          />
        ))}
        {HEXACO_ORDER.map((d, i) => {
          const [x, y] = point(i, 100).split(",");
          const [lx, ly] = point(i, 120).split(",");
          return (
            <g key={d}>
              <line
                x1="170"
                y1="158"
                x2={x}
                y2={y}
                stroke="currentColor"
                className="text-sand"
              />
              <text
                x={lx}
                y={ly}
                textAnchor="middle"
                dominantBaseline="middle"
                className="fill-current text-muted text-caption"
              >
                {HEXACO_DIMENSIONS[d].letter}
              </text>
            </g>
          );
        })}
        {!compact &&
          [25, 50, 75, 100].map((v) => (
            <text
              key={v}
              x="176"
              y={158 - v * 1.12}
              className="fill-current text-muted text-note"
            >
              {v}
            </text>
          ))}
        <polygon
          points={polygon(dimensions)}
          fill="currentColor"
          fillOpacity="0.17"
          stroke="currentColor"
          strokeWidth="2.5"
          className="text-sage"
        />
        {baseline && (
          <polygon
            points={polygon(baseline)}
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeDasharray="5 3"
            className="text-bronze"
          />
        )}
        {HEXACO_ORDER.map((d, i) => {
          const [cx, cy] = point(i, dimensions[d]).split(",");
          return (
            <circle
              key={d}
              cx={cx}
              cy={cy}
              r="3.5"
              className="fill-current text-sage"
            />
          );
        })}
      </svg>
      {!compact && (
        <>
          <CandidateMeasurementNote locale={locale} />
          <div className="flex flex-wrap justify-center gap-5 text-caption">
            <span className="text-sage">● {name}</span>
            {baseline && <span className="text-bronze">┄ {teamName}</span>}
          </div>
          <div className="mt-5 grid grid-cols-2 gap-x-3 gap-y-2 text-note text-muted">
            {HEXACO_ORDER.map((d) => (
              <span key={d}>
                <strong className="text-ink">
                  {HEXACO_DIMENSIONS[d].letter}
                </strong>{" "}
                · {HEXACO_DIMENSIONS[d][locale]}
              </span>
            ))}
          </div>
          <details className="mt-5 text-caption">
            <summary className="min-h-11 cursor-pointer py-3 text-muted">
              {t("candidateProgram.exactValues", locale)}
            </summary>
            <table className="w-full text-left">
              <caption className="sr-only">
                {t("candidateProgram.radarTitle", locale)}
              </caption>
              <thead>
                <tr>
                  <th>{t("candidateProgram.dimension", locale)}</th>
                  <th>{name}</th>
                  {baseline && <th>{teamName}</th>}
                </tr>
              </thead>
              <tbody>
                {HEXACO_ORDER.map((d) => (
                  <tr key={d} className="border-t border-sand">
                    <th className="py-2 font-normal">
                      {HEXACO_DIMENSIONS[d].letter} ·{" "}
                      {HEXACO_DIMENSIONS[d][locale]}
                    </th>
                    <td>{Math.round(dimensions[d])}</td>
                    {baseline && <td>{Math.round(baseline[d])}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </div>
  );
}

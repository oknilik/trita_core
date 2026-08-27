"use client";

import { useMemo, useRef, useState, useSyncExternalStore } from "react";

// ─────────────────────────────────────────────────────────────────────
// Admin idősor-chart (Vezérlő) — könnyű, könyvtár-mentes SVG.
// Dataviz-szabályok szerint: 2px vonal, halvány terület-kitöltés, recesszív
// rács, legenda + vonalvégi direkt címke (identitás nem csak szín), hover
// crosshair + tooltip, tabular-nums. Paletta: sage · bronz (token-értékek).
// ─────────────────────────────────────────────────────────────────────

export interface TrendSeries {
  name: string;
  color: string;
  values: number[];
}

const W = 640;
const H = 220;
// Az SVG fix viewBox-szal skálázódik (w-full), ezért mobilon ~0,5× a
// tényleges méret: a 10px-es feliratok olvashatatlanná zsugorodnának.
// Keskeny nézeten NAGYOBB user-unit tipó + ritkább x-tick + több hely a
// tengelyeknek — desktopon (md-től) az eredeti értékek maradnak. A vonalvégi
// sorozat-címke mobilon kimarad (nagyobb tipóval kilógna); a sorozat-identitás
// ott a chart alatti legendából jön, ami szín + név + összeg.
const PAD_WIDE = { top: 16, right: 76, bottom: 26, left: 34 };
const PAD_NARROW = { top: 16, right: 24, bottom: 42, left: 54 };

const NARROW_QUERY = "(max-width: 767px)";

function subscribeNarrow(onChange: () => void) {
  const mq = window.matchMedia(NARROW_QUERY);
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}

function useIsNarrow() {
  return useSyncExternalStore(
    subscribeNarrow,
    () => window.matchMedia(NARROW_QUERY).matches,
    () => false,
  );
}

export function AdminTrendChart({
  labels,
  series,
}: {
  labels: string[];
  series: TrendSeries[];
}) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const [hoverIdx, setHoverIdx] = useState<number | null>(null);
  const narrow = useIsNarrow();
  const PAD = narrow ? PAD_NARROW : PAD_WIDE;
  const axisFont = narrow ? 17 : 10;
  const seriesFont = narrow ? 17 : 10.5;

  const maxValue = Math.max(1, ...series.flatMap((s) => s.values));
  // Kerek y-max (1-2-5 lépcső), hogy a rácsvonalak értelmes számokra essenek.
  const yMax = useMemo(() => {
    const steps = [1, 2, 5];
    let mag = 1;
    for (;;) {
      for (const st of steps) {
        const candidate = st * mag;
        if (candidate >= maxValue) return candidate;
      }
      mag *= 10;
    }
  }, [maxValue]);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const n = labels.length;
  const x = (i: number) => PAD.left + (n <= 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;

  // Dedupe: kis yMax-nál (1-2) a kerekített rácsértékek ütköznek — a
  // duplikátum React-kulcs hibát ÉS felesleges dupla vonalat adna.
  const gridLines = [...new Set([0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f)))];
  // Max 6 (mobilon 3) x-tengely felirat — a többi bucket címke a tooltipben él.
  const tickEvery = Math.max(1, Math.ceil(n / (narrow ? 3 : 6)));

  function onMove(e: React.PointerEvent<SVGSVGElement>) {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || n === 0) return;
    const px = ((e.clientX - rect.left) / rect.width) * W;
    const rel = (px - PAD.left) / Math.max(innerW, 1);
    const idx = Math.round(rel * (n - 1));
    setHoverIdx(Math.max(0, Math.min(n - 1, idx)));
  }

  const hover = hoverIdx !== null ? hoverIdx : null;
  const tooltipOnLeft = hover !== null && hover > n / 2;

  return (
    <div className="relative">
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={series.map((s) => s.name).join(" és ")}
        className="w-full"
        onPointerMove={onMove}
        onPointerLeave={() => setHoverIdx(null)}
      >
        {/* Recesszív rács + y-feliratok */}
        {gridLines.map((v) => (
          <g key={v}>
            <line
              x1={PAD.left}
              x2={W - PAD.right}
              y1={y(v)}
              y2={y(v)}
              stroke="var(--color-sand)"
              strokeWidth={v === 0 ? 1.2 : 0.7}
            />
            <text
              x={PAD.left - 6}
              y={y(v) + axisFont * 0.34}
              textAnchor="end"
              fontSize={axisFont}
              fill="var(--color-muted)"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {v}
            </text>
          </g>
        ))}

        {/* x-feliratok (ritkítva) */}
        {labels.map((label, i) =>
          i % tickEvery === 0 ? (
            <text
              key={i}
              x={x(i)}
              y={H - (narrow ? 12 : 8)}
              textAnchor="middle"
              fontSize={axisFont}
              fill="var(--color-muted)"
            >
              {label}
            </text>
          ) : null,
        )}

        {/* Sorozatok: halvány terület + 2px vonal + vonalvégi direkt címke */}
        {series.map((s) => {
          const line = s.values.map((v, i) => `${x(i)},${y(v)}`).join(" ");
          const area = `${PAD.left},${y(0)} ${line} ${x(n - 1)},${y(0)}`;
          const lastV = s.values[n - 1] ?? 0;
          return (
            <g key={s.name}>
              <polygon points={area} fill={s.color} opacity={0.1} />
              <polyline
                points={line}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {/* Végpont-hangsúly + direkt címke */}
              <circle cx={x(n - 1)} cy={y(lastV)} r={narrow ? 5 : 3.5} fill={s.color} />
              {!narrow && (
                <text
                  x={x(n - 1) + 8}
                  y={y(lastV) + seriesFont * 0.34}
                  fontSize={seriesFont}
                  fontWeight={600}
                  fill="var(--color-ink-body)"
                >
                  {s.name}
                </text>
              )}
            </g>
          );
        })}

        {/* Hover crosshair + pont-jelölők */}
        {hover !== null ? (
          <g>
            <line
              x1={x(hover)}
              x2={x(hover)}
              y1={PAD.top}
              y2={H - PAD.bottom}
              stroke="var(--color-ink-warm)"
              strokeWidth={0.8}
              strokeDasharray="3 3"
            />
            {series.map((s) => (
              <circle
                key={s.name}
                cx={x(hover)}
                cy={y(s.values[hover] ?? 0)}
                r={4}
                fill={s.color}
                stroke="#ffffff"
                strokeWidth={2}
              />
            ))}
          </g>
        ) : null}
      </svg>

      {/* Tooltip */}
      {hover !== null ? (
        <div
          className="pointer-events-none absolute top-1 z-10 rounded-lg border border-sand bg-surface-card px-3 py-2 shadow-md"
          style={
            tooltipOnLeft
              ? { right: `${100 - (x(hover) / W) * 100 + 2}%` }
              : { left: `${(x(hover) / W) * 100 + 2}%` }
          }
        >
          <p className="text-micro font-semibold uppercase tracking-wide text-muted">
            {labels[hover]}
          </p>
          {series.map((s) => (
            <p key={s.name} className="mt-0.5 flex items-center gap-1.5 text-xs text-ink-body">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: s.color }}
              />
              {s.name}:{" "}
              <span className="font-semibold tabular-nums text-ink">
                {s.values[hover] ?? 0}
              </span>
            </p>
          ))}
        </div>
      ) : null}

      {/* Legenda (2 sorozat – szín + név, sosem csak szín) */}
      <div className="mt-2 flex flex-wrap gap-4">
        {series.map((s) => (
          <span key={s.name} className="flex items-center gap-1.5 text-xs text-ink-body">
            <span
              aria-hidden
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            {s.name}
            <span className="font-semibold tabular-nums text-ink">
              {s.values.reduce((a, b) => a + b, 0)}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}

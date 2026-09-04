import { EditorialShapeGlyph } from "@/components/ui/EditorialArt";
import type { PlacedShape } from "@/lib/editorial-art";
import { ART_COLORS, starGeometry } from "@/lib/miro-primitives";

const SHAPES: PlacedShape[] = [
  { id: "wedge", x: 164, y: 82, size: 78, rotation: -13, tone: "form" },
  { id: "seed", x: 275, y: 86, size: 78, rotation: 11, tone: "counterweight" },
  { id: "orbit", x: 370, y: 86, size: 92, rotation: -4, tone: "form" },
];

const TRAIL = [
  { cx: 45, cy: 108, r: 4 },
  { cx: 66, cy: 103, r: 5.5 },
  { cx: 91, cy: 99, r: 7 },
];

/**
 * Halk, tisztán szerkesztői konstelláció a tesztindító lépései alatt.
 * Nem használ mérési formákat vagy mintaeredményt, ezért nem ígér előre
 * személyiségtípust; csak a Trita formanyelvét viszi tovább.
 *
 * A `components/ui/` alatt él, az EditorialArt mellett — nem a
 * `components/assessment/` védett modulban: tisztán dekoráció, nincs benne
 * felmérési logika, ezért nem tartozik a minőségi kapu integrációs-teszt
 * kötelezettsége alá (scripts/quality-gate-check.mjs).
 */
export function AssessmentIntroArt() {
  const palette = ART_COLORS;
  const star = starGeometry(227, 33, 16);

  return (
    <div
      aria-hidden="true"
      data-assessment-intro-art
      className="mt-1 h-[140px] w-full overflow-hidden lg:h-[150px]"
    >
      <svg
        viewBox="0 0 430 150"
        preserveAspectRatio="xMidYMid meet"
        className="block h-full w-full"
        focusable="false"
      >
        <path
          d="M16 118 C79 103 109 112 155 91 C205 68 239 72 281 89 C327 108 364 92 419 59"
          fill="none"
          stroke={palette.line}
          strokeWidth="2.2"
          strokeLinecap="round"
          opacity="0.72"
        />

        {TRAIL.map((dot) => (
          <circle
            key={`${dot.cx}-${dot.cy}`}
            cx={dot.cx}
            cy={dot.cy}
            r={dot.r}
            fill={palette.sun}
            opacity="0.9"
          />
        ))}

        {SHAPES.map((shape) => (
          <EditorialShapeGlyph
            key={shape.id}
            shape={shape}
            p={palette}
            strokeWidth={2.2}
          />
        ))}

        <circle
          cx="164"
          cy="89"
          r="9"
          fill="var(--color-surface-canvas)"
        />
        <circle cx="383" cy="30" r="9" fill={palette.sun} />

        <g stroke={palette.line} strokeWidth="1.8" strokeLinecap="round" opacity="0.9">
          {star.lines.map((line) => (
            <line
              key={`${line.x1}-${line.y1}-${line.x2}-${line.y2}`}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

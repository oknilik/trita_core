// Generatív cikk-vizuál — determinisztikus SVG a cikk szemantikai adatai és
// a választott seed alapján.
//
// 2026-08-22 — négy párhuzamos kézírás ugyanazon szerkesztői rendszeren:
// relációs kollázs, konstelláció, lágy Bauhaus és élő vonal. A `concept`
// mondja meg, miről szól a kompozíció; a `family`, hogyan rajzoljuk meg;
// a `lineMode`, mennyi tintavonal maradjon benne. A régi
// radar/háló/sávok/hullám motívumok csak explicit régi frontmatter esetén
// futnak, hogy a korábbi kézi választások vizuálisan stabilak maradjanak.
//
// A hat JELENTŐ alapforma (type-glyph.ts) itt szándékosan nem szerepel —
// azok csak valódi mérési eredmény mellett rajzolhatók. Ld. a szintbesorolást
// a miro-primitives.ts fejlécében.
//
// Weben a szín CSS-varból jön (ui-hex-guardrail); OG/hírlevél rendernél a
// hívó ugyanennek a palettának a feloldott tokenjeit adja át.

import {
  ART_COLORS,
  ART_COLORS_ON_INVERSE,
  accompanimentLayout,
  groundPath,
  hashString,
  mulberry32,
  r2,
  starGeometry,
  type ArtPalette,
  type ArtScale,
} from "@/lib/miro-primitives";
import {
  resolveBlogArt,
  type BlogArtConcept,
  type BlogArtFamily,
  type BlogArtLineMode,
  type LegacyBlogArtMotif,
} from "@/lib/blog-art";
import {
  EDITORIAL_SHAPES,
  EDITORIAL_SHAPE_ORDER,
  type EditorialShapeId,
} from "@/lib/editorial-art";

type Motif = LegacyBlogArtMotif;

const VIEWBOX: Record<ArtScale, { w: number; h: number }> = {
  hero: { w: 420, h: 260 },
  card: { w: 400, h: 120 },
  compact: { w: 100, h: 100 },
};

/** A tárgy sugara és a vonalvastagság méret-módonként. */
function metrics(scale: ArtScale, w: number, h: number) {
  const unit = Math.min(w, h * 1.9) / 400;
  const strokeWidth = Math.max(scale === "compact" ? 1.8 : 2.6, 4.2 * unit);
  const radius =
    scale === "compact"
      ? Math.min(w, h) * 0.3
      : // A hero tárgya kisebb: a panelt mobilon `slice` nagyítja (a 420×260
        // vászon egy ~358×270-es dobozba kerül), tehát ott minden elem
        // ~4%-kal nagyobbnak látszik, miközben kevesebb hely van.
        Math.min(h * (scale === "hero" ? 0.2 : 0.3), w * (scale === "hero" ? 0.13 : 0.15));
  return { strokeWidth, radius };
}

// ── A tárgy: a cikk témája, tinta-kézírással ──────────────────────────

function RadarSubject({
  seed, cx, cy, R, sw, p,
}: { seed: number; cx: number; cy: number; R: number; sw: number; p: ArtPalette }) {
  const rnd = mulberry32(seed);
  const points: Array<[number, number]> = [];
  for (let i = 0; i < 6; i += 1) {
    const angle = (Math.PI * 2 * i) / 6 - Math.PI / 2;
    const r = R * (0.5 + rnd() * 0.55);
    points.push([r2(cx + Math.cos(angle) * r), r2(cy + Math.sin(angle) * r)]);
  }
  return (
    <g>
      <circle
        cx={r2(cx)} cy={r2(cy)} r={r2(R * 1.02)}
        fill="none" stroke={p.line} strokeWidth={r2(sw * 0.55)} opacity={0.55}
      />
      <polygon points={points.map(([x, y]) => `${x},${y}`).join(" ")} fill={p.form} fillOpacity={0.92} />
      {points.map(([x, y], i) =>
        i % 2 === 0 ? <circle key={`${x}-${y}`} cx={x} cy={y} r={r2(sw * 0.85)} fill={p.line} /> : null,
      )}
    </g>
  );
}

function NetworkSubject({
  seed, cx, cy, R, sw, p,
}: { seed: number; cx: number; cy: number; R: number; sw: number; p: ArtPalette }) {
  const rnd = mulberry32(seed);
  const count = 4;
  const nodes = Array.from({ length: count }, (_, i) => ({
    x: r2(cx - R * 1.15 + ((R * 2.3) / (count - 1)) * i),
    y: r2(cy + (rnd() - 0.5) * R * 1.1),
    r: r2(R * (0.22 + rnd() * 0.36)),
  }));
  return (
    <g>
      {nodes.slice(1).map((node, i) => (
        <line
          key={`edge-${node.x}-${node.y}`}
          x1={nodes[i].x} y1={nodes[i].y} x2={node.x} y2={node.y}
          stroke={p.line} strokeWidth={r2(sw * 0.7)} strokeLinecap="round" opacity={0.85}
        />
      ))}
      {nodes.map((node, i) =>
        i === 1 ? (
          <circle
            key={`node-${node.x}`} cx={node.x} cy={node.y} r={node.r}
            fill="none" stroke={p.line} strokeWidth={r2(sw)}
          />
        ) : (
          <circle
            key={`node-${node.x}`} cx={node.x} cy={node.y} r={node.r}
            fill={i % 2 ? p.counterweight : p.form}
          />
        ),
      )}
    </g>
  );
}

function BarsSubject({
  seed, cx, cy, R, sw, p,
}: { seed: number; cx: number; cy: number; R: number; sw: number; p: ArtPalette }) {
  const rnd = mulberry32(seed);
  const count = 5;
  const barWidth = R * 0.3;
  const gap = R * 0.24;
  const x0 = cx - (count * barWidth + (count - 1) * gap) / 2;
  const base = cy + R * 0.95;
  return (
    <g>
      <line
        x1={r2(x0 - R * 0.3)} y1={r2(base)} x2={r2(x0 + count * (barWidth + gap))} y2={r2(base)}
        stroke={p.line} strokeWidth={r2(sw * 0.7)} strokeLinecap="round" opacity={0.9}
      />
      {Array.from({ length: count }, (_, i) => {
        const h = R * (0.45 + rnd() * 1.25);
        const x = x0 + i * (barWidth + gap);
        // A kiugró érték kontúrossá válik — a magnitúdó formában is látszik,
        // nem csak méretben.
        const outlined = h > R * 1.2;
        return (
          <rect
            key={`bar-${i}`}
            x={r2(x)} y={r2(base - h)} width={r2(barWidth)} height={r2(h)} rx={r2(barWidth / 2)}
            fill={outlined ? "none" : i % 3 === 1 ? p.counterweight : p.form}
            stroke={outlined ? p.line : undefined}
            strokeWidth={outlined ? r2(sw) : undefined}
          />
        );
      })}
    </g>
  );
}

function WavesSubject({
  seed, w, cx, cy, R, sw, p,
}: { seed: number; w: number; cx: number; cy: number; R: number; sw: number; p: ArtPalette }) {
  const rnd = mulberry32(seed);
  const wave = (baseY: number, amp: number) => {
    let d = `M ${r2(-4)} ${r2(baseY)}`;
    for (let x = 0; x <= w + 40; x += w / 3) {
      d += ` S ${r2(x + w / 6)} ${r2(baseY + (rnd() - 0.5) * amp * 2)}, ${r2(x + w / 3)} ${r2(baseY + (rnd() - 0.5) * amp)}`;
    }
    return d;
  };
  return (
    <g>
      <path d={wave(cy - R * 0.4, R * 0.78)} fill="none" stroke={p.line} strokeWidth={r2(sw * 0.85)} strokeLinecap="round" />
      <path d={wave(cy + R * 0.5, R * 0.62)} fill="none" stroke={p.form} strokeWidth={r2(sw * 2.1)} strokeLinecap="round" />
      <circle cx={r2(cx + R * 0.5)} cy={r2(cy - R * 0.15)} r={r2(R * 0.16)} fill={p.counterweight} />
    </g>
  );
}

// ── Új, többcsaládos szerkesztői rendszer ────────────────────────────

interface ArtZone {
  x: number;
  y: number;
  w: number;
  h: number;
}

type ConceptSlot = readonly [x: number, y: number, size: number];

const CONCEPT_SLOTS: Record<BlogArtConcept, readonly ConceptSlot[]> = {
  connection: [
    [0.16, 0.6, 0.28],
    [0.5, 0.38, 0.46],
    [0.84, 0.58, 0.3],
  ],
  balance: [
    [0.22, 0.43, 0.42],
    [0.78, 0.43, 0.42],
    [0.5, 0.72, 0.2],
  ],
  tension: [
    [0.12, 0.52, 0.48],
    [0.88, 0.34, 0.5],
    [0.52, 0.7, 0.2],
  ],
  threshold: [
    [0.18, 0.58, 0.46],
    [0.82, 0.58, 0.46],
    [0.5, 0.24, 0.22],
  ],
  signal: [
    [0.16, 0.72, 0.18],
    [0.38, 0.57, 0.28],
    [0.78, 0.34, 0.5],
  ],
  growth: [
    [0.14, 0.76, 0.18],
    [0.43, 0.58, 0.3],
    [0.79, 0.3, 0.5],
  ],
};

function artZone(scale: ArtScale, w: number, h: number): ArtZone {
  if (scale === "compact") return { x: 9, y: 9, w: w - 18, h: h - 18 };
  // A featured-kártyán a kép felső-jobb sávban marad: alatta szabad szövegmező
  // kell a tetszőleges hosszúságú heroQuote-nak.
  if (scale === "hero") return { x: w * 0.5, y: h * 0.035, w: w * 0.43, h: h * 0.36 };
  return { x: w * 0.16, y: h * 0.13, w: w * 0.7, h: h * 0.64 };
}

function conceptSpine(concept: BlogArtConcept, z: ArtZone, seed: number): string {
  const rnd = mulberry32(seed);
  const jx = (rnd() - 0.5) * z.w * 0.05;
  const jy = (rnd() - 0.5) * z.h * 0.1;
  const x = (n: number) => r2(z.x + z.w * n + jx);
  const y = (n: number) => r2(z.y + z.h * n + jy);

  switch (concept) {
    case "connection":
      return `M ${x(0.03)} ${y(0.68)} C ${x(0.27)} ${y(0.12)}, ${x(0.62)} ${y(0.9)}, ${x(0.97)} ${y(0.35)}`;
    case "balance":
      return `M ${x(0.04)} ${y(0.58)} Q ${x(0.5)} ${y(0.4)}, ${x(0.96)} ${y(0.58)}`;
    case "tension":
      return `M ${x(0.02)} ${y(0.78)} C ${x(0.3)} ${y(0.02)}, ${x(0.68)} ${y(0.98)}, ${x(0.98)} ${y(0.18)}`;
    case "threshold":
      return `M ${x(0.03)} ${y(0.66)} C ${x(0.34)} ${y(0.66)}, ${x(0.34)} ${y(0.22)}, ${x(0.5)} ${y(0.22)} S ${x(0.66)} ${y(0.66)}, ${x(0.97)} ${y(0.66)}`;
    case "signal":
      return `M ${x(0.02)} ${y(0.78)} C ${x(0.28)} ${y(0.78)}, ${x(0.5)} ${y(0.32)}, ${x(0.98)} ${y(0.32)}`;
    case "growth":
      return `M ${x(0.03)} ${y(0.84)} C ${x(0.34)} ${y(0.8)}, ${x(0.56)} ${y(0.5)}, ${x(0.97)} ${y(0.08)}`;
  }
}

/** Az élő-vonal család saját, hurkokat és keresztezéseket is használó gerince. */
function flowPath(concept: BlogArtConcept, z: ArtZone, seed: number): string {
  const rnd = mulberry32(seed);
  const dx = (rnd() - 0.5) * z.w * 0.035;
  const dy = (rnd() - 0.5) * z.h * 0.08;
  const x = (n: number) => r2(z.x + z.w * n + dx);
  const y = (n: number) => r2(z.y + z.h * n + dy);

  switch (concept) {
    case "connection":
      return `M ${x(0.01)} ${y(0.66)} C ${x(0.18)} ${y(0.04)}, ${x(0.36)} ${y(0.04)}, ${x(0.37)} ${y(0.5)} C ${x(0.38)} ${y(0.92)}, ${x(0.24)} ${y(0.92)}, ${x(0.28)} ${y(0.56)} C ${x(0.33)} ${y(0.18)}, ${x(0.55)} ${y(0.2)}, ${x(0.57)} ${y(0.58)} C ${x(0.6)} ${y(0.94)}, ${x(0.5)} ${y(0.94)}, ${x(0.57)} ${y(0.52)} C ${x(0.66)} ${y(0.02)}, ${x(0.82)} ${y(0.18)}, ${x(0.99)} ${y(0.34)}`;
    case "balance":
      return `M ${x(0.01)} ${y(0.58)} C ${x(0.22)} ${y(0.18)}, ${x(0.34)} ${y(0.18)}, ${x(0.42)} ${y(0.52)} C ${x(0.5)} ${y(0.86)}, ${x(0.62)} ${y(0.86)}, ${x(0.67)} ${y(0.5)} C ${x(0.72)} ${y(0.16)}, ${x(0.86)} ${y(0.22)}, ${x(0.99)} ${y(0.54)}`;
    case "tension":
      return `M ${x(0.01)} ${y(0.78)} C ${x(0.24)} ${y(0.02)}, ${x(0.46)} ${y(0.02)}, ${x(0.53)} ${y(0.5)} C ${x(0.6)} ${y(0.96)}, ${x(0.34)} ${y(0.96)}, ${x(0.42)} ${y(0.5)} C ${x(0.51)} ${y(0.04)}, ${x(0.76)} ${y(0.08)}, ${x(0.99)} ${y(0.2)}`;
    case "threshold":
      return `M ${x(0.01)} ${y(0.68)} C ${x(0.3)} ${y(0.68)}, ${x(0.34)} ${y(0.18)}, ${x(0.5)} ${y(0.18)} C ${x(0.67)} ${y(0.18)}, ${x(0.67)} ${y(0.82)}, ${x(0.5)} ${y(0.82)} C ${x(0.36)} ${y(0.82)}, ${x(0.39)} ${y(0.45)}, ${x(0.55)} ${y(0.48)} C ${x(0.72)} ${y(0.52)}, ${x(0.77)} ${y(0.66)}, ${x(0.99)} ${y(0.66)}`;
    case "signal":
      return `M ${x(0.01)} ${y(0.76)} C ${x(0.12)} ${y(0.76)}, ${x(0.12)} ${y(0.54)}, ${x(0.2)} ${y(0.54)} C ${x(0.28)} ${y(0.54)}, ${x(0.25)} ${y(0.28)}, ${x(0.36)} ${y(0.28)} C ${x(0.48)} ${y(0.28)}, ${x(0.44)} ${y(0.62)}, ${x(0.58)} ${y(0.62)} C ${x(0.72)} ${y(0.62)}, ${x(0.76)} ${y(0.3)}, ${x(0.99)} ${y(0.3)}`;
    case "growth":
      return `M ${x(0.01)} ${y(0.84)} C ${x(0.28)} ${y(0.82)}, ${x(0.46)} ${y(0.62)}, ${x(0.58)} ${y(0.46)} C ${x(0.7)} ${y(0.28)}, ${x(0.58)} ${y(0.08)}, ${x(0.7)} ${y(0.08)} C ${x(0.82)} ${y(0.08)}, ${x(0.85)} ${y(0.2)}, ${x(0.99)} ${y(0.03)}`;
  }
}

function EditorialMark({
  id,
  x,
  y,
  size,
  rotation,
  tone,
  p,
  strokeWidth,
}: {
  id: EditorialShapeId;
  x: number;
  y: number;
  size: number;
  rotation: number;
  tone: "form" | "counterweight";
  p: ArtPalette;
  strokeWidth: number;
}) {
  const def = EDITORIAL_SHAPES[id];
  const fill = tone === "counterweight" ? p.counterweight : p.form;
  const k = size / 100;
  const localStroke = r2(strokeWidth / Math.max(k, 0.01));
  return (
    <g transform={`translate(${r2(x)},${r2(y)}) rotate(${r2(rotation)}) scale(${r2(k)})`}>
      {def.kind === "fill" && <path d={def.path} fill={fill} />}
      {def.kind === "line" && def.paths.map((d) => (
        <path
          key={d}
          d={d}
          fill="none"
          stroke={p.line}
          strokeWidth={localStroke}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      {def.kind === "dots" && def.dots.map((dot) => (
        <circle key={`${dot.cx}-${dot.cy}`} cx={dot.cx} cy={dot.cy} r={dot.r} fill={fill} />
      ))}
    </g>
  );
}

function ConstellationSubject({
  seed,
  concept,
  scale,
  w,
  h,
  sw,
  p,
  lineMode,
}: {
  seed: number;
  concept: BlogArtConcept;
  scale: ArtScale;
  w: number;
  h: number;
  sw: number;
  p: ArtPalette;
  lineMode: BlogArtLineMode;
}) {
  const z = artZone(scale, w, h);
  const rnd = mulberry32(seed);
  const slots = CONCEPT_SLOTS[concept];
  const count = scale === "compact" ? 1 : 3;
  const base = Math.min(z.h, z.w * 0.34);
  const shapePool = lineMode === "expressive"
    ? EDITORIAL_SHAPE_ORDER
    : EDITORIAL_SHAPE_ORDER.filter((id) => EDITORIAL_SHAPES[id].kind !== "line");

  return (
    <g>
      {scale !== "compact" && lineMode !== "none" && (
        <path
          d={conceptSpine(concept, z, seed + 19)}
          fill="none"
          stroke={p.line}
          strokeWidth={r2(sw * 0.64)}
          strokeLinecap="round"
          opacity={0.76}
        />
      )}
      {Array.from({ length: count }, (_, index) => {
        const slot = slots[index];
        const shapeIndex = (hashString(`${seed}:${concept}:shape:${index}`) >>> 3)
          % shapePool.length;
        const id = shapePool[shapeIndex];
        const size = scale === "compact"
          ? base * 0.82
          : base * (0.46 + slot[2] + rnd() * 0.14);
        return (
          <g key={`${id}-${index}`}>
            {EditorialMark({
              id,
              x: z.x + z.w * slot[0] + (rnd() - 0.5) * z.w * 0.035,
              y: z.y + z.h * slot[1] + (rnd() - 0.5) * z.h * 0.06,
              size,
              rotation: (rnd() - 0.5) * 34,
              tone: index === 1 ? "counterweight" : "form",
              p,
              strokeWidth: sw,
            })}
          </g>
        );
      })}
    </g>
  );
}

function ModularSubject({
  seed,
  concept,
  scale,
  w,
  h,
  sw,
  p,
  lineMode,
}: {
  seed: number;
  concept: BlogArtConcept;
  scale: ArtScale;
  w: number;
  h: number;
  sw: number;
  p: ArtPalette;
  lineMode: BlogArtLineMode;
}) {
  const z = artZone(scale, w, h);
  const rnd = mulberry32(seed);
  const j = (amount: number) => (rnd() - 0.5) * amount;
  const x = (n: number) => r2(z.x + z.w * n + j(z.w * 0.025));
  const y = (n: number) => r2(z.y + z.h * n + j(z.h * 0.035));
  const lineWidth = r2(sw * (scale === "compact" ? 0.8 : 0.7));
  const showLine = lineMode !== "none";

  if (scale === "compact") {
    return (
      <g>
        <path
          d={`M ${x(0.14)} ${y(0.75)} L ${x(0.5)} ${y(0.16)} L ${x(0.82)} ${y(0.75)} Z`}
          fill={p.form}
        />
        {showLine && (
          <path
            d={`M ${x(0.14)} ${y(0.83)} H ${x(0.9)}`}
            fill="none" stroke={p.line} strokeWidth={lineWidth} strokeLinecap="round"
          />
        )}
      </g>
    );
  }

  switch (concept) {
    case "connection":
      return (
        <g>
          <path d={`M ${x(0.06)} ${y(0.8)} Q ${x(0.08)} ${y(0.2)} ${x(0.35)} ${y(0.22)} L ${x(0.35)} ${y(0.8)} Z`} fill={p.form} />
          <path d={`M ${x(0.68)} ${y(0.18)} L ${x(0.96)} ${y(0.18)} L ${x(0.96)} ${y(0.78)} Q ${x(0.7)} ${y(0.76)} ${x(0.68)} ${y(0.18)} Z`} fill={p.counterweight} />
          {showLine && <path d={`M ${x(0.25)} ${y(0.58)} C ${x(0.45)} ${y(0.28)}, ${x(0.58)} ${y(0.78)}, ${x(0.78)} ${y(0.46)}`} fill="none" stroke={p.line} strokeWidth={lineWidth} strokeLinecap="round" />}
        </g>
      );
    case "balance":
      return (
        <g>
          {showLine && <path d={`M ${x(0.08)} ${y(0.64)} H ${x(0.92)}`} fill="none" stroke={p.line} strokeWidth={r2(sw)} strokeLinecap="round" />}
          <path d={`M ${x(0.12)} ${y(0.62)} A ${r2(z.h * 0.3)} ${r2(z.h * 0.3)} 0 0 1 ${x(0.42)} ${y(0.62)} Z`} fill={p.form} />
          <path d={`M ${x(0.6)} ${y(0.62)} A ${r2(z.h * 0.22)} ${r2(z.h * 0.22)} 0 0 1 ${x(0.86)} ${y(0.62)} Z`} fill={p.counterweight} />
          <circle cx={x(0.51)} cy={y(0.35)} r={r2(z.h * 0.11)} fill={p.sun} />
        </g>
      );
    case "tension":
      return (
        <g>
          <path d={`M ${x(0.02)} ${y(0.08)} H ${x(0.34)} Q ${x(0.38)} ${y(0.5)} ${x(0.1)} ${y(0.92)} H ${x(0.02)} Z`} fill={p.form} />
          <path d={`M ${x(0.98)} ${y(0.02)} V ${y(0.92)} H ${x(0.72)} Q ${x(0.58)} ${y(0.46)} ${x(0.98)} ${y(0.02)} Z`} fill={p.counterweight} />
          {showLine && <path d={`M ${x(0.24)} ${y(0.82)} L ${x(0.82)} ${y(0.2)}`} fill="none" stroke={p.line} strokeWidth={r2(sw * 1.05)} strokeLinecap="round" />}
        </g>
      );
    case "threshold":
      return (
        <g>
          <path d={`M ${x(0.03)} ${y(0.03)} H ${x(0.28)} V ${y(0.35)} Q ${x(0.39)} ${y(0.5)} ${x(0.28)} ${y(0.65)} V ${y(0.97)} H ${x(0.03)} Z`} fill={p.form} />
          <path d={`M ${x(0.97)} ${y(0.03)} H ${x(0.72)} V ${y(0.35)} Q ${x(0.61)} ${y(0.5)} ${x(0.72)} ${y(0.65)} V ${y(0.97)} H ${x(0.97)} Z`} fill={p.counterweight} />
          {showLine && <path d={`M ${x(0.18)} ${y(0.64)} C ${x(0.4)} ${y(0.64)}, ${x(0.44)} ${y(0.28)}, ${x(0.52)} ${y(0.28)} S ${x(0.62)} ${y(0.64)}, ${x(0.84)} ${y(0.64)}`} fill="none" stroke={p.line} strokeWidth={lineWidth} strokeLinecap="round" />}
        </g>
      );
    case "signal":
      return (
        <g>
          {showLine && [0.2, 0.34, 0.48, 0.62].map((n, index) => (
            <path key={n} d={`M ${x(0.06)} ${y(n)} H ${x(0.38 + index * 0.08)}`} fill="none" stroke={p.line} strokeWidth={lineWidth} strokeLinecap="round" />
          ))}
          <path d={`M ${x(0.56)} ${y(0.78)} L ${x(0.56)} ${y(0.5)} L ${x(0.68)} ${y(0.5)} L ${x(0.68)} ${y(0.34)} L ${x(0.8)} ${y(0.34)} L ${x(0.8)} ${y(0.18)} L ${x(0.94)} ${y(0.18)} L ${x(0.94)} ${y(0.78)} Z`} fill={p.counterweight} />
          <circle cx={x(0.49)} cy={y(0.25)} r={r2(z.h * 0.12)} fill={p.sun} />
        </g>
      );
    case "growth":
      return (
        <g>
          <path d={`M ${x(0.08)} ${y(0.84)} H ${x(0.28)} V ${y(0.68)} H ${x(0.45)} V ${y(0.5)} H ${x(0.62)} V ${y(0.3)} H ${x(0.82)} V ${y(0.12)} H ${x(0.96)} V ${y(0.84)} Z`} fill={p.counterweight} />
          {showLine && <path d={`M ${x(0.08)} ${y(0.82)} C ${x(0.34)} ${y(0.76)}, ${x(0.58)} ${y(0.44)}, ${x(0.9)} ${y(0.1)}`} fill="none" stroke={p.line} strokeWidth={lineWidth} strokeLinecap="round" />}
          <circle cx={x(0.18)} cy={y(0.54)} r={r2(z.h * 0.15)} fill={p.form} />
        </g>
      );
  }
}

function FlowSubject({
  seed,
  concept,
  scale,
  w,
  h,
  sw,
  p,
  lineMode,
}: {
  seed: number;
  concept: BlogArtConcept;
  scale: ArtScale;
  w: number;
  h: number;
  sw: number;
  p: ArtPalette;
  lineMode: BlogArtLineMode;
}) {
  const z = artZone(scale, w, h);
  const rnd = mulberry32(seed);
  const slots = CONCEPT_SLOTS[concept];
  const markerShapes: readonly EditorialShapeId[] = ["blob", "crescent", "wedge"];
  const lineWidth = r2(sw * (scale === "compact" ? 0.72 : 0.66));

  return (
    <g>
      {lineMode !== "none" && (
        <path
          d={flowPath(concept, z, seed + 71)}
          fill="none"
          stroke={p.line}
          strokeWidth={lineWidth}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
      {lineMode === "expressive" && scale !== "compact" && (
        <path
          d={flowPath(concept, { ...z, y: z.y + z.h * 0.08 }, seed + 137)}
          fill="none"
          stroke={p.form}
          strokeWidth={r2(lineWidth * 0.54)}
          strokeLinecap="round"
          opacity={0.56}
        />
      )}
      {scale === "compact" ? (
        <circle cx={r2(z.x + z.w * 0.72)} cy={r2(z.y + z.h * 0.35)} r={r2(z.h * 0.12)} fill={p.form} />
      ) : (
        slots.slice(0, 3).map((slot, index) => {
          const cx = z.x + z.w * slot[0] + (rnd() - 0.5) * z.w * 0.03;
          const cy = z.y + z.h * slot[1] + (rnd() - 0.5) * z.h * 0.05;
          if (index === 2) {
            return (
              <circle
                key="flow-dot"
                cx={r2(cx)} cy={r2(cy)} r={r2(Math.max(3.5, z.h * 0.1))}
                fill={p.sun}
              />
            );
          }
          return (
            <g key={`flow-${index}`}>
              {EditorialMark({
                id: markerShapes[(hashString(`${seed}:flow:${index}`) >>> 2) % markerShapes.length],
                x: cx,
                y: cy,
                size: Math.min(z.h, z.w * 0.3) * (0.42 + slot[2]),
                rotation: (rnd() - 0.5) * 28,
                tone: index === 1 ? "counterweight" : "form",
                p,
                strokeWidth: sw,
              })}
            </g>
          );
        })
      )}
    </g>
  );
}

/**
 * Tömör, kivágott papírra emlékeztető jelenet. Alaphelyzetben egyáltalán
 * nincs összekötő vonala: a formák távolsága, átfedése és méretaránya mondja
 * el a fogalmat. Ez a negyedik irány oldja a vonalas családok túlsúlyát.
 */
function CollageSubject({
  seed,
  concept,
  scale,
  w,
  h,
  sw,
  p,
  lineMode,
}: {
  seed: number;
  concept: BlogArtConcept;
  scale: ArtScale;
  w: number;
  h: number;
  sw: number;
  p: ArtPalette;
  lineMode: BlogArtLineMode;
}) {
  const z = artZone(scale, w, h);
  const rnd = mulberry32(seed);
  const slots = CONCEPT_SLOTS[concept];
  const ids: readonly EditorialShapeId[] = ["blob", "crescent", "wedge", "lens", "trail"];
  const count = scale === "compact" ? 1 : 4;
  const base = Math.min(z.h, z.w * 0.34);
  const extraSlot: ConceptSlot = [0.55, concept === "growth" ? 0.68 : 0.52, 0.24];
  const collageSlots = [...slots, extraSlot];

  return (
    <g>
      {Array.from({ length: count }, (_, index) => {
        const slot = collageSlots[index];
        const id = ids[(hashString(`${seed}:collage:${concept}:${index}`) >>> 2) % ids.length];
        const size = scale === "compact"
          ? base * 0.9
          : base * (0.48 + slot[2] + rnd() * 0.2);
        const overlap = index === 3 ? -z.w * 0.055 : 0;
        return (
          <g key={`collage-${id}-${index}`}>
            {EditorialMark({
              id,
              x: z.x + z.w * slot[0] + overlap + (rnd() - 0.5) * z.w * 0.045,
              y: z.y + z.h * slot[1] + (rnd() - 0.5) * z.h * 0.075,
              size,
              rotation: (rnd() - 0.5) * 42,
              tone: index % 3 === 1 ? "counterweight" : "form",
              p,
              strokeWidth: sw,
            })}
          </g>
        );
      })}
      {lineMode === "expressive" && scale !== "compact" && (
        <path
          d={conceptSpine(concept, z, seed + 211)}
          fill="none"
          stroke={p.line}
          strokeWidth={r2(sw * 0.42)}
          strokeLinecap="round"
          opacity={0.5}
        />
      )}
    </g>
  );
}

export type BlogArtMotif = Motif;

export function BlogArtVisual({
  slug,
  title,
  tags = [],
  variant = "card",
  seed = 0,
  motif: motifOverride,
  family,
  concept,
  lineMode,
  palette,
  background,
  className,
}: {
  slug: string;
  title?: string;
  tags?: string[];
  /** featured: sötét sage háttéren · card/mini: világos (warm/sage-soft) háttéren */
  variant?: "featured" | "card" | "mini";
  /** Variáció-seed (frontmatter artSeed). */
  seed?: number;
  /** Régi motívum-felülbírálás — kizárólag visszafelé kompatibilitáshoz. */
  motif?: Motif;
  family?: BlogArtFamily;
  concept?: BlogArtConcept;
  /** Vonalhasználat: új képeknél alapértelmezetten kevés. */
  lineMode?: BlogArtLineMode;
  /** Fix paletta szerveroldali raszterhez (OG/hírlevél); weben CSS-tokenes. */
  palette?: ArtPalette;
  /** Fix háttér szerveroldali raszterhez; weben a szemantikus token dönt. */
  background?: string;
  className?: string;
}) {
  const resolved = resolveBlogArt({
    slug,
    title,
    tags,
    seed,
    family,
    concept,
    lineMode,
    motif: motifOverride,
  });
  // Régi explicit motívumnál bitre a korábbi seed-kulcsot tartjuk. Az új
  // rendszerben a család és a fogalom is része a kulcsnak: ugyanaz a seed
  // másik családban szándékosan más kompozíció.
  const seededKey = resolved.legacyMotif
    ? seed ? `${slug}#${seed}` : slug
    : `${slug}#${resolved.seed}:${resolved.family}:${resolved.concept}`;
  // SEEDET adunk át, nem generátort — ld. mulberry32() a miro-primitives-ben.
  const artSeed = hashString(seededKey);

  const scale: ArtScale = variant === "featured" ? "hero" : variant === "mini" ? "compact" : "card";
  const { w, h } = VIEWBOX[scale];
  const { strokeWidth, radius } = metrics(scale, w, h);
  // A kiemelt panel MINDKÉT színsémán sötét (fehér idézet ül rajta), ezért
  // ott a fix ink olvashatatlan lenne — külön készlet kell.
  const p: ArtPalette = palette ?? (variant === "featured" ? ART_COLORS_ON_INVERSE : ART_COLORS);

  const cx = w * (scale === "compact" ? 0.5 : scale === "hero" ? 0.66 : 0.54);
  const cy = h * (scale === "compact" ? 0.5 : scale === "hero" ? 0.28 : 0.44);
  const parts = accompanimentLayout(artSeed, w, h, radius, scale);

  const bg = background ?? (
    variant === "featured"
      // A kiemelt vizuál SZÁNDÉKOSAN sötét alap (fehér felirat ül rajta),
      // ezért a réteg-hero tokenekből dolgozik: azok mindkét színsémán
      // sötétek. A sage-deep/-dark sötét sémán VILÁGOSSÁ fordul, ott a
      // fehér idézet olvashatatlan lett volna (UX-audit 2026-08-07).
      ? "linear-gradient(135deg, var(--color-layer-self-hero-from), var(--color-layer-self-hero-to))"
      : hashString(seededKey) % 2 === 0
        ? "var(--color-surface-muted)"
        : "var(--color-surface-self-accent-soft)"
  );

  // A gradiens-id-nek dokumentumon belül egyedinek ÉS szerver/kliens
  // azonosnak kell lennie — ezért a magból képezzük, nem futásidejű
  // számlálóból (a useId() nem opció: ez szerver-komponensként is renderel).
  const scrimSideId = `art-scrim-x-${artSeed.toString(36)}`;
  const scrimBottomId = `art-scrim-y-${artSeed.toString(36)}`;

  const subjectSeed = artSeed + 101;
  // Satori az SVG-n belüli komponenseket nem oldja fel, hanem szó szerint
  // szerializálná őket az OG-kép data URL-jébe. Ezért a tiszta renderer-
  // függvényeket itt közvetlenül futtatjuk, és már csak natív SVG-elemeket
  // adunk a fához. A böngészős és a raszteres kimenet így ugyanaz.
  const subject = resolved.legacyMotif
    ? resolved.legacyMotif === "radar"
      ? RadarSubject({ seed: subjectSeed, cx, cy, R: radius, sw: strokeWidth, p })
      : resolved.legacyMotif === "network"
        ? NetworkSubject({ seed: subjectSeed, cx, cy, R: radius, sw: strokeWidth, p })
        : resolved.legacyMotif === "bars"
          ? BarsSubject({ seed: subjectSeed, cx, cy, R: radius, sw: strokeWidth, p })
          : WavesSubject({ seed: subjectSeed, w, cx, cy, R: radius, sw: strokeWidth, p })
    : resolved.family === "collage"
      ? CollageSubject({ seed: subjectSeed, concept: resolved.concept, scale, w, h, sw: strokeWidth, p, lineMode: resolved.lineMode })
      : resolved.family === "constellation"
        ? ConstellationSubject({ seed: subjectSeed, concept: resolved.concept, scale, w, h, sw: strokeWidth, p, lineMode: resolved.lineMode })
      : resolved.family === "modular"
        ? ModularSubject({ seed: subjectSeed, concept: resolved.concept, scale, w, h, sw: strokeWidth, p, lineMode: resolved.lineMode })
        : FlowSubject({ seed: subjectSeed, concept: resolved.concept, scale, w, h, sw: strokeWidth, p, lineMode: resolved.lineMode });

  const subjectHasGroundGesture = resolved.legacyMotif === "waves" || (!resolved.legacyMotif && resolved.family === "flow");

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ background: bg, display: "block", width: "100%", height: "100%" }}
      aria-hidden
    >
      {/* Színpad — a formanyelv kísérete. Kis méreten (mini) elmarad: 72
          pixelen a csillag, a nap és a talajvonal masszává olvad, és a
          tárgy sem marad felismerhető. */}
      {parts && (
        <g>
          <circle cx={parts.sun.x} cy={parts.sun.y} r={parts.sun.r} fill={p.sun} />
          {resolved.lineMode === "expressive" && (
            <g stroke={p.line} strokeWidth={r2(strokeWidth * 0.7)} strokeLinecap="round" opacity={0.9}>
              {starGeometry(parts.star.x, parts.star.y, parts.star.r).lines.map((l) => (
                <line key={`${l.x1}-${l.y1}-${l.x2}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
              ))}
            </g>
          )}
        </g>
      )}

      {subject}

      {parts && (
        <g>
          <circle
            cx={parts.counterweight.x} cy={parts.counterweight.y} r={parts.counterweight.r}
            fill={p.counterweight}
          />
          {/* A talajvonal két esetben elmarad:
              – hero: a panel alsó sávjában az idézet ül, a vonal átvágná;
              – hullám-motívum: ott a hullám MAGA a talaj-gesztus, egymás
                mellett három közel párhuzamos vonallá esne szét. */}
          {resolved.lineMode === "expressive" && scale !== "hero" && !subjectHasGroundGesture && (
            <path
              d={groundPath(artSeed + 7, w, parts.groundY, radius * 0.3)}
              fill="none" stroke={p.line} strokeWidth={r2(strokeWidth * 0.62)}
              strokeLinecap="round" opacity={0.85}
            />
          )}
        </g>
      )}

      {/* A kiemelt panel szabálya: az ábra FELSŐ SÁV, a szöveg alatta kap
          tiszta mezőt.
          Geometriával ez nem oldható meg. Az idézet hossza nem korlátozható
          (a `heroQuote` szabad szöveg), és mobilon öt sorra nyúlva a panel
          alsó kétharmadát elfoglalja — nincs olyan sarok, amit szabadon
          lehetne hagyni. Ezért a kompozíció felmegy a felső harmadba, alatta
          pedig egy erős, alulról induló fátyol ad egyenletes szövegmezőt.
          A fátyol a hero SAJÁT alapszínéből dolgozik, tehát a panel tónusa
          nem változik, csak elmélyül; a felső sávban a stop 0-ra fut, így az
          ábra ott sértetlen marad. */}
      {variant === "featured" && (
        <g>
          <defs>
            <linearGradient id={scrimSideId} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0" stopColor="var(--color-layer-self-hero-to)" stopOpacity="0.5" />
              <stop offset="0.55" stopColor="var(--color-layer-self-hero-to)" stopOpacity="0" />
            </linearGradient>
            <linearGradient id={scrimBottomId} x1="0" y1="1" x2="0" y2="0">
              <stop offset="0" stopColor="var(--color-layer-self-hero-to)" stopOpacity="0.94" />
              <stop offset="0.44" stopColor="var(--color-layer-self-hero-to)" stopOpacity="0.9" />
              <stop offset="0.74" stopColor="var(--color-layer-self-hero-to)" stopOpacity="0.24" />
              <stop offset="1" stopColor="var(--color-layer-self-hero-to)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <rect x="0" y="0" width={w} height={h} fill={`url(#${scrimSideId})`} />
          <rect x="0" y="0" width={w} height={h} fill={`url(#${scrimBottomId})`} />
        </g>
      )}
    </svg>
  );
}

// Generatív cikk-vizuál — determinisztikus SVG a slug + tagek alapján.
//
// 2026-08-09 — „színpad" kompozíció (a formanyelv 2. szintje). A kép TÁRGYA
// változatlanul a cikk témája (radar/háló/sávok/hullám), tehát a vizuál nem
// állít semmit, amit eddig ne állított volna. Ami változott, az a KÉZÍRÁS:
// tömör bronz felület a korábbi áttetsző kitöltés helyett, 3–5px tinta az
// 1,2px hajszálvonal helyett, és köré a formanyelv kísérete (csillag, nap,
// zsálya ellensúly, vándorló talajvonal).
//
// A hat JELENTŐ alapforma (type-glyph.ts) itt szándékosan nem szerepel —
// azok csak valódi mérési eredmény mellett rajzolhatók. Ld. a szintbesorolást
// a miro-primitives.ts fejlécében.
//
// Szín kizárólag CSS-varból (ui-hex-guardrail), így palettacserénél és
// színsémaváltásnál együtt mozog a felülettel.

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

type Motif = "radar" | "network" | "bars" | "waves";

// A motívum lehetőség szerint a témához igazodik, különben a slug dönt.
// (Változatlan a 2026-08-09 áttervezés előttihez képest — a frontmatter
// `artMotif` felülbírálás és az admin-előnézet erre épül.)
function pickMotif(slug: string, tags: string[]): Motif {
  const joined = tags.join(" ").toLowerCase();
  if (/dinamika|dynamics|csapatszerep|team role|mobilit|bizalom|trust/.test(joined)) return "network";
  if (/pszichometria|psychometrics|tritan|mbti|mérés|measurement/.test(joined)) return "radar";
  if (/fluktuáció|turnover|hr|toborzás|recruitment|megtartás|retention/.test(joined)) return "bars";
  if (/önértékelés|self|vezetés|leadership|biztonság|safety/.test(joined)) return "waves";
  const motifs: Motif[] = ["radar", "network", "bars", "waves"];
  return motifs[hashString(slug) % motifs.length];
}

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
      : Math.min(h * (scale === "hero" ? 0.24 : 0.3), w * 0.15);
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
    <>
      <circle
        cx={r2(cx)} cy={r2(cy)} r={r2(R * 1.02)}
        fill="none" stroke={p.line} strokeWidth={r2(sw * 0.55)} opacity={0.55}
      />
      <polygon points={points.map(([x, y]) => `${x},${y}`).join(" ")} fill={p.form} fillOpacity={0.92} />
      {points.map(([x, y], i) =>
        i % 2 === 0 ? <circle key={`${x}-${y}`} cx={x} cy={y} r={r2(sw * 0.85)} fill={p.line} /> : null,
      )}
    </>
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
    <>
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
    </>
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
    <>
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
    </>
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
    <>
      <path d={wave(cy - R * 0.4, R * 0.78)} fill="none" stroke={p.line} strokeWidth={r2(sw * 0.85)} strokeLinecap="round" />
      <path d={wave(cy + R * 0.5, R * 0.62)} fill="none" stroke={p.form} strokeWidth={r2(sw * 2.1)} strokeLinecap="round" />
      <circle cx={r2(cx + R * 0.5)} cy={r2(cy - R * 0.15)} r={r2(R * 0.16)} fill={p.counterweight} />
    </>
  );
}

export type BlogArtMotif = Motif;

export function BlogArtVisual({
  slug,
  tags = [],
  variant = "card",
  seed = 0,
  motif: motifOverride,
  className,
}: {
  slug: string;
  tags?: string[];
  /** featured: sötét sage háttéren · card/mini: világos (warm/sage-soft) háttéren */
  variant?: "featured" | "card" | "mini";
  /** Variáció-seed (frontmatter artSeed) — az admin „Új variáció" gombja lépteti. */
  seed?: number;
  /** Motívum-felülbírálás (frontmatter artMotif) — enélkül téma/slug szerint. */
  motif?: Motif;
  className?: string;
}) {
  const seededKey = seed ? `${slug}#${seed}` : slug;
  const motif = motifOverride ?? pickMotif(slug, tags);
  // SEEDET adunk át, nem generátort — ld. mulberry32() a miro-primitives-ben.
  const artSeed = hashString(seededKey);

  const scale: ArtScale = variant === "featured" ? "hero" : variant === "mini" ? "compact" : "card";
  const { w, h } = VIEWBOX[scale];
  const { strokeWidth, radius } = metrics(scale, w, h);
  // A kiemelt panel MINDKÉT színsémán sötét (fehér idézet ül rajta), ezért
  // ott a fix ink olvashatatlan lenne — külön készlet kell.
  const p: ArtPalette = variant === "featured" ? ART_COLORS_ON_INVERSE : ART_COLORS;

  const cx = w * (scale === "compact" ? 0.5 : scale === "hero" ? 0.62 : 0.54);
  const cy = h * (scale === "compact" ? 0.5 : scale === "hero" ? 0.36 : 0.44);
  const parts = accompanimentLayout(artSeed, w, h, radius, scale);

  const bg =
    variant === "featured"
      // A kiemelt vizuál SZÁNDÉKOSAN sötét alap (fehér felirat ül rajta),
      // ezért a réteg-hero tokenekből dolgozik: azok mindkét színsémán
      // sötétek. A sage-deep/-dark sötét sémán VILÁGOSSÁ fordul, ott a
      // fehér idézet olvashatatlan lett volna (UX-audit 2026-08-07).
      ? "linear-gradient(135deg, var(--color-layer-self-hero-from), var(--color-layer-self-hero-to))"
      : hashString(seededKey) % 2 === 0
        ? "var(--color-surface-muted)"
        : "var(--color-surface-self-accent-soft)";

  const subjectSeed = artSeed + 101;
  const subject =
    motif === "radar" ? <RadarSubject seed={subjectSeed} cx={cx} cy={cy} R={radius} sw={strokeWidth} p={p} />
    : motif === "network" ? <NetworkSubject seed={subjectSeed} cx={cx} cy={cy} R={radius} sw={strokeWidth} p={p} />
    : motif === "bars" ? <BarsSubject seed={subjectSeed} cx={cx} cy={cy} R={radius} sw={strokeWidth} p={p} />
    : <WavesSubject seed={subjectSeed} w={w} cx={cx} cy={cy} R={radius} sw={strokeWidth} p={p} />;

  return (
    <svg
      viewBox={`0 0 ${w} ${h}`}
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ background: bg, display: "block", width: "100%", height: "100%" }}
      role="img"
      aria-hidden
    >
      {/* Színpad — a formanyelv kísérete. Kis méreten (mini) elmarad: 72
          pixelen a csillag, a nap és a talajvonal masszává olvad, és a
          tárgy sem marad felismerhető. */}
      {parts && (
        <>
          <circle cx={parts.sun.x} cy={parts.sun.y} r={parts.sun.r} fill={p.sun} />
          <g stroke={p.line} strokeWidth={r2(strokeWidth * 0.7)} strokeLinecap="round" opacity={0.9}>
            {starGeometry(parts.star.x, parts.star.y, parts.star.r).lines.map((l) => (
              <line key={`${l.x1}-${l.y1}-${l.x2}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
            ))}
          </g>
        </>
      )}

      {subject}

      {parts && (
        <>
          <circle
            cx={parts.counterweight.x} cy={parts.counterweight.y} r={parts.counterweight.r}
            fill={p.counterweight}
          />
          {/* A talajvonal két esetben elmarad:
              – hero: a panel alsó sávjában az idézet ül, a vonal átvágná;
              – hullám-motívum: ott a hullám MAGA a talaj-gesztus, egymás
                mellett három közel párhuzamos vonallá esne szét. */}
          {scale !== "hero" && motif !== "waves" && (
            <path
              d={groundPath(artSeed + 7, w, parts.groundY, radius * 0.3)}
              fill="none" stroke={p.line} strokeWidth={r2(strokeWidth * 0.62)}
              strokeLinecap="round" opacity={0.85}
            />
          )}
        </>
      )}
    </svg>
  );
}

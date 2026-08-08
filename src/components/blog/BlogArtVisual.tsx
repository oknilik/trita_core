// Generatív cikk-vizuál — determinisztikus SVG a slug + tagek alapján.
// Nincs stock-fotó: minden cikk a termék vizuális nyelvén (radar, háló,
// eloszlás-sávok, hullám) kap saját arcot. Szín kizárólag CSS-varból
// (ui-hex-guardrail), így palettacserénél együtt mozog a felülettel.

type Motif = "radar" | "network" | "bars" | "waves";

// mulberry32 — determinisztikus PRNG a slugból, hogy a vizuál build-ek
// között stabil maradjon (SSG!).
function hashString(input: string): number {
  let h = 1779033703;
  for (let i = 0; i < input.length; i++) {
    h = Math.imul(h ^ input.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// A motívum lehetőség szerint a témához igazodik, különben a slug dönt.
function pickMotif(slug: string, tags: string[]): Motif {
  const joined = tags.join(" ").toLowerCase();
  if (/dinamika|dynamics|csapatszerep|team role|mobilit|bizalom|trust/.test(joined)) return "network";
  if (/pszichometria|psychometrics|tritan|mbti|mérés|measurement/.test(joined)) return "radar";
  if (/fluktuáció|turnover|hr|toborzás|recruitment|megtartás|retention/.test(joined)) return "bars";
  if (/önértékelés|self|vezetés|leadership|biztonság|safety/.test(joined)) return "waves";
  const motifs: Motif[] = ["radar", "network", "bars", "waves"];
  return motifs[hashString(slug) % motifs.length];
}

const SAGE = "var(--color-sage)";
const BRONZE = "var(--color-accent-primary)";
const BRONZE_SOFT = "var(--color-accent-primary-soft)";

/** Sötét (featured) változatban világos vonalak, világosban sage/bronz. */
function palette(dark: boolean) {
  return dark
    ? {
        line: "rgba(255,255,255,0.14)",
        lineSoft: "rgba(255,255,255,0.08)",
        a: BRONZE_SOFT,
        b: "rgba(255,255,255,0.75)",
        fillA: "rgba(255,255,255,0.10)",
      }
    : {
        line: "var(--color-border-strong)",
        lineSoft: "var(--color-border-default)",
        a: SAGE,
        b: BRONZE,
        fillA: "var(--color-surface-self-accent-soft)",
      };
}

function RadarMotif({ seed, dark }: { seed: number; dark: boolean }) {
  const rnd = mulberry32(seed);
  const p = palette(dark);
  const cx = 200, cy = 100, spokes = 5 + Math.floor(rnd() * 2);
  const outer = 78;
  const pts: string[] = [];
  const dots: Array<{ x: number; y: number; hot: boolean }> = [];
  for (let i = 0; i < spokes; i++) {
    const ang = (Math.PI * 2 * i) / spokes - Math.PI / 2;
    const r = outer * (0.45 + rnd() * 0.5);
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    pts.push(`${x.toFixed(1)},${y.toFixed(1)}`);
    dots.push({ x, y, hot: rnd() > 0.5 });
  }
  return (
    <>
      {[outer, outer * 0.66, outer * 0.33].map((r) => (
        <circle key={r} cx={cx} cy={cy} r={r} fill="none" style={{ stroke: p.lineSoft }} strokeWidth="1.2" />
      ))}
      <polygon points={pts.join(" ")} style={{ fill: p.fillA, stroke: p.a }} strokeWidth="1.5" />
      {dots.map((d, i) => (
        <circle key={i} cx={d.x} cy={d.y} r="3.4" style={{ fill: d.hot ? p.a : p.b }} />
      ))}
    </>
  );
}

function NetworkMotif({ seed, dark }: { seed: number; dark: boolean }) {
  const rnd = mulberry32(seed);
  const p = palette(dark);
  const n = 5 + Math.floor(rnd() * 2);
  const nodes = Array.from({ length: n }, (_, i) => ({
    x: 50 + (300 / (n - 1)) * i + (rnd() - 0.5) * 34,
    y: 55 + rnd() * 90,
    r: 8 + rnd() * 15,
    hot: rnd() > 0.6,
  }));
  return (
    <>
      {nodes.slice(1).map((node, i) => (
        <line
          key={i}
          x1={nodes[i].x} y1={nodes[i].y} x2={node.x} y2={node.y}
          style={{ stroke: node.hot ? p.b : p.a }} strokeWidth="1.2" opacity="0.45"
        />
      ))}
      {nodes.map((node, i) => (
        <circle
          key={i} cx={node.x} cy={node.y} r={node.r}
          style={{ fill: node.hot ? p.b : p.a }}
          opacity={0.35 + rnd() * 0.5}
        />
      ))}
    </>
  );
}

function BarsMotif({ seed, dark }: { seed: number; dark: boolean }) {
  const rnd = mulberry32(seed);
  const p = palette(dark);
  const n = 6 + Math.floor(rnd() * 3);
  const bw = 16;
  const gap = (400 - 80 - n * bw) / (n - 1);
  return (
    <>
      <line x1="40" y1="160" x2="360" y2="160" style={{ stroke: p.lineSoft }} strokeWidth="1.2" />
      {Array.from({ length: n }, (_, i) => {
        const h = 30 + rnd() * 95;
        const hot = rnd() > 0.65;
        return (
          <rect
            key={i}
            x={40 + i * (bw + gap)} y={160 - h} width={bw} height={h} rx="3"
            style={{ fill: hot ? p.b : p.a }}
            opacity={hot ? 0.9 : 0.4 + rnd() * 0.45}
          />
        );
      })}
    </>
  );
}

function WavesMotif({ seed, dark }: { seed: number; dark: boolean }) {
  const rnd = mulberry32(seed);
  const p = palette(dark);
  const wave = (baseY: number, amp: number) => {
    let d = `M -10 ${baseY}`;
    for (let x = 0; x <= 420; x += 70) {
      const y = baseY + (rnd() - 0.5) * amp * 2;
      d += ` S ${x + 35} ${y}, ${x + 70} ${baseY + (rnd() - 0.5) * amp}`;
    }
    return d;
  };
  const d1 = wave(80, 38);
  const d2 = wave(120, 30);
  const cxDot = 90 + rnd() * 220;
  return (
    <>
      <path d={d1} fill="none" style={{ stroke: p.a }} strokeWidth="1.6" opacity="0.85" />
      <path d={d2} fill="none" style={{ stroke: p.b }} strokeWidth="1.6" opacity="0.6" />
      <circle cx={cxDot} cy={100 + (rnd() - 0.5) * 40} r="4" style={{ fill: p.b }} />
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
  // SEEDET adunk át, nem generátort. A PRNG állapotot hordoz: ha a motívum
  // a SZÜLŐBEN létrehozott generátort fogyasztja a saját renderjében, akkor
  // egy különálló újrarender (dev StrictMode dupla render, memoizáció)
  // elcsúsztatja a sorozatot — a szerver és a kliens más geometriát rajzol,
  // és a React hidratálási hibával újraépíti a fát (2026-08-07). Seedből
  // minden render ugyanonnan indul, tehát a render tiszta marad. A kirajzolt
  // kép változatlan: a sorozat ugyanabból a magból ugyanaz.
  const artSeed = hashString(seededKey);
  const dark = variant === "featured";
  const bg =
    dark
      // A kiemelt vizuál SZÁNDÉKOSAN sötét alap (fehér felirat ül rajta),
      // ezért a réteg-hero tokenekből dolgozik: azok mindkét színsémán
      // sötétek. A sage-deep/-dark sötét sémán VILÁGOSSÁ fordul, ott a
      // fehér idézet olvashatatlan lett volna (UX-audit 2026-08-07).
      ? "linear-gradient(135deg, var(--color-layer-self-hero-from), var(--color-layer-self-hero-to))"
      : hashString(seededKey) % 2 === 0
        ? "var(--color-surface-muted)"
        : "var(--color-surface-self-accent-soft)";

  const motifEl =
    motif === "radar" ? <RadarMotif seed={artSeed} dark={dark} />
    : motif === "network" ? <NetworkMotif seed={artSeed} dark={dark} />
    : motif === "bars" ? <BarsMotif seed={artSeed} dark={dark} />
    : <WavesMotif seed={artSeed} dark={dark} />;

  return (
    <svg
      viewBox="0 0 400 200"
      preserveAspectRatio="xMidYMid slice"
      className={className}
      style={{ background: bg, display: "block", width: "100%", height: "100%" }}
      role="img"
      aria-hidden
    >
      {motifEl}
    </svg>
  );
}

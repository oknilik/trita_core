// ─────────────────────────────────────────────────────────────────────
// Az /about oldal három saját ábrája — a formanyelv 2. szintjén.
//
// MIÉRT SAJÁT, ÉS MIÉRT NEM `EditorialArt`: az `EditorialArt` szándékosan
// SEMMIT nem állít — sorsolt kompozíció, dekoráció. Itt viszont az ábra a
// mondanivaló hordozója (három alapréteg → egy kép; táguló kör; rendezetlenből
// rendezett), tehát a geometriának kézzel meghatározottnak kell lennie.
//
// AMIT NEM SZABAD: a hat JELENTŐ alapformát (type-glyph.ts) használni. Az
// csak valódi pontszám mellett rajzolható; egy magyarázó ábrán ugyanaz a
// bronz csepp azt sugallná, hogy egy dimenzióról beszélünk. Ezért ez a
// modul kizárólag az `EDITORIAL_SHAPES` nem foglalt készletéből dolgozik —
// ugyanaz a kézírás, más szókincs.
//
// SVG-ben NINCS szöveg (a kódbázis sehol nem tesz <text>-et ábrába): a
// felirat mindig HTML, mert az törik, fordul (HU/EN) és felolvasható. Az
// ábra `role="img"` + `aria-label`; a tartalmát a mellette lévő kártyák
// amúgy is teljesen leírják.
//
// Szín kizárólag `ART_COLORS`-ból (CSS-változó) — a színsémaváltás így
// magától követi. Nincs kliens-állapot: szerver-komponensben is renderel.
// ─────────────────────────────────────────────────────────────────────

import { EDITORIAL_SHAPES, type EditorialShapeId } from "@/lib/editorial-art";
import { ART_COLORS, hashString, mulberry32, r2, starGeometry } from "@/lib/miro-primitives";

type Tone = "form" | "counterweight";

/** A −50…50 egységnégyzetben élő szerkesztői forma elhelyezése. */
function Glyph({
  id,
  x,
  y,
  size,
  rotation = 0,
  tone = "form",
  strokeWidth = 3.2,
}: {
  id: EditorialShapeId;
  x: number;
  y: number;
  size: number;
  rotation?: number;
  tone?: Tone;
  strokeWidth?: number;
}) {
  const def = EDITORIAL_SHAPES[id];
  const fill = tone === "counterweight" ? ART_COLORS.counterweight : ART_COLORS.form;
  // A forma a saját egységnégyzetében él, tehát a vonalvastagságot vissza
  // kell osztani a skálával — különben a kis formák vonala kövér lesz.
  const k = size / 100;
  const localStroke = r2(strokeWidth / k);

  return (
    <g transform={`translate(${x},${y}) rotate(${rotation}) scale(${r2(k)})`}>
      {def.kind === "fill" && <path d={def.path} fill={fill} />}
      {def.kind === "line" &&
        def.paths.map((d) => (
          <path
            key={d}
            d={d}
            fill="none"
            stroke={ART_COLORS.line}
            strokeWidth={localStroke}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ))}
      {def.kind === "dots" &&
        def.dots.map((dot) => (
          <circle key={`${dot.cx}-${dot.cy}`} cx={dot.cx} cy={dot.cy} r={dot.r} fill={fill} />
        ))}
    </g>
  );
}

function Star({ x, y, r, opacity = 0.85 }: { x: number; y: number; r: number; opacity?: number }) {
  return (
    <g stroke={ART_COLORS.line} strokeWidth={2.4} strokeLinecap="round" opacity={opacity}>
      {starGeometry(x, y, r).lines.map((l) => (
        <line key={`${l.x1}-${l.y1}-${l.x2}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
      ))}
    </g>
  );
}

// ── 1. Rétegábra — „hogyan épül fel" ──────────────────────────────────
//
// Három alapréteg fut össze EGY formába, és az összefutás pontját vékony
// tintagyűrű zárja körbe: az a tanácsadói validálás. A gyűrű nem díszítés —
// ez az egyetlen elem az ábrán, ami a „nem algoritmus dobja ki" állítást
// vizuálisan is elmondja.

const LAYER_VIEWBOX = { w: 300, h: 340 } as const;
const LAYER_NODE_X = 62;
const LAYER_NODE_YS = [70, 166, 262] as const;
const LAYER_SHAPES: readonly EditorialShapeId[] = ["blob", "crescent", "arcs"] as const;
const LAYER_TONES: readonly Tone[] = ["form", "counterweight", "form"] as const;
/** Az összefutás középpontja és a validálás-gyűrű sugara. */
const LAYER_HUB = { x: 232, y: 166, r: 62 } as const;

/**
 * Az összekötők NEM egyetlen pontba futnak, hanem a gyűrű bal ívének három
 * pontjára. Egy közös végpontnál az ívek az utolsó ~30 pixelen egymásra
 * csúszott, és a csomó nyílhegynek látszott — az „összeér" helyett
 * „belefúródik" gesztus (előnézetből, 2026-08-09).
 */
const LAYER_ARRIVALS = [-16, 0, 16].map((dy) => ({
  x: r2(LAYER_HUB.x - Math.sqrt(LAYER_HUB.r * LAYER_HUB.r - dy * dy)),
  y: LAYER_HUB.y + dy,
}));

export function LayerDiagram({ label, className }: { label: string; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${LAYER_VIEWBOX.w} ${LAYER_VIEWBOX.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {/* Ellensúly a bal felső sarokban — a kompozíció nem dől jobbra. */}
      <circle cx={20} cy={20} r={5} fill={ART_COLORS.counterweight} />

      {/* Összekötő ívek: mind a három alapréteg a gyűrű bal szélén ér földet. */}
      <g fill="none" stroke={ART_COLORS.line} strokeWidth={2} strokeLinecap="round" opacity={0.55}>
        {LAYER_NODE_YS.map((y, i) => {
          const end = LAYER_ARRIVALS[i];
          return (
            <path
              key={y}
              d={`M ${LAYER_NODE_X + 30} ${y} C ${LAYER_NODE_X + 78} ${y}, ${end.x - 40} ${r2(y + (end.y - y) * 0.45)}, ${end.x} ${end.y}`}
            />
          );
        })}
      </g>

      {LAYER_NODE_YS.map((y, i) => (
        <Glyph
          key={y}
          id={LAYER_SHAPES[i]}
          x={LAYER_NODE_X}
          y={y}
          size={52}
          rotation={i % 2 === 0 ? -8 : 7}
          tone={LAYER_TONES[i]}
        />
      ))}

      {/* Nap a kimenet fölött. */}
      <circle cx={LAYER_HUB.x} cy={74} r={11} fill={ART_COLORS.sun} />

      {/* A validálás gyűrűje — szaggatott, mert emberi ellenőrzés, nem
          gépi határ. Alatta a kimenet tömör formája. */}
      <circle
        cx={LAYER_HUB.x}
        cy={LAYER_HUB.y}
        r={LAYER_HUB.r}
        fill="none"
        stroke={ART_COLORS.line}
        strokeWidth={2}
        strokeDasharray="7 7"
        strokeLinecap="round"
        opacity={0.55}
      />
      <Glyph id="lens" x={LAYER_HUB.x} y={LAYER_HUB.y} size={104} tone="form" />

      <Star x={272} y={300} r={14} />
    </svg>
  );
}

// ── 2. Útábra — a táguló kör ──────────────────────────────────────────
//
// Négy egyre nagyobb boltív a közös talajvonalon, bennük egyre több pont.
// MINDEN boltívben pontosan egy pont zsálya: ugyanaz az ember, aki az első
// körben elindult. A kör tágul, a kiindulópont nem tűnik el belőle.

const PATH_VIEWBOX = { w: 480, h: 190 } as const;
const PATH_BASE_Y = 138;
const PATH_DOMES = [
  { cx: 58, r: 26, dots: [[58, 122]] },
  { cx: 170, r: 38, dots: [[158, 120], [182, 120]] },
  { cx: 292, r: 52, dots: [[268, 120], [292, 120], [316, 120], [292, 98]] },
  {
    cx: 410,
    r: 58,
    dots: [
      [374, 120], [398, 120], [422, 120], [446, 120],
      [386, 98], [410, 98], [434, 98],
    ],
  },
] as const;

export function PathDiagram({ label, className }: { label: string; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${PATH_VIEWBOX.w} ${PATH_VIEWBOX.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {/* Talajvonal — a két szélén túlfut, hogy vágásnál ne legyen vége. */}
      <path
        d={`M -6 ${PATH_BASE_Y + 2} Q 240 ${PATH_BASE_Y - 8}, ${PATH_VIEWBOX.w + 6} ${PATH_BASE_Y + 2}`}
        fill="none"
        stroke={ART_COLORS.line}
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.5}
      />

      {PATH_DOMES.map((dome) => (
        <path
          key={dome.cx}
          d={`M ${dome.cx - dome.r} ${PATH_BASE_Y} A ${dome.r} ${dome.r} 0 0 1 ${dome.cx + dome.r} ${PATH_BASE_Y}`}
          fill="none"
          stroke={ART_COLORS.line}
          strokeWidth={2.6}
          strokeLinecap="round"
          opacity={0.75}
        />
      ))}

      {PATH_DOMES.map((dome) =>
        dome.dots.map(([cx, cy], i) => (
          <circle
            key={`${dome.cx}-${cx}-${cy}`}
            cx={cx}
            cy={cy}
            r={6}
            fill={i === 0 ? ART_COLORS.counterweight : ART_COLORS.form}
          />
        )),
      )}

      <Star x={58} y={60} r={13} opacity={0.8} />
      <circle cx={410} cy={46} r={10} fill={ART_COLORS.sun} />
    </svg>
  );
}

// ── 3. Célábra — rendezetlenből rendezett ─────────────────────────────
//
// Bal oldalt szórt tintapontok talajvonal NÉLKÜL (a benyomásoknak nincs
// közös alapjuk, ezért nem lehet őket egymás mellé tenni). Középen növekvő
// pontsor — a haladás. Jobbra komponált kép: forma, ellensúly, nap és egy
// talajvonal, amihez viszonyítani lehet.
//
// A szórás determinisztikus (fix mag): a szerver és a kliens ugyanazt a
// markupot adja, tehát nincs hidratálási eltérés.

const PURPOSE_VIEWBOX = { w: 460, h: 180 } as const;

const SCATTER = (() => {
  const rnd = mulberry32(hashString("about:purpose:scatter"));
  return Array.from({ length: 9 }, () => ({
    cx: r2(24 + rnd() * 146),
    cy: r2(44 + rnd() * 98),
    r: r2(3 + rnd() * 3),
  }));
})();

const TRAIL = [
  { cx: 196, cy: 104, r: 4 },
  { cx: 218, cy: 98, r: 5.5 },
  { cx: 240, cy: 92, r: 7 },
  { cx: 264, cy: 86, r: 9 },
] as const;

export function PurposeDiagram({ label, className }: { label: string; className?: string }) {
  return (
    <svg
      viewBox={`0 0 ${PURPOSE_VIEWBOX.w} ${PURPOSE_VIEWBOX.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={label}
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      {/* Bal: szórt pontok, talaj nélkül. */}
      {SCATTER.map((dot) => (
        <circle
          key={`${dot.cx}-${dot.cy}`}
          cx={dot.cx}
          cy={dot.cy}
          r={dot.r}
          fill={ART_COLORS.line}
          opacity={0.42}
        />
      ))}

      {/* Közép: növekvő pontsor. */}
      {TRAIL.map((dot) => (
        <circle key={dot.cx} cx={dot.cx} cy={dot.cy} r={dot.r} fill={ART_COLORS.form} />
      ))}

      {/* Jobb: komponált kép — nap, forma, ellensúly, talaj.
          A `blob` path TÚLLÓG a −50…50 egységnégyzeten (x ≈ −62…56), ezért a
          96-os méretnél a jobb széle 410-ig ért, és a holdsarló belelógott:
          az ellensúlyból alig kilátszó szilánk lett. A méret és a helyek
          ehhez az effektív dobozhoz igazodnak, nem a névleges 100-hoz. */}
      <circle cx={288} cy={32} r={10} fill={ART_COLORS.sun} />
      <Glyph id="blob" x={356} y={88} size={88} rotation={-6} tone="form" />
      <Glyph id="crescent" x={436} y={128} size={40} rotation={12} tone="counterweight" />
      <path
        d="M 292 156 Q 380 150, 454 158"
        fill="none"
        stroke={ART_COLORS.line}
        strokeWidth={2.2}
        strokeLinecap="round"
        opacity={0.5}
      />
    </svg>
  );
}

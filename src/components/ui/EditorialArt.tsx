// Szerkesztői konstelláció — a formanyelv 2. szintje, szabad kompozícióban.
//
// A blog „színpad" vizuáljával szemben ez NEM utal adatra: tisztán
// szerkesztői illusztráció a nem-foglalt formakészletből (editorial-art.ts).
// Ezért ott van a helye, ahol egyetlen nagy felület van és senki nem keres
// benne információt — landing szekció-átkötők, /patterns, founding-oldal.
//
// Amit NEM szabad vele csinálni: listát tapétázni. Tizennégy egymás alatti
// kártyán a jelentés nélküli absztrakció dekoratív zajjá olvad, és a
// képméret is elveszi a kompozíciót (ott a blog színpad-vizuálja való).
//
// Nincs kliens-állapot — szerver- és kliens-komponensben is renderel.

import {
  EDITORIAL_SHAPES,
  buildCompactShape,
  buildConstellation,
  type PlacedShape,
} from "@/lib/editorial-art";
import {
  ART_COLORS,
  ART_COLORS_ON_INVERSE,
  groundPath,
  hashString,
  mulberry32,
  r2,
  resolveArtScale,
  starGeometry,
  type ArtPalette,
} from "@/lib/miro-primitives";

function Shape({ shape, p, strokeWidth }: { shape: PlacedShape; p: ArtPalette; strokeWidth: number }) {
  const def = EDITORIAL_SHAPES[shape.id];
  const fill = shape.tone === "counterweight" ? p.counterweight : p.form;
  // A formák a saját −50…50 egységnégyzetükben élnek; a vonalvastagságot
  // vissza kell osztani a skálával, különben a kis formák vonala kövér lesz.
  const k = shape.size / 100;
  const localStroke = r2(strokeWidth / k);
  return (
    <g transform={`translate(${shape.x},${shape.y}) rotate(${shape.rotation}) scale(${r2(k)})`}>
      {def.kind === "fill" && <path d={def.path} fill={fill} />}
      {def.kind === "line" &&
        def.paths.map((d) => (
          <path
            key={d} d={d} fill="none" stroke={p.line}
            strokeWidth={localStroke} strokeLinecap="round" strokeLinejoin="round"
          />
        ))}
      {def.kind === "dots" &&
        def.dots.map((dot) => <circle key={`${dot.cx}-${dot.cy}`} cx={dot.cx} cy={dot.cy} r={dot.r} fill={fill} />)}
    </g>
  );
}

export function EditorialArt({
  /** Determinisztikus mag — ugyanaz a kulcs mindig ugyanazt a kompozíciót adja. */
  artKey,
  width = 400,
  height = 160,
  /** Mindkét színsémán sötét panelen (hero) más színkészlet kell. */
  onInverse = false,
  /**
   * Ha szöveg ül a kompozíción, a bal alsó negyed szabadon marad —
   * enélkül a formák ráfutnak a feliratra.
   */
  textSafeCorner = false,
  /** Elválasztó-használat: két kisebb forma, csillag nélkül. */
  quiet = false,
  className,
}: {
  artKey: string;
  width?: number;
  height?: number;
  onInverse?: boolean;
  textSafeCorner?: boolean;
  quiet?: boolean;
  className?: string;
}) {
  const p: ArtPalette = onInverse ? ART_COLORS_ON_INVERSE : ART_COLORS;
  const compact = resolveArtScale(width, height, textSafeCorner) === "compact";
  const base = Math.min(height, width * 0.5);
  const strokeWidth = Math.max(2.4, base * 0.03);

  if (compact) {
    const shape = buildCompactShape(artKey, width, height);
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet"
        className={className} role="img" aria-hidden
        style={{ display: "block", width: "100%", height: "100%" }}
      >
        <Shape shape={shape} p={p} strokeWidth={strokeWidth} />
      </svg>
    );
  }

  const c = buildConstellation(artKey, width, height, { textSafeCorner, quiet });

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="xMidYMid meet"
      className={className} role="img" aria-hidden
      style={{ display: "block", width: "100%", height: "100%" }}
    >
      {/* Gerinc — a vékony ív fűzi kompozícióvá a különálló formákat. */}
      <path
        d={c.spine} fill="none" stroke={p.line}
        strokeWidth={r2(strokeWidth * 0.6)} strokeLinecap="round" opacity={0.7}
      />
      <circle cx={c.sun.x} cy={c.sun.y} r={c.sun.r} fill={p.sun} />
      {c.shapes.map((shape, i) => (
        <Shape key={`${shape.id}-${i}`} shape={shape} p={p} strokeWidth={strokeWidth} />
      ))}
      {c.star && (
        <g stroke={p.line} strokeWidth={r2(strokeWidth * 0.8)} strokeLinecap="round" opacity={0.9}>
          {starGeometry(c.star.x, c.star.y, c.star.r).lines.map((l) => (
            <line key={`${l.x1}-${l.y1}-${l.x2}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </g>
      )}
    </svg>
  );
}

/**
 * Szekció-átkötő: keskeny sáv két landing-szekció között. `aria-hidden` —
 * dekoráció, nem tartalom.
 *
 * 2026-08-09: a szabad konstellációt (két forma + gerinc) felváltotta a
 * TÖLTŐ-JEL kísérete: vándorló talajvonal, rajta a tinta-csillag, mellette
 * a bronz nap és a zsálya ellensúly. Két oka van:
 *
 *  – Tisztább. Az elválasztónak egyetlen dolga van: levegőt adni két
 *    szekció között. A konstelláció ehhez képest önálló illusztrációként
 *    viselkedett, és a széles sávban szétesett.
 *  – Egy nyelv. Ugyanaz a három jel, ami a töltőképernyőn is fut, csak
 *    álló változatban — a felület így ismétli önmagát, nem bővíti a
 *    szókincset.
 *
 * A szabad konstelláció (`EditorialArt`) megmarad a NAGY felületekre, ahol
 * egyetlen kép visz mindent — ott továbbra is az a helyes eszköz.
 */
const TRANSITION_VIEWBOX = { width: 1120, height: 72 } as const;

export function SectionTransition({ artKey, className }: { artKey: string; className?: string }) {
  const { width, height } = TRANSITION_VIEWBOX;
  const p = ART_COLORS;
  const seed = hashString(artKey);
  const rnd = mulberry32(seed);

  // A csillag a sáv közepe körül ül, de nem pontosan középen — a kis
  // elcsúszás teszi rajzolttá a jelet. A kíséret hozzá képest helyezkedik,
  // hogy a hármas mindig együtt olvasódjon.
  const starX = r2(width * (0.44 + rnd() * 0.12));
  const baseY = r2(height * 0.56);
  const starR = 15;
  const sunOnLeft = rnd() > 0.5;
  const sunX = r2(starX + (sunOnLeft ? -1 : 1) * 74);
  const dotX = r2(starX + (sunOnLeft ? 1 : -1) * 96);

  return (
    <div
      aria-hidden
      className={["mx-auto w-full max-w-[1120px] px-7", className].filter(Boolean).join(" ")}
    >
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-hidden
        className="h-[56px] w-full md:h-[72px]"
        style={{ display: "block" }}
      >
        {/* Talajvonal — végigfut a sávon, és túlnyúlik mindkét szélén, hogy
            ne legyen látható vége. Ez köti össze a két szekciót. */}
        <path
          d={groundPath(seed + 11, width, baseY, 7)}
          fill="none"
          stroke={p.line}
          strokeWidth={1.6}
          strokeLinecap="round"
          opacity={0.42}
        />
        <circle cx={sunX} cy={r2(baseY - 16)} r={11} fill={p.sun} />
        <g stroke={p.line} strokeWidth={2.6} strokeLinecap="round" opacity={0.85}>
          {starGeometry(starX, baseY, starR).lines.map((l) => (
            <line key={`${l.x1}-${l.y1}-${l.x2}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </g>
        <circle cx={dotX} cy={r2(baseY + 9)} r={5} fill={p.counterweight} />
      </svg>
    </div>
  );
}

/** Stabil kulcs képzése tetszőleges azonosítóból (pl. szekciónév + mód). */
export function artKeyFrom(...parts: Array<string | number>): string {
  return `${parts.join(":")}#${hashString(parts.join(":")) % 997}`;
}

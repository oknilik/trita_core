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
  /** Determinisztikus mag – ugyanaz a kulcs mindig ugyanazt a kompozíciót adja. */
  artKey,
  width = 400,
  height = 160,
  /** Mindkét színsémán sötét panelen (hero) más színkészlet kell. */
  onInverse = false,
  /**
   * Ha szöveg ül a kompozíción, a bal alsó negyed szabadon marad –
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
      {/* Gerinc – a vékony ív fűzi kompozícióvá a különálló formákat. */}
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
 * Szekció-átkötő: a formanyelv hármasa két landing-szekció között.
 * `aria-hidden` – dekoráció, nem tartalom.
 *
 * 2026-08-09: két lépésben állt be. Először a szabad konstellációt (két
 * forma + gerinc) váltotta le a töltő-jel kísérete; aztán a végigfutó
 * talajvonal is kikerült.
 *
 *  – A VONAL nélkül tisztább. A hajszálvonal a teljes szélességet átfogta,
 *    ezért a jel a sáv közepén elveszett a körülötte lévő szöveg mellett:
 *    a szem a vonalat követte, nem a hármast.
 *  – Ezért a sáv KOMPAKT, középre zárt jellé vált. Nem a szélességet tölti
 *    ki, hanem a saját méretével van jelen – így nagyobb lehet anélkül,
 *    hogy hangosabb lenne.
 *  – Egy nyelv: ugyanaz a csillag-nap-ellensúly hármas, ami a
 *    töltőképernyőn is fut, csak álló változatban.
 *
 * A szabad konstelláció (`EditorialArt`) megmarad a NAGY felületekre, ahol
 * egyetlen kép visz mindent – ott továbbra is az a helyes eszköz.
 */
const TRANSITION_VIEWBOX = { width: 190, height: 76 } as const;

export function SectionTransition({ artKey, className }: { artKey: string; className?: string }) {
  const { width, height } = TRANSITION_VIEWBOX;
  const p = ART_COLORS;
  const rnd = mulberry32(hashString(artKey));

  const cx = width / 2;
  const cy = height / 2;
  const starR = 23;

  // A nap és az ellensúly ellentétes oldalra kerül, a kulcsból eldöntve –
  // így a self és a team nézet tükörképet kap, nem ugyanazt a jelet. A
  // távolságok a csillag sugarához mérve élnek, hogy a hármas egyben
  // maradjon: külön-külön lebegő pöttyök szétesnének.
  const sunOnLeft = rnd() > 0.5;
  const sunR = 9;
  const dotR = 5;
  const sunX = r2(cx + (sunOnLeft ? -1 : 1) * (starR + 15 + sunR));
  const dotX = r2(cx + (sunOnLeft ? 1 : -1) * (starR + 17 + dotR));

  return (
    <div
      aria-hidden
      className={["flex w-full justify-center", className].filter(Boolean).join(" ")}
    >
      {/* A width/height ATTRIBÚTUM is ki van írva, nem csak az osztály: így a
          jel akkor is a saját méretén renderel, ha a befoglaló környezetben
          nincs Tailwind (előnézet-generátor, e-mail-szerű kontextus).
          A CSS-osztály erősebb, tehát az appban továbbra is az számít. */}
      <svg
        viewBox={`0 0 ${width} ${height}`}
        width={width}
        height={height}
        preserveAspectRatio="xMidYMid meet"
        role="img"
        aria-hidden
        className="h-[64px] w-auto md:h-[80px]"
        style={{ display: "block" }}
      >
        <circle cx={sunX} cy={r2(cy - 11)} r={sunR} fill={p.sun} />
        <g stroke={p.line} strokeWidth={3.4} strokeLinecap="round" opacity={0.88}>
          {starGeometry(cx, cy, starR).lines.map((l) => (
            <line key={`${l.x1}-${l.y1}-${l.x2}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
          ))}
        </g>
        <circle cx={dotX} cy={r2(cy + 13)} r={dotR} fill={p.counterweight} />
      </svg>
    </div>
  );
}

/** Stabil kulcs képzése tetszőleges azonosítóból (pl. szekciónév + mód). */
export function artKeyFrom(...parts: Array<string | number>): string {
  return `${parts.join(":")}#${hashString(parts.join(":")) % 997}`;
}

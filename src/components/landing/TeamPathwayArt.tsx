import { EditorialShapeGlyph } from "@/components/ui/EditorialArt";
import type { PlacedShape } from "@/lib/editorial-art";
import { ART_COLORS_ON_INVERSE, r2, starGeometry } from "@/lib/miro-primitives";

/**
 * „Kapcsolódás" — a főoldal csapatos átvezetőjének illusztrációja.
 *
 * Kézzel komponált, NEM sorsolt: ugyanabból a szerkesztői formakészletből
 * és színszerepekből épül, mint a konstelláció (EditorialArt), de a
 * kompozíció fix, mert itt egyetlen képnek kell mindig ugyanazt mondania.
 *
 * Amit mond: három különböző forma (folt · mag · sarló) egy közös
 * tintavonalra fűzve, az egyik körül pályaívvel, köztük pontsorral. A
 * bizalmi háló absztrakt rímje adat nélkül — a néző azt érzi, „többen,
 * egymáshoz kötve", de nem keres benne számot. A csillag és a nap a nyelv
 * állandó kísérete, ellentétes sarkokban (ld. miro-primitives).
 *
 * Sötét (szilva) panelen ül mindkét sémán, ezért az inverz paletta.
 * Dekoráció: aria-hidden, a jelentést a mellette lévő szöveg adja.
 */

const W = 460;
const H = 400;
const STROKE = 6;

const SHAPES: readonly PlacedShape[] = [
  // A nagy folt — a csapat „súlya", jobb fent.
  { id: "blob", x: 318, y: 132, size: 172, rotation: -14, tone: "form" },
  // Pályaív a folt körül — a kapcsolati kör.
  // Döntve, hogy pályának olvasódjon, ne szemhéjnak a folt körül.
  { id: "orbit", x: 320, y: 138, size: 276, rotation: -24, tone: "form" },
  // A mag — az ellensúly, bal középen.
  { id: "seed", x: 128, y: 236, size: 118, rotation: 22, tone: "counterweight" },
  // A sarló — a harmadik hang, lent középen.
  { id: "crescent", x: 262, y: 322, size: 88, rotation: 38, tone: "form" },
  // Pontsor a mag és a folt közt — a haladás iránya.
  { id: "trail", x: 196, y: 222, size: 78, rotation: -6, tone: "counterweight" },
];

// A gerinc: egyetlen ecsetvonás fűzi össze a három formát, balról lentről
// a foltig. Túlfut a mag alatt, hogy ne a formákon „ülő" vonalnak tűnjön.
const SPINE = "M 44 342 C 96 300, 118 296, 150 258 S 214 186, 262 176 S 340 196, 400 96";

const STAR = starGeometry(82, 84, 19);
const SUN = { x: 412, y: 330, r: 15 };

export function TeamPathwayArt({ className }: { className?: string }) {
  const p = ART_COLORS_ON_INVERSE;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-hidden="true"
      className={className}
      style={{ display: "block", width: "100%", height: "auto" }}
    >
      <path
        data-art-spine
        d={SPINE}
        fill="none"
        stroke={p.line}
        strokeWidth={r2(STROKE * 0.6)}
        strokeLinecap="round"
        opacity={0.72}
      />
      <circle cx={SUN.x} cy={SUN.y} r={SUN.r} fill={p.sun} />
      {SHAPES.map((shape) => (
        <g
          key={`${shape.id}-${shape.x}-${shape.y}`}
          data-art-form={shape.id === "orbit" || shape.id === "trail" ? undefined : ""}
        >
          <EditorialShapeGlyph shape={shape} p={p} strokeWidth={STROKE} />
        </g>
      ))}
      <g data-art-star stroke={p.line} strokeWidth={r2(STROKE * 0.8)} strokeLinecap="round" opacity={0.9}>
        {STAR.lines.map((l) => (
          <line key={`${l.x1}-${l.y1}-${l.x2}`} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} />
        ))}
      </g>
    </svg>
  );
}

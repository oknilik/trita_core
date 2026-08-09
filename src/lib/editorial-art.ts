// ─────────────────────────────────────────────────────────────────────
// Szerkesztői formakészlet — a formanyelv 2. szintje (2026-08-09).
//
// Ezek a formák SZÁNDÉKOSAN nem a hat jelentő alapforma (type-glyph.ts).
// A hat alapforma foglalt: csak ott jelenhet meg, ahol valódi pontszám
// áll mögötte. Ha egy cikkfejlécen ugyanaz a bronz csepp állna, mint az
// Emocionalitás dimenzión, az olvasó jelentést látna bele — szemben a
// termék „becsült vs. mért mindig jelölve" alapelvével.
//
// Ez a készlet ugyanabban a palettában és kézírásban dolgozik, tehát
// felismerhetően egy család a profil-ábrával, de nem téveszthető össze
// vele. Használat: blog, landing-átkötők, /patterns, OG, prezentáció.
// ─────────────────────────────────────────────────────────────────────

import { hashString, mulberry32, r2 } from "@/lib/miro-primitives";

export type EditorialShapeId =
  | "blob"
  | "crescent"
  | "wedge"
  | "ladder"
  | "arcs"
  | "trail"
  | "lens";

export const EDITORIAL_SHAPE_ORDER: readonly EditorialShapeId[] = [
  "blob",
  "crescent",
  "wedge",
  "ladder",
  "arcs",
  "trail",
  "lens",
] as const;

/**
 * Egy forma leírása a saját, −50…50 közötti egységnégyzetében. A
 * megjelenítő `translate + scale` transzformmal helyezi el.
 *
 * `kind: "fill"`  — tömör bronz/zsálya felület (a nyelv súlya)
 * `kind: "line"`  — vékony tintavonal (a nyelv kézírása)
 * `kind: "dots"`  — pontsor (ritmus, haladás)
 */
export type EditorialShape =
  | { kind: "fill"; path: string }
  | { kind: "line"; paths: string[] }
  | { kind: "dots"; dots: Array<{ cx: number; cy: number; r: number }> };

export const EDITORIAL_SHAPES: Record<EditorialShapeId, EditorialShape> = {
  // Folt — szándékosan aszimmetrikus. Egy szabályos ovális körnek látszik,
  // és azonnal elveszti a kézírás-jelleget.
  blob: {
    kind: "fill",
    path: "M 2 -52 C 36 -50, 56 -26, 48 4 C 42 30, 20 44, -4 38 C -20 34, -28 44, -44 34 C -62 22, -56 -12, -38 -30 C -26 -43, -14 -53, 2 -52 Z",
  },
  // Holdsarló — KÉT azonos irányba hajló ív. A kézenfekvő „kör mínusz
  // eltolt kör" nem működik: evenodd-dal a metszeten kívüli sarló is
  // kitöltődik, nonzero-val pedig a negatív körüljárású rész is (a
  // szabály a ≠0 winding-ot festi, nem a pozitívat).
  crescent: { kind: "fill", path: "M 0 -50 A 50 50 0 0 0 0 50 A 74 74 0 0 1 0 -50 Z" },
  wedge: { kind: "fill", path: "M -44 44 L 0 -48 L 44 44 Z" },
  lens: { kind: "fill", path: "M -48 0 Q 0 -44 48 0 Q 0 44 -48 0 Z" },
  ladder: {
    kind: "line",
    paths: [
      "M -30 -48 L -30 48",
      "M 30 -48 L 30 48",
      "M -30 -22 L 30 -22",
      "M -30 6 L 30 6",
      "M -30 34 L 30 34",
    ],
  },
  arcs: {
    kind: "line",
    paths: [
      "M -46 30 A 46 46 0 0 1 46 30",
      "M -30 30 A 30 30 0 0 1 30 30",
      "M -14 30 A 14 14 0 0 1 14 30",
    ],
  },
  trail: {
    kind: "dots",
    dots: [
      { cx: -40, cy: 22, r: 5 },
      { cx: -18, cy: 4, r: 8 },
      { cx: 8, cy: -14, r: 12 },
      { cx: 38, cy: -34, r: 17 },
    ],
  },
};

/** A forma saját egységnégyzetének fél-oldala (a −50…50 tartományból). */
export const EDITORIAL_SHAPE_UNIT = 100;

// ── Konstelláció-kompozíció ───────────────────────────────────────────

export interface PlacedShape {
  id: EditorialShapeId;
  x: number;
  y: number;
  /** Célméret pixelben (a leghosszabb oldal). */
  size: number;
  rotation: number;
  /** Melyik szerep-színt kapja: a tömör formák váltakoznak. */
  tone: "form" | "counterweight";
}

export interface Constellation {
  shapes: PlacedShape[];
  /** A kompozíció gerince — vékony ív, ami összefűzi a formákat. */
  spine: string;
  sun: { x: number; y: number; r: number };
  /** `null` a halk (elválasztó) változatban. */
  star: { x: number; y: number; r: number } | null;
}

/**
 * Determinisztikus konstelláció.
 *
 * `textSafeCorner`: ha a kompozícióra szöveg ül (kiemelt kártya, hero),
 * a bal alsó negyed szabadon marad — enélkül a létra és a folt ráfut az
 * idézetre. Ilyenkor kevesebb és kisebb forma kerül ki, feljebb húzva.
 */
export function buildConstellation(
  key: string,
  width: number,
  height: number,
  options: { textSafeCorner?: boolean; quiet?: boolean } = {},
): Constellation {
  const seed = hashString(key);
  const rnd = mulberry32(seed);
  const textSafe = options.textSafeCorner === true;
  // A `quiet` az elválasztó-használat: két forma, csillag nélkül, kisebb
  // nappal. Egy átkötőnek le kell ülepítenie a szekciók közti levegőt, nem
  // versenyeznie a tartalommal.
  const quiet = options.quiet === true;
  const base = Math.min(height * (textSafe ? 0.72 : quiet ? 0.82 : 1.05), width * 0.5);
  const count = textSafe || quiet ? 2 : 3;

  // A textSafe slotok azért ilyen szűkek, mert a legnagyobb megengedett
  // formának is a bal alsó negyeden KÍVÜL kell maradnia — az egyensúlyosabb
  // 0.56-os slot nagy folttal még ráfutott az idézetre (unit-teszt fogta).
  const slots: Array<[number, number]> = textSafe
    ? [
        [0.66, 0.28],
        [0.88, 0.3],
      ]
    : quiet
      ? [
          [0.3, 0.46],
          [0.72, 0.52],
        ]
      : rnd() > 0.5
      ? [
          [0.22, 0.56],
          [0.52, 0.36],
          [0.78, 0.58],
        ]
      : [
          [0.26, 0.42],
          [0.55, 0.58],
          [0.8, 0.36],
        ];

  const shapes: PlacedShape[] = [];
  for (let i = 0; i < count; i += 1) {
    const id =
      EDITORIAL_SHAPE_ORDER[
        (hashString(`${key}:${i}`) >>> 3) % EDITORIAL_SHAPE_ORDER.length
      ];
    const size = base * (textSafe ? 0.34 + rnd() * 0.22 : quiet ? 0.36 + rnd() * 0.2 : 0.44 + rnd() * 0.46);
    shapes.push({
      id,
      x: r2(width * slots[i][0]),
      y: r2(height * slots[i][1]),
      size: r2(size),
      rotation: r2((rnd() - 0.5) * 40),
      tone: i === 1 ? "counterweight" : "form",
    });
  }

  const first = shapes[0];
  const last = shapes[shapes.length - 1];
  const spineY = height * (textSafe || rnd() > 0.5 ? 0.08 : 0.92);
  const spine = `M ${r2(first.x)} ${r2(first.y)} Q ${r2(width * 0.5)} ${r2(spineY)}, ${r2(last.x)} ${r2(last.y)}`;

  return {
    shapes,
    spine,
    sun: {
      x: r2(width * (textSafe ? 0.4 : quiet ? 0.52 : 0.5)),
      y: r2(height * (quiet ? 0.36 : 0.2)),
      r: r2(base * (quiet ? 0.11 : 0.17)),
    },
    // Csillag nélkül az átkötő nem „jelöl" semmit — csak levegőt ad.
    star: quiet
      ? null
      : {
          x: r2(width * (textSafe ? 0.22 : rnd() > 0.5 ? 0.9 : 0.1)),
          y: r2(height * 0.22),
          r: r2(base * 0.15),
        },
  };
}

/** Kis méreten (≤140px) egyetlen forma marad, kíséret nélkül. */
export function buildCompactShape(key: string, width: number, height: number): PlacedShape {
  const rnd = mulberry32(hashString(`${key}:compact`));
  return {
    id: EDITORIAL_SHAPE_ORDER[(hashString(key) >>> 3) % EDITORIAL_SHAPE_ORDER.length],
    x: r2(width * 0.5),
    y: r2(height * 0.48),
    size: r2(Math.min(width, height) * 0.66),
    rotation: r2((rnd() - 0.5) * 30),
    tone: "form",
  };
}

// Töltő-jel a formanyelv tinta-csillagából (3. szint — kísérő jelek).
//
// Miért ez, és miért nem pörgő karika: a csillag már a nyelv része (a
// típus-ábrák és a szerkesztői kompozíciók kísérőjele), tehát a várakozás
// pillanata is a márka nyelvén beszél. A 3. szint pont erre való: önmagában
// nem állít semmit, tehát szabadon használható.
//
// A mozgás két rétegű: az egész jel lassan fordul, a négy szárpár pedig
// fázisban eltolva lélegzik. A kulcskockák a globals.css-ben élnek
// (`star-loader-spin` / `star-loader-pulse`), a reduced-motion kikapcsolás
// is ott — így a mozgás-szabály egy helyen módosul.

import { starArms } from "@/lib/miro-primitives";

const VIEWBOX = 100;
const CENTER = VIEWBOX / 2;
const RADIUS = 38;

/**
 * A wordmark három színe az ágakra osztva — ugyanazokból a tokenekből,
 * amikből maga a logó (`t` zsálya · `rit` tinta · `a` bronz). Mind a három
 * token VILÁGOSSÁ fordul a sötét sémán, tehát nem kell külön sötét készlet
 * (ellenőrizve: a paletta mindhárom értéke felülíródik a sötét blokkban).
 *
 * Az arány szándékosan tinta-túlsúlyos (négy ág a nyolcból): a jel továbbra
 * is a formanyelv TINTA-csillaga, a két márkaszín csak átvillan rajta. Fele-
 * fele elosztásnál karácsonyfa lenne, nem töltő-jel.
 *
 * Az elosztás 180°-osan szimmetrikus (a szemközti ág mindig azonos színű),
 * így a forgás közben a színegyensúly állandó marad — különben a csillag
 * „billegne" egy szín felé.
 */
const ARM_COLORS = [
  "var(--color-action-primary-bg)", // ↑ zsálya
  "var(--color-text-primary)",
  "var(--color-accent-primary)", // → bronz
  "var(--color-text-primary)",
  "var(--color-action-primary-bg)", // ↓ zsálya
  "var(--color-text-primary)",
  "var(--color-accent-primary)", // ← bronz
  "var(--color-text-primary)",
];

/**
 * Ágankénti fázis-eltolás. A pulzus 1,15 s, a nyolc ág eltolása a ciklus
 * negyedét fedi le, tehát a kinyúlás KÖRBEFUT a csillagon — ez adja a
 * szikrázó karakterét. Egyszerre lüktető ágak sima méret-pumpálásnak
 * látszanának.
 */
const PHASE_STEP_MS = 36;

export function StarLoader({
  /** Pixelben; a vonalvastagság együtt skálázódik. */
  size = 48,
  /**
   * Egyszínű változat. Alapból nincs: a jel a wordmark három színét viseli
   * (tinta-túlsúllyal). Akkor adj át értéket, ha a jel olyan panelre kerül,
   * ami MINDKÉT sémán sötét — ott a tinta-ágak eltűnnének.
   */
  color,
  /** Képernyőolvasónak. `null` = a jel dekoráció, a szöveget a keret adja. */
  label = null,
  className,
}: {
  size?: number;
  color?: string;
  label?: string | null;
  className?: string;
}) {
  const arms = starArms(CENTER, CENTER, RADIUS);
  const strokeWidth = Math.max(1.5, VIEWBOX * 0.055);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      <g className="star-loader-spin">
        {arms.map((arm, i) => (
          <g
            key={`${arm.x2}-${arm.y2}`}
            className="star-loader-pulse"
            style={{ animationDelay: `${i * PHASE_STEP_MS}ms` }}
          >
            <line
              x1={arm.x1} y1={arm.y1} x2={arm.x2} y2={arm.y2}
              stroke={color ?? ARM_COLORS[i]}
              strokeWidth={strokeWidth}
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>
    </svg>
  );
}

/**
 * Teljes képernyős töltőállapot: vászon + csillag, felirat nélkül.
 *
 * A wordmark szándékosan NINCS alatta: a töltés másodperc töredéke, és a
 * logó ott csak visszaigazolja, amit a felhasználó úgyis tud (hol van) —
 * a jel egyedül tisztább, és nagyobbra vehető.
 *
 * A `status` szerep + `aria-live="polite"` azért kell, hogy a képernyőolvasó
 * bemondja a várakozást — a néma spinner úgy viselkedik, mintha az oldal
 * befagyott volna.
 */
export function StarLoaderScreen({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="flex min-h-dvh items-center justify-center bg-[var(--color-surface-canvas)]"
    >
      <StarLoader size={64} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

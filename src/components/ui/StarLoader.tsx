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

import { starGeometry } from "@/lib/miro-primitives";

const VIEWBOX = 100;
const CENTER = VIEWBOX / 2;
const RADIUS = 38;

/**
 * A négy szárpár fázis-eltolása — ettől lélegzik, nem villan egyszerre.
 * A pulzus 1,6 s, tehát a 0–330 ms-os eltolás a ciklus ötöde: érzékelhető
 * hullámzás, de a szárak nem szakadnak szét látható „hiányzó ág" képpé.
 */
const PHASE_MS = [0, 110, 220, 330];

export function StarLoader({
  /** Pixelben; a vonalvastagság együtt skálázódik. */
  size = 48,
  /**
   * A jel színe. Alapból a tinta — ami sötét sémán VILÁGOSSÁ fordul, mert
   * egy szó szerint fekete csillag a sötét vásznon láthatatlan lenne.
   * Sötét panelen (ami mindkét sémán sötét) adj át explicit értéket.
   */
  color = "var(--color-text-primary)",
  /** Képernyőolvasónak. `null` = a jel dekoráció, a szöveget a keret adja. */
  label = null,
  className,
}: {
  size?: number;
  color?: string;
  label?: string | null;
  className?: string;
}) {
  const { lines } = starGeometry(CENTER, CENTER, RADIUS);
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
        {lines.map((l, i) => (
          <g
            key={`${l.x1}-${l.y1}-${l.x2}-${l.y2}`}
            className="star-loader-pulse"
            style={{ animationDelay: `${PHASE_MS[i % PHASE_MS.length]}ms` }}
          >
            <line
              x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
              stroke={color}
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
 * Teljes képernyős töltőállapot: vászon + csillag + wordmark.
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
      <div className="flex flex-col items-center gap-5">
        <StarLoader size={56} />
        <span className="font-fraunces text-2xl font-black tracking-[-0.03em] text-ink">
          <span className="text-[var(--color-action-primary-bg)]">t</span>rit
          <span className="text-[var(--color-accent-primary)]">a</span>
        </span>
        <span className="sr-only">{label}</span>
      </div>
    </div>
  );
}

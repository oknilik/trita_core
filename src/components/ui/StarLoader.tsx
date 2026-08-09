// Töltő-jel a formanyelv tinta-csillagából (3. szint — kísérő jelek).
//
// Miért ez, és miért nem pörgő karika: a csillag már a nyelv része (a
// típus-ábrák és a szerkesztői kompozíciók kísérőjele), tehát a várakozás
// pillanata is a márka nyelvén beszél. A 3. szint pont erre való: önmagában
// nem állít semmit, tehát szabadon használható.
//
// A mozgás két rétegű: az egész jel lassan fordul, a négy szárpár pedig
// fázisban eltolva lélegzik. A kulcskockák a globals.css-ben élnek
// (`star-loader-spin` / `star-loader-pulse` / `star-loader-breathe`), a
// reduced-motion kikapcsolás is ott — így a mozgás-szabály egy helyen
// módosul.
//
// A csillag maga VÉGIG tinta. A márka másik két színe kísérőjelként jelenik
// meg mellette: bronz nap fent jobbra, zsálya ellensúlypont lent balra —
// pontosan az a két elem, ami a blog- és landing-ábrákon is ott van
// (miro-primitives.ts, 3. szint). Így a töltőképernyő ugyanannak a nyelvnek
// a mondata, nem külön dialektus.

import { r2, starArms } from "@/lib/miro-primitives";

const CENTER = 70;
const RADIUS = 38;
const STROKE = 5.5;

/**
 * A pulzus felső határa (`star-loader-pulse` kulcskockái). A hézagokat EHHEZ
 * mérjük, nem a nyugalmi sugárhoz — különben a kísérőjelek a kinyúlás
 * csúcsán összeérnének az ágakkal.
 */
const MAX_ARM_REACH = RADIUS * 1.06;

/**
 * Kísérőjel elhelyezése: szög + KÍVÁNT HÉZAG a leghosszabb ágtól. Így a
 * hézag a kódban is az marad, aminek látszik — a kézzel beírt koordinátákon
 * egy sugár-módosítás észrevétlenül elrontaná.
 */
function place(angleDeg: number, gap: number, radius: number) {
  const angle = (angleDeg * Math.PI) / 180;
  const distance = MAX_ARM_REACH + gap + radius;
  return {
    x: r2(CENTER + Math.cos(angle) * distance),
    y: r2(CENTER + Math.sin(angle) * distance),
    r: radius,
  };
}

// Bronz nap fent jobbra, zsálya ellensúly lent balra — a blog- és
// landing-ábrák kísérete. A nap nagyobb és közelebb, az ellensúly kisebb és
// távolabb: ez a súlyviszony tartja egyensúlyban az átlós kompozíciót.
const SUN = place(-45, 9, 13);
const COUNTERWEIGHT = place(145, 14, 8);

/**
 * A kíséret ennyivel nyúlik túl a csillag keretén. A `size` MINDIG a
 * csillagra vonatkozik, a vászon nő körülötte — enélkül a 48 pixeles
 * küszöbön a csillag hirtelen ZSUGORODNA (a 44-es, kíséret nélküli jel
 * nagyobb lett volna, mint a 48-as), ami visszafelé ugró méretlépcsőnek
 * látszott.
 */
const ACCOMPANIMENT_BOX_RATIO = 140 / 100;

/**
 * Kíséret nélküli alsó határ. 48 pixel alatt a nap és az ellensúly néhány
 * pixelre zsugorodna — ott nem díszít, csak koszol. A kivágás olyankor
 * szorosan a csillagra záródik, hogy a jel ugyanakkora maradjon.
 */
const ACCOMPANIMENT_MIN_PX = 48;

/** A csillag saját kerete kíséret nélkül — a régi 100-as vászon megfelelője. */
const STAR_ONLY_VIEWBOX = `${CENTER - 50} ${CENTER - 50} 100 100`;
const FULL_VIEWBOX = "0 0 140 140";

/**
 * Ágankénti fázis-eltolás. A pulzus 1,15 s, a nyolc ág eltolása a ciklus
 * negyedét fedi le, tehát a kinyúlás KÖRBEFUT a csillagon — ez adja a
 * szikrázó karakterét. Egyszerre lüktető ágak sima méret-pumpálásnak
 * látszanának.
 */
const PHASE_STEP_MS = 36;

export function StarLoader({
  /**
   * A CSILLAG mérete pixelben — nem a teljes jelé. Kísérettel a vászon 40%-kal
   * nagyobb lesz körülötte, hogy a csillag ugyanakkora maradjon. 48 alatt a
   * kíséret automatikusan elmarad.
   */
  size = 48,
  /**
   * A csillag színe. Alapból a tinta — ami sötét sémán VILÁGOSSÁ fordul,
   * mert egy szó szerint fekete csillag a sötét vásznon láthatatlan lenne.
   * Olyan panelen, ami MINDKÉT sémán sötét, adj át explicit értéket.
   */
  color = "var(--color-text-primary)",
  /**
   * Nap + ellensúly a csillag mellett. Alapból méret szerint dől el;
   * `false`-szal kikapcsolható ott is, ahol elférne (pl. szűk sorban).
   */
  accompaniment,
  /** Képernyőolvasónak. `null` = a jel dekoráció, a szöveget a keret adja. */
  label = null,
  className,
}: {
  size?: number;
  color?: string;
  accompaniment?: boolean;
  label?: string | null;
  className?: string;
}) {
  const arms = starArms(CENTER, CENTER, RADIUS);
  const withAccompaniment = accompaniment ?? size >= ACCOMPANIMENT_MIN_PX;
  const box = withAccompaniment ? Math.round(size * ACCOMPANIMENT_BOX_RATIO) : size;

  return (
    <svg
      width={box}
      height={box}
      viewBox={withAccompaniment ? FULL_VIEWBOX : STAR_ONLY_VIEWBOX}
      className={className}
      role={label ? "img" : undefined}
      aria-label={label ?? undefined}
      aria-hidden={label ? undefined : true}
      focusable="false"
    >
      {/* Nap — a csillag mögé kerül, hogy a metszés a tinta javára dőljön,
          ha a pulzus a legnagyobb kinyúláshoz ér. */}
      {withAccompaniment && (
        <circle
          className="star-loader-breathe"
          cx={SUN.x} cy={SUN.y} r={SUN.r}
          fill="var(--color-accent-primary)"
        />
      )}

      <g className="star-loader-spin">
        {arms.map((arm, i) => (
          <g
            key={`${arm.x2}-${arm.y2}`}
            className="star-loader-pulse"
            style={{ animationDelay: `${i * PHASE_STEP_MS}ms` }}
          >
            <line
              x1={arm.x1} y1={arm.y1} x2={arm.x2} y2={arm.y2}
              stroke={color}
              strokeWidth={STROKE}
              strokeLinecap="round"
            />
          </g>
        ))}
      </g>

      {/* Ellensúly — a nappal ellentétes oldalon, késleltetve lélegzik, hogy
          a két kísérőjel ne egyszerre mozduljon. */}
      {withAccompaniment && (
        <circle
          className="star-loader-breathe star-loader-breathe-late"
          cx={COUNTERWEIGHT.x} cy={COUNTERWEIGHT.y} r={COUNTERWEIGHT.r}
          fill="var(--color-action-primary-bg)"
        />
      )}
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
      <StarLoader size={72} />
      <span className="sr-only">{label}</span>
    </div>
  );
}

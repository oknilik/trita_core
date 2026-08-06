import { AXIS_META, PATTERNS } from "@/lib/pattern-data";

/**
 * A 16 csapatmintázat SZERVER-OLDALON renderelt katalógusa.
 *
 * MIÉRT: az explorer interaktív — egyszerre EGY mintát mutat, azt is a
 * csúszkák állásától függően. A crawler (és a válaszmotorok szövegkivonata)
 * ezért a lap teljes tartalmából egyetlen mintát látott, miközben a lap
 * ígérete „16 csapatmintázat". Egy „milyen csapattípusok vannak?" kérdésre
 * pont a hiányzó 15 lenne az érték.
 *
 * Ez a szekció statikus HTML-ben szállítja mind a 16-ot, a PATTERNS
 * forrásból — nincs külön SEO-szöveg, amit karban kellene tartani, és nem
 * tud elcsúszni attól, amit az explorer mutat. Ugyanez a forrás adja a lap
 * ItemList strukturált adatát is.
 */

const T = {
  card: "var(--color-paper-card)",
  muted: "var(--color-paper-muted)",
  heading: "var(--color-paper-heading)",
  border: "var(--color-paper-border)",
};

/** "1011" → ["Visszafogott", "Összetartó", "Strukturált", "Felfedező"] */
export function axisProfileLabels(key: string): string[] {
  return AXIS_META.map((axis, index) => (key[index] === "1" ? axis.high : axis.low));
}

/** Rendezés: a katalógus determinisztikus sorrendje a mintakulcs szerint. */
const ORDERED_PATTERN_KEYS = Object.keys(PATTERNS).sort();

export function PatternDirectory() {
  return (
    <section
      id="mind-a-16-mintazat"
      className="mx-auto max-w-5xl px-4 pb-20 md:px-6"
      aria-labelledby="pattern-directory-heading"
    >
      <h2
        id="pattern-directory-heading"
        className="font-fraunces text-heading leading-tight"
        style={{ color: T.heading }}
      >
        Mind a 16 csapatmintázat
      </h2>
      <p className="mt-2 max-w-2xl text-body leading-relaxed" style={{ color: T.muted }}>
        A mintázatokat négy tengely metszete adja:{" "}
        {AXIS_META.map((axis) => axis.name.toLowerCase()).join(", ")}. Minden
        működésnek van előnye és ára — nincs jó vagy rossz minta, csak olyan,
        ami illeszkedik a feladathoz, és olyan, ami nem.
      </p>

      <div className="mt-8 grid grid-cols-1 gap-4 md:grid-cols-2">
        {ORDERED_PATTERN_KEYS.map((key) => {
          const pattern = PATTERNS[key];
          return (
            <article
              key={key}
              className="overflow-hidden rounded-2xl border"
              style={{ backgroundColor: T.card, borderColor: T.border }}
            >
              <div className="h-1" style={{ backgroundColor: pattern.color }} />
              <div className="p-5">
                <h3
                  className="font-fraunces text-title leading-tight"
                  style={{ color: T.heading }}
                >
                  {pattern.name}
                </h3>
                <p className="mt-1 text-micro uppercase tracking-widest" style={{ color: T.muted }}>
                  {axisProfileLabels(key).join(" · ")}
                </p>
                <p className="mt-3 text-caption leading-relaxed" style={{ color: T.muted }}>
                  {pattern.description}
                </p>

                <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <dt className="text-micro font-semibold uppercase tracking-widest" style={{ color: T.heading }}>
                      Erősségek
                    </dt>
                    <dd className="mt-1 text-caption leading-relaxed" style={{ color: T.muted }}>
                      {pattern.strengths.join(" · ")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-micro font-semibold uppercase tracking-widest" style={{ color: T.heading }}>
                      Kockázatok
                    </dt>
                    <dd className="mt-1 text-caption leading-relaxed" style={{ color: T.muted }}>
                      {pattern.risks.join(" · ")}
                    </dd>
                  </div>
                </dl>

                <p className="mt-4 text-caption leading-relaxed" style={{ color: T.muted }}>
                  <strong style={{ color: T.heading }}>Hol jelenik meg:</strong>{" "}
                  {pattern.contexts}
                </p>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

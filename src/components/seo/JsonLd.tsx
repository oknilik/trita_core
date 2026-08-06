import type { JsonLdObject } from "@/lib/structured-data";

/**
 * A `</script>` szekvencia semlegesítése a JSON-LD payloadban.
 *
 * MIÉRT KELL: a `dangerouslySetInnerHTML` a script-törzsbe NYERSEN írja a
 * stringet, a böngésző pedig a `</script>` részstringnél lezárja a blokkot —
 * ha bármelyik adat (blogcím, i18n-szöveg, FAQ-válasz) valaha tartalmaz
 * ilyet, a lap DOM-ja törik, rosszabb esetben script-injektálás lesz belőle.
 * A `<` unicode-escape-je JSON-szinten teljesen ekvivalens (`"<"` és
 * `"<"` ugyanaz a karakter), a parserek gond nélkül olvassák.
 *
 * Az `&` escape-elése a HTML-entitás-feloldás miatt kell (`&lt;` → `<`).
 */
function serialize(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data)
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e")
    .replace(/&/g, "\\u0026");
}

/**
 * Egyetlen `<script type="application/ld+json">` blokk.
 *
 * Több sémát EGY blokkban, tömbként adunk át (`data={[a, b]}`) — a
 * szabvány megengedi, és kevesebb DOM-csomópont keletkezik, mint sémánként
 * külön scripttel.
 */
export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      // A payload build-időben, saját forrásból generált objektum — a
      // serialize() a script-lezáró szekvenciát is semlegesíti.
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}

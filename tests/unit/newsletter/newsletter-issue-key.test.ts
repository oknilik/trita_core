import test from "node:test";
import assert from "node:assert/strict";
import { clickUrl, DEFAULT_TOPICS } from "@/lib/newsletter";
import { issueDeliveryKey } from "@/lib/newsletter-issue";

// A szerkesztett szám ugyanazt a naplót használja, mint a cikk-értesítő —
// a dedupe-kulcs névtere választja szét a kettőt. Ha ez a prefix elromlik,
// egy szám és egy azonos nevű cikk-slug ütközhetne, és a címzett kimaradna.
test("a szerkesztett szam dedupe-kulcsa sajat nevterben van", () => {
  assert.equal(issueDeliveryKey("abc123"), "issue:abc123");
  assert.notEqual(issueDeliveryKey("abc123"), "abc123");
});

// A kattintás-követő link SLUGOT visz, nem URL-t — ezért nem tud nyílt
// átirányítássá válni. A teszt azt őrzi, hogy a paraméterek kódolva mennek.
test("a kattintas-koveto link a slugot es az id-t kodolva viszi", () => {
  assert.equal(
    clickUrl("https://trita.io", "del_1", "csapatdinamika-olvasasa"),
    "https://trita.io/api/newsletter/click?d=del_1&to=csapatdinamika-olvasasa",
  );
  // Egy külső URL-nek látszó érték is csak paraméterként utazik: a végpont
  // slugként oldja fel, és ismeretlen slugnál a bloglistára megy.
  assert.equal(
    clickUrl("https://trita.io", "del_1", "https://evil.example"),
    "https://trita.io/api/newsletter/click?d=del_1&to=https%3A%2F%2Fevil.example",
  );
});

// A megerősítő levél szövege mindkét tartalom-típust ígéri, tehát a
// hozzájárulás is mindkettőre szól — az alapértelmezésnek ezt kell tükröznie.
test("az alapertelmezett topic-keszlet mindket tartalom-tipust tartalmazza", () => {
  assert.deepEqual([...DEFAULT_TOPICS].sort(), ["blog", "newsletter"]);
});

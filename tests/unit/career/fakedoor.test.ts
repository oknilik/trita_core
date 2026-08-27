import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import {
  CAREER_FAKE_DOOR_MODULE,
  CAREER_NO_REASONS,
  CAREER_PRICE_VARIANTS,
  CAREER_VALUE_GOALS,
  FAKE_DOOR_AUDIENCES,
  assignPriceVariant,
  isCareerPriceVariant,
  isFakeDoorSource,
} from "@/lib/fakedoor/career";

// A kereslet-mérés szerződése.
//
// Ez a fájl azt védi, amitől a mérés egyáltalán értelmes: az ársáv-sorsolás
// determinizmusát, a katalógusok stabilitását, és azt, hogy az „átugrás"
// külön válasz. Ha bármelyik elcsúszik, a szám nem hibásnak LÁTSZIK — némán
// más kérdésre felel, és a döntés, hogy megépüljön-e a modul, rossz alapon áll.

test("az ársáv ugyanahhoz a munkamenethez mindig ugyanaz", () => {
  for (let i = 0; i < 50; i += 1) {
    const sessionId = randomUUID();
    const first = assignPriceVariant(sessionId);
    assert.equal(assignPriceVariant(sessionId), first);
    assert.equal(assignPriceVariant(sessionId), first, "harmadik hívás is stabil");
    assert.ok(isCareerPriceVariant(first));
  }
});

test("a három ársáv nagyjából egyenletesen oszlik", () => {
  // Nem pontos egyenlőséget várunk (hash, nem sorsolás), csak azt, hogy egyik
  // sáv se maradjon üresen vagy vigye el a mintát: aszimmetrikus kiosztásnál
  // az egyik árról alig lenne adat, és a görbe töréspontja nem látszana.
  const counts = new Map<number, number>();
  const total = 3000;
  for (let i = 0; i < total; i += 1) {
    const price = assignPriceVariant(randomUUID());
    counts.set(price, (counts.get(price) ?? 0) + 1);
  }
  assert.equal(counts.size, CAREER_PRICE_VARIANTS.length);
  for (const price of CAREER_PRICE_VARIANTS) {
    const share = (counts.get(price) ?? 0) / total;
    assert.ok(share > 0.25 && share < 0.42, `${price} aránya kilóg: ${share}`);
  }
});

test("az ársávok rögzítettek és növekvő sorrendűek", () => {
  // A sorrend a sorsolás indexe: átrendezésnél a korábbi minta besorolása
  // csúszna el, és a régi válaszok más árhoz tartoznának.
  assert.deepEqual([...CAREER_PRICE_VARIANTS], [4900, 9900, 14900]);
  assert.equal(isCareerPriceVariant(9900), true);
  assert.equal(isCareerPriceVariant(7900), false);
});

test("az „igen” ág katalógusa tartalmazza az átugrást", () => {
  // Az átugrás teljes értékű válasz: enélkül a megoszlás azok felé torzulna,
  // akik hajlandóak voltak még egy kérdésre felelni.
  assert.ok(CAREER_VALUE_GOALS.includes("skipped"));
  assert.equal(new Set(CAREER_VALUE_GOALS).size, CAREER_VALUE_GOALS.length);
});

test("a „nem” ág elkülöníti az ár- és a bizonyíték-problémát", () => {
  // A kettő teljesen más fejlesztést indokol – ha egy kalap alá kerülnének,
  // a válasz nem mondana semmit arról, mit kell csinálni.
  assert.ok(CAREER_NO_REASONS.includes("price"));
  assert.ok(CAREER_NO_REASONS.includes("accuracy"));
  // Az átugrás mindkét ágon rögzül, különben a `null` sorok némán kiesnének
  // a megoszlásból.
  assert.ok(CAREER_NO_REASONS.includes("skipped"));
  assert.ok(CAREER_VALUE_GOALS.includes("skipped"));
  assert.equal(new Set(CAREER_NO_REASONS).size, CAREER_NO_REASONS.length);
});

test("a közönség-katalógus külön kezeli a tanácsadót", () => {
  assert.ok(FAKE_DOOR_AUDIENCES.includes("consultant"));
  assert.ok(FAKE_DOOR_AUDIENCES.includes("individual"));
});

test("a belépési pont csak a katalógusból fogadható el", () => {
  assert.equal(isFakeDoorSource("results"), true);
  assert.equal(isFakeDoorSource("javascript:alert(1)"), false);
  assert.equal(isFakeDoorSource(""), false);
});

test("a modul-kulcs stabil", () => {
  // A riport, az export és mindkét route ezt a kulcsot használja; ha
  // elmozdulna, a korábbi sorok láthatatlanná válnának a riportban.
  assert.equal(CAREER_FAKE_DOOR_MODULE, "career_compass");
});

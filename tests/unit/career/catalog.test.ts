import test from "node:test";
import assert from "node:assert/strict";
import { INDUSTRIES, INTEREST_TAGS, normalizedEduFields } from "@/lib/industry-fit";
import { INDUSTRY_ISCO } from "@/lib/career/industries";
import { getOccupations, getOccupation } from "@/lib/career/catalog";
import { interestsFromTags, estimateInterests } from "@/lib/career/interests";
import { RIASEC_LETTERS } from "@/lib/career/types";

// A wizard adatai és a v2 katalógus közti kapcsolat épsége. (A v1 motor
// kivezetése után az `industry-fit.ts` már csak adat: iparág-lista + címkék.)

test("minden wizard-iparághoz tartozik ISCO-leképezés, és fordítva", () => {
  for (const industry of INDUSTRIES) {
    const prefixes = INDUSTRY_ISCO[industry.key];
    assert.ok(prefixes?.length, `${industry.key}: nincs ISCO-leképezés`);
  }
  for (const key of Object.keys(INDUSTRY_ISCO)) {
    assert.ok(
      INDUSTRIES.some((industry) => industry.key === key),
      `${key}: ISCO-leképezés ismeretlen iparágra`,
    );
  }
});

test("minden iparág elér értelmes számú foglalkozást a címkéken át", () => {
  const catalog = getOccupations();
  for (const industry of INDUSTRIES) {
    const matched = catalog.filter((occupation) =>
      (occupation.industries ?? []).includes(industry.key),
    );
    assert.ok(matched.length >= 5, `${industry.key}: csak ${matched.length} címkézett foglalkozás`);
  }
});

test("iparág-címkék: csak érvényes kulcsok, és a kínos félrecímkék nem térnek vissza", () => {
  const validKeys = new Set(INDUSTRIES.map((industry) => industry.key));
  for (const occupation of getOccupations()) {
    for (const tag of occupation.industries ?? []) {
      assert.ok(validKeys.has(tag), `${occupation.hu}: érvénytelen címke (${tag})`);
    }
  }
  // Regresszió a 2026-07-30-i hibára: a grafikus/művészeti szerepek és a
  // hálózatSZERELŐK nem tartozhatnak az IT-scope-ba.
  const tech = new Set(
    getOccupations()
      .filter((occupation) => (occupation.industries ?? []).includes("tech"))
      .map((occupation) => occupation.hu),
  );
  for (const wrong of ["Grafikus", "Művészeti vezető", "Hangtechnikus", "Operatőr", "Villamoshálózat-szerelő", "Távközlési hálózatszerelő", "CNC-programozó"]) {
    assert.ok(!tech.has(wrong), `${wrong} nem lehet tech-címkés`);
  }
  assert.ok(tech.has("Informatikai igazgató"), "az IT-vezetőnek tech-ben a helye");
  assert.ok(tech.has("Felhasználói felület tervező"));

  // Az 53-as ISCO-csoport szétválasztása: a pedagógiai asszisztensek nem
  // egészségügyi, a gondozók igen.
  const health = new Set(
    getOccupations()
      .filter((occupation) => (occupation.industries ?? []).includes("health"))
      .map((occupation) => occupation.hu),
  );
  assert.ok(!health.has("Pedagógiai asszisztens"), "a pedagógiai asszisztens nem egészségügy");
  assert.ok(health.has("Szakápoló"));
});

test("érdeklődés-címkék: mind a hat Holland-betű lefedett, az iparágak léteznek", () => {
  const covered = new Set(INTEREST_TAGS.flatMap((tag) => tag.letters));
  for (const letter of RIASEC_LETTERS) {
    assert.ok(covered.has(letter), `nincs címke a(z) ${letter} betűre`);
  }
  for (const tag of INTEREST_TAGS) {
    for (const industry of tag.industries) {
      assert.ok(INDUSTRY_ISCO[industry], `${tag.key}: ismeretlen iparág (${industry})`);
    }
  }
});

test("címkékből becsült érdeklődés-vektor: a választott betűk kiemelkednek", () => {
  const vector = interestsFromTags(["helping", "caring"]);
  assert.ok(vector, "nincs vektor");
  assert.ok((vector.S ?? 0) > (vector.R ?? 0), "a segítő címkék nem emelték az S-t");
  assert.equal(interestsFromTags([]), null);
});

test("személyiség-alapú érdeklődés-becslés: minden betű azonos skálán mozog", () => {
  const flat = estimateInterests({ INTE: 50, RESO: 50, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50 }, {});
  const values = RIASEC_LETTERS.map((letter) => flat[letter] ?? 0);
  const spread = Math.max(...values) - Math.min(...values);
  assert.ok(spread < 15, `semleges profilnál is nagy a szórás: ${spread}`);
  const social = estimateInterests(
    { INTE: 50, RESO: 60, TEMP: 80, ADAP: 80, THOR: 50, OPEN: 50 },
    { people: 1 },
  );
  assert.ok((social.S ?? 0) > (flat.S ?? 0), "a társas profil nem emelte az S-t");
});

test("katalógus-azonosító feloldás: létező SOC igen, kitalált nem", () => {
  const first = getOccupations()[0];
  assert.equal(getOccupation(first.id)?.hu, first.hu);
  assert.equal(getOccupation("00-0000.00"), undefined);
});

test("normalizedEduFields: az örökölt egyértékű mező is tömbként jön vissza", () => {
  assert.deepEqual(
    normalizedEduFields({
      status: "working",
      eduLevel: "higher",
      eduField: "economics",
      ageBand: null,
      currentIndustry: null,
      interests: [],
    }),
    ["economics"],
  );
});

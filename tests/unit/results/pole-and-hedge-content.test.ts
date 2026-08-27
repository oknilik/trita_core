import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  ARCHETYPE_STORY_ADJ,
  ARCHETYPE_STORY_NOUN,
  buildArchetypeStory,
  getEnvRows,
} from "@/lib/profile-content";
import { getDimensionLabel } from "@/lib/dimension-utils";
import type { ProfileCategory } from "@/lib/profile-engine";
import { resultsTranslations } from "@/lib/i18n/results";

/** Kommentmentes forrás: a tiltott mintát MAGYARÁZÓ kommentek ne bukjanak el. */
const readCode = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8")
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ");

// Motor-audit v4 tartalom-guardrailek:
//  - FIX 5 (S3-hedge): mérési hibán belüli top-2 sorrendnél az archetípus-
//    történet főnév-only — a második dimenziót színező mondat nem megy ki.
//  - FIX 2 utódja (2026-08-18): a szint-címke VALENCIA-MENTES
//    (magas/közepes/alacsony) — így a fordított Emocionalitás sem igényel
//    külön „stabil" foltot, és egyetlen sávhoz sem tartozik értékelő szó.
//  - FIX 1 (± kivezetés): a results-szótár egyetlen kulcsa sem tartalmaz
//    megjelenő ± jelet / mérési-hiba számot.

test("buildArchetypeStory: null secondary → főnév-only történet", () => {
  assert.equal(buildArchetypeStory("O", null, "hu"), ARCHETYPE_STORY_NOUN.O.hu);
  assert.equal(buildArchetypeStory("O", null, "en"), ARCHETYPE_STORY_NOUN.O.en);
});

test("buildArchetypeStory: megadott secondary → főnév + színező mondat", () => {
  assert.equal(
    buildArchetypeStory("O", "C", "hu"),
    `${ARCHETYPE_STORY_NOUN.O.hu} ${ARCHETYPE_STORY_ADJ.C.hu}`,
  );
});

test("buildArchetypeStory: ismeretlen kódra null", () => {
  assert.equal(buildArchetypeStory("NOPE", null, "hu"), null);
  assert.equal(buildArchetypeStory("O", "NOPE", "hu"), null);
});

test("getDimensionLabel: a szint-szó valencia-mentes, minden sávon", () => {
  assert.equal(getDimensionLabel(80, "hu"), "magas");
  assert.equal(getDimensionLabel(55, "hu"), "közepes");
  assert.equal(getDimensionLabel(25, "hu"), "alacsony");
  assert.equal(getDimensionLabel(80, "en"), "high");
  assert.equal(getDimensionLabel(55, "en"), "medium");
  assert.equal(getDimensionLabel(25, "en"), "low");
});

test("a szint-címke nem kap vissza dimenzió-függő különesetet", () => {
  // A kivezetett poleAwareDimensionLabel azért kellett, mert a valenciás
  // címke a fordított Emocionalitáson hamis volt. Szint-szónál nincs olyan
  // dimenzió, amelyiken a „magas"/„alacsony" ne lenne igaz – a foltnak nem
  // szabad visszaszivárognia sem itt, sem a profile-content-ben.
  const code = readCode("src/lib/dimension-utils.ts");
  assert.equal(
    /isReverseValenced|REVERSE_DIM_CODE/.test(code),
    false,
    "a szint-címke újra pólus-függő lett – a besorolás megint valenciát hordoz",
  );
  assert.equal(
    /poleAwareDimensionLabel/.test(readCode("src/lib/profile-content.ts")),
    false,
    "a poleAwareDimensionLabel folt visszakerült",
  );
});

test("a szint-címke egyetlen sávja sem hordoz értékelő szót", () => {
  const banned = ["erősség", "gyengeség", "figyelendő", "mérsékelt", "stabil",
    "strength", "weakness", "watch", "moderate", "stable"];
  for (const locale of ["hu", "en"]) {
    for (const score of [10, 45, 85]) {
      const label = getDimensionLabel(score, locale);
      assert.ok(
        !banned.includes(label),
        `${locale}/${score}: „${label}" értékelő szó – a szint-címkének leírónak kell lennie`,
      );
    }
  }
});

// ── getEnvRows F3-hedge: a 65/35↔70/40 egyet-nem-értési sáv ──────────────
// A pólus-ítélet (categorize >65 / <35) és a vizuális tier (≥70 / <40) közti
// sávban (66–69 ill. 30–34) a sor `hedged` jelzést kap — a megjelenítő ekkor
// „Inkább …" szint-szót ír a kemény („Magas") helyett.

const CATS = (over: Partial<Record<string, ProfileCategory>>): Record<string, ProfileCategory> => ({
  H: "medium", E: "medium", X: "medium",
  A: "medium", C: "medium", O: "medium",
  ...over,
});

test("getEnvRows: C=66 (pólus-high, tier-mid) → a Struktúra-sor hedged", () => {
  const rows = getEnvRows(CATS({ C: "high" }), { C: 66 });
  const structure = rows.find((r) => r.key === "structure");
  assert.ok(structure);
  assert.equal(structure.level, "high");
  assert.equal(structure.hedged, true);
});

test("getEnvRows: C=72 (tier-high is) → nincs hedge", () => {
  const rows = getEnvRows(CATS({ C: "high" }), { C: 72 });
  const structure = rows.find((r) => r.key === "structure");
  assert.ok(structure);
  assert.equal(Boolean(structure.hedged), false);
});

test("getEnvRows: X=33 (épphogy pólus-low, tükör-sáv) → hedged; 25-nél nem", () => {
  const hedged = getEnvRows(CATS({ X: "low" }), { X: 33 })
    .find((r) => r.key === "social");
  assert.equal(hedged?.hedged, true);
  const firm = getEnvRows(CATS({ X: "low" }), { X: 25 })
    .find((r) => r.key === "social");
  assert.equal(Boolean(firm?.hedged), false);
});

test("getEnvRows: fordított tengelyű sor (load) – a kiváltó E-pólus sávja dönt", () => {
  // E 67 (high pólus a sávban) → a „Terhelhetőség" low-verdikt hedged.
  const rows = getEnvRows(CATS({ E: "high" }), { E: 67 });
  const load = rows.find((r) => r.key === "load");
  assert.equal(load?.hedged, true);
});

test("getEnvRows: pontszámok nélkül a viselkedés változatlan (nincs hedge)", () => {
  const rows = getEnvRows(CATS({ C: "high" }));
  const structure = rows.find((r) => r.key === "structure");
  assert.ok(structure);
  assert.equal(Boolean(structure.hedged), false);
});

test("results-szótár: nem maradt megjelenő ± / mérési-hiba szám a kulcsokban", () => {
  // A ± jel a felületen mérési-hiba jelölésnek olvasható — 2026-08-11-i
  // termékdöntés szerint sehol nem jelenhet meg. A szótár-szintű guard a
  // visszacsúszást fogja (a kommentek nem részei a fordítás-értékeknek).
  const flat = JSON.stringify(resultsTranslations);
  assert.ok(!flat.includes("±"), "± jel maradt a results-szótárban");
  assert.ok(!flat.includes("{sem}"), "{sem} placeholder maradt a results-szótárban");
});

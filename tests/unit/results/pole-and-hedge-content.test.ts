import test from "node:test";
import assert from "node:assert/strict";
import {
  ARCHETYPE_STORY_ADJ,
  ARCHETYPE_STORY_NOUN,
  buildArchetypeStory,
  getEnvRows,
  poleAwareDimensionLabel,
} from "@/lib/profile-content";
import type { ProfileCategory } from "@/lib/profile-engine";
import { resultsTranslations } from "@/lib/i18n/results";

// Motor-audit v4 tartalom-guardrailek:
//  - FIX 5 (S3-hedge): mérési hibán belüli top-2 sorrendnél az archetípus-
//    történet főnév-only — a második dimenziót színező mondat nem megy ki.
//  - FIX 2 (E fordított skála): az alacsony Emocionalitás címkéje
//    „stabil", nem „figyelendő".
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

test("poleAwareDimensionLabel: E alacsony sávja „stabil”, nem „figyelendő”", () => {
  assert.equal(poleAwareDimensionLabel("E", 25, "hu"), "stabil");
  assert.equal(poleAwareDimensionLabel("E", 25, "en"), "stable");
});

test("poleAwareDimensionLabel: nem-fordított dimenzión a kanonikus címke marad", () => {
  assert.equal(poleAwareDimensionLabel("C", 25, "hu"), "figyelendő");
  assert.equal(poleAwareDimensionLabel("C", 25, "en"), "watch");
  assert.equal(poleAwareDimensionLabel("E", 55, "hu"), "mérsékelt");
  assert.equal(poleAwareDimensionLabel("E", 80, "hu"), "erősség");
  // Kód nélküli (örökség) hívó: kanonikus címke.
  assert.equal(poleAwareDimensionLabel(undefined, 25, "hu"), "figyelendő");
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

test("getEnvRows: fordított tengelyű sor (load) — a kiváltó E-pólus sávja dönt", () => {
  // E 67 (high pólus a sávban) → a „Terhelés-kezelés" low-verdikt hedged.
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

import test from "node:test";
import assert from "node:assert/strict";
import {
  ARCHETYPE_STORY_ADJ,
  ARCHETYPE_STORY_NOUN,
  buildArchetypeStory,
  poleAwareDimensionLabel,
} from "@/lib/profile-content";
import { resultsTranslations } from "@/lib/i18n/results";

// Motor-audit v4 tartalom-guardrailek:
//  - FIX 5 (S3-hedge): mérési hibán belüli top-2 sorrendnél az archetípus-
//    történet főnév-only — a második dimenziót színező mondat nem megy ki.
//  - FIX 2 (RESO fordított skála): az alacsony Emocionalitás címkéje
//    „stabil", nem „figyelendő".
//  - FIX 1 (± kivezetés): a results-szótár egyetlen kulcsa sem tartalmaz
//    megjelenő ± jelet / mérési-hiba számot.

test("buildArchetypeStory: null secondary → főnév-only történet", () => {
  assert.equal(buildArchetypeStory("OPEN", null, "hu"), ARCHETYPE_STORY_NOUN.OPEN.hu);
  assert.equal(buildArchetypeStory("OPEN", null, "en"), ARCHETYPE_STORY_NOUN.OPEN.en);
});

test("buildArchetypeStory: megadott secondary → főnév + színező mondat", () => {
  assert.equal(
    buildArchetypeStory("OPEN", "THOR", "hu"),
    `${ARCHETYPE_STORY_NOUN.OPEN.hu} ${ARCHETYPE_STORY_ADJ.THOR.hu}`,
  );
});

test("buildArchetypeStory: ismeretlen kódra null", () => {
  assert.equal(buildArchetypeStory("NOPE", null, "hu"), null);
  assert.equal(buildArchetypeStory("OPEN", "NOPE", "hu"), null);
});

test("poleAwareDimensionLabel: RESO alacsony sávja „stabil”, nem „figyelendő”", () => {
  assert.equal(poleAwareDimensionLabel("RESO", 25, "hu"), "stabil");
  assert.equal(poleAwareDimensionLabel("RESO", 25, "en"), "stable");
});

test("poleAwareDimensionLabel: nem-fordított dimenzión a kanonikus címke marad", () => {
  assert.equal(poleAwareDimensionLabel("THOR", 25, "hu"), "figyelendő");
  assert.equal(poleAwareDimensionLabel("THOR", 25, "en"), "watch");
  assert.equal(poleAwareDimensionLabel("RESO", 55, "hu"), "mérsékelt");
  assert.equal(poleAwareDimensionLabel("RESO", 80, "hu"), "erősség");
  // Kód nélküli (örökség) hívó: kanonikus címke.
  assert.equal(poleAwareDimensionLabel(undefined, 25, "hu"), "figyelendő");
});

test("results-szótár: nem maradt megjelenő ± / mérési-hiba szám a kulcsokban", () => {
  // A ± jel a felületen mérési-hiba jelölésnek olvasható — 2026-08-11-i
  // termékdöntés szerint sehol nem jelenhet meg. A szótár-szintű guard a
  // visszacsúszást fogja (a kommentek nem részei a fordítás-értékeknek).
  const flat = JSON.stringify(resultsTranslations);
  assert.ok(!flat.includes("±"), "± jel maradt a results-szótárban");
  assert.ok(!flat.includes("{sem}"), "{sem} placeholder maradt a results-szótárban");
});

import test from "node:test";
import assert from "node:assert/strict";
import { t } from "@/lib/i18n";
import { SEO_INTENTS } from "@/lib/seo-intents";
import { TEAM_FAQ_INDEXES, TEAM_TERM_INDEXES } from "@/lib/team-dynamics-pillar";

/**
 * A csapatintelligencia-pillar szerződése (2026-09-05): a kategória gazdája
 * a /team-dynamics, NEM a főoldal — a főoldal a funnel egyéni belépője marad.
 */
test("a csapatintelligencia témát a pillar birtokolja, a főoldal nem versenyez rá", () => {
  const teamTopics: readonly string[] = SEO_INTENTS.teamDynamics.topics;
  const homeTopics: readonly string[] = SEO_INTENTS.home.topics;
  assert.ok(teamTopics.includes("Csapatintelligencia"));
  assert.equal(homeTopics.includes("Csapatintelligencia"), false);
  // Az elsődleges szándék a valós volumenű kifejezés marad.
  assert.equal(SEO_INTENTS.teamDynamics.primary, "csapatdiagnosztika");
  assert.equal(SEO_INTENTS.home.primary, "személyiségteszt magyarul");
});

test("a pillar címe kimondja a kategóriát, a főoldal címe az egyéni belépőt", () => {
  assert.match(t("teamDynamics.metaTitle", "hu"), /csapatintelligencia/i);
  assert.match(t("teamDynamics.metaTitle", "en"), /team intelligence/i);
});

// A FAQPage és a DefinedTermSet JSON-LD ugyanezekből a kulcsokból épül, és
// csak a lapon LÁTHATÓ szöveget ismételheti — ha egy sorszámhoz nincs
// kulcs, a fordító a kulcsnevet adná vissza, és az kerülne a strukturált
// adatba is.
test("minden GYIK- és fogalomtár-sorszámhoz létezik HU és EN szöveg", () => {
  for (const locale of ["hu", "en"] as const) {
    for (const i of TEAM_FAQ_INDEXES) {
      for (const part of ["Q", "A"]) {
        const key = `teamDynamics.faq${part}${i}`;
        const value = t(key, locale);
        assert.notEqual(value, key, `${key} (${locale}) hiányzik`);
        assert.ok(value.length > 10, `${key} (${locale}) túl rövid`);
      }
    }
    for (const i of TEAM_TERM_INDEXES) {
      for (const part of ["Name", "Desc"]) {
        const key = `teamDynamics.term${i}${part}`;
        const value = t(key, locale);
        assert.notEqual(value, key, `${key} (${locale}) hiányzik`);
      }
    }
  }
});

test("a fogalomtár tartalmazza a kategórianevet, és nem használ védjegyet vagy modellnevet", () => {
  const names = TEAM_TERM_INDEXES.map((i) => t(`teamDynamics.term${i}Name`, "hu"));
  assert.ok(names.includes("Csapatintelligencia"));
  const all = [
    ...TEAM_TERM_INDEXES.flatMap((i) => [t(`teamDynamics.term${i}Desc`, "hu"), t(`teamDynamics.term${i}Desc`, "en")]),
    ...TEAM_FAQ_INDEXES.flatMap((i) => [t(`teamDynamics.faqA${i}`, "hu"), t(`teamDynamics.faqA${i}`, "en")]),
  ].join(" ");
  assert.doesNotMatch(all, /Belbin/);
  assert.doesNotMatch(all, /HEXACO/);
});

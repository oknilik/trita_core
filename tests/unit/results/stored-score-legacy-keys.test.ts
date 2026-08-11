import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { extractDimensionScores, extractFacetScores } from "@/lib/scoring";
import { getTestConfig } from "@/lib/questions";
import { HEXACO_ORDER, LEGACY_DIM_CODE_MAP } from "@/lib/hexaco";

// ÖRÖKSÉG-KULCS ŐRSZEM (2026-08-11 regresszió).
//
// A belső dimenziókódok kivezetésekor (INTE/RESO/TEMP/ADAP/THOR/OPEN →
// H/E/X/A/C/O) a kérdésbank `dimensions[].code` mezője HEXACO-betűre váltott,
// a DB-ben TÁROLT score-JSON-ok viszont migráció nélkül maradtak — továbbra is
// az örökség-kulcsokat hordozzák. Több felület nyersen indexelt
// (`scores.dimensions[dim.code]`), így a két névtér sosem találkozott: a
// meglévő usereknél a teljes eredményoldal ÜRESEN renderelt (üres radar, üres
// áttekintő-strip, nincs dimenzió-akkordeon), a megosztott profil, a
// csapat-mintázat, a tag-dossié és a karrier-illeszkedés ugyanígy.
//
// Két szintű védelem:
//  1) VISELKEDÉS — a kanonikus olvasók örökség-kulcsos payloadon a bank
//     `code` mezőivel indexelhető eredményt adnak (a tényleges kapcsolat,
//     amit a bug megtört);
//  2) FORRÁS — a tárolt score-JSON-t olvasó felületek a kanonikus olvasón
//     mennek át, nem nyers `scores.dimensions[…]` indexeléssel.

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

/**
 * Kommentmentes forrás a minta-tiltáshoz: a tiltott alakot MAGYARÁZÓ
 * kommentek (pl. „a nyers scores.dimensions[…] hozzáférés hibás") különben
 * saját magukat buktatnák. Sor- és blokk-kommentet is kiszed.
 */
const readCode = (relative: string) =>
  read(relative)
    .replace(/\/\*[\s\S]*?\*\//g, " ")
    .replace(/\/\/.*$/gm, " ");

/** Örökség-kulcsú tárolt sor, ahogy 2026-08-11 előtt mentettük. */
const legacyStoredScores = {
  type: "likert",
  dimensions: { INTE: 71, RESO: 38, TEMP: 64, ADAP: 55, THOR: 82, OPEN: 47, I: 60 },
  facets: {
    INTE: { sincerity: 70, fairness: 74 },
    THOR: { organization: 85, diligence: 79 },
  },
  answers: [{ questionId: 1, value: 3 }],
  questionCount: 60,
};

test("örökség-kulcsos tárolt sor a bank HEXACO-kódjaival indexelhető", () => {
  const dims = extractDimensionScores(legacyStoredScores);
  assert.ok(dims, "az örökség-sorból nem jött vissza dimenzió-pontszám");

  // A tényleges kapcsolat: a kérdésbank code-jai (ezekkel iterál minden
  // eredmény-felület) találatot adnak a normalizált mapben.
  const config = getTestConfig("TRITAN", "hu");
  const mainDims = config.dimensions.filter((d) => d.code !== "I");
  assert.equal(mainDims.length, HEXACO_ORDER.length);
  for (const dim of mainDims) {
    assert.equal(
      typeof dims[dim.code],
      "number",
      `a(z) ${dim.code} dimenzió üres maradt — a felület üres profilt renderelne`,
    );
  }

  // A kiegészítő altruizmus-skála átmegy (nem fő dimenzió, de valós adat).
  assert.equal(dims.I, 60);
  // Nyers örökség-kód nem szivároghat a kimenetbe.
  for (const legacy of Object.keys(LEGACY_DIM_CODE_MAP)) {
    assert.equal(legacy in dims, false, `${legacy} örökség-kód a kimenetben`);
  }
  // A kísérő kulcsok (answers, questionCount, type) nem pontszámok.
  assert.equal("questionCount" in dims, false);
  assert.equal("answers" in dims, false);
});

test("örökség-kulcsos facet-bontás a HEXACO külső kulcson érhető el", () => {
  const facets = extractFacetScores(legacyStoredScores);
  assert.ok(facets, "az örökség-sorból nem jött vissza facet-bontás");
  // INTE → H, THOR → C; a facet-kódok változatlanok.
  assert.deepEqual(facets.H, { sincerity: 70, fairness: 74 });
  assert.deepEqual(facets.C, { organization: 85, diligence: 79 });
  assert.equal("INTE" in facets, false);
  assert.equal("THOR" in facets, false);
});

test("a kanonikus és az örökség-alak azonos profilt ad", () => {
  const canonical = extractDimensionScores({
    type: "likert",
    dimensions: { H: 71, E: 38, X: 64, A: 55, C: 82, O: 47, I: 60 },
  });
  assert.deepEqual(extractDimensionScores(legacyStoredScores), canonical);
});

// ── Forrás-szintű szerződés ────────────────────────────────────────────────
//
// Minden felület, amely TÁROLT score-JSON-t olvas, a kanonikus olvasón megy
// át. A nyers `scores.dimensions[…]` / `.facets[…]` indexelés örökség-soron
// üres képet ad — pontosan ez volt a regresszió.
const STORED_SCORE_READERS = [
  "src/app/(app)/profile/results/page.tsx",
  "src/app/(app)/share/[token]/page.tsx",
  "src/app/(app)/career/page.tsx",
  "src/app/(app)/interaction/page.tsx",
  "src/app/api/team/[id]/pattern/route.ts",
  "src/lib/share-og.ts",
  "src/lib/member-dossier.server.ts",
  "src/lib/notifications/sweep.ts",
  "src/lib/career/person.ts",
  "src/lib/team-stats.ts",
  "src/lib/org-stats.ts",
  "src/lib/manager-cockpit.ts",
];

test("a tárolt score-JSON olvasói a kanonikus olvasót használják", () => {
  for (const file of STORED_SCORE_READERS) {
    const source = read(file);
    assert.ok(
      source.includes("extractDimensionScores"),
      `${file}: nem a kanonikus extractDimensionScores-ból olvas`,
    );
  }
});

test("nyers scores.dimensions / scores.facets indexelés nem tér vissza", () => {
  // Nyers `<bármi>.dimensions[…]` és `<bármi>.facets?.[…]` indexelés — a
  // normalizálás megkerülése. (A `.dimensions` puszta ÁTADÁSA rendben van:
  // a tilalom az indexelésre szól, mert ott dől el a kulcs-egyezés.)
  const rawDimIndex = /\.dimensions\s*\??\.?\[/;
  const rawFacetIndex = /\.facets\s*\??\.?\[/;
  for (const file of STORED_SCORE_READERS) {
    const source = readCode(file);
    assert.equal(
      rawDimIndex.test(source),
      false,
      `${file}: nyers dimensions-indexelés — örökség-soron üres profilt ad`,
    );
    assert.equal(
      rawFacetIndex.test(source),
      false,
      `${file}: nyers facets-indexelés — örökség-soron üres facet-listát ad`,
    );
  }
});

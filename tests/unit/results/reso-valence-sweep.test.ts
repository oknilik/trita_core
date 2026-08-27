import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  deficitSlotEligible,
  strengthSlotEligible,
  isReverseValenced,
} from "@/lib/score-valence";
import {
  SOLO_DIM_NARRATIVES,
  SOLO_DIM_SUMMARIES,
  SOLO_DIM_PRESSURE,
  SOLO_DIM_ROLE_MODIFIERS,
  SOLO_DIM_ROLE_TEXTS,
  ARCHETYPE_STORY_NOUN,
  ARCHETYPE_STORY_ADJ,
  COLLAB_CLICK,
  COLLAB_FRICTION,
  COLLAB_NEEDS,
  DIMENSION_GROWTH_TIPS,
  RESOLUTION_NARRATIVES,
} from "@/lib/profile-content";
import {
  DIMENSION_STRENGTH_VERBS,
  DIMENSION_WEAK_VERBS,
  DIMENSION_STRENGTH_DESCS,
  DIMENSION_WATCH_DESCS,
} from "@/lib/dimension-insights";
import { SOLO_ROLE_TAGS } from "@/lib/workstyle-content";
import {
  getStrengthInsight,
  getWatchAreaInsight,
  getDiversityInsight,
} from "@/lib/team-insights";
import { SAME_DIMENSION_ATOMS } from "@/lib/interaction-atoms";
import {
  PERSONALITY_TYPE_PARTS,
  resolvePersonalityTypeLabel,
} from "@/lib/personality-type";
import { tritanConfig } from "@/lib/questions/tritan";

// ─────────────────────────────────────────────────────────────────────
// Emocionalitás (E) valencia-söprés — 2026-08-11-i termékdöntés
// guardrailjei (kanonikus kapu: src/lib/score-valence.ts).
//
// A döntés: a E MINDKÉT pólusa, MINDKÉT felület-típuson valencia-mentes
// (nem erősség, nem hiányosság — jellemző), ÉS a szókincse a mért
// konstruktumhoz igazodik: a skála facetjei a Félelem / Szorongás /
// Dependencia / Érzelmi kötődés — empátiát, törődést, „érzelmi mélységet"
// mint erényt NEM mérnek.
//
// A visszacsúszás fő kockázata itt nem a logika, hanem a SZÖVEG: az előző
// körök tanulsága, hogy egy felületen javított megfogalmazás a testvér-
// felületeken bent maradt. Ezért a tesztek nagy része tartalom-guard.
// ─────────────────────────────────────────────────────────────────────

const OTHER_DIMS = ["H", "X", "A", "C", "O"] as const;
/** Az empátia-túlígéret bármely nyelvi alakja (HU/EN, kis/nagybetű). */
const EMPATHY_RE = /empat|empát|emotional depth|érzelmi mélység/i;

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

// ── 1. A kanonikus kapu ─────────────────────────────────────────────────

test("score-valence: a E egyik slotba sem kerülhet – mindkét felület-típuson", () => {
  assert.equal(strengthSlotEligible("E", "self"), false);
  assert.equal(strengthSlotEligible("E", "evaluative"), false);
  assert.equal(deficitSlotEligible("E"), false);
  assert.equal(isReverseValenced("E"), true);
});

test("score-valence: a többi dimenzió mindkét slotba kerülhet", () => {
  for (const dim of OTHER_DIMS) {
    assert.equal(strengthSlotEligible(dim, "self"), true, `${dim} self`);
    assert.equal(strengthSlotEligible(dim, "evaluative"), true, `${dim} eval`);
    assert.equal(deficitSlotEligible(dim), true, `${dim} deficit`);
  }
});

// ── 2. Copy-guard: a magas E-hoz nem tapadhat empátia-ígéret ──────────
// Grep-jellegű őr a tartalom-térképek E-sorain (mindkét pólus, HU+EN).

/** E-hoz tartozó, felületre kimenő szövegek – minden térképből. */
function resoCopyStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const push = (where: string, value: unknown) => {
    if (typeof value === "string") out.push({ where, text: value });
    else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) push(`${where}.${k}`, v);
    }
  };

  push("DIMENSION_STRENGTH_VERBS.E", DIMENSION_STRENGTH_VERBS.E);
  push("DIMENSION_WEAK_VERBS.E", DIMENSION_WEAK_VERBS.E);
  push("DIMENSION_STRENGTH_DESCS.E", DIMENSION_STRENGTH_DESCS.E);
  push("DIMENSION_WATCH_DESCS.E", DIMENSION_WATCH_DESCS.E);
  push("ARCHETYPE_STORY_NOUN.E", ARCHETYPE_STORY_NOUN.E);
  push("ARCHETYPE_STORY_ADJ.E", ARCHETYPE_STORY_ADJ.E);
  push("PERSONALITY_TYPE_PARTS.E", PERSONALITY_TYPE_PARTS.E);
  push("DIMENSION_GROWTH_TIPS.E", DIMENSION_GROWTH_TIPS.E);

  for (const key of ["E_high", "E_low"]) {
    push(`SOLO_DIM_NARRATIVES.${key}`, SOLO_DIM_NARRATIVES[key]);
    push(`SOLO_DIM_SUMMARIES.${key}`, SOLO_DIM_SUMMARIES[key]);
    push(`SOLO_DIM_PRESSURE.${key}`, SOLO_DIM_PRESSURE[key]);
    push(`SOLO_DIM_ROLE_MODIFIERS.${key}`, SOLO_DIM_ROLE_MODIFIERS[key]);
    push(`SOLO_DIM_ROLE_TEXTS.${key}`, SOLO_DIM_ROLE_TEXTS[key]);
    push(`COLLAB_CLICK.${key}`, COLLAB_CLICK[key]);
    push(`COLLAB_FRICTION.${key}`, COLLAB_FRICTION[key]);
    push(`COLLAB_NEEDS.${key}`, COLLAB_NEEDS[key]);
    push(`SOLO_ROLE_TAGS.hu.${key}`, SOLO_ROLE_TAGS.hu?.[key]);
    push(`SOLO_ROLE_TAGS.en.${key}`, SOLO_ROLE_TAGS.en?.[key]);
  }

  // A E-t is tartalmazó tension-párok narratívái (profile-engine
  // TENSION_PAIRS: E high → supportedVisibility / structuredStability /
  // safeExperimentation; E low → resilientLeader / calmExecution /
  // exploratoryAnalyst).
  for (const key of [
    "supportedVisibility",
    "structuredStability",
    "safeExperimentation",
    "resilientLeader",
    "calmExecution",
    "exploratoryAnalyst",
  ]) {
    push(`RESOLUTION_NARRATIVES.${key}`, RESOLUTION_NARRATIVES[key]);
    push(`SOLO_DIM_ROLE_TEXTS.${key}`, SOLO_DIM_ROLE_TEXTS[key]);
  }

  // Csapat-felület (HU-only szövegek).
  out.push({ where: "team-insights.getStrengthInsight", text: getStrengthInsight("E") });
  out.push({ where: "team-insights.getWatchAreaInsight", text: getWatchAreaInsight("E") });
  out.push({ where: "team-insights.getDiversityInsight", text: getDiversityInsight("E") });

  // Interakció-atomok: a E-t érintő azonos-dimenziós párok.
  for (const atom of SAME_DIMENSION_ATOMS) {
    if (atom.a.dim !== "E" && atom.b.dim !== "E") continue;
    push(`interaction-atoms.${atom.id}.view`, atom.view);
    if (atom.viewB) push(`interaction-atoms.${atom.id}.viewB`, atom.viewB);
  }

  return out;
}

test("E-szövegek: sehol nem ígérünk empátiát / „érzelmi mélységet”", () => {
  const offenders = resoCopyStrings().filter(({ text }) => EMPATHY_RE.test(text));
  assert.deepEqual(
    offenders.map((o) => `${o.where}: ${o.text}`),
    [],
    "empátia-keretezés maradt a E-szövegekben (2026-08-11 valencia-döntés)",
  );
});

test("E-szövegek: HU és EN ugyanannyi tételt tartalmaz (nyelvi drift-őr)", () => {
  const byLang = resoCopyStrings().reduce(
    (acc, { where }) => {
      if (where.endsWith(".hu") || where.includes(".hu.")) acc.hu += 1;
      if (where.endsWith(".en") || where.includes(".en.")) acc.en += 1;
      return acc;
    },
    { hu: 0, en: 0 },
  );
  assert.equal(byLang.hu, byLang.en, "HU/EN paritás sérült a E-térképekben");
});

// ── 3. Kétoldalú pólus-próza ────────────────────────────────────────────
// A magas pólus nem lehet tisztán nyereség-mondat, az alacsony nem lehet
// tisztán hiány-mondat: mindkettőben ott a hozadék ÉS az ára.

/** A magas pólus árát jelző szavak (HU/EN). */
const HIGH_COST_RE =
  /terh|teher|visz.{0,12}mag[áa]|fárad|merül|carry|carries|load|drain|tire|stays with/i;
/** Az alacsony pólus árát jelző szavak (HU/EN). */
const LOW_COST_RE =
  /ritkábban|távolságtartás|nem jut|láthatatlan|kevésbé|természetesebb, mint|distance|less often|less likely|invisible|miss|comes more naturally than/i;

test("pólus-próza: a magas E minden fő szövegében ott az ára is", () => {
  const highTexts: [string, string][] = [
    ["DIMENSION_STRENGTH_VERBS.hu", DIMENSION_STRENGTH_VERBS.E.hu],
    ["DIMENSION_STRENGTH_VERBS.en", DIMENSION_STRENGTH_VERBS.E.en],
    ["DIMENSION_STRENGTH_DESCS.hu", DIMENSION_STRENGTH_DESCS.E.hu],
    ["DIMENSION_STRENGTH_DESCS.en", DIMENSION_STRENGTH_DESCS.E.en],
    ["ARCHETYPE_STORY_NOUN.hu", ARCHETYPE_STORY_NOUN.E.hu],
    ["ARCHETYPE_STORY_NOUN.en", ARCHETYPE_STORY_NOUN.E.en],
    ["SOLO_DIM_NARRATIVES.E_high.hu", SOLO_DIM_NARRATIVES.E_high.hu],
    ["SOLO_DIM_NARRATIVES.E_high.en", SOLO_DIM_NARRATIVES.E_high.en],
  ];
  for (const [where, text] of highTexts) {
    assert.ok(HIGH_COST_RE.test(text), `${where}: hiányzik a magas pólus ára – "${text}"`);
  }
});

test("pólus-próza: az alacsony E nincs hiányként keretezve, de az ára kimondott", () => {
  const lowTexts: [string, string][] = [
    ["DIMENSION_WEAK_VERBS.hu", DIMENSION_WEAK_VERBS.E.hu],
    ["DIMENSION_WEAK_VERBS.en", DIMENSION_WEAK_VERBS.E.en],
    ["DIMENSION_WATCH_DESCS.hu", DIMENSION_WATCH_DESCS.E.hu],
    ["DIMENSION_WATCH_DESCS.en", DIMENSION_WATCH_DESCS.E.en],
    ["SOLO_DIM_NARRATIVES.E_low.hu", SOLO_DIM_NARRATIVES.E_low.hu],
    ["SOLO_DIM_NARRATIVES.E_low.en", SOLO_DIM_NARRATIVES.E_low.en],
  ];
  for (const [where, text] of lowTexts) {
    assert.ok(LOW_COST_RE.test(text), `${where}: hiányzik az alacsony pólus ára – "${text}"`);
  }
  // A kivezetett hiány-keretezés nem térhet vissza.
  const flat = JSON.stringify([
    DIMENSION_WEAK_VERBS.E,
    DIMENSION_WATCH_DESCS.E,
    SOLO_DIM_NARRATIVES.E_low,
    SOLO_DIM_SUMMARIES.E_low,
  ]);
  assert.ok(
    !/az érzelmi bevonódás kevésbé természetes tereped/.test(flat),
    "visszatért a kivezetett hiány-keretezés az alacsony E-nál",
  );
});

// ── 4. Archetípus-címke ─────────────────────────────────────────────────

test("archetípus: a E címkéje a ráhangolódás-család, nem az „empata”", () => {
  assert.equal(PERSONALITY_TYPE_PARTS.E.noun.hu, "ráhangolódó");
  assert.equal(PERSONALITY_TYPE_PARTS.E.noun.en, "Signal Reader");
  assert.equal(PERSONALITY_TYPE_PARTS.E.adjective.hu, "ráhangolódó");
  assert.equal(PERSONALITY_TYPE_PARTS.E.adjective.en, "Attuned");
});

test("archetípus: a közös resolver adja a címkét a főnévi ÉS a melléknévi helyen", () => {
  assert.equal(resolvePersonalityTypeLabel("E", "X", "hu"), "Energikus ráhangolódó");
  assert.equal(resolvePersonalityTypeLabel("E", "X", "en"), "Energetic Signal Reader");
  assert.equal(resolvePersonalityTypeLabel("X", "E", "hu"), "Ráhangolódó hajtóerő");
  assert.equal(resolvePersonalityTypeLabel("X", "E", "en"), "Attuned Driving Force");
});

// ── 5. Felület-szintű szerződések (forrás-guard) ────────────────────────
// A page/komponens-fájlok unit-rétegben nem hívhatók (Clerk/Prisma, JSX);
// a minta a motor-audit-v6-surfaces teszté: forrás-szintű állítás.

test("csapat-felület: a „Csapat erőssége” kártya a kanonikus kapun megy", () => {
  const source = read("src/components/manager/TeamInsights.tsx");
  assert.ok(
    source.includes("strengthSlotEligible"),
    "a TeamInsights erősség-kártyája nem a kanonikus valencia-kapun szűr",
  );
  assert.ok(
    !/hu: "Empatikus/.test(source),
    "visszatért az „Empatikus … csapat” erény-állítás a csapat-felületen",
  );
});

test("jelölt-felület: a valencia-szűrés a kanonikus kapuból jön, nem kézi E-literálból", () => {
  const source = read("src/app/(app)/hiring/[orgId]/candidates/[inviteId]/page.tsx");
  // A sor-kommentek (köztük ez a döntés-indoklás) nem részei a viselkedésnek
  // és nem mennek ki a felületre – a guard a kód-törzsre néz.
  const code = source.replace(/\/\/.*$/gm, "");
  assert.ok(
    code.includes("strengthSlotEligible") && code.includes("deficitSlotEligible"),
    "a jelölt-oldal nem a kanonikus valencia-kapun szűr",
  );
  assert.ok(
    !/d !== "E"/.test(code),
    "visszatért a kézi `d !== \"E\"` literál a jelölt-oldalon",
  );
  assert.ok(!EMPATHY_RE.test(code), "empátia-keretezés maradt a jelölt-oldal szövegeiben");
});

test("riport-view-model: az erősség- és deficit-slotok a kanonikus kapun mennek", () => {
  // 2026-08-18: a PDF tartalmi összeállítása a közös view-modelbe költözött
  // (a korábbi PlusFacetsPage kivezetve), ezért a kapu-szerződés is ott él —
  // egy helyen a web, a PDF és a persona-dosszié számára.
  const source = read("src/lib/profile-report-view-model.ts");
  assert.ok(
    source.includes('strengthSlotEligible(d.code, "self")'),
    "az erősség-lista nem a kanonikus erősség-kapun szűr",
  );
  assert.ok(
    source.includes("deficitSlotEligible(d.code)"),
    "a figyelendő-lista nem a kanonikus deficit-kapun szűr",
  );
  // Üres-szekció veszély: ha nem marad ≥70-es dimenzió, a kiegyensúlyozott-
  // profil szöveg megy ki — nem üres felsorolás.
  assert.ok(
    source.includes('t("results.balancedProfile", locale)'),
    "hiányzik a kiegyensúlyozott-profil fallback a bullet-építőből",
  );
});

test("hőtérkép: az Emocionalitás skála-leírása a mért facetekhez igazodik", () => {
  const source = read("src/components/manager/TeamHeatmap.tsx");
  assert.ok(
    !/hu: "Érzelmi érzékenység, szorongásra való hajlam, empátia mások iránt"/.test(source),
    "visszatért az „empátia mások iránt” a hőtérkép skála-leírásába",
  );
});

// ─────────────────────────────────────────────────────────────────────
// 6. Barátságosság (A) — ugyanaz az elv, kiterjesztve (2026-08-11)
//
// Az A facetjei: Megbocsátás · Gyengédség · Rugalmasság · Türelem. A skála
// mások hibáival szembeni toleranciát, enyhe ítéletet, kompromisszum-
// készséget és indulat-kontrollt mér — empátiát NEM. Ezért a magas A-hoz
// nem tapadhat empátia-ígéret, az alacsony A pedig nem keretezhető
// „empátia-hiányként" vagy hidegségként: az alacsony pólus hozadéka az
// őszinte visszajelzés és a határozott képviselet.
//
// A skála-LEÍRÁS (tritan.ts description) irodalom-hű maradhat — az a
// konstruktum definíciója. A VERDIKT-szövegekre (insights + minden felületi
// térkép) fut a guard.
// ─────────────────────────────────────────────────────────────────────

/** A-hoz tartozó, felületre kimenő szövegek — minden térképből. */
function adapCopyStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const push = (where: string, value: unknown) => {
    if (typeof value === "string") out.push({ where, text: value });
    else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) push(`${where}.${k}`, v);
    }
  };

  push("DIMENSION_STRENGTH_VERBS.A", DIMENSION_STRENGTH_VERBS.A);
  push("DIMENSION_WEAK_VERBS.A", DIMENSION_WEAK_VERBS.A);
  push("DIMENSION_STRENGTH_DESCS.A", DIMENSION_STRENGTH_DESCS.A);
  push("DIMENSION_WATCH_DESCS.A", DIMENSION_WATCH_DESCS.A);
  push("ARCHETYPE_STORY_NOUN.A", ARCHETYPE_STORY_NOUN.A);
  push("ARCHETYPE_STORY_ADJ.A", ARCHETYPE_STORY_ADJ.A);
  push("PERSONALITY_TYPE_PARTS.A", PERSONALITY_TYPE_PARTS.A);
  push("DIMENSION_GROWTH_TIPS.A", DIMENSION_GROWTH_TIPS.A);

  for (const key of ["A_high", "A_low"]) {
    push(`SOLO_DIM_NARRATIVES.${key}`, SOLO_DIM_NARRATIVES[key]);
    push(`SOLO_DIM_SUMMARIES.${key}`, SOLO_DIM_SUMMARIES[key]);
    push(`SOLO_DIM_PRESSURE.${key}`, SOLO_DIM_PRESSURE[key]);
    push(`SOLO_DIM_ROLE_MODIFIERS.${key}`, SOLO_DIM_ROLE_MODIFIERS[key]);
    push(`SOLO_DIM_ROLE_TEXTS.${key}`, SOLO_DIM_ROLE_TEXTS[key]);
    push(`COLLAB_CLICK.${key}`, COLLAB_CLICK[key]);
    push(`COLLAB_FRICTION.${key}`, COLLAB_FRICTION[key]);
    push(`COLLAB_NEEDS.${key}`, COLLAB_NEEDS[key]);
    push(`SOLO_ROLE_TAGS.hu.${key}`, SOLO_ROLE_TAGS.hu?.[key]);
    push(`SOLO_ROLE_TAGS.en.${key}`, SOLO_ROLE_TAGS.en?.[key]);
  }

  // Csapat-felület (HU-only szövegek).
  out.push({ where: "team-insights.getStrengthInsight", text: getStrengthInsight("A") });
  out.push({ where: "team-insights.getWatchAreaInsight", text: getWatchAreaInsight("A") });
  out.push({ where: "team-insights.getDiversityInsight", text: getDiversityInsight("A") });

  // Interakció-atomok: az A-t érintő azonos-dimenziós párok.
  for (const atom of SAME_DIMENSION_ATOMS) {
    if (atom.a.dim !== "A" && atom.b.dim !== "A") continue;
    push(`interaction-atoms.${atom.id}.view`, atom.view);
    if (atom.viewB) push(`interaction-atoms.${atom.id}.viewB`, atom.viewB);
  }

  // Kérdésbank: az akkordeon verdikt-hármasa (low/mid/high) – a description
  // SZÁNDÉKOSAN kimarad (irodalom-hű konstruktum-definíció).
  const adapDim = tritanConfig.dimensions.find((d) => d.code === "A");
  assert.ok(adapDim, "nincs A dimenzió a kérdésbankban");
  push("tritan.A.insights", adapDim.insights);
  push("tritan.A.insightsByLocale", adapDim.insightsByLocale);

  return out;
}

test("A-szövegek: sehol nem ígérünk empátiát (2026-08-11 kiterjesztés)", () => {
  const offenders = adapCopyStrings().filter(({ text }) => EMPATHY_RE.test(text));
  assert.deepEqual(
    offenders.map((o) => `${o.where}: ${o.text}`),
    [],
    "empátia-keretezés került az A-szövegekbe – a skála (Megbocsátás/Gyengédség/Rugalmasság/Türelem) ezt nem méri",
  );
});

test("A-szövegek: HU és EN ugyanannyi tételt tartalmaz (nyelvi drift-őr)", () => {
  const byLang = adapCopyStrings().reduce(
    (acc, { where }) => {
      if (where.endsWith(".hu") || where.includes(".hu.")) acc.hu += 1;
      if (where.endsWith(".en") || where.includes(".en.")) acc.en += 1;
      return acc;
    },
    { hu: 0, en: 0 },
  );
  assert.equal(byLang.hu, byLang.en, "HU/EN paritás sérült az A-térképekben");
});

/** A-specifikus hiány-keretezés: „hideg", „érzéketlen", „nem törődik". */
const A_LOW_DEFICIT_RE =
  /hideg(?!en hagy)|érzéketlen|nem törődik|rideg|\bcold\b|uncaring|callous|insensitive/i;

test("A alacsony pólus: nincs hidegség-/érzéketlenség-keretezés", () => {
  const offenders = adapCopyStrings().filter(
    ({ where, text }) =>
      (where.includes("A_low") ||
        where.includes("WEAK") ||
        where.includes("WATCH") ||
        where.includes("insights")) &&
      A_LOW_DEFICIT_RE.test(text),
  );
  assert.deepEqual(
    offenders.map((o) => `${o.where}: ${o.text}`),
    [],
    "az alacsony A hiányként (hidegség/érzéketlenség) van keretezve",
  );
});

test("A akkordeon-verdikt: mindkét pólus kétoldalú (hozadék ÉS ár)", () => {
  const adapDim = tritanConfig.dimensions.find((d) => d.code === "A");
  const byLocale = adapDim?.insightsByLocale;
  assert.ok(byLocale, "nincs lokalizált A insight-hármas");
  const both = /Cserébe|In exchange/;
  for (const locale of ["hu", "en"] as const) {
    const bands = byLocale[locale];
    assert.ok(bands, `hiányzik a(z) ${locale} A insight-hármas`);
    for (const band of ["low", "high"] as const) {
      assert.ok(
        both.test(bands[band]),
        `tritan.A.insightsByLocale.${locale}.${band}: hiányzik a másik oldal – "${bands[band]}"`,
      );
    }
  }
});

test("csapat-felület: az A-sáv szövegeiben nincs empátia-ígéret", () => {
  // A sor-kommentek (köztük a döntés-indoklás, ami idézi a kivezetett
  // mondatot) nem mennek ki a felületre – a guard a kód-törzsre néz.
  const code = read("src/components/manager/TeamInsights.tsx").replace(/\/\/.*$/gm, "");
  assert.ok(
    !/erős harmónia és empátia|strong harmony and empathy/.test(code),
    "visszatért az „erős harmónia és empátia” állítás a magas A-csapatátlaghoz",
  );
});

test("hőtérkép: a Barátságosság skála-leírása a mért facetekhez igazodik", () => {
  const source = read("src/components/manager/TeamHeatmap.tsx");
  const adapBlock = source.slice(source.indexOf("  A: {"), source.indexOf("  C: {"));
  assert.ok(adapBlock.length > 0, "nem található az A skála-leírás a hőtérképen");
  assert.ok(!EMPATHY_RE.test(adapBlock), "empátia-keretezés került az A skála-leírásába");
});

test("mintázat-katalógus: a kohézió-tengely (A+H) nem empátiaként íródik le", () => {
  const source = read("src/lib/pattern-data.ts");
  const code = source.replace(/\/\/.*$/gm, "");
  assert.ok(
    !EMPATHY_RE.test(code),
    "empátia-keretezés maradt a mintázat-katalógusban (a kohézió-tengely A+H átlag, nem empátia-mérés)",
  );
});

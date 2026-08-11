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

// ─────────────────────────────────────────────────────────────────────
// Emocionalitás (RESO) valencia-söprés — 2026-08-11-i termékdöntés
// guardrailjei (kanonikus kapu: src/lib/score-valence.ts).
//
// A döntés: a RESO MINDKÉT pólusa, MINDKÉT felület-típuson valencia-mentes
// (nem erősség, nem hiányosság — jellemző), ÉS a szókincse a mért
// konstruktumhoz igazodik: a skála facetjei a Félelem / Szorongás /
// Dependencia / Érzelmi kötődés — empátiát, törődést, „érzelmi mélységet"
// mint erényt NEM mérnek.
//
// A visszacsúszás fő kockázata itt nem a logika, hanem a SZÖVEG: az előző
// körök tanulsága, hogy egy felületen javított megfogalmazás a testvér-
// felületeken bent maradt. Ezért a tesztek nagy része tartalom-guard.
// ─────────────────────────────────────────────────────────────────────

const OTHER_DIMS = ["INTE", "TEMP", "ADAP", "THOR", "OPEN"] as const;
/** Az empátia-túlígéret bármely nyelvi alakja (HU/EN, kis/nagybetű). */
const EMPATHY_RE = /empat|empát|emotional depth|érzelmi mélység/i;

const read = (relative: string) =>
  readFileSync(join(process.cwd(), relative), "utf8");

// ── 1. A kanonikus kapu ─────────────────────────────────────────────────

test("score-valence: a RESO egyik slotba sem kerülhet — mindkét felület-típuson", () => {
  assert.equal(strengthSlotEligible("RESO", "self"), false);
  assert.equal(strengthSlotEligible("RESO", "evaluative"), false);
  assert.equal(deficitSlotEligible("RESO"), false);
  assert.equal(isReverseValenced("RESO"), true);
});

test("score-valence: a többi dimenzió mindkét slotba kerülhet", () => {
  for (const dim of OTHER_DIMS) {
    assert.equal(strengthSlotEligible(dim, "self"), true, `${dim} self`);
    assert.equal(strengthSlotEligible(dim, "evaluative"), true, `${dim} eval`);
    assert.equal(deficitSlotEligible(dim), true, `${dim} deficit`);
  }
});

// ── 2. Copy-guard: a magas RESO-hoz nem tapadhat empátia-ígéret ──────────
// Grep-jellegű őr a tartalom-térképek RESO-sorain (mindkét pólus, HU+EN).

/** RESO-hoz tartozó, felületre kimenő szövegek — minden térképből. */
function resoCopyStrings(): { where: string; text: string }[] {
  const out: { where: string; text: string }[] = [];
  const push = (where: string, value: unknown) => {
    if (typeof value === "string") out.push({ where, text: value });
    else if (value && typeof value === "object") {
      for (const [k, v] of Object.entries(value)) push(`${where}.${k}`, v);
    }
  };

  push("DIMENSION_STRENGTH_VERBS.RESO", DIMENSION_STRENGTH_VERBS.RESO);
  push("DIMENSION_WEAK_VERBS.RESO", DIMENSION_WEAK_VERBS.RESO);
  push("DIMENSION_STRENGTH_DESCS.RESO", DIMENSION_STRENGTH_DESCS.RESO);
  push("DIMENSION_WATCH_DESCS.RESO", DIMENSION_WATCH_DESCS.RESO);
  push("ARCHETYPE_STORY_NOUN.RESO", ARCHETYPE_STORY_NOUN.RESO);
  push("ARCHETYPE_STORY_ADJ.RESO", ARCHETYPE_STORY_ADJ.RESO);
  push("PERSONALITY_TYPE_PARTS.RESO", PERSONALITY_TYPE_PARTS.RESO);
  push("DIMENSION_GROWTH_TIPS.RESO", DIMENSION_GROWTH_TIPS.RESO);

  for (const key of ["RESO_high", "RESO_low"]) {
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

  // A RESO-t is tartalmazó tension-párok narratívái (profile-engine
  // TENSION_PAIRS: RESO high → supportedVisibility / structuredStability /
  // safeExperimentation; RESO low → resilientLeader / calmExecution /
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
  out.push({ where: "team-insights.getStrengthInsight", text: getStrengthInsight("RESO") });
  out.push({ where: "team-insights.getWatchAreaInsight", text: getWatchAreaInsight("RESO") });
  out.push({ where: "team-insights.getDiversityInsight", text: getDiversityInsight("RESO") });

  // Interakció-atomok: a RESO-t érintő azonos-dimenziós párok.
  for (const atom of SAME_DIMENSION_ATOMS) {
    if (atom.a.dim !== "RESO" && atom.b.dim !== "RESO") continue;
    push(`interaction-atoms.${atom.id}.view`, atom.view);
    if (atom.viewB) push(`interaction-atoms.${atom.id}.viewB`, atom.viewB);
  }

  return out;
}

test("RESO-szövegek: sehol nem ígérünk empátiát / „érzelmi mélységet”", () => {
  const offenders = resoCopyStrings().filter(({ text }) => EMPATHY_RE.test(text));
  assert.deepEqual(
    offenders.map((o) => `${o.where}: ${o.text}`),
    [],
    "empátia-keretezés maradt a RESO-szövegekben (2026-08-11 valencia-döntés)",
  );
});

test("RESO-szövegek: HU és EN ugyanannyi tételt tartalmaz (nyelvi drift-őr)", () => {
  const byLang = resoCopyStrings().reduce(
    (acc, { where }) => {
      if (where.endsWith(".hu") || where.includes(".hu.")) acc.hu += 1;
      if (where.endsWith(".en") || where.includes(".en.")) acc.en += 1;
      return acc;
    },
    { hu: 0, en: 0 },
  );
  assert.equal(byLang.hu, byLang.en, "HU/EN paritás sérült a RESO-térképekben");
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

test("pólus-próza: a magas RESO minden fő szövegében ott az ára is", () => {
  const highTexts: [string, string][] = [
    ["DIMENSION_STRENGTH_VERBS.hu", DIMENSION_STRENGTH_VERBS.RESO.hu],
    ["DIMENSION_STRENGTH_VERBS.en", DIMENSION_STRENGTH_VERBS.RESO.en],
    ["DIMENSION_STRENGTH_DESCS.hu", DIMENSION_STRENGTH_DESCS.RESO.hu],
    ["DIMENSION_STRENGTH_DESCS.en", DIMENSION_STRENGTH_DESCS.RESO.en],
    ["ARCHETYPE_STORY_NOUN.hu", ARCHETYPE_STORY_NOUN.RESO.hu],
    ["ARCHETYPE_STORY_NOUN.en", ARCHETYPE_STORY_NOUN.RESO.en],
    ["SOLO_DIM_NARRATIVES.RESO_high.hu", SOLO_DIM_NARRATIVES.RESO_high.hu],
    ["SOLO_DIM_NARRATIVES.RESO_high.en", SOLO_DIM_NARRATIVES.RESO_high.en],
  ];
  for (const [where, text] of highTexts) {
    assert.ok(HIGH_COST_RE.test(text), `${where}: hiányzik a magas pólus ára — "${text}"`);
  }
});

test("pólus-próza: az alacsony RESO nincs hiányként keretezve, de az ára kimondott", () => {
  const lowTexts: [string, string][] = [
    ["DIMENSION_WEAK_VERBS.hu", DIMENSION_WEAK_VERBS.RESO.hu],
    ["DIMENSION_WEAK_VERBS.en", DIMENSION_WEAK_VERBS.RESO.en],
    ["DIMENSION_WATCH_DESCS.hu", DIMENSION_WATCH_DESCS.RESO.hu],
    ["DIMENSION_WATCH_DESCS.en", DIMENSION_WATCH_DESCS.RESO.en],
    ["SOLO_DIM_NARRATIVES.RESO_low.hu", SOLO_DIM_NARRATIVES.RESO_low.hu],
    ["SOLO_DIM_NARRATIVES.RESO_low.en", SOLO_DIM_NARRATIVES.RESO_low.en],
  ];
  for (const [where, text] of lowTexts) {
    assert.ok(LOW_COST_RE.test(text), `${where}: hiányzik az alacsony pólus ára — "${text}"`);
  }
  // A kivezetett hiány-keretezés nem térhet vissza.
  const flat = JSON.stringify([
    DIMENSION_WEAK_VERBS.RESO,
    DIMENSION_WATCH_DESCS.RESO,
    SOLO_DIM_NARRATIVES.RESO_low,
    SOLO_DIM_SUMMARIES.RESO_low,
  ]);
  assert.ok(
    !/az érzelmi bevonódás kevésbé természetes tereped/.test(flat),
    "visszatért a kivezetett hiány-keretezés az alacsony RESO-nál",
  );
});

// ── 4. Archetípus-címke ─────────────────────────────────────────────────

test("archetípus: a RESO címkéje a ráhangolódás-család, nem az „empata”", () => {
  assert.equal(PERSONALITY_TYPE_PARTS.RESO.noun.hu, "ráhangolódó");
  assert.equal(PERSONALITY_TYPE_PARTS.RESO.noun.en, "Signal Reader");
  assert.equal(PERSONALITY_TYPE_PARTS.RESO.adjective.hu, "ráhangolódó");
  assert.equal(PERSONALITY_TYPE_PARTS.RESO.adjective.en, "Attuned");
});

test("archetípus: a közös resolver adja a címkét a főnévi ÉS a melléknévi helyen", () => {
  assert.equal(resolvePersonalityTypeLabel("RESO", "TEMP", "hu"), "Energikus ráhangolódó");
  assert.equal(resolvePersonalityTypeLabel("RESO", "TEMP", "en"), "Energetic Signal Reader");
  assert.equal(resolvePersonalityTypeLabel("TEMP", "RESO", "hu"), "Ráhangolódó hajtóerő");
  assert.equal(resolvePersonalityTypeLabel("TEMP", "RESO", "en"), "Attuned Driving Force");
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

test("jelölt-felület: a valencia-szűrés a kanonikus kapuból jön, nem kézi RESO-literálból", () => {
  const source = read("src/app/(app)/hiring/[orgId]/candidates/[inviteId]/page.tsx");
  // A sor-kommentek (köztük ez a döntés-indoklás) nem részei a viselkedésnek
  // és nem mennek ki a felületre — a guard a kód-törzsre néz.
  const code = source.replace(/\/\/.*$/gm, "");
  assert.ok(
    code.includes("strengthSlotEligible") && code.includes("deficitSlotEligible"),
    "a jelölt-oldal nem a kanonikus valencia-kapun szűr",
  );
  assert.ok(
    !/d !== "RESO"/.test(code),
    "visszatért a kézi `d !== \"RESO\"` literál a jelölt-oldalon",
  );
  assert.ok(!EMPATHY_RE.test(code), "empátia-keretezés maradt a jelölt-oldal szövegeiben");
});

test("PDF facet-oldal: az erősség-pillek és a magas-összegzés a kanonikus kapun mennek", () => {
  const source = read("src/components/pdf/pages/PlusFacetsPage.tsx");
  assert.ok(
    source.includes('strengthSlotEligible(f.dimCode, "self")'),
    "a facet-pillek nem a kanonikus erősség-kapun szűrnek",
  );
  assert.ok(
    source.includes('strengthSlotEligible(d.code, "self")'),
    "a magas-összegzés nem a kanonikus erősség-kapun szűr",
  );
  // Üres-szekció veszély: ha se magas, se alacsony tétel nem marad,
  // a kártya a kiegyensúlyozott-profil szöveget adja (nem üres címet).
  assert.ok(
    source.includes('t("pdf.facetBalanced", locale)'),
    "hiányzik a kiegyensúlyozott-profil fallback a facet-összegzőből",
  );
});

test("hőtérkép: az Emocionalitás skála-leírása a mért facetekhez igazodik", () => {
  const source = read("src/components/manager/TeamHeatmap.tsx");
  assert.ok(
    !/hu: "Érzelmi érzékenység, szorongásra való hajlam, empátia mások iránt"/.test(source),
    "visszatért az „empátia mások iránt” a hőtérkép skála-leírásába",
  );
});

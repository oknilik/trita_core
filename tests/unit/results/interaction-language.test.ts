import test from "node:test";
import assert from "node:assert/strict";
import {
  SAME_DIMENSION_ATOMS,
  CROSS_DIMENSION_ATOMS,
  GAP_ATOMS,
  LEADER_SUPPLEMENTS,
} from "@/lib/interaction-atoms";
import { hasHedge, findAbsoluteMarkers } from "@/lib/interaction-language";
import { t, type Locale } from "@/lib/i18n";

// Nyelvi guardrail az interakció-szövegekre.
//
// Ez a blokk KÉT ember dinamikájáról beszél, akik közül az egyiket nem is
// mértük — a másik oldal egy archetípus-prototípus. Ezért a nyelv szigorúbb,
// mint a saját profil szövegeinél: lehetőséget mondunk, nem állítást.
//
// Blokkonként más a szabály, és ez szándékos:
//   · `easy` és `friction` ÁLLÍTÁST tesz a párosról → hedge kötelező;
//   · `discuss` javaslat, nem állítás („beszéljétek meg…") → ott a hedge
//     csak gyengítené a mondatot, viszont abszolutizáló ott sem lehet.
//
// A LEADER_SUPPLEMENTS ugyanígy fedett: egy NEM MÉRT vezetőről tesz
// állítást, ezért hedge kötelező és abszolutizálás tilos.

const LOCALES: Locale[] = ["hu", "en"];
// A rés-atomok ugyanezt a nyelvi mércét tartják: gyengébb bizonyítékon állnak
// (nem szélső értékek, csak a mérési hibát meghaladó különbség), tehát a
// hedge-kötelezettség ott legalább annyira indokolt.
const ATOMS = [
  ...SAME_DIMENSION_ATOMS,
  ...CROSS_DIMENSION_ATOMS,
  ...Object.values(GAP_ATOMS),
];

type Entry = { label: string; text: string; locale: Locale; block: string };

const ENTRIES: Entry[] = ATOMS.flatMap((atom) =>
  ([
    ["view", atom.view],
    ["viewB", atom.viewB],
  ] as const).flatMap(([viewName, blocks]) =>
    blocks
      ? (["easy", "friction", "discuss"] as const).flatMap((block) => {
          const text = blocks[block];
          if (!text) return [];
          return LOCALES.map((locale) => ({
            label: `${atom.id}.${viewName}.${block}.${locale}`,
            text: text[locale],
            locale,
            block,
          }));
        })
      : [],
  ),
);

const LEADER_ENTRIES: Entry[] = Object.entries(LEADER_SUPPLEMENTS).flatMap(
  ([dim, poles]) =>
    (["high", "low"] as const).flatMap((pole) =>
      LOCALES.map((locale) => ({
        label: `leader.${dim}.${pole}.${locale}`,
        text: poles[pole][locale],
        locale,
        block: "leader",
      })),
    ),
);

const ALL_ENTRIES: Entry[] = [...ENTRIES, ...LEADER_ENTRIES];

test("a guardrail ténylegesen lát szövegeket", () => {
  assert.ok(ENTRIES.length > 200, `csak ${ENTRIES.length} szöveget talált`);
  // 6 dimenzió × 2 nézőpont × 3 blokk × 2 nyelv rés-atom szöveg
  const gapEntries = ENTRIES.filter((entry) => entry.label.startsWith("gap-"));
  assert.equal(gapEntries.length, 72, `csak ${gapEntries.length} rés-szöveget talált`);
  // 6 dimenzió × 2 pólus × 2 nyelv vezető-kiegészítő
  assert.equal(LEADER_ENTRIES.length, 24, `csak ${LEADER_ENTRIES.length} vezető-szöveget talált`);
});

test("egyetlen interakció-szöveg sem abszolutizál", () => {
  const hits = ALL_ENTRIES.flatMap(({ label, text, locale }) =>
    findAbsoluteMarkers(text, locale).map((marker) => `${label}: „${marker}"`),
  );
  assert.deepEqual(hits, [], `abszolutizáló fordulat:\n${hits.join("\n")}`);
});

test("az állítást tevő blokkok valószínűségi jelölőt hordoznak", () => {
  const missing = ALL_ENTRIES.filter(
    (entry) => entry.block !== "discuss" && !hasHedge(entry.text, entry.locale),
  ).map((entry) => entry.label);
  assert.deepEqual(missing, [], `hedge nélküli állítás:\n${missing.join("\n")}`);
});

test("a vezető-kiegészítők hipotézis-keretben szólnak", () => {
  const missing = LEADER_ENTRIES.filter(
    (entry) =>
      !(entry.locale === "hu"
        ? entry.text.startsWith("Ha a vezetőd")
        : entry.text.startsWith("If your leader")),
  ).map((entry) => entry.label);
  assert.deepEqual(missing, [], `nem hipotézis-keretes vezető-szöveg:\n${missing.join("\n")}`);
});

test("minden atomnak van discuss blokkja mindkét nyelven", () => {
  for (const atom of ATOMS) {
    for (const [viewName, blocks] of [
      ["view", atom.view],
      ["viewB", atom.viewB],
    ] as const) {
      if (!blocks) continue;
      assert.ok(blocks.discuss.hu, `${atom.id}.${viewName}: hiányzó HU discuss`);
      assert.ok(blocks.discuss.en, `${atom.id}.${viewName}: hiányzó EN discuss`);
    }
  }
});

// ─────────────────────────────────────────────────────────────────────
// Valencia-mentesség a pár-összevetés sávján (2026-08-18).
//
// A 0–100 NEM teljesítmény-skála: a magasabb érték nem jobb. A tier-címkék
// ezért „magas / közepes / alacsony"-ra váltottak (ld. a 2026-08-18-i
// valencia-mentes szint-besorolás changelogot). A PÁR-összevetésben ez még
// élesebb: ott az értékelő szó két EMBERT állítana sorrendbe, nem egy
// pontszámot minősítene. Ez a guardrail azt őrzi, hogy az irány-címkék és a
// hozzájuk tartozó magyarázó szövegek leíróak maradjanak.
// ─────────────────────────────────────────────────────────────────────

const BAND_KEYS = [
  "results.pairBandTitle",
  "results.pairBandSubtitle",
  "results.pairBandAligned",
  "results.pairBandSelfHigher",
  "results.pairBandOtherHigher",
  "results.pairBandNote",
  "results.pairNuanceTitle",
  "results.pairNuanceSelf",
  "results.pairNuanceOther",
  "results.pairBasisGap",
] as const;

/** Értékelő (rangsoroló) szótövek — a leíró „magasabb/alacsonyabb" helyett. */
const VALENCE_MARKERS: Record<Locale, RegExp[]> = {
  hu: [/erős/iu, /gyeng/iu, /\bjobb\b/iu, /rosszabb/iu, /kiválóbb/iu, /fejlettebb/iu],
  en: [/stronger/iu, /weaker/iu, /\bbetter\b/iu, /\bworse\b/iu, /superior/iu],
};

test("a pár-összevetés címkéi nem rangsorolják a két embert", () => {
  const hits: string[] = [];
  for (const key of BAND_KEYS) {
    for (const locale of LOCALES) {
      const text = t(key, locale);
      for (const marker of VALENCE_MARKERS[locale]) {
        const match = text.match(marker);
        // A módszertani jegyzet KIMONDJA a szabályt („egyik érték sem jobb a
        // másiknál") — az a szabály idézése, nem megsértése. Szűk kivétel:
        // csak erre a két konkrét fordulatra.
        const statesTheRule = /sem jobb a másiknál|neither value is better/iu.test(text);
        if (match && !statesTheRule) {
          hits.push(`${key}.${locale}: „${match[0]}"`);
        }
      }
    }
  }
  assert.deepEqual(hits, [], `értékelő szóhasználat a pár-sávban:\n${hits.join("\n")}`);
});

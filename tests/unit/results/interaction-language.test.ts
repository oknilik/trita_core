import test from "node:test";
import assert from "node:assert/strict";
import { SAME_DIMENSION_ATOMS, CROSS_DIMENSION_ATOMS } from "@/lib/interaction-atoms";
import { hasHedge, findAbsoluteMarkers } from "@/lib/interaction-language";
import type { Locale } from "@/lib/i18n";

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

const LOCALES: Locale[] = ["hu", "en"];
const ATOMS = [...SAME_DIMENSION_ATOMS, ...CROSS_DIMENSION_ATOMS];

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

test("a guardrail ténylegesen lát szövegeket", () => {
  assert.ok(ENTRIES.length > 200, `csak ${ENTRIES.length} szöveget talált`);
});

test("egyetlen interakció-szöveg sem abszolutizál", () => {
  const hits = ENTRIES.flatMap(({ label, text, locale }) =>
    findAbsoluteMarkers(text, locale).map((marker) => `${label}: „${marker}"`),
  );
  assert.deepEqual(hits, [], `abszolutizáló fordulat:\n${hits.join("\n")}`);
});

test("az állítást tevő blokkok valószínűségi jelölőt hordoznak", () => {
  const missing = ENTRIES.filter(
    (entry) => entry.block !== "discuss" && !hasHedge(entry.text, entry.locale),
  ).map((entry) => entry.label);
  assert.deepEqual(missing, [], `hedge nélküli állítás:\n${missing.join("\n")}`);
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

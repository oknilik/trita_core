import test from "node:test";
import assert from "node:assert/strict";
import { resolvePairTone, REVERSE_DIM_CODE } from "@/lib/score-valence";
import { TENSION_PAIRS, runProfileEngine } from "@/lib/profile-engine";
import { buildWorkstyleContent } from "@/lib/workstyle-content";
import {
  RESOLUTION_NARRATIVES,
  BLOCK3_SUMMARIES,
  RISK_TEXTS,
} from "@/lib/profile-content";

// ─────────────────────────────────────────────────────────────────────
// Pár-hangnem (tone) — a `risk: boolean` kivezetése, 2026-08-11.
//
// A kétállapotú jelző strukturálisan valenciás volt: a hat dimenzió közül
// EGYEDÜL a E-magas párok voltak `risk: true`, vagyis a fordított skála
// magas pólusa mindig „Figyelendő" kártyát kapott, az alacsony pólusa
// zöldet. A háromállapotú hangnem (resolution / risk / note) ezt a
// kényszert oldja fel — a besorolás a kanonikus valencia-kapun megy
// (score-valence.resolvePairTone), NEM felületenkénti literálokon.
// ─────────────────────────────────────────────────────────────────────

const LOCALES = ["hu", "en"] as const;
const DIMS = ["H", "E", "X", "A", "C", "O"] as const;
const SURFACES = ["self", "evaluative"] as const;

/** A párt aktiváló profil (a persona-recept mintájára): a pár két dimenziója
 *  pólusos, minden más közepes — így pontosan a célzott pár tüzel. */
function profileForPair(def: (typeof TENSION_PAIRS)[number]): Record<string, number> {
  const dims: Record<string, number> = {
    [def.dimA]: def.levelA === "high" ? 82 : 24,
    [def.dimB]: def.levelB === "high" ? 78 : 28,
  };
  const rest = DIMS.filter((d) => d !== def.dimA && d !== def.dimB);
  const restValues = [55, 52, 48, 45];
  rest.forEach((dim, i) => {
    dims[dim] = restValues[i];
  });
  return dims;
}

// ─── A kapu maga ───────────────────────────────────────────────────────────

test("resolvePairTone: valenciát hordozó dimenziók risk-párja marad „risk”", () => {
  for (const surface of SURFACES) {
    assert.equal(
      resolvePairTone(
        "risk",
        [
          { code: "C", level: "high" },
          { code: "A", level: "low" },
        ],
        surface,
      ),
      "risk",
      `a nem-E risk-pár ${surface} felületen sem szelídülhet`,
    );
  }
});

test("resolvePairTone: fordított skálájú risk-pár → „note” mindkét pólusán, mindkét felületen", () => {
  for (const surface of SURFACES) {
    for (const level of ["high", "low"] as const) {
      assert.equal(
        resolvePairTone(
          "risk",
          [
            { code: REVERSE_DIM_CODE, level },
            { code: "X", level: "high" },
          ],
          surface,
        ),
        "note",
      );
    }
  }
});

test("resolvePairTone: fordított skálájú feloldás-pár értékelő felületen „note”, önismeretin marad", () => {
  const members = [
    { code: REVERSE_DIM_CODE, level: "low" as const },
    { code: "X", level: "high" as const },
  ];
  // Önismereti felületen a feloldás-narratíva folyó szöveg, nincs valenciás
  // címke, amit kapuzni kellene.
  assert.equal(resolvePairTone("resolution", members, "self"), "resolution");
  // Értékelő (jelölt-)felületen viszont zöld „Erősség" badge-et kapna – az
  // alacsony E-t erősségként címkézni ugyanaz a valencia, csak tükrözve.
  assert.equal(resolvePairTone("resolution", members, "evaluative"), "note");
});

// ─── A motor kimenete ──────────────────────────────────────────────────────

test("a TENSION_PAIRS tábla csak SZERZŐI hangnemet deklarál (note-ot sosem)", () => {
  for (const def of TENSION_PAIRS) {
    assert.ok(
      def.tone === "resolution" || def.tone === "risk",
      `${def.contentKey}: a note a valencia-kapu kimenete, nem deklarálható`,
    );
  }
});

test("egyetlen felületen sem kerül fordított skálájú pár risk-slotba", () => {
  for (const def of TENSION_PAIRS) {
    for (const surface of SURFACES) {
      const engine = runProfileEngine(profileForPair(def), "TRITAN", surface);
      for (const pair of engine.block7Pairs) {
        assert.ok(
          pair.dimA !== REVERSE_DIM_CODE && pair.dimB !== REVERSE_DIM_CODE,
          `${pair.contentKey} (${surface}): E-vezérelt pár a deficit-keretes slotban`,
        );
      }
    }
  }
});

test("értékelő felületen fordított skálájú pár erősség-slotba (block6) sem kerül", () => {
  for (const def of TENSION_PAIRS) {
    const engine = runProfileEngine(profileForPair(def), "TRITAN", "evaluative");
    for (const pair of engine.block6Pairs) {
      assert.ok(
        pair.dimA !== REVERSE_DIM_CODE && pair.dimB !== REVERSE_DIM_CODE,
        `${pair.contentKey}: E-vezérelt pár a zöld „Erősség" slotban`,
      );
    }
  }
});

test("egyetlen aktív pár sem tűnik el: a három slot pontosan lefedi a párokat", () => {
  for (const def of TENSION_PAIRS) {
    for (const surface of SURFACES) {
      const engine = runProfileEngine(profileForPair(def), "TRITAN", surface);
      assert.ok(engine.pairs.length > 0, `${def.contentKey}: nem tüzelt a pár`);
      assert.equal(
        engine.block6Pairs.length + engine.block7Pairs.length + engine.notePairs.length,
        engine.pairs.length,
        `${def.contentKey} (${surface}): pár veszett el a slotolásnál`,
      );
      // A célzott pár tényleg aktív, és pontosan egy slotban van.
      const hits = engine.pairs.filter((p) => p.contentKey === def.contentKey);
      assert.equal(hits.length, 1);
    }
  }
});

// ─── Tartalom-megőrzés minden hangnemre, minden nyelven ────────────────────

test("minden pár tartalma kimegy valamelyik slotba (self felület, hu+en)", () => {
  for (const def of TENSION_PAIRS) {
    for (const lang of LOCALES) {
      const ws = buildWorkstyleContent(profileForPair(def), "TRITAN", lang);
      const parts = ws.howYouWorkParts;
      const all = [parts.main, parts.watch ?? "", ...parts.notes, ...parts.context].join(" ");

      const narrative = RESOLUTION_NARRATIVES[def.contentKey]?.[lang];
      const summary = BLOCK3_SUMMARIES[def.contentKey]?.[lang];
      const advice = RISK_TEXTS[def.contentKey]?.[lang];

      if (def.tone === "resolution") {
        assert.ok(narrative, `${def.contentKey}/${lang}: hiányzó narratíva`);
        assert.ok(all.includes(narrative), `${def.contentKey}/${lang}: narratíva elveszett`);
      } else {
        // A deklarált risk-párok (mind E-vezéreltek) note-ként jelennek meg –
        // az összefoglaló ÉS a gyakorlati tanács is kimegy.
        assert.ok(summary && advice, `${def.contentKey}/${lang}: hiányos deck`);
        assert.ok(all.includes(summary), `${def.contentKey}/${lang}: összefoglaló elveszett`);
        assert.ok(all.includes(advice), `${def.contentKey}/${lang}: tanács elveszett`);
      }
    }
  }
});

test("értékelő felület: a note-párokhoz van renderelhető szöveg (hu+en)", () => {
  // A jelölt-oldal a notePairs-hez RESOLUTION_NARRATIVES-t (+ ha van,
  // RISK_TEXTS tanácsot) rendel – a semleges panel nem maradhat üresen.
  for (const def of TENSION_PAIRS) {
    const engine = runProfileEngine(profileForPair(def), "TRITAN", "evaluative");
    for (const pair of engine.notePairs) {
      for (const lang of LOCALES) {
        assert.ok(
          RESOLUTION_NARRATIVES[pair.contentKey]?.[lang],
          `${pair.contentKey}/${lang}: a semleges panel szöveg nélkül maradna`,
        );
      }
    }
  }
});

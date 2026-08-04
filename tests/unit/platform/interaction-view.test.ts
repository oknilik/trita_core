import test from "node:test";
import assert from "node:assert/strict";
import { TRITAN_DIMENSIONS, TRITAN_ORDER } from "@/lib/tritan";
import {
  archetypeKey,
  buildArchetypeSimulations,
} from "@/lib/interaction-view";

const PROFILE = { INTE: 72, RESO: 40, TEMP: 30, ADAP: 78, THOR: 88, OPEN: 35 };
const FLAT = { INTE: 50, RESO: 50, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50 };

test("mind a 30 archetípus előáll, egyedi kulccsal", () => {
  const sims = buildArchetypeSimulations(PROFILE, "hu");
  assert.equal(sims.length, 30);
  assert.equal(new Set(sims.map((sim) => sim.key)).size, 30);
  for (const sim of sims) {
    assert.equal(sim.key, archetypeKey(sim.dominant, sim.secondary));
    assert.notEqual(sim.dominant, sim.secondary);
  }
});

test("a szöveg a kért nyelven, feloldva jön (nem LocalizedText objektum)", () => {
  const hu = buildArchetypeSimulations(PROFILE, "hu");
  const en = buildArchetypeSimulations(PROFILE, "en");
  const huSim = hu.find((sim) => !sim.sparse);
  const enSim = en.find((sim) => sim.key === huSim?.key);
  assert.ok(huSim && enSim);

  assert.equal(typeof huSim.discuss[0].text, "string");
  assert.notEqual(
    huSim.discuss[0].text,
    enSim.discuss[0].text,
    "a két nyelv más szöveget ad",
  );
  assert.equal(
    huSim.discuss[0].atomId,
    enSim.discuss[0].atomId,
    "ugyanaz az atom, csak más nyelven",
  );
});

test("a típus-címke lokalizált", () => {
  const hu = buildArchetypeSimulations(PROFILE, "hu");
  const en = buildArchetypeSimulations(PROFILE, "en");
  const key = archetypeKey("OPEN", "TEMP");
  const huLabel = hu.find((sim) => sim.key === key)?.label;
  const enLabel = en.find((sim) => sim.key === key)?.label;
  assert.equal(huLabel, "Energikus újító");
  assert.equal(enLabel, "Energetic Innovator");
});

// A névtér-szabály őre: a felületen HEXACO-címke jelenik meg, nem belső kód.
test("a dimenzió-címkék a kanonikus HEXACO-térképből jönnek", () => {
  const huLabels = new Set(TRITAN_ORDER.map((dim) => TRITAN_DIMENSIONS[dim].hu));
  const enLabels = new Set(TRITAN_ORDER.map((dim) => TRITAN_DIMENSIONS[dim].en));

  for (const [locale, expected] of [
    ["hu", huLabels],
    ["en", enLabels],
  ] as const) {
    const sims = buildArchetypeSimulations(PROFILE, locale);
    for (const sim of sims) {
      for (const line of [...sim.easy, ...sim.friction, ...sim.discuss]) {
        for (const label of line.dimLabels) {
          assert.ok(
            expected.has(label),
            `${locale}: „${label}" nem a kanonikus HEXACO-címkék között van`,
          );
          assert.ok(
            !TRITAN_ORDER.includes(label as never),
            `${locale}: belső dimenziókód szivárgott ki a felületre: ${label}`,
          );
        }
      }
      for (const note of sim.leaderNotes) {
        assert.ok(expected.has(note.dimLabel));
      }
    }
  }
});

test("vezetői kiegészítő minden archetípushoz jár (a prototípus két pólusos dimenziója)", () => {
  const sims = buildArchetypeSimulations(PROFILE, "hu");
  for (const sim of sims) {
    assert.equal(
      sim.leaderNotes.length,
      2,
      `${sim.key}: a prototípusnak pontosan két pólusos dimenziója van`,
    );
  }
});

test("lapos profilnál mind a 30 sparse — a felület külön üzenetet ad", () => {
  const sims = buildArchetypeSimulations(FLAT, "hu");
  assert.equal(sims.filter((sim) => sim.sparse).length, 30);
  for (const sim of sims) {
    assert.deepEqual(sim.discuss, []);
  }
});

// A nézet-modell szerver-komponensből megy át kliens-komponensbe (RSC-határ),
// ezért sima JSON-nak kell lennie: se Date, se Map, se függvény, se undefined.
// Dinamikus route-nál ezt a build NEM fogja meg — csak a futásidő.
test("a nézet-modell átmegy az RSC-határon: veszteségmentesen szerializálható", () => {
  const sims = buildArchetypeSimulations(PROFILE, "hu");
  assert.deepEqual(JSON.parse(JSON.stringify(sims)), sims);
});

test("markáns profilnál van nem-sparse archetípus, discusszal", () => {
  const sims = buildArchetypeSimulations(PROFILE, "hu");
  const usable = sims.filter((sim) => !sim.sparse);
  assert.ok(usable.length > 0);
  for (const sim of usable) {
    assert.ok(sim.discuss.length > 0, `${sim.key}: hiányzik a discuss`);
  }
});

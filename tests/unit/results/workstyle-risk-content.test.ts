import test from "node:test";
import assert from "node:assert/strict";
import { buildWorkstyleContent } from "@/lib/workstyle-content";
import { TENSION_PAIRS } from "@/lib/profile-engine";
import {
  BLOCK3_SUMMARIES,
  RISK_TEXTS,
  DEFAULT_NARRATIVE,
  COLLAB_FRICTION,
} from "@/lib/profile-content";

// A „Ahogy működsz" tartalmi bekötések guardrailje: a kockázati párok
// mitigációs tanácsa, a kiegyensúlyozott profil narratívája és a
// súrlódás-copy elérhetősége (motor-audit 2026-08).

const LOCALES = ["hu", "en"] as const;

function scores(overrides: Record<string, number>): Record<string, number> {
  const base: Record<string, number> = {
    INTE: 50, RESO: 50, TEMP: 50, ADAP: 50, THOR: 50, OPEN: 50,
  };
  return { ...base, ...overrides };
}

test("minden risk-pár contentKey-hez van RISK_TEXTS (hu+en)", () => {
  for (const pair of TENSION_PAIRS.filter((p) => p.risk)) {
    for (const lang of LOCALES) {
      assert.ok(
        RISK_TEXTS[pair.contentKey]?.[lang],
        `RISK_TEXTS.${pair.contentKey}.${lang} hiányzik`,
      );
    }
  }
});

test("kockázati pár: az összefoglaló után a mitigációs tanács is bekerül", () => {
  // RESO high + TEMP high → supportedVisibility (risk pár)
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({ RESO: 80, TEMP: 80 }), "TRITAN", lang);
    const summary = BLOCK3_SUMMARIES.supportedVisibility[lang];
    const mitigation = RISK_TEXTS.supportedVisibility[lang];
    const summaryIdx = ws.howYouWork.indexOf(summary);
    assert.ok(summaryIdx >= 0, `összefoglaló hiányzik a howYouWork-ből (${lang})`);
    assert.equal(ws.howYouWork[summaryIdx + 1], mitigation);

    assert.equal(ws.riskParts.length, 1);
    assert.equal(ws.riskParts[0].summary, summary);
    assert.equal(ws.riskParts[0].mitigation, mitigation);
    assert.ok(ws.riskParts[0].source.length > 0);
  }
});

test("nem-risk profil: riskParts üres", () => {
  const ws = buildWorkstyleContent(scores({ INTE: 80, OPEN: 80 }), "TRITAN", "hu");
  assert.deepEqual(ws.riskParts, []);
});

test("csupa közepes profil: a DEFAULT_NARRATIVE az első howYouWork-bekezdés", () => {
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({}), "TRITAN", lang);
    assert.deepEqual(ws.howYouWork, [DEFAULT_NARRATIVE[lang]]);
  }
});

// ─── howYouWorkParts — nevesített slotok (motor-audit v4, FIX 3) ────────────

test("RESO-vezérelt risk-pár: nincs Figyelendő-kártya, a tartalom kontextusba megy", () => {
  // 2026-08-11 valencia-döntés: a TENSION_PAIRS táblában a hat dimenzió közül
  // EGYEDÜL a RESO-magas párok `risk: true`-k (a RESO-alacsonyak mind false),
  // vagyis a fordított skála magas pólusa strukturálisan borostyán
  // „Figyelendő" kártyát kapott. A pár TARTALMA megmarad (riskParts +
  // kontextus), csak a valenciás keretezés szűnik meg.
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({ RESO: 80, TEMP: 80 }), "TRITAN", lang);
    const summary = BLOCK3_SUMMARIES.supportedVisibility[lang];
    const mitigation = RISK_TEXTS.supportedVisibility[lang];

    assert.equal(ws.howYouWorkParts.main, ws.howYouWork[0]);
    assert.equal(ws.howYouWorkParts.watch, null);
    // A pár nem vész el: strukturáltan is megvan, reverseValenced jelöléssel…
    const part = ws.riskParts.find((p) => p.summary === summary);
    assert.ok(part, "a RESO-pár riskParts-ban marad");
    assert.equal(part.reverseValenced, true);
    assert.equal(part.mitigation, mitigation);
    // …és a folyó szövegben (howYouWork) is kimegy.
    assert.ok(ws.howYouWork.includes(summary));
    assert.ok(ws.howYouWork.includes(mitigation));
  }
});

test("nem-RESO risk-pár: a watch-slot változatlanul a risk-pár (a kapu szelektív)", () => {
  // ADAP 20 + THOR 80 → structuredCompetitor. Ez NEM fordított skálából ered,
  // tehát a valenciás kártya változatlanul jár neki — a fenti kapu nem
  // kapcsolja ki általánosan a „Figyelendő" slotot.
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({ RESO: 50, ADAP: 20, THOR: 80 }), "TRITAN", lang);
    const valenced = ws.riskParts.filter((p) => !p.reverseValenced);
    if (valenced.length === 0) continue; // deck-függő; ha nincs ilyen pár, nincs mit állítani
    assert.equal(
      ws.howYouWorkParts.watch,
      `${valenced[0].summary} ${valenced[0].mitigation}`,
    );
  }
});

test("nem-risk profil: NINCS watch-slot, a további narratíva a kontextusba megy", () => {
  // INTE 80 + OPEN 80 → responsibleInnovator (nem risk-pár)
  const ws = buildWorkstyleContent(scores({ INTE: 80, OPEN: 80 }), "TRITAN", "hu");
  assert.equal(ws.riskParts.length, 0);
  assert.equal(ws.howYouWorkParts.watch, null);
  assert.equal(ws.howYouWorkParts.main, ws.howYouWork[0]);
  // Pozíció-ekvivalencia risk nélkül: minden további bekezdés kontextus.
  assert.deepEqual(ws.howYouWorkParts.context, ws.howYouWork.slice(1));
});

test("csupa közepes profil: main = DEFAULT_NARRATIVE, watch nélkül", () => {
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({}), "TRITAN", lang);
    assert.equal(ws.howYouWorkParts.main, DEFAULT_NARRATIVE[lang]);
    assert.equal(ws.howYouWorkParts.watch, null);
    assert.deepEqual(ws.howYouWorkParts.context, []);
  }
});

// ─── Forrás-chip vs. strip (motor-audit F3): hedge a 65–70-es sávban ────────

test("forrás-chip: 65–70 közti pontszám „inkább magas”, 70 felett sima „magas”", () => {
  // RESO 80 (tier: high) + TEMP 67 (pólus: high, tier: mid) → supportedVisibility
  const ws = buildWorkstyleContent(scores({ RESO: 80, TEMP: 67 }), "TRITAN", "hu");
  assert.equal(ws.riskParts.length, 1);
  const source = ws.riskParts[0].source;
  assert.ok(source.includes("Extraverzió · inkább magas"), `hedge hiányzik: ${source}`);
  assert.ok(source.includes("Emocionalitás · magas"), `sima címke hiányzik: ${source}`);
  assert.ok(!source.includes("Extraverzió · magas"), `a 67-es nem kaphat sima „magas"-t: ${source}`);
});

test("súrlódás-copy a gyengébb jóslókból is elérhető (RESO/TEMP/OPEN)", () => {
  // Csak RESO pólusos — a csonka [THOR, ADAP, INTE] sorrendben nem lenne találat.
  const ws = buildWorkstyleContent(scores({ RESO: 80 }), "TRITAN", "hu");
  assert.equal(ws.collaboration.friction[0]?.text, COLLAB_FRICTION.RESO_high.hu);
});

test("súrlódás: a súly-sorrend első két pólusos dimenziója, legfeljebb kettő", () => {
  const ws = buildWorkstyleContent(
    scores({ THOR: 80, ADAP: 20, RESO: 80, OPEN: 80 }),
    "TRITAN",
    "hu",
  );
  assert.deepEqual(
    ws.collaboration.friction.map((f) => f.text),
    [COLLAB_FRICTION.THOR_high.hu, COLLAB_FRICTION.ADAP_low.hu],
  );
});

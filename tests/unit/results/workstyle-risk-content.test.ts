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
    H: 50, E: 50, X: 50, A: 50, C: 50, O: 50,
  };
  return { ...base, ...overrides };
}

test("minden deklarált risk-pár contentKey-hez van RISK_TEXTS (hu+en)", () => {
  // A tábla SZERZŐI hangneme („tone") — a megjelenítendő hangnem ebből a
  // valencia-kapun át áll elő (a fordított skálájú párokból „note" lesz),
  // de a tartalmi lefedettség mindkettőre ugyanaz.
  for (const pair of TENSION_PAIRS.filter((p) => p.tone === "risk")) {
    for (const lang of LOCALES) {
      assert.ok(
        RISK_TEXTS[pair.contentKey]?.[lang],
        `RISK_TEXTS.${pair.contentKey}.${lang} hiányzik`,
      );
    }
  }
});

test("nem-feloldás pár: az összefoglaló után a gyakorlati tanács is bekerül", () => {
  // E high + X high → supportedVisibility (deklarált risk → megjelenítve note)
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({ E: 80, X: 80 }), "TRITAN", lang);
    const summary = BLOCK3_SUMMARIES.supportedVisibility[lang];
    const advice = RISK_TEXTS.supportedVisibility[lang];
    const summaryIdx = ws.howYouWork.indexOf(summary);
    assert.ok(summaryIdx >= 0, `összefoglaló hiányzik a howYouWork-ből (${lang})`);
    assert.equal(ws.howYouWork[summaryIdx + 1], advice);

    assert.equal(ws.riskParts.length, 1);
    assert.equal(ws.riskParts[0].summary, summary);
    assert.equal(ws.riskParts[0].advice, advice);
    assert.equal(ws.riskParts[0].tone, "note");
    assert.ok(ws.riskParts[0].source.length > 0);
  }
});

test("nem-risk profil: riskParts üres", () => {
  const ws = buildWorkstyleContent(scores({ H: 80, O: 80 }), "TRITAN", "hu");
  assert.deepEqual(ws.riskParts, []);
});

test("csupa közepes profil: a DEFAULT_NARRATIVE az első howYouWork-bekezdés", () => {
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({}), "TRITAN", lang);
    assert.deepEqual(ws.howYouWork, [DEFAULT_NARRATIVE[lang]]);
  }
});

// ─── howYouWorkParts — nevesített slotok (motor-audit v4, FIX 3) ────────────

test("E-vezérelt pár: nincs Figyelendő-kártya, a tartalom a semleges notes-slotba megy", () => {
  // 2026-08-11 valencia-döntés + a `risk: boolean` → `tone` átállás: a
  // fordított skálát (E) érintő párok hangneme "note" — sem deficit-keretes
  // („Figyelendő"), sem kontextusba söpört maradék: saját, semleges slot.
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({ E: 80, X: 80 }), "TRITAN", lang);
    const summary = BLOCK3_SUMMARIES.supportedVisibility[lang];
    const advice = RISK_TEXTS.supportedVisibility[lang];

    assert.equal(ws.howYouWorkParts.main, ws.howYouWork[0]);
    assert.equal(ws.howYouWorkParts.watch, null);
    // A pár nem vész el: nevesített semleges slot (summary + tanács)…
    assert.deepEqual(ws.howYouWorkParts.notes, [`${summary} ${advice}`]);
    // …strukturáltan is megvan, "note" hangnemmel…
    const part = ws.riskParts.find((p) => p.summary === summary);
    assert.ok(part, "a E-pár riskParts-ban marad");
    assert.equal(part.tone, "note");
    assert.equal(part.advice, advice);
    // …és a folyó szövegben (howYouWork) is kimegy.
    assert.ok(ws.howYouWork.includes(summary));
    assert.ok(ws.howYouWork.includes(advice));
    // A semleges tartalom NEM duplázódik a kontextusban.
    assert.ok(!ws.howYouWorkParts.context.some((c) => c.includes(advice)));
  }
});

test("MINDEN E-vezérelt pár-profil: a watch-slot üres, a tartalom megvan", () => {
  // A három deklarált risk-pár mind E-magas (supportedVisibility /
  // structuredStability / safeExperimentation) — egyik sem kaphat
  // deficit-keretes slotot egyetlen nyelven sem.
  const cases: [string, Record<string, number>][] = [
    ["supportedVisibility", { E: 80, X: 80 }],
    ["structuredStability", { E: 80, C: 80 }],
    ["safeExperimentation", { E: 80, O: 80 }],
  ];
  for (const [key, dims] of cases) {
    for (const lang of LOCALES) {
      const ws = buildWorkstyleContent(scores(dims), "TRITAN", lang);
      assert.equal(ws.howYouWorkParts.watch, null, `${key}/${lang}: watch nem üres`);
      assert.ok(
        ws.riskParts.every((p) => p.tone === "note"),
        `${key}/${lang}: nem-note hangnem került a listába`,
      );
      const summary = BLOCK3_SUMMARIES[key][lang];
      const advice = RISK_TEXTS[key][lang];
      assert.ok(
        ws.howYouWorkParts.notes.some((n) => n.includes(summary) && n.includes(advice)),
        `${key}/${lang}: a summary vagy a tanács elveszett`,
      );
    }
  }
});

test("nem-risk profil: NINCS watch-slot, a további narratíva a kontextusba megy", () => {
  // H 80 + O 80 → responsibleInnovator (feloldás-pár)
  const ws = buildWorkstyleContent(scores({ H: 80, O: 80 }), "TRITAN", "hu");
  assert.equal(ws.riskParts.length, 0);
  assert.equal(ws.howYouWorkParts.watch, null);
  assert.deepEqual(ws.howYouWorkParts.notes, []);
  assert.equal(ws.howYouWorkParts.main, ws.howYouWork[0]);
  // Pozíció-ekvivalencia risk nélkül: minden további bekezdés kontextus.
  assert.deepEqual(ws.howYouWorkParts.context, ws.howYouWork.slice(1));
});

test("csupa közepes profil: main = DEFAULT_NARRATIVE, watch nélkül", () => {
  for (const lang of LOCALES) {
    const ws = buildWorkstyleContent(scores({}), "TRITAN", lang);
    assert.equal(ws.howYouWorkParts.main, DEFAULT_NARRATIVE[lang]);
    assert.equal(ws.howYouWorkParts.watch, null);
    assert.deepEqual(ws.howYouWorkParts.notes, []);
    assert.deepEqual(ws.howYouWorkParts.context, []);
  }
});

// ─── Forrás-chip vs. strip (motor-audit F3): hedge a 65–70-es sávban ────────

test("forrás-chip: 65–70 közti pontszám „inkább magas”, 70 felett sima „magas”", () => {
  // E 80 (tier: high) + X 67 (pólus: high, tier: mid) → supportedVisibility
  const ws = buildWorkstyleContent(scores({ E: 80, X: 67 }), "TRITAN", "hu");
  assert.equal(ws.riskParts.length, 1);
  const source = ws.riskParts[0].source;
  assert.ok(source.includes("Extraverzió · inkább magas"), `hedge hiányzik: ${source}`);
  assert.ok(source.includes("Emocionalitás · magas"), `sima címke hiányzik: ${source}`);
  assert.ok(!source.includes("Extraverzió · magas"), `a 67-es nem kaphat sima „magas"-t: ${source}`);
});

test("súrlódás-copy a gyengébb jóslókból is elérhető (E/X/O)", () => {
  // Csak E pólusos — a csonka [C, A, H] sorrendben nem lenne találat.
  const ws = buildWorkstyleContent(scores({ E: 80 }), "TRITAN", "hu");
  assert.equal(ws.collaboration.friction[0]?.text, COLLAB_FRICTION.E_high.hu);
});

test("súrlódás: a súly-sorrend első két pólusos dimenziója, legfeljebb kettő", () => {
  const ws = buildWorkstyleContent(
    scores({ C: 80, A: 20, E: 80, O: 80 }),
    "TRITAN",
    "hu",
  );
  assert.deepEqual(
    ws.collaboration.friction.map((f) => f.text),
    [COLLAB_FRICTION.C_high.hu, COLLAB_FRICTION.A_low.hu],
  );
});

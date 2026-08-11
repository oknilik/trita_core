import test from "node:test";
import assert from "node:assert/strict";
import { hasIndustryMismatch, sectionFor } from "@/lib/career/sections";
import { feasibilityFor } from "@/lib/career/feasibility";
import type { EntryLevel } from "@/lib/career/types";

// A szakaszba sorolás EGYETLEN forrása a feasibility (2026-08-11, fix):
// a korábbi külön lépcső ismeretlen végzettségnél a course-belépést „Most
// elérhető"-nek mondta, miközben a feasibility ugyanarra training-needed-et
// adott — a kártya egyszerre állította mindkettőt.

type EduLevel = "primary" | "secondary" | "vocational" | "higher" | "specialized";

function fitOf(entry: EntryLevel, eduLevel: EduLevel | null) {
  return { entry, feasibility: feasibilityFor(entry, eduLevel) };
}

test("ismeretlen végzettség: course-belépés NEM 'Most elérhető' (a feasibility dönt)", () => {
  // A regressziós eset: eduLevel=null + entry=course → a feasibility not
  // ready (training-needed), tehát a szakasz is afterTraining.
  const courseFit = fitOf("course", null);
  assert.equal(courseFit.feasibility.ready, false);
  assert.equal(courseFit.feasibility.state, "training-needed");
  assert.equal(sectionFor(courseFit, null), "afterTraining");

  // Nyitott belépés ismeretlen végzettséggel: ready → most elérhető.
  const openFit = fitOf("open", null);
  assert.equal(openFit.feasibility.ready, true);
  assert.equal(sectionFor(openFit, null), "atLevel");

  // Magasabb belépések ismeretlen végzettséggel: tanulással.
  assert.equal(sectionFor(fitOf("vocational", null), null), "afterTraining");
  assert.equal(sectionFor(fitOf("higher", null), null), "afterTraining");
});

test("ismert végzettség: a szint-viszony sorol (a korábbi viselkedés él)", () => {
  // A szintednek megfelelő belépés → most elérhető.
  assert.equal(sectionFor(fitOf("higher", "higher"), "higher"), "atLevel");
  assert.equal(sectionFor(fitOf("open", "secondary"), "secondary"), "atLevel");
  // A végzettség ALATTI belépés → tudatos lefelé-váltás.
  assert.equal(sectionFor(fitOf("open", "higher"), "higher"), "belowLevel");
  assert.equal(sectionFor(fitOf("vocational", "specialized"), "specialized"), "belowLevel");
  // A végzettség FÖLÖTTI belépés → tanulással (a feasibility mondja ki).
  assert.equal(sectionFor(fitOf("vocational", "secondary"), "secondary"), "afterTraining");
  assert.equal(sectionFor(fitOf("specialized", "higher"), "higher"), "afterTraining");
});

test("SOHA nem mond ellent a feasibilitynek: atLevel ⇒ ready", () => {
  const entries: EntryLevel[] = ["open", "course", "vocational", "higher", "specialized"];
  const levels: Array<EduLevel | null> = [
    null,
    "primary",
    "secondary",
    "vocational",
    "higher",
    "specialized",
  ];
  for (const entry of entries) {
    for (const eduLevel of levels) {
      const fit = fitOf(entry, eduLevel);
      const section = sectionFor(fit, eduLevel);
      if (section === "atLevel" || section === "belowLevel") {
        assert.equal(
          fit.feasibility.ready,
          true,
          `${entry}/${eduLevel}: '${section}' szakasz not-ready feasibilityvel`,
        );
      }
      if (!fit.feasibility.ready) {
        assert.equal(
          section,
          "afterTraining",
          `${entry}/${eduLevel}: not-ready szerep nem a tanulás-szakaszba került`,
        );
      }
    }
  }
});

// ── iparág-ellentmondás: csak címkézett szerepek fölött ─────────────────────

test("industryMismatch: univerzális-only top nem válthat ki ellentmondás-jelzést", () => {
  // Scope-módban a top-ot az univerzális (industries: []) szerepek dominálják:
  // rajtuk sosincs industry-pick flag — a jelzés a SAJÁT bejelölt területeinek
  // listáján sütött el (2026-08-11, fix).
  const universalOnly = [
    { flags: [], industryTagged: false },
    { flags: ["h-floor"], industryTagged: false },
  ];
  assert.equal(hasIndustryMismatch(universalOnly, 2, "measured"), false);
});

test("industryMismatch: címkézett top pick nélkül = ellentmondás, pickkel nem", () => {
  const noPick = [
    { flags: [], industryTagged: true },
    { flags: [], industryTagged: false },
  ];
  assert.equal(hasIndustryMismatch(noPick, 1, "measured"), true);

  const withPick = [
    { flags: ["industry-pick"], industryTagged: true },
    { flags: [], industryTagged: false },
  ];
  assert.equal(hasIndustryMismatch(withPick, 1, "measured"), false);
});

test("industryMismatch: csak mért érdeklődésnél és bejelölt iparágnál él", () => {
  const noPick = [{ flags: [], industryTagged: true }];
  assert.equal(hasIndustryMismatch(noPick, 0, "measured"), false, "nincs bejelölés");
  assert.equal(hasIndustryMismatch(noPick, 1, "estimated"), false, "becsült forrás");
  assert.equal(hasIndustryMismatch(noPick, 1, "tags"), false, "címke-forrás");
  assert.equal(hasIndustryMismatch(noPick, 1, null), false, "nincs érdeklődés-adat");
});

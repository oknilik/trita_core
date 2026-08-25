import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function source(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

test("a self és observer kitöltés ugyanazt a versenybiztos léptetési magot használja", () => {
  const controller = source(
    "src/components/assessment/useAssessmentStepController.ts",
  );
  const selfAssessment = source("src/app/(app)/assessment/AssessmentClient.tsx");
  const observerAssessment = source(
    "src/app/(app)/observe/[token]/ObserverClient.tsx",
  );

  for (const [flow, component] of [
    ["self", selfAssessment],
    ["observer", observerAssessment],
  ] as const) {
    assert.match(
      component,
      /useAssessmentStepController/,
      `${flow}: nem a közös léptetési vezérlőt használja`,
    );
    assert.match(
      component,
      /scheduleAutoAdvance: scheduleGuardedAutoAdvance/,
      `${flow}: az automatikus léptetés nincs a közös védelemre kötve`,
    );
    assert.match(
      component,
      /runStepTransition/,
      `${flow}: a kézi léptetés nincs dupla akció ellen védve`,
    );
  }

  assert.match(controller, /cancelAutoAdvance\(\);[\s\S]*window\.setTimeout/);
  assert.match(
    controller,
    /getActiveQuestionIdRef\.current\(\) !== sourceQuestionId/,
  );
  assert.match(controller, /if \(transitionLockedRef\.current\) return false/);
});

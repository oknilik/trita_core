import test from "node:test";
import assert from "node:assert/strict";
import {
  buildEvaluationViewModel,
  getRemainingEvaluationTime,
} from "@/lib/assessment-evaluation";

test("az eredménykészítő magyar nézete együtt mozgatja a progresszt és a narratívát", () => {
  const start = buildEvaluationViewModel(12, "hu");
  const middle = buildEvaluationViewModel(50, "hu");
  const finish = buildEvaluationViewModel(88.4, "hu");

  assert.equal(start.roundedProgress, 12);
  assert.match(start.phaseMessage, /kapcsolódsz/);
  assert.match(middle.phaseMessage, /döntési és munkastílusod/);
  assert.match(finish.phaseMessage, /építened/);
  assert.equal(finish.roundedProgress, 88);
  assert.equal(finish.status, "Mintázatok összekapcsolása");
});

test("az angol nézet ugyanazokat a fázisokat lokalizált szöveggel adja", () => {
  const start = buildEvaluationViewModel(0, "en");
  const finish = buildEvaluationViewModel(100, "en");

  assert.equal(start.phase, 0);
  assert.match(start.phaseMessage, /connect with others/);
  assert.equal(finish.phase, 2);
  assert.match(finish.phaseMessage, /strengths you can use/);
  assert.equal(finish.kicker, "Your personal result is taking shape");
});

test("a kiértékelési folyamat a gyors válasz után is kitölti a minimum képernyőidőt", () => {
  const requestStartedAt = 10_000;
  const apiFinishedAt = 10_420;

  assert.equal(getRemainingEvaluationTime(requestStartedAt, apiFinishedAt), 2_580);
  assert.equal(getRemainingEvaluationTime(requestStartedAt, 13_400), 0);
});

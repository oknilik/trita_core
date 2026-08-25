import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";
import test from "node:test";

const ROOT = process.cwd();

function source(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

const assessmentClients = [
  "src/app/(app)/assessment/peer-feedback/PeerFeedbackClient.tsx",
  "src/app/(app)/assessment/psych-safety/PsychSafetyClient.tsx",
  "src/app/(app)/assessment/team-roles/peers/TeamRolePeersClient.tsx",
  "src/app/(app)/assessment/trust/TrustPeersClient.tsx",
] as const;

test("a kiegészítő assessment flow-k a közös vizuális shellt használják", () => {
  for (const file of assessmentClients) {
    const component = source(file);

    assert.match(
      component,
      /from "@\/components\/assessment\/AssessmentFlowShell"/,
      `${file}: hiányzik a közös assessment shell importja`,
    );
    assert.match(
      component,
      /<AssessmentFlowShell>/,
      `${file}: a kérdésszakasz nincs a közös shellben`,
    );
    assert.match(
      component,
      /<AssessmentFlowHeader\b/,
      `${file}: a kérdésszakasz nem a közös fejlécet használja`,
    );
    assert.match(
      component,
      /<AssessmentStatus\b/,
      `${file}: a lezáró állapot nem a közös státuszpanelt használja`,
    );
  }
});

test("az introval rendelkező flow-k a közös intro komponenst használják", () => {
  for (const file of assessmentClients.slice(1)) {
    assert.match(
      source(file),
      /<AssessmentIntro\b/,
      `${file}: a bevezető nincs egységesítve`,
    );
  }
});

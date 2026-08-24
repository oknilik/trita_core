import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import path from "node:path";

const ROOT = process.cwd();

function source(file: string): string {
  return readFileSync(path.join(ROOT, file), "utf8");
}

test("directional navigation uses the shared chevron contract across protected flows", () => {
  const icons = source("src/components/ui/icons.tsx");
  const journey = source("src/components/journey/JourneyNextStepCard.tsx");
  const assessment = source("src/components/assessment/TeamRoleQuestionnaire.tsx");

  assert.match(icons, /export function ChevronRightIcon/);

  for (const [surface, component] of [
    ["journey", journey],
    ["assessment", assessment],
  ] as const) {
    assert.match(
      component,
      /import \{ ChevronRightIcon \} from "@\/components\/ui\/icons"/,
      `${surface}: a közös jobb chevron importja hiányzik`,
    );
    assert.match(
      component,
      /<ChevronRightIcon/,
      `${surface}: a továbblépési jelzés nem a közös ikont használja`,
    );
    assert.equal(
      component.includes("→"),
      false,
      `${surface}: nyers előrenyíl maradt a védett folyamatban`,
    );
  }
});

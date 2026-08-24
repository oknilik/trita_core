import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const migration = readFileSync(
  join(
    process.cwd(),
    "prisma/migrations/20260824190000_pilot_backlog_data_integrity/migration.sql",
  ),
  "utf8",
);

test("az AssessmentResult unique index elott fail-closed ellenorzes es deduplikacio fut", () => {
  const guardPosition = migration.indexOf("AssessmentResult deduplication aborted");
  const deletePosition = migration.indexOf('DELETE FROM "AssessmentResult"');
  const indexPosition = migration.indexOf(
    'CREATE UNIQUE INDEX "AssessmentResult_userProfileId_campaignId_key"',
  );

  assert.ok(guardPosition >= 0, "hianyzik az ellentmondo duplikatumok fail-closed vedelme");
  assert.ok(deletePosition > guardPosition, "a torles a konfliktus-ellenorzes elott fut");
  assert.ok(indexPosition > deletePosition, "az egyedi index a deduplikacio elott jon letre");
  assert.match(migration, /"scores" IS DISTINCT FROM right_result\."scores"/);
  assert.match(migration, /COUNT\("shareToken"\) > 1/);
  assert.match(migration, /WHERE "userProfileId" IS NOT NULL\s+AND "campaignId" IS NOT NULL/);
});

test("a pulse backfill a kanonikus teamIds elso elemet preferalja", () => {
  assert.match(
    migration,
    /SET "teamId" = COALESCE\(campaign\."teamIds"\[1\], campaign\."teamId"\)/,
  );
});

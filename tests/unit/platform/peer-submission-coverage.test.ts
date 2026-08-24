import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import {
  countCoveredCurrentPeerTargets,
  hasCoveredCurrentPeerTargets,
} from "@/lib/peer-submission-coverage";

test("a kilepett tag stale observationje nem potolhat egy aktualis csapattagot", () => {
  assert.equal(
    hasCoveredCurrentPeerTargets(
      ["rater", "current-a", "current-b"],
      "rater",
      ["current-a", "former-member"],
    ),
    false,
  );
});

test("csak az aktualis celcsapattagok teljes halmaza zarja le a peer lepest", () => {
  assert.equal(
    hasCoveredCurrentPeerTargets(
      ["rater", "current-a", "current-b"],
      "rater",
      ["former-member", "current-b", "current-a", "current-a"],
    ),
    true,
  );
});

test("onmagaban allo tagnal nem teljesul automatikusan a peer kor", () => {
  assert.equal(hasCoveredCurrentPeerTargets(["rater"], "rater", []), false);
});

test("a reszhaladas ugyanazt az aktualis celhalmaz-metszetet szamolja", () => {
  assert.deepEqual(
    countCoveredCurrentPeerTargets(
      ["rater", "current-a", "current-b", "current-c"],
      "rater",
      ["current-a", "former-member", "current-a", "current-c"],
    ),
    { done: 2, total: 3 },
  );
});

test("a coverage zar a kampany-resztvevo sort FOR UPDATE modban foglalja", () => {
  const source = readFileSync(
    join(process.cwd(), "src/lib/peer-submission-coverage.ts"),
    "utf8",
  );
  assert.match(source, /FROM "CampaignParticipant"/);
  assert.match(source, /WHERE "campaignId" = \$\{campaignId\}/);
  assert.match(source, /AND "userId" = \$\{raterUserId\}/);
  assert.match(source, /FOR UPDATE/);
});

test("a kampany shared zar megorzi a kulon ertekelok parhuzamossagat, de kizarja a lezarast", () => {
  const source = readFileSync(
    join(process.cwd(), "src/lib/peer-submission-coverage.ts"),
    "utf8",
  );
  assert.match(
    source,
    /FROM "Campaign"[\s\S]*WHERE "id" = \$\{campaignId\}[\s\S]*FOR SHARE/,
  );
});

test("a mutacio elotti guard a sorzar utan ujraolvassa a lepest es a celcsapatot", () => {
  const source = readFileSync(
    join(process.cwd(), "src/lib/peer-submission-coverage.ts"),
    "utf8",
  );
  const guardStart = source.indexOf("export async function lockAndValidatePeerSubmission(");
  const campaignLockPosition = source.indexOf(
    "lockPeerSubmissionCampaign(",
    guardStart,
  );
  const lockPosition = source.indexOf(
    "lockPeerSubmissionCoverageDecision(",
    guardStart,
  );
  const participantReadPosition = source.indexOf(
    "db.campaignParticipant.findUnique(",
    guardStart,
  );
  const activeGuardPosition = source.indexOf(
    'participant.campaign.status !== "ACTIVE"',
    guardStart,
  );
  const stepGuardPosition = source.indexOf("isStepOpenFor(", guardStart);
  const membershipReadPosition = source.indexOf("db.teamMember.findMany(", guardStart);

  assert.ok(guardStart >= 0, "hianyzik az autoritativ tranzakcios guard");
  assert.ok(
    campaignLockPosition >= 0,
    "a tranzakcios guard nem foglal shared kampanyzarat",
  );
  assert.ok(lockPosition >= 0, "a tranzakcios guard nem foglal sorzarat");
  assert.ok(
    participantReadPosition >= 0 &&
      activeGuardPosition >= 0 &&
      stepGuardPosition >= 0 &&
      membershipReadPosition >= 0,
    "a tranzakcios guard egyik autoritativ ujraellenorzese hianyzik",
  );
  assert.ok(
    campaignLockPosition < lockPosition && lockPosition < participantReadPosition,
    "a zar-sorrendnek Campaign FOR SHARE -> Participant FOR UPDATE -> ujraolvasasnak kell lennie",
  );
  assert.ok(
    participantReadPosition < activeGuardPosition &&
      activeGuardPosition < stepGuardPosition &&
      stepGuardPosition < membershipReadPosition,
    "a campaign/step/team guard sorrendje nem vedi a mutaciot",
  );
  assert.match(source, /error: "CAMPAIGN_NOT_ACTIVE"/);
  assert.match(source, /error: "STEP_LOCKED"/);
  assert.match(source, /error: "NO_TARGET_TEAM"/);
});

test("mindket peer submit route halmazalapu lefedettseget hasznal count helyett", () => {
  for (const routePath of [
    "src/app/api/trust/peers/submit/route.ts",
    "src/app/api/team-roles/peers/submit/route.ts",
  ]) {
    const source = readFileSync(join(process.cwd(), routePath), "utf8");
    assert.match(source, /hasCoveredCurrentPeerTargets\(/, `${routePath}: hianyzik a halmazellenorzes`);
    assert.doesNotMatch(
      source,
      /(?:trustObservation|teamRoleObservation)\.count\(/,
      `${routePath}: a stale sorokra erzekeny count ellenorzes visszakerult`,
    );
    assert.match(
      source,
      /const currentMembers = await tx\.teamMember\.findMany/,
      `${routePath}: a tagsag nincs a tranzakcioban ujraolvasva`,
    );
    const lockPosition = source.indexOf("lockAndValidatePeerSubmission(");
    const membershipPosition = source.indexOf("tx.teamMember.findMany(");
    const upsertPosition = source.indexOf("Observation.upsert(");
    assert.ok(lockPosition >= 0, `${routePath}: hianyzik a zarolt campaign/step guard`);
    assert.ok(
      upsertPosition >= 0 &&
        lockPosition < membershipPosition &&
        membershipPosition < upsertPosition,
      `${routePath}: a zarnak es az aktualis tagsagellenorzesnek az observation upsert elott kell megtortennie`,
    );
    assert.match(
      source,
      /if \(!result\.ok\)[\s\S]*result\.error === "NOT_FOUND"[\s\S]*409/,
      `${routePath}: a tranzakcios guard hibaja nem jut el a 400\/404\/409 valaszba`,
    );
  }
});

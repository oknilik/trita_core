import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { getCampaignActivationPreconditionFailure } from "@/lib/campaign-activation-core";

test("az atomikus aktivacios validator a commit elotti aktualis konfiguraciot vedi", () => {
  assert.equal(
    getCampaignActivationPreconditionFailure({
      presetId: null,
      steps: ["PSYCH_SAFETY"],
      teamIds: ["team"],
      participantUserIds: ["a", "b"],
      targetMemberUserIds: ["a", "b"],
    }),
    "CAMPAIGN_MINIMUM_PARTICIPANTS_NOT_MET",
  );
  assert.equal(
    getCampaignActivationPreconditionFailure({
      presetId: null,
      steps: ["SELF_ASSESSMENT"],
      teamIds: ["team"],
      participantUserIds: ["a", "b"],
      targetMemberUserIds: ["a", "b"],
    }),
    "CAMPAIGN_MINIMUM_PARTICIPANTS_NOT_MET",
  );
  assert.equal(
    getCampaignActivationPreconditionFailure({
      presetId: null,
      steps: ["TRUST_360"],
      teamIds: ["team"],
      participantUserIds: ["a", "b", "outside"],
      targetMemberUserIds: ["a", "b"],
    }),
    "PARTICIPANT_OUTSIDE_TARGET_TEAMS",
  );
  assert.equal(
    getCampaignActivationPreconditionFailure({
      presetId: "SCAN_V1",
      steps: ["PSYCH_SAFETY"],
      teamIds: ["team-a", "team-b"],
      participantUserIds: ["a", "b", "c"],
      targetMemberUserIds: ["a", "b", "c"],
    }),
    "PSYCH_SAFETY_SINGLE_TEAM_REQUIRED",
  );
  assert.equal(
    getCampaignActivationPreconditionFailure({
      presetId: null,
      steps: ["SELF_ASSESSMENT"],
      teamIds: [],
      participantUserIds: ["a"],
      targetMemberUserIds: [],
    }),
    null,
  );
});

test("a draft edit route nem hasznal stale status utani feltetel nelkuli update-et", () => {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/org/[id]/campaigns/[campaignId]/route.ts"),
    "utf8",
  );
  const editBranch = route.slice(
    route.indexOf('if ("action" in body.data)'),
    route.indexOf('if (!("status" in body.data))'),
  );
  assert.match(editBranch, /updateDraftCampaignAtomically\(campaignId/);
  assert.doesNotMatch(editBranch, /prisma\.campaign\.update\(/);

  const campaignSteps = readFileSync(
    join(process.cwd(), "src/lib/campaign-steps.ts"),
    "utf8",
  );
  const draftHelper = campaignSteps.slice(
    campaignSteps.indexOf("export async function updateDraftCampaignAtomically"),
    campaignSteps.indexOf("export async function activateCampaignAtomically"),
  );
  assert.match(draftHelper, /where: \{ id: campaignId, status: "DRAFT" \}/);
  assert.match(draftHelper, /claimed\.count === 1/);
});

test("a participant POST es DELETE ugyanazon Campaign sorzar mogott fut, mint az aktivalas", () => {
  const route = readFileSync(
    join(process.cwd(), "src/app/api/org/[id]/campaigns/[campaignId]/route.ts"),
    "utf8",
  );
  const postBranch = route.slice(route.indexOf("export async function POST("));
  assert.ok(
    postBranch.indexOf("lockCampaignForParticipantMutation(") <
      postBranch.indexOf("tx.campaignParticipant.createMany("),
    "a participant create a campaign lock elott fut",
  );
  assert.match(postBranch, /const campaign = await tx\.campaign\.findUnique/);
  assert.doesNotMatch(postBranch, /ctx\.campaign\.status !== "ACTIVE"/);

  const deleteRoute = readFileSync(
    join(
      process.cwd(),
      "src/app/api/org/[id]/campaigns/[campaignId]/participants/[participantUserId]/route.ts",
    ),
    "utf8",
  );
  assert.ok(
    deleteRoute.indexOf("lockCampaignForParticipantMutation(") <
      deleteRoute.indexOf("tx.campaignParticipant.deleteMany("),
    "a participant delete a campaign lock elott fut",
  );

  const campaignSteps = readFileSync(
    join(process.cwd(), "src/lib/campaign-steps.ts"),
    "utf8",
  );
  const lockHelper = campaignSteps.slice(
    campaignSteps.indexOf("export async function lockCampaignForParticipantMutation"),
    campaignSteps.indexOf("export async function updateDraftCampaignAtomically"),
  );
  assert.match(lockHelper, /FROM "Campaign"/);
  assert.match(lockHelper, /FOR UPDATE/);
});

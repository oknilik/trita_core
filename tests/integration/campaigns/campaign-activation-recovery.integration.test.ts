/**
 * Pilot P0 — kampányaktiválás állapotfoglalása és post-commit értesítés-
 * helyreállítás. Valós Postgresen őrzi a párhuzamos update sorzár-viselkedését
 * és a notification unique kulcs versenybiztos idempotenciáját.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  activateCampaignAtomically,
  isCampaignActivationPreconditionError,
  lockCampaignForParticipantMutation,
  reconcileCampaignStepOpenings,
  releaseDueCampaignSteps,
  updateDraftCampaignAtomically,
} from "@/lib/campaign-steps";

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

async function createProfile() {
  return prisma.userProfile.create({
    data: {
      id: makeId("activation_user"),
      clerkId: makeId("activation_clerk"),
      testType: "TRITAN",
      testTypeAssignedAt: new Date(),
    },
  });
}

async function createCampaign(options: {
  status: "DRAFT" | "ACTIVE";
  steps?: string[];
  withTeam?: boolean;
}) {
  const profile = await createProfile();
  const org = await prisma.organization.create({
    data: {
      id: makeId("activation_org"),
      name: `Activation org ${makeId("name")}`,
      ownerId: profile.id,
    },
  });
  const team = options.withTeam
    ? await prisma.team.create({
        data: {
          id: makeId("activation_team"),
          name: `Activation team ${makeId("name")}`,
          ownerId: profile.id,
          orgId: org.id,
        },
      })
    : null;
  if (team) {
    await prisma.teamMember.create({
      data: { teamId: team.id, userId: profile.id },
    });
  }
  const steps = options.steps ?? ["SELF_ASSESSMENT"];
  const campaign = await prisma.campaign.create({
    data: {
      id: makeId("activation_campaign"),
      orgId: org.id,
      name: `Activation campaign ${makeId("name")}`,
      type: steps[0],
      steps,
      status: options.status,
      createdBy: profile.id,
      activatedAt: options.status === "ACTIVE" ? new Date() : null,
      teamId: team?.id ?? null,
      teamIds: team ? [team.id] : [],
      stepIntervalHours: 0,
    },
  });
  const participant = await prisma.campaignParticipant.create({
    data: { campaignId: campaign.id, userId: profile.id },
  });
  return { profile, org, team, campaign, participant };
}

function stepNotifications(userId: string, campaignId: string) {
  return prisma.notification.findMany({
    where: {
      userId,
      sourceId: campaignId,
      type: "MEASUREMENT_STEP_OPENED",
    },
  });
}

test("kampányaktiválás és értesítés-helyreállítás", async (t) => {
  await t.test(
    "két párhuzamos DRAFT→ACTIVE kérésből csak egy inicializál és az időpontok stabilak",
    async () => {
      const { campaign, team } = await createCampaign({
        status: "DRAFT",
        steps: ["TEAM_ROLE"],
        withTeam: true,
      });
      assert.ok(team);

      const results = await Promise.all([
        activateCampaignAtomically(campaign.id),
        activateCampaignAtomically(campaign.id),
      ]);
      assert.deepEqual(
        results.map((result) => result.outcome).sort(),
        ["activated", "already_active"],
      );
      assert.equal(
        results.reduce((sum, result) => sum + result.openings.length, 0),
        1,
        "csak az állapotfoglalás nyertese inicializálhat",
      );

      const [storedCampaign, storedTeam] = await Promise.all([
        prisma.campaign.findUniqueOrThrow({ where: { id: campaign.id } }),
        prisma.team.findUniqueOrThrow({ where: { id: team.id } }),
      ]);
      assert.equal(storedCampaign.status, "ACTIVE");
      assert.ok(storedCampaign.activatedAt);
      assert.equal(storedTeam.teamRoleRoundActive, true);
      assert.equal(
        storedTeam.teamRoleRoundStartedAt?.toISOString(),
        storedCampaign.activatedAt.toISOString(),
      );
      assert.ok(
        results.every(
          (result) =>
            result.campaign.activatedAt?.toISOString() ===
            storedCampaign.activatedAt?.toISOString(),
        ),
        "a nyertes és a vesztes kérés ugyanazt az aktiválási időt adja vissza",
      );

      const retry = await activateCampaignAtomically(campaign.id);
      assert.equal(retry.outcome, "already_active");
      const afterRetryTeam = await prisma.team.findUniqueOrThrow({
        where: { id: team.id },
      });
      assert.equal(
        afterRetryTeam.teamRoleRoundStartedAt?.toISOString(),
        storedTeam.teamRoleRoundStartedAt?.toISOString(),
        "a retry nem írhatja újra a team-role kör kezdetét",
      );
    },
  );

  await t.test(
    "a draft szerkesztes es aktivalas ugyanazt a sort foglalja, az uj konfiguracio pedig ujravalidalodik",
    async () => {
      // Ha az aktivacio nyer, egy kesobb beerkezo stale edit nem irhatja at
      // az ACTIVE kampany lepessorozatat.
      const activationWinner = await createCampaign({
        status: "DRAFT",
        steps: ["SELF_ASSESSMENT"],
        withTeam: true,
      });
      await activateCampaignAtomically(activationWinner.campaign.id);
      const staleEdit = await updateDraftCampaignAtomically(
        activationWinner.campaign.id,
        {
          steps: ["TEAM_ROLE"],
          type: "TEAM_ROLE",
          teamId: activationWinner.team?.id ?? null,
          teamIds: activationWinner.team ? [activationWinner.team.id] : [],
        },
      );
      assert.equal(staleEdit.outcome, "not_draft");
      assert.deepEqual(
        (await prisma.campaign.findUniqueOrThrow({
          where: { id: activationWinner.campaign.id },
          select: { steps: true },
        })).steps,
        ["SELF_ASSESSMENT"],
      );

      // Ha a draft edit foglal elobb, az aktivacio mar az uj konfiguraciot
      // inicializalja (nem a route korabbi snapshotjat).
      const editWinner = await createCampaign({
        status: "DRAFT",
        steps: ["SELF_ASSESSMENT"],
        withTeam: true,
      });
      assert.ok(editWinner.team);
      const editPromise = updateDraftCampaignAtomically(editWinner.campaign.id, {
        steps: ["TEAM_ROLE"],
        type: "TEAM_ROLE",
        teamId: editWinner.team.id,
        teamIds: [editWinner.team.id],
      });
      const activationPromise = activateCampaignAtomically(editWinner.campaign.id);
      const [edit, activation] = await Promise.all([editPromise, activationPromise]);
      const stored = await prisma.campaign.findUniqueOrThrow({
        where: { id: editWinner.campaign.id },
        select: { status: true, steps: true },
      });
      assert.equal(stored.status, "ACTIVE");
      if (edit.outcome === "updated") {
        assert.deepEqual(stored.steps, ["TEAM_ROLE"]);
        assert.equal(activation.openings[0]?.stepType, "TEAM_ROLE");
      } else {
        assert.deepEqual(stored.steps, ["SELF_ASSESSMENT"]);
        assert.equal(activation.openings[0]?.stepType, "SELF_ASSESSMENT");
      }

      // A claim utan eszlelt uzleti hiba rollbackolja az ACTIVE statuszt is.
      const invalidLatestConfig = await createCampaign({
        status: "DRAFT",
        steps: ["SELF_ASSESSMENT"],
        withTeam: true,
      });
      assert.ok(invalidLatestConfig.team);
      await updateDraftCampaignAtomically(invalidLatestConfig.campaign.id, {
        steps: ["PSYCH_SAFETY"],
        type: "PSYCH_SAFETY",
        teamId: invalidLatestConfig.team.id,
        teamIds: [invalidLatestConfig.team.id],
      });
      await assert.rejects(
        activateCampaignAtomically(invalidLatestConfig.campaign.id),
        (error: unknown) =>
          isCampaignActivationPreconditionError(error) &&
          error.code === "ANONYMITY_THRESHOLD_NOT_MET",
      );
      const afterRejectedActivation = await prisma.campaign.findUniqueOrThrow({
        where: { id: invalidLatestConfig.campaign.id },
        select: { status: true, activatedAt: true },
      });
      assert.equal(afterRejectedActivation.status, "DRAFT");
      assert.equal(afterRejectedActivation.activatedAt, null);
    },
  );

  await t.test(
    "a participant mutacio teljesen az aktivalasi precondition olvasas elott fejezodik be",
    async () => {
      const { campaign, org } = await createCampaign({
        status: "DRAFT",
        steps: ["SELF_ASSESSMENT"],
      });
      const addedProfile = await createProfile();

      let signalLocked!: () => void;
      const mutationLocked = new Promise<void>((resolve) => {
        signalLocked = resolve;
      });
      let releaseMutation!: () => void;
      const mutationMayCommit = new Promise<void>((resolve) => {
        releaseMutation = resolve;
      });
      const participantMutation = prisma.$transaction(async (tx) => {
        assert.equal(
          await lockCampaignForParticipantMutation(tx, campaign.id, org.id),
          true,
        );
        signalLocked();
        await mutationMayCommit;
        await tx.campaignParticipant.create({
          data: { campaignId: campaign.id, userId: addedProfile.id },
        });
      });

      await mutationLocked;
      const activation = activateCampaignAtomically(campaign.id);
      const stateBeforeRelease = await Promise.race([
        activation.then(() => "settled" as const),
        new Promise<"waiting">((resolve) => {
          setTimeout(() => resolve("waiting"), 75);
        }),
      ]);
      releaseMutation();
      const [, activationResult] = await Promise.all([
        participantMutation,
        activation,
      ]);

      assert.equal(
        stateBeforeRelease,
        "waiting",
        "az aktivalas nem vart a participant mutacio campaign zarjara",
      );
      assert.equal(activationResult.outcome, "activated");
      assert.equal(
        activationResult.openings.length,
        2,
        "az aktivalas nem a commitolt resztvevo-listat inicializalta",
      );
    },
  );

  await t.test(
    "a DB-ben nyitott lépés hiányzó értesítése retryból és release reconciliationből helyreáll",
    async () => {
      const { profile, campaign } = await createCampaign({ status: "ACTIVE" });
      assert.equal((await stepNotifications(profile.id, campaign.id)).length, 0);

      const attempts = await Promise.all([
        reconcileCampaignStepOpenings({ campaignId: campaign.id }),
        reconcileCampaignStepOpenings({ campaignId: campaign.id }),
      ]);
      assert.deepEqual(attempts, [1, 1]);
      assert.equal(
        (await stepNotifications(profile.id, campaign.id)).length,
        1,
        "párhuzamos reconciliation mellett sincs dupla értesítés",
      );

      // Egy korábbi post-commit hibát modellezünk: a lépés nyitva van, az
      // értesítés nincs. A napi cron ugyanazt a release függvényt hívja.
      await prisma.notification.deleteMany({
        where: { sourceId: campaign.id, type: "MEASUREMENT_STEP_OPENED" },
      });
      const released = await releaseDueCampaignSteps({ campaignId: campaign.id });
      assert.equal(released, 0, "nem volt új kapu, csak helyreállítás");
      assert.equal((await stepNotifications(profile.id, campaign.id)).length, 1);

      await releaseDueCampaignSteps({ campaignId: campaign.id });
      assert.equal(
        (await stepNotifications(profile.id, campaign.id)).length,
        1,
        "az ismételt cron-futás idempotens",
      );
    },
  );

  await t.test(
    "párhuzamos cron és force release ugyanazt a kaput csak egyszer foglalja le",
    async () => {
      for (const scenario of [
        { name: "cron", force: false, gateOffsetMs: -60_000 },
        { name: "force", force: true, gateOffsetMs: 60_000 },
      ]) {
        const { profile, campaign, participant } = await createCampaign({
          status: "ACTIVE",
        });
        await prisma.campaignParticipant.update({
          where: { id: participant.id },
          data: {
            nextStepOpensAt: new Date(Date.now() + scenario.gateOffsetMs),
          },
        });

        const attempts = await Promise.all([
          releaseDueCampaignSteps({
            campaignId: campaign.id,
            force: scenario.force,
          }),
          releaseDueCampaignSteps({
            campaignId: campaign.id,
            force: scenario.force,
          }),
        ]);
        assert.deepEqual(
          attempts.sort((left, right) => left - right),
          [0, 1],
          `${scenario.name}: csak a winner számolhat release-t`,
        );

        const stored = await prisma.campaignParticipant.findUniqueOrThrow({
          where: { id: participant.id },
        });
        assert.equal(stored.nextStepOpensAt, null);
        assert.equal(
          (await stepNotifications(profile.id, campaign.id)).length,
          1,
          `${scenario.name}: a winner-claim után egy értesítés maradhat`,
        );
      }
    },
  );
});

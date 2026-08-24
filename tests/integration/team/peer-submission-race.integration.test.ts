/**
 * Peer-bekuldesi race regresszio — valos PostgreSQL sorzarral.
 *
 * Ket kulon HTTP-keres ugyanannak az ertekelonek ket kulon celjat irhatja
 * egyszerre. Zar nelkul mindket tranzakcio csak a sajat, meg nem commitolt
 * sorat latna, ezert mindket coverage-dontes false lenne es a resztvevo a
 * peer lepesen ragadna. A CampaignParticipant FOR UPDATE zarja mellett a
 * masodik tranzakcio mar az elso commitolt observationjet is latja.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { advanceCampaignStepForUser } from "@/lib/campaign-steps";
import {
  hasCoveredCurrentPeerTargets,
  lockAndValidatePeerSubmission,
  type PeerSubmissionGuardResult,
} from "@/lib/peer-submission-coverage";

type PeerKind = "trust" | "team-role";

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
}

async function createProfile(prefix: string) {
  const id = makeId(prefix);
  return prisma.userProfile.create({
    data: {
      id,
      clerkId: makeId(`${prefix}_clerk`),
      email: `${id}@peer-race.test`,
      username: id,
    },
    select: { id: true },
  });
}

async function createPeerRaceFixture(kind: PeerKind) {
  const owner = await createProfile("peer_race_owner");
  const rater = await createProfile("peer_race_rater");
  const firstTarget = await createProfile("peer_race_target_a");
  const secondTarget = await createProfile("peer_race_target_b");
  const org = await prisma.organization.create({
    data: { name: `Peer race ${makeId("org")}`, ownerId: owner.id },
    select: { id: true },
  });
  const team = await prisma.team.create({
    data: {
      name: `Peer race ${makeId("team")}`,
      orgId: org.id,
      ownerId: owner.id,
    },
    select: { id: true },
  });
  await prisma.teamMember.createMany({
    data: [rater, firstTarget, secondTarget].map((profile) => ({
      teamId: team.id,
      userId: profile.id,
    })),
  });

  const stepType: "TRUST_360" | "TEAM_ROLE_360" =
    kind === "trust" ? "TRUST_360" : "TEAM_ROLE_360";
  const campaign = await prisma.campaign.create({
    data: {
      orgId: org.id,
      name: `Peer race ${kind} ${makeId("campaign")}`,
      type: stepType,
      steps: [stepType, "PSYCH_SAFETY"],
      teamId: team.id,
      teamIds: [team.id],
      status: "ACTIVE",
      activatedAt: new Date(),
      stepIntervalHours: 0,
      createdBy: owner.id,
      participants: { create: { userId: rater.id } },
    },
    select: { id: true },
  });

  return {
    campaignId: campaign.id,
    teamId: team.id,
    raterId: rater.id,
    targetIds: [firstTarget.id, secondTarget.id] as const,
    stepType,
  };
}

async function submitPeerTarget(
  fixture: Awaited<ReturnType<typeof createPeerRaceFixture>>,
  kind: PeerKind,
  aboutUserId: string,
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const guard = await lockAndValidatePeerSubmission(
      tx,
      fixture.campaignId,
      fixture.raterId,
      fixture.stepType,
    );
    assert.equal(
      guard.ok,
      true,
      "a resztvevo zarolt guardja elutasitotta a bekuldest",
    );
    if (!guard.ok) return false;

    if (kind === "trust") {
      await tx.trustObservation.create({
        data: {
          campaignId: fixture.campaignId,
          teamId: guard.teamId,
          aboutUserId,
          raterUserId: fixture.raterId,
          answers: { trust: 5, help: 3, openness: 5, inclusion: 3, collaboration: 3 },
        },
      });
    } else {
      await tx.teamRoleObservation.create({
        data: {
          campaignId: fixture.campaignId,
          teamId: guard.teamId,
          aboutUserId,
          raterUserId: fixture.raterId,
          selections: { OG1: 2 },
        },
      });
    }

    const currentMembers = await tx.teamMember.findMany({
      where: { teamId: guard.teamId },
      select: { userId: true },
    });
    const rated =
      kind === "trust"
        ? await tx.trustObservation.findMany({
            where: {
              campaignId: fixture.campaignId,
              teamId: guard.teamId,
              raterUserId: fixture.raterId,
            },
            select: { aboutUserId: true },
          })
        : await tx.teamRoleObservation.findMany({
            where: {
              campaignId: fixture.campaignId,
              teamId: guard.teamId,
              raterUserId: fixture.raterId,
            },
            select: { aboutUserId: true },
          });
    const covered = hasCoveredCurrentPeerTargets(
      currentMembers.map((member) => member.userId),
      fixture.raterId,
      rated.map((observation) => observation.aboutUserId),
    );
    if (covered) {
      await advanceCampaignStepForUser(fixture.raterId, fixture.stepType, {
        campaignId: fixture.campaignId,
        db: tx,
        emitNotifications: false,
      });
    }
    return covered;
  });
}

test("a parhuzamos kulon-cel peer bekuldes nem vesziti el a coverage dontest", async (t) => {
  for (const kind of ["trust", "team-role"] as const) {
    await t.test(kind, async () => {
      const fixture = await createPeerRaceFixture(kind);
      const outcomes = await Promise.all(
        fixture.targetIds.map((targetId) => submitPeerTarget(fixture, kind, targetId)),
      );

      assert.equal(
        outcomes.filter(Boolean).length,
        1,
        "a masodik tranzakcionak az elso observationjet latva le kell zarnia a lefedettseget",
      );
      const participant = await prisma.campaignParticipant.findUniqueOrThrow({
        where: {
          campaignId_userId: {
            campaignId: fixture.campaignId,
            userId: fixture.raterId,
          },
        },
        select: { currentStep: true, stepCompletions: true },
      });
      assert.equal(participant.currentStep, 1, "a resztvevo a peer lepesen ragadt");
      assert.match(JSON.stringify(participant.stepCompletions), new RegExp(fixture.stepType));

      const observationCount =
        kind === "trust"
          ? await prisma.trustObservation.count({
              where: { campaignId: fixture.campaignId, raterUserId: fixture.raterId },
            })
          : await prisma.teamRoleObservation.count({
              where: { campaignId: fixture.campaignId, raterUserId: fixture.raterId },
            });
      assert.equal(observationCount, 2);
    });
  }
});

test("a sorzarra varo stale peer keres nem irhat a lepes tovabbleptetese utan", async (t) => {
  for (const kind of ["trust", "team-role"] as const) {
    await t.test(kind, async () => {
      const fixture = await createPeerRaceFixture(kind);
      const [seededTargetId, completingTargetId] = fixture.targetIds;
      const seededTrustAnswers = {
        trust: 1,
        help: 1,
        openness: 1,
        inclusion: 1,
        collaboration: 1,
      };
      const staleTrustAnswers = {
        trust: 5,
        help: 3,
        openness: 5,
        inclusion: 3,
        collaboration: 3,
      };
      const seededSelections = { OG1: 1 };
      const staleSelections = { OG1: 2 };

      if (kind === "trust") {
        await prisma.trustObservation.create({
          data: {
            campaignId: fixture.campaignId,
            teamId: fixture.teamId,
            aboutUserId: seededTargetId,
            raterUserId: fixture.raterId,
            answers: seededTrustAnswers,
          },
        });
      } else {
        await prisma.teamRoleObservation.create({
          data: {
            campaignId: fixture.campaignId,
            teamId: fixture.teamId,
            aboutUserId: seededTargetId,
            raterUserId: fixture.raterId,
            selections: seededSelections,
          },
        });
      }

      let signalFirstLocked!: () => void;
      const firstLocked = new Promise<void>((resolve) => {
        signalFirstLocked = resolve;
      });
      let releaseFirst!: () => void;
      const firstMayCommit = new Promise<void>((resolve) => {
        releaseFirst = resolve;
      });

      const completingSubmission = prisma.$transaction(async (tx) => {
        const guard = await lockAndValidatePeerSubmission(
          tx,
          fixture.campaignId,
          fixture.raterId,
          fixture.stepType,
        );
        assert.equal(guard.ok, true);
        if (!guard.ok) return false;

        signalFirstLocked();
        await firstMayCommit;

        if (kind === "trust") {
          await tx.trustObservation.create({
            data: {
              campaignId: fixture.campaignId,
              teamId: guard.teamId,
              aboutUserId: completingTargetId,
              raterUserId: fixture.raterId,
              answers: staleTrustAnswers,
            },
          });
        } else {
          await tx.teamRoleObservation.create({
            data: {
              campaignId: fixture.campaignId,
              teamId: guard.teamId,
              aboutUserId: completingTargetId,
              raterUserId: fixture.raterId,
              selections: staleSelections,
            },
          });
        }

        await advanceCampaignStepForUser(fixture.raterId, fixture.stepType, {
          campaignId: fixture.campaignId,
          db: tx,
          emitNotifications: false,
        });
        return true;
      });

      await firstLocked;
      let signalStaleStarted!: () => void;
      const staleStarted = new Promise<void>((resolve) => {
        signalStaleStarted = resolve;
      });
      const staleSubmission: Promise<PeerSubmissionGuardResult> = prisma.$transaction(
        async (tx) => {
          signalStaleStarted();
          const guard = await lockAndValidatePeerSubmission(
            tx,
            fixture.campaignId,
            fixture.raterId,
            fixture.stepType,
          );
          if (!guard.ok) return guard;

          // Ez a feluliras csak akkor futhatna le, ha a zar utani guard nem
          // latna az elso tranzakcio altal mar lezart peer lepest.
          if (kind === "trust") {
            await tx.trustObservation.update({
              where: {
                campaignId_aboutUserId_raterUserId: {
                  campaignId: fixture.campaignId,
                  aboutUserId: seededTargetId,
                  raterUserId: fixture.raterId,
                },
              },
              data: { answers: staleTrustAnswers },
            });
          } else {
            await tx.teamRoleObservation.update({
              where: {
                campaignId_aboutUserId_raterUserId: {
                  campaignId: fixture.campaignId,
                  aboutUserId: seededTargetId,
                  raterUserId: fixture.raterId,
                },
              },
              data: { selections: staleSelections },
            });
          }
          return guard;
        },
      );

      await staleStarted;
      const stateBeforeRelease = await Promise.race([
        staleSubmission.then(() => "settled" as const),
        new Promise<"waiting">((resolve) => {
          setTimeout(() => resolve("waiting"), 75);
        }),
      ]);
      releaseFirst();

      const [completed, staleOutcome] = await Promise.all([
        completingSubmission,
        staleSubmission,
      ]);
      assert.equal(
        stateBeforeRelease,
        "waiting",
        "a masodik tranzakcio nem vart a sorzarra",
      );
      assert.equal(completed, true);
      assert.deepEqual(staleOutcome, { ok: false, error: "STEP_LOCKED" });

      const stored =
        kind === "trust"
          ? await prisma.trustObservation.findUniqueOrThrow({
              where: {
                campaignId_aboutUserId_raterUserId: {
                  campaignId: fixture.campaignId,
                  aboutUserId: seededTargetId,
                  raterUserId: fixture.raterId,
                },
              },
              select: { answers: true },
            })
          : await prisma.teamRoleObservation.findUniqueOrThrow({
              where: {
                campaignId_aboutUserId_raterUserId: {
                  campaignId: fixture.campaignId,
                  aboutUserId: seededTargetId,
                  raterUserId: fixture.raterId,
                },
              },
              select: { selections: true },
            });
      if (kind === "trust") {
        assert.deepEqual("answers" in stored && stored.answers, seededTrustAnswers);
      } else {
        assert.deepEqual("selections" in stored && stored.selections, seededSelections);
      }
    });
  }
});

test("a kampanylezarasra varo peer keres commit utan mar nem irhat observationt", async (t) => {
  for (const kind of ["trust", "team-role"] as const) {
    await t.test(kind, async () => {
      const fixture = await createPeerRaceFixture(kind);
      const [targetId] = fixture.targetIds;

      let signalCloseLocked!: () => void;
      const closeLocked = new Promise<void>((resolve) => {
        signalCloseLocked = resolve;
      });
      let releaseClose!: () => void;
      const closeMayCommit = new Promise<void>((resolve) => {
        releaseClose = resolve;
      });

      const closingCampaign = prisma.$transaction(async (tx) => {
        await tx.campaign.update({
          where: { id: fixture.campaignId },
          data: { status: "CLOSED", closedAt: new Date() },
        });
        signalCloseLocked();
        await closeMayCommit;
      });

      await closeLocked;
      let signalSubmissionStarted!: () => void;
      const submissionStarted = new Promise<void>((resolve) => {
        signalSubmissionStarted = resolve;
      });
      const submission: Promise<PeerSubmissionGuardResult> = prisma.$transaction(
        async (tx) => {
          signalSubmissionStarted();
          const guard = await lockAndValidatePeerSubmission(
            tx,
            fixture.campaignId,
            fixture.raterId,
            fixture.stepType,
          );
          if (!guard.ok) return guard;

          if (kind === "trust") {
            await tx.trustObservation.create({
              data: {
                campaignId: fixture.campaignId,
                teamId: guard.teamId,
                aboutUserId: targetId,
                raterUserId: fixture.raterId,
                answers: {
                  trust: 5,
                  help: 3,
                  openness: 5,
                  inclusion: 3,
                  collaboration: 3,
                },
              },
            });
          } else {
            await tx.teamRoleObservation.create({
              data: {
                campaignId: fixture.campaignId,
                teamId: guard.teamId,
                aboutUserId: targetId,
                raterUserId: fixture.raterId,
                selections: { OG1: 2 },
              },
            });
          }
          return guard;
        },
      );

      await submissionStarted;
      const stateBeforeCloseCommit = await Promise.race([
        submission.then(() => "settled" as const),
        new Promise<"waiting">((resolve) => {
          setTimeout(() => resolve("waiting"), 75);
        }),
      ]);
      releaseClose();

      const [, submissionOutcome] = await Promise.all([
        closingCampaign,
        submission,
      ]);
      assert.equal(
        stateBeforeCloseCommit,
        "waiting",
        "a peer guard nem vart a kampany UPDATE zarara",
      );
      assert.deepEqual(submissionOutcome, {
        ok: false,
        error: "CAMPAIGN_NOT_ACTIVE",
      });

      const observationCount =
        kind === "trust"
          ? await prisma.trustObservation.count({
              where: {
                campaignId: fixture.campaignId,
                raterUserId: fixture.raterId,
              },
            })
          : await prisma.teamRoleObservation.count({
              where: {
                campaignId: fixture.campaignId,
                raterUserId: fixture.raterId,
              },
            });
      assert.equal(observationCount, 0);
    });
  }
});

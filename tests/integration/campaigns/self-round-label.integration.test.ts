/**
 * P0.3 — self eredmény kör-címkézés a valódi submit írási úton.
 *
 * A regressziós mátrix a paraméter nélküli belépést, az explicit kört,
 * átfedő kampányokat és a fresh/legacy inicializálási szabályt együtt őrzi.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { getTestConfig } from "@/lib/questions";
import {
  initializeCampaignProgress,
  resolveActiveCampaignIdForStep,
} from "@/lib/campaign-steps";
import { __setAssessmentSubmitViewerResolverForTests } from "@/lib/assessment-submit-auth";
import { POST as assessmentSubmitPOST } from "@/app/api/assessment/submit/route";

const ACTIVATED_AT = new Date("2026-08-16T08:00:00.000Z");

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function buildShortAnswers() {
  return getTestConfig("TRITAN", "hu", "short").questions.map((question, index) => ({
    questionId: question.id,
    value: (index % 5) + 1,
  }));
}

async function createProfile() {
  return prisma.userProfile.create({
    data: {
      id: makeId("self_round_user"),
      clerkId: makeId("self_round_clerk"),
      testType: "TRITAN",
      testTypeAssignedAt: ACTIVATED_AT,
    },
  });
}

async function createCampaign(
  profile: Awaited<ReturnType<typeof createProfile>>,
  options: {
    status?: "ACTIVE" | "CLOSED";
    requireFreshResults?: boolean;
    createdAt?: Date;
    steps?: string[];
  } = {},
) {
  const org = await prisma.organization.create({
    data: {
      id: makeId("self_round_org"),
      name: `Self round org ${makeId("name")}`,
      ownerId: profile.id,
    },
  });
  const steps = options.steps ?? ["SELF_ASSESSMENT", "TRUST_360"];
  const campaign = await prisma.campaign.create({
    data: {
      id: makeId("self_round_campaign"),
      orgId: org.id,
      name: `Self round ${makeId("name")}`,
      type: steps[0],
      steps,
      status: options.status ?? "ACTIVE",
      createdBy: profile.id,
      createdAt: options.createdAt ?? ACTIVATED_AT,
      activatedAt: ACTIVATED_AT,
      requireFreshResults: options.requireFreshResults ?? true,
      stepIntervalHours: 0,
    },
  });
  const participant = await prisma.campaignParticipant.create({
    data: { campaignId: campaign.id, userId: profile.id },
  });
  return { campaign, participant };
}

async function callSubmit(profile: Awaited<ReturnType<typeof createProfile>>, campaignId?: string) {
  const restore = __setAssessmentSubmitViewerResolverForTests(async () => profile.clerkId);
  try {
    return await assessmentSubmitPOST(
      new Request("http://localhost/api/assessment/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          testType: "TRITAN",
          answers: buildShortAnswers(),
          ...(campaignId ? { campaignId } : {}),
        }),
      }),
    );
  } finally {
    restore();
  }
}

async function waitForStep(participantId: string, expectedStep: number) {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    const participant = await prisma.campaignParticipant.findUniqueOrThrow({
      where: { id: participantId },
    });
    if (participant.currentStep === expectedStep) return participant;
    await new Promise((resolve) => setTimeout(resolve, 20));
  }
  const participant = await prisma.campaignParticipant.findUniqueOrThrow({
    where: { id: participantId },
  });
  assert.equal(participant.currentStep, expectedStep);
  return participant;
}

test("P0.3 self kör-címkézés és kampányléptetés", async (t) => {
  await t.test("kampányon kívüli beadás címkézetlen és nem léptet", async () => {
    const profile = await createProfile();
    const response = await callSubmit(profile);
    assert.equal(response.status, 200);
    const body = await response.json();
    const result = await prisma.assessmentResult.findUniqueOrThrow({
      where: { id: body.id },
    });
    assert.equal(result.campaignId, null);
    assert.equal(
      await prisma.campaignParticipant.count({ where: { userId: profile.id } }),
      0,
    );
  });

  await t.test("aktív kampány paraméter nélkül is címkéz és továbblép", async () => {
    const profile = await createProfile();
    const { campaign, participant } = await createCampaign(profile);
    const response = await callSubmit(profile);
    assert.equal(response.status, 200);
    const body = await response.json();
    const result = await prisma.assessmentResult.findUniqueOrThrow({ where: { id: body.id } });
    assert.equal(result.campaignId, campaign.id);

    const advanced = await waitForStep(participant.id, 1);
    assert.equal(advanced.nextStepOpensAt, null);
    assert.equal(
      await resolveActiveCampaignIdForStep(profile.id, "TRUST_360", {
        campaignId: campaign.id,
      }),
      campaign.id,
    );
  });

  await t.test("explicit helyes campaignId ugyanazt a kört címkézi és lépteti", async () => {
    const profile = await createProfile();
    const { campaign, participant } = await createCampaign(profile);
    const response = await callSubmit(profile, campaign.id);
    assert.equal(response.status, 200);
    const body = await response.json();
    const result = await prisma.assessmentResult.findUniqueOrThrow({ where: { id: body.id } });
    assert.equal(result.campaignId, campaign.id);
    await waitForStep(participant.id, 1);
  });

  await t.test("lezárt vagy idegen explicit kör 409 és nem ír eredményt", async () => {
    const profile = await createProfile();
    const closed = await createCampaign(profile, { status: "CLOSED" });
    const before = await prisma.assessmentResult.count({
      where: { userProfileId: profile.id },
    });
    assert.equal((await callSubmit(profile, closed.campaign.id)).status, 409);

    const otherProfile = await createProfile();
    const foreign = await createCampaign(otherProfile);
    assert.equal((await callSubmit(profile, foreign.campaign.id)).status, 409);
    assert.equal(
      await prisma.assessmentResult.count({ where: { userProfileId: profile.id } }),
      before,
    );
  });

  await t.test("két átfedő kampányból egy beadás csak a legkorábbit zárja", async () => {
    const profile = await createProfile();
    const first = await createCampaign(profile, {
      createdAt: new Date("2026-08-16T08:00:00.000Z"),
    });
    const second = await createCampaign(profile, {
      createdAt: new Date("2026-08-16T09:00:00.000Z"),
    });

    const response = await callSubmit(profile);
    const body = await response.json();
    const result = await prisma.assessmentResult.findUniqueOrThrow({ where: { id: body.id } });
    assert.equal(result.campaignId, first.campaign.id);
    await waitForStep(first.participant.id, 1);
    const untouched = await prisma.campaignParticipant.findUniqueOrThrow({
      where: { id: second.participant.id },
    });
    assert.equal(untouched.currentStep, 0);
  });

  await t.test("fresh kör: régi és más körhöz címkézett eredmény nem elég", async () => {
    const profile = await createProfile();
    const target = await createCampaign(profile, { requireFreshResults: true });
    const other = await createCampaign(profile, {
      requireFreshResults: true,
      createdAt: new Date("2026-08-16T09:00:00.000Z"),
    });
    await prisma.assessmentResult.createMany({
      data: [
        {
          userProfileId: profile.id,
          campaignId: null,
          testType: "TRITAN",
          scores: {},
          createdAt: new Date("2026-08-16T07:59:59.000Z"),
        },
        {
          userProfileId: profile.id,
          campaignId: other.campaign.id,
          testType: "TRITAN",
          scores: {},
          createdAt: new Date("2026-08-16T09:30:00.000Z"),
        },
      ],
    });
    await initializeCampaignProgress(target.campaign.id);
    assert.equal(
      (await prisma.campaignParticipant.findUniqueOrThrow({
        where: { id: target.participant.id },
      })).currentStep,
      0,
    );

    await prisma.assessmentResult.create({
      data: {
        userProfileId: profile.id,
        campaignId: target.campaign.id,
        testType: "TRITAN",
        scores: {},
        createdAt: new Date("2026-08-16T09:31:00.000Z"),
      },
    });
    await initializeCampaignProgress(target.campaign.id);
    assert.equal(
      (await prisma.campaignParticipant.findUniqueOrThrow({
        where: { id: target.participant.id },
      })).currentStep,
      1,
    );
  });

  await t.test("legacy fallback: aktiválás utáni címkézetlen eredmény beszámít", async () => {
    const profile = await createProfile();
    const { campaign, participant } = await createCampaign(profile, {
      requireFreshResults: true,
    });
    await prisma.assessmentResult.create({
      data: {
        userProfileId: profile.id,
        campaignId: null,
        testType: "TRITAN",
        scores: {},
        createdAt: new Date("2026-08-16T08:00:01.000Z"),
      },
    });
    await initializeCampaignProgress(campaign.id);
    assert.equal(
      (await prisma.campaignParticipant.findUniqueOrThrow({
        where: { id: participant.id },
      })).currentStep,
      1,
    );
  });
});

/**
 * P1.7 — a szerver-oldali kampánylépés-léptető motor integrációs hálója.
 *
 * A pilot-mag legkevésbé fedett gépezete volt (audit, 2026-08-17): az
 * advanceCampaignStepForUser ütemezési kapuja, a releaseDueCampaignSteps
 * esedékesség/force viselkedése, a MEASUREMENT_STEP_OPENED értesítés
 * dedupe-ja, és az email-pár best-effort jellege (emailNotify).
 *
 * Az email-láb szándékosan hiba-ágra fut (release-env-setup üríti a
 * RESEND_API_KEY-t): a motor viselkedése email-hiba mellett is változatlan
 * kell legyen.
 */

import "./release-env-setup";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  advanceCampaignStepForUser,
  releaseDueCampaignSteps,
} from "@/lib/campaign-steps";

const ACTIVATED_AT = new Date("2026-08-16T08:00:00.000Z");

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

async function createProfile() {
  const id = makeId("step_rel_user");
  return prisma.userProfile.create({
    data: {
      id,
      clerkId: makeId("step_rel_clerk"),
      email: `${id}@step-release.test`,
      testType: "TRITAN",
      testTypeAssignedAt: ACTIVATED_AT,
    },
  });
}

async function createScanCampaign(
  profileId: string,
  options: { stepIntervalHours?: number } = {},
) {
  const org = await prisma.organization.create({
    data: {
      id: makeId("step_rel_org"),
      name: `Step release org ${makeId("name")}`,
      ownerId: profileId,
    },
  });
  const campaign = await prisma.campaign.create({
    data: {
      id: makeId("step_rel_camp"),
      orgId: org.id,
      name: `Scan ${makeId("name")}`,
      type: "SELF_ASSESSMENT",
      steps: ["SELF_ASSESSMENT", "TRUST_360", "PSYCH_SAFETY"],
      status: "ACTIVE",
      createdBy: profileId,
      createdAt: ACTIVATED_AT,
      activatedAt: ACTIVATED_AT,
      requireFreshResults: true,
      stepIntervalHours: options.stepIntervalHours ?? 24,
    },
  });
  const participant = await prisma.campaignParticipant.create({
    data: { campaignId: campaign.id, userId: profileId },
  });
  return { org, campaign, participant };
}

function stepOpenedNotifications(userId: string, campaignId: string) {
  return prisma.notification.findMany({
    where: { userId, type: "MEASUREMENT_STEP_OPENED", sourceId: campaignId },
    orderBy: { createdAt: "asc" },
  });
}

test("kampánylépés-léptető motor", async (t) => {
  await t.test(
    "ütemezési kapu: az advance zárva tartja a következő lépést, értesítés nem megy",
    async () => {
      const profile = await createProfile();
      const { campaign, participant } = await createScanCampaign(profile.id, {
        stepIntervalHours: 24,
      });

      await advanceCampaignStepForUser(profile.id, "SELF_ASSESSMENT", {
        campaignId: campaign.id,
      });

      const after = await prisma.campaignParticipant.findUniqueOrThrow({
        where: { id: participant.id },
      });
      assert.equal(after.currentStep, 1);
      assert.ok(after.nextStepOpensAt, "a kapu-időpontnak be kell állnia");
      assert.ok(
        after.nextStepOpensAt!.getTime() > Date.now(),
        "a kapu a jövőben van",
      );
      assert.equal(
        (await stepOpenedNotifications(profile.id, campaign.id)).length,
        0,
        "kapuzott lépésről nem megy ki értesítés a release előtt",
      );

      // Esedékesség nélkül a (nem force) release nem nyit.
      const released = await releaseDueCampaignSteps({ campaignId: campaign.id });
      assert.equal(released, 0);
      assert.equal(
        (await stepOpenedNotifications(profile.id, campaign.id)).length,
        0,
      );
    },
  );

  await t.test(
    "force release (Küldés most): kaput töröl, értesít, emailNotify hibája nem töri meg",
    async () => {
      const profile = await createProfile();
      const { campaign, participant } = await createScanCampaign(profile.id, {
        stepIntervalHours: 24,
      });
      await advanceCampaignStepForUser(profile.id, "SELF_ASSESSMENT", {
        campaignId: campaign.id,
      });

      // RESEND_API_KEY üres (release-env-setup) → az email-láb hibázik,
      // a release-nek és az in-app értesítésnek ettől függetlenül mennie kell.
      const released = await releaseDueCampaignSteps({
        campaignId: campaign.id,
        force: true,
        emailNotify: true,
      });
      assert.equal(released, 1);

      const after = await prisma.campaignParticipant.findUniqueOrThrow({
        where: { id: participant.id },
      });
      assert.equal(after.nextStepOpensAt, null, "a kapu törlődik");

      const notifs = await stepOpenedNotifications(profile.id, campaign.id);
      assert.equal(notifs.length, 1);
      assert.equal(
        notifs[0].dedupeKey,
        `MEASUREMENT_STEP_OPENED:${campaign.id}:TRUST_360:${profile.id}`,
      );
    },
  );

  await t.test("ismételt release idempotens (dedupe, nincs dupla értesítés)", async () => {
    const profile = await createProfile();
    const { campaign } = await createScanCampaign(profile.id, {
      stepIntervalHours: 24,
    });
    await advanceCampaignStepForUser(profile.id, "SELF_ASSESSMENT", {
      campaignId: campaign.id,
    });

    const first = await releaseDueCampaignSteps({
      campaignId: campaign.id,
      force: true,
      emailNotify: true,
    });
    assert.equal(first, 1);
    const second = await releaseDueCampaignSteps({
      campaignId: campaign.id,
      force: true,
      emailNotify: true,
    });
    assert.equal(second, 0, "kapu nélkül nincs mit újranyitni");
    assert.equal(
      (await stepOpenedNotifications(profile.id, campaign.id)).length,
      1,
      "a dedupe-kulcs megfogja az ismételt értesítést",
    );
  });

  await t.test("esedékes kapu force nélkül is nyílik (cron-út)", async () => {
    const profile = await createProfile();
    const { campaign, participant } = await createScanCampaign(profile.id, {
      stepIntervalHours: 24,
    });
    await advanceCampaignStepForUser(profile.id, "SELF_ASSESSMENT", {
      campaignId: campaign.id,
    });
    // A kaput a múltba állítjuk — mintha letelt volna a 24 óra.
    await prisma.campaignParticipant.update({
      where: { id: participant.id },
      data: { nextStepOpensAt: new Date(Date.now() - 60_000) },
    });

    const released = await releaseDueCampaignSteps({
      campaignId: campaign.id,
      emailNotify: true,
    });
    assert.equal(released, 1);
    assert.equal(
      (await stepOpenedNotifications(profile.id, campaign.id)).length,
      1,
    );
  });

  await t.test(
    "intervallum nélkül (0 óra) az advance azonnal nyit és értesít",
    async () => {
      const profile = await createProfile();
      const { campaign, participant } = await createScanCampaign(profile.id, {
        stepIntervalHours: 0,
      });

      await advanceCampaignStepForUser(profile.id, "SELF_ASSESSMENT", {
        campaignId: campaign.id,
      });

      const after = await prisma.campaignParticipant.findUniqueOrThrow({
        where: { id: participant.id },
      });
      assert.equal(after.currentStep, 1);
      assert.equal(after.nextStepOpensAt, null);
      assert.equal(
        (await stepOpenedNotifications(profile.id, campaign.id)).length,
        1,
        "azonnali nyitásnál az értesítés az advance-ből megy",
      );
    },
  );

  await t.test(
    "user-szintű release csak a kért user kapuját nyitja",
    async () => {
      const profileA = await createProfile();
      const profileB = await createProfile();
      const { campaign } = await createScanCampaign(profileA.id, {
        stepIntervalHours: 24,
      });
      await prisma.campaignParticipant.create({
        data: { campaignId: campaign.id, userId: profileB.id },
      });
      await advanceCampaignStepForUser(profileA.id, "SELF_ASSESSMENT", {
        campaignId: campaign.id,
      });
      await advanceCampaignStepForUser(profileB.id, "SELF_ASSESSMENT", {
        campaignId: campaign.id,
      });

      const released = await releaseDueCampaignSteps({
        campaignId: campaign.id,
        userId: profileA.id,
        force: true,
      });
      assert.equal(released, 1);
      assert.equal(
        (await stepOpenedNotifications(profileA.id, campaign.id)).length,
        1,
      );
      assert.equal(
        (await stepOpenedNotifications(profileB.id, campaign.id)).length,
        0,
        "a másik résztvevő kapuja érintetlen",
      );
    },
  );
});

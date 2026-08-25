import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";

const E2E_AUTH_COOKIE_NAME = "trita_e2e_user_id";

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

test("team invite keeps its public token from the page through acceptance", async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(90_000);

  const ownerId = makeId("join_e2e_owner");
  const ownerClerkId = makeId("join_e2e_owner_clerk");
  const inviteeId = makeId("join_e2e_invitee");
  const inviteeClerkId = makeId("join_e2e_invitee_clerk");
  const inviteeEmail = `${inviteeId}@test.trita.app`;
  const orgId = makeId("join_e2e_org");
  const teamId = makeId("join_e2e_team");
  const inviteId = makeId("join_e2e_invite");
  const inviteToken = makeId("join_e2e_token");
  const now = new Date();

  await prisma.userProfile.createMany({
    data: [
      {
        id: ownerId,
        clerkId: ownerClerkId,
        email: `${ownerId}@test.trita.app`,
        username: "Join E2E Owner",
        locale: "en",
        testType: "TRITAN",
        testTypeAssignedAt: now,
        onboardedAt: now,
        consentedAt: now,
        birthYear: 1990,
        gender: "male",
      },
      {
        id: inviteeId,
        clerkId: inviteeClerkId,
        email: inviteeEmail,
        username: "Join E2E Invitee",
        locale: "en",
        testType: "TRITAN",
        testTypeAssignedAt: now,
        onboardedAt: now,
        consentedAt: now,
        birthYear: 1992,
        gender: "female",
      },
    ],
  });
  await prisma.organization.create({
    data: { id: orgId, name: "Join E2E Org", ownerId, status: "ACTIVE" },
  });
  await prisma.organizationMember.create({
    data: { orgId, userId: ownerId, role: "ORG_ADMIN" },
  });
  await prisma.team.create({
    data: { id: teamId, name: "Join E2E Team", ownerId, orgId },
  });
  await prisma.teamMember.create({
    data: { teamId, userId: ownerId, role: "manager" },
  });
  await prisma.teamPendingInvite.create({
    data: { id: inviteId, token: inviteToken, teamId, email: inviteeEmail },
  });

  try {
    if (!baseURL) throw new Error("Playwright baseURL is required for join E2E");
    await context.addCookies([
      { name: E2E_AUTH_COOKIE_NAME, value: inviteeClerkId, url: baseURL },
      { name: "trita_locale", value: "en", url: baseURL },
    ]);

    await page.goto(`/join/${inviteToken}`, { waitUntil: "domcontentloaded" });
    await expect(page.getByRole("heading", { name: "Join the team" })).toBeVisible({
      timeout: 30_000,
    });
    await page.getByRole("button", { name: "Join" }).click();

    await expect
      .poll(
        () =>
          prisma.teamMember.count({
            where: { teamId, userId: inviteeId },
          }),
        { timeout: 20_000 },
      )
      .toBe(1);
    await expect
      .poll(() => prisma.teamPendingInvite.count({ where: { id: inviteId } }))
      .toBe(0);
  } finally {
    await prisma.teamPendingInvite.deleteMany({ where: { teamId } });
    await prisma.teamMember.deleteMany({ where: { teamId } });
    await prisma.organizationMember.deleteMany({ where: { orgId } });
    await prisma.team.deleteMany({ where: { id: teamId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.userProfile.deleteMany({ where: { id: { in: [ownerId, inviteeId] } } });
  }
});

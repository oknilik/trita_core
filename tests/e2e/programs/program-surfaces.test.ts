import { expect, test } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";
import { createProgramSnapshot, participantActivities } from "../../../src/lib/programs/core";

// Uses the existing development-only auth cookie; no live Clerk account or mail.
test.skip(process.env.DIAGNOSTIC_PROGRAMS_ENABLED !== "true", "Requires the diagnostic-program creation flag on the test server");
const id = "e2e_program_surfaces";
const campaignId = `${id}_scan`;
async function cleanup() {
  await prisma.campaignParticipant.deleteMany({ where: { campaignId } });
  await prisma.campaign.deleteMany({ where: { id: campaignId } });
  await prisma.teamMember.deleteMany({ where: { teamId: id } });
  await prisma.team.deleteMany({ where: { id } });
  await prisma.organizationMember.deleteMany({ where: { orgId: id } });
  await prisma.subscription.deleteMany({ where: { orgId: id } });
  await prisma.userProfile.updateMany({ where: { id }, data: { activeOrgId: null } });
  await prisma.organization.deleteMany({ where: { id } });
  await prisma.userProfile.deleteMany({ where: { id } });
}

test.beforeAll(async () => {
  await cleanup();
  await prisma.userProfile.create({ data: { id, clerkId: id, username: "Program consultant", email: `${id}@test.trita.app`, locale: "en", onboardedAt: new Date(), consentedAt: new Date(), testType: "TRITAN", testTypeAssignedAt: new Date() } });
  await prisma.organization.create({ data: { id, name: "Program browser fixture", ownerId: id } });
  await prisma.organizationMember.create({ data: { orgId: id, userId: id, role: "ORG_CONSULTANT" } });
  await prisma.subscription.create({ data: { orgId: id, status: "active", currentPeriodEnd: new Date("2099-01-01") } });
  await prisma.team.create({ data: { id, name: "Program browser team", orgId: id, ownerId: id } });
  await prisma.teamMember.create({ data: { teamId: id, userId: id } });
  await prisma.userProfile.update({ where: { id }, data: { activeOrgId: id } });
  const p = createProgramSnapshot("TEAM_SCAN");
  await prisma.campaign.create({ data: { id: campaignId, orgId: id, createdBy: id, name: "Browser Team Scan", type: "SELF_ASSESSMENT", status: "ACTIVE", teamId: id, teamIds: [id], steps: participantActivities(p).map(a => a.key), programKey: p.key, programVersion: p.version, programSnapshot: p, participants: { create: { userId: id, nextStepOpensAt: new Date("2099-01-01"), stepCompletions: { __program: 1, SELF_ASSESSMENT: new Date().toISOString() } } } } });
});
test.afterAll(async () => { await cleanup(); await prisma.$disconnect(); });
test.beforeEach(async ({ context, baseURL }) => {
  await context.addCookies([
    { name: "trita_e2e_user_id", value: id, url: baseURL! },
    { name: "trita_locale", value: "en", url: baseURL! },
  ]);
});

test("program chooser prevents Follow-up without a published baseline", async ({ page }) => {
  await page.goto(`/org/${id}/campaigns/new`);
  await expect(page.getByRole("group", { name: "Diagnostic program" }).getByRole("radio")).toHaveCount(2);
  await expect(page.getByRole("button", { name: "Create program draft" })).toBeEnabled();
  await page.getByRole("radio", { name: /Follow-up/ }).check();
  await expect(page.getByRole("button", { name: "Create program draft" })).toBeDisabled();
  await expect(page.getByRole("option", { name: "No compatible published Team Scan" })).toBeAttached();
});

test("completed self exposes all parallel activities despite a stale legacy opening time", async ({ page }) => {
  await page.goto("/tasks");
  for (const path of ["/assessment/team-operating-style", "/assessment/psych-safety", "/tasks/observers"]) {
    await expect(page.locator(`a[href="${path}?campaignId=${campaignId}"]`).first()).toBeVisible();
  }
  await page.goto(`/org/${id}/campaigns/${campaignId}`);
  await expect(page.getByRole("heading", { name: "Browser Team Scan" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Close measurement" })).toBeDisabled();
});

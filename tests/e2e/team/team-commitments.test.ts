import { expect, test, type BrowserContext } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";

const orgId = "e2e_commitments_org";
const teamId = "e2e_commitments_team";
const consultant = { id: "e2e_commitments_consultant", clerkId: "e2e_commitments_consultant_clerk", username: "Tanácsadó" };
const member = { id: "e2e_commitments_member", clerkId: "e2e_commitments_member_clerk", username: "Anna" };
const peer = { id: "e2e_commitments_peer", clerkId: "e2e_commitments_peer_clerk", username: "Márk" };
const people = [consultant, member, peer];

async function cleanup() {
  await prisma.team.deleteMany({ where: { id: teamId } });
  await prisma.organizationMember.deleteMany({ where: { orgId } });
  await prisma.organization.deleteMany({ where: { id: orgId } });
  await prisma.userProfile.deleteMany({ where: { id: { in: people.map((person) => person.id) } } });
}

async function signIn(context: BrowserContext, baseURL: string | undefined, clerkId: string, locale = "hu") {
  if (!baseURL) throw new Error("baseURL is required");
  await context.addCookies([
    { name: "trita_e2e_user_id", value: clerkId, url: baseURL },
    { name: "trita_locale", value: locale, url: baseURL },
  ]);
}

test.describe("Shared team commitments", () => {
  test.describe.configure({ mode: "serial" });
  test.beforeAll(async () => {
    await cleanup();
    const now = new Date();
    await prisma.userProfile.createMany({ data: people.map((person) => ({ ...person, email: `${person.id}@example.test`, locale: "hu", onboardedAt: now, consentedAt: now, testType: "TRITAN", testTypeAssignedAt: now })) });
    await prisma.organization.create({ data: { id: orgId, name: "Közös vállalások teszt", ownerId: consultant.id } });
    await prisma.organizationMember.createMany({ data: people.map((person) => ({ orgId, userId: person.id, role: person.id === consultant.id ? "ORG_CONSULTANT" : "ORG_MEMBER" })) });
    await prisma.subscription.create({ data: { orgId, status: "active", planType: "team" } });
    await prisma.team.create({ data: { id: teamId, orgId, ownerId: consultant.id, name: "Termékfejlesztés" } });
    await prisma.teamMember.createMany({ data: [member, peer].map((person) => ({ teamId, userId: person.id, role: "member" })) });
    await prisma.userProfile.updateMany({ where: { id: { in: people.map((person) => person.id) } }, data: { activeOrgId: orgId } });
  });
  test.afterAll(cleanup);

  test("an assignee asks for help on mobile and the consultant sees the same recorded update", async ({ page, context, baseURL }) => {
    await signIn(context, baseURL, consultant.clerkId);
    const created = await context.request.post(`/api/team/${teamId}/commitments`, { data: { action: "create", fields: { title: "Kétperces lezárás a heti megbeszélés végén", description: "A megbeszélés végén közösen tisztázzuk a vállalásokat.", nextStep: "Pénteken összefoglalni, ki mit vállalt.", successCriteria: "Két megbeszélés végén minden vállalásnak van felelőse.", ownerUserId: member.id, dueDate: "2027-01-15" } } });
    expect(created.ok(), await created.text()).toBeTruthy();
    await signIn(context, baseURL, member.clerkId);
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/team/${teamId}?tab=commitments`);
    await expect(page.getByRole("heading", { name: "Közös vállalásaink", exact: true })).toBeVisible();
    await expect(page.getByRole("heading", { name: "A te következő lépéseid", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Új vállalás", exact: true })).toHaveCount(0);
    await page.getByRole("button", { name: "Frissítek", exact: true }).click();
    await page.getByLabel("Segítség kell", { exact: true }).check();
    await page.getByRole("textbox", { name: /^Miben kérsz segítséget\?/ }).fill("A következő alkalom moderálásához kérek segítséget.");
    await page.getByRole("button", { name: "Frissítés mentése", exact: true }).click();
    await expect(page.getByText("A változás mentve. A csapat a friss állapotot látja.", { exact: true })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
    const stored = await prisma.teamCommitment.findFirstOrThrow({ where: { teamId } });
    expect(stored.status).toBe("blocked");
    expect(stored.latestNote).toBe("A következő alkalom moderálásához kérek segítséget.");
    expect(await prisma.teamCommitmentEvent.count({ where: { commitmentId: stored.id, actorUserId: member.id } })).toBe(1);

    await signIn(context, baseURL, consultant.clerkId);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(`/team/${teamId}?tab=commitments`);
    await expect(page.getByRole("button", { name: "Elakadás áttekintése", exact: true })).toBeVisible();
    await page.getByText("Részletek és előzmények", { exact: true }).click();
    await expect(page.getByText("A következő alkalom moderálásához kérek segítséget.").first()).toBeVisible();
    await page.reload();
    await expect(page.getByRole("button", { name: "Elakadás áttekintése", exact: true })).toBeVisible();
  });

  test("a teammate can read shared work but cannot update another person's commitment", async ({ page, context, baseURL }) => {
    await signIn(context, baseURL, peer.clerkId, "en");
    await page.goto(`/team/${teamId}?tab=commitments`);
    await expect(page.getByRole("heading", { name: "Our shared commitments", exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: "Share an update", exact: true })).toHaveCount(0);
    const item = await prisma.teamCommitment.findFirstOrThrow({ where: { teamId } });
    const response = await context.request.patch(`/api/team/${teamId}/commitments`, { data: { action: "update", id: item.id, expectedVersion: item.version, status: "done", note: "Not my commitment." } });
    expect(response.status()).toBe(403);
    expect((await prisma.teamCommitment.findUniqueOrThrow({ where: { id: item.id } })).version).toBe(item.version);
    await page.getByRole("link", { name: "Overview", exact: true }).click();
    await expect(page.getByRole("link", { name: /commitments/i }).first()).toBeVisible();
  });
});

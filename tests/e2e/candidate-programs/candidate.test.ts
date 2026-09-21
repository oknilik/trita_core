import { test, expect } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";
import { createProgramSnapshot } from "../../../src/lib/programs/core";
import { createCandidateProgram } from "../../../src/lib/candidate-programs/core";
test.describe.configure({ mode: "serial" });
const id = "e2e_candidate_program";
const program = createCandidateProgram();
async function cleanup() {
  await prisma.candidateReport.deleteMany({ where: { invite: { orgId: id } } });
  await prisma.candidateResult.deleteMany({ where: { invite: { orgId: id } } });
  await prisma.candidateInvite.deleteMany({ where: { orgId: id } });
  await prisma.userProfile.updateMany({
    where: { id },
    data: { activeOrgId: null },
  });
  await prisma.teamReport.deleteMany({ where: { orgId: id } });
  await prisma.team.deleteMany({ where: { orgId: id } });
  await prisma.campaign.deleteMany({ where: { orgId: id } });
  await prisma.organization.deleteMany({ where: { id } });
  await prisma.userProfile.deleteMany({
    where: { id: { in: [id, id + "_leader", id + "_member"] } },
  });
}
test.beforeAll(async () => {
  await cleanup();
  await prisma.userProfile.create({
    data: {
      id,
      clerkId: id,
      email: "candidate-consultant@test.trita.app",
      username: "Consultant",
      locale: "en",
      onboardedAt: new Date(),
      consentedAt: new Date(),
    },
  });
  await prisma.organization.create({
    data: {
      id,
      name: "Candidate test organization",
      ownerId: id,
      candidateProgramsEnabled: true,
      members: { create: { userId: id, role: "ORG_CONSULTANT" } },
    },
  });
  for (const [suffix, role] of [
    ["_leader", "ORG_MANAGER"],
    ["_member", "ORG_MEMBER"],
  ]) {
    await prisma.userProfile.create({
      data: {
        id: id + suffix,
        clerkId: id + suffix,
        username: suffix,
        locale: "en",
        onboardedAt: new Date(),
        consentedAt: new Date(),
      },
    });
    await prisma.organizationMember.create({
      data: { orgId: id, userId: id + suffix, role },
    });
  }
  await prisma.userProfile.update({ where: { id }, data: { activeOrgId: id } });
  await prisma.campaign.create({
    data: {
      id,
      orgId: id,
      name: "Scan",
      createdBy: id,
      status: "CLOSED",
      programKey: "TEAM_SCAN",
      programVersion: 1,
      programSnapshot: createProgramSnapshot("TEAM_SCAN"),
    },
  });
  for (const [index, name] of [
    "Termékfejlesztés",
    "Ügyfélélmény",
    "Stratégia",
  ].entries()) {
    const teamId = `${id}_${index}`;
    await prisma.team.create({
      data: { id: teamId, orgId: id, ownerId: id, name },
    });
    await prisma.teamReport.create({
      data: {
        id: teamId,
        teamId,
        orgId: id,
        campaignId: id,
        createdById: id,
        status: "PUBLISHED",
        publishedAt: new Date("2026-09-12"),
        aggregates: {
          completedCount: 8 - index,
          dimensionAverages: {
            H: 65 - index * 5,
            E: 45 + index * 8,
            X: 70 - index * 12,
            A: 55 + index * 10,
            C: 75 - index * 7,
            O: 60 + index * 8,
          },
        },
      },
    });
  }
  await prisma.candidateInvite.create({
    data: {
      id,
      token: id,
      orgId: id,
      managerId: id,
      name: "Anna Example",
      position: "Product designer",
      expiresAt: new Date(Date.now() + 86400000),
      programSnapshot: program,
      acknowledgedAt: new Date(),
      draftAnswers: Object.fromEntries(
        program.questionIds.slice(0, -1).map((q) => [q, 4]),
      ),
      draftAnsweredCount: 59,
      draftRevision: 1,
    },
  });
});
test.afterAll(async () => {
  await cleanup();
  await prisma.$disconnect();
});
test("mobile candidate resumes server draft and submits with the self/observer UI", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    { name: "trita_locale", value: "en", url: baseURL! },
  ]);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`/apply/${id}`);
  await page.screenshot({
    path: "../../outputs/candidate-workshop-intro-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Continue assessment" }).click();
  await expect(page.getByTestId("assessment-focus-header")).toBeVisible();
  await expect(page.getByRole("radio", { name: /^[1-5] -/ })).toHaveCount(5);
  await expect(
    page.getByRole("radio", { name: /^[1-5] -/, checked: true }),
  ).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Submit" })).toBeDisabled();
  await page.getByRole("radio", { name: /^4 -/ }).click();
  await expect(page.getByRole("button", { name: "Submit" })).toBeEnabled();
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await expect(page.getByRole("status")).toHaveText("Saved");
  await expect(page.locator("footer")).toHaveCount(0);
  await page.screenshot({
    path: "../candidate-design/candidate-live-mobile.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Submit" }).click();
  await expect(
    page.getByText("Your answers have been received."),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByText("Your answers have been received."),
  ).toBeVisible();
});
test("consultant reviews and shares only the approved candidate summary", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    { name: "trita_locale", value: "en", url: baseURL! },
    { name: "trita_e2e_user_id", value: id, url: baseURL! },
  ]);
  await page.goto(`/hiring/${id}/candidates/${id}`);
  await page.getByRole("tab", { name: "Team comparisons" }).click();
  for (let index = 0; index < 3; index++) {
    await page
      .getByLabel("Select a published team report")
      .selectOption(`${id}_${index}`);
    await page.getByRole("button", { name: "Add team", exact: true }).click();
    await expect(page.locator("article")).toHaveCount(index + 1);
  }
  await page.locator("article").nth(1).getByRole("button").click();
  await expect(
    page.locator("article").nth(1).getByRole("button"),
  ).toHaveAttribute("aria-pressed", "true");
  await page
    .locator("summary")
    .filter({ hasText: "Edit consultant observations" })
    .click();
  await page
    .getByRole("group", { name: "Connections with the team", exact: true })
    .getByRole("button", { name: "Insert", exact: true })
    .click();
  await expect(
    page.getByRole("textbox", { name: "Connection", exact: true }),
  ).toHaveValue(/Source:/);
  await page
    .getByRole("textbox", { name: "Connection", exact: true })
    .fill("Similar planning preferences");
  await page
    .getByRole("textbox", { name: "To discuss", exact: true })
    .fill("Discuss different social rhythms");
  await page
    .getByRole("textbox", { name: "Conversation starter", exact: true })
    .fill("How do you make decisions together?");
  await expect(
    page.getByRole("tab", { name: "Feedback", exact: true }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Save draft", exact: true }).click();
  await expect(
    page.getByRole("tab", { name: "Feedback", exact: true }),
  ).toBeEnabled();
  await expect(page.locator("article").nth(1)).toContainText(
    "Similar planning preferences",
  );
  await page.addStyleTag({
    content:
      "html{scroll-behavior:auto!important} nextjs-portal{display:none!important}",
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({
    path: "../../outputs/candidate-multiteam-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await page.screenshot({
    path: "../../outputs/candidate-multiteam-mobile.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.getByRole("button", { name: "Edit feedback" }).click();
  const suggestionsPanel = page
    .getByRole("heading", { name: "Consultant text suggestions", exact: true })
    .locator("..");
  await suggestionsPanel.screenshot({
    path: "../../outputs/candidate-suggestions-desktop.png",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    )
    .toBe(true);
  await suggestionsPanel.screenshot({
    path: "../../outputs/candidate-suggestions-mobile.png",
  });
  await page.setViewportSize({ width: 1440, height: 900 });
  await page
    .getByRole("textbox", { name: "Feedback for the candidate" })
    .fill("Candidate feedback");
  await page
    .getByRole("textbox", { name: "Feedback for the leader" })
    .fill("Client feedback");
  await page
    .getByRole("textbox", { name: "Internal consultant notes" })
    .fill("PRIVATE CONSULTANT NOTE");
  await page.getByRole("button", { name: "Save draft" }).click();
  await expect(
    page.getByRole("button", { name: "Review", exact: true }),
  ).toBeEnabled();
  await page.getByRole("button", { name: "Review", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Share candidate feedback" }),
  ).toBeEnabled();
  await page.addStyleTag({
    content:
      "html{scroll-behavior:auto!important} nextjs-portal{display:none!important}",
  });
  await page.evaluate(() => window.scrollTo(0, 0));
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
  await page.screenshot({
    path: "../candidate-design/candidate-live-report.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Share candidate feedback" }).click();
  const href = await page
    .getByRole("link", { name: "Open shared summary" })
    .getAttribute("href");
  expect(href).toBeTruthy();
  await page
    .getByRole("combobox", { name: "Designated leader" })
    .selectOption(id + "_leader");
  await page.getByRole("button", { name: "Share leader feedback" }).click();
  await expect(
    page.getByRole("link", { name: "Open shared summary" }),
  ).not.toHaveAttribute("href", href!);
  const leaderHref = await page
    .getByRole("link", { name: "Open shared summary" })
    .getAttribute("href");
  await context.clearCookies();
  await page.goto(leaderHref!);
  await expect(
    page.getByText(/This page could not be found|Ez az oldal nem található/),
  ).toBeVisible();
  await expect(page.getByText("Client feedback", { exact: true })).toHaveCount(
    0,
  );
  await context.addCookies([
    { name: "trita_e2e_user_id", value: id + "_member", url: baseURL! },
  ]);
  await page.goto(leaderHref!);
  await expect(
    page.getByText(/This page could not be found|Ez az oldal nem található/),
  ).toBeVisible();
  await expect(page.getByText("Client feedback", { exact: true })).toHaveCount(
    0,
  );
  await context.addCookies([
    { name: "trita_e2e_user_id", value: id + "_leader", url: baseURL! },
    { name: "trita_locale", value: "en", url: baseURL! },
  ]);
  await page.goto(leaderHref!);
  await expect(
    page.getByText("Client feedback", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /Personality illustration|Személyiségkép/ }),
  ).toBeVisible();
  await expect(page.getByText("PRIVATE CONSULTANT NOTE")).toHaveCount(0);
  await expect(page.locator("svg").filter({ hasText: "100" })).toHaveCount(0);
  await page.screenshot({
    path: "../../outputs/candidate-leader-feedback.png",
    fullPage: true,
  });
  await context.clearCookies();
  await page.goto(href!);
  await expect(
    page.getByText("Candidate feedback", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("PRIVATE CONSULTANT NOTE")).toHaveCount(0);
  await expect(
    page.getByRole("img", { name: /Personality illustration|Személyiségkép/ }),
  ).toBeVisible();
  const explanation = page.getByRole("link", { name: /Mit jelent ez az ábra|What does this illustration mean/ });
  await expect(explanation).toHaveAttribute("href", "/character-glyphs");
  const guide = await context.newPage();
  await guide.goto("/character-glyphs");
  await expect(guide.getByRole("heading", { level: 1 })).toHaveText(/A karakterábrák nyelve|The language of character illustrations/);
  await expect(guide.locator("main svg")).toHaveCount(6);
  await guide.close();
  await page.screenshot({
    path: "../../outputs/candidate-personal-feedback.png",
    fullPage: true,
  });
  await expect(page.getByText("Client feedback", { exact: true })).toHaveCount(
    0,
  );
});
test("Hungarian comparison workspace renders on desktop and mobile", async ({
  page,
  context,
  baseURL,
}) => {
  await context.addCookies([
    { name: "trita_locale", value: "hu", url: baseURL! },
    { name: "trita_e2e_user_id", value: id, url: baseURL! },
  ]);
  await context.addInitScript(() => {
    localStorage.setItem("trita_locale", "hu");
    sessionStorage.setItem("trita_locale_synced", "1");
  });
  await prisma.candidateInvite.update({
    where: { id },
    data: { name: "Nagy Anna", position: "Terméktervező" },
  });
  const report = await prisma.candidateReport.findUniqueOrThrow({
    where: { inviteId: id },
  });
  const comparisons = report.comparisons as {
    connection: string;
    difference: string;
    prompt: string;
  }[];
  await prisma.candidateReport.update({
    where: { id: report.id },
    data: {
      comparisons: comparisons.map((c, i) => ({
        ...c,
        connection: [
          "Hasonló tervezettség",
          "Egyeztetésre épülő közös munka",
          "Új lehetőségek közös feltárása",
        ][i],
        difference: [
          "A társas tempó egyeztetése",
          "Döntési helyzetek tisztázása",
          "Önállóság és közös tervezés",
        ][i],
        prompt: [
          "Hogyan egyeztetsz eltérő munkatempó mellett?",
          "Hogyan hoztok közös döntéseket?",
          "Mennyi önállóság segíti a jó munkádat?",
        ][i],
      })),
    },
  });
  await page.setViewportSize({ width: 1440, height: 1400 });
  await page.goto(`/hiring/${id}/candidates/${id}`);
  await expect(
    page.getByRole("tab", { name: "Csapatok összevetése" }),
  ).toHaveAttribute("aria-selected", "true");
  await page.addStyleTag({
    content:
      "html{scroll-behavior:auto!important} nextjs-portal{display:none!important}",
  });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({
    path: "../../outputs/candidate-multiteam-hu-desktop.png",
    animations: "disabled",
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect
    .poll(() =>
      page.evaluate(() => document.documentElement.scrollWidth <= innerWidth),
    )
    .toBe(true);
  await page.screenshot({
    path: "../../outputs/candidate-multiteam-hu-mobile.png",
    fullPage: true,
    animations: "disabled",
  });
});
test("disabled organization and legacy tokens fail closed", async ({
  request,
  page,
}) => {
  await prisma.organization.update({
    where: { id },
    data: { candidateProgramsEnabled: false },
  });
  const res = await request.get(`/api/candidate/${id}`);
  expect(res.status()).toBe(404);
  await page.goto(`/apply/${id}`);
  await expect(page.getByRole("radio", { name: /^[1-5] -/ })).toHaveCount(0);
  await prisma.organization.update({
    where: { id },
    data: { candidateProgramsEnabled: true },
  });
  await prisma.candidateInvite.update({
    where: { id },
    data: { programSnapshot: { version: 99 } },
  });
  expect((await request.get(`/api/candidate/${id}`)).status()).toBe(404);
});

import { test, expect } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";
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
  await prisma.organization.deleteMany({ where: { id } });
  await prisma.userProfile.deleteMany({ where: { id } });
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
  await prisma.userProfile.update({ where: { id }, data: { activeOrgId: id } });
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
  await page
    .getByRole("textbox", { name: "Feedback for the candidate" })
    .fill("Candidate feedback");
  await page
    .getByRole("textbox", { name: "Summary for the client" })
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
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: "../candidate-design/candidate-live-report.png",
    fullPage: true,
  });
  await page.getByRole("button", { name: "Share candidate feedback" }).click();
  const href = await page
    .getByRole("link", { name: "Open shared summary" })
    .getAttribute("href");
  expect(href).toBeTruthy();
  await context.clearCookies();
  await page.goto(href!);
  await expect(
    page.getByText("Candidate feedback", { exact: true }),
  ).toBeVisible();
  await expect(page.getByText("PRIVATE CONSULTANT NOTE")).toHaveCount(0);
  await expect(page.getByText("Client feedback", { exact: true })).toHaveCount(
    0,
  );
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

import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";
import { prisma } from "../../../src/lib/prisma";
import { PLATFORM_TERMS_VERSION, PRIVACY_NOTICE_VERSION } from "../../../src/lib/legal/versions";

test("follow-up ownership, login destination, snooze and scanner-safe unsubscribe", async ({ page, context, request, baseURL }) => {
  const clerkId = `lifecycle_e2e_${randomUUID()}`;
  const past = new Date(Date.now() - 5 * 86400000);
  const p = await prisma.userProfile.create({ data: {
    clerkId, email: `${clerkId}@example.com`, verifiedEmail: `${clerkId}@example.com`, locale: "hu", username: "Follow-up E2E",
    onboardedAt: past, createdAt: past, consentedAt: past, testType: "TRITAN", birthYear: 1990, gender: "other", country: "HU",
    platformTermsVersion: PLATFORM_TERMS_VERSION, platformTermsAcceptedAt: past,
    privacyNoticeVersion: PRIVACY_NOTICE_VERSION, privacyNoticeAcceptedAt: past,
  } });
  const goal = await prisma.lifecycleOpportunity.create({ data: {
    profileId: p.id, rule: "START_SELF", goalKey: "first-personal-assessment", anchorAt: past, dueAt: past, expiresAt: new Date(Date.now() + 86400000),
  } });
  const token = randomUUID();
  await prisma.lifecycleDelivery.create({ data: { profileId: p.id, opportunityId: goal.id, key: randomUUID(), rule: "START_SELF", recipient: p.email!, status: "ACCEPTED", unsubscribeToken: token } });
  try {
    const guest = await request.get(`/api/lifecycle/continue?id=${goal.id}`, { maxRedirects: 0 });
    expect(guest.status()).toBe(307);
    const signIn = new URL(guest.headers().location);
    expect(signIn.pathname).toBe("/sign-in");
    expect(signIn.searchParams.get("redirect_url")).toBe(`/api/lifecycle/continue?id=${goal.id}`);
    expect((await request.post("/api/lifecycle/preference", { data: { id: goal.id, action: "dismiss" } })).status()).toBe(401);

    await request.get(`/api/lifecycle/unsubscribe?token=${token}`);
    expect((await prisma.userProfile.findUniqueOrThrow({ where: { id: p.id } })).lifecycleEmailsOptOut).toBe(false);
    await page.goto(`/follow-up/unsubscribe?token=${token}`);
    await expect(page.getByRole("heading", { name: "Utánkövető levelek" })).toBeVisible();
    expect((await prisma.userProfile.findUniqueOrThrow({ where: { id: p.id } })).lifecycleEmailsOptOut).toBe(false);
    await page.getByRole("button", { name: "Leiratkozom" }).click();
    await expect(page.getByRole("status")).toContainText("Leiratkoztál");
    expect((await prisma.userProfile.findUniqueOrThrow({ where: { id: p.id } })).lifecycleEmailsOptOut).toBe(true);

    await context.addCookies([{ name: "trita_e2e_user_id", value: clerkId, url: baseURL! }]);
    const next = await context.request.get(`/api/lifecycle/continue?id=${goal.id}`, { maxRedirects: 0 });
    expect(new URL(next.headers().location).pathname).toBe("/assessment");
    expect((await context.request.post("/api/lifecycle/preference", { data: { id: "someone-elses-goal", action: "dismiss" } })).status()).toBe(404);
    await page.goto(`/profile/follow-up/${goal.id}`);
    await page.getByRole("button", { name: "Emlékeztess egy hét múlva" }).click();
    await expect(page.getByRole("status")).toContainText("Egy hétre");
    const stored = await prisma.lifecycleOpportunity.findUniqueOrThrow({ where: { id: goal.id } });
    expect(stored.snoozedUntil!.getTime()).toBeGreaterThan(Date.now() + 6 * 86400000);
    expect(stored.expiresAt.getTime()).toBeGreaterThan(stored.snoozedUntil!.getTime());
  } finally {
    await prisma.notification.deleteMany({ where: { userId: p.id } });
    await prisma.userProfile.delete({ where: { id: p.id } });
  }
});

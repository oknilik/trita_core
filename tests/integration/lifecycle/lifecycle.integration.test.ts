import test, { after } from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import { DAY } from "@/lib/lifecycle/rules";
import { deliver, reserveDelivery, type DeliveryRequest } from "@/lib/lifecycle/delivery";
import { recordLifecycleEmailEvent } from "@/lib/lifecycle/events";
import { inspectOpportunity, sendOpportunity, setOpportunityPreference, syncOpportunity, unsubscribeLifecycle } from "@/lib/lifecycle/service";
import { runLifecycle } from "@/lib/lifecycle/run";
import { sendObserverReminder } from "@/lib/lifecycle/legacy";
import { scrubProfileData } from "@/lib/account-scrub";

const prefix = `lifecycle-it-${randomUUID()}`;
const ago = (days: number) => new Date(Date.now() - days * DAY);
const originalFetch = globalThis.fetch;
process.env.RESEND_API_KEY = "integration-no-network";
const outgoing: Array<{ subject: string; to: string[] | string; text: string }> = [];
globalThis.fetch = (async (_input, init) => {
  assert.equal(typeof init?.body, "string", "Only the mocked Resend transport is expected");
  outgoing.push(JSON.parse(init!.body as string));
  return new Response(JSON.stringify({ id: randomUUID() }), { headers: { "content-type": "application/json" } });
}) as typeof fetch;

after(async () => {
  globalThis.fetch = originalFetch;
  await prisma.notification.deleteMany({ where: { user: { email: { startsWith: prefix } } } });
  await prisma.observerInvitation.deleteMany({ where: { inviter: { email: { startsWith: prefix } } } });
  await prisma.assessmentDraft.deleteMany({ where: { userProfile: { email: { startsWith: prefix } } } });
  await prisma.assessmentResult.deleteMany({ where: { userProfile: { email: { startsWith: prefix } } } });
  await prisma.userProfile.deleteMany({ where: { email: { startsWith: prefix } } });
  await prisma.emailSuppression.deleteMany({ where: { email: { startsWith: prefix } } });
  await prisma.$disconnect();
});

async function user() {
  const email = `${prefix}-${randomUUID()}@example.com`;
  return prisma.userProfile.create({ data: { email, verifiedEmail: email, clerkId: randomUUID(), username: "Lifecycle test", locale: "hu", testType: "TRITAN", consentedAt: ago(5), onboardedAt: ago(5), createdAt: ago(5), birthYear: 1990, gender: "other", country: "HU" } });
}
function request(p: Awaited<ReturnType<typeof user>>, changes: Partial<DeliveryRequest> = {}): DeliveryRequest {
  return { key: randomUUID(), profileId: p.id, rule: "START_SELF", recipient: p.email!,
    prepare: () => ({ subject: "test", html: "<p>test</p>", text: "test" }), validate: async () => null, ...changes };
}
const accepted = async () => ({ ok: true as const, providerEmailId: randomUUID() });

test("parallel workers and different rules cannot exceed the account contact budget", async () => {
  const p = await user();
  let sends = 0;
  const transport = async () => { sends++; return accepted(); };
  const req = request(p);
  const results = await Promise.all([deliver(req, transport), deliver(req, transport), deliver(request(p, { rule: "RESUME_SELF" }), transport)]);
  assert.equal(results.filter(r => r.ok).length, 1);
  assert.equal(sends, 1);
  assert.equal(await prisma.lifecycleDelivery.count({ where: { profileId: p.id } }), 1);
});

test("different observers can be reminded, but one observer shared by two owners is throttled", async () => {
  const p = await user(); const other = await user();
  const recipient = `${prefix}-${randomUUID()}@example.com`;
  const first = await deliver(request(p, { rule: "OBSERVER_REMINDER", recipient }), accepted);
  const second = await deliver(request(p, { rule: "OBSERVER_REMINDER", recipient: `${prefix}-${randomUUID()}@example.com` }), accepted);
  const repeated = await deliver(request(other, { rule: "OBSERVER_REMINDER", recipient }), accepted);
  assert.ok(first.ok && second.ok);
  assert.equal(repeated.ok, false);
});

test("webhook before send response is reconciled and terminal status never regresses", async () => {
  const p = await user(); const providerEmailId = randomUUID();
  const result = await deliver(request(p), async () => {
    await recordLifecycleEmailEvent({ id: randomUUID(), providerEmailId, kind: "delivered" });
    return { ok: true, providerEmailId };
  });
  assert.ok(result.ok);
  assert.equal((await prisma.lifecycleDelivery.findUniqueOrThrow({ where: { id: result.id } })).status, "DELIVERED");
  const event = { id: randomUUID(), providerEmailId, email: p.email, kind: "complaint" };
  await recordLifecycleEmailEvent(event); await recordLifecycleEmailEvent(event);
  await recordLifecycleEmailEvent({ id: randomUUID(), providerEmailId, kind: "delivered" });
  assert.equal((await prisma.lifecycleDelivery.findUniqueOrThrow({ where: { id: result.id } })).status, "COMPLAINED");
  assert.ok(await prisma.emailSuppression.findUnique({ where: { email: p.email! } }));
});

test("uncertain retries reuse the exact request key and payload; a later worker never resends", async () => {
  const p = await user(); const req = request(p);
  const attempts: unknown[] = [];
  const result = await deliver(req, async params => {
    attempts.push(params);
    return { ok: false, uncertain: true, retryable: true, code: "network", message: "lost response" };
  });
  assert.equal(result.ok, false);
  assert.equal(attempts.length, 3);
  assert.deepEqual(attempts[0], attempts[1]); assert.deepEqual(attempts[1], attempts[2]);
  const row = await prisma.lifecycleDelivery.findUniqueOrThrow({ where: { key: req.key } });
  assert.equal(row.status, "UNKNOWN");
  await prisma.lifecycleDelivery.update({ where: { id: row.id }, data: { claimedAt: ago(2) } });
  const later = await deliver(req, async () => { assert.fail("must not send after idempotency window"); });
  assert.equal(later.ok, false);
});

test("changed eligibility between claim and provider call cancels without sending", async () => {
  const p = await user(); let checks = 0;
  const result = await deliver(request(p, { validate: async () => ++checks > 1 ? "EMAIL_OPTED_OUT" : null }), async () => { assert.fail("email must be canceled"); });
  assert.equal(result.ok, false);
  assert.equal((await prisma.lifecycleDelivery.findFirstOrThrow({ where: { profileId: p.id } })).status, "CANCELED");
  assert.ok((await deliver(request(p), accepted)).ok, "cancellation does not consume contact quota");
});

test("a hard bounce blocks a person who never subscribed to a newsletter", async () => {
  const p = await user();
  await recordLifecycleEmailEvent({ id: randomUUID(), email: p.email, kind: "bounce" });
  const result = await deliver(request(p), async () => { assert.fail("suppressed address must not be contacted"); });
  assert.deepEqual(result, { ok: false, reason: "EMAIL_SUPPRESSED" });
});

test("personal journey materialisation, sending, opt-out, progress and snooze use real DB state", async () => {
  process.env.LIFECYCLE_MODE = "manual";
  const p = await user();
  const id = await syncOpportunity(p.id); assert.ok(id);
  const view = await inspectOpportunity(id); assert.equal(view?.rule, "START_SELF"); assert.equal(view.reason, "READY");
  const before = outgoing.length;
  assert.ok((await sendOpportunity(id, "manual")).ok);
  assert.equal(outgoing.length, before + 1);
  assert.equal((await sendOpportunity(id, "manual")).ok, false);
  const delivery = await prisma.lifecycleDelivery.findFirstOrThrow({ where: { opportunityId: id } });
  assert.ok(delivery.unsubscribeToken);
  assert.equal(await unsubscribeLifecycle(delivery.unsubscribeToken), true);
  assert.equal(await unsubscribeLifecycle(delivery.unsubscribeToken), true);
  assert.equal((await prisma.userProfile.findUniqueOrThrow({ where: { id: p.id } })).lifecycleEmailsOptOut, true);

  await prisma.assessmentDraft.create({ data: { userProfileId: p.id, scope: "self", testType: "TRITAN", answers: { "1": 3 }, updatedAt: ago(2) } });
  const resumeId = await syncOpportunity(p.id); assert.ok(resumeId);
  assert.equal((await prisma.lifecycleOpportunity.findUniqueOrThrow({ where: { id } })).status, "COMPLETED");
  assert.equal((await inspectOpportunity(resumeId))?.rule, "RESUME_SELF");
  assert.equal(await setOpportunityPreference(resumeId, "wrong-profile", "dismiss"), false);
  assert.equal(await setOpportunityPreference(resumeId, p.id, "snooze"), true);
  assert.equal((await inspectOpportunity(resumeId))?.reason, "SNOOZED");
  await prisma.assessmentResult.create({ data: { userProfileId: p.id, testType: "TRITAN", isSelfAssessment: true, scores: { type: "likert", dimensions: { H: 50, E: 50, X: 50, A: 50, C: 50, O: 50 } } } });
  const inviteId = await syncOpportunity(p.id); assert.ok(inviteId);
  assert.equal((await prisma.lifecycleOpportunity.findUniqueOrThrow({ where: { id: resumeId } })).status, "COMPLETED");
  assert.equal((await inspectOpportunity(inviteId))?.reason, "NOT_DUE");
  assert.equal((await prisma.notification.findFirstOrThrow({ where: { sourceId: id } })).dismissed, true);
});

test("legacy manual and automatic observer sends share count, cooldown and deletion checks", async () => {
  const p = await user();
  const invite = await prisma.observerInvitation.create({ data: { inviterId: p.id, observerEmail: `${prefix}-${randomUUID()}@example.com`, token: randomUUID(), testType: "TRITAN", createdAt: ago(5), expiresAt: new Date(Date.now() + DAY) } });
  const before = outgoing.length;
  const [first, duplicate] = await Promise.all([sendObserverReminder(invite.id, "admin"), sendObserverReminder(invite.id)]);
  assert.equal([first, duplicate].filter(r => r.ok).length, 1);
  assert.equal(outgoing.length, before + 1);
  assert.equal((await prisma.observerInvitation.findUniqueOrThrow({ where: { id: invite.id } })).reminderCount, 1);
  await prisma.userProfile.update({ where: { id: p.id }, data: { deleted: true } });
  assert.equal((await sendObserverReminder(invite.id)).ok, false);
});

test("draft reminders preserve progress time and honour migrated legacy counts", async () => {
  process.env.LIFECYCLE_MODE = "manual";
  const p = await user();
  const progressAt = ago(3);
  const draft = await prisma.assessmentDraft.create({ data: { userProfileId: p.id, testType: "TRITAN", answers: { "1": 4 }, updatedAt: progressAt } });
  const id = await syncOpportunity(p.id); assert.ok(id);
  assert.ok((await sendOpportunity(id, "manual")).ok);
  const saved = await prisma.assessmentDraft.findUniqueOrThrow({ where: { id: draft.id } });
  assert.equal(saved.updatedAt.getTime(), progressAt.getTime());
  assert.equal(saved.draftReminderCount, 1);
  const older = await user();
  await prisma.assessmentDraft.create({ data: { userProfileId: older.id, testType: "TRITAN", answers: {}, updatedAt: ago(8), draftReminderCount: 2, lastDraftReminderSentAt: ago(4) } });
  const oldId = await syncOpportunity(older.id); assert.ok(oldId);
  assert.equal((await inspectOpportunity(oldId))?.reason, "SEQUENCE_LIMIT");
});

test("unverified and changed addresses are excluded even from manual sends", async () => {
  process.env.LIFECYCLE_MODE = "manual";
  const p = await user();
  await prisma.userProfile.update({ where: { id: p.id }, data: { verifiedEmail: null } });
  const id = await syncOpportunity(p.id); assert.ok(id);
  const before = outgoing.length;
  assert.deepEqual(await sendOpportunity(id, "manual"), { ok: false, reason: "EMAIL_UNVERIFIED" });
  await prisma.userProfile.update({ where: { id: p.id }, data: { verifiedEmail: p.email, email: `${prefix}-${randomUUID()}@example.com` } });
  assert.deepEqual(await sendOpportunity(id, "manual"), { ok: false, reason: "EMAIL_UNVERIFIED" });
  assert.equal(outgoing.length, before);
});

test("rollout is closed by default, preview never sends, automatic requires cohort", async () => {
  process.env.LIFECYCLE_MODE = "off";
  assert.equal((await runLifecycle()).mode, "off");
  process.env.LIFECYCLE_MODE = "automatic";
  delete process.env.LIFECYCLE_COHORT_FROM;
  await assert.rejects(runLifecycle(), /COHORT_FROM_REQUIRED/);
  process.env.LIFECYCLE_MODE = "preview";
  const before = outgoing.length;
  await runLifecycle();
  assert.equal(outgoing.length, before);
  process.env.LIFECYCLE_MODE = "manual";
});

test("automatic run sends once to the explicit cohort and pilot address only", async () => {
  const p = await user();
  const excluded = await user();
  process.env.LIFECYCLE_MODE = "automatic";
  process.env.LIFECYCLE_COHORT_FROM = ago(6).toISOString();
  process.env.LIFECYCLE_EMAIL_ALLOWLIST = p.email!;
  await prisma.lifecycleRun.updateMany({ where: { id: "daily" }, data: { cursor: null } });
  const before = outgoing.length;
  try {
    await runLifecycle();
    assert.equal(outgoing.length, before + 1);
    const row = await prisma.lifecycleDelivery.findFirstOrThrow({ where: { profileId: p.id } });
    assert.equal(row.status, "ACCEPTED");
    assert.equal(await prisma.notification.count({ where: { userId: excluded.id, type: "LIFECYCLE_NUDGE" } }), 0);
    await runLifecycle();
    assert.equal(outgoing.length, before + 1);
  } finally {
    process.env.LIFECYCLE_MODE = "manual";
    delete process.env.LIFECYCLE_COHORT_FROM;
    delete process.env.LIFECYCLE_EMAIL_ALLOWLIST;
  }
});

test("account erasure removes outbox payloads and goals", async () => {
  const p = await user();
  await syncOpportunity(p.id);
  await reserveDelivery(request(p));
  await scrubProfileData(p.id, p.email);
  assert.equal(await prisma.lifecycleDelivery.count({ where: { profileId: p.id } }), 0);
  assert.equal(await prisma.lifecycleOpportunity.count({ where: { profileId: p.id } }), 0);
  assert.equal((await prisma.userProfile.findUniqueOrThrow({ where: { id: p.id } })).verifiedEmail, null);
});

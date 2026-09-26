import test from "node:test";
import assert from "node:assert/strict";
import { ACTIONS, contactExclusion, DAY, emailExclusion, nextDue, selectGoal, type LifecycleContext } from "@/lib/lifecycle/rules";
import { lifecycleConfig, sendingEnabled } from "@/lib/lifecycle/config";
import { prepareFollowupEmail } from "@/lib/lifecycle/templates";

const now = new Date("2026-09-26T12:00:00Z");
const ago = (days: number) => new Date(now.getTime() - days * DAY);
function context(overrides: Partial<LifecycleContext> = {}): LifecycleContext {
  return { id: "p", email: "person@example.com", verifiedEmail: "PERSON@example.com", locale: "hu", createdAt: ago(5), onboardedAt: ago(5),
    deleted: false, clerkId: "clerk", lifecycleEmailsOptOut: false, excluded: false, skipped: false, managed: false,
    draft: null, result: null, hasAnySelfResult: false, invitationCount: 0, actions: Object.values(ACTIONS), ...overrides };
}

test("start, saved draft and first observer invitation have distinct goals and anchors", () => {
  const start = selectGoal(context())!;
  assert.equal(start.rule, "START_SELF");
  assert.equal(start.dueAt.getTime(), ago(3).getTime());
  const draft = selectGoal(context({ draft: { id: "draft", updatedAt: ago(2), reminderCount: 0, lastSentAt: null } }))!;
  assert.equal(draft.rule, "RESUME_SELF");
  assert.equal(draft.goalKey, "draft");
  assert.equal(draft.dueAt.getTime(), ago(1).getTime());
  const completed = context({ result: { id: "result", createdAt: ago(4) }, hasAnySelfResult: true });
  assert.equal(selectGoal(completed)?.rule, "INVITE_FIRST_OBSERVERS");
  assert.equal(selectGoal({ ...completed, invitationCount: 1 }), null);
});

test("managed, skipped, deleted, consultant and inaccessible actions are excluded", () => {
  for (const changes of [{ managed: true }, { skipped: true }, { deleted: true }, { excluded: true }, { clerkId: null }, { onboardedAt: null }, { actions: [] }]) {
    assert.equal(selectGoal(context(changes)), null);
  }
  assert.equal(selectGoal(context({ hasAnySelfResult: true })), null, "campaign-only result is not an abandoned personal assessment");
});

test("fresh progress delays the first and second emails; reminder counts are not reset", () => {
  const goal = selectGoal(context({ draft: { id: "d", updatedAt: ago(1), reminderCount: 1, lastSentAt: ago(4) } }))!;
  assert.equal(nextDue(goal, 0, null).getTime(), now.getTime());
  assert.equal(nextDue(goal, 1, ago(1)).getTime(), now.getTime() + 3 * DAY);
});

test("email permission is tied to the verified current address", () => {
  assert.equal(emailExclusion(context()), null);
  assert.equal(emailExclusion(context({ lifecycleEmailsOptOut: true })), "EMAIL_OPTED_OUT");
  assert.equal(emailExclusion(context({ verifiedEmail: null })), "EMAIL_UNVERIFIED");
  assert.equal(emailExclusion(context({ email: "different@example.com" })), "EMAIL_UNVERIFIED");
});

test("quota includes uncertain attempts, excludes canceled reservations and separates observer reminders", () => {
  const row = { rule: "START_SELF", claimedAt: ago(3), status: "UNKNOWN" };
  assert.equal(contactExclusion([row], "RESUME_SELF", now), null, "exactly 72 hours is allowed");
  assert.equal(contactExclusion([{ ...row, claimedAt: ago(2) }], "REFLECTION", now), "CONTACT_COOLDOWN");
  assert.equal(contactExclusion([{ ...row, claimedAt: ago(2), status: "CANCELED" }], "REFLECTION", now), null);
  assert.equal(contactExclusion([row], "OBSERVER_REMINDER", now), null);
  assert.equal(contactExclusion([4, 8, 12].map(d => ({ ...row, claimedAt: ago(d) })), "START_SELF", now), "CONTACT_LIMIT");
});

test("mode defaults closed; automation requires explicit selection", () => {
  const previous = process.env.LIFECYCLE_MODE;
  try {
    delete process.env.LIFECYCLE_MODE;
    assert.equal(lifecycleConfig().mode, "off");
    assert.equal(sendingEnabled("manual"), false);
    process.env.LIFECYCLE_MODE = "preview";
    assert.equal(sendingEnabled("automatic"), false);
    process.env.LIFECYCLE_MODE = "manual";
    assert.equal(sendingEnabled("manual"), true);
    assert.equal(sendingEnabled("automatic"), false);
  } finally { if (previous === undefined) delete process.env.LIFECYCLE_MODE; else process.env.LIFECYCLE_MODE = previous; }
});

test("both email languages include the correct action, plain-text opt-out and one-click header", () => {
  for (const locale of ["hu", "en"] as const) {
    const email = prepareFollowupEmail({ rule: "INVITE_FIRST_OBSERVERS", locale, opportunityId: "opaque-id", unsubscribeToken: "token" });
    assert.match(email.text, /\/api\/lifecycle\/continue\?id=opaque-id/);
    assert.match(email.text, /\/follow-up\/unsubscribe\?token=token/);
    assert.match(email.html, /\/profile\/follow-up\/opaque-id/);
    assert.equal(email.headers?.["List-Unsubscribe-Post"], "List-Unsubscribe=One-Click");
    assert.match(email.subject, locale === "hu" ? /Mit látnak/ : /How do/);
  }
});

export const DAY = 86_400_000;
export const PERSONAL_RULES = ["START_SELF", "RESUME_SELF", "INVITE_FIRST_OBSERVERS"] as const;
export type PersonalRule = (typeof PERSONAL_RULES)[number];
export type FollowupRule = PersonalRule | "REFLECTION" | "OBSERVER_REMINDER";

export interface LifecycleContext {
  id: string;
  email: string | null;
  verifiedEmail: string | null;
  locale: string | null;
  createdAt: Date;
  onboardedAt: Date | null;
  deleted: boolean;
  clerkId: string | null;
  lifecycleEmailsOptOut: boolean;
  excluded: boolean;
  skipped: boolean;
  managed: boolean;
  draft: { id: string; updatedAt: Date; reminderCount: number; lastSentAt: Date | null } | null;
  result: { id: string; createdAt: Date } | null;
  hasAnySelfResult: boolean;
  invitationCount: number;
  actions: string[];
}

export interface Goal {
  rule: PersonalRule;
  goalKey: string;
  anchorAt: Date;
  dueAt: Date;
  expiresAt: Date;
  action: string;
}

export const ACTIONS: Record<PersonalRule, string> = {
  START_SELF: "START_SELF_ASSESSMENT",
  RESUME_SELF: "CONTINUE_SELF_ASSESSMENT",
  INVITE_FIRST_OBSERVERS: "INVITE_OBSERVERS",
};
const DELAYS: Record<PersonalRule, [number, number]> = {
  START_SELF: [2, 7], RESUME_SELF: [1, 4], INVITE_FIRST_OBSERVERS: [3, 10],
};

export function normalizeEmail(email: string): string { return email.trim().toLowerCase(); }

export function contextExclusion(c: LifecycleContext): string | null {
  if (c.deleted || !c.clerkId) return "ACCOUNT_UNAVAILABLE";
  if (c.excluded) return "EXCLUDED_ACCOUNT";
  if (c.managed) return "MANAGED_JOURNEY";
  if (c.skipped) return "ASSESSMENT_SKIPPED";
  if (!c.onboardedAt) return "ONBOARDING_INCOMPLETE";
  return null;
}

export function selectGoal(c: LifecycleContext): Goal | null {
  if (contextExclusion(c)) return null;
  let rule: PersonalRule;
  let goalKey: string;
  let anchorAt: Date;
  if (c.result) {
    if (c.invitationCount > 0) return null;
    rule = "INVITE_FIRST_OBSERVERS";
    goalKey = "first-personal-invitation";
    anchorAt = new Date(Math.max(c.result.createdAt.getTime(), c.onboardedAt!.getTime()));
  } else if (c.hasAnySelfResult) {
    // Campaign results must never be mistaken for an unfinished personal test.
    return null;
  } else if (c.draft) {
    rule = "RESUME_SELF";
    goalKey = c.draft.id;
    anchorAt = c.draft.updatedAt;
  } else {
    rule = "START_SELF";
    goalKey = "first-personal-assessment";
    anchorAt = c.onboardedAt!;
  }
  const action = ACTIONS[rule];
  if (!c.actions.includes(action)) return null;
  return {
    rule, goalKey, anchorAt, action,
    dueAt: new Date(anchorAt.getTime() + DELAYS[rule][0] * DAY),
    expiresAt: new Date(anchorAt.getTime() + 14 * DAY),
  };
}

export function nextDue(goal: Goal, previousCount: number, lastSentAt: Date | null): Date {
  return new Date(Math.max(
    goal.anchorAt.getTime() + DELAYS[goal.rule][previousCount > 0 ? 1 : 0] * DAY,
    lastSentAt ? lastSentAt.getTime() + 3 * DAY : 0,
  ));
}

export function emailExclusion(c: Pick<LifecycleContext, "email" | "verifiedEmail" | "lifecycleEmailsOptOut" | "deleted" | "clerkId">): string | null {
  if (c.deleted || !c.clerkId) return "ACCOUNT_UNAVAILABLE";
  if (c.lifecycleEmailsOptOut) return "EMAIL_OPTED_OUT";
  if (!c.email) return "EMAIL_MISSING";
  if (!c.verifiedEmail || normalizeEmail(c.verifiedEmail) !== normalizeEmail(c.email)) return "EMAIL_UNVERIFIED";
  return null;
}

export function isPersonalRule(rule: string): rule is PersonalRule {
  return (PERSONAL_RULES as readonly string[]).includes(rule);
}

export function contactExclusion(rows: ReadonlyArray<{ rule: string; claimedAt: Date; status: string }>, rule: FollowupRule, now: Date): string | null {
  const observer = rule === "OBSERVER_REMINDER";
  const relevant = rows.filter(r => r.status !== "CANCELED" && (r.rule === "OBSERVER_REMINDER") === observer);
  const gap = (observer ? 5 : 3) * DAY;
  if (relevant.some(r => now.getTime() - r.claimedAt.getTime() < gap)) return "CONTACT_COOLDOWN";
  if (relevant.filter(r => now.getTime() - r.claimedAt.getTime() < 30 * DAY).length >= 3) return "CONTACT_LIMIT";
  return null;
}

import { prisma } from "@/lib/prisma";
import { lifecycleConfig } from "./config";
import { syncOpportunity, inspectOpportunity, sendOpportunity } from "./service";
import { DAY } from "./rules";
import { handleLifecycleNudge } from "@/lib/notifications/orchestrator";
import { FOLLOWUP_COPY } from "./copy";
import { normalizeEmail } from "./rules";
import { Prisma } from "@prisma/client";

async function maintainDeliveryLog(now: Date) {
  await prisma.lifecycleDelivery.updateMany({ where: { status: "CLAIMED", claimedAt: { lt: new Date(now.getTime() - 15 * 60_000) } }, data: { status: "UNKNOWN", errorCode: "WORKER_INTERRUPTED" } });
  await prisma.lifecycleDelivery.updateMany({ where: { claimedAt: { lt: new Date(now.getTime() - 90 * DAY) }, OR: [{ payload: { not: Prisma.DbNull } }, { unsubscribeToken: { not: null } }] }, data: { payload: Prisma.DbNull, unsubscribeToken: null } });
  await prisma.lifecycleEmailEvent.deleteMany({ where: { createdAt: { lt: new Date(now.getTime() - 90 * DAY) } } });
}

export async function discoverProfiles(options: { cursor?: string; search?: string; limit?: number; cohortOnly?: boolean } = {}) {
  const { cohortFrom } = lifecycleConfig();
  const since = options.cohortOnly ? cohortFrom ?? new Date() : new Date(Date.now() - 30 * DAY);
  return prisma.userProfile.findMany({
    where: {
      deleted: false, clerkId: { not: null },
      ...(options.cursor ? { id: { gt: options.cursor } } : {}),
      ...(options.search ? { OR: [{ email: { contains: options.search, mode: "insensitive" } }, { username: { contains: options.search, mode: "insensitive" } }] } : { createdAt: { gte: since } }),
    }, select: { id: true }, orderBy: { id: "asc" }, take: options.limit ?? 25,
  });
}

export async function runLifecycle() {
  const config = lifecycleConfig();
  const now = new Date();
  // Legacy reminders use the same outbox even while new rules are disabled.
  await maintainDeliveryLog(now);
  if (config.mode === "off") return { mode: "off", scanned: 0, sent: 0, errors: [] };
  if (config.mode === "automatic" && !config.cohortFrom) throw new Error("LIFECYCLE_COHORT_FROM_REQUIRED");
  await prisma.lifecycleRun.upsert({ where: { id: "daily" }, create: { id: "daily" }, update: {} });
  const locked = await prisma.lifecycleRun.updateMany({
    where: { id: "daily", OR: [{ leaseUntil: null }, { leaseUntil: { lt: now } }] },
    data: { leaseUntil: new Date(now.getTime() + 5 * 60_000), startedAt: now },
  });
  if (!locked.count) return { mode: config.mode, busy: true };
  const summary = { mode: config.mode, scanned: 0, sent: 0, errors: [] as string[] };
  const deadline = Date.now() + 35_000;
  try {
    const state = await prisma.lifecycleRun.findUniqueOrThrow({ where: { id: "daily" } });
    const profiles = await discoverProfiles({ cursor: state.cursor ?? undefined, limit: 100, cohortOnly: config.mode === "automatic" });
    let cursor = state.cursor;
    for (const profile of profiles) {
      if (Date.now() >= deadline) break;
      try { await syncOpportunity(profile.id); }
      catch { summary.errors.push(`scan:${profile.id}`); }
      cursor = profile.id;
      summary.scanned++;
    }
    if (profiles.length < 100 && summary.scanned === profiles.length) cursor = null;
    await prisma.lifecycleRun.update({ where: { id: "daily" }, data: { cursor } });
    // Reconcile existing goals even when their profile is outside the discovery page.
    const due = await prisma.lifecycleOpportunity.findMany({ where: { status: "OPEN", dueAt: { lte: now } }, orderBy: [{ dueAt: "asc" }, { id: "asc" }], take: 50 });
    for (const goal of due) {
      if (Date.now() >= deadline) break;
      try {
        await syncOpportunity(goal.profileId);
        const view = await inspectOpportunity(goal.id);
        if (!view) continue;
        // Persist the next review time so blocked/old rows cannot starve the queue.
        const nextReview = new Date(Math.max(view.dueAt.getTime(), Date.now() + DAY, view.snoozedUntil?.getTime() ?? 0));
        await prisma.lifecycleOpportunity.updateMany({ where: { id: goal.id, status: "OPEN" }, data: { dueAt: nextReview } });
        const inAllowlist = !config.allowlist.length || Boolean(view.context?.email && config.allowlist.includes(normalizeEmail(view.context.email)));
        if (config.mode === "automatic" && inAllowlist && view.context && config.cohortFrom && view.context.createdAt >= config.cohortFrom) {
          if (view.status === "OPEN" && view.count < 2 && ["READY", "EMAIL_OPTED_OUT", "EMAIL_UNVERIFIED"].includes(view.reason)) {
            await handleLifecycleNudge(view.profileId, view.id, FOLLOWUP_COPY[view.rule]);
          }
          if (view.reason === "READY") {
            const result = await sendOpportunity(goal.id, "automatic");
            if (result.ok) summary.sent++;
            else if (result.id) summary.errors.push(`send:${goal.id}:${result.reason}`);
          }
        }
      } catch { summary.errors.push(`goal:${goal.id}`); }
    }
    return summary;
  } catch {
    summary.errors.push("RUN_FAILED");
    throw new Error("LIFECYCLE_RUN_FAILED");
  } finally {
    await prisma.lifecycleRun.update({ where: { id: "daily" }, data: { finishedAt: new Date(), leaseUntil: null, summary } });
  }
}

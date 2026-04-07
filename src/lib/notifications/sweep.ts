/**
 * Notification sweep — placeholder for future scheduled notification jobs.
 *
 * TECHNICAL DEBT: Currently trial notifications use lazy check on org dashboard load
 * (orchestrator.checkTrialNotifications). This works but only triggers when an admin
 * visits the org page. A proper sweep would run on a schedule (e.g. daily cron).
 *
 * Future sweep tasks:
 * - Trial ending soon (3 days before trialEndsAt)
 * - Trial expired (trialEndsAt < now)
 * - Low candidate credits (below threshold)
 * - Email digest: daily/weekly summary of unread notifications
 * - Stale notification cleanup (dismiss notifications older than 90 days)
 */

import { prisma } from "@/lib/prisma";
import { checkTrialNotifications } from "./orchestrator";

export interface SweepResult {
  orgsChecked: number;
  notificationsCreated: number;
  errors: string[];
}

/**
 * Run all scheduled notification checks.
 *
 * Call this from a cron job / scheduled task.
 * Currently only handles trial checks.
 */
export async function runNotificationSweep(): Promise<SweepResult> {
  const result: SweepResult = { orgsChecked: 0, notificationsCreated: 0, errors: [] };

  // Find all orgs with active trials
  const orgsWithTrials = await prisma.subscription.findMany({
    where: { status: "trialing", trialEndsAt: { not: null } },
    select: { orgId: true },
  });

  for (const { orgId } of orgsWithTrials) {
    try {
      await checkTrialNotifications(orgId);
      result.orgsChecked++;
    } catch (err) {
      result.errors.push(`org ${orgId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  return result;
}

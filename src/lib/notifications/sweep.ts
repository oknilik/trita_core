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
import type { ScoreResult } from "@/lib/scoring";
import { TRITAN_DIMENSIONS, type TritanDimCode } from "@/lib/tritan";
import { sendReflectionPromptEmail } from "@/lib/emails";
import { checkTrialNotifications } from "./orchestrator";
import { persistNotification } from "./repository";

export interface SweepResult {
  orgsChecked: number;
  notificationsCreated: number;
  emailsSent: number;
  errors: string[];
}

// ── Reflexiós utókövetés (D1) ───────────────────────────────────────────────
// A kitöltés utáni "mi történik két hét múlva" rés első lépése: a legutóbbi
// self-eredmény után 7–10 nappal EGYETLEN, személyre szabott in-app érintés
// (a legerősebb dimenzió + CTA a páros összehasonlításra). A dedupeKey
// user-szintű — soha nem ismétlődik; az e-mail láb tudatosan későbbi kör
// (opt-out infrastruktúrát igényel).

export const REFLECTION_WINDOW_START_DAYS = 7;
export const REFLECTION_WINDOW_END_DAYS = 10;

export interface ReflectionCandidate {
  userId: string;
  /** A legerősebb dimenzió belső kódja — a személyre szabott szöveghez. */
  topDim: TritanDimCode;
}

/**
 * Pure kiválasztó: a userenként LEGFRISSEBB self-eredményekből azok,
 * amelyek a 7–10 napos ablakban vannak. A bemenet már userenként a
 * legfrissebb sor (distinct) — ha a user azóta újat töltött ki, a
 * legfrissebb kicsúszik az ablakból, és nem jelölt.
 */
export function selectReflectionCandidates(
  latestResults: ReadonlyArray<{
    userProfileId: string | null;
    createdAt: Date;
    scores: unknown;
  }>,
  now: Date = new Date(),
): ReflectionCandidate[] {
  const windowEnd = now.getTime() - REFLECTION_WINDOW_START_DAYS * 24 * 60 * 60 * 1000;
  const windowStart = now.getTime() - REFLECTION_WINDOW_END_DAYS * 24 * 60 * 60 * 1000;

  const candidates: ReflectionCandidate[] = [];
  for (const result of latestResults) {
    if (!result.userProfileId) continue;
    const ts = result.createdAt.getTime();
    if (ts > windowEnd || ts < windowStart) continue;

    const scores = result.scores as ScoreResult | null;
    if (!scores || scores.type !== "likert" || !scores.dimensions) continue;
    const ranked = Object.entries(scores.dimensions)
      .filter(([code]) => code in TRITAN_DIMENSIONS)
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
    if (ranked.length === 0) continue;

    candidates.push({
      userId: result.userProfileId,
      topDim: ranked[0][0] as TritanDimCode,
    });
  }
  return candidates;
}

async function runReflectionSweep(result: SweepResult): Promise<void> {
  // Userenként a legfrissebb self-eredmény; az ablak-szűrés a kiválasztóban.
  const latest = await prisma.assessmentResult.findMany({
    where: {
      isSelfAssessment: true,
      userProfile: { deleted: false, clerkId: { not: null } },
    },
    orderBy: { createdAt: "desc" },
    distinct: ["userProfileId"],
    select: { userProfileId: true, createdAt: true, scores: true },
  });

  const candidates = selectReflectionCandidates(latest);
  if (candidates.length === 0) return;

  // Csak az újakat számoljuk: a már-értesítettek kiszűrése előre (a
  // persistNotification dedupe-ja verseny ellen továbbra is véd).
  const [existing, profiles] = await Promise.all([
    prisma.notification.findMany({
      where: {
        type: "REFLECTION_PROMPT",
        userId: { in: candidates.map((c) => c.userId) },
      },
      select: { userId: true },
    }),
    prisma.userProfile.findMany({
      where: { id: { in: candidates.map((c) => c.userId) } },
      select: { id: true, email: true, locale: true, lifecycleEmailsOptOut: true },
    }),
  ]);
  const alreadyNotified = new Set(existing.map((e) => e.userId));
  const profileById = new Map(profiles.map((p) => [p.id, p]));

  for (const candidate of candidates) {
    if (alreadyNotified.has(candidate.userId)) continue;
    try {
      await persistNotification({
        userId: candidate.userId,
        type: "REFLECTION_PROMPT",
        category: "assessment",
        priority: "low",
        vars: {
          // Per-locale feloldás renderer-módosítás nélkül: mindkét nyelvű
          // címke vars-ként megy, és a HU body a {dimLabelHu}-t, az EN body
          // a {dimLabelEn}-t hivatkozza — a tf() a néző nyelvén a megfelelőt
          // interpolálja.
          dimLabelHu: TRITAN_DIMENSIONS[candidate.topDim].hu,
          dimLabelEn: TRITAN_DIMENSIONS[candidate.topDim].en,
        },
        link: "/interaction",
        dedupeKey: `REFLECTION_PROMPT:${candidate.userId}`,
      });
      result.notificationsCreated++;
    } catch (err) {
      result.errors.push(
        `reflection ${candidate.userId}: ${err instanceof Error ? err.message : String(err)}`,
      );
      continue;
    }

    // Email-láb (életciklus): csak opt-out nélkül, best-effort — az email-hiba
    // nem érinti az in-app értesítést, és nem ismétlődik (a dedupe az in-app
    // rekordon ül, ami ekkor már létrejött).
    const profile = profileById.get(candidate.userId);
    if (profile?.email && !profile.lifecycleEmailsOptOut) {
      try {
        const emailLocale = profile.locale === "en" ? "en" : "hu";
        await sendReflectionPromptEmail({
          to: profile.email,
          dimLabel: TRITAN_DIMENSIONS[candidate.topDim][emailLocale],
          locale: emailLocale,
        });
        result.emailsSent++;
      } catch (err) {
        result.errors.push(
          `reflection email ${candidate.userId}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }
  }
}

/**
 * Run all scheduled notification checks.
 *
 * Call this from a cron job / scheduled task.
 * Currently only handles trial checks.
 */
export async function runNotificationSweep(): Promise<SweepResult> {
  const result: SweepResult = { orgsChecked: 0, notificationsCreated: 0, emailsSent: 0, errors: [] };

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

  // Reflexiós utókövetés — a saját hibáit a result.errors-ba gyűjti,
  // a trial-ellenőrzést nem boríthatja.
  try {
    await runReflectionSweep(result);
  } catch (err) {
    result.errors.push(
      `reflection sweep: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return result;
}

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
import { HEXACO_DIMENSIONS, rankDimensionScores, type HexacoCode } from "@/lib/hexaco";
import { sendObserverInviteEmail, sendReflectionPromptEmail } from "@/lib/emails";
import { normalizeLocale } from "@/lib/i18n";
import { OPEN_DEAL_STAGES, QUOTE_EXPIRING_WINDOW_DAYS } from "@/lib/crm/constants";
import { formatQuoteNo, resolveCrmDueWindow } from "@/lib/crm/guards";
import { expireQuote } from "@/lib/crm/quotes";
import {
  checkTrialNotifications,
  handleCrmNextActionDue,
  handleCrmQuoteExpiring,
} from "./orchestrator";
import { persistNotification } from "./repository";

export interface CrmSweepStats {
  /** Lejárt SENT ajánlatok, amelyeket a sweep EXPIRED-re zárt. */
  autoExpiredQuotes: number;
  /** Esedékes next actionű dealek, amelyekre értesítés-kísérlet ment. */
  nextActionDeals: number;
  /** Hamarosan lejáró SENT ajánlatok, amelyekre értesítés-kísérlet ment. */
  expiringQuotes: number;
}

export interface SweepResult {
  orgsChecked: number;
  notificationsCreated: number;
  emailsSent: number;
  errors: string[];
  crm?: CrmSweepStats;
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
  topDim: HexacoCode;
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
    // Kanonikus rangsor (rankDimensionScores): pontszám csökkenő, holtverseny-
    // nél HEXACO_ORDER — pontosan az, amit a profil-felületek is futtatnak.
    // A korábbi localeCompare-os (ábécés, belső kódon futó) tie-break
    // holtversenynél MÁS „legerősebbet" nevezett meg az e-mailben, mint amit
    // a profil mutat.
    // ISMERT KORLÁT (bizonytalanság-kapu): a REFLECTION_PROMPT sablon
    // szerkezete („A legerősebb dimenziód: {dimLabel}") egyetlen dimenziót
    // követel, ezért a mérési hibán belüli top-pár (isTopPairUncertain)
    // esetén is a determinisztikus rangsor elsője megy ki — ilyenkor a
    // profil-címke is ugyanennek a dimenziónak a főnevét mutatja (főnév-only
    // degradáció), így a kettő nem mond ellent. Hedge-elt sablon-variáns
    // (i18n/notifications.ts + emails.ts — nem ennek a modulnak a hatásköre)
    // bevezetése után ide is kapu kell.
    const ranked = rankDimensionScores(
      Object.entries(scores.dimensions)
        .filter(([code]) => code in HEXACO_DIMENSIONS)
        .map(([code, score]) => ({ code, score })),
    );
    if (ranked.length === 0) continue;

    candidates.push({
      userId: result.userProfileId,
      topDim: ranked[0].code as HexacoCode,
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
          dimLabelHu: HEXACO_DIMENSIONS[candidate.topDim].hu,
          dimLabelEn: HEXACO_DIMENSIONS[candidate.topDim].en,
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
          dimLabel: HEXACO_DIMENSIONS[candidate.topDim][emailLocale],
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

// ── Observer-emlékeztető sweep ──────────────────────────────────────────────
// A reminderCount/lastReminderSentAt oszlopok eddig csak a kézi admin-gombot
// szolgálták ki — az automata kör ugyanazon az e-mail úton (isReminder) megy,
// a meglévő napi cronból. A plafonok szándékosan óvatosak: max 2 automata
// emlékeztető meghívónként, futásonként max 50 küldés (határos cron-idő).

export const OBSERVER_REMINDER_MIN_AGE_DAYS = 4;
export const OBSERVER_REMINDER_REPEAT_DAYS = 5;
export const OBSERVER_REMINDER_MAX_COUNT = 2;
export const OBSERVER_REMINDER_BATCH_LIMIT = 50;

const DAY_MS = 24 * 60 * 60 * 1000;

export interface ObserverReminderRow {
  status: string;
  observerEmail: string | null;
  expiresAt: Date;
  createdAt: Date;
  lastReminderSentAt: Date | null;
  reminderCount: number;
}

/**
 * Pure kiválasztó: mely függő meghívókra megy automata emlékeztető.
 * A DB-lekérdezés durván előszűr, de MINDEN szabály itt is érvényesül —
 * a viselkedés egy helyen, unit-tesztelhetően él.
 */
export function selectObserverReminderCandidates<T extends ObserverReminderRow>(
  invitations: ReadonlyArray<T>,
  now: Date = new Date(),
): T[] {
  const oldEnough = now.getTime() - OBSERVER_REMINDER_MIN_AGE_DAYS * DAY_MS;
  const repeatBefore = now.getTime() - OBSERVER_REMINDER_REPEAT_DAYS * DAY_MS;

  const selected: T[] = [];
  for (const inv of invitations) {
    if (selected.length >= OBSERVER_REMINDER_BATCH_LIMIT) break;
    if (inv.status !== "PENDING") continue;
    if (!inv.observerEmail) continue;
    if (inv.expiresAt.getTime() <= now.getTime()) continue;
    if (inv.createdAt.getTime() > oldEnough) continue;
    if (inv.reminderCount >= OBSERVER_REMINDER_MAX_COUNT) continue;
    if (inv.lastReminderSentAt && inv.lastReminderSentAt.getTime() > repeatBefore) continue;
    selected.push(inv);
  }
  return selected;
}

async function runObserverReminderSweep(result: SweepResult): Promise<void> {
  const now = new Date();
  const pending = await prisma.observerInvitation.findMany({
    where: {
      status: "PENDING",
      observerEmail: { not: null },
      expiresAt: { gt: now },
      reminderCount: { lt: OBSERVER_REMINDER_MAX_COUNT },
    },
    // A legrégebbi meghívók előnyt kapnak, ha a futásonkénti plafon vág.
    orderBy: { createdAt: "asc" },
    select: {
      id: true,
      token: true,
      status: true,
      observerEmail: true,
      observerName: true,
      createdAt: true,
      expiresAt: true,
      reminderCount: true,
      lastReminderSentAt: true,
      inviter: { select: { username: true, email: true, locale: true } },
    },
  });

  const candidates = selectObserverReminderCandidates(pending, now);
  for (const inv of candidates) {
    if (!inv.observerEmail) continue;
    try {
      await sendObserverInviteEmail({
        to: inv.observerEmail,
        inviterName: inv.inviter.username ?? inv.inviter.email ?? "Trita",
        token: inv.token,
        recipientName: inv.observerName ?? undefined,
        locale: normalizeLocale(inv.inviter.locale),
        isReminder: true,
      });
    } catch (err) {
      // Küldés-hiba: a számláló nem lép, a következő futás újrapróbálja.
      result.errors.push(
        `observer reminder ${inv.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
      continue;
    }
    result.emailsSent++;
    try {
      await prisma.observerInvitation.update({
        where: { id: inv.id },
        data: { reminderCount: { increment: 1 }, lastReminderSentAt: new Date() },
      });
    } catch (err) {
      // A levél már KIMENT — a számláló-hiba külön jelölést kap, mert a
      // következő futás emiatt ismételhet (a max-plafon a rekordolt
      // küldésekre garantált, a kézbesítettekre nem).
      result.errors.push(
        `observer reminder ${inv.id}: counter update failed (email already sent): ${
          err instanceof Error ? err.message : String(err)
        }`,
      );
    }
  }
}

// ── CRM napi sweep ──────────────────────────────────────────────────────────
// A meglévő napi cron (release-steps → runNotificationSweep) viszi, ÚJ
// endpoint nélkül. Három feladat: (c) lejárt SENT ajánlat auto-EXPIRED +
// SYSTEM-activity; (a) esedékes (lejárt/mai) next action → admin-notif
// (napi dedupe dealenként); (b) 3 napon belül lejáró SENT ajánlat →
// admin-notif (ajánlatonként egyszer). A létrejött értesítés-sorok számát
// a repository dedupe-ja határozza meg — a CrmSweepStats a feldolgozott
// tételeket számolja, nem a sorokat.

// Az ADMIN_EMAILS feloldása helyben, hívás-időben (a lib/auth getAdminEmails
// szemantikájával azonosan). Szándékosan NEM a lib/auth-ból importálunk: az
// auth import-lánca (next/navigation, server-only) a sweep pure exportjait
// (selectReflectionCandidates) unit-tesztelhetetlenné tenné.
function resolveAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

async function runCrmSweep(result: SweepResult): Promise<void> {
  const crm: CrmSweepStats = { autoExpiredQuotes: 0, nextActionDeals: 0, expiringQuotes: 0 };
  result.crm = crm;
  const now = new Date();

  // (c) Auto-expire ELŐBB — ami már lejárt, arról nem szólunk „hamarosan
  // lejár”-t, és a kint lévő összeg-metrikából is kikerül.
  const expiredQuotes = await prisma.quote.findMany({
    where: { status: "SENT", validUntil: { lt: now } },
    select: { id: true },
  });
  for (const quote of expiredQuotes) {
    try {
      await expireQuote(quote.id);
      crm.autoExpiredQuotes++;
    } catch (err) {
      result.errors.push(
        `crm expire ${quote.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // Címzettek: platform-adminok (ADMIN_EMAILS) — a submitInquiry mintája.
  const adminEmails = resolveAdminEmails();
  const adminProfiles = adminEmails.length
    ? await prisma.userProfile.findMany({
        where: { deleted: false, email: { in: adminEmails, mode: "insensitive" } },
        select: { id: true },
      })
    : [];
  const adminUserIds = adminProfiles.map((p) => p.id);
  if (adminUserIds.length === 0) return;

  // (a) Esedékes next actionök: lejárt + ma esedékes, nyitott dealeken.
  const { dueBefore, isoDay } = resolveCrmDueWindow(now);
  const dueDeals = await prisma.deal.findMany({
    where: { stage: { in: [...OPEN_DEAL_STAGES] }, nextActionAt: { lt: dueBefore } },
    select: { id: true, title: true, nextActionAt: true },
  });
  for (const deal of dueDeals) {
    try {
      await handleCrmNextActionDue({
        dealId: deal.id,
        dealTitle: deal.title,
        dueDateIso: deal.nextActionAt?.toISOString().slice(0, 10) ?? isoDay,
        dedupeDay: isoDay,
        adminUserIds,
      });
      crm.nextActionDeals++;
    } catch (err) {
      result.errors.push(
        `crm next-action ${deal.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  }

  // (b) Hamarosan lejáró SENT ajánlatok (3 napos ablak).
  const expiringSoon = await prisma.quote.findMany({
    where: {
      status: "SENT",
      validUntil: {
        gte: now,
        lt: new Date(now.getTime() + QUOTE_EXPIRING_WINDOW_DAYS * 24 * 60 * 60 * 1000),
      },
    },
    select: {
      id: true,
      quoteNo: true,
      createdAt: true,
      dealId: true,
      validUntil: true,
      deal: { select: { title: true } },
    },
  });
  for (const quote of expiringSoon) {
    try {
      await handleCrmQuoteExpiring({
        quoteId: quote.id,
        quoteLabel: formatQuoteNo(quote.quoteNo, quote.createdAt),
        dealId: quote.dealId,
        dealTitle: quote.deal.title,
        validUntilIso: quote.validUntil?.toISOString().slice(0, 10) ?? isoDay,
        adminUserIds,
      });
      crm.expiringQuotes++;
    } catch (err) {
      result.errors.push(
        `crm quote-expiring ${quote.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
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

  // Observer-emlékeztetők — szintén hibatűrő, a többi lépést nem boríthatja.
  try {
    await runObserverReminderSweep(result);
  } catch (err) {
    result.errors.push(
      `observer reminder sweep: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  // CRM napi kör (next-action esedékesség, ajánlat-lejárat) — szintén
  // hibatűrő: a CRM hibája a többi sweep-feladatot nem boríthatja.
  try {
    await runCrmSweep(result);
  } catch (err) {
    result.errors.push(
      `crm sweep: ${err instanceof Error ? err.message : String(err)}`,
    );
  }

  return result;
}

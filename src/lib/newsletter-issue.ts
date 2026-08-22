import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getPostBySlug } from "@/lib/blog";
import { createLogger } from "@/lib/logger";
import {
  renderNewsletterIssueEmail,
  sendNewsletterIssueEmail,
  type NewsletterIssueItem,
} from "@/lib/emails";
import { APP_URL } from "@/lib/email-layout";
import {
  blogImageUrl,
  clickUrl,
  listSendableSubscribers,
  markDeliveryAccepted,
  markDeliveryFailure,
  reserveDeliveries,
  unsubscribePostUrl,
  unsubscribeUrl,
} from "@/lib/newsletter";
import { runNewsletterSendQueue } from "@/lib/newsletter-send";
import { normalizeLocale, type Locale } from "@/lib/i18n/core";

const log = createLogger("newsletter-issue");
const CLAIM_BATCH_SIZE = 50;
const STALE_SENDING_MS = 30 * 60 * 1000;

/** Egy szám dedupe-kulcsa a `NewsletterDelivery` naplóban. */
export function issueDeliveryKey(issueId: string): string {
  return `issue:${issueId}`;
}

export function issueContentHash(issue: {
  subject: string;
  intro: string;
  locale: string;
  postSlugs: string[];
}): string {
  return crypto
    .createHash("sha256")
    .update(JSON.stringify({
      subject: issue.subject,
      intro: issue.intro,
      locale: issue.locale,
      postSlugs: issue.postSlugs,
    }))
    .digest("hex");
}

export interface IssueSendResult {
  recipients: number;
  failed: number;
  status?: "PARTIAL" | "SENT" | "FAILED";
  blocked?:
    | "not_found"
    | "already_sent"
    | "sending"
    | "empty"
    | "invalid_articles"
    | "no_recipients"
    | "preview_required";
}

/** Nem létező, piszkozat vagy más nyelvű cikk nem kerülhet a levélbe. */
function buildItems(postSlugs: string[], locale: Locale): Array<
  NewsletterIssueItem & { slug: string }
> {
  return postSlugs
    .map((slug) => getPostBySlug(slug))
    .filter((post): post is NonNullable<typeof post> => Boolean(post))
    .filter((post) => post.status === "published" && post.locale === locale)
    .map((post) => ({
      slug: post.slug,
      title: post.title,
      description: post.description,
      url: `${APP_URL}/blog/${post.slug}`,
      imageUrl: blogImageUrl(APP_URL, post.slug),
      readingMinutes: post.readingMinutes,
    }));
}

export interface IssuePreview {
  items: Array<{ slug: string; title: string; imageUrl?: string }>;
  recipients: number;
  subject: string;
  html: string;
  previewHash: string;
}

/**
 * Tényleges HTML-előnézet. A hash DB-be kerül; küldéskor ugyanennek kell
 * egyeznie a pillanatnyi tartalommal és a kliens által jóváhagyott hash-sel.
 */
export async function previewIssue(issueId: string): Promise<IssuePreview | null> {
  const issue = await prisma.newsletterIssue.findUnique({ where: { id: issueId } });
  if (!issue || issue.status === "SENT" || issue.status === "SENDING") return null;

  const locale = normalizeLocale(issue.locale);
  const items = buildItems(issue.postSlugs, locale);
  if (items.length !== issue.postSlugs.length) return null;
  const previewHash = issueContentHash(issue);
  const recipients = await listSendableSubscribers({
    topic: "newsletter",
    locale,
    excludeSlug: issueDeliveryKey(issue.id),
  });

  const rendered = renderNewsletterIssueEmail({
    subject: issue.subject,
    intro: issue.intro,
    items,
    unsubUrl: `${APP_URL}/newsletter/unsubscribe?token=preview`,
    unsubPostUrl: `${APP_URL}/api/newsletter/unsubscribe?token=preview`,
    locale,
  });

  const updated = await prisma.newsletterIssue.updateMany({
    where: { id: issue.id, updatedAt: issue.updatedAt, status: issue.status },
    data: {
      previewHash,
      previewedAt: new Date(),
      ...(issue.status === "DRAFT" ? { status: "READY" } : {}),
    },
  });
  if (updated.count !== 1) return null;

  return {
    items: items.map((item) => ({
      slug: item.slug,
      title: item.title,
      imageUrl: item.imageUrl,
    })),
    recipients: recipients.length,
    subject: rendered.subject,
    html: rendered.html,
    previewHash,
  };
}

async function finalizeIssue(issueId: string, deliveryKey: string): Promise<{
  recipients: number;
  failed: number;
  status: "PARTIAL" | "SENT" | "FAILED";
}> {
  const [recipients, failed, unknown] = await Promise.all([
    prisma.newsletterDelivery.count({
      where: { slug: deliveryKey, acceptedAt: { not: null } },
    }),
    prisma.newsletterDelivery.count({ where: { slug: deliveryKey, status: "FAILED" } }),
    prisma.newsletterDelivery.count({ where: { slug: deliveryKey, status: "UNKNOWN" } }),
  ]);
  const failures = failed + unknown;
  const status = issueCompletionStatus(recipients, failures);

  await prisma.newsletterIssue.update({
    where: { id: issueId },
    data: {
      status,
      recipients,
      failures,
      sentAt: status === "SENT" ? new Date() : null,
      sendStartedAt: null,
    },
  });
  return { recipients, failed: failures, status };
}

export function issueCompletionStatus(
  recipients: number,
  failures: number,
): "PARTIAL" | "SENT" | "FAILED" {
  if (failures > 0) return recipients > 0 ? "PARTIAL" : "FAILED";
  return recipients > 0 ? "SENT" : "FAILED";
}

/** Küldés csak mentett és ténylegesen előnézett tartalomra. */
export async function sendIssue(
  issueId: string,
  approvedPreviewHash: string,
): Promise<IssueSendResult> {
  const issue = await prisma.newsletterIssue.findUnique({ where: { id: issueId } });
  if (!issue) return { recipients: 0, failed: 0, blocked: "not_found" };
  if (issue.status === "SENT") return { recipients: 0, failed: 0, blocked: "already_sent" };
  if (issue.status === "SENDING") return { recipients: 0, failed: 0, blocked: "sending" };

  const locale = normalizeLocale(issue.locale);
  const items = buildItems(issue.postSlugs, locale);
  if (items.length !== issue.postSlugs.length) {
    return { recipients: 0, failed: 0, blocked: "invalid_articles" };
  }
  if (items.length === 0 && !issue.intro.trim()) {
    return { recipients: 0, failed: 0, blocked: "empty" };
  }

  const currentHash = issueContentHash(issue);
  if (
    !issue.previewedAt
    || !issue.previewHash
    || issue.previewHash !== currentHash
    || approvedPreviewHash !== currentHash
  ) {
    return { recipients: 0, failed: 0, blocked: "preview_required" };
  }

  const claimedIssue = await prisma.newsletterIssue.updateMany({
    where: {
      id: issue.id,
      status: { in: ["READY", "PARTIAL", "FAILED"] },
      previewHash: currentHash,
    },
    data: { status: "SENDING", sendStartedAt: new Date() },
  });
  if (claimedIssue.count !== 1) {
    return { recipients: 0, failed: 0, blocked: "sending" };
  }

  const deliveryKey = issueDeliveryKey(issue.id);
  try {
    const recipients = await listSendableSubscribers({
      topic: "newsletter",
      locale,
      excludeSlug: deliveryKey,
    });
    if (recipients.length === 0) {
      await prisma.newsletterIssue.updateMany({
        where: { id: issue.id, status: "SENDING" },
        data: { status: issue.status, sendStartedAt: null },
      });
      return { recipients: 0, failed: 0, blocked: "no_recipients" };
    }

    for (let i = 0; i < recipients.length; i += CLAIM_BATCH_SIZE) {
      const batch = recipients.slice(i, i + CLAIM_BATCH_SIZE);
      const reserved = await reserveDeliveries(deliveryKey, batch.map((row) => row.id));
      const sendable = batch.filter((row) => reserved.has(row.id));
      if (sendable.length === 0) continue;

      const outcomes = await runNewsletterSendQueue(sendable, (subscriber) => {
        const reservation = reserved.get(subscriber.id)!;
        const deliveryId = reservation.id;
        return sendNewsletterIssueEmail({
          to: subscriber.email,
          subject: issue.subject,
          intro: issue.intro,
          items: items.map((item) => ({
            ...item,
            url: clickUrl(APP_URL, deliveryId, item.slug),
          })),
          unsubUrl: unsubscribeUrl(APP_URL, subscriber.unsubToken),
          unsubPostUrl: unsubscribePostUrl(APP_URL, subscriber.unsubToken),
          locale,
          idempotencyKey:
            `newsletter-delivery/${deliveryId}/attempt/${reservation.attemptCount}`,
        });
      });

      for (const outcome of outcomes) {
        const deliveryId = reserved.get(outcome.item.id)!.id;
        if (outcome.result.ok) {
          await markDeliveryAccepted(
            deliveryId,
            outcome.item.id,
            outcome.result.providerEmailId,
          );
        } else {
          await markDeliveryFailure(deliveryId, outcome.result);
        }
      }
    }

    const result = await finalizeIssue(issue.id, deliveryKey);
    log.info(
      { event: "newsletter.issue_finished", issueId: issue.id, locale, ...result },
      "Newsletter issue send finished",
    );
    return result;
  } catch (error) {
    // A kivétel előtt már lefoglalt, de még el nem könyvelt címzettek se
    // maradjanak fél órán át CLAIMED állapotban. Ugyanaz a szám később csak
    // ezeket a FAILED sorokat próbálja újra.
    await prisma.newsletterDelivery.updateMany({
      where: { slug: deliveryKey, status: "CLAIMED" },
      data: {
        status: "FAILED",
        failedAt: new Date(),
        lastError: error instanceof Error ? error.message.slice(0, 2000) : "issue_send_exception",
      },
    });
    await finalizeIssue(issue.id, deliveryKey);
    throw error;
  }
}

/** Crash után a SENDING szám ne maradjon örökre kezelhetetlen. */
export async function recoverStaleNewsletterIssues(): Promise<number> {
  const rows = await prisma.newsletterIssue.findMany({
    where: {
      status: "SENDING",
      sendStartedAt: { lt: new Date(Date.now() - STALE_SENDING_MS) },
    },
    select: { id: true },
  });
  for (const row of rows) {
    await finalizeIssue(row.id, issueDeliveryKey(row.id));
  }
  return rows.length;
}

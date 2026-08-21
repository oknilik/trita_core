import "server-only";

import { prisma } from "@/lib/prisma";
import { getPostBySlug } from "@/lib/blog";
import { createLogger } from "@/lib/logger";
import { sendNewsletterIssueEmail, type NewsletterIssueItem } from "@/lib/emails";
import { APP_URL } from "@/lib/email-layout";
import {
  clickUrl,
  listSendableSubscribers,
  markSent,
  releaseDelivery,
  reserveDeliveries,
  unsubscribeUrl,
} from "@/lib/newsletter";
import { normalizeLocale, type Locale } from "@/lib/i18n/core";

const log = createLogger("newsletter-issue");

/**
 * SZERKESZTETT HÍRLEVÉL-SZÁM — összeállítás és kiküldés.
 *
 * A cikk-értesítő (`newsletter-digest.ts`) gépi és cikkenkénti. Ez a forma
 * emberi: te írod a kísérőszöveget, és eldöntöd, mi kerüljön bele. A kettő
 * megfér egymás mellett — ha a szerkesztett formára állsz át, a
 * feliratkozóknál a `blog` topicot kell levenni, és marad a `newsletter`.
 *
 * A kiküldés ugyanazt a naplót használja, `issue:<id>` dedupe-kulccsal:
 * ugyanaz az idempotencia-garancia védi, mint a digestet.
 */

const BATCH_SIZE = 50;

/** Egy szám dedupe-kulcsa a `NewsletterDelivery` naplóban. */
export function issueDeliveryKey(issueId: string): string {
  return `issue:${issueId}`;
}

export interface IssueSendResult {
  recipients: number;
  failed: number;
  /** Ha a szám nem küldhető (nincs ilyen, már kiment, üres) — az OK. */
  blocked?: "not_found" | "already_sent" | "empty";
}

/**
 * A beválogatott slugokból levél-tételek. A nem létező vagy piszkozat cikk
 * KIMARAD — egy törölt slug ne vigyen ki 404-es linket a levélben.
 */
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
      // A tényleges URL a küldéskor kap kattintás-követő burkot (címzettenként
      // más), ez itt csak a helyőrző alak.
      url: `${APP_URL}/blog/${post.slug}`,
      readingMinutes: post.readingMinutes,
    }));
}

/** Előnézet az admin szerkesztőnek: mi kerülne bele, és hánynak menne. */
export async function previewIssue(issueId: string): Promise<{
  items: Array<{ slug: string; title: string }>;
  recipients: number;
} | null> {
  const issue = await prisma.newsletterIssue.findUnique({ where: { id: issueId } });
  if (!issue) return null;

  const locale = normalizeLocale(issue.locale);
  const items = buildItems(issue.postSlugs, locale);
  const recipients = await listSendableSubscribers({
    topic: "newsletter",
    locale,
    excludeSlug: issueDeliveryKey(issue.id),
  });

  return {
    items: items.map((i) => ({ slug: i.slug, title: i.title })),
    recipients: recipients.length,
  };
}

/**
 * Kiküldés. A szám ezután `SENT` — visszafordíthatatlan, mert a levél kiment.
 *
 * A `recipients` mező a TÉNYLEGESEN kiküldött darabszám, nem a lista mérete:
 * ha a küldés fele elhasal, az látszódjon.
 */
export async function sendIssue(issueId: string): Promise<IssueSendResult> {
  const issue = await prisma.newsletterIssue.findUnique({ where: { id: issueId } });
  if (!issue) return { recipients: 0, failed: 0, blocked: "not_found" };
  if (issue.status === "SENT") return { recipients: 0, failed: 0, blocked: "already_sent" };

  const locale = normalizeLocale(issue.locale);
  const items = buildItems(issue.postSlugs, locale);
  if (items.length === 0 && !issue.intro.trim()) {
    return { recipients: 0, failed: 0, blocked: "empty" };
  }

  const deliveryKey = issueDeliveryKey(issue.id);
  const recipients = await listSendableSubscribers({
    topic: "newsletter",
    locale,
    excludeSlug: deliveryKey,
  });

  let sent = 0;
  let failed = 0;

  for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
    const batch = recipients.slice(i, i + BATCH_SIZE);
    const reserved = await reserveDeliveries(deliveryKey, batch.map((r) => r.id));
    const sendable = batch.filter((r) => reserved.has(r.id));
    if (sendable.length === 0) continue;

    const outcomes = await Promise.all(
      sendable.map((subscriber) => {
        const deliveryId = reserved.get(subscriber.id)!;
        return sendNewsletterIssueEmail({
          to: subscriber.email,
          subject: issue.subject,
          intro: issue.intro,
          // Címzettenként saját kattintás-követő linkek — ugyanaz a
          // delivery-id minden tételen, mert egy levélről van szó.
          items: items.map((item) => ({
            ...item,
            url: clickUrl(APP_URL, deliveryId, item.slug),
          })),
          unsubUrl: unsubscribeUrl(APP_URL, subscriber.unsubToken),
          locale,
        });
      }),
    );

    const succeeded: string[] = [];
    for (const [index, ok] of outcomes.entries()) {
      const subscriber = sendable[index]!;
      if (ok) {
        succeeded.push(subscriber.id);
        continue;
      }
      failed += 1;
      await releaseDelivery(reserved.get(subscriber.id)!);
    }

    await markSent(succeeded);
    sent += succeeded.length;
  }

  // A státusz akkor is SENT, ha nulla címzett volt: a szám le van zárva, nem
  // szerkeszthető tovább. Így nem fordulhat elő, hogy egy „elküldött" szám
  // szövegét később átírják, és a másik fele már mást kapott.
  await prisma.newsletterIssue.update({
    where: { id: issue.id },
    data: { status: "SENT", sentAt: new Date(), recipients: sent },
  });

  log.info(
    { event: "newsletter.issue_sent", issueId: issue.id, locale, recipients: sent, failed },
    "Newsletter issue sent",
  );

  return { recipients: sent, failed };
}

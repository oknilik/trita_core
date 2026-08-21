import "server-only";

import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { APP_URL } from "@/lib/email-layout";
import { sendNewsletterConfirmEmail } from "@/lib/emails";
import { confirmUrl } from "@/lib/newsletter";
import { runNewsletterSendQueue } from "@/lib/newsletter-send";
import { normalizeLocale } from "@/lib/i18n/core";

export const CONFIRMATION_EMAIL_MAX_ATTEMPTS = 5;
const RETRY_AFTER_MS = 15 * 60 * 1000;
const STALE_SENDING_MS = 30 * 60 * 1000;

function confirmationIdempotencyKey(subscriberId: string, token: string): string {
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex").slice(0, 20);
  return `newsletter-confirm/${subscriberId}/${tokenHash}`;
}

/**
 * Egy outbox-sor claimje és kiküldése. Az updateMany a tokenre is feltételt
 * tesz, így egy közben érkező új feliratkozási kérés eredményét a régi worker
 * nem írhatja felül.
 */
export async function sendQueuedConfirmation(subscriberId: string): Promise<boolean> {
  const row = await prisma.newsletterSubscriber.findUnique({
    where: { id: subscriberId },
    select: {
      id: true,
      email: true,
      locale: true,
      status: true,
      confirmToken: true,
      confirmationEmailStatus: true,
      confirmationEmailAttempts: true,
    },
  });
  if (
    !row
    || row.status !== "PENDING"
  ) {
    return false;
  }
  // Párhuzamos beküldésnél a másik worker már viheti ugyanazt az outbox-sort.
  if (["SENDING", "SENT"].includes(row.confirmationEmailStatus)) return true;
  if (
    !["QUEUED", "FAILED"].includes(row.confirmationEmailStatus)
    || row.confirmationEmailAttempts >= CONFIRMATION_EMAIL_MAX_ATTEMPTS
  ) return false;

  const claimed = await prisma.newsletterSubscriber.updateMany({
    where: {
      id: row.id,
      status: "PENDING",
      confirmToken: row.confirmToken,
      confirmationEmailStatus: { in: ["QUEUED", "FAILED"] },
      confirmationEmailAttempts: { lt: CONFIRMATION_EMAIL_MAX_ATTEMPTS },
    },
    data: {
      confirmationEmailStatus: "SENDING",
      confirmationEmailAttempts: { increment: 1 },
      confirmationEmailLastAttemptAt: new Date(),
      confirmationEmailLastError: null,
    },
  });
  if (claimed.count !== 1) return false;

  const [outcome] = await runNewsletterSendQueue([row], (subscriber) =>
    sendNewsletterConfirmEmail({
      to: subscriber.email,
      confirmUrl: confirmUrl(APP_URL, subscriber.confirmToken),
      locale: normalizeLocale(subscriber.locale),
      idempotencyKey: confirmationIdempotencyKey(subscriber.id, subscriber.confirmToken),
    }),
  );
  const result = outcome!.result;

  await prisma.newsletterSubscriber.updateMany({
    where: {
      id: row.id,
      status: "PENDING",
      confirmToken: row.confirmToken,
      confirmationEmailStatus: "SENDING",
    },
    data: result.ok
      ? {
          confirmationEmailStatus: "SENT",
          confirmationEmailSentAt: new Date(),
          confirmationEmailLastError: null,
        }
      : {
          confirmationEmailStatus: "FAILED",
          confirmationEmailLastError: `${result.code}: ${result.message}`.slice(0, 2000),
        },
  });

  return result.ok;
}

/** Maintenance cron: a 15 percnél régebbi, sikertelen DOI-levelek retry-ja. */
export async function retryPendingConfirmations(limit = 25): Promise<{
  attempted: number;
  sent: number;
}> {
  const retryBefore = new Date(Date.now() - RETRY_AFTER_MS);
  const rows = await prisma.newsletterSubscriber.findMany({
    where: {
      status: "PENDING",
      tokenExpiresAt: { gt: new Date() },
      confirmationEmailStatus: { in: ["QUEUED", "FAILED"] },
      confirmationEmailAttempts: { lt: CONFIRMATION_EMAIL_MAX_ATTEMPTS },
      OR: [
        { confirmationEmailLastAttemptAt: null },
        { confirmationEmailLastAttemptAt: { lt: retryBefore } },
      ],
    },
    select: { id: true },
    orderBy: { createdAt: "asc" },
    take: limit,
  });

  let sent = 0;
  for (const row of rows) {
    if (await sendQueuedConfirmation(row.id)) sent += 1;
  }
  return { attempted: rows.length, sent };
}

export async function recoverStaleConfirmationClaims(): Promise<number> {
  const result = await prisma.newsletterSubscriber.updateMany({
    where: {
      status: "PENDING",
      confirmationEmailStatus: "SENDING",
      confirmationEmailLastAttemptAt: {
        lt: new Date(Date.now() - STALE_SENDING_MS),
      },
    },
    data: {
      confirmationEmailStatus: "FAILED",
      confirmationEmailLastError: "stale_confirmation_claim_recovered",
    },
  });
  return result.count;
}

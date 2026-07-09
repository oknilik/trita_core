/**
 * I2 — Billing retry mechanizmus
 *
 * Minimál retry support: retryable failed események újrafuttatása.
 * Admin endpoint vagy cron hívja.
 */

import { prisma } from "@/lib/prisma";

const MAX_RETRY_COUNT = 3;

export interface RetryableEvent {
  id: string;
  eventId: string;
  eventType: string;
  objectId: string | null;
  errorMessage: string | null;
  retryCount: number;
  createdAt: Date;
}

/**
 * List retryable failed events (for admin view).
 */
export async function listRetryableEvents(
  limit = 50,
): Promise<RetryableEvent[]> {
  return prisma.billingEventLog.findMany({
    where: {
      status: "failed",
      retryable: true,
      retryCount: { lt: MAX_RETRY_COUNT },
    },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      eventId: true,
      eventType: true,
      objectId: true,
      errorMessage: true,
      retryCount: true,
      createdAt: true,
    },
  });
}

/**
 * Reset a failed event to "processing" so it can be reprocessed.
 * The caller must then re-dispatch the event to the appropriate handler.
 * Returns true if reset was successful.
 */
export async function resetEventForRetry(eventId: string): Promise<boolean> {
  const event = await prisma.billingEventLog.findUnique({
    where: { eventId },
    select: { status: true, retryable: true, retryCount: true },
  });

  if (!event) return false;
  if (event.status !== "failed") return false;
  if (!event.retryable) return false;
  if (event.retryCount >= MAX_RETRY_COUNT) return false;

  await prisma.billingEventLog.update({
    where: { eventId },
    data: {
      status: "processing",
      lastRetryAt: new Date(),
    },
  });

  return true;
}

/**
 * Get retry stats for admin dashboard.
 */
export async function getRetryStats(): Promise<{
  totalFailed: number;
  retryable: number;
  exhausted: number;
  processed: number;
}> {
  const [totalFailed, retryable, exhausted, processed] = await Promise.all([
    prisma.billingEventLog.count({ where: { status: "failed" } }),
    prisma.billingEventLog.count({
      where: { status: "failed", retryable: true, retryCount: { lt: MAX_RETRY_COUNT } },
    }),
    prisma.billingEventLog.count({
      where: { status: "failed", retryCount: { gte: MAX_RETRY_COUNT } },
    }),
    prisma.billingEventLog.count({ where: { status: "processed" } }),
  ]);

  return { totalFailed, retryable, exhausted, processed };
}

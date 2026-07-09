/**
 * D2 — Idempotency layer
 *
 * Event-id alapú deduplikáció a billing webhook handler-ekhez.
 * Minden event feldolgozás előtt check, után mark.
 */

import { prisma } from "@/lib/prisma";

export async function isEventProcessed(eventId: string): Promise<boolean> {
  const existing = await prisma.billingEventLog.findUnique({
    where: { eventId },
    select: { status: true },
  });
  return existing?.status === "processed";
}

export async function markEventProcessing(
  eventId: string,
  eventType: string,
  objectId: string | null,
): Promise<void> {
  await prisma.billingEventLog.upsert({
    where: { eventId },
    create: {
      provider: "stripe",
      eventId,
      eventType,
      objectId,
      status: "processing",
    },
    update: {
      status: "processing",
    },
  });
}

export async function markEventProcessed(
  eventId: string,
): Promise<void> {
  await prisma.billingEventLog.update({
    where: { eventId },
    data: {
      status: "processed",
      processedAt: new Date(),
    },
  });
}

export async function markEventFailed(
  eventId: string,
  error: string,
  retryable: boolean,
): Promise<void> {
  await prisma.billingEventLog.update({
    where: { eventId },
    data: {
      status: "failed",
      errorMessage: error,
      retryable,
      retryCount: { increment: 1 },
      lastRetryAt: new Date(),
    },
  });
}

export async function markEventSkipped(
  eventId: string,
  eventType: string,
  reason: string,
): Promise<void> {
  await prisma.billingEventLog.upsert({
    where: { eventId },
    create: {
      provider: "stripe",
      eventId,
      eventType,
      status: "skipped",
      errorMessage: reason,
      processedAt: new Date(),
    },
    update: {
      status: "skipped",
      errorMessage: reason,
      processedAt: new Date(),
    },
  });
}

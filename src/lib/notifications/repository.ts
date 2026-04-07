/**
 * Notification repository — DB persistence layer.
 *
 * Handles create (with dedup), fan-out, read/dismiss state transitions.
 * No business logic here — that lives in the orchestrator.
 */

import { prisma } from "@/lib/prisma";
import {
  NOTIFICATION_TYPE_META,
  type NotificationIntent,
} from "./types";

// ── Create single notification (with dedupe) ────────────────────────────────

export async function persistNotification(intent: NotificationIntent) {
  const meta = NOTIFICATION_TYPE_META[intent.type];

  // Dedup check: if dedupeKey is set, skip if already exists for this user
  if (intent.dedupeKey) {
    const existing = await prisma.notification.findFirst({
      where: { dedupeKey: intent.dedupeKey, userId: intent.userId },
      select: { id: true },
    });
    if (existing) return existing;
  }

  return prisma.notification.create({
    data: {
      userId: intent.userId,
      type: intent.type,
      category: intent.category,
      priority: intent.priority,
      titleKey: meta.titleKey,
      bodyKey: meta.bodyKey,
      vars: intent.vars ?? undefined,
      link: intent.link ?? null,
      sourceType: intent.sourceType ?? null,
      sourceId: intent.sourceId ?? null,
      actorUserId: intent.actorUserId ?? null,
      dedupeKey: intent.dedupeKey ?? null,
    },
  });
}

// ── Fan-out to multiple users ───────────────────────────────────────────────

export async function persistNotificationBatch(intents: NotificationIntent[]) {
  if (intents.length === 0) return;

  // Filter out dupes where dedupeKey already exists
  const withDedup = intents.filter((i) => i.dedupeKey);
  let existingKeys = new Set<string>();

  if (withDedup.length > 0) {
    const existing = await prisma.notification.findMany({
      where: {
        dedupeKey: { in: withDedup.map((i) => i.dedupeKey!) },
        userId: { in: withDedup.map((i) => i.userId) },
      },
      select: { dedupeKey: true, userId: true },
    });
    existingKeys = new Set(existing.map((e) => `${e.dedupeKey}:${e.userId}`));
  }

  const filtered = intents.filter((i) => {
    if (!i.dedupeKey) return true;
    return !existingKeys.has(`${i.dedupeKey}:${i.userId}`);
  });

  if (filtered.length === 0) return;

  await prisma.notification.createMany({
    data: filtered.map((intent) => {
      const meta = NOTIFICATION_TYPE_META[intent.type];
      return {
        userId: intent.userId,
        type: intent.type,
        category: intent.category,
        priority: intent.priority,
        titleKey: meta.titleKey,
        bodyKey: meta.bodyKey,
        vars: intent.vars ?? undefined,
        link: intent.link ?? null,
        sourceType: intent.sourceType ?? null,
        sourceId: intent.sourceId ?? null,
        actorUserId: intent.actorUserId ?? null,
        dedupeKey: intent.dedupeKey ?? null,
      };
    }),
  });
}

import { randomUUID } from "node:crypto";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendEmailDetailed, type EmailSendParams, type EmailSendResult } from "@/lib/emails";
import { contactExclusion, DAY, normalizeEmail, type FollowupRule } from "./rules";
import { applyStoredEvents } from "./events";

export type DeliveryResult = { ok: true; id: string; sentAt: Date } | { ok: false; reason: string; id?: string };
export type PreparedEmail = Pick<EmailSendParams, "subject" | "html" | "text" | "headers">;
export interface DeliveryRequest {
  key: string;
  profileId: string;
  opportunityId?: string;
  rule: FollowupRule;
  recipient: string;
  actorId?: string;
  legacyLastSentAt?: Date | null;
  prepare: (id: string, unsubscribeToken: string) => PreparedEmail;
  validate: () => Promise<string | null>;
}

/** The transaction serialises both account-wide and address-wide quotas. */
export async function reserveDelivery(input: Omit<DeliveryRequest, "prepare" | "validate">, now: Date = new Date()) {
  const recipient = normalizeEmail(input.recipient);
  return prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`lifecycle:profile:${input.profileId}`}, 0))`;
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`lifecycle:email:${recipient}`}, 0))`;
    if (await tx.lifecycleDelivery.findUnique({ where: { key: input.key } })) return { reason: "DELIVERY_EXISTS" } as const;
    if (await tx.emailSuppression.findUnique({ where: { email: recipient } })) return { reason: "EMAIL_SUPPRESSED" } as const;
    const history = await tx.lifecycleDelivery.findMany({
      where: { ...(input.rule === "OBSERVER_REMINDER" ? { recipient } : { OR: [{ profileId: input.profileId }, { recipient }] }), claimedAt: { gte: new Date(now.getTime() - 30 * DAY) } },
      select: { rule: true, claimedAt: true, status: true },
    });
    if (input.legacyLastSentAt && !history.some(r => r.rule === input.rule && Math.abs(r.claimedAt.getTime() - input.legacyLastSentAt!.getTime()) < 60_000)) {
      history.push({ rule: input.rule, claimedAt: input.legacyLastSentAt, status: "ACCEPTED" });
    }
    const reason = contactExclusion(history, input.rule, now);
    if (reason) return { reason } as const;
    if (input.opportunityId) {
      const goal = await tx.lifecycleOpportunity.findUnique({ where: { id: input.opportunityId } });
      if (!goal || goal.status !== "OPEN") return { reason: "INELIGIBLE" } as const;
      if (goal.snoozedUntil && goal.snoozedUntil > now) return { reason: "SNOOZED" } as const;
    }
    const delivery = await tx.lifecycleDelivery.create({ data: {
      key: input.key, profileId: input.profileId, opportunityId: input.opportunityId,
      rule: input.rule, recipient, actorId: input.actorId, claimedAt: now,
      unsubscribeToken: input.rule === "OBSERVER_REMINDER" ? null : randomUUID(),
    } });
    return { delivery } as const;
  }, { timeout: 10_000 });
}

/** Only immediate, identical-payload retries are allowed. UNKNOWN is terminal
 * for future workers, including a worker lost before persisting the response. */
export async function deliver(
  input: DeliveryRequest,
  transport: (params: EmailSendParams) => Promise<EmailSendResult> = sendEmailDetailed,
): Promise<DeliveryResult> {
  const before = await input.validate();
  if (before) return { ok: false, reason: before };
  const reserved = await reserveDelivery(input);
  if (!reserved.delivery) return { ok: false, reason: reserved.reason };
  const row = reserved.delivery;
  const prepared = input.prepare(row.id, row.unsubscribeToken ?? "");
  await prisma.lifecycleDelivery.update({ where: { id: row.id }, data: { payload: prepared as Prisma.InputJsonValue } });
  let uncertain = false;
  for (let attempt = 1; attempt <= 3; attempt++) {
    // Revalidate even on retry: a click, unsubscribe or profile deletion may
    // have happened while awaiting a provider response.
    const reason = await input.validate();
    const suppressed = await prisma.emailSuppression.findUnique({ where: { email: row.recipient } });
    if (reason || suppressed) {
      await prisma.lifecycleDelivery.updateMany({ where: { id: row.id, status: "CLAIMED" }, data: {
        status: uncertain ? "UNKNOWN" : "CANCELED", errorCode: reason ?? "EMAIL_SUPPRESSED",
      } });
      return { ok: false, id: row.id, reason: reason ?? "EMAIL_SUPPRESSED" };
    }
    // updateMany also handles account erasure between reservation and send.
    const active = await prisma.lifecycleDelivery.updateMany({ where: { id: row.id, status: "CLAIMED" }, data: { attemptCount: attempt, attemptedAt: new Date() } });
    if (active.count === 0) return { ok: false, id: row.id, reason: "INELIGIBLE" };
    let result: EmailSendResult;
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      result = await Promise.race([
        transport({ ...prepared, to: row.recipient, template: `lifecycle_${input.rule.toLowerCase()}`, idempotencyKey: `lifecycle/${row.id}` }),
        new Promise<EmailSendResult>(resolve => { timer = setTimeout(() => resolve({ ok: false, uncertain: true, retryable: false, code: "transport_timeout", message: "Provider response timed out" }), 10_000); }),
      ]);
    } catch {
      result = { ok: false, uncertain: true, retryable: true, code: "transport_exception", message: "Transport interrupted" };
    } finally {
      if (timer) clearTimeout(timer);
    }
    if (result.ok) {
      const sentAt = new Date();
      await prisma.lifecycleDelivery.updateMany({ where: { id: row.id, status: "CLAIMED" }, data: { providerEmailId: result.providerEmailId, acceptedAt: sentAt, status: "ACCEPTED" } });
      await applyStoredEvents(result.providerEmailId);
      return { ok: true, id: row.id, sentAt };
    }
    uncertain ||= result.uncertain;
    if (!result.retryable || attempt === 3) {
      await prisma.lifecycleDelivery.updateMany({ where: { id: row.id, status: "CLAIMED" }, data: { status: uncertain ? "UNKNOWN" : "FAILED", errorCode: result.code } });
      return { ok: false, id: row.id, reason: uncertain ? "UNKNOWN" : result.code };
    }
    await new Promise(resolve => setTimeout(resolve, attempt * 1000));
  }
  return { ok: false, id: row.id, reason: "UNKNOWN" };
}

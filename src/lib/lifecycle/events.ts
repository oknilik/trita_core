import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "./rules";

const STATES: Record<string, string> = { delivered: "DELIVERED", failed: "FAILED", suppressed: "SUPPRESSED", bounce: "BOUNCED", complaint: "COMPLAINED" };
const PRIORITY = ["CLAIMED", "UNKNOWN", "ACCEPTED", "DELIVERED", "FAILED", "SUPPRESSED", "BOUNCED", "COMPLAINED"];

export async function applyStoredEvents(providerEmailId: string) {
  await prisma.$transaction(async tx => {
    await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtextextended(${`lifecycle:provider:${providerEmailId}`}, 0))`;
    const row = await tx.lifecycleDelivery.findUnique({ where: { providerEmailId } });
    if (!row) return;
    const events = await tx.lifecycleEmailEvent.findMany({ where: { providerEmailId } });
    const next = events.reduce((state, event) => PRIORITY.indexOf(STATES[event.kind]) > PRIORITY.indexOf(state) ? STATES[event.kind] : state, row.status);
    await tx.lifecycleDelivery.update({ where: { id: row.id }, data: {
      status: next,
      ...(events.some(e => e.kind === "delivered") && !row.deliveredAt ? { deliveredAt: new Date() } : {}),
    } });
  });
}

export async function recordLifecycleEmailEvent(input: { id: string; providerEmailId?: string; email?: string | null; kind: string }) {
  if (!STATES[input.kind]) return;
  if (input.email && ["bounce", "complaint", "suppressed"].includes(input.kind)) {
    const email = normalizeEmail(input.email);
    await prisma.emailSuppression.upsert({ where: { email }, create: { email, reason: input.kind }, update: { reason: input.kind } });
  }
  if (input.providerEmailId) {
    await prisma.lifecycleEmailEvent.upsert({ where: { id: input.id },
      create: { id: input.id, providerEmailId: input.providerEmailId, kind: input.kind }, update: {},
    });
    await applyStoredEvents(input.providerEmailId);
  }
}

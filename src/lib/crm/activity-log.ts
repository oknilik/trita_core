import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { type ManualActivityKind } from "@/lib/crm/constants";
import { CrmServiceError } from "@/lib/crm/errors";

// ─────────────────────────────────────────────────────────────────────
// CRM idővonal-írás. Két belépő:
//   · logActivity — kézi naplózás + lastActivityAt + OPCIONÁLIS következő
//     lépés EGY tranzakcióban (a 10 másodperces napi flow magja);
//   · createSystemActivity — rendszer-esemény (stage-váltás, ajánlat
//     kiküldve, org aktiválva) egy már futó tranzakción belül.
// ─────────────────────────────────────────────────────────────────────

type Tx = Prisma.TransactionClient;

/**
 * Rendszer-esemény az idővonalra + lastActivityAt-frissítés. A hívó
 * tranzakcióján belül fut — a deal létezését a hívó garantálja.
 */
export async function createSystemActivity(
  tx: Tx,
  dealId: string,
  summary: string,
  body?: string | null,
  occurredAt: Date = new Date(),
) {
  const activity = await tx.crmActivity.create({
    data: { dealId, kind: "SYSTEM", summary, body: body ?? null, occurredAt },
  });
  await bumpLastActivityAt(tx, dealId, occurredAt);
  return activity;
}

/** lastActivityAt = max(eddigi, occurredAt) — visszadátumozás nem viszi vissza. */
export async function bumpLastActivityAt(tx: Tx, dealId: string, occurredAt: Date) {
  await tx.deal.updateMany({
    where: {
      id: dealId,
      OR: [{ lastActivityAt: null }, { lastActivityAt: { lt: occurredAt } }],
    },
    data: { lastActivityAt: occurredAt },
  });
}

export interface LogActivityEntry {
  kind: ManualActivityKind;
  summary: string;
  body?: string | null;
  /** Visszadátumozható — default: most. */
  occurredAt?: Date | null;
}

export interface NextActionUpdate {
  at: Date | null;
  note?: string | null;
}

/**
 * Kézi naplózás EGY tranzakcióban: activity + lastActivityAt + opcionális
 * következő lépés. A nextAction megadása felülírja a deal nextActionAt/-Note
 * mezőit (at=null töröl) — így a „naplózok és kitűzöm a következőt” egyetlen
 * hívás, ahogy a terv kéri.
 */
export async function logActivity(
  dealId: string,
  entry: LogActivityEntry,
  nextAction?: NextActionUpdate,
) {
  return prisma.$transaction(async (tx) => {
    const deal = await tx.deal.findUnique({ where: { id: dealId }, select: { id: true } });
    if (!deal) throw new CrmServiceError("DEAL_NOT_FOUND");

    const occurredAt = entry.occurredAt ?? new Date();
    const activity = await tx.crmActivity.create({
      data: {
        dealId,
        kind: entry.kind,
        summary: entry.summary,
        body: entry.body ?? null,
        occurredAt,
      },
    });
    await bumpLastActivityAt(tx, dealId, occurredAt);

    if (nextAction !== undefined) {
      await tx.deal.update({
        where: { id: dealId },
        data: {
          nextActionAt: nextAction.at,
          nextActionNote: nextAction.at ? (nextAction.note?.trim() || null) : null,
        },
      });
    }

    const updatedDeal = await tx.deal.findUniqueOrThrow({ where: { id: dealId } });
    return { activity, deal: updatedDeal };
  });
}

/** Kézi bejegyzés szerkesztése — SYSTEM-esemény nem írható át. */
export async function updateActivity(
  activityId: string,
  patch: { summary?: string; body?: string | null; occurredAt?: Date },
) {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.crmActivity.findUnique({ where: { id: activityId } });
    if (!existing) throw new CrmServiceError("ACTIVITY_NOT_FOUND");
    if (existing.kind === "SYSTEM") throw new CrmServiceError("NOT_EDITABLE");

    const activity = await tx.crmActivity.update({
      where: { id: activityId },
      data: {
        ...(patch.summary !== undefined ? { summary: patch.summary } : {}),
        ...(patch.body !== undefined ? { body: patch.body } : {}),
        ...(patch.occurredAt !== undefined ? { occurredAt: patch.occurredAt } : {}),
      },
    });
    if (patch.occurredAt !== undefined) {
      await bumpLastActivityAt(tx, existing.dealId, patch.occurredAt);
    }
    return activity;
  });
}

/** Kézi bejegyzés törlése — SYSTEM-esemény nem törölhető. */
export async function deleteActivity(activityId: string) {
  const existing = await prisma.crmActivity.findUnique({
    where: { id: activityId },
    select: { id: true, kind: true },
  });
  if (!existing) throw new CrmServiceError("ACTIVITY_NOT_FOUND");
  if (existing.kind === "SYSTEM") throw new CrmServiceError("NOT_EDITABLE");
  await prisma.crmActivity.delete({ where: { id: activityId } });
}

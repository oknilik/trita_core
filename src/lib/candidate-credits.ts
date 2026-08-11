import { prisma } from "./prisma";

export interface CreditBalance {
  available: number;
  totalPurchased: number;
  totalUsed: number;
}

export interface CreditHistoryEntry {
  id: string;
  type: string;
  amount: number;
  balance: number;
  note: string | null;
  actorId: string | null;
  createdAt: Date;
}

export async function getCreditBalance(orgId: string): Promise<CreditBalance> {
  const [sub, purchaseAgg, usageAgg, refundAgg] = await Promise.all([
    prisma.subscription.findUnique({
      where: { orgId },
      select: { candidateCredits: true },
    }),
    prisma.candidateCredit.aggregate({
      where: { orgId, type: "purchase" },
      _sum: { amount: true },
    }),
    prisma.candidateCredit.aggregate({
      where: { orgId, type: "usage" },
      _sum: { amount: true },
    }),
    prisma.candidateCredit.aggregate({
      where: { orgId, type: "refund" },
      _sum: { amount: true },
    }),
  ]);

  return {
    available: sub?.candidateCredits ?? 0,
    totalPurchased: purchaseAgg._sum.amount ?? 0,
    // A visszatérítés a felhasználást ellensúlyozza, nem a vásárlást növeli
    // (2026-08-11, fix): a korábbi "purchase" típusú refund a totalPurchased
    // számot hamisította. Nettó felhasználás = bruttó usage − refund; így az
    // available = totalPurchased − totalUsed azonosság megmarad.
    totalUsed: Math.max(
      0,
      Math.abs(usageAgg._sum.amount ?? 0) - (refundAgg._sum.amount ?? 0),
    ),
  };
}

export async function addCredits(params: {
  orgId: string;
  amount: number;
  actorId: string;
  note: string;
  /** ledger-típus: vásárlás/feltöltés = "purchase" (alapértelmezés), visszavonás = "refund" */
  type?: "purchase" | "refund";
}): Promise<number> {
  return prisma.$transaction(async (tx) => {
    const sub = await tx.subscription.update({
      where: { orgId: params.orgId },
      data: { candidateCredits: { increment: params.amount } },
      select: { candidateCredits: true },
    });

    await tx.candidateCredit.create({
      data: {
        orgId: params.orgId,
        type: params.type ?? "purchase",
        amount: params.amount,
        balance: sub.candidateCredits,
        note: params.note,
        actorId: params.actorId,
      },
    });

    return sub.candidateCredits;
  });
}

/**
 * Atomically use one credit.
 * Returns new balance, or null if no credits available (race-safe).
 */
export async function useCredit(params: {
  orgId: string;
  actorId: string;
  note: string;
}): Promise<number | null> {
  return prisma.$transaction(async (tx) => {
    // FELTÉTELES írás (nem check-then-act): a `candidateCredits > 0` szűrő MAGÁN
    // az UPDATE-en van, így két párhuzamos felhasználás nem tud mindkettő
    // átcsúszni egy 1-es egyenlegen (READ COMMITTED alatt a korábbi
    // findUnique-őr mindkettőt átengedte volna → −1 egyenleg, két „sikeres"
    // válasz). Ha 0 sort érintett, nincs kredit → null.
    const consumed = await tx.subscription.updateMany({
      where: { orgId: params.orgId, candidateCredits: { gt: 0 } },
      data: { candidateCredits: { decrement: 1 } },
    });

    if (consumed.count === 0) return null;

    const updated = await tx.subscription.findUniqueOrThrow({
      where: { orgId: params.orgId },
      select: { candidateCredits: true },
    });

    await tx.candidateCredit.create({
      data: {
        orgId: params.orgId,
        type: "usage",
        amount: -1,
        balance: updated.candidateCredits,
        note: params.note,
        actorId: params.actorId,
      },
    });

    return updated.candidateCredits;
  });
}

export async function getCreditHistory(
  orgId: string,
  limit = 20,
): Promise<CreditHistoryEntry[]> {
  return prisma.candidateCredit.findMany({
    where: { orgId },
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      type: true,
      amount: true,
      balance: true,
      note: true,
      actorId: true,
      createdAt: true,
    },
  });
}

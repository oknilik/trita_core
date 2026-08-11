import { prisma } from "@/lib/prisma";
import {
  aggregateFakeDoorReport,
  type FakeDoorReport,
} from "@/lib/fakedoor/aggregate";

// Fake door riport — a mérés kiolvasása. Az aggregációs szabályok (szegmentált
// konverzió, közönségenkénti fizetési hajlandóság, profil-szintű dedup) az
// aggregate.ts-ben élnek TISZTA függvényként — ez a héj csak olvas.

export type {
  FakeDoorCell,
  FakeDoorReport,
  WillingnessSummary,
} from "@/lib/fakedoor/aggregate";

export async function buildFakeDoorReport(module: string): Promise<FakeDoorReport> {
  const [views, responses] = await Promise.all([
    prisma.fakeDoorView.findMany({
      where: { module },
      select: {
        audience: true,
        priceVariant: true,
        sessionId: true,
        userId: true,
        profileId: true,
        createdAt: true,
      },
    }),
    prisma.fakeDoorResponse.findMany({
      where: { module },
      select: {
        audience: true,
        priceVariant: true,
        interest: true,
        emailOptIn: true,
        valueGoal: true,
        reasonNo: true,
        maxPriceHuf: true,
        otherText: true,
        sessionId: true,
        userId: true,
        profileId: true,
        respondedAt: true,
      },
    }),
  ]);

  return aggregateFakeDoorReport(views, responses);
}

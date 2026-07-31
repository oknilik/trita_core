import { prisma } from "@/lib/prisma";
import {
  DEFAULT_RATE_CARD,
  RATE_CARD_KEY,
  rateCardSchema,
  type RateCard,
} from "@/lib/quote/rate-card";

// A díjtételek betöltése/mentése.
//
// Ha még nincs mentett kártya, az alapértelmezés jön vissza — a kalkulátor
// első megnyitásakor is működik. Ha a mentett adat NEM felel meg a sémának
// (pl. a szerkezet közben változott), szintén az alapértelmezéssel megyünk
// tovább: rossz díjtételekkel számolni veszélyesebb, mint placeholderrel.

export async function loadRateCard(): Promise<{ rate: RateCard; stored: boolean }> {
  const row = await prisma.quoteRateCard.findUnique({ where: { key: RATE_CARD_KEY } });
  if (!row) return { rate: DEFAULT_RATE_CARD, stored: false };

  const parsed = rateCardSchema.safeParse(row.data);
  if (!parsed.success) return { rate: DEFAULT_RATE_CARD, stored: false };
  return { rate: parsed.data, stored: true };
}

export async function saveRateCard(rate: RateCard, updatedById: string | null) {
  await prisma.quoteRateCard.upsert({
    where: { key: RATE_CARD_KEY },
    create: { key: RATE_CARD_KEY, data: rate, updatedById },
    update: { data: rate, updatedById },
  });
}

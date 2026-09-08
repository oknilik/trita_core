import { revalidatePath } from "next/cache";
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
// (pl. a 2026-09-07 előtti, programdíjas kártya van a DB-ben), szintén az
// alapértelmezéssel megyünk tovább: rossz díjtételekkel számolni
// veszélyesebb, mint az alapértelmezettel. Az admin felület jelzi, ha nem
// mentett kártya él.

export async function loadRateCard(): Promise<{ rate: RateCard; stored: boolean }> {
  const row = await prisma.quoteRateCard.findUnique({ where: { key: RATE_CARD_KEY } });
  if (!row) return { rate: DEFAULT_RATE_CARD, stored: false };

  const parsed = rateCardSchema.safeParse(row.data);
  if (!parsed.success) return { rate: DEFAULT_RATE_CARD, stored: false };
  return { rate: parsed.data, stored: true };
}

/** A publikus felületek, amelyek a díjkártyából mutatnak árat (ISR-rel). */
export const PRICE_LADDER_PUBLIC_PATHS = ["/", "/team-dynamics", "/pricing", "/pilot"] as const;

export async function saveRateCard(rate: RateCard, updatedById: string | null) {
  await prisma.quoteRateCard.upsert({
    where: { key: RATE_CARD_KEY },
    create: { key: RATE_CARD_KEY, data: rate, updatedById },
    update: { data: rate, updatedById },
  });
  // A publikus oldalak ISR-rel renderelnek; mentés után azonnal a friss
  // számot mutassák, ne a következő revalidálás után.
  for (const path of PRICE_LADDER_PUBLIC_PATHS) {
    try {
      revalidatePath(path);
    } catch {
      // Teszt-környezetben (node:test, nincs Next request-kontextus) a
      // revalidálás nem elérhető — a mentés attól még érvényes.
    }
  }
}

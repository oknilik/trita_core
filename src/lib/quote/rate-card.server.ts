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

  // A 2026-09-09 előtt mentett v2 kártyák még nem tartalmaztak
  // csapatonkénti felárat. Betöltéskor az új alapértékkel egészítjük ki
  // őket, így a deploy után a publikus és az admin kalkulátor azonnal az
  // új, fedezetvédett képletet használja, újramentés nélkül is.
  const stored = (typeof row.data === "object" && row.data !== null ? row.data : {}) as Partial<RateCard> & {
    tiers?: Partial<Record<"kep" | "prog", Partial<RateCard["tiers"]["kep"]>>>;
  };
  const needsUnitEconomicsMigration =
    stored.version === 2 &&
    (stored.tiers?.kep?.additionalTeamFee == null || stored.tiers?.prog?.additionalTeamFee == null);
  const candidate = {
    ...stored,
    extraWorkshopDayFee: needsUnitEconomicsMigration
      ? DEFAULT_RATE_CARD.extraWorkshopDayFee
      : stored.extraWorkshopDayFee,
    retainerMonthlyFee: needsUnitEconomicsMigration
      ? DEFAULT_RATE_CARD.retainerMonthlyFee
      : stored.retainerMonthlyFee,
    tiers: {
      kep: needsUnitEconomicsMigration
        ? DEFAULT_RATE_CARD.tiers.kep
        : { ...DEFAULT_RATE_CARD.tiers.kep, ...stored.tiers?.kep },
      prog: needsUnitEconomicsMigration
        ? DEFAULT_RATE_CARD.tiers.prog
        : { ...DEFAULT_RATE_CARD.tiers.prog, ...stored.tiers?.prog },
    },
  };
  const parsed = rateCardSchema.safeParse(candidate);
  if (!parsed.success) return { rate: DEFAULT_RATE_CARD, stored: false };
  return { rate: parsed.data, stored: true };
}

/** A publikus felületek, amelyek a díjkártyából mutatnak árat (ISR-rel). */
export const PRICE_LADDER_PUBLIC_PATHS = ["/team-dynamics", "/pricing", "/pilot"] as const;

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

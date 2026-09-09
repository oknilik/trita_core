import type { QuoteTier, RateCard } from "@/lib/quote/rate-card";
import { FALLBACK_FX, type FxRate } from "@/lib/pricing/fx";

// ─────────────────────────────────────────────────────────────────────
// Publikus árlétra — a díjkártya KIFELÉ mutatható részhalmaza.
//
// Keretmentes modul (nincs React, nincs Prisma): ugyanebből számol a
// szerver-oldali JSON-LD, az /pricing árblokk (kliens), a /team-dynamics
// ár-horgonya, a /pilot ténysáv és az admin ajánlat-kalkulátor. Így a
// publikus szám és az ajánlat sosem csúszhat szét.
//
// Ami NINCS benne, és nem is kerülhet ide: óra-becslés, cél-óradíj,
// kedvezmény-keret — belső számok.
// ─────────────────────────────────────────────────────────────────────

export interface PublicTierPrice {
  perHead: number;
  perHeadOver: number;
  teamBaseFee: number;
}

export interface PublicLadder {
  tiers: Record<QuoteTier, PublicTierPrice>;
  firstBandHeads: number;
  extraWorkshopDayFee: number;
  pilotDiscountPct: number;
  /**
   * Napi középárfolyam az angol felület euró-összegeihez. Az ár forintban
   * rögzített; az euró tájékoztató. A szerver tölti (fx.server.ts), a
   * tiszta számításokhoz a tartalék-árfolyam az alapértelmezés.
   */
  fx: FxRate;
}

export function derivePublicLadder(rate: RateCard, fx: FxRate = FALLBACK_FX): PublicLadder {
  return {
    tiers: {
      kep: { ...rate.tiers.kep },
      prog: { ...rate.tiers.prog },
    },
    firstBandHeads: rate.firstBandHeads,
    extraWorkshopDayFee: rate.extraWorkshopDayFee,
    pilotDiscountPct: rate.pilotDiscountPct,
    fx,
  };
}

export interface LadderPrice {
  /** Résztvevők az első létszámsávban. */
  firstHeads: number;
  /** Fők a sáv feletti áron. */
  overHeads: number;
  /** Az összes csapat alapdíja. */
  baseFee: number;
  /** Az első létszámsáv résztvevőinek díja. */
  firstHeadsFee: number;
  /** A szint fejenkénti díja összesen (nettó Ft). */
  total: number;
  /** Átlagos fejenkénti ár a megadott létszámra (nettó Ft), 0 főnél null. */
  perHeadAverage: number | null;
}

/**
 * Csapatonkénti alapdíj + az összlétszámra egyszer alkalmazott sávos létszámdíj.
 */
export function ladderPrice(
  ladder: PublicLadder,
  tier: QuoteTier,
  headcount: number,
  teamCount = 1,
): LadderPrice {
  const heads = Math.max(0, Math.round(headcount));
  const firstHeads = Math.min(heads, ladder.firstBandHeads);
  const overHeads = Math.max(0, heads - ladder.firstBandHeads);
  const teams = Math.max(1, Math.round(teamCount));
  const price = ladder.tiers[tier];
  const baseFee = heads > 0 ? teams * price.teamBaseFee : 0;
  const firstHeadsFee = firstHeads * price.perHead;
  const total = baseFee + firstHeadsFee + overHeads * price.perHeadOver;
  return {
    firstHeads,
    overHeads,
    baseFee,
    firstHeadsFee,
    total,
    perHeadAverage: heads > 0 ? Math.round(total / heads) : null,
  };
}

/** Referencia-átlagár: egy csapat, az első létszámsáv határán. */
export function referencePerHead(ladder: PublicLadder, tier: QuoteTier): number {
  return ladderPrice(ladder, tier, ladder.firstBandHeads).perHeadAverage ?? 0;
}

export function pilotPerHead(ladder: PublicLadder, tier: QuoteTier): number {
  const total = ladderPrice(ladder, tier, ladder.firstBandHeads).total;
  return Math.round(total * (100 - ladder.pilotDiscountPct) / 100 / ladder.firstBandHeads);
}

/** Referencia-csapat teljes díja, az első létszámsáv határán. */
export function ladderBaseFee(ladder: PublicLadder, tier: QuoteTier): number {
  return ladderPrice(ladder, tier, ladder.firstBandHeads).total;
}

export function pilotBaseFee(ladder: PublicLadder, tier: QuoteTier): number {
  return Math.round(ladderBaseFee(ladder, tier) * (100 - ladder.pilotDiscountPct) / 100);
}

export function ladderEntryPerHead(ladder: PublicLadder): { tier: QuoteTier; perHead: number } {
  const kep = referencePerHead(ladder, "kep");
  const prog = referencePerHead(ladder, "prog");
  const tier = kep <= prog ? "kep" : "prog";
  return { tier, perHead: Math.min(kep, prog) };
}

/** A publikus létszám-csúszka határai — a kalkulátor és a JSON-LD is ezt használja. */
export const PUBLIC_HEADCOUNT_MIN = 3;
export const PUBLIC_HEADCOUNT_MAX = 40;
export const PUBLIC_HEADCOUNT_DEFAULT = 10;
/**
 * A csúszka utolsó lépése: „40+". Ezen a fokon a felület nem számol
 * árat, hanem egyedi ajánlatot kínál — nagy létszámnál a szerkezet
 * (több csapat, szervezet) dönt, nem a fejenkénti sáv.
 */
export const PUBLIC_HEADCOUNT_OVER = PUBLIC_HEADCOUNT_MAX + 1;

export function isOverPublicMax(headcount: number): boolean {
  return headcount > PUBLIC_HEADCOUNT_MAX;
}

/** Az analitikába küldött létszám-sáv (nem pontos szám — mintázat, nem PII). */
export function headcountBand(headcount: number): "3-4" | "5-8" | "9-12" | "13-20" | "21-40" | "40+" {
  if (headcount < 5) return "3-4";
  if (headcount <= 8) return "5-8";
  if (headcount <= 12) return "9-12";
  if (headcount <= 20) return "13-20";
  if (headcount <= PUBLIC_HEADCOUNT_MAX) return "21-40";
  return "40+";
}

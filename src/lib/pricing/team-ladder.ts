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
  additionalTeamFee: number;
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
  /** A minimumdíj által lefedett tényleges résztvevők. */
  firstHeads: number;
  /** Fők a sáv feletti áron. */
  overHeads: number;
  /** Minimum projektár egy csapatra, legfelj `firstBandHeads` főig. */
  baseFee: number;
  /** Az elsőn felüli csapatok díja. */
  additionalTeams: number;
  additionalTeamsFee: number;
  /** A szint fejenkénti díja összesen (nettó Ft). */
  total: number;
  /** Átlagos fejenkénti ár a megadott létszámra (nettó Ft), 0 főnél null. */
  perHeadAverage: number | null;
}

/**
 * A szint ára egy adott létszámra és csapatszámra. Egy csapat minimumdíja
 * az első `firstBandHeads` fő teljes sávdíja; efölött fejenkénti, az elsőn
 * felüli csapatokra pedig csapatonkénti díj kerül rá.
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
  const additionalTeams = Math.max(0, teams - 1);
  const price = ladder.tiers[tier];
  const baseFee = heads > 0 ? ladder.firstBandHeads * price.perHead : 0;
  const additionalTeamsFee = heads > 0 ? additionalTeams * price.additionalTeamFee : 0;
  const total = baseFee + overHeads * price.perHeadOver + additionalTeamsFee;
  return {
    firstHeads,
    overHeads,
    baseFee,
    additionalTeams,
    additionalTeamsFee,
    total,
    perHeadAverage: heads > 0 ? Math.round(total / heads) : null,
  };
}

/** A pilot-partneri fejenkénti ár: a szint fejenkénti ára a kedvezménnyel. */
export function pilotPerHead(ladder: PublicLadder, tier: QuoteTier): number {
  const full = ladder.tiers[tier].perHead;
  return Math.round((full * (100 - ladder.pilotDiscountPct)) / 100);
}

/** Egy csapat minimum projektára, legfelj a sávhatárig. */
export function ladderBaseFee(ladder: PublicLadder, tier: QuoteTier): number {
  return ladder.firstBandHeads * ladder.tiers[tier].perHead;
}

/** A pilotpartneri minimum projektár egy csapatra. */
export function pilotBaseFee(ladder: PublicLadder, tier: QuoteTier): number {
  return Math.round((ladderBaseFee(ladder, tier) * (100 - ladder.pilotDiscountPct)) / 100);
}

/**
 * A publikusan hirdethető legalacsonyabb belépő ár: a szintek közül a
 * legolcsóbb fejenkénti ár a sávon belül (a „-tól" a szintekre vonatkozik,
 * nem a létszámra). A csapat-oldal horgony-száma ebből jön.
 */
export function ladderEntryPerHead(ladder: PublicLadder): { tier: QuoteTier; perHead: number; baseFee: number } {
  const kep = ladder.tiers.kep.perHead;
  const prog = ladder.tiers.prog.perHead;
  const tier = kep <= prog ? "kep" : "prog";
  return { tier, perHead: ladder.tiers[tier].perHead, baseFee: ladderBaseFee(ladder, tier) };
}

/** A publikus létszám-csúszka határai — a kalkulátor és a JSON-LD is ezt használja. */
export const PUBLIC_HEADCOUNT_MIN = 5;
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
export function headcountBand(headcount: number): "5-8" | "9-12" | "13-20" | "21-40" | "40+" {
  if (headcount <= 8) return "5-8";
  if (headcount <= 12) return "9-12";
  if (headcount <= 20) return "13-20";
  if (headcount <= PUBLIC_HEADCOUNT_MAX) return "21-40";
  return "40+";
}

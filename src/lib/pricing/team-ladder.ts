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
      kep: { perHead: rate.tiers.kep.perHead, perHeadOver: rate.tiers.kep.perHeadOver },
      prog: { perHead: rate.tiers.prog.perHead, perHeadOver: rate.tiers.prog.perHeadOver },
    },
    firstBandHeads: rate.firstBandHeads,
    extraWorkshopDayFee: rate.extraWorkshopDayFee,
    pilotDiscountPct: rate.pilotDiscountPct,
    fx,
  };
}

export interface LadderPrice {
  /** Fők a teljes fejenkénti áron. */
  firstHeads: number;
  /** Fők a sáv feletti áron. */
  overHeads: number;
  /** A szint fejenkénti díja összesen (nettó Ft). */
  total: number;
  /** Átlagos fejenkénti ár a megadott létszámra (nettó Ft), 0 főnél null. */
  perHeadAverage: number | null;
}

/**
 * A szint ára egy adott létszámra. Marginális: az első `firstBandHeads` fő a
 * teljes, a többi a sáv feletti fejenkénti áron — így a teljes ár mindig
 * monoton nő a létszámmal, és a fejenkénti átlag csökken.
 */
export function ladderPrice(ladder: PublicLadder, tier: QuoteTier, headcount: number): LadderPrice {
  const heads = Math.max(0, Math.round(headcount));
  const firstHeads = Math.min(heads, ladder.firstBandHeads);
  const overHeads = Math.max(0, heads - ladder.firstBandHeads);
  const price = ladder.tiers[tier];
  const total = firstHeads * price.perHead + overHeads * price.perHeadOver;
  return {
    firstHeads,
    overHeads,
    total,
    perHeadAverage: heads > 0 ? Math.round(total / heads) : null,
  };
}

/** A pilot-partneri fejenkénti ár: a szint fejenkénti ára a kedvezménnyel. */
export function pilotPerHead(ladder: PublicLadder, tier: QuoteTier): number {
  const full = ladder.tiers[tier].perHead;
  return Math.round((full * (100 - ladder.pilotDiscountPct)) / 100);
}

/**
 * A publikusan hirdethető legalacsonyabb belépő ár: a szintek közül a
 * legolcsóbb fejenkénti ár a sávon belül (a „-tól" a szintekre vonatkozik,
 * nem a létszámra). A csapat-oldal horgony-száma ebből jön.
 */
export function ladderEntryPerHead(ladder: PublicLadder): { tier: QuoteTier; perHead: number } {
  const kep = ladder.tiers.kep.perHead;
  const prog = ladder.tiers.prog.perHead;
  return kep <= prog ? { tier: "kep", perHead: kep } : { tier: "prog", perHead: prog };
}

/** Nettó Ft, magyar ezres tagolással, pénznem-jel nélkül: „35 000". */
export function formatHuf(value: number): string {
  return new Intl.NumberFormat("hu-HU", { maximumFractionDigits: 0 }).format(Math.round(value));
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

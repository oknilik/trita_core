import {
  QUOTE_TIER_LABELS,
  type DiscountKind,
  type QuoteTier,
  type RateCard,
} from "@/lib/quote/rate-card";
import { derivePublicLadder, ladderPrice } from "@/lib/pricing/team-ladder";

// Ajánlat-számítás — tiszta függvény, hogy tesztelhető és átlátható legyen.
//
// A kimenet nem egyetlen ár, hanem HÁROM szám, ami az alkuhoz kell:
//   · nettó ajánlati ár (amit a vevő lát),
//   · becsült tanácsadói óra,
//   · effektív óradíj — EZEN dől el az alku. Ha a cél alá esik, a
//     kedvezmény nem üzleti döntés, hanem önkizsákmányolás.
//
// Az ár a publikus árlétrából jön (team-ladder.ts): szint × létszám, plusz
// a szint tartalmán felüli tételek (extra workshop-nap, extra mérési kör,
// havi kísérés, egyéb, kiszállás). Ugyanaz a szám, amit a vevő a
// /pricing oldalon lát — az ajánlat nem lehet más.

export interface QuoteInput {
  headcount: number;
  teams: number;
  tier: QuoteTier;
  /** További helyszíni workshop-napok a szint tartalmán felül. */
  extraWorkshopDays: number;
  travelDays: number;
  /** További utánkövető mérési körök a szint tartalmán felül. */
  extraWaves: number;
  /** Havi kísérés hónapjai (0 = nincs). */
  retainerMonths: number;
  otherFee: number;
  otherFeeLabel: string;
  discountPct: number;
  discountKind: DiscountKind | null;
  discountReason: string;
  vatRate: number;
}

export interface QuoteLine {
  key: string;
  label: string;
  amount: number;
  /** Igaz, ha a kedvezmény NEM vonatkozik rá (továbbhárított költség). */
  passThrough?: boolean;
}

export interface QuoteResult {
  lines: QuoteLine[];
  /** Kedvezményezhető rész (minden, ami nem továbbhárított). */
  discountableSubtotal: number;
  /** Továbbhárított tételek (kiszállás) — ezen nincs kedvezmény. */
  passThroughSubtotal: number;
  listTotal: number;
  discountAmount: number;
  netTotal: number;
  vatAmount: number;
  grossTotal: number;
  /** Egyszeri rész, retainer nélkül. */
  oneOffTotal: number;
  retainerTotal: number;
  estimatedHours: number;
  effectiveHourlyRate: number | null;
  /** A cél-óradíjhoz tartozó minimális nettó ár. */
  floorPrice: number;
  perHeadEffective: number | null;
  warnings: QuoteWarning[];
}

export type QuoteWarning =
  | "BELOW_TARGET_HOURLY"
  | "DISCOUNT_OVER_CAP"
  | "DISCOUNT_WITHOUT_REASON"
  | "NO_FOLLOW_UP";

/**
 * Becsült tanácsadói óra — a saját költség kalkulátora. A Csapatprogram az
 * online értelmezésen felül félnapos workshopot és utánkövető kiértékelést
 * is visz; a mérés-lépések száma NEM számít, mert a több magyarázat a
 * workshop-időben jelenik meg (ezért kerül a workshop a felső szintre).
 */
export function estimateHours(input: QuoteInput, rate: RateCard): number {
  const heads = Math.max(0, Math.round(input.headcount));
  const teams = Math.max(1, Math.round(input.teams));
  const h = rate.hours;
  const tierHours =
    input.tier === "prog"
      ? h.onlineDebrief + h.halfDayWorkshop + h.followUp
      : h.onlineDebrief;
  return (
    h.setup +
    h.perTeam * teams +
    h.perTenHeads * Math.ceil(heads / 10) +
    tierHours +
    h.perExtraWorkshopDay * Math.max(0, input.extraWorkshopDays) +
    h.perExtraWave * Math.max(0, input.extraWaves) +
    h.perRetainerMonth * Math.max(0, input.retainerMonths) +
    h.perTravelDay * Math.max(0, input.travelDays)
  );
}

export function calculateQuote(input: QuoteInput, rate: RateCard): QuoteResult {
  const heads = Math.max(0, Math.round(input.headcount));
  const ladder = derivePublicLadder(rate);
  const price = ladderPrice(ladder, input.tier, heads);
  const tierRate = rate.tiers[input.tier];
  const tierLabel = QUOTE_TIER_LABELS[input.tier];

  const extraWorkshop = rate.extraWorkshopDayFee * Math.max(0, Math.round(input.extraWorkshopDays));
  // Az extra mérési kör a szint fejenkénti díjának hányada: a setup és a
  // csapat megismerése már megvan, a platformon az ismételt mérés olcsó.
  const waveUnit = Math.round((price.total * rate.extraWaveRatePct) / 100);
  const extraWaves = waveUnit * Math.max(0, Math.round(input.extraWaves));
  const retainer = rate.retainerMonthlyFee * Math.max(0, Math.round(input.retainerMonths));
  const otherFee = Math.max(0, Math.round(input.otherFee));
  const travel = rate.travelDayFee * Math.max(0, Math.round(input.travelDays));

  const lines: QuoteLine[] = [
    {
      key: "tier",
      label: `${tierLabel} · ${price.firstHeads} fő × ${tierRate.perHead.toLocaleString("hu-HU")} Ft`,
      amount: price.firstHeads * tierRate.perHead,
    },
    {
      key: "tierOver",
      label: `${ladder.firstBandHeads} fő felett · ${price.overHeads} fő × ${tierRate.perHeadOver.toLocaleString("hu-HU")} Ft`,
      amount: price.overHeads * tierRate.perHeadOver,
    },
    { key: "extraWorkshop", label: `További workshop-nap (${input.extraWorkshopDays})`, amount: extraWorkshop },
    { key: "extraWaves", label: `További mérési kör (${input.extraWaves})`, amount: extraWaves },
    { key: "retainer", label: `Havi kísérés (${input.retainerMonths} hó)`, amount: retainer },
    { key: "other", label: input.otherFeeLabel.trim() || "Egyéb díj", amount: otherFee },
    { key: "travel", label: `Kiszállás (${input.travelDays} nap)`, amount: travel, passThrough: true },
  ].filter((line) => line.amount > 0);

  const discountableSubtotal = lines
    .filter((line) => !line.passThrough)
    .reduce((sum, line) => sum + line.amount, 0);
  const passThroughSubtotal = lines
    .filter((line) => line.passThrough)
    .reduce((sum, line) => sum + line.amount, 0);

  const listTotal = lines.reduce((sum, line) => sum + line.amount, 0);
  const discountPct = Math.min(100, Math.max(0, input.discountPct));
  const discountAmount = Math.round((discountableSubtotal * discountPct) / 100);
  const netTotal = listTotal - discountAmount;
  const vatRate = Math.min(100, Math.max(0, Math.round(input.vatRate)));
  const vatAmount = Math.round((netTotal * vatRate) / 100);
  const grossTotal = netTotal + vatAmount;

  const estimatedHours = estimateHours(input, rate);

  // A kiszállás továbbhárított költség, nem tanácsadói bevétel: az
  // óradíjból kivesszük, különben szépítené a képet.
  const revenueForHourly = netTotal - passThroughSubtotal;
  const effectiveHourlyRate =
    estimatedHours > 0 ? Math.round(revenueForHourly / estimatedHours) : null;

  const warnings: QuoteWarning[] = [];
  if (effectiveHourlyRate != null && effectiveHourlyRate < rate.targetHourlyRate) {
    warnings.push("BELOW_TARGET_HOURLY");
  }
  if (discountPct > rate.maxDiscountPct) warnings.push("DISCOUNT_OVER_CAP");
  if (discountPct > 0 && input.discountReason.trim().length === 0) {
    warnings.push("DISCOUNT_WITHOUT_REASON");
  }
  // A Csapatképben nincs visszamérés; ha extra kört és kísérést sem kér,
  // egyszeri munka lesz belőle — ebből nem lesz üzlet.
  if (input.tier === "kep" && input.extraWaves === 0 && input.retainerMonths === 0) {
    warnings.push("NO_FOLLOW_UP");
  }

  return {
    lines,
    discountableSubtotal,
    passThroughSubtotal,
    listTotal,
    discountAmount,
    netTotal,
    vatAmount,
    grossTotal,
    oneOffTotal: netTotal - retainer,
    retainerTotal: retainer,
    estimatedHours,
    effectiveHourlyRate,
    floorPrice: Math.round(estimatedHours * rate.targetHourlyRate) + passThroughSubtotal,
    perHeadEffective: heads > 0 ? Math.round((netTotal - retainer) / heads) : null,
    warnings,
  };
}

/** Üres bemenet – a felület ebből indul. */
export function emptyQuoteInput(): QuoteInput {
  return {
    headcount: 10,
    teams: 1,
    tier: "prog",
    extraWorkshopDays: 0,
    travelDays: 0,
    extraWaves: 0,
    retainerMonths: 0,
    otherFee: 0,
    otherFeeLabel: "Egyéb díj",
    discountPct: 0,
    discountKind: null,
    discountReason: "",
    vatRate: 27,
  };
}

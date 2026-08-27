import {
  QUOTE_STEPS,
  type DiscountKind,
  type QuoteStep,
  type RateCard,
} from "@/lib/quote/rate-card";

// Ajánlat-számítás — tiszta függvény, hogy tesztelhető és átlátható legyen.
//
// A kimenet nem egyetlen ár, hanem HÁROM szám, ami az alkuhoz kell:
//   · nettó ajánlati ár (amit a vevő lát),
//   · becsült tanácsadói óra,
//   · effektív óradíj — EZEN dől el az alku. Ha a cél alá esik, a
//     kedvezmény nem üzleti döntés, hanem önkizsákmányolás.

export interface QuoteInput {
  headcount: number;
  teams: number;
  steps: QuoteStep[];
  workshopDays: number;
  travelDays: number;
  /** Ismételt mérési hullámok száma a baseline UTÁN (0 = nincs utánkövetés). */
  waves: number;
  /** Havi kísérés hónapjai (0 = nincs). */
  retainerMonths: number;
  discountPct: number;
  discountKind: DiscountKind | null;
  discountReason: string;
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
  /** Kedvezményezhető rész (program + mérés + workshop + utánkövetés). */
  discountableSubtotal: number;
  /** Továbbhárított tételek (kiszállás) — ezen nincs kedvezmény. */
  passThroughSubtotal: number;
  listTotal: number;
  discountAmount: number;
  netTotal: number;
  /** Egyszeri rész (baseline + hullámok), retainer nélkül. */
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
 * Fejenkénti mérési díj MARGINÁLIS sávokkal (mint az adósávok): az első N
 * fő drágább, a következők olcsóbbak.
 *
 * Miért nem sima „a létszám sávja szerint mindenki ugyanannyi": ott a
 * sávhatáron szakadás keletkezne — 26 fő olcsóbb lenne, mint 25. Egy ilyen
 * ártábla az első alkunál kiderül, és hiteltelenít.
 */
export function perHeadTotal(headcount: number, rate: RateCard): number {
  if (headcount <= 0) return 0;
  let remaining = headcount;
  let covered = 0;
  let total = 0;

  for (const band of rate.headBands) {
    if (remaining <= 0) break;
    const bandCapacity = band.upTo == null ? remaining : Math.max(0, band.upTo - covered);
    const take = Math.min(remaining, bandCapacity);
    total += take * band.perHead;
    remaining -= take;
    covered += take;
  }

  // Ha az utolsó sáv zárt volt és maradt fő, az utolsó sáv díjával megyünk
  // tovább — így a függvény sosem ad kevesebbet nagyobb létszámra.
  if (remaining > 0) {
    total += remaining * rate.headBands[rate.headBands.length - 1].perHead;
  }
  return total;
}

function stepsTotal(input: QuoteInput, rate: RateCard): { perHead: number; fixed: number } {
  let perHead = 0;
  let fixed = 0;
  for (const step of input.steps) {
    const stepRate = rate.stepRates[step];
    if (!stepRate) continue;
    perHead += stepRate.perHead * input.headcount;
    fixed += stepRate.fixed;
  }
  return { perHead, fixed };
}

export function calculateQuote(input: QuoteInput, rate: RateCard): QuoteResult {
  const heads = Math.max(0, Math.round(input.headcount));
  const teams = Math.max(1, Math.round(input.teams));
  const measurement = perHeadTotal(heads, rate);
  const steps = stepsTotal({ ...input, headcount: heads }, rate);

  const workshop = rate.workshopDayFee * input.workshopDays;
  const travel = rate.travelDayFee * input.travelDays;

  // Egy ismételt hullám a mérési díj csökkentett hányada: a setup, a
  // csapat megismerése és a módszertani döntések már megvannak.
  const waveUnit =
    Math.round(((measurement + steps.perHead) * rate.waveRatePct) / 100) + rate.waveFixedFee;
  const waves = waveUnit * Math.max(0, Math.round(input.waves));
  const retainer = rate.retainerMonthlyFee * Math.max(0, Math.round(input.retainerMonths));

  const lines: QuoteLine[] = [
    { key: "base", label: "Programdíj", amount: rate.baseFee },
    { key: "measurement", label: `Mérési díj (${heads} fő)`, amount: measurement },
    { key: "steps", label: "Mérés-lépések felára", amount: steps.perHead + steps.fixed },
    { key: "workshop", label: `Workshop (${input.workshopDays} nap)`, amount: workshop },
    { key: "waves", label: `Utánkövetés (${input.waves} hullám)`, amount: waves },
    { key: "retainer", label: `Havi kísérés (${input.retainerMonths} hó)`, amount: retainer },
    { key: "travel", label: `Kiszállás (${input.travelDays} nap)`, amount: travel, passThrough: true },
  ].filter((line) => line.amount > 0);

  const discountableSubtotal = lines
    .filter((line) => !line.passThrough)
    .reduce((sum, line) => sum + line.amount, 0);
  const passThroughSubtotal = lines
    .filter((line) => line.passThrough)
    .reduce((sum, line) => sum + line.amount, 0);

  const listTotal = discountableSubtotal + passThroughSubtotal;
  const discountPct = Math.min(100, Math.max(0, input.discountPct));
  const discountAmount = Math.round((discountableSubtotal * discountPct) / 100);
  const netTotal = listTotal - discountAmount;

  const estimatedHours =
    rate.hours.setup +
    rate.hours.perTeam * teams +
    rate.hours.perTenHeads * Math.ceil(heads / 10) +
    rate.hours.perWorkshopDay * input.workshopDays +
    rate.hours.perWave * Math.max(0, input.waves) +
    rate.hours.perRetainerMonth * Math.max(0, input.retainerMonths) +
    rate.hours.perTravelDay * input.travelDays;

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
  if (input.waves === 0 && input.retainerMonths === 0) warnings.push("NO_FOLLOW_UP");

  return {
    lines,
    discountableSubtotal,
    passThroughSubtotal,
    listTotal,
    discountAmount,
    netTotal,
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
    headcount: 12,
    teams: 1,
    steps: [...QUOTE_STEPS].filter((step) => step !== "TRUST_360"),
    workshopDays: 1,
    travelDays: 0,
    waves: 1,
    retainerMonths: 0,
    discountPct: 0,
    discountKind: null,
    discountReason: "",
  };
}

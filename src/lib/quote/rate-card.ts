import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────
// Ajánlat-kalkulátor díjtételei — BELSŐ eszköz.
//
// A platform nem publikál listaárat („egyedi ajánlat az első beszélgetés
// után"), tehát ezek a számok SOHA nem kerülnek ki felhasználói felületre.
// Az ajánlat-adás védelmére szolgálnak: mennyi az effektív óradíj, hol a
// padló, mennyibe kerül egy kedvezmény.
//
// Az árazás három tagból áll:
//   1. PROGRAMDÍJ — fix. Az a tanácsadói munka, ami nem skálázódik a
//      létszámmal (kampány-összeállítás, validálás, riport, workshop).
//      Egy 6 fős csapat is teljes workshopot kér: tiszta fejenkénti
//      árazásnál a kis csapatokon veszítenénk.
//   2. FEJENKÉNTI MÉRÉSI DÍJ — sávosan, MARGINÁLISAN (mint az adósávok):
//      az első N fő drágább, a következők olcsóbbak. Így nincs szakadás a
//      sávhatáron, és a teljes ár mindig monoton nő a létszámmal.
//   3. UTÁNKÖVETÉS — külön termék, nem kedvezmény: ismételt mérési
//      hullámok csökkenő fejenkénti díjjal, plusz opcionális havi kísérés.
//
// FIGYELEM: az alábbi számok PLACEHOLDER-ek. Nincs mögöttük valós
// költségadat — a felületen átállíthatók és elmenthetők.
// ─────────────────────────────────────────────────────────────────────

/** Mérés-lépések a kampány-katalógusból (campaign-steps-core.ts). */
export const QUOTE_STEPS = [
  "OBSERVER_360",
  "TEAM_ROLE",
  "TEAM_ROLE_360",
  "TRUST_360",
  "PSYCH_SAFETY",
] as const;
export type QuoteStep = (typeof QUOTE_STEPS)[number];

export const QUOTE_STEP_LABELS: Record<QuoteStep, string> = {
  OBSERVER_360: "Observer 360°",
  TEAM_ROLE: "Csapatszerep (self)",
  TEAM_ROLE_360: "Csapatszerep 360°",
  TRUST_360: "Bizalmi kör",
  PSYCH_SAFETY: "Pszichológiai biztonság",
};

/** Nevesített, lejáró kedvezmények — ad-hoc alku helyett. */
export const DISCOUNT_KINDS = ["pilot", "multi_team", "prepaid_waves", "other"] as const;
export type DiscountKind = (typeof DISCOUNT_KINDS)[number];

export const DISCOUNT_LABELS: Record<DiscountKind, string> = {
  pilot: "Pilot / alapító partner",
  multi_team: "Több csapat egyszerre",
  prepaid_waves: "Előre megrendelt utánkövetés",
  other: "Egyéb (indoklás kötelező)",
};

const bandSchema = z.object({
  /** Eddig a létszámig érvényes ez a sáv (az utolsó sáv: null = felfelé nyitott). */
  upTo: z.number().int().positive().nullable(),
  /** Fejenkénti díj EBBEN a sávban (Ft). */
  perHead: z.number().int().min(0),
});

export const rateCardSchema = z.object({
  /** Fix programdíj — ez a padló (Ft). */
  baseFee: z.number().int().min(0),
  /** Marginális létszám-sávok. Növekvő `upTo`, az utolsó nyitott. */
  headBands: z.array(bandSchema).min(1),
  /** Mérés-lépésenkénti felár: fejenként és fixen. */
  stepRates: z.record(
    z.enum(QUOTE_STEPS),
    z.object({ perHead: z.number().int().min(0), fixed: z.number().int().min(0) }),
  ),
  /** Workshop-nap díja (Ft/nap). */
  workshopDayFee: z.number().int().min(0),
  /** Kiszállás (Ft/nap) — továbbhárított költség, kedvezmény nem vonatkozik rá. */
  travelDayFee: z.number().int().min(0),
  /** Ismételt hullám a mérési díj hány százalékáért (a setup már megvan). */
  waveRatePct: z.number().int().min(0).max(100),
  /** Hullámonkénti fix díj (mini-riport, egyeztetés). */
  waveFixedFee: z.number().int().min(0),
  /** Havi kísérés díja (Ft/hó). */
  retainerMonthlyFee: z.number().int().min(0),
  /** Óra-becslés a fedezet-számításhoz. */
  hours: z.object({
    setup: z.number().min(0),
    perTeam: z.number().min(0),
    perTenHeads: z.number().min(0),
    perWorkshopDay: z.number().min(0),
    perWave: z.number().min(0),
    perRetainerMonth: z.number().min(0),
    perTravelDay: z.number().min(0),
  }),
  /** Cél-óradíj: ez alatt a kalkulátor figyelmeztet (Ft/óra). */
  targetHourlyRate: z.number().int().min(0),
  /** Kedvezmény felső határa (%) — efölött külön döntés kell. */
  maxDiscountPct: z.number().int().min(0).max(100),
});

export type RateCard = z.infer<typeof rateCardSchema>;

/**
 * PLACEHOLDER díjtételek. Nagyságrendileg egy 10–25 fős csapatprogramra
 * hangolva, de valós költségadat NINCS mögöttük — a felületen állítandók.
 */
export const DEFAULT_RATE_CARD: RateCard = {
  baseFee: 450_000,
  headBands: [
    { upTo: 10, perHead: 12_000 },
    { upTo: 25, perHead: 9_000 },
    { upTo: 50, perHead: 7_000 },
    { upTo: null, perHead: 5_500 },
  ],
  stepRates: {
    OBSERVER_360: { perHead: 4_000, fixed: 40_000 },
    TEAM_ROLE: { perHead: 1_500, fixed: 20_000 },
    TEAM_ROLE_360: { perHead: 3_000, fixed: 35_000 },
    TRUST_360: { perHead: 2_500, fixed: 30_000 },
    PSYCH_SAFETY: { perHead: 1_500, fixed: 25_000 },
  },
  workshopDayFee: 320_000,
  travelDayFee: 60_000,
  waveRatePct: 60,
  waveFixedFee: 90_000,
  retainerMonthlyFee: 120_000,
  hours: {
    setup: 6,
    perTeam: 3,
    perTenHeads: 2,
    perWorkshopDay: 10,
    perWave: 6,
    perRetainerMonth: 3,
    perTravelDay: 4,
  },
  targetHourlyRate: 25_000,
  maxDiscountPct: 30,
};

export const RATE_CARD_KEY = "default";

/**
 * A kalkulátor-bemenet (QuoteInput, ld. calculate.ts) 1:1 zod-tükre —
 * a CRM Quote-perzisztencia íráskor ezzel validál, az összegeket pedig
 * SOHA nem a klienstől veszi: a szerver újraszámol (calculateQuote).
 */
export const quoteInputSchema = z.object({
  headcount: z.number().int().min(0).max(10_000),
  teams: z.number().int().min(1).max(500),
  steps: z
    .array(z.enum(QUOTE_STEPS))
    .refine((steps) => new Set(steps).size === steps.length, {
      message: "duplicate steps",
    }),
  workshopDays: z.number().int().min(0).max(100),
  travelDays: z.number().int().min(0).max(100),
  waves: z.number().int().min(0).max(50),
  retainerMonths: z.number().int().min(0).max(60),
  discountPct: z.number().int().min(0).max(100),
  discountKind: z.enum(DISCOUNT_KINDS).nullable(),
  discountReason: z.string().max(1000),
});

export type QuoteInputParsed = z.infer<typeof quoteInputSchema>;

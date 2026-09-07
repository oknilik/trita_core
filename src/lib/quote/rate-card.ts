import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────
// Díjkártya — a publikus árlétra ÉS az ajánlat-kalkulátor közös forrása.
//
// 2026-09-07-től a platform PUBLIKÁL fejenkénti árat. A modell két
// szintből áll, mindkettő fejenkénti, minden mérést tartalmaz:
//
//   · CSAPATKÉP     — mérés, validált csapatriport, vezetői visszajelzés,
//                     90 perces online közös értelmezés.
//   · CSAPATPROGRAM — a Csapatkép + félnapos értelmező workshop + egy
//                     utánkövető mérés fél év múlva.
//
// Fejenkénti ár az első `firstBandHeads` főre, felette olcsóbb marginális
// ár (a fix munka már megvan). A mérés-lépések (observer, csapatszerep,
// bizalmi kör, pszichológiai biztonság) NEM növelik az árat: a több mérés
// több magyarázatot igényel, ami a workshop-időben jön vissza.
//
// A kártya EGY helyen él (admin: /admin/quote, „Díjtételek"), a DB-ben
// mentve; ebből olvas a /how-we-work árblokk, a főoldal csapat-blokkja, a
// /pilot ténysáv és a Service JSON-LD — ld. src/lib/pricing/. A belső
// tételek (óra-becslés, cél-óradíj, kedvezmény-keret) SOHA nem kerülnek
// publikus felületre; a publikus részhalmazt a `derivePublicLadder` vágja
// ki.
//
// Kalibráció: 2026-09, magyar kkv-piac (DISC-riport ~30 e Ft/fő, tréneri
// nap 150–330 e Ft, 10 fős diagnosztika + 1 nap 500–900 e Ft) —
// ld. docs/product/pricing-ladder-2026-09.md.
// ─────────────────────────────────────────────────────────────────────

export const QUOTE_TIERS = ["kep", "prog"] as const;
export type QuoteTier = (typeof QUOTE_TIERS)[number];

/** Belső (admin) címkék — a publikus felület i18n-kulcsokból dolgozik. */
export const QUOTE_TIER_LABELS: Record<QuoteTier, string> = {
  kep: "Csapatkép",
  prog: "Csapatprogram",
};

/**
 * Mi van benne szintenként — az admin ajánlat-szövegbe és a PDF-be megy,
 * ezért magyar, és tartalmilag a publikus i18n-kulcsokkal (pricing.tier*)
 * azonos. Ha az egyiket módosítod, a másikat is.
 */
export const QUOTE_TIER_INCLUDES: Record<QuoteTier, readonly string[]> = {
  kep: [
    "Személyiségfelmérés hat dimenzió mentén, mindenkinek saját riporttal",
    "Csapatszerep-kérdőív, bizalmi kör, pszichológiai biztonság, observer-visszajelzés",
    "Tanácsadó által ellenőrzött csapatkép és vezetői visszajelző beszélgetés",
    "90 perces online közös értelmezés a csapattal",
  ],
  prog: [
    "Minden, ami a Csapatképben",
    "Félnapos értelmező workshop a csapattal, személyesen",
    "Utánkövető mérés fél év múlva: mi változott, mi nem",
  ],
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

const tierRateSchema = z.object({
  /** Fejenkénti ár az első `firstBandHeads` főre (Ft, nettó). */
  perHead: z.number().int().min(0),
  /** Fejenkénti ár a sáv feletti további főkre (Ft, nettó). */
  perHeadOver: z.number().int().min(0),
});

export const rateCardSchema = z.object({
  /** Séma-verzió: a DB-ben mentett régi (programdíjas) kártya ettől különül el. */
  version: z.literal(2),
  tiers: z.object({ kep: tierRateSchema, prog: tierRateSchema }),
  /** Eddig a létszámig érvényes a teljes fejenkénti ár (fő). */
  firstBandHeads: z.number().int().min(1).max(200),
  /** További helyszíni, egész napos workshop (Ft/nap). */
  extraWorkshopDayFee: z.number().int().min(0),
  /** További utánkövető mérési kör a fejenkénti díj hány százalékáért. */
  extraWaveRatePct: z.number().int().min(0).max(100),
  /** Havi kísérés díja (Ft/hó). */
  retainerMonthlyFee: z.number().int().min(0),
  /** Kiszállás (Ft/nap) — továbbhárított költség, kedvezmény nem vonatkozik rá. */
  travelDayFee: z.number().int().min(0),
  /** A /pilot oldalon publikált partneri kedvezmény (%). */
  pilotDiscountPct: z.number().int().min(0).max(100),
  /** Óra-becslés a fedezet-számításhoz (a saját költség kalkulátora). */
  hours: z.object({
    setup: z.number().min(0),
    perTeam: z.number().min(0),
    perTenHeads: z.number().min(0),
    /** Csapatkép: online közös értelmezés, előkészítéssel. */
    onlineDebrief: z.number().min(0),
    /** Csapatprogram: félnapos workshop, előkészítéssel. */
    halfDayWorkshop: z.number().min(0),
    /** Csapatprogram: az utánkövető mérés kiértékelése. */
    followUp: z.number().min(0),
    perExtraWorkshopDay: z.number().min(0),
    perExtraWave: z.number().min(0),
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
 * Alapértelmezett díjkártya. Az admin felületen átállítható és menthető;
 * mentett kártya hiányában (vagy sérült mentés esetén) ez él.
 */
export const DEFAULT_RATE_CARD: RateCard = {
  version: 2,
  tiers: {
    kep: { perHead: 35_000, perHeadOver: 20_000 },
    prog: { perHead: 50_000, perHeadOver: 20_000 },
  },
  firstBandHeads: 10,
  extraWorkshopDayFee: 180_000,
  extraWaveRatePct: 35,
  retainerMonthlyFee: 120_000,
  travelDayFee: 60_000,
  pilotDiscountPct: 50,
  hours: {
    setup: 4,
    perTeam: 2,
    perTenHeads: 2,
    onlineDebrief: 2,
    halfDayWorkshop: 5,
    followUp: 3,
    perExtraWorkshopDay: 10,
    perExtraWave: 3,
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
  tier: z.enum(QUOTE_TIERS),
  /** További helyszíni workshop-napok a szint tartalmán felül. */
  extraWorkshopDays: z.number().int().min(0).max(100),
  travelDays: z.number().int().min(0).max(100),
  /** További utánkövető mérési körök a szint tartalmán felül. */
  extraWaves: z.number().int().min(0).max(50),
  retainerMonths: z.number().int().min(0).max(60),
  otherFee: z.number().int().min(0).max(100_000_000).default(0),
  otherFeeLabel: z.string().max(120).default("Egyéb díj"),
  discountPct: z.number().int().min(0).max(100),
  discountKind: z.enum(DISCOUNT_KINDS).nullable(),
  discountReason: z.string().max(1000),
  vatRate: z.number().int().min(0).max(100).default(27),
});

export type QuoteInputParsed = z.infer<typeof quoteInputSchema>;

// ─────────────────────────────────────────────────────────────────────
// Örökség: a 2026-09-07 előtti (programdíj + lépés-felárak) bemenet.
// A CRM-ben mentett piszkozatok és a másolat-alapok ezzel a formával
// vannak a DB-ben; a `readQuoteInput` átfordítja, hogy a ?from= betöltés
// és a duplikálás ne haljon el rajtuk. A tartalmi megfeleltetés:
// workshop VAGY utánkövető hullám → Csapatprogram, egyébként Csapatkép.
// ─────────────────────────────────────────────────────────────────────

const legacyQuoteInputSchema = z
  .object({
    headcount: z.number().int().min(0),
    teams: z.number().int().min(1),
    steps: z.array(z.string()),
    workshopDays: z.number().min(0),
    travelDays: z.number().int().min(0),
    waves: z.number().int().min(0),
    retainerMonths: z.number().int().min(0),
    otherFee: z.number().int().min(0).default(0),
    otherFeeLabel: z.string().max(120).default("Egyéb díj"),
    discountPct: z.number().int().min(0).max(100),
    discountKind: z.enum(DISCOUNT_KINDS).nullable(),
    discountReason: z.string().max(1000),
    vatRate: z.number().int().min(0).max(100).default(27),
  })
  .passthrough();

/**
 * Bemenet olvasása a DB-ből: az új séma, vagy az örökség-forma átfordítva.
 * `null`, ha egyik sem — a hívó dönt (validációs hiba vagy üres űrlap).
 */
export function readQuoteInput(raw: unknown): QuoteInputParsed | null {
  const current = quoteInputSchema.safeParse(raw);
  if (current.success) return current.data;

  const legacy = legacyQuoteInputSchema.safeParse(raw);
  if (!legacy.success) return null;
  const l = legacy.data;
  const isProgram = l.workshopDays > 0 || l.waves > 0;
  return {
    headcount: l.headcount,
    teams: l.teams,
    tier: isProgram ? "prog" : "kep",
    // A félnapos workshop a Csapatprogramban van; az afölötti egész napok
    // extra napok. Tört nap felfelé kerekítve — ajánlaton nem lehet 0,5 nap.
    extraWorkshopDays: isProgram ? Math.max(0, Math.ceil(l.workshopDays - 0.5)) : 0,
    travelDays: l.travelDays,
    extraWaves: isProgram ? Math.max(0, l.waves - 1) : 0,
    retainerMonths: l.retainerMonths,
    otherFee: l.otherFee,
    otherFeeLabel: l.otherFeeLabel,
    discountPct: l.discountPct,
    discountKind: l.discountKind,
    discountReason: l.discountReason,
    vatRate: l.vatRate,
  };
}

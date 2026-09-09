import { z } from "zod";
import {
  quoteInputSchema,
  rateCardSchema,
  readLegacyQuoteScope,
  readQuoteInput,
  type LegacyQuoteScope,
  type RateCard,
} from "@/lib/quote/rate-card";

export const COMMERCIAL_DOCUMENT_KINDS = ["PROPOSAL", "ORDER_FORM"] as const;
export type CommercialDocumentKind = (typeof COMMERCIAL_DOCUMENT_KINDS)[number];

const optionalText = (max: number) => z.string().trim().max(max).default("");

export const commercialDocumentFormSchema = z.object({
  companyName: z.string().trim().min(1).max(200),
  registeredSeat: optionalText(300),
  registrationNumber: optionalText(100),
  taxNumber: optionalText(100),
  representativeName: z.string().trim().min(1).max(150),
  representativeTitle: optionalText(120),
  contactEmail: z.string().trim().email().max(254),
  billingName: optionalText(200),
  billingAddress: optionalText(300),
  billingTaxNumber: optionalText(100),
  billingEmail: z.union([z.literal(""), z.string().trim().email().max(254)]).default(""),
  poNumber: optionalText(120),
  acceptanceMethod: z.enum(["paper", "electronic", "email"]).default("email"),
  teams: z.array(z.object({
    name: z.string().trim().min(1).max(150),
    headcount: z.number().int().min(1).max(10_000),
    leader: optionalText(150),
    waveKind: z.enum(["baseline", "remeasurement"]).default("baseline"),
  })).min(1).max(100),
  serviceStart: z.string().date(),
  serviceEnd: z.string().date(),
  platformAccessEnd: z.string().date(),
  workshopMode: z.enum(["in_person", "online", "hybrid"]).default("in_person"),
  workshopHoursPerDay: z.number().min(1).max(16).default(8),
  kickoffMinutes: z.number().int().min(0).max(480).default(60),
  leaderDebriefMinutes: z.number().int().min(0).max(480).default(90),
  closingMinutes: z.number().int().min(0).max(480).default(60),
  consultingSessions: z.number().int().min(0).max(100).default(0),
  consultingMinutes: z.number().int().min(0).max(480).default(60),
  paymentEvent: z.string().trim().min(1).max(300).default("A szerződés létrejötte"),
  paymentDueDays: z.number().int().min(1).max(120).default(15),
  referencePermission: z.enum(["named", "anonymous", "none"]).default("none"),
  researchPermission: z.boolean().default(false),
  specialTerms: z.string().trim().max(5000).default("Nincs eltérés."),
  providerPhone: optionalText(50),
});

export type CommercialDocumentForm = z.infer<typeof commercialDocumentFormSchema>;

const quoteResultSnapshotSchema = z.object({
  lines: z.array(z.object({
    key: z.string(),
    label: z.string(),
    amount: z.number(),
    passThrough: z.boolean().optional(),
  })),
  listTotal: z.number(),
  discountableSubtotal: z.number(),
  passThroughSubtotal: z.number(),
  discountAmount: z.number(),
  netTotal: z.number(),
  vatAmount: z.number(),
  grossTotal: z.number(),
  oneOffTotal: z.number(),
  retainerTotal: z.number(),
  estimatedHours: z.number(),
  effectiveHourlyRate: z.number().nullable(),
  floorPrice: z.number(),
  perHeadEffective: z.number().nullable(),
  warnings: z.array(z.string()),
});

/**
 * A pillanatkép séma-verziója. 1: a 2026-09-07 előtti, programdíjas
 * kalkuláció (mérés-lépések + workshop-napok). 2: a fejenkénti szintek.
 * A KIADOTT dokumentum sosem íródik újra: az olvasás fordít, nem a tárolt
 * adat változik.
 */
export const CURRENT_DOCUMENT_SCHEMA_VERSION = 2;

function snapshotShape<TVersion extends z.ZodTypeAny, TInput extends z.ZodTypeAny, TRate extends z.ZodTypeAny>(
  schemaVersion: TVersion,
  input: TInput,
  rateCard: TRate,
) {
  return z.object({
    schemaVersion,
    kind: z.enum(COMMERCIAL_DOCUMENT_KINDS),
    documentNumber: z.string(),
    version: z.number().int().positive(),
    generatedAt: z.string().datetime(),
    quote: z.object({
      id: z.string(),
      label: z.string(),
      title: z.string().nullable(),
      status: z.string(),
      createdAt: z.string().datetime(),
      validUntil: z.string().datetime().nullable(),
      input,
      result: quoteResultSnapshotSchema,
      rateCard,
    }),
    customer: commercialDocumentFormSchema,
    legal: z.object({
      b2bTermsVersion: z.string(),
      dpaVersion: z.string(),
      privacyNoticeVersion: z.string(),
    }),
  });
}

/** ÍRÁS: új dokumentum mindig a mai alakban készül. */
export const commercialDocumentSnapshotSchema = snapshotShape(
  z.literal(CURRENT_DOCUMENT_SCHEMA_VERSION),
  quoteInputSchema,
  rateCardSchema,
);

/**
 * OLVASÁS: a régi dokumentumok is megnyithatók. A bemenetet és a
 * díjkártyát nem itt validáljuk (verziónként más az alakjuk) — az
 * `readCommercialDocumentSnapshot` fordítja át őket.
 */
const storedSnapshotSchema = snapshotShape(
  z.number().int().positive(),
  z.unknown(),
  z.unknown(),
);

type WrittenSnapshot = z.infer<typeof commercialDocumentSnapshotSchema>;

export type CommercialDocumentSnapshot = Omit<WrittenSnapshot, "schemaVersion" | "quote"> & {
  schemaVersion: number;
  quote: Omit<WrittenSnapshot["quote"], "rateCard"> & {
    /** A régi dokumentumoknál nincs mai alakú díjkártya — nem is olvassuk. */
    rateCard: RateCard | null;
    /** Csak régi dokumentumnál: az eredeti tételek, ahogy kiküldtük. */
    legacyScope?: LegacyQuoteScope;
  };
};

/**
 * Mentett pillanatkép olvasása verziótól függetlenül.
 *
 * A dokumentum KIADOTT: az árat (`result`) érintetlenül adjuk vissza, sosem
 * számoljuk újra. A régi bemenetet a mai alakra fordítjuk (hogy a felület
 * típusosan dolgozhasson vele), az EREDETI tételeket pedig a `legacyScope`
 * viszi tovább, hogy a PDF ugyanazt mutassa, mint kiküldéskor.
 */
export function readCommercialDocumentSnapshot(raw: unknown): CommercialDocumentSnapshot | null {
  const stored = storedSnapshotSchema.safeParse(raw);
  if (!stored.success) return null;
  const input = readQuoteInput(stored.data.quote.input);
  if (!input) return null;
  const rateCard = rateCardSchema.safeParse(stored.data.quote.rateCard);
  const legacyScope = readLegacyQuoteScope(stored.data.quote.input);
  return {
    ...stored.data,
    quote: {
      ...stored.data.quote,
      input,
      rateCard: rateCard.success ? rateCard.data : null,
      ...(legacyScope ? { legacyScope } : {}),
    },
  };
}

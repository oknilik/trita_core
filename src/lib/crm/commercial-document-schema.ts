import { z } from "zod";
import { quoteInputSchema, rateCardSchema } from "@/lib/quote/rate-card";

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

export const commercialDocumentSnapshotSchema = z.object({
  schemaVersion: z.literal(1),
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
    input: quoteInputSchema,
    result: quoteResultSnapshotSchema,
    rateCard: rateCardSchema,
  }),
  customer: commercialDocumentFormSchema,
  legal: z.object({
    b2bTermsVersion: z.string(),
    dpaVersion: z.string(),
    privacyNoticeVersion: z.string(),
  }),
});

export type CommercialDocumentSnapshot = z.infer<typeof commercialDocumentSnapshotSchema>;

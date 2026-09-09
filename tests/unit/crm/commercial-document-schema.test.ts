import test from "node:test";
import assert from "node:assert/strict";
import {
  CURRENT_DOCUMENT_SCHEMA_VERSION,
  commercialDocumentFormSchema,
  commercialDocumentSnapshotSchema,
  readCommercialDocumentSnapshot,
} from "@/lib/crm/commercial-document-schema";
import { calculateQuote, emptyQuoteInput } from "@/lib/quote/calculate";
import { DEFAULT_RATE_CARD } from "@/lib/quote/rate-card";

const form = commercialDocumentFormSchema.parse({
  companyName: "Példa Szervezet",
  representativeName: "Teszt Kapcsolattartó",
  contactEmail: "kapcsolat@example.invalid",
  teams: [{ name: "Vezetőség", headcount: 10 }],
  serviceStart: "2026-09-15",
  serviceEnd: "2026-12-15",
  platformAccessEnd: "2027-01-15",
});

test("a dokumentuműrlap biztonságos alapértékeket ad", () => {
  assert.equal(form.acceptanceMethod, "email");
  assert.equal(form.referencePermission, "none");
  assert.equal(form.researchPermission, false);
  assert.equal(form.paymentDueDays, 15);
});

test("hibás e-mailt és üres csapatlistát elutasít", () => {
  assert.equal(
    commercialDocumentFormSchema.safeParse({
      ...form,
      contactEmail: "nem-email",
    }).success,
    false,
  );
  assert.equal(
    commercialDocumentFormSchema.safeParse({ ...form, teams: [] }).success,
    false,
  );
});

test("a teljes dokumentumpillanatkép visszaolvasható", () => {
  const input = {
    ...emptyQuoteInput(),
    headcount: 10,
    teams: 1,
  };
  const result = calculateQuote(input, DEFAULT_RATE_CARD);
  const snapshot = commercialDocumentSnapshotSchema.parse({
    schemaVersion: CURRENT_DOCUMENT_SCHEMA_VERSION,
    kind: "PROPOSAL",
    documentNumber: "TRT-2026-0001-AJ-v1",
    version: 1,
    generatedAt: "2026-08-30T10:00:00.000Z",
    quote: {
      id: "quote_1",
      label: "TRT-2026-0001",
      title: "Minta ajánlat",
      status: "DRAFT",
      createdAt: "2026-08-30T09:00:00.000Z",
      validUntil: "2026-09-30T09:00:00.000Z",
      input,
      result,
      rateCard: DEFAULT_RATE_CARD,
    },
    customer: form,
    legal: {
      b2bTermsVersion: "B2B-2026-08-v1",
      dpaVersion: "DPA-2026-08-v1",
      privacyNoticeVersion: "PRIVACY-2026-08-25",
    },
  });
  assert.equal(snapshot.quote.result.netTotal, result.netTotal);
  assert.equal(snapshot.customer.companyName, "Példa Szervezet");
});

/**
 * A 2026-09-07 előtti, programdíjas pillanatkép. Ilyen sorok élnek a DB-ben
 * a kiadott ajánlatok mellett; ezeket a dokumentum-verzióváltás UTÁN is meg
 * kell tudni nyitni (PDF, állapotváltás), méghozzá az EREDETI tartalommal
 * és összeggel — a kiadott dokumentumot nem írjuk át.
 */
const LEGACY_SNAPSHOT = {
  schemaVersion: 1,
  kind: "PROPOSAL",
  documentNumber: "TRT-2026-0007-AJ-v1",
  version: 1,
  generatedAt: "2026-08-20T10:00:00.000Z",
  quote: {
    id: "quote_legacy",
    label: "TRT-2026-0007",
    title: "Régi ajánlat",
    status: "SENT",
    createdAt: "2026-08-20T09:00:00.000Z",
    validUntil: null,
    input: {
      headcount: 12,
      teams: 2,
      steps: ["OBSERVER_360", "TRUST_360"],
      workshopDays: 1,
      travelDays: 0,
      waves: 1,
      retainerMonths: 0,
      otherFee: 0,
      otherFeeLabel: "Egyéb díj",
      discountPct: 0,
      discountKind: null,
      discountScope: "all",
      discountReason: "",
      vatRate: 27,
    },
    result: {
      lines: [{ key: "base", label: "Programdíj", amount: 400_000 }],
      listTotal: 400_000,
      discountableSubtotal: 400_000,
      passThroughSubtotal: 0,
      discountAmount: 0,
      netTotal: 400_000,
      vatAmount: 108_000,
      grossTotal: 508_000,
      oneOffTotal: 400_000,
      retainerTotal: 0,
      estimatedHours: 20,
      effectiveHourlyRate: 20_000,
      floorPrice: 500_000,
      perHeadEffective: 33_333,
      warnings: [],
    },
    rateCard: { baseFee: 400_000, headBands: [{ upTo: 10, perHead: 30_000 }] },
  },
  customer: form,
  legal: {
    b2bTermsVersion: "B2B-2026-08-v1",
    dpaVersion: "DPA-2026-08-v1",
    privacyNoticeVersion: "PRIVACY-2026-08-25",
  },
};

test("a régi (programdíjas) dokumentum az eredeti összeggel olvasható", () => {
  const parsed = readCommercialDocumentSnapshot(LEGACY_SNAPSHOT);
  assert.ok(parsed, "a régi pillanatképet meg kell tudni nyitni");
  // Az árat SOSEM számoljuk újra: a kiküldött összeg marad.
  assert.equal(parsed.quote.result.netTotal, 400_000);
  assert.equal(parsed.quote.result.grossTotal, 508_000);
  assert.equal(parsed.documentNumber, "TRT-2026-0007-AJ-v1");
  assert.equal(parsed.schemaVersion, 1);
});

test("a régi dokumentum EREDETI tételeit adja vissza, nem a mai szintét", () => {
  const parsed = readCommercialDocumentSnapshot(LEGACY_SNAPSHOT);
  assert.deepEqual(parsed?.quote.legacyScope?.steps, ["Observer 360°", "Bizalmi kör"]);
  assert.equal(parsed?.quote.legacyScope?.workshopDays, 1);
  assert.equal(parsed?.quote.legacyScope?.waves, 1);
  // A régi díjkártya nem a mai alak — nem is olvassuk sehol.
  assert.equal(parsed?.quote.rateCard, null);
  // A bemenet a mai alakra fordítva jön, hogy a felület típusosan dolgozhasson.
  assert.equal(parsed?.quote.input.tier, "prog");
  assert.equal(parsed?.quote.input.headcount, 12);
});

test("a mai dokumentumnál nincs örökség-tétel", () => {
  const current = commercialDocumentSnapshotSchema.parse({
    ...LEGACY_SNAPSHOT,
    schemaVersion: CURRENT_DOCUMENT_SCHEMA_VERSION,
    quote: {
      ...LEGACY_SNAPSHOT.quote,
      input: emptyQuoteInput(),
      rateCard: DEFAULT_RATE_CARD,
    },
  });
  const parsed = readCommercialDocumentSnapshot(current);
  assert.equal(parsed?.quote.legacyScope, undefined);
  assert.notEqual(parsed?.quote.rateCard, null);
});

import test from "node:test";
import assert from "node:assert/strict";
import {
  commercialDocumentFormSchema,
  commercialDocumentSnapshotSchema,
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
    schemaVersion: 1,
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

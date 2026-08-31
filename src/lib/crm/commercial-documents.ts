import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { calculateQuote } from "@/lib/quote/calculate";
import { quoteInputSchema, rateCardSchema } from "@/lib/quote/rate-card";
import {
  COMMERCIAL_DOCUMENT_KINDS,
  commercialDocumentFormSchema,
  commercialDocumentSnapshotSchema,
  type CommercialDocumentForm,
  type CommercialDocumentKind,
  type CommercialDocumentSnapshot,
} from "@/lib/crm/commercial-document-schema";
import {
  B2B_TERMS_VERSION,
  DPA_VERSION,
  PRIVACY_NOTICE_VERSION,
} from "@/lib/legal/versions";
import { formatQuoteNo } from "@/lib/crm/guards";
import { createSystemActivity } from "@/lib/crm/activity-log";
import { CrmServiceError } from "@/lib/crm/errors";

function kindSuffix(kind: CommercialDocumentKind): string {
  return kind === "PROPOSAL" ? "AJ" : "EM";
}

export function commercialDocumentKindLabel(kind: CommercialDocumentKind): string {
  return kind === "PROPOSAL" ? "Ajánlat" : "Egyedi Megrendelőlap";
}

export async function generateCommercialDocument(params: {
  quoteId: string;
  kind: unknown;
  form: unknown;
}) {
  const kindResult = (COMMERCIAL_DOCUMENT_KINDS as readonly string[]).includes(
    String(params.kind),
  )
    ? (params.kind as CommercialDocumentKind)
    : null;
  if (!kindResult) throw new CrmServiceError("VALIDATION_ERROR");

  const formResult = commercialDocumentFormSchema.safeParse(params.form);
  if (!formResult.success) throw new CrmServiceError("VALIDATION_ERROR");
  const form = formResult.data;

  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({
      where: { id: params.quoteId },
      include: { deal: true },
    });
    if (!quote) throw new CrmServiceError("QUOTE_NOT_FOUND");
    if (kindResult === "ORDER_FORM" && quote.status !== "ACCEPTED") {
      throw new CrmServiceError("ORDER_FORM_REQUIRES_ACCEPTED_QUOTE");
    }

    const input = quoteInputSchema.parse(quote.input);
    const rateCard = rateCardSchema.parse(quote.rateCardSnapshot);
    const result = calculateQuote(input, rateCard);
    if (result.netTotal !== quote.netTotal) {
      throw new CrmServiceError("QUOTE_SNAPSHOT_MISMATCH");
    }

    const teamHeadcount = form.teams.reduce((sum, team) => sum + team.headcount, 0);
    if (teamHeadcount !== input.headcount || form.teams.length !== input.teams) {
      throw new CrmServiceError("TEAM_HEADCOUNT_MISMATCH");
    }
    if (form.serviceEnd < form.serviceStart || form.platformAccessEnd < form.serviceEnd) {
      throw new CrmServiceError("VALIDATION_ERROR");
    }

    const latest = await tx.commercialDocument.aggregate({
      where: { quoteId: quote.id, kind: kindResult },
      _max: { version: true },
    });
    const version = (latest._max.version ?? 0) + 1;
    const quoteLabel = formatQuoteNo(quote.quoteNo, quote.createdAt);
    const generatedAt = new Date();
    const snapshot: CommercialDocumentSnapshot = {
      schemaVersion: 1,
      kind: kindResult,
      documentNumber: `${quoteLabel}-${kindSuffix(kindResult)}-v${version}`,
      version,
      generatedAt: generatedAt.toISOString(),
      quote: {
        id: quote.id,
        label: quoteLabel,
        title: quote.title,
        status: quote.status,
        createdAt: quote.createdAt.toISOString(),
        validUntil: quote.validUntil?.toISOString() ?? null,
        input,
        result,
        rateCard,
      },
      customer: form,
      legal: {
        b2bTermsVersion: B2B_TERMS_VERSION,
        dpaVersion: DPA_VERSION,
        privacyNoticeVersion: PRIVACY_NOTICE_VERSION,
      },
    };
    commercialDocumentSnapshotSchema.parse(snapshot);

    const document = await tx.commercialDocument.create({
      data: {
        quoteId: quote.id,
        kind: kindResult,
        version,
        generatedAt,
        snapshot: snapshot as unknown as Prisma.InputJsonValue,
      },
    });
    await createSystemActivity(
      tx,
      quote.dealId,
      `${commercialDocumentKindLabel(kindResult)} elkészült (${snapshot.documentNumber})`,
    );
    return document;
  });
}

export async function getCommercialDocumentSnapshot(
  documentId: string,
): Promise<CommercialDocumentSnapshot> {
  const document = await prisma.commercialDocument.findUnique({
    where: { id: documentId },
    select: { snapshot: true },
  });
  if (!document) throw new CrmServiceError("DOCUMENT_NOT_FOUND");
  const parsed = commercialDocumentSnapshotSchema.safeParse(document.snapshot);
  if (!parsed.success) throw new CrmServiceError("VALIDATION_ERROR");
  return parsed.data;
}

export async function markCommercialDocumentStatus(
  documentId: string,
  target: "SENT" | "SIGNED",
) {
  return prisma.$transaction(async (tx) => {
    const document = await tx.commercialDocument.findUnique({
      where: { id: documentId },
      include: { quote: true },
    });
    if (!document) throw new CrmServiceError("DOCUMENT_NOT_FOUND");
    const allowed =
      (target === "SENT" && document.status === "GENERATED") ||
      (target === "SIGNED" &&
        (document.status === "GENERATED" || document.status === "SENT"));
    if (!allowed) throw new CrmServiceError("INVALID_TRANSITION");

    const now = new Date();
    const updated = await tx.commercialDocument.update({
      where: { id: document.id },
      data:
        target === "SENT"
          ? { status: "SENT", sentAt: now }
          : { status: "SIGNED", signedAt: now },
    });
    const parsed = commercialDocumentSnapshotSchema.parse(document.snapshot);
    await createSystemActivity(
      tx,
      document.quote.dealId,
      `${commercialDocumentKindLabel(parsed.kind)} ${target === "SENT" ? "kiküldve" : "aláírva"} (${parsed.documentNumber})`,
    );
    return updated;
  });
}

export function defaultCommercialDocumentForm(params: {
  company: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone: string | null;
  headcount: number;
  teams: number;
}): CommercialDocumentForm {
  const start = new Date();
  start.setDate(start.getDate() + 14);
  const end = new Date(start);
  end.setDate(end.getDate() + 90);
  const accessEnd = new Date(end);
  accessEnd.setDate(accessEnd.getDate() + 30);
  const day = (date: Date) => date.toISOString().slice(0, 10);
  const baseSize = Math.floor(params.headcount / params.teams);
  const remainder = params.headcount % params.teams;

  return commercialDocumentFormSchema.parse({
    companyName: params.company ?? params.contactName,
    representativeName: params.contactName,
    contactEmail: params.contactEmail,
    billingName: params.company ?? "",
    billingEmail: params.contactEmail,
    teams: Array.from({ length: params.teams }, (_, index) => ({
      name: params.teams === 1 ? "Csapat" : `Csapat ${index + 1}`,
      headcount: baseSize + (index < remainder ? 1 : 0),
      leader: "",
      waveKind: "baseline",
    })),
    serviceStart: day(start),
    serviceEnd: day(end),
    platformAccessEnd: day(accessEnd),
    providerPhone: "",
  });
}

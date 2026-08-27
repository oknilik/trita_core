import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { calculateQuote, type QuoteInput } from "@/lib/quote/calculate";
import { quoteInputSchema, type RateCard } from "@/lib/quote/rate-card";
import { loadRateCard } from "@/lib/quote/rate-card.server";
import { QUOTE_DEFAULT_VALIDITY_DAYS } from "@/lib/crm/constants";
import { canTransitionQuote, formatQuoteNo, isOpenStage } from "@/lib/crm/guards";
import { createSystemActivity } from "@/lib/crm/activity-log";
import { CrmServiceError } from "@/lib/crm/errors";

// ─────────────────────────────────────────────────────────────────────
// Quote-életciklus: DRAFT → SENT → ACCEPTED | DECLINED | EXPIRED.
//
// A Quote pillanatkép: input + kimenet + az AKKORI rate card. Az összeget
// SOHA nem a kliens küldi — a szerver a friss rate carddal újraszámol
// (calculateQuote). SENT-től az ajánlat immutábilis; módosítás = másolat
// új DRAFT-ként, friss rate carddal újraszámolva.
// ─────────────────────────────────────────────────────────────────────

const DAY_MS = 24 * 60 * 60 * 1000;

function parseQuoteInput(input: unknown): QuoteInput {
  const parsed = quoteInputSchema.safeParse(input);
  if (!parsed.success) throw new CrmServiceError("VALIDATION_ERROR");
  return parsed.data;
}

function computeSnapshot(input: QuoteInput, rate: RateCard) {
  const result = calculateQuote(input, rate);
  return {
    input: input as unknown as Prisma.InputJsonValue,
    result: result as unknown as Prisma.InputJsonValue,
    rateCardSnapshot: rate as unknown as Prisma.InputJsonValue,
    netTotal: result.netTotal,
    discountPct: input.discountPct,
  };
}

function quoteLabel(quote: { quoteNo: number; createdAt: Date }): string {
  return formatQuoteNo(quote.quoteNo, quote.createdAt);
}

export interface CreateQuoteParams {
  dealId: string;
  input: unknown;
  title?: string | null;
  validUntil?: Date | null;
}

/**
 * Új DRAFT a kalkulátor-inputból: zod-validálás, szerver-oldali számolás,
 * rate card pillanatkép. Cím-default: "{cég ?? kontakt} — {YYYY-MM-DD}".
 */
export async function createQuote(params: CreateQuoteParams) {
  const deal = await prisma.deal.findUnique({
    where: { id: params.dealId },
    select: { id: true, company: true, contactName: true },
  });
  if (!deal) throw new CrmServiceError("DEAL_NOT_FOUND");

  const input = parseQuoteInput(params.input);
  const { rate } = await loadRateCard();
  const today = new Date().toISOString().slice(0, 10);
  const title =
    params.title?.trim() || `${deal.company ?? deal.contactName} – ${today}`;

  return prisma.quote.create({
    data: {
      dealId: deal.id,
      title,
      validUntil: params.validUntil ?? null,
      ...computeSnapshot(input, rate),
    },
  });
}

/** Csak DRAFT írható át (QUOTE_NOT_DRAFT) – friss rate carddal újraszámolva. */
export async function updateDraftQuoteInput(quoteId: string, input: unknown) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, status: true },
  });
  if (!quote) throw new CrmServiceError("QUOTE_NOT_FOUND");
  if (quote.status !== "DRAFT") throw new CrmServiceError("QUOTE_NOT_DRAFT");

  const parsed = parseQuoteInput(input);
  const { rate } = await loadRateCard();
  return prisma.quote.update({
    where: { id: quoteId },
    data: computeSnapshot(parsed, rate),
  });
}

/**
 * DRAFT → SENT egy tranzakcióban: sentAt + validUntil (default +30 nap),
 * a deal QUOTED-ra lép (ha NEW/DISCOVERY), SYSTEM-activity az idővonalra.
 */
export async function markQuoteSent(quoteId: string, validUntil?: Date | null) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new CrmServiceError("QUOTE_NOT_FOUND");
    if (!canTransitionQuote(quote.status, "SENT")) {
      throw new CrmServiceError("INVALID_TRANSITION");
    }

    const now = new Date();
    const resolvedValidUntil =
      validUntil ??
      quote.validUntil ??
      new Date(now.getTime() + QUOTE_DEFAULT_VALIDITY_DAYS * DAY_MS);

    const updated = await tx.quote.update({
      where: { id: quoteId },
      data: { status: "SENT", sentAt: now, validUntil: resolvedValidUntil },
    });

    const deal = await tx.deal.findUniqueOrThrow({ where: { id: quote.dealId } });
    if (deal.stage === "NEW" || deal.stage === "DISCOVERY") {
      await tx.deal.update({ where: { id: deal.id }, data: { stage: "QUOTED" } });
    }
    await createSystemActivity(
      tx,
      deal.id,
      `Ajánlat kiküldve (${quoteLabel(quote)}, nettó ${quote.netTotal.toLocaleString("hu-HU")} Ft)`,
    );
    return updated;
  });
}

/** SENT → ACCEPTED, és a deal automatikusan WON-ra zárul (terv §5.3). */
export async function markQuoteAccepted(quoteId: string) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new CrmServiceError("QUOTE_NOT_FOUND");
    if (!canTransitionQuote(quote.status, "ACCEPTED")) {
      throw new CrmServiceError("INVALID_TRANSITION");
    }

    const updated = await tx.quote.update({
      where: { id: quoteId },
      data: { status: "ACCEPTED", decidedAt: new Date() },
    });

    const deal = await tx.deal.findUniqueOrThrow({ where: { id: quote.dealId } });
    const wonNow = isOpenStage(deal.stage);
    if (wonNow) {
      await tx.deal.update({
        where: { id: deal.id },
        data: { stage: "WON", closedAt: new Date(), nextActionAt: null, nextActionNote: null },
      });
    }
    await createSystemActivity(
      tx,
      deal.id,
      wonNow
        ? `Ajánlat elfogadva (${quoteLabel(quote)}) – deal megnyerve`
        : `Ajánlat elfogadva (${quoteLabel(quote)})`,
    );
    return updated;
  });
}

/** SENT → DECLINED; a deal nyitva marad (a lezárás külön döntés). */
export async function markQuoteDeclined(quoteId: string, reason?: string | null) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new CrmServiceError("QUOTE_NOT_FOUND");
    if (!canTransitionQuote(quote.status, "DECLINED")) {
      throw new CrmServiceError("INVALID_TRANSITION");
    }

    const updated = await tx.quote.update({
      where: { id: quoteId },
      data: { status: "DECLINED", decidedAt: new Date(), declineReason: reason?.trim() || null },
    });
    await createSystemActivity(tx, quote.dealId, `Ajánlat elutasítva (${quoteLabel(quote)})`);
    return updated;
  });
}

/** SENT → EXPIRED (a napi sweep auto-lejáratója) + SYSTEM-activity. */
export async function expireQuote(quoteId: string) {
  return prisma.$transaction(async (tx) => {
    const quote = await tx.quote.findUnique({ where: { id: quoteId } });
    if (!quote) throw new CrmServiceError("QUOTE_NOT_FOUND");
    if (!canTransitionQuote(quote.status, "EXPIRED")) {
      throw new CrmServiceError("INVALID_TRANSITION");
    }

    const updated = await tx.quote.update({
      where: { id: quoteId },
      data: { status: "EXPIRED" },
    });
    await createSystemActivity(tx, quote.dealId, `Ajánlat lejárt (${quoteLabel(quote)})`);
    return updated;
  });
}

/** Érvényesség állítása – csak amíg az ajánlat él (DRAFT/SENT). */
export async function setQuoteValidUntil(quoteId: string, validUntil: Date | null) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, status: true },
  });
  if (!quote) throw new CrmServiceError("QUOTE_NOT_FOUND");
  if (quote.status !== "DRAFT" && quote.status !== "SENT") {
    throw new CrmServiceError("NOT_EDITABLE");
  }
  return prisma.quote.update({ where: { id: quoteId }, data: { validUntil } });
}

/**
 * Másolat új DRAFT-ként: az input átemelve, de FRISS rate carddal
 * újraszámolva – lejárt/elutasított ajánlat módosításának egyetlen útja.
 */
export async function duplicateQuote(quoteId: string) {
  const source = await prisma.quote.findUnique({ where: { id: quoteId } });
  if (!source) throw new CrmServiceError("QUOTE_NOT_FOUND");

  const input = parseQuoteInput(source.input);
  const { rate } = await loadRateCard();
  return prisma.quote.create({
    data: {
      dealId: source.dealId,
      title: source.title,
      validUntil: null,
      ...computeSnapshot(input, rate),
    },
  });
}

/** Törlés csak DRAFT-on (ONLY_DRAFT_DELETABLE) – kiment ajánlat nyom marad. */
export async function deleteDraftQuote(quoteId: string) {
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    select: { id: true, status: true },
  });
  if (!quote) throw new CrmServiceError("QUOTE_NOT_FOUND");
  if (quote.status !== "DRAFT") throw new CrmServiceError("ONLY_DRAFT_DELETABLE");
  await prisma.quote.delete({ where: { id: quoteId } });
}

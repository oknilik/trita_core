import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
// Szándékosan NEM a lib/inquiries-ből: annak import-lánca (auth →
// next/navigation) a service-t integration-tesztelhetetlenné tenné.
import { INQUIRY_TOPIC_LABELS } from "@/lib/inquiry-topics";
import {
  DEAL_STAGE_LABELS,
  OPEN_DEAL_STAGES,
  OUTCOME_KINDS,
  type DealSource,
  type DealStage,
  type OpenDealStage,
  type OutcomeKind,
} from "@/lib/crm/constants";
import {
  buildDealTitleFromInquiry,
  isOpenStage,
  resolveCrmDueWindow,
} from "@/lib/crm/guards";
import { createSystemActivity } from "@/lib/crm/activity-log";
import { CrmServiceError } from "@/lib/crm/errors";

// ─────────────────────────────────────────────────────────────────────
// Deal-szolgáltatások: olvasók (lista/„Ma”/beérkező/részlet) + CRUD +
// stage-gép. Az Inquiry intake-esemény marad (státusza érintetlen
// értékkészletű), a pipeline-folyamat a Deal — több inquiry köthető
// egy dealhez. Minden stage-váltás SYSTEM-activityt ír az idővonalra.
// ─────────────────────────────────────────────────────────────────────

type DealStageLabelKey = keyof typeof DEAL_STAGE_LABELS;

function stageLabel(stage: string): string {
  return DEAL_STAGE_LABELS[stage as DealStageLabelKey] ?? stage;
}

// ── Olvasók ─────────────────────────────────────────────────────────────────

export interface ListDealsFilter {
  /** Explicit stage-szűrő; hiánya = nyitott stage-ek. */
  stages?: DealStage[];
  /** "today": lejárt + ma esedékes next action (a „Ma” panel lekérdezése). */
  view?: "today";
  /** Szabad-szavas keresés: cím / cég / kontakt név / email. */
  q?: string;
  now?: Date;
}

const DEAL_LIST_INCLUDE = {
  quotes: {
    orderBy: { createdAt: "desc" },
    select: { id: true, quoteNo: true, status: true, netTotal: true, validUntil: true, createdAt: true },
  },
  _count: { select: { inquiries: true, activities: true } },
} satisfies Prisma.DealInclude;

export async function listDeals(filter: ListDealsFilter = {}) {
  const stages = filter.stages?.length ? filter.stages : [...OPEN_DEAL_STAGES];
  const where: Prisma.DealWhereInput = { stage: { in: stages } };

  if (filter.view === "today") {
    const { dueBefore } = resolveCrmDueWindow(filter.now ?? new Date());
    where.nextActionAt = { lt: dueBefore };
  }
  const q = filter.q?.trim();
  if (q) {
    where.OR = [
      { title: { contains: q, mode: "insensitive" } },
      { company: { contains: q, mode: "insensitive" } },
      { contactName: { contains: q, mode: "insensitive" } },
      { contactEmail: { contains: q, mode: "insensitive" } },
    ];
  }

  return prisma.deal.findMany({
    where,
    orderBy: [{ nextActionAt: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }],
    include: DEAL_LIST_INCLUDE,
  });
}

/** A „Ma” panel: lejárt + ma esedékes next actionű nyitott dealek. */
export async function getDueDeals(now: Date = new Date()) {
  return listDeals({ view: "today", now });
}

/** Beérkező: NEW státuszú, még deal nélküli inquiry-k (kvalifikációs kapu). */
export async function getIntakeInquiries() {
  return prisma.inquiry.findMany({
    where: { status: "NEW", dealId: null },
    orderBy: { createdAt: "desc" },
  });
}

export async function getDealDetail(dealId: string) {
  return prisma.deal.findUnique({
    where: { id: dealId },
    include: {
      activities: { orderBy: [{ occurredAt: "desc" }, { createdAt: "desc" }] },
      quotes: { orderBy: { createdAt: "desc" } },
      inquiries: { orderBy: { createdAt: "desc" } },
      organization: { select: { id: true, name: true } },
      userProfile: { select: { id: true, email: true, username: true } },
    },
  });
}

const CLOSED_WINDOW_DAYS = 90;
const WIN_RATE_WINDOW_DAYS = 30;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Pipeline-áttekintés: nyitott dealek stage-csoportban + metrikák.
 * Pipeline-érték: ha egy dealen van kint SENT quote, annak netTotal-ja
 * nyeri felül az expectedValue-t (a konkrétabb szám nyer — terv IV.1).
 */
export async function getPipelineSnapshot(now: Date = new Date()) {
  const [openDeals, closedRecent] = await Promise.all([
    listDeals(),
    prisma.deal.findMany({
      where: {
        stage: { in: ["WON", "LOST"] },
        closedAt: { gte: new Date(now.getTime() - CLOSED_WINDOW_DAYS * DAY_MS) },
      },
      orderBy: { closedAt: "desc" },
      include: DEAL_LIST_INCLUDE,
    }),
  ]);

  const dealValue = (deal: (typeof openDeals)[number]): number => {
    const sent = deal.quotes.find((quote) => quote.status === "SENT");
    return sent?.netTotal ?? deal.expectedValue ?? 0;
  };

  const byStage = OPEN_DEAL_STAGES.map((stage) => {
    const deals = openDeals.filter((deal) => deal.stage === stage);
    return {
      stage,
      deals,
      count: deals.length,
      valueTotal: deals.reduce((sum, deal) => sum + dealValue(deal), 0),
    };
  });

  const outstandingSentTotal = openDeals.reduce(
    (sum, deal) =>
      sum + deal.quotes.filter((q) => q.status === "SENT").reduce((s, q) => s + q.netTotal, 0),
    0,
  );

  const winRateWindowStart = new Date(now.getTime() - WIN_RATE_WINDOW_DAYS * DAY_MS);
  const closedInWindow = closedRecent.filter(
    (deal) => deal.closedAt && deal.closedAt >= winRateWindowStart,
  );
  const wonInWindow = closedInWindow.filter((deal) => deal.stage === "WON").length;

  return {
    byStage,
    closedRecent,
    metrics: {
      openValueTotal: byStage.reduce((sum, group) => sum + group.valueTotal, 0),
      outstandingSentTotal,
      winRate30d:
        closedInWindow.length > 0 ? Math.round((wonInWindow / closedInWindow.length) * 100) : null,
    },
  };
}

// ── Létrehozás ──────────────────────────────────────────────────────────────

export interface CreateDealInput {
  title?: string | null;
  contactName: string;
  contactEmail: string;
  contactPhone?: string | null;
  company?: string | null;
  source?: DealSource;
  expectedValue?: number | null;
  adminNote?: string | null;
  organizationId?: string | null;
  userProfileId?: string | null;
  nextActionAt?: Date | null;
  nextActionNote?: string | null;
}

async function assertLinkTargets(input: Pick<CreateDealInput, "organizationId" | "userProfileId">) {
  if (input.organizationId) {
    const org = await prisma.organization.findUnique({
      where: { id: input.organizationId },
      select: { id: true },
    });
    if (!org) throw new CrmServiceError("ORG_NOT_FOUND");
  }
  if (input.userProfileId) {
    const profile = await prisma.userProfile.findUnique({
      where: { id: input.userProfileId },
      select: { id: true },
    });
    if (!profile) throw new CrmServiceError("USER_NOT_FOUND");
  }
}

export async function createDeal(input: CreateDealInput) {
  await assertLinkTargets(input);

  const title =
    input.title?.trim() || input.company?.trim() || input.contactName.trim();

  return prisma.$transaction(async (tx) => {
    const deal = await tx.deal.create({
      data: {
        title,
        contactName: input.contactName.trim(),
        contactEmail: input.contactEmail.trim().toLowerCase(),
        contactPhone: input.contactPhone?.trim() || null,
        company: input.company?.trim() || null,
        source: input.source ?? "other",
        expectedValue: input.expectedValue ?? null,
        adminNote: input.adminNote?.trim() || null,
        organizationId: input.organizationId ?? null,
        userProfileId: input.userProfileId ?? null,
        nextActionAt: input.nextActionAt ?? null,
        nextActionNote: input.nextActionAt ? (input.nextActionNote?.trim() || null) : null,
      },
    });
    await createSystemActivity(tx, deal.id, "Deal létrehozva");
    // Friss olvasat: a SYSTEM-activity már beállította a lastActivityAt-ot.
    return tx.deal.findUniqueOrThrow({ where: { id: deal.id } });
  });
}

/**
 * Deal beérkező inquiry-ből (a „Pipeline-ba” kvalifikációs döntés):
 * kontakt-átemelés, inquiry.dealId link, inquiry NEW→IN_PROGRESS,
 * nyitó SYSTEM-activity az eredeti üzenet-kivonattal.
 */
export async function createDealFromInquiry(
  inquiryId: string,
  overrides: Partial<CreateDealInput> = {},
) {
  const inquiry = await prisma.inquiry.findUnique({ where: { id: inquiryId } });
  if (!inquiry) throw new CrmServiceError("INQUIRY_NOT_FOUND");
  if (inquiry.dealId) throw new CrmServiceError("INQUIRY_ALREADY_LINKED");

  await assertLinkTargets(overrides);

  const topicLabel = INQUIRY_TOPIC_LABELS[inquiry.topic] ?? inquiry.topic;
  const title =
    overrides.title?.trim() ||
    buildDealTitleFromInquiry({ name: inquiry.name, company: inquiry.company, topicLabel });

  return prisma.$transaction(async (tx) => {
    const deal = await tx.deal.create({
      data: {
        title,
        contactName: overrides.contactName?.trim() || inquiry.name,
        contactEmail: (overrides.contactEmail?.trim() || inquiry.email).toLowerCase(),
        contactPhone: overrides.contactPhone?.trim() || null,
        company: overrides.company?.trim() || inquiry.company,
        source: overrides.source ?? "inquiry",
        expectedValue: overrides.expectedValue ?? null,
        adminNote: overrides.adminNote?.trim() || null,
        organizationId: overrides.organizationId ?? inquiry.organizationId,
        userProfileId: overrides.userProfileId ?? inquiry.userProfileId,
        nextActionAt: overrides.nextActionAt ?? null,
        nextActionNote: overrides.nextActionAt ? (overrides.nextActionNote?.trim() || null) : null,
      },
    });
    await tx.inquiry.update({
      where: { id: inquiry.id },
      data: {
        dealId: deal.id,
        ...(inquiry.status === "NEW" ? { status: "IN_PROGRESS" } : {}),
      },
    });
    await createSystemActivity(
      tx,
      deal.id,
      `Deal létrehozva a beérkező megkeresésből (${topicLabel})`,
      inquiry.message.slice(0, 500),
    );
    // Friss olvasat: a SYSTEM-activity már beállította a lastActivityAt-ot.
    return tx.deal.findUniqueOrThrow({ where: { id: deal.id } });
  });
}

// ── Részlet-mutációk ────────────────────────────────────────────────────────

export interface DealDetailsPatch {
  title?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string | null;
  company?: string | null;
  source?: DealSource;
  expectedValue?: number | null;
}

export async function updateDealDetails(dealId: string, patch: DealDetailsPatch) {
  await assertDealExists(dealId);
  return prisma.deal.update({
    where: { id: dealId },
    data: {
      ...(patch.title !== undefined ? { title: patch.title.trim() } : {}),
      ...(patch.contactName !== undefined ? { contactName: patch.contactName.trim() } : {}),
      ...(patch.contactEmail !== undefined
        ? { contactEmail: patch.contactEmail.trim().toLowerCase() }
        : {}),
      ...(patch.contactPhone !== undefined
        ? { contactPhone: patch.contactPhone?.trim() || null }
        : {}),
      ...(patch.company !== undefined ? { company: patch.company?.trim() || null } : {}),
      ...(patch.source !== undefined ? { source: patch.source } : {}),
      ...(patch.expectedValue !== undefined ? { expectedValue: patch.expectedValue } : {}),
    },
  });
}

export async function setDealNote(dealId: string, note: string | null) {
  await assertDealExists(dealId);
  return prisma.deal.update({
    where: { id: dealId },
    data: { adminNote: note?.trim() || null },
  });
}

export async function setNextAction(dealId: string, at: Date, note?: string | null) {
  await assertDealExists(dealId);
  return prisma.deal.update({
    where: { id: dealId },
    data: { nextActionAt: at, nextActionNote: note?.trim() || null },
  });
}

export async function clearNextAction(dealId: string) {
  await assertDealExists(dealId);
  return prisma.deal.update({
    where: { id: dealId },
    data: { nextActionAt: null, nextActionNote: null },
  });
}

async function assertDealExists(dealId: string) {
  const deal = await prisma.deal.findUnique({ where: { id: dealId }, select: { id: true } });
  if (!deal) throw new CrmServiceError("DEAL_NOT_FOUND");
}

// ── Stage-gép ───────────────────────────────────────────────────────────────

/** Nyitott stage-ek közötti váltás. Zárt dealt a reopenDeal nyit újra. */
export async function setDealStage(dealId: string, stage: OpenDealStage) {
  if (!isOpenStage(stage)) throw new CrmServiceError("INVALID_STAGE");

  return prisma.$transaction(async (tx) => {
    const deal = await tx.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new CrmServiceError("DEAL_NOT_FOUND");
    if (!isOpenStage(deal.stage)) throw new CrmServiceError("INVALID_TRANSITION");
    if (deal.stage === stage) return deal;

    await tx.deal.update({ where: { id: dealId }, data: { stage } });
    await createSystemActivity(
      tx,
      dealId,
      `Stage-váltás: ${stageLabel(deal.stage)} → ${stageLabel(stage)}`,
    );
    return tx.deal.findUniqueOrThrow({ where: { id: dealId } });
  });
}

export interface CloseDealParams {
  outcome: "WON" | "LOST";
  outcomeKind?: OutcomeKind | null;
  outcomeNote?: string | null;
}

/**
 * Deal lezárása. LOST-hoz az outcomeKind KÖTELEZŐ (LOST_REASON_REQUIRED) —
 * a strukturált win/loss tanulság a termék-visszacsatolás alapja.
 * Záráskor a next action törlődik: lezárt ügy nem ülhet a „Ma” panelen.
 */
export async function closeDeal(dealId: string, params: CloseDealParams) {
  if (params.outcome === "LOST" && !params.outcomeKind) {
    throw new CrmServiceError("LOST_REASON_REQUIRED");
  }
  if (params.outcomeKind && !(OUTCOME_KINDS as readonly string[]).includes(params.outcomeKind)) {
    throw new CrmServiceError("VALIDATION_ERROR");
  }

  return prisma.$transaction(async (tx) => {
    const deal = await tx.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new CrmServiceError("DEAL_NOT_FOUND");
    if (!isOpenStage(deal.stage)) throw new CrmServiceError("INVALID_TRANSITION");

    await tx.deal.update({
      where: { id: dealId },
      data: {
        stage: params.outcome,
        closedAt: new Date(),
        outcomeKind: params.outcomeKind ?? null,
        outcomeNote: params.outcomeNote?.trim() || null,
        nextActionAt: null,
        nextActionNote: null,
      },
    });
    await createSystemActivity(
      tx,
      dealId,
      params.outcome === "WON" ? "Deal lezárva: megnyert" : "Deal lezárva: elveszett",
      params.outcomeNote?.trim() || null,
    );
    return tx.deal.findUniqueOrThrow({ where: { id: dealId } });
  });
}

/** Zárt deal visszanyitása egy nyitott stage-be; az outcome-mezők törlődnek. */
export async function reopenDeal(dealId: string, stage: OpenDealStage) {
  if (!isOpenStage(stage)) throw new CrmServiceError("INVALID_STAGE");

  return prisma.$transaction(async (tx) => {
    const deal = await tx.deal.findUnique({ where: { id: dealId } });
    if (!deal) throw new CrmServiceError("DEAL_NOT_FOUND");
    if (isOpenStage(deal.stage)) throw new CrmServiceError("INVALID_TRANSITION");

    await tx.deal.update({
      where: { id: dealId },
      data: { stage, closedAt: null, outcomeKind: null, outcomeNote: null },
    });
    await createSystemActivity(
      tx,
      dealId,
      `Deal újranyitva (${stageLabel(stage)})`,
    );
    return tx.deal.findUniqueOrThrow({ where: { id: dealId } });
  });
}

// ── Org-access integráció ───────────────────────────────────────────────────

export type OrgAccessAction = "activate" | "trial" | "extend" | "set_credits";

export interface OrgAccessGrantedResult {
  dealId: string;
  transitionedToWon: boolean;
}

/**
 * /api/admin/org-access hook: activate/trial a linkelt nyitott dealt WON-ra
 * zárja (SYSTEM-activityvel); már lezárt WON dealen — és extend/set_credits
 * esetén — csak activity kerül az idővonalra (ügyfél-történet). Nincs
 * linkelt deal → no-op. Idempotens: a WON-váltás legfeljebb egyszer fut.
 */
export async function handleOrgAccessGranted(
  orgId: string,
  action: OrgAccessAction,
  months?: number,
): Promise<OrgAccessGrantedResult | null> {
  const summaryByAction: Record<OrgAccessAction, string> = {
    activate: `Org-hozzáférés aktiválva${months ? ` (${months} hónap)` : ""}`,
    trial: "Org-próbaidőszak elindítva",
    extend: `Org-hozzáférés meghosszabbítva${months ? ` (${months} hónap)` : ""}`,
    set_credits: "Jelöltkeret módosítva",
  };

  return prisma.$transaction(async (tx) => {
    const openDeal = await tx.deal.findFirst({
      where: { organizationId: orgId, stage: { in: [...OPEN_DEAL_STAGES] } },
      orderBy: { createdAt: "desc" },
    });

    if (openDeal && (action === "activate" || action === "trial")) {
      await tx.deal.update({
        where: { id: openDeal.id },
        data: {
          stage: "WON",
          closedAt: new Date(),
          nextActionAt: null,
          nextActionNote: null,
        },
      });
      await createSystemActivity(tx, openDeal.id, `${summaryByAction[action]} — deal megnyerve`);
      return { dealId: openDeal.id, transitionedToWon: true };
    }

    // Nyitott deal nélkül (vagy extend/set_credits ágon): a legfrissebb WON
    // deal idővonalára kerül az esemény — az ügyfél-történet folytonos marad.
    const targetDeal =
      openDeal ??
      (await tx.deal.findFirst({
        where: { organizationId: orgId, stage: "WON" },
        orderBy: { createdAt: "desc" },
      }));
    if (!targetDeal) return null;

    await createSystemActivity(tx, targetDeal.id, summaryByAction[action]);
    return { dealId: targetDeal.id, transitionedToWon: false };
  });
}

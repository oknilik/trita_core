import {
  getDueDeals,
  getIntakeInquiries,
  getPipelineSnapshot,
} from "@/lib/crm/service";
import { schemaOutOfSyncDetail } from "@/lib/crm/errors";
import { AdminCrmSection } from "@/components/admin/crm/AdminCrmSection";
import { getEngagementByEmail, toEngagementDto } from "@/lib/newsletter-engagement";
import { normalizeEmail } from "@/lib/newsletter";
import { CrmMigrationPendingCard } from "@/components/admin/crm/CrmMigrationPendingCard";
import { isCrmView } from "@/components/admin/crm/types";
import type {
  CrmDealRow,
  CrmIntakeRow,
} from "@/components/admin/crm/types";

// ─────────────────────────────────────────────────────────────────────
// CRM fül (szerver) — egy renderben lekéri mind a négy alnézet adatát
// (Ma / Beérkező / Pipeline / Lezártak) a lib/crm service-en át, és
// szerializálva adja a kliens-szekciónak. A nézet-váltás kliens-oldali;
// mutáció után a kliens router.refresh()-e ide tér vissza friss adatért.
// ─────────────────────────────────────────────────────────────────────

type DealWithIncludes = Awaited<ReturnType<typeof getDueDeals>>[number];

type EngagementMap = Awaited<ReturnType<typeof getEngagementByEmail>>;

function toDealRow(deal: DealWithIncludes, engagement: EngagementMap): CrmDealRow {
  return {
    id: deal.id,
    title: deal.title,
    company: deal.company,
    contactName: deal.contactName,
    contactEmail: deal.contactEmail,
    contactPhone: deal.contactPhone,
    stage: deal.stage,
    source: deal.source,
    expectedValue: deal.expectedValue,
    nextActionAt: deal.nextActionAt?.toISOString() ?? null,
    nextActionNote: deal.nextActionNote,
    lastActivityAt: deal.lastActivityAt?.toISOString() ?? null,
    closedAt: deal.closedAt?.toISOString() ?? null,
    outcomeKind: deal.outcomeKind,
    outcomeNote: deal.outcomeNote,
    createdAt: deal.createdAt.toISOString(),
    quotes: deal.quotes.map((quote) => ({
      id: quote.id,
      quoteNo: quote.quoteNo,
      status: quote.status,
      netTotal: quote.netTotal,
      validUntil: quote.validUntil?.toISOString() ?? null,
      createdAt: quote.createdAt.toISOString(),
    })),
    inquiryCount: deal._count.inquiries,
    activityCount: deal._count.activities,
    newsletter: toEngagementDto(engagement.get(normalizeEmail(deal.contactEmail))),
  };
}

export async function CrmTab({ view }: { view?: string }) {
  let dueDeals: Awaited<ReturnType<typeof getDueDeals>>;
  let intakeInquiries: Awaited<ReturnType<typeof getIntakeInquiries>>;
  let snapshot: Awaited<ReturnType<typeof getPipelineSnapshot>>;
  try {
    [dueDeals, intakeInquiries, snapshot] = await Promise.all([
      getDueDeals(),
      getIntakeInquiries(),
      getPipelineSnapshot(),
    ]);
  } catch (error) {
    // Migráció-lemaradás (P2021/P2022): ne az általános hibaoldal jöjjön,
    // hanem a pontos teendő. Minden más hiba továbbra is felfut.
    const outOfSync = schemaOutOfSyncDetail(error);
    if (outOfSync) return <CrmMigrationPendingCard detail={outOfSync} />;
    throw error;
  }

  const openDealsFlat = snapshot.byStage.flatMap((group) => group.deals);

  // Hírlevél-elköteleződés MINDEN itt látszó címre, egyetlen lekérdezésben
  // (N+1 nélkül): a Beérkező beküldői + a deal-kapcsolattartók.
  const engagement = await getEngagementByEmail([
    ...intakeInquiries.map((inquiry) => inquiry.email),
    ...dueDeals.map((deal) => deal.contactEmail),
    ...openDealsFlat.map((deal) => deal.contactEmail),
    ...snapshot.closedRecent.map((deal) => deal.contactEmail),
  ]);

  // Email-match nyitott dealre: a Beérkezőben „már pipeline-ban” jelzés +
  // egykattintásos csatolás-ajánlat (az auto-attach logikájával összhangban
  // a legfrissebb nyitott deal nyer).
  const openDealByEmail = new Map<string, DealWithIncludes>();
  for (const deal of openDealsFlat) {
    const key = deal.contactEmail.toLowerCase();
    const existing = openDealByEmail.get(key);
    if (!existing || deal.createdAt > existing.createdAt) openDealByEmail.set(key, deal);
  }

  const intake: CrmIntakeRow[] = intakeInquiries.map((inquiry) => {
    const match = openDealByEmail.get(inquiry.email.trim().toLowerCase()) ?? null;
    return {
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      company: inquiry.company,
      topic: inquiry.topic,
      message: inquiry.message,
      createdAt: inquiry.createdAt.toISOString(),
      openDealMatch: match ? { id: match.id, title: match.title } : null,
      newsletter: toEngagementDto(engagement.get(normalizeEmail(inquiry.email))),
    };
  });

  return (
    <AdminCrmSection
      initialView={isCrmView(view) ? view : undefined}
      due={dueDeals.map((deal) => toDealRow(deal, engagement))}
      intake={intake}
      stageGroups={snapshot.byStage.map((group) => ({
        stage: group.stage,
        count: group.count,
        valueTotal: group.valueTotal,
        deals: group.deals.map((deal) => toDealRow(deal, engagement)),
      }))}
      metrics={snapshot.metrics}
      closedRecent={snapshot.closedRecent.map((deal) => toDealRow(deal, engagement))}
      openDealOptions={openDealsFlat.map((deal) => ({ id: deal.id, title: deal.title }))}
    />
  );
}

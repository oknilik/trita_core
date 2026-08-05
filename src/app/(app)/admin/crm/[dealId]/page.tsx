import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getDealDetail } from "@/lib/crm/service";
import { DealDetail } from "@/components/admin/crm/DealDetail";
import type { CrmDealDetailData } from "@/components/admin/crm/types";

// ─────────────────────────────────────────────────────────────────────
// Deal-részletnézet (szerver) — requireAdmin + getDealDetail, szerializálva
// a kliens DealDetail-nek. A user-link javaslat email-egyezésből jön
// (nincs user-kereső); az org-lista a link_org választóhoz kell.
// ─────────────────────────────────────────────────────────────────────

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deal | trita admin",
  robots: { index: false, follow: false },
};

export default async function DealDetailPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  await requireAdmin();
  const { dealId } = await params;

  const deal = await getDealDetail(dealId);
  if (!deal) notFound();

  const [orgs, suggestedProfile] = await Promise.all([
    prisma.organization.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
    deal.userProfileId
      ? Promise.resolve(null)
      : prisma.userProfile.findFirst({
          where: {
            email: { equals: deal.contactEmail, mode: "insensitive" },
            deleted: false,
          },
          select: { id: true, email: true, username: true },
        }),
  ]);

  const data: CrmDealDetailData = {
    id: deal.id,
    title: deal.title,
    contactName: deal.contactName,
    contactEmail: deal.contactEmail,
    contactPhone: deal.contactPhone,
    company: deal.company,
    stage: deal.stage,
    source: deal.source,
    expectedValue: deal.expectedValue,
    nextActionAt: deal.nextActionAt?.toISOString() ?? null,
    nextActionNote: deal.nextActionNote,
    adminNote: deal.adminNote,
    outcomeKind: deal.outcomeKind,
    outcomeNote: deal.outcomeNote,
    closedAt: deal.closedAt?.toISOString() ?? null,
    lastActivityAt: deal.lastActivityAt?.toISOString() ?? null,
    createdAt: deal.createdAt.toISOString(),
    organization: deal.organization,
    userProfile: deal.userProfile,
    activities: deal.activities.map((activity) => ({
      id: activity.id,
      kind: activity.kind,
      summary: activity.summary,
      body: activity.body,
      occurredAt: activity.occurredAt.toISOString(),
      createdAt: activity.createdAt.toISOString(),
    })),
    quotes: deal.quotes.map((quote) => ({
      id: quote.id,
      quoteNo: quote.quoteNo,
      title: quote.title,
      status: quote.status,
      netTotal: quote.netTotal,
      discountPct: quote.discountPct,
      validUntil: quote.validUntil?.toISOString() ?? null,
      sentAt: quote.sentAt?.toISOString() ?? null,
      decidedAt: quote.decidedAt?.toISOString() ?? null,
      declineReason: quote.declineReason,
      createdAt: quote.createdAt.toISOString(),
      // Belső szám a result-pillanatképből — csak ezen az admin-felületen él.
      effectiveHourlyRate:
        (quote.result as { effectiveHourlyRate?: number | null } | null)
          ?.effectiveHourlyRate ?? null,
    })),
    inquiries: deal.inquiries.map((inquiry) => ({
      id: inquiry.id,
      name: inquiry.name,
      email: inquiry.email,
      company: inquiry.company,
      topic: inquiry.topic,
      message: inquiry.message,
      status: inquiry.status,
      createdAt: inquiry.createdAt.toISOString(),
    })),
  };

  return (
    <main className="min-h-dvh bg-cream px-4 pt-6 pb-24 md:px-6 md:pt-8">
      <div className="mx-auto max-w-6xl">
        <DealDetail deal={data} orgs={orgs} suggestedUser={suggestedProfile} />
      </div>
    </main>
  );
}

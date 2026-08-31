import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { quoteInputSchema } from "@/lib/quote/rate-card";
import {
  commercialDocumentSnapshotSchema,
} from "@/lib/crm/commercial-document-schema";
import { defaultCommercialDocumentForm } from "@/lib/crm/commercial-documents";
import { formatQuoteNo } from "@/lib/crm/guards";
import { EditorialBackHeader } from "@/components/ui/primitives/EditorialBackHeader";
import { CommercialDocumentGenerator } from "@/components/admin/crm/CommercialDocumentGenerator";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ajánlati dokumentumok | trita admin",
  robots: { index: false, follow: false },
};

export default async function QuoteDocumentsPage({
  params,
}: {
  params: Promise<{ quoteId: string }>;
}) {
  await requireAdmin();
  const { quoteId } = await params;
  const quote = await prisma.quote.findUnique({
    where: { id: quoteId },
    include: {
      deal: true,
      documents: { orderBy: { generatedAt: "desc" } },
    },
  });
  if (!quote) notFound();

  const input = quoteInputSchema.parse(quote.input);
  const fallbackForm = defaultCommercialDocumentForm({
    company: quote.deal.company,
    contactName: quote.deal.contactName,
    contactEmail: quote.deal.contactEmail,
    contactPhone: quote.deal.contactPhone,
    headcount: input.headcount,
    teams: input.teams,
  });
  const latestSnapshot = quote.documents
    .map((document) => commercialDocumentSnapshotSchema.safeParse(document.snapshot))
    .find((parsed) => parsed.success);
  const initialForm = latestSnapshot?.success
    ? latestSnapshot.data.customer
    : fallbackForm;
  const quoteLabel = formatQuoteNo(quote.quoteNo, quote.createdAt);

  return (
    <main className="min-h-dvh bg-cream px-4 pt-6 pb-24 md:px-6 md:pt-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-6">
        <EditorialBackHeader
          href={`/admin/crm/${quote.dealId}`}
          backLabel={`Vissza az ügyhöz: ${quote.deal.title}`}
          eyebrow={quoteLabel}
          title="Ajánlat és Egyedi Megrendelőlap"
          description="Az ügyféladatokat egyszer kell kitölteni. Az ajánlat és a megrendelőlap ugyanabból a lezárt kalkulációból és jogi verziókból készül."
        />
        <CommercialDocumentGenerator
          quoteId={quote.id}
          quoteStatus={quote.status}
          initialForm={initialForm}
          documents={quote.documents.flatMap((document) => {
            const parsed = commercialDocumentSnapshotSchema.safeParse(document.snapshot);
            if (!parsed.success) return [];
            return [{
              id: document.id,
              kind: document.kind,
              version: document.version,
              status: document.status,
              generatedAt: document.generatedAt.toISOString(),
              documentNumber: parsed.data.documentNumber,
            }];
          })}
        />
      </div>
    </main>
  );
}

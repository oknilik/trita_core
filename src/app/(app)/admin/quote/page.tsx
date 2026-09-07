import type { Metadata } from "next";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { loadRateCard } from "@/lib/quote/rate-card.server";
import { readQuoteInput } from "@/lib/quote/rate-card";
import type { QuoteInput } from "@/lib/quote/calculate";
import { formatQuoteNo } from "@/lib/crm/guards";
import { QuoteCalculator } from "@/components/admin/quote/QuoteCalculator";
import { EditorialBackHeader } from "@/components/ui/primitives/EditorialBackHeader";

// Ajánlat-kalkulátor — BELSŐ eszköz.
//
// Az ár a publikus árlétrából jön (Csapatkép / Csapatprogram, fejenként —
// ugyanaz, amit a vevő a /how-we-work oldalon lát), a díjtételek itt
// szerkeszthetők és mentésük a publikus oldalakat is frissíti. A felület
// admin-only, mert a belső számok (óra-becslés, cél-óradíj, kedvezmény-
// keret) is itt élnek: a célja nem az árazás automatizálása, hanem hogy az
// alku előtt lássuk, mennyi marad a munkán.
//
// CRM-integráció: ?dealId= mellett a kalkulátor menteni tud (DRAFT quote a
// dealhez), ?from= egy meglévő quote inputját tölti be (DRAFT: szerkesztés,
// egyébként: másolat-alap). Deal nélkül sandbox marad — nem ment semmit.
//
// Ha a tanácsadói kör is ajánlatot ad majd, a kapu `isConsultantSurface`-re
// cserélhető — a számítás és a díjtételek változatlanul maradnak.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ajánlat-kalkulátor | trita admin",
  robots: { index: false, follow: false },
};

export default async function QuoteCalculatorPage({
  searchParams,
}: {
  searchParams: Promise<{ dealId?: string; from?: string }>;
}) {
  await requireAdmin();
  const { dealId, from } = await searchParams;
  const { rate, stored } = await loadRateCard();

  // ?from= — meglévő quote inputjának betöltése (DRAFT-szerkesztés vagy
  // másolat-alap). Csak akkor fogadjuk el, ha a megadott dealhez tartozik.
  let sourceQuote: {
    id: string;
    dealId: string;
    status: string;
    title: string | null;
    label: string;
    validUntil: Date | null;
  } | null = null;
  let initialInput: QuoteInput | undefined;

  if (from) {
    const quote = await prisma.quote.findUnique({
      where: { id: from },
      select: {
        id: true,
        dealId: true,
        status: true,
        title: true,
        quoteNo: true,
        createdAt: true,
        validUntil: true,
        input: true,
      },
    });
    if (quote && (!dealId || quote.dealId === dealId)) {
      // Az örökség-forma (programdíjas bemenet) átfordítva töltődik be.
      initialInput = readQuoteInput(quote.input) ?? undefined;
      sourceQuote = {
        id: quote.id,
        dealId: quote.dealId,
        status: quote.status,
        title: quote.title,
        label: formatQuoteNo(quote.quoteNo, quote.createdAt),
        validUntil: quote.validUntil,
      };
    }
  }

  const resolvedDealId = dealId ?? sourceQuote?.dealId;
  const deal = resolvedDealId
    ? await prisma.deal.findUnique({
        where: { id: resolvedDealId },
        select: { id: true, title: true, company: true, contactName: true },
      })
    : null;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <EditorialBackHeader
        href={deal ? `/admin/crm/${deal.id}` : "/admin"}
        backLabel={deal ? `Vissza az ügyhöz: ${deal.title}` : "Vissza az adminhoz"}
        eyebrow="belső eszköz"
        title="Ajánlat-kalkulátor"
        description="Szint × létszám a publikus árlétrából, plusz a szint tartalmán felüli tételek. A díjtételek mentése a publikus oldalak árait is frissíti. A vevőnek szánt összefoglaló a jobb alsó dobozban áll össze – belső számok (óradíj, padló, kedvezmény-keret) nincsenek benne."
      />

      <QuoteCalculator
        initialRate={rate}
        storedRate={stored}
        deal={deal ?? undefined}
        initialInput={initialInput}
        sourceQuote={
          sourceQuote && deal
            ? {
                id: sourceQuote.id,
                status: sourceQuote.status,
                title: sourceQuote.title,
                label: sourceQuote.label,
                validUntil: sourceQuote.validUntil?.toISOString() ?? null,
              }
            : undefined
        }
      />
    </main>
  );
}

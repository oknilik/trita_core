import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { loadRateCard } from "@/lib/quote/rate-card.server";
import { quoteInputSchema } from "@/lib/quote/rate-card";
import type { QuoteInput } from "@/lib/quote/calculate";
import { formatQuoteNo } from "@/lib/crm/guards";
import { QuoteCalculator } from "@/components/admin/quote/QuoteCalculator";

// Ajánlat-kalkulátor — BELSŐ eszköz.
//
// A platform nem publikál listaárat („egyedi ajánlat az első beszélgetés
// után"), ezért ez a felület admin-only, és a számai sehol máshol nem
// jelennek meg. A célja nem az árazás automatizálása, hanem hogy az alku
// előtt lássuk, mennyi marad a munkán.
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
      const parsed = quoteInputSchema.safeParse(quote.input);
      if (parsed.success) initialInput = parsed.data;
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
      <header>
        <SectionEyebrow>
          belső eszköz
        </SectionEyebrow>
        <h1 className="mt-1 font-fraunces text-2xl text-ink">Ajánlat-kalkulátor</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-body">
          Programdíj + degresszív fejenkénti mérési díj + utánkövetés. A vevőnek szánt
          összefoglaló a jobb alsó dobozban áll össze — belső számok (óradíj, padló,
          kedvezmény-keret) nincsenek benne.
        </p>
        <div className="mt-3 flex flex-wrap gap-4">
          <Link
            href="/admin"
            className="inline-block text-sm text-[var(--color-accent-primary-strong)] underline underline-offset-2"
          >
            ← Admin
          </Link>
          {deal && (
            <Link
              href={`/admin/crm/${deal.id}`}
              className="inline-block text-sm text-[var(--color-accent-primary-strong)] underline underline-offset-2"
            >
              ← Vissza a dealhez: {deal.title}
            </Link>
          )}
        </div>
      </header>

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

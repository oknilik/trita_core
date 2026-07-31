import type { Metadata } from "next";
import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { loadRateCard } from "@/lib/quote/rate-card.server";
import { QuoteCalculator } from "@/components/admin/quote/QuoteCalculator";

// Ajánlat-kalkulátor — BELSŐ eszköz.
//
// A platform nem publikál listaárat („egyedi ajánlat az első beszélgetés
// után"), ezért ez a felület admin-only, és a számai sehol máshol nem
// jelennek meg. A célja nem az árazás automatizálása, hanem hogy az alku
// előtt lássuk, mennyi marad a munkán.
//
// Ha a tanácsadói kör is ajánlatot ad majd, a kapu `isConsultantSurface`-re
// cserélhető — a számítás és a díjtételek változatlanul maradnak.

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Ajánlat-kalkulátor | trita admin",
  robots: { index: false, follow: false },
};

export default async function QuoteCalculatorPage() {
  await requireAdmin();
  const { rate, stored } = await loadRateCard();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-10">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest text-bronze">
          {"// belső eszköz"}
        </p>
        <h1 className="mt-1 font-fraunces text-2xl text-ink">Ajánlat-kalkulátor</h1>
        <p className="mt-2 max-w-prose text-sm leading-relaxed text-ink-body">
          Programdíj + degresszív fejenkénti mérési díj + utánkövetés. A vevőnek szánt
          összefoglaló a jobb alsó dobozban áll össze — belső számok (óradíj, padló,
          kedvezmény-keret) nincsenek benne.
        </p>
        <Link
          href="/admin"
          className="mt-3 inline-block text-sm text-bronze underline underline-offset-2"
        >
          ← Admin
        </Link>
      </header>

      <QuoteCalculator initialRate={rate} storedRate={stored} />
    </main>
  );
}

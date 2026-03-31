import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { PRODUCT_LAYERS_4_PLUS_2 } from "@/lib/domain/layers-4plus2";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AssessmentLayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [locale, { slug }] = await Promise.all([getServerLocale(), params]);
  const isHu = locale !== "en";

  const layer = PRODUCT_LAYERS_4_PLUS_2.find((item) => item.slug === slug);
  if (!layer) notFound();

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-4xl gap-8 px-4 py-10 md:gap-10"
    >
      <section className="rounded-2xl border border-sand bg-white p-6 md:p-8">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-bronze">
          {"// "}
          {isHu ? "Layer részlet" : "Layer detail"}
        </p>
        <h1 className="mt-2 font-fraunces text-3xl tracking-tight text-ink">
          {layer.label[isHu ? "hu" : "en"]}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-body">
          {layer.description[isHu ? "hu" : "en"]}
        </p>

        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-sand bg-cream p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
              {isHu ? "Típus" : "Type"}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{layer.type}</p>
          </div>
          <div className="rounded-xl border border-sand bg-cream p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
              {isHu ? "Sorrend" : "Order"}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{layer.order}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-sand bg-cream p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
            {isHu ? "Függőségek" : "Dependencies"}
          </p>
          {layer.dependencies.length === 0 ? (
            <p className="mt-1 text-sm text-ink-body">
              {isHu ? "Nincs függőség." : "No dependencies."}
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-body">{layer.dependencies.join(", ")}</p>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-sand bg-cream p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
            {isHu ? "Render célpontok" : "Render targets"}
          </p>
          <p className="mt-1 text-sm text-ink-body">
            results/{layer.renderingMap.results.surface} → {layer.renderingMap.results.sectionKey}
          </p>
          <p className="mt-1 text-sm text-ink-body">
            dashboard/{layer.renderingMap.dashboard.surface} → {layer.renderingMap.dashboard.sectionKey}
          </p>
        </div>

        <div className="mt-6">
          <Link
            href="/assessment-layers"
            className="inline-flex min-h-[42px] items-center rounded-lg bg-ink px-4 text-[13px] font-semibold text-white"
          >
            {isHu ? "Vissza a rétegekhez" : "Back to layers"}
          </Link>
        </div>
      </section>
    </PlatformPageShell>
  );
}

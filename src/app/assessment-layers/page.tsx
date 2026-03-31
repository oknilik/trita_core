import Link from "next/link";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { PRODUCT_LAYERS_4_PLUS_2 } from "@/lib/domain/layers-4plus2";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assessment Layers | Trita",
  robots: { index: false, follow: false },
};

export default async function AssessmentLayersPage() {
  const locale = await getServerLocale();
  const isHu = locale !== "en";

  const layers = [...PRODUCT_LAYERS_4_PLUS_2].sort((a, b) => a.order - b.order);

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-5xl gap-8 px-4 py-10 md:gap-10"
    >
      <section>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-bronze">
          {"// "}
          {isHu ? "Assessment layers" : "Assessment layers"}
        </p>
        <h1 className="mt-2 font-fraunces text-3xl tracking-tight text-ink md:text-4xl">
          {isHu ? "4+2 rétegstruktúra" : "4+2 layer structure"}
        </h1>
        <p className="mt-2 max-w-3xl text-sm text-ink-body">
          {isHu
            ? "Ez a célroute a layer-alapú journey felépítését készíti elő. A meglévő self/team/org felületek már ugyanebből a domain modellből számolhatnak."
            : "This target route prepares the layer-based journey structure. Existing self/team/org screens can already resolve from the same domain model."}
        </p>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {layers.map((layer) => (
          <Link
            key={layer.id}
            href={`/assessment-layers/${layer.slug}`}
            className="rounded-2xl border border-sand bg-white p-5 transition-colors hover:border-sage/40"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">
                {layer.label[isHu ? "hu" : "en"]}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  layer.type === "core"
                    ? "bg-sage-soft text-sage-dark"
                    : "bg-bronze/15 text-bronze-dark"
                }`}
              >
                {layer.type}
              </span>
            </div>
            <p className="mt-2 text-[12px] leading-relaxed text-ink-body">
              {layer.description[isHu ? "hu" : "en"]}
            </p>
            <p className="mt-3 text-[11px] font-medium text-muted">
              {isHu ? "Sorrend" : "Order"}: {layer.order}
            </p>
          </Link>
        ))}
      </section>
    </PlatformPageShell>
  );
}

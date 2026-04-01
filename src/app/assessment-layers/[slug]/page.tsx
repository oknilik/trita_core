import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { PRODUCT_LAYERS_4_PLUS_2 } from "@/lib/domain/layers-4plus2";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function AssessmentLayerDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const [rawLocale, { slug }] = await Promise.all([getServerLocale(), params]);
  const locale = rawLocale as Locale;
  const langKey = locale === "hu" ? "hu" : "en";

  const layer = PRODUCT_LAYERS_4_PLUS_2.find((item) => item.slug === slug);
  if (!layer) notFound();

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-4xl gap-8 px-4 py-10 md:gap-10"
      chrome={{
        breadcrumb: [
          { label: t("nav.home", locale), href: JOURNEY_HOME_HANDOFF_PATH },
          { label: t("assessmentLayers.title", locale), href: "/assessment-layers" },
          { label: layer.label[langKey] },
        ],
        title: layer.label[langKey],
        subtitle: layer.description[langKey],
        topbar: (
          <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-bronze">
            {"// "}
            {t("assessmentLayers.detailEyebrow", locale)}
          </p>
        ),
      }}
    >
      <section className="rounded-2xl border border-sand bg-white p-6 md:p-8">
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-sand bg-cream p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
              {t("assessmentLayers.type", locale)}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{layer.type}</p>
          </div>
          <div className="rounded-xl border border-sand bg-cream p-4">
            <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
              {t("assessmentLayers.order", locale)}
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">{layer.order}</p>
          </div>
        </div>

        <div className="mt-4 rounded-xl border border-sand bg-cream p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
            {t("assessmentLayers.dependencies", locale)}
          </p>
          {layer.dependencies.length === 0 ? (
            <p className="mt-1 text-sm text-ink-body">
              {t("assessmentLayers.noDependencies", locale)}
            </p>
          ) : (
            <p className="mt-1 text-sm text-ink-body">{layer.dependencies.join(", ")}</p>
          )}
        </div>

        <div className="mt-4 rounded-xl border border-sand bg-cream p-4">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted">
            {t("assessmentLayers.renderTargets", locale)}
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
            {t("assessmentLayers.backToLayers", locale)}
          </Link>
        </div>
      </section>
    </PlatformPageShell>
  );
}

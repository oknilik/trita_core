import Link from "next/link";
import type { Metadata } from "next";
import { getServerLocale } from "@/lib/i18n-server";
import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { PRODUCT_LAYERS_4_PLUS_2 } from "@/lib/domain/layers-4plus2";
import { PlatformPageShell } from "@/components/layout/PlatformPageShell";
import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Assessment Layers | trita",
  robots: { index: false, follow: false },
};

export default async function AssessmentLayersPage() {
  const locale = (await getServerLocale()) as Locale;
  const langKey = locale === "hu" ? "hu" : "en";

  const layers = [...PRODUCT_LAYERS_4_PLUS_2].sort((a, b) => a.order - b.order);

  return (
    <PlatformPageShell
      surface="self"
      contentClassName="max-w-5xl gap-8 px-4 py-10 md:gap-10"
      chrome={{
        breadcrumb: [
          { label: t("nav.home", locale), href: JOURNEY_HOME_HANDOFF_PATH },
          { label: t("assessmentLayers.title", locale) },
        ],
        eyebrow: t("assessmentLayers.eyebrow", locale),
        title: t("assessmentLayers.title", locale),
        subtitle: t("assessmentLayers.description", locale),
      }}
    >
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {layers.map((layer) => (
          <Link
            key={layer.id}
            href={`/assessment-layers/${layer.slug}`}
            className="rounded-2xl border border-sand bg-surface-card p-5 transition-colors hover:border-sage/40"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-ink">
                {layer.label[langKey]}
              </p>
              <span
                className={`rounded-full px-2.5 py-0.5 text-micro font-semibold uppercase tracking-widest ${
                  layer.type === "core"
                    ? "bg-sage-soft text-sage-dark"
                    : "bg-bronze/15 text-bronze-dark"
                }`}
              >
                {layer.type}
              </span>
            </div>
            <p className="mt-2 text-xs leading-relaxed text-ink-body">
              {layer.description[langKey]}
            </p>
            <p className="mt-3 text-note font-medium text-muted">
              {t("assessmentLayers.order", locale)}: {layer.order}
            </p>
          </Link>
        ))}
      </section>
    </PlatformPageShell>
  );
}

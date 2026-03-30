import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";

type Path = "self" | "team" | "org";

// ── Shared section wrapper ──────────────────────────────────────────────────

function BlockSection({
  label,
  title,
  subtitle,
  bg = "bg-transparent",
  children,
}: {
  label: string;
  title: string;
  subtitle: string;
  bg?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={`border-t border-sand px-6 py-12 lg:px-16 lg:py-14 ${bg}`}>
      <div className="mx-auto max-w-5xl">
        <div className="mb-2.5 flex items-center gap-2">
          <div className="h-px w-4 bg-[#c17f4a]" />
          <span className="text-[9px] font-medium uppercase tracking-[2px] text-[#c17f4a]">
            {label}
          </span>
        </div>
        <h2 className="mt-2 font-fraunces text-3xl text-ink md:text-4xl">
          {title}
        </h2>
        <p className="mt-2 max-w-lg text-sm text-ink-body">{subtitle}</p>
        <div className="mt-8">{children}</div>
      </div>
    </section>
  );
}

// ── Card variants ───────────────────────────────────────────────────────────

function PricingCard({ name, desc, price }: { name: string; desc: string; price: string }) {
  return (
    <div className="rounded-xl border border-sand bg-white p-5">
      <p className="font-mono text-[10px] uppercase tracking-widest text-muted">{name}</p>
      <p className="mt-2 font-fraunces text-3xl text-ink">{price}</p>
      <p className="mt-1.5 text-sm text-ink-body">{desc}</p>
    </div>
  );
}

function FeatureCard({ name, desc }: { name: string; desc: string }) {
  return (
    <div className="rounded-xl border border-sand bg-white p-5">
      <p className="text-sm font-semibold text-ink">{name}</p>
      <p className="mt-1.5 text-[13px] text-ink-body">{desc}</p>
    </div>
  );
}

function StepList({ steps }: { steps: string[] }) {
  return (
    <div className="flex flex-col gap-3">
      {steps.map((step, i) => (
        <div key={i} className="flex items-start gap-3.5 rounded-xl border border-sand bg-white px-5 py-4">
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#3d6b5e] font-mono text-xs font-bold text-white">
            {i + 1}
          </span>
          <p className="pt-0.5 text-sm leading-relaxed text-ink-body">{step}</p>
        </div>
      ))}
    </div>
  );
}

// ── Tab-specific block content ──────────────────────────────────────────────

function SelfBlocks({ locale }: { locale: Locale }) {
  const items = [1, 2, 3].map((i) => ({
    name: t(`pricingBlocks.selfBlock1Item${i}Name`, locale),
    desc: t(`pricingBlocks.selfBlock1Item${i}Desc`, locale),
    price: t(`pricingBlocks.selfBlock1Item${i}Price`, locale),
  }));

  const steps = [1, 2, 3, 4].map((i) => t(`pricingBlocks.selfBlock2Step${i}`, locale));

  return (
    <>
      <BlockSection
        label={t("pricingBlocks.selfBlock1Label", locale)}
        title={t("pricingBlocks.selfBlock1Title", locale)}
        subtitle={t("pricingBlocks.selfBlock1Sub", locale)}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {items.map((item) => (
            <PricingCard key={item.name} {...item} />
          ))}
        </div>
      </BlockSection>

      <BlockSection
        label={t("pricingBlocks.selfBlock2Label", locale)}
        title={t("pricingBlocks.selfBlock2Title", locale)}
        subtitle={t("pricingBlocks.selfBlock2Sub", locale)}
        bg="bg-white"
      >
        <StepList steps={steps} />
      </BlockSection>
    </>
  );
}

function TeamBlocks({ locale }: { locale: Locale }) {
  const guidanceItems = [1, 2, 3].map((i) => ({
    name: t(`pricingBlocks.teamBlock1Item${i}Name`, locale),
    desc: t(`pricingBlocks.teamBlock1Item${i}Desc`, locale),
    price: t(`pricingBlocks.teamBlock1Item${i}Price`, locale),
  }));

  const addonItems = [1, 2, 3].map((i) => ({
    name: t(`pricingBlocks.teamBlock2Item${i}Name`, locale),
    desc: t(`pricingBlocks.teamBlock2Item${i}Desc`, locale),
    price: t(`pricingBlocks.teamBlock2Item${i}Price`, locale),
  }));

  return (
    <>
      <BlockSection
        label={t("pricingBlocks.teamBlock1Label", locale)}
        title={t("pricingBlocks.teamBlock1Title", locale)}
        subtitle={t("pricingBlocks.teamBlock1Sub", locale)}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {guidanceItems.map((item) => (
            <PricingCard key={item.name} {...item} />
          ))}
        </div>
      </BlockSection>

      <BlockSection
        label={t("pricingBlocks.teamBlock2Label", locale)}
        title={t("pricingBlocks.teamBlock2Title", locale)}
        subtitle={t("pricingBlocks.teamBlock2Sub", locale)}
        bg="bg-cream"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {addonItems.map((item) => (
            <PricingCard key={item.name} {...item} />
          ))}
        </div>
      </BlockSection>
    </>
  );
}

function OrgBlocks({ locale }: { locale: Locale }) {
  const featureItems = [1, 2, 3, 4].map((i) => ({
    name: t(`pricingBlocks.orgBlock1Item${i}Name`, locale),
    desc: t(`pricingBlocks.orgBlock1Item${i}Desc`, locale),
  }));

  const addonItems = [1, 2, 3, 4].map((i) => ({
    name: t(`pricingBlocks.orgBlock2Item${i}Name`, locale),
    desc: t(`pricingBlocks.orgBlock2Item${i}Desc`, locale),
    price: t(`pricingBlocks.orgBlock2Item${i}Price`, locale),
  }));

  return (
    <>
      <BlockSection
        label={t("pricingBlocks.orgBlock1Label", locale)}
        title={t("pricingBlocks.orgBlock1Title", locale)}
        subtitle={t("pricingBlocks.orgBlock1Sub", locale)}
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {featureItems.map((item) => (
            <FeatureCard key={item.name} {...item} />
          ))}
        </div>
      </BlockSection>

      <BlockSection
        label={t("pricingBlocks.orgBlock2Label", locale)}
        title={t("pricingBlocks.orgBlock2Title", locale)}
        subtitle={t("pricingBlocks.orgBlock2Sub", locale)}
        bg="bg-cream"
      >
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {addonItems.map((item) => (
            <PricingCard key={item.name} {...item} />
          ))}
        </div>
      </BlockSection>
    </>
  );
}

// ── Main export ─────────────────────────────────────────────────────────────

export function ContextualBlocks({
  activeTab,
  locale,
}: {
  activeTab: Path;
  locale: Locale;
}) {
  return (
    <div
      key={activeTab}
      style={{ animation: "fade-in 0.25s ease-out" }}
    >
      {activeTab === "self" && <SelfBlocks locale={locale} />}
      {activeTab === "team" && <TeamBlocks locale={locale} />}
      {activeTab === "org" && <OrgBlocks locale={locale} />}
    </div>
  );
}

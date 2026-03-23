"use client";

import { useState } from "react";
import Link from "next/link";
import { getSelfPricingPlans, getTeamPricingPlans, getOrgPricingPlans } from "@/lib/pricing";
import type { Locale } from "@/lib/i18n";

type Tab = "self" | "team" | "org";

const copy: Record<
  Locale,
  {
    eyebrow: string;
    heading: string;
    sub: string;
    viewAll: string;
    custom: string;
    contactUs: string;
    startFree: string;
    startSolo: string;
    startTeam: string;
    startOrg: string;
    tabSelf: string;
    tabTeam: string;
    tabOrg: string;
    addOnTeam: string;
    addOnOrg: string;
  }
> = {
  hu: {
    eyebrow: "04 — Árazás",
    heading: "Egyszerű árazás.\nNincs meglepetés.",
    sub: "Éves számlázással. 14 napos ingyenes próba, kártyaadat nélkül.",
    viewAll: "Részletes összehasonlítás →",
    custom: "Egyedi",
    contactUs: "Kapcsolat →",
    startFree: "Regisztrálok ingyen",
    startSolo: "Kipróbálom ingyen",
    startTeam: "Kipróbálom 14 napig",
    startOrg: "Elindítom",
    tabSelf: "Egyéneknek",
    tabTeam: "Csapatoknak",
    tabOrg: "Szervezeteknek",
    addOnTeam: "Extra seat: +€19/fő/hó · Jelölt értékelés: +€39/értékelés",
    addOnOrg: "Extra seat: +€19/fő/hó · Jelölt értékelés: +€39/értékelés",
  },
  en: {
    eyebrow: "04 — Pricing",
    heading: "Simple pricing.\nNo surprises.",
    sub: "Annual billing. 14-day free trial, no credit card required.",
    viewAll: "Detailed comparison →",
    custom: "Custom",
    contactUs: "Contact us →",
    startFree: "Sign up free",
    startSolo: "Try for free",
    startTeam: "Try free for 14 days",
    startOrg: "Get started",
    tabSelf: "For individuals",
    tabTeam: "For teams",
    tabOrg: "For organizations",
    addOnTeam: "Extra seat: +€19/user/mo · Candidate assessment: +€39/assessment",
    addOnOrg: "Extra seat: +€19/user/mo · Candidate assessment: +€39/assessment",
  },
};

function PlanCard({
  name,
  price,
  perMonth,
  seats,
  features,
  badge,
  ctaHref,
  ctaLabel,
  featured,
  isCustom,
}: {
  name: string;
  price: string;
  perMonth: string;
  seats: string;
  features: string[];
  badge?: string;
  ctaHref: string;
  ctaLabel: string;
  featured?: boolean;
  isCustom?: boolean;
}) {
  return (
    <div
      className={`relative flex flex-col overflow-hidden rounded-2xl border ${
        featured ? "border-sage/40 bg-ink text-white" : "border-sand bg-cream text-ink"
      }`}
    >
      {badge && (
        <div className="absolute right-4 top-4">
          <span className="font-dm-sans rounded-full bg-sage px-2.5 py-0.5 text-[10px] uppercase tracking-widest text-white">
            {badge}
          </span>
        </div>
      )}

      <div className={`px-5 pb-4 pt-5 ${featured ? "border-b border-white/10" : "border-b border-sand"}`}>
        <p className={`font-dm-sans mb-3 text-[10px] uppercase tracking-[2px] ${featured ? "text-white/40" : "text-ink-body"}`}>
          {name}
        </p>
        {isCustom ? (
          <div className="font-fraunces text-[34px] font-normal leading-none tracking-[-1px]">
            {price}
          </div>
        ) : (
          <div className="flex items-baseline gap-1">
            <span className="font-fraunces text-[38px] font-normal leading-none tracking-[-2px]">
              {price}
            </span>
            {perMonth && (
              <span className={`font-dm-sans text-sm font-light ${featured ? "text-white/50" : "text-ink-body"}`}>
                {perMonth}
              </span>
            )}
          </div>
        )}
        <p className={`mt-1.5 text-[12px] ${featured ? "text-white/40" : "text-ink-body"}`}>
          {seats}
        </p>
      </div>

      <ul className="flex flex-1 flex-col gap-2.5 px-5 py-4">
        {features.map((f) => (
          <li key={f} className={`flex items-start gap-2 text-[13px] ${featured ? "text-white/75" : "text-ink-body"}`}>
            <span className={`mt-0.5 shrink-0 text-[11px] font-bold ${featured ? "text-bronze" : "text-sage"}`}>✓</span>
            {f}
          </li>
        ))}
      </ul>

      <div className="px-5 pb-5">
        <Link
          href={ctaHref}
          className={`inline-flex min-h-[44px] w-full items-center justify-center rounded-xl text-[14px] font-medium transition-all hover:-translate-y-px ${
            featured
              ? "bg-sage text-white hover:bg-sage-dark"
              : "border border-sand bg-white text-ink hover:border-sage/40 hover:text-bronze"
          }`}
        >
          {ctaLabel}
        </Link>
      </div>
    </div>
  );
}

export function PricingSection({ locale }: { locale: Locale }) {
  const c = copy[locale] ?? copy.hu;
  const selfPlans = getSelfPricingPlans(locale);
  const teamPlans = getTeamPricingPlans(locale);
  const orgPlans = getOrgPricingPlans(locale);
  const [headingLine1, headingLine2] = c.heading.split("\n");
  const [tab, setTab] = useState<Tab>("self");

  const tabs: { id: Tab; label: string }[] = [
    { id: "self", label: c.tabSelf },
    { id: "team", label: c.tabTeam },
    { id: "org", label: c.tabOrg },
  ];

  return (
    <section id="pricing" className="border-b border-sand px-6 py-12 md:px-16 md:py-20">
      <div className="overflow-hidden rounded-3xl border border-sand">
        {/* Dark header */}
        <div className="bg-ink px-8 py-10 md:px-12">
          <div className="font-dm-sans mb-3 text-[11px] uppercase tracking-[2px] text-white/30">
            {c.eyebrow}
          </div>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <h2 className="font-fraunces text-[clamp(28px,5vw,44px)] font-normal leading-[1.1] tracking-[-1px] text-white md:tracking-[-1.5px]">
              {headingLine1}
              <br />
              {headingLine2}
            </h2>
            <p className="font-dm-sans text-[12px] text-white/40 md:text-right">
              {c.sub}
            </p>
          </div>

          {/* Tab switcher */}
          <div className="mt-8 inline-flex rounded-lg border border-white/10 p-1">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`font-dm-sans rounded-md px-5 py-2 text-[13px] font-medium transition-all ${
                  tab === t.id
                    ? "bg-white text-ink"
                    : "text-white/50 hover:text-white/80"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {/* White body */}
        <div className="bg-white p-6 md:p-8">
          {tab === "self" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:max-w-2xl">
              {selfPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  name={plan.name}
                  price={plan.price}
                  perMonth={plan.perMonth}
                  seats={plan.seats}
                  features={plan.features}
                  badge={plan.badge}
                  ctaHref={plan.ctaHref}
                  ctaLabel={plan.id === "solo" ? c.startSolo : c.startFree}
                  featured={plan.id === "solo"}
                />
              ))}
            </div>
          )}

          {tab === "team" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:max-w-2xl">
              {teamPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  name={plan.name}
                  price={plan.price}
                  perMonth={plan.perMonth}
                  seats={plan.seats}
                  features={plan.features}
                  badge={plan.badge}
                  ctaHref={plan.ctaHref}
                  ctaLabel={c.startTeam}
                  featured={plan.id === "team"}
                />
              ))}
            </div>
          )}

          {tab === "org" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:max-w-2xl">
              {orgPlans.map((plan) => (
                <PlanCard
                  key={plan.id}
                  name={plan.name}
                  price={plan.price}
                  perMonth={plan.perMonth}
                  seats={plan.seats}
                  features={plan.features}
                  badge={plan.badge}
                  ctaHref={plan.ctaHref}
                  ctaLabel={plan.isCustom ? c.contactUs : c.startOrg}
                  featured={plan.id === "org"}
                  isCustom={plan.isCustom}
                />
              ))}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <p className="font-dm-sans text-[11px] text-ink-body">
              {tab === "team" && c.addOnTeam}
              {tab === "org" && c.addOnOrg}
            </p>
            <Link
              href="/pricing"
              className="font-dm-sans text-[11px] text-ink-body transition-colors hover:text-bronze"
            >
              {c.viewAll}
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

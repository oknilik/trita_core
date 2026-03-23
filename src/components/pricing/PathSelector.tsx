"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { SelfTierPanel } from "./SelfTierPanel";
import { TeamTierPanel } from "./TeamTierPanel";
import { OrgTierPanel } from "./OrgTierPanel";

type Path = "self" | "team" | "org";

const tabs: Record<Locale, { id: Path; label: string; sub: string }[]> = {
  hu: [
    { id: "self", label: "Egyéni", sub: "önismeret és fejlődés" },
    { id: "team", label: "Csapat", sub: "egyszeri felmérés" },
    { id: "org", label: "Szervezet", sub: "előfizetés" },
  ],
  en: [
    { id: "self", label: "Individual", sub: "self-awareness & growth" },
    { id: "team", label: "Team", sub: "one-time assessment" },
    { id: "org", label: "Organization", sub: "subscription" },
  ],
};

export function PathSelector({
  locale,
  isLoggedIn,
}: {
  locale: Locale;
  isLoggedIn: boolean;
}) {
  const [active, setActive] = useState<Path>("team");
  const tabList = tabs[locale] ?? tabs.hu;

  return (
    <section className="px-6 py-12 lg:px-16 lg:py-14">
      <div className="mx-auto max-w-5xl">
        {/* Tab bar */}
        <div className="flex flex-col gap-2 sm:flex-row sm:gap-1 rounded-xl border border-sand bg-white p-1.5 mb-8">
          {tabList.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`flex-1 flex flex-col items-center rounded-lg px-4 py-3 text-sm font-semibold transition-colors min-h-[44px] ${
                active === tab.id
                  ? "bg-ink text-white"
                  : "text-ink-body hover:bg-cream"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`mt-0.5 font-mono text-[10px] font-normal uppercase tracking-widest ${
                  active === tab.id ? "text-white/60" : "text-muted"
                }`}
              >
                {tab.sub}
              </span>
            </button>
          ))}
        </div>

        {/* Active panel */}
        {active === "self" && (
          <SelfTierPanel locale={locale} isLoggedIn={isLoggedIn} />
        )}
        {active === "team" && (
          <TeamTierPanel locale={locale} isLoggedIn={isLoggedIn} />
        )}
        {active === "org" && (
          <OrgTierPanel locale={locale} isLoggedIn={isLoggedIn} />
        )}
      </div>
    </section>
  );
}

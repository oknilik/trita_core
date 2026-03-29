"use client";

import { useState } from "react";
import type { Locale } from "@/lib/i18n";
import { t } from "@/lib/i18n";
import { SelfTierPanel } from "./SelfTierPanel";
import { TeamTierPanel } from "./TeamTierPanel";
import { OrgTierPanel } from "./OrgTierPanel";

type Path = "self" | "team" | "org";

export function PathSelector({
  locale,
  isLoggedIn,
}: {
  locale: Locale;
  isLoggedIn: boolean;
}) {
  const [active, setActive] = useState<Path>("team");
  const tabList: { id: Path; label: string; sub: string }[] = [
    { id: "self", label: t("pricing.tabSelfLabel", locale), sub: t("pricing.tabSelfSub", locale) },
    { id: "team", label: t("pricing.tabTeamLabel", locale), sub: t("pricing.tabTeamSub", locale) },
    { id: "org", label: t("pricing.tabOrgLabel", locale), sub: t("pricing.tabOrgSub", locale) },
  ];

  return (
    <section className="px-6 py-12 lg:px-16 lg:py-14">
      <div className="mx-auto max-w-5xl">
        {/* Tab bar */}
        <div className="mb-8 flex flex-col gap-2 rounded-xl border border-[#ddd5c8] bg-white p-1.5 sm:flex-row sm:gap-1">
          {tabList.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActive(tab.id)}
              className={`flex min-h-[44px] flex-1 flex-col items-center rounded-lg px-4 py-3 text-sm font-semibold transition-all ${
                active === tab.id
                  ? "bg-[#3d6b5e] text-white shadow-md shadow-[#3d6b5e]/15"
                  : "text-[#4a4a5e] hover:bg-[#f2ede6]"
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`mt-0.5 text-[10px] font-normal uppercase tracking-widest ${
                  active === tab.id ? "text-white/60" : "text-[#8a8a9a]"
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

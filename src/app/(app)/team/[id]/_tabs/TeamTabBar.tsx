import Link from "next/link";
import { t } from "@/lib/i18n";
import type { TeamTabContext } from "./types";

// ─────────────────────────────────────────────────────────────────────
// Egységes fül-sor a team-oldalra (UX-audit #15): az org-oldal
// PrimaryTabs-kinézete, de LINK-alapon — a team-tabok külön szerver-
// rendereket kapnak (?tab=), nincs kliens-állapot. A korábbi navigációs
// modell (hero-akciógombok + „Vissza a…" linkek) helyett a szem egy
// helyen tanulja meg a belső navigációt, ugyanúgy, mint az orgnál.
// ─────────────────────────────────────────────────────────────────────

export function TeamTabBar({
  ctx,
  active,
}: {
  ctx: TeamTabContext;
  active: string;
}) {
  const { teamId, teamData, locale, isHu, canViewRaw, hasPublishedReport } = ctx;

  const tabs: { key: string; label: string; shortLabel?: string; badge?: number }[] = [
    { key: "overview", label: isHu ? "Áttekintés" : "Overview" },
    {
      key: "members",
      label: t("teamComp.tabMembers", locale),
      badge: teamData.memberCount + teamData.pendingInvites.length,
    },
    ...(canViewRaw
      ? [
          {
            key: "intelligence",
            label: isHu ? "Elemzések" : "Analysis",
          },
        ]
      : []),
    ...(canViewRaw || hasPublishedReport
      ? [{ key: "report", label: isHu ? "Riport" : "Report" }]
      : []),
  ];

  return (
    <div className="relative">
      <div className="overflow-x-auto pb-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="inline-flex min-w-full gap-1.5 rounded-2xl border border-sand bg-surface-card p-1.5 pr-8 shadow-[0_10px_28px_rgba(26,26,46,0.04)] md:pr-1.5">
        {tabs.map((tab) => {
          const isActive = tab.key === active;
          return (
            <Link
              key={tab.key}
              href={`/team/${teamId}?tab=${tab.key}`}
              // scroll={false}: fülváltásnál a viewport marad, a tartalom a
              // fül-sor alatt cserélődik — nem „külön oldal betöltése" érzés.
              scroll={false}
              aria-current={isActive ? "page" : undefined}
              className={[
                "inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-caption whitespace-nowrap transition-all",
                isActive
                  ? "bg-sage-soft text-ink font-semibold shadow-[inset_0_0_0_1px_rgba(61,107,94,0.12)]"
                  : "text-muted font-medium hover:bg-cream hover:text-ink-body",
              ].join(" ")}
            >
              {tab.shortLabel ? (
                <>
                  <span className="md:hidden">{tab.shortLabel}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                </>
              ) : (
                tab.label
              )}
              {tab.badge !== undefined && (
                <span
                  className={[
                    "rounded-full px-2 py-0.5 text-micro font-semibold leading-none",
                    isActive
                      ? "bg-surface-card text-sage-dark shadow-[0_1px_2px_rgba(26,26,46,0.06)]"
                      : "bg-warm text-bronze-dark",
                  ].join(" ")}
                >
                  {tab.badge}
                </span>
              )}
            </Link>
          );
        })}
        </div>
      </div>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-y-0 right-0 w-10 rounded-r-2xl bg-gradient-to-l from-surface-card via-surface-card/85 to-transparent md:hidden"
      />
      <span className="sr-only">{isHu ? "A fülek oldalra görgethetők." : "Tabs can be scrolled horizontally."}</span>
    </div>
  );
}

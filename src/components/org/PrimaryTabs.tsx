"use client";

export interface TabDef {
  key: string;
  label: string;
  shortLabel?: string;
  badge?: number | string;
}

interface PrimaryTabsProps {
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function PrimaryTabs({ tabs, activeTab, onTabChange }: PrimaryTabsProps) {
  return (
    <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div className="inline-flex min-w-full gap-1.5 rounded-2xl border border-sand bg-white p-1.5 shadow-[0_10px_28px_rgba(26,26,46,0.04)]">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={[
              "inline-flex min-h-[48px] flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-[13px] whitespace-nowrap transition-all",
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
            {tab.badge !== undefined && tab.badge !== null && (
              <span
                className={[
                  "rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none",
                  isActive
                    ? "bg-white text-sage-dark shadow-[0_1px_2px_rgba(26,26,46,0.06)]"
                    : "bg-warm text-bronze-dark",
                ].join(" ")}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
      </div>
    </div>
  );
}

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
    <div className="flex gap-1 overflow-x-auto rounded-xl border border-sand bg-white p-1 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={[
              "inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-[13px] font-medium whitespace-nowrap transition-all",
              isActive
                ? "bg-ink text-white shadow-sm"
                : "text-muted hover:bg-cream hover:text-ink-body",
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
                  "rounded-full px-[6px] py-px text-[9px] font-semibold leading-none",
                  isActive
                    ? "bg-white/20 text-white"
                    : "bg-sand text-ink-body",
                ].join(" ")}
              >
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

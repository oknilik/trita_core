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
    <div className="flex items-end gap-0 overflow-x-auto border-b border-[#e8e4dc] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onTabChange(tab.key)}
            className={[
              "inline-flex min-h-[44px] items-center px-[18px] py-[10px] text-[13px] border-b-2 transition-colors whitespace-nowrap",
              isActive
                ? "border-[#c8410a] text-[#1a1814] font-semibold"
                : "border-transparent text-[#a09a90] font-normal hover:text-[#3d3a35]",
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
              <span className="ml-1.5 rounded-full bg-[#c8410a] px-[5px] py-px text-[9px] font-semibold text-white leading-none">
                {tab.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

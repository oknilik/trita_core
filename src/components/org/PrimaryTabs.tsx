"use client";

export interface TabDef {
  key: string;
  label: string;
  shortLabel?: string;
  badge?: number | string;
}

interface PrimaryTabsProps {
  idPrefix: string;
  label: string;
  tabs: TabDef[];
  activeTab: string;
  onTabChange: (key: string) => void;
}

export function PrimaryTabs({ tabs, activeTab, onTabChange, idPrefix, label }: PrimaryTabsProps) {
  return (
    <div className="overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
      <div role="tablist" aria-label={label} className="inline-flex min-w-full gap-1.5 rounded-2xl border border-sand bg-surface-card p-1.5 shadow-[0_10px_28px_rgba(26,26,46,0.04)]">
      {tabs.map((tab) => {
        const isActive = tab.key === activeTab;
        return (
          <button
            key={tab.key}
            id={`${idPrefix}-${tab.key}`}
            role="tab"
            aria-selected={isActive}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={isActive ? 0 : -1}
            type="button"
            onClick={() => onTabChange(tab.key)}
            onKeyDown={(event) => {
              const index = tabs.findIndex((item) => item.key === tab.key);
              const next = event.key === "ArrowRight" ? (index + 1) % tabs.length
                : event.key === "ArrowLeft" ? (index - 1 + tabs.length) % tabs.length
                  : event.key === "Home" ? 0 : event.key === "End" ? tabs.length - 1 : null;
              if (next === null) return;
              event.preventDefault();
              onTabChange(tabs[next].key);
              document.getElementById(`${idPrefix}-${tabs[next].key}`)?.focus();
            }}
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
            {tab.badge !== undefined && tab.badge !== null && (
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
          </button>
        );
      })}
      </div>
    </div>
  );
}

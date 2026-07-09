import { getDimensionTier, tierColors } from "@/lib/dimension-utils";

interface DimBar {
  label: string;
  value: number;
}

interface WorkStyleSectionProps {
  introText: string;
  dimensions: DimBar[];
  isUnlocked: boolean;
}

export function WorkStyleSection({ introText, dimensions, isUnlocked }: WorkStyleSectionProps) {
  if (!isUnlocked) return null;

  return (
    <div className="border-t border-[var(--color-border-soft)] py-8">
      {/* Intro banner */}
      <div className="mb-6 rounded-xl border-[1.5px] border-[var(--color-accent-primary)]/20 bg-[var(--color-surface-highlight-warm)] p-5">
        <p className="font-fraunces text-sm italic leading-relaxed text-[var(--color-text-secondary)]">
          {introText}
        </p>
      </div>

      {/* Dimension bars */}
      <p className="mb-4 text-[10px] uppercase tracking-widest text-[var(--color-text-muted)]">
        Dimenzióprofil
      </p>
      <div className="flex flex-col gap-3">
        {dimensions.map((dim) => {
          const tier = getDimensionTier(dim.value);
          const colors = tierColors[tier];
          const tierLabel = tier === "high" ? "magas" : tier === "mid" ? "közepes" : "alacsony";
          return (
            <div key={dim.label}>
              <p className="mb-1 text-[13px] font-medium text-[var(--color-text-primary)]">{dim.label}</p>
              <div className="relative mb-1 h-1 w-full overflow-hidden rounded-sm bg-[var(--color-border-default)]">
                <div
                  className={`h-full rounded-sm ${colors.fill}`}
                  style={{ width: `${dim.value}%` }}
                />
              </div>
              <p className={`text-[10px] text-right ${colors.text}`}>{tierLabel}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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
    <div className="border-t border-[#e8e0d3] py-8">
      {/* Intro banner */}
      <div className="mb-6 rounded-xl border-[1.5px] border-[#c17f4a]/20 bg-[#fdf5ee] p-5">
        <p className="font-fraunces text-sm italic leading-relaxed text-[#4a4a5e]">
          {introText}
        </p>
      </div>

      {/* Dimension bars */}
      <p className="mb-4 text-[10px] uppercase tracking-widest text-[#8a8a9a]">
        Dimenzióprofil
      </p>
      <div className="flex flex-col gap-3">
        {dimensions.map((dim) => {
          const tier = getDimensionTier(dim.value);
          const colors = tierColors[tier];
          const tierLabel = tier === "high" ? "magas" : tier === "mid" ? "közepes" : "alacsony";
          return (
            <div key={dim.label}>
              <p className="mb-1 text-[13px] font-medium text-[#1a1a2e]">{dim.label}</p>
              <div className="relative mb-1 h-1 w-full overflow-hidden rounded-sm bg-[#e8e0d3]">
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

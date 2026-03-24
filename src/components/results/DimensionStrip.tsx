import { getDimensionTier, getDimensionLabel, tierColors } from "@/lib/dimension-utils";

interface Dimension {
  name: string;
  shortName: string;
  value: number;
}

export function DimensionStrip({ dimensions }: { dimensions: Dimension[] }) {
  return (
    <div className="w-full border-b border-[#e8e0d3] bg-white rounded-xl overflow-hidden">
      <div className="grid grid-cols-6">
        {dimensions.map((dim, i) => {
          const tier = getDimensionTier(dim.value);
          const colors = tierColors[tier];
          return (
            <div
              key={dim.name}
              className={`px-2.5 py-4 text-center transition-colors hover:bg-[#f2ede6] ${
                i < dimensions.length - 1 ? "border-r border-[#e8e0d3]" : ""
              }`}
            >
              <p className="mb-1.5 text-[10px] text-[#8a8a9a]">
                {dim.shortName}
              </p>
              <p
                className={`mb-1.5 font-fraunces text-[22px] leading-none ${colors.text}`}
              >
                {dim.value}
              </p>
              <span
                className={`inline-block rounded px-[7px] py-[2px] text-[8px] font-semibold ${colors.tagBg} ${colors.tagText}`}
              >
                {getDimensionLabel(dim.value)}
              </span>
              <div className="mx-auto mt-2 h-[3px] w-4/5 overflow-hidden rounded-sm bg-[#e8e0d3]">
                <div
                  className={`h-full rounded-sm ${colors.fill}`}
                  style={{ width: `${dim.value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

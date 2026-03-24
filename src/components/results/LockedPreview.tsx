interface LockedPreviewProps {
  isPlus?: boolean;
}

export function LockedPreview({ isPlus = false }: LockedPreviewProps) {
  return (
    <div className="mt-[18px] flex flex-col gap-2">
      {!isPlus && (
        <div className="flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-[#e8e0d3] bg-[#f2ede6] px-5 py-3.5 transition-colors hover:bg-[#e8e0d3]">
          <span className="shrink-0 text-[15px] opacity-25">🔒</span>
          <span className="flex-1 text-xs leading-relaxed text-[#8a8a9a]">
            Mi áll a dimenziók mögött? · Milyen szerepkörök illenek hozzád? · Hol
            fejlődhetsz a leggyorsabban?
          </span>
          <span className="shrink-0 rounded-md bg-[#fdf5ee] px-2.5 py-[3px] text-[9px] font-semibold text-[#8a5530]">
            Self Plus
          </span>
        </div>
      )}
      <div className="flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] border-[#e8e0d3] bg-[#f2ede6] px-5 py-3.5 transition-colors hover:bg-[#e8e0d3]">
        <span className="shrink-0 text-[15px] opacity-25">🔒</span>
        <span className="flex-1 text-xs leading-relaxed text-[#8a8a9a]">
          Hogyan látnak mások? · Mik a vakfoltjaid? · Observer visszajelzés
          elemzés
        </span>
        <span className="shrink-0 rounded-md bg-[#e8f2f0] px-2.5 py-[3px] text-[9px] font-semibold text-[#1e3d34]">
          Self Reflect · €12
        </span>
      </div>
    </div>
  );
}

interface HowYouWorkSectionProps {
  paragraphs: string[];
  isUnlocked: boolean;
}

export function HowYouWorkSection({ paragraphs, isUnlocked }: HowYouWorkSectionProps) {
  if (!isUnlocked || paragraphs.length === 0) return null;

  const mainPattern = paragraphs[0] ?? "";
  const watchArea = paragraphs[1] ?? "";
  const context = paragraphs.slice(2).join(" ");

  return (
    <div className="py-8">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#3d6b5e]" />
        <p className="text-[10px] uppercase tracking-widest text-[#8a8a9a]">
          Ahogy működsz
        </p>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        {/* Fő mintázat — sage */}
        <div className="rounded-[14px] border-[1.5px] border-[#3d6b5e]/20 bg-[#e8f2f0] p-[18px]">
          <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-[#1e3d34]">
            Fő mintázat
          </p>
          <p className="text-[13px] leading-[1.7] text-[#1e3d34]">
            {mainPattern}
          </p>
        </div>

        {/* Figyelendő — bronze */}
        {watchArea && (
          <div className="rounded-[14px] border-[1.5px] border-[#c17f4a]/20 bg-[#fdf5ee] p-[18px]">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-[#8a5530]">
              Figyelendő
            </p>
            <p className="text-[13px] leading-[1.7] text-[#4a4a5e]">
              {watchArea}
            </p>
          </div>
        )}

        {/* Kontextus — full-width white */}
        {context && (
          <div className="col-span-2 rounded-[14px] border-[1.5px] border-[#e8e0d3] bg-white p-[18px]">
            <p className="mb-1.5 text-[9px] font-bold uppercase tracking-wide text-[#8a8a9a]">
              Kontextus
            </p>
            <p className="text-[13px] leading-[1.7] text-[#4a4a5e]">
              {context}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

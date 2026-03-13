export const toggleBtn = (active: boolean, flash?: boolean) =>
  `min-h-[44px] rounded-lg border px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
    active
      ? "border-[#c8410a] bg-[#c8410a]/8 text-[#c8410a] font-semibold"
      : "border-[#e8e4dc] bg-white text-[#3d3a35] hover:border-[#c8410a]/40"
  } ${flash ? "ring-2 ring-[#c8410a]/40 bg-orange-50/60" : ""}`;

export const inputBase = (error?: boolean, flash?: boolean) =>
  `min-h-[48px] w-full rounded-lg border-2 px-4 text-sm font-normal text-[#1a1814] focus:outline-none transition-colors ${
    error
      ? "border-orange-400 bg-orange-50"
      : "border-[#e8e4dc] bg-white focus:border-[#c8410a]"
  } ${flash ? "ring-2 ring-[#c8410a]/30" : ""}`;

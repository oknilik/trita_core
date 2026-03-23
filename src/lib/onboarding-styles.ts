export const toggleBtn = (active: boolean, flash?: boolean) =>
  `min-h-[44px] rounded-lg border px-4 py-2 text-sm font-medium transition-all cursor-pointer ${
    active
      ? "border-sage bg-sage/8 text-bronze font-semibold"
      : "border-sand bg-white text-ink-body hover:border-sage/40"
  } ${flash ? "ring-2 ring-sage/40 bg-orange-50/60" : ""}`;

export const inputBase = (error?: boolean, flash?: boolean) =>
  `min-h-[48px] w-full rounded-lg border-2 px-4 text-sm font-normal text-ink focus:outline-none transition-colors ${
    error
      ? "border-orange-400 bg-orange-50"
      : "border-sand bg-white focus:border-sage"
  } ${flash ? "ring-2 ring-sage/30" : ""}`;

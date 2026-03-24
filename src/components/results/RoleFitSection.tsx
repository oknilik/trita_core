interface RoleFitSectionProps {
  strongFit: string;
  mightWork: string;
  needsPrep: string;
  strongRoles?: string[];
  mightRoles?: string[];
  prepRoles?: string[];
  isUnlocked: boolean;
}

const TIERS = [
  {
    key: "strong" as const,
    label: "Erős illeszkedés",
    bg: "bg-[#e8f2f0]",
    borderColor: "#3d6b5e",
    labelColor: "text-[#1e3d34]",
    pillClass: "bg-[#3d6b5e]/[0.15] text-[#3d6b5e]",
  },
  {
    key: "might" as const,
    label: "Működhet, ha készülsz",
    bg: "bg-[#fdf5ee]",
    borderColor: "#c17f4a",
    labelColor: "text-[#8a5530]",
    pillClass: "bg-[#c17f4a]/[0.12] text-[#8a5530]",
  },
  {
    key: "prep" as const,
    label: "Ahol segít a felkészülés",
    bg: "bg-[#f2ede6]",
    borderColor: "#8a8a9a",
    labelColor: "text-[#8a8a9a]",
    pillClass: "bg-[#8a8a9a]/[0.1] text-[#8a8a9a]",
  },
];

export function RoleFitSection({
  strongFit,
  mightWork,
  needsPrep,
  strongRoles,
  mightRoles,
  prepRoles,
  isUnlocked,
}: RoleFitSectionProps) {
  if (!isUnlocked) return null;

  const texts = { strong: strongFit, might: mightWork, prep: needsPrep };
  const roles = {
    strong: strongRoles ?? [],
    might: mightRoles ?? [],
    prep: prepRoles ?? [],
  };

  return (
    <div className="py-8">
      <div className="mb-4 flex items-center gap-2.5">
        <div className="h-2.5 w-2.5 shrink-0 rounded-full bg-[#3d6b5e]" />
        <p className="text-[10px] uppercase tracking-widest text-[#8a8a9a]">
          Szerepkör-illeszkedés
        </p>
      </div>

      <div className="mt-4 flex flex-col gap-3">
        {TIERS.map((tier) => {
          const text = texts[tier.key];
          if (!text) return null;
          const tierRoles = roles[tier.key];

          return (
            <div
              key={tier.key}
              className={`rounded-r-[14px] p-4 px-[18px] ${tier.bg}`}
              style={{ borderLeft: `4px solid ${tier.borderColor}` }}
            >
              <p
                className={`mb-1 text-[9px] font-bold uppercase tracking-wide ${tier.labelColor}`}
              >
                {tier.label}
              </p>
              <p className="mb-2.5 text-[13px] leading-relaxed text-[#4a4a5e]">
                {text}
              </p>
              {tierRoles.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {tierRoles.map((role) => (
                    <span
                      key={role}
                      className={`rounded-full px-2.5 py-1 text-[10px] ${tier.pillClass}`}
                    >
                      {role}
                    </span>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

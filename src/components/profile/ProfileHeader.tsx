import type { Locale } from "@/lib/i18n";

type ProfileLevel = "start" | "plus" | "reflect";

const BADGE: Record<ProfileLevel, { label: string; labelEn: string; classes: string }> = {
  start: {
    label: "Self Start",
    labelEn: "Self Start",
    classes: "bg-[#f5f5f4] text-[#a09a90]",
  },
  plus: {
    label: "Self Plus",
    labelEn: "Self Plus",
    classes: "bg-[#fff5f0] text-[#c8410a]",
  },
  reflect: {
    label: "Self Reflect",
    labelEn: "Self Reflect",
    classes: "bg-[#f0fdf4] text-[#1a5c3a]",
  },
};

interface ProfileHeaderProps {
  name: string;
  assessmentDate: Date;
  accessLevel: ProfileLevel;
  locale: Locale;
}

export function ProfileHeader({
  name,
  assessmentDate,
  accessLevel,
  locale,
}: ProfileHeaderProps) {
  const badge = BADGE[accessLevel];
  const isHu = locale === "hu";

  const formattedDate = assessmentDate.toLocaleDateString(
    isHu ? "hu-HU" : "en-GB",
    { year: "numeric", month: "long", day: "numeric" },
  );

  return (
    <div>
      <p className="font-mono text-[11px] uppercase tracking-[2px] text-[#c8410a]">
        // profil
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-playfair text-3xl text-[#1a1814] md:text-4xl">{name}</h1>
          <p className="mt-1.5 text-sm text-[#5a5650]">
            {isHu ? "Felmérés dátuma:" : "Assessment date:"}{" "}
            <span className="text-[#3d3a35]">{formattedDate}</span>
          </p>
        </div>
        <span
          className={`self-start rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest ${badge.classes}`}
        >
          {badge.label}
        </span>
      </div>
    </div>
  );
}

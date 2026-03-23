import type { Locale } from "@/lib/i18n";

type ProfileLevel = "start" | "plus" | "reflect";

const BADGE: Record<ProfileLevel, { label: string; labelEn: string; classes: string }> = {
  start: {
    label: "Self Start",
    labelEn: "Self Start",
    classes: "bg-[#f5f5f4] text-muted",
  },
  plus: {
    label: "Self Plus",
    labelEn: "Self Plus",
    classes: "bg-sage-ghost text-bronze",
  },
  reflect: {
    label: "Self Reflect",
    labelEn: "Self Reflect",
    classes: "bg-[#f0fdf4] text-sage",
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
      <p className="font-mono text-[11px] uppercase tracking-[2px] text-bronze">
        // profil
      </p>
      <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="font-fraunces text-3xl text-ink md:text-4xl">{name}</h1>
          <p className="mt-1.5 text-sm text-ink-body">
            {isHu ? "Felmérés dátuma:" : "Assessment date:"}{" "}
            <span className="text-ink-body">{formattedDate}</span>
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

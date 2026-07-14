import { t } from "@/lib/i18n";
import type { Locale } from "@/lib/i18n";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { SELF_PAYWALL_ENABLED } from "@/lib/operating-mode";

type ProfileLevel = "start" | "plus";

const BADGE: Record<ProfileLevel, { label: string; labelEn: string; classes: string }> = {
  start: {
    label: "Free",
    labelEn: "Free",
    classes: "bg-[#f5f5f4] text-muted",
  },
  plus: {
    label: "Plus",
    labelEn: "Plus",
    classes: "bg-sage-ghost text-bronze",
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
      <SectionEyebrow className="text-[11px] tracking-[2px]">{"// profil"}</SectionEyebrow>
      <div className="mt-3 flex flex-row items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-fraunces text-3xl text-ink md:text-4xl">{name}</h1>
          <p className="mt-1.5 text-sm text-ink-body">
            {t("profile.assessmentDateLabel", locale)}{" "}
            <span className="text-ink-body">{formattedDate}</span>
          </p>
        </div>
        {/* Csomag-badge csak aktív paywall mellett — kikapcsolt paywallnál
            nincs látható szint-fogalom. */}
        {SELF_PAYWALL_ENABLED && (
          <span
            className={`shrink-0 rounded-full px-3 py-1 font-mono text-[11px] font-semibold uppercase tracking-widest ${badge.classes}`}
          >
            {badge.label}
          </span>
        )}
      </div>
    </div>
  );
}

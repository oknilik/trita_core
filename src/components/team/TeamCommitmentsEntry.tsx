import Link from "next/link";
import { t } from "@/lib/i18n";
import { getButtonClassName } from "@/components/ui/primitives/Button";
import { SectionEyebrow } from "@/components/ui/primitives/SectionEyebrow";
import { Card } from "@/components/ui/primitives/Card";

/** Navigation only: live records have exactly one home, the commitments tab. */
export function TeamCommitmentsEntry({
  teamId,
  isHu,
  variant = "report",
}: {
  teamId: string;
  isHu: boolean;
  variant?: "report" | "workshop";
}) {
  const locale = isHu ? "hu" : "en";
  return (
    <Card as="section" surface="team" variant="muted" className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="min-w-0">
        <SectionEyebrow>{t("teamCommitmentsEntry.tab", locale)}</SectionEyebrow>
        <h3 className="mt-1 font-fraunces text-lg text-ink">{t(`teamCommitmentsEntry.${variant}Title`, locale)}</h3>
        <p className="mt-2 max-w-2xl text-caption leading-relaxed text-ink-body">{t(`teamCommitmentsEntry.${variant}Description`, locale)}</p>
      </div>
      <Link className={getButtonClassName({ variant: "secondary", className: "shrink-0" })} href={`/team/${teamId}?tab=commitments`}>
        {t("teamCommitmentsEntry.open", locale)}
      </Link>
    </Card>
  );
}

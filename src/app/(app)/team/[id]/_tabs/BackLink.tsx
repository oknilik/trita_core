import Link from "next/link";

/** Egységes vissza-link a tab-nézetek tetején (overview-ra vagy címkével). */
export function BackLink({ teamId, label }: { teamId: string; label: string }) {
  return (
    <Link
      href={`/team/${teamId}?tab=overview`}
      className="inline-flex items-center gap-1.5 text-caption font-medium text-ink-body transition-colors hover:text-ink"
    >
      <svg viewBox="0 0 16 16" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M10 3L5 8l5 5" />
      </svg>
      {label}
    </Link>
  );
}

export function backToOverviewLabel(isHu: boolean): string {
  return isHu ? "Vissza a csapatkép áttekintéshez" : "Back to team overview";
}

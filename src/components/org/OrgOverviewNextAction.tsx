import { JourneyNextStepCard } from "@/components/journey/JourneyNextStepCard";
import type { OrgOverviewFocus } from "@/lib/org-overview-focus";

export function OrgOverviewNextAction({
  focus,
  isHu,
}: {
  focus: OrgOverviewFocus;
  isHu: boolean;
}) {
  return (
    <section aria-label={isHu ? "Szervezeti következő lépés" : "Organization next step"}>
      <JourneyNextStepCard
        eyebrow={isHu ? "Szervezeti következő lépés" : "Organization next step"}
        title={focus.title}
        description={focus.description}
        primary={focus.primary}
        secondary={focus.secondary}
      />
    </section>
  );
}

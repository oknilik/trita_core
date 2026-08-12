import { JourneyNextStepCard } from "@/components/journey/JourneyNextStepCard";
import {
  resolveTeamOverviewFocus,
  type TeamOverviewFeedbackTask,
  type TeamOverviewMeasurementTask,
  type TeamOverviewObserverTask,
} from "@/lib/team-overview-focus";

interface TeamOverviewNextActionProps {
  isHu: boolean;
  pendingMeasurement: TeamOverviewMeasurementTask | null;
  observerGathering: TeamOverviewObserverTask | null;
  receivedFeedbackRequests: TeamOverviewFeedbackTask[];
}

export function TeamOverviewNextAction({
  isHu,
  pendingMeasurement,
  observerGathering,
  receivedFeedbackRequests,
}: TeamOverviewNextActionProps) {
  const focus = resolveTeamOverviewFocus({
    locale: isHu ? "hu" : "en",
    pendingMeasurement,
    observerGathering,
    receivedFeedbackRequests,
  });

  if (!focus) return null;

  const scheduledSuffix = focus.scheduledAt
    ? isHu
      ? ` Megnyílik: ${focus.scheduledAt.toLocaleString("hu-HU", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}.`
      : ` Opens: ${focus.scheduledAt.toLocaleString("en-GB", {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}.`
    : "";

  return (
    <section aria-label={isHu ? "Következő teendő" : "Next task"}>
      <JourneyNextStepCard
        eyebrow={focus.eyebrow}
        title={focus.title}
        description={`${focus.description}${scheduledSuffix}`}
        primary={focus.primary}
        secondary={focus.secondary}
      />
    </section>
  );
}

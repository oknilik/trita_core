export const TEAM_READINESS_STAGES = ["profiles", "collection", "interpretation", "published"] as const;
export type TeamReadinessStage = typeof TEAM_READINESS_STAGES[number];

export interface TeamReadinessInput {
  completedCount: number;
  memberCount: number;
  stepProgress: ReadonlyArray<{ type: string; done: number; total: number }>;
  hasPublishedReport: boolean;
}

/** Publication is explicit; a sufficient sample or 100% completion is not approval. */
export function resolveTeamReadiness(input: TeamReadinessInput) {
  const profilesComplete = input.memberCount > 0 && input.completedCount >= input.memberCount;
  const collectionComplete = !input.stepProgress.some((step) => step.total > 0 && step.done < step.total);
  const stage: TeamReadinessStage = input.hasPublishedReport
    ? "published"
    : !profilesComplete
      ? "profiles"
      : !collectionComplete
        ? "collection"
        : "interpretation";
  return { stage, profilesComplete, collectionComplete };
}

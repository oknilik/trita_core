import { isUnifiedJourneyHandoffEnabled } from "@/lib/rollout-guards";

export const JOURNEY_HOME_HANDOFF_PATH = isUnifiedJourneyHandoffEnabled()
  ? "/platform/home"
  : "/dashboard";

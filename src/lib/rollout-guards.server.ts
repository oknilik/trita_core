import "server-only";

import { parseBooleanRolloutFlag } from "@/lib/rollout-guards";

export function isSharedAcceptanceServiceEnabled(): boolean {
  return parseBooleanRolloutFlag(
    process.env.TRITA_SHARED_ACCEPTANCE_SERVICE,
    true,
  );
}

export function isPolicyEngineEnforcementEnabled(): boolean {
  return parseBooleanRolloutFlag(
    process.env.TRITA_POLICY_ENGINE_ENFORCEMENT,
    true,
  );
}

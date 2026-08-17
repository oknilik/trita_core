import { z } from "zod";
import {
  PSYCH_SAFETY_TARGET_ITEM_IDS,
  TEAM_ROLE_TARGET_CODES,
} from "@/lib/team-action-target";

export const teamActionTargetSchema = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("psych_safety_index") }),
  z.object({
    kind: z.literal("psych_safety_item"),
    itemId: z.enum(PSYCH_SAFETY_TARGET_ITEM_IDS),
  }),
  z.object({ kind: z.literal("trust_coverage") }),
  z.object({ kind: z.literal("trust_isolated_count") }),
  z.object({
    kind: z.literal("role_gap"),
    roleCode: z.enum(TEAM_ROLE_TARGET_CODES),
  }),
]);

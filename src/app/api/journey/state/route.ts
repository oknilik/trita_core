import { handleJourneyStateRequest } from "@/lib/journey/http";

/**
 * GET /api/journey/state?teamId=...&orgId=...&locale=hu|en
 * Returns the full typed journey state + resolved next-best-action in one call.
 */
export async function GET(req: Request) {
  return handleJourneyStateRequest(req);
}

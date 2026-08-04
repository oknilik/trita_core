import { handleJourneyStateRequest } from "@/lib/journey/http";

/**
 * Target structure alias for journey state.
 * Mirrors `/api/journey/state` during migration.
 */
export async function GET(req: Request) {
  return handleJourneyStateRequest(req);
}

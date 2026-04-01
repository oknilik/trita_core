import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getJourneySnapshotForClerkId,
  serializeJourneySnapshot,
  type JourneyApiResponse,
} from "@/lib/journey/service";

/**
 * Shared request handler for journey state endpoints.
 * Used by both `/api/journey/state` and the target `/journey/state` route.
 */
export async function handleJourneyStateRequest(req: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const url = new URL(req.url);
  const teamId = url.searchParams.get("teamId");
  const orgId = url.searchParams.get("orgId");
  const localeParam = url.searchParams.get("locale");
  const locale = localeParam === "hu" ? "hu" : "en";
  const entryPoint = url.pathname.startsWith("/api/")
    ? "journey_state_api"
    : "journey_state_alias";

  const snapshot = await getJourneySnapshotForClerkId(userId, {
    teamId,
    orgId,
    locale,
    entryPoint,
  });
  if (!snapshot) {
    return NextResponse.json({ error: "PROFILE_NOT_FOUND" }, { status: 404 });
  }

  const payload: JourneyApiResponse = serializeJourneySnapshot(snapshot);
  return NextResponse.json(payload);
}

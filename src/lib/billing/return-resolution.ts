import { JOURNEY_HOME_HANDOFF_PATH } from "@/lib/journey/routes";

const CREDIT_LABELS: Record<number, string> = {
  1: "1× jelölt értékelés",
  5: "5× jelölt értékelés",
  10: "10× jelölt értékelés",
};

export interface BillingReturnSessionLike {
  status: string;
  mode?: string | null;
  metadata?: Record<string, string | undefined> | null;
}

export interface BillingReturnRuntime {
  findProfileByClerkId: (clerkId: string) => Promise<{ id: string } | null>;
  resolveJourneyFallbackForProfileId: (profileId: string) => Promise<string>;
  retrieveSession: (sessionId: string) => Promise<BillingReturnSessionLike>;
  findCandidateCreditBySession: (
    orgId: string,
    sessionId: string,
  ) => Promise<{ id: string } | null>;
  addCredits: (input: {
    orgId: string;
    amount: number;
    actorId: string;
    note: string;
  }) => Promise<void>;
}

export type BillingReturnResolution =
  | { kind: "redirect"; destination: string }
  | {
      kind: "complete";
      handoffDestination: string;
      candidateAddonApplied: boolean;
    }
  | { kind: "expired" };

interface ResolveBillingReturnInput {
  sessionId?: string;
  addon?: string;
  userId: string | null;
}

export async function resolveBillingReturnResolution(
  input: ResolveBillingReturnInput,
  runtime: BillingReturnRuntime,
): Promise<BillingReturnResolution> {
  let handoffDestination = JOURNEY_HOME_HANDOFF_PATH;

  if (input.userId) {
    const profile = await runtime.findProfileByClerkId(input.userId);
    if (profile) {
      handoffDestination = await runtime.resolveJourneyFallbackForProfileId(profile.id);
    }
  }

  if (!input.sessionId) {
    return { kind: "redirect", destination: handoffDestination };
  }

  let session: BillingReturnSessionLike;
  try {
    session = await runtime.retrieveSession(input.sessionId);
  } catch {
    return { kind: "redirect", destination: handoffDestination };
  }

  if (session.status === "open") {
    return { kind: "redirect", destination: "/billing/checkout" };
  }

  if (session.status !== "complete") {
    return { kind: "expired" };
  }

  const isCandidateAddon =
    input.addon === "candidate" &&
    session.mode === "payment" &&
    session.metadata?.type === "candidate_addon" &&
    Boolean(session.metadata?.orgId);

  if (isCandidateAddon) {
    const orgId = session.metadata!.orgId!;
    const creditCount = parseInt(session.metadata!.creditCount ?? "1", 10);
    const actorId = session.metadata!.actorId ?? "system";

    const alreadyProcessed = await runtime.findCandidateCreditBySession(
      orgId,
      input.sessionId,
    );

    if (!alreadyProcessed) {
      const label = CREDIT_LABELS[creditCount] ?? `${creditCount}× jelölt értékelés`;
      await runtime.addCredits({
        orgId,
        amount: creditCount,
        actorId,
        note: `${label} [${input.sessionId}]`,
      });
    }

    return {
      kind: "complete",
      handoffDestination,
      candidateAddonApplied: true,
    };
  }

  return {
    kind: "complete",
    handoffDestination,
    candidateAddonApplied: false,
  };
}


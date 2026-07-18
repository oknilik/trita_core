import type { PrismaClient } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type PrismaDeleteManyDelegate = {
  deleteMany: () => Promise<unknown>;
};

const RESET_MODEL_ORDER = [
  "campaignParticipant",
  "campaign",
  "candidateInvite",
  "organizationPendingInvite",
  "teamPendingInvite",
  "teamMember",
  "organizationMember",
  "team",
  "organization",
  "observerDraft",
  "observerAssessment",
  "observerInvitation",
  "assessmentDraft",
  "assessmentResult",
  "feedback",
  "purchase",
  "belbinAnswer",
  "belbinScore",
  "subscription",
  "userProfile",
] as const;

function isDeleteManyDelegate(value: unknown): value is PrismaDeleteManyDelegate {
  return (
    typeof value === "object" &&
    value !== null &&
    "deleteMany" in value &&
    typeof (value as { deleteMany?: unknown }).deleteMany === "function"
  );
}

/**
 * Resets seeded integration-test data while keeping schema/migrations untouched.
 * Ordering is dependency-aware (children first, roots last).
 */
export async function resetSeededDb(client: PrismaClient = prisma): Promise<void> {
  const modelMap = client as unknown as Record<string, unknown>;

  for (const modelName of RESET_MODEL_ORDER) {
    const delegate = modelMap[modelName];
    if (!isDeleteManyDelegate(delegate)) continue;
    await delegate.deleteMany();
  }
}

export async function resetSeededDbWithSeed(
  seed: (client: PrismaClient) => Promise<void>,
  client: PrismaClient = prisma,
): Promise<void> {
  await resetSeededDb(client);
  await seed(client);
}

import test from "node:test";
import assert from "node:assert/strict";
import * as finalizationModule from "@/lib/billing/finalization-service";

const finalizationService =
  (finalizationModule as { default?: unknown }).default ??
  (finalizationModule as { "module.exports"?: unknown })["module.exports"] ??
  finalizationModule;

const { finalizeFromFallback } = finalizationService as {
  finalizeFromFallback: (
    input: {
      paymentIntentId: string;
      plan?: string;
      addon?: string;
      actorProfileId?: string | null;
    },
    runtime: unknown,
  ) => Promise<{
    completed: boolean;
    candidateAddonApplied: boolean;
    oneTimePurchaseApplied: boolean;
    subscriptionActivationApplied: boolean;
  }>;
};

function buildRuntimeForPaymentIntent(pi: {
  id: string;
  status: string;
  metadata?: Record<string, string | undefined>;
}) {
  const addCreditsCalls: Array<{
    orgId: string;
    amount: number;
    actorId: string;
    note: string;
  }> = [];

  const runtime = {
    stripe: {
      paymentIntents: {
        retrieve: async () => pi,
      },
      subscriptions: {
        create: async () => {
          throw new Error("subscriptions.create should not be called in this test");
        },
      },
      paymentMethods: {
        attach: async () => {
          throw new Error("paymentMethods.attach should not be called in this test");
        },
      },
    },
    prisma: {
      candidateCredit: {
        findFirst: async () => null,
      },
      purchase: {
        findFirst: async () => null,
        create: async () => ({ id: "purchase_1" }),
      },
      subscription: {
        findUnique: async () => null,
        upsert: async () => ({ id: "sub_1" }),
      },
      organization: {
        updateMany: async () => ({ count: 1 }),
      },
    },
    addCredits: async (input: {
      orgId: string;
      amount: number;
      actorId: string;
      note: string;
    }) => {
      addCreditsCalls.push(input);
      return { ok: true };
    },
  };

  return { runtime, addCreditsCalls };
}

test("T12: fallback finalization applies candidate addon when webhook is missing", async () => {
  const { runtime, addCreditsCalls } = buildRuntimeForPaymentIntent({
    id: "pi_candidate_success",
    status: "succeeded",
    metadata: {
      type: "candidate_addon",
      orgId: "org_123",
      creditCount: "5",
      actorId: "profile_1",
    },
  });

  const result = await finalizeFromFallback(
    {
      paymentIntentId: "pi_candidate_success",
      addon: "candidate",
      actorProfileId: "profile_1",
    },
    runtime,
  );

  assert.equal(result.completed, true);
  assert.equal(result.candidateAddonApplied, true);
  assert.equal(addCreditsCalls.length, 1);
  assert.equal(addCreditsCalls[0]?.orgId, "org_123");
  assert.equal(addCreditsCalls[0]?.amount, 5);
});

test("T12: fallback finalization is idempotent for candidate addon (no duplicate credit)", async () => {
  const { runtime, addCreditsCalls } = buildRuntimeForPaymentIntent({
    id: "pi_candidate_existing",
    status: "succeeded",
    metadata: {
      type: "candidate_addon",
      orgId: "org_123",
      creditCount: "10",
      actorId: "profile_1",
    },
  });

  (runtime.prisma.candidateCredit.findFirst as () => Promise<unknown>) = async () => ({
    id: "credit_existing",
  });

  const result = await finalizeFromFallback(
    {
      paymentIntentId: "pi_candidate_existing",
      addon: "candidate",
      actorProfileId: "profile_1",
    },
    runtime,
  );

  assert.equal(result.completed, true);
  assert.equal(result.candidateAddonApplied, true);
  assert.equal(addCreditsCalls.length, 0);
});

test("T12: fallback finalization does nothing for non-succeeded payment intents", async () => {
  const { runtime, addCreditsCalls } = buildRuntimeForPaymentIntent({
    id: "pi_candidate_pending",
    status: "requires_payment_method",
    metadata: {
      type: "candidate_addon",
      orgId: "org_123",
      creditCount: "1",
      actorId: "profile_1",
    },
  });

  const result = await finalizeFromFallback(
    {
      paymentIntentId: "pi_candidate_pending",
      addon: "candidate",
      actorProfileId: "profile_1",
    },
    runtime,
  );

  assert.equal(result.completed, false);
  assert.equal(result.candidateAddonApplied, false);
  assert.equal(addCreditsCalls.length, 0);
});

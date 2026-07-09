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

test("T12: subscription activation uses reusable active subscription without creating a new one", async () => {
  let createCalled = false;
  const runtime = {
    stripe: {
      paymentIntents: {
        retrieve: async () => ({
          id: "pi_sub_reused",
          status: "succeeded",
          customer: "cus_1",
          payment_method: "pm_1",
          metadata: {
            type: "subscription_activation",
            orgId: "org_1",
            priceId: "price_org_monthly",
            plan: "org_monthly",
          },
        }),
      },
      paymentMethods: {
        attach: async () => ({ id: "pm_1" }),
      },
      subscriptions: {
        create: async () => {
          createCalled = true;
          return {
            id: "sub_should_not_be_created",
            status: "active",
            items: { data: [{ current_period_start: 0, current_period_end: 0 }] },
          };
        },
      },
    },
    prisma: {
      candidateCredit: { findFirst: async () => null },
      purchase: { findFirst: async () => null, create: async () => ({ id: "purchase_1" }) },
      subscription: {
        findUnique: async () => ({ stripeSubscriptionId: "sub_existing", status: "active" }),
        upsert: async () => ({ id: "sub_1" }),
      },
      organization: { updateMany: async () => ({ count: 1 }) },
    },
    addCredits: async () => ({ ok: true }),
  };

  const result = await finalizeFromFallback(
    { paymentIntentId: "pi_sub_reused", plan: "org_monthly" },
    runtime,
  );

  assert.equal(result.completed, true);
  assert.equal(result.subscriptionActivationApplied, true);
  assert.equal(createCalled, false);
});

test("T12: subscription activation returns incomplete when price/customer is missing", async () => {
  const runtime = {
    stripe: {
      paymentIntents: {
        retrieve: async () => ({
          id: "pi_sub_missing",
          status: "succeeded",
          customer: null,
          payment_method: null,
          metadata: {
            type: "subscription_activation",
            orgId: "org_1",
            plan: "org_monthly",
          },
        }),
      },
      paymentMethods: { attach: async () => ({ id: "pm_1" }) },
      subscriptions: {
        create: async () => ({
          id: "sub_should_not_be_created",
          status: "active",
          items: { data: [{ current_period_start: 0, current_period_end: 0 }] },
        }),
      },
    },
    prisma: {
      candidateCredit: { findFirst: async () => null },
      purchase: { findFirst: async () => null, create: async () => ({ id: "purchase_1" }) },
      subscription: {
        findUnique: async () => ({ stripeSubscriptionId: null, status: "trialing" }),
        upsert: async () => ({ id: "sub_1" }),
      },
      organization: { updateMany: async () => ({ count: 1 }) },
    },
    addCredits: async () => ({ ok: true }),
  };

  const result = await finalizeFromFallback(
    { paymentIntentId: "pi_sub_missing", plan: "org_monthly" },
    runtime,
  );

  assert.equal(result.completed, false);
  assert.equal(result.subscriptionActivationApplied, false);
});

test("T12: subscription activation creates subscription when no reusable subscription exists", async () => {
  let attachCalled = false;
  let createCalled = false;
  let upsertCalled = false;

  const runtime = {
    stripe: {
      paymentIntents: {
        retrieve: async () => ({
          id: "pi_sub_create",
          status: "succeeded",
          customer: "cus_1",
          payment_method: "pm_1",
          metadata: {
            type: "subscription_activation",
            orgId: "org_1",
            priceId: "price_org_monthly",
            plan: "org_monthly",
          },
        }),
      },
      paymentMethods: {
        attach: async () => {
          attachCalled = true;
          return { id: "pm_1" };
        },
      },
      subscriptions: {
        create: async () => {
          createCalled = true;
          return {
            id: "sub_new_1",
            status: "active",
            items: {
              data: [
                {
                  current_period_start: 1710000000,
                  current_period_end: 1712592000,
                },
              ],
            },
          };
        },
      },
    },
    prisma: {
      candidateCredit: { findFirst: async () => null },
      purchase: { findFirst: async () => null, create: async () => ({ id: "purchase_1" }) },
      subscription: {
        findUnique: async () => ({ stripeSubscriptionId: null, status: "canceled" }),
        upsert: async () => {
          upsertCalled = true;
          return { id: "sub_1" };
        },
      },
      organization: { updateMany: async () => ({ count: 1 }) },
    },
    addCredits: async () => ({ ok: true }),
  };

  const result = await finalizeFromFallback(
    { paymentIntentId: "pi_sub_create", plan: "org_monthly" },
    runtime,
  );

  assert.equal(result.completed, true);
  assert.equal(result.subscriptionActivationApplied, true);
  assert.equal(attachCalled, true);
  assert.equal(createCalled, true);
  assert.equal(upsertCalled, true);
});

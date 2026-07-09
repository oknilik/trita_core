import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { POST as stripeWebhookPOST } from "@/app/api/webhooks/stripe/route";

type PersistedSubscription = {
  orgId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: string;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

const restorers: Array<() => void> = [];
let constructedEvent: Stripe.Event | null = null;

function setGlobalRuntime(key: string, value: unknown): void {
  const store = globalThis as Record<string, unknown>;
  const prev = store[key];
  store[key] = value;
  restorers.push(() => {
    if (prev === undefined) {
      delete store[key];
      return;
    }
    store[key] = prev;
  });
}

function unixSeconds(iso: string): number {
  return Math.floor(new Date(iso).getTime() / 1000);
}

function makeSubscriptionObject(params: {
  id: string;
  status: "trialing" | "active" | "past_due" | "canceled";
  orgId?: string;
  customerId?: string;
  currentPeriodEnd: string;
  trialEnd?: string | null;
}): Stripe.Subscription {
  return {
    id: params.id,
    object: "subscription",
    customer: params.customerId ?? "cus_contract_1",
    metadata: { orgId: params.orgId ?? "org_contract_1" },
    status: params.status,
    trial_end:
      params.trialEnd === undefined
        ? null
        : (params.trialEnd ? unixSeconds(params.trialEnd) : null),
    cancel_at_period_end: params.status === "canceled",
    items: {
      data: [
        {
          price: { id: "price_team_monthly_test" },
          current_period_end: unixSeconds(params.currentPeriodEnd),
        },
      ],
    },
  } as unknown as Stripe.Subscription;
}

function makeCheckoutCompletedSubscriptionEvent(params: {
  checkoutSessionId: string;
  subscriptionId: string;
  customerId: string;
  orgId: string;
}): Stripe.Event {
  return {
    id: `evt_checkout_${params.checkoutSessionId}`,
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: params.checkoutSessionId,
        mode: "subscription",
        subscription: params.subscriptionId,
        customer: params.customerId,
        metadata: { orgId: params.orgId },
      },
    },
  } as unknown as Stripe.Event;
}

function makeInvoiceEvent(params: {
  eventType: "invoice.paid" | "invoice.payment_failed";
  invoiceId: string;
  subscriptionId: string;
  customerId: string;
}): Stripe.Event {
  return {
    id: `evt_${params.eventType}_${params.invoiceId}`,
    object: "event",
    type: params.eventType,
    data: {
      object: {
        id: params.invoiceId,
        object: "invoice",
        subscription: params.subscriptionId,
        customer: params.customerId,
      },
    },
  } as unknown as Stripe.Event;
}

function makeCustomerSubscriptionEvent(params: {
  eventType:
    | "customer.subscription.created"
    | "customer.subscription.updated"
    | "customer.subscription.deleted";
  subscription: Stripe.Subscription;
  previousStatus?: "trialing" | "active" | "past_due" | "canceled";
}): Stripe.Event {
  return {
    id: `evt_${params.eventType}_${params.subscription.id}`,
    object: "event",
    type: params.eventType,
    data: {
      object: params.subscription,
      previous_attributes: params.previousStatus
        ? { status: params.previousStatus }
        : undefined,
    },
  } as unknown as Stripe.Event;
}

async function dispatchWebhookEvent(event: Stripe.Event): Promise<Response> {
  constructedEvent = event;
  return stripeWebhookPOST(
    new Request("http://localhost/api/webhooks/stripe", {
      method: "POST",
      headers: { "stripe-signature": "sig_contract_test" },
      body: '{"id":"evt_contract"}',
    }),
  );
}

afterEach(() => {
  constructedEvent = null;
  while (restorers.length > 0) {
    const restore = restorers.pop();
    if (restore) restore();
  }
});

test("D3 webhook contract: maps minimum Stripe events to deterministic local subscription state", async () => {
  let persisted: PersistedSubscription | null = null;
  let latestRetrievedSubscription = makeSubscriptionObject({
    id: "sub_contract_1",
    status: "trialing",
    currentPeriodEnd: "2026-04-15T00:00:00.000Z",
    trialEnd: "2026-04-15T00:00:00.000Z",
  });
  const statuses: string[] = [];
  let orgActivationCalls = 0;

  setGlobalRuntime("__TRITA_STRIPE_WEBHOOK_RUNTIME__", {
    webhookSecret: "whsec_contract_test",
    stripe: {
      webhooks: {
        constructEvent: () => {
          if (!constructedEvent) throw new Error("missing constructed event");
          return constructedEvent;
        },
      },
      subscriptions: {
        retrieve: async () => latestRetrievedSubscription,
      },
    },
    prisma: {
      subscription: {
        findUnique: async () => (persisted ? { status: persisted.status } : null),
        upsert: async ({ create, update }: { create: PersistedSubscription; update: Partial<PersistedSubscription> }) => {
          if (!persisted) {
            persisted = { ...create };
          } else {
            persisted = { ...persisted, ...update };
          }
          statuses.push(String(persisted.status));
          return persisted;
        },
      },
      organization: {
        updateMany: async () => {
          orgActivationCalls += 1;
          return { count: 1 };
        },
      },
    },
    sendOrderConfirmationEmail: async () => undefined,
  });

  // 1) checkout.session.completed (subscription)
  let response = await dispatchWebhookEvent(
    makeCheckoutCompletedSubscriptionEvent({
      checkoutSessionId: "cs_contract_1",
      subscriptionId: "sub_contract_1",
      customerId: "cus_contract_1",
      orgId: "org_contract_1",
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(persisted?.status, "trialing");
  assert.equal(orgActivationCalls, 1);

  // 2) customer.subscription.created
  response = await dispatchWebhookEvent(
    makeCustomerSubscriptionEvent({
      eventType: "customer.subscription.created",
      subscription: makeSubscriptionObject({
        id: "sub_contract_1",
        status: "trialing",
        currentPeriodEnd: "2026-04-16T00:00:00.000Z",
        trialEnd: "2026-04-16T00:00:00.000Z",
      }),
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(persisted?.status, "trialing");

  // 3) invoice.paid
  latestRetrievedSubscription = makeSubscriptionObject({
    id: "sub_contract_1",
    status: "active",
    currentPeriodEnd: "2026-05-16T00:00:00.000Z",
  });
  response = await dispatchWebhookEvent(
    makeInvoiceEvent({
      eventType: "invoice.paid",
      invoiceId: "in_contract_paid",
      subscriptionId: "sub_contract_1",
      customerId: "cus_contract_1",
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(persisted?.status, "active");

  // 4) invoice.payment_failed
  latestRetrievedSubscription = makeSubscriptionObject({
    id: "sub_contract_1",
    status: "past_due",
    currentPeriodEnd: "2026-05-16T00:00:00.000Z",
  });
  response = await dispatchWebhookEvent(
    makeInvoiceEvent({
      eventType: "invoice.payment_failed",
      invoiceId: "in_contract_failed",
      subscriptionId: "sub_contract_1",
      customerId: "cus_contract_1",
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(persisted?.status, "past_due");

  // 5) customer.subscription.updated
  response = await dispatchWebhookEvent(
    makeCustomerSubscriptionEvent({
      eventType: "customer.subscription.updated",
      previousStatus: "past_due",
      subscription: makeSubscriptionObject({
        id: "sub_contract_1",
        status: "active",
        currentPeriodEnd: "2026-06-16T00:00:00.000Z",
      }),
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(persisted?.status, "active");

  // 6) customer.subscription.deleted
  response = await dispatchWebhookEvent(
    makeCustomerSubscriptionEvent({
      eventType: "customer.subscription.deleted",
      previousStatus: "active",
      subscription: makeSubscriptionObject({
        id: "sub_contract_1",
        status: "canceled",
        currentPeriodEnd: "2026-06-16T00:00:00.000Z",
      }),
    }),
  );
  assert.equal(response.status, 200);
  assert.equal(persisted?.status, "canceled");

  assert.deepEqual(statuses, [
    "trialing",
    "trialing",
    "active",
    "past_due",
    "active",
    "canceled",
  ]);
});

test("D3 webhook contract: duplicate events stay idempotent for side effects", async () => {
  let persisted: PersistedSubscription | null = null;
  let orderConfirmationCount = 0;
  let purchaseCreateCount = 0;
  let existingPurchase = false;

  setGlobalRuntime("__TRITA_STRIPE_WEBHOOK_RUNTIME__", {
    webhookSecret: "whsec_contract_test",
    stripe: {
      webhooks: {
        constructEvent: () => {
          if (!constructedEvent) throw new Error("missing constructed event");
          return constructedEvent;
        },
      },
      subscriptions: {
        retrieve: async () =>
          makeSubscriptionObject({
            id: "sub_contract_2",
            status: "active",
            currentPeriodEnd: "2026-05-20T00:00:00.000Z",
          }),
      },
    },
    prisma: {
      subscription: {
        findUnique: async () => (persisted ? { status: persisted.status } : null),
        upsert: async ({ create, update }: { create: PersistedSubscription; update: Partial<PersistedSubscription> }) => {
          if (!persisted) {
            persisted = { ...create };
          } else {
            persisted = { ...persisted, ...update };
          }
          return persisted;
        },
      },
      organization: {
        findUnique: async () => ({
          name: "Contract Org",
          owner: { email: "owner@trita.test" },
        }),
        updateMany: async () => ({ count: 1 }),
      },
      purchase: {
        findFirst: async () => (existingPurchase ? { id: "p_1" } : null),
        create: async () => {
          purchaseCreateCount += 1;
          existingPurchase = true;
          return {};
        },
      },
    },
    sendOrderConfirmationEmail: async () => {
      orderConfirmationCount += 1;
    },
  });

  // First, establish local trialing state.
  let response = await dispatchWebhookEvent(
    makeCustomerSubscriptionEvent({
      eventType: "customer.subscription.created",
      subscription: makeSubscriptionObject({
        id: "sub_contract_2",
        status: "trialing",
        currentPeriodEnd: "2026-04-20T00:00:00.000Z",
        trialEnd: "2026-04-20T00:00:00.000Z",
      }),
    }),
  );
  assert.equal(response.status, 200);

  // Duplicate trialing->active update should only trigger confirmation once.
  const transitionEvent = makeCustomerSubscriptionEvent({
    eventType: "customer.subscription.updated",
    previousStatus: "trialing",
    subscription: makeSubscriptionObject({
      id: "sub_contract_2",
      status: "active",
      currentPeriodEnd: "2026-05-20T00:00:00.000Z",
    }),
  });
  response = await dispatchWebhookEvent(transitionEvent);
  assert.equal(response.status, 200);
  response = await dispatchWebhookEvent(transitionEvent);
  assert.equal(response.status, 200);
  assert.equal(orderConfirmationCount, 1);

  // Duplicate one-time checkout completion should not duplicate purchase create.
  const oneTimeCheckoutEvent = {
    id: "evt_checkout_payment_dup",
    object: "event",
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_dup_1",
        mode: "payment",
        amount_total: 10000,
        currency: "eur",
        payment_intent: "pi_dup_1",
        metadata: {
          type: "one_time_purchase",
          orgId: "org_contract_1",
          teamId: "team_1",
          tier: "team_snapshot",
          userProfileId: "profile_1",
        },
      },
    },
  } as unknown as Stripe.Event;

  response = await dispatchWebhookEvent(oneTimeCheckoutEvent);
  assert.equal(response.status, 200);
  response = await dispatchWebhookEvent(oneTimeCheckoutEvent);
  assert.equal(response.status, 200);
  assert.equal(purchaseCreateCount, 1);
});

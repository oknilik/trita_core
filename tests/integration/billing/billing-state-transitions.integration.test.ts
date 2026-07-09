import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import type Stripe from "stripe";
import { POST as stripeWebhookPOST } from "@/app/api/webhooks/stripe/route";
import { getSubscriptionState } from "@/lib/subscription";

type PersistedSubscription = {
  orgId: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  stripePriceId: string | null;
  status: "trialing" | "active" | "past_due" | "canceled" | "unpaid" | "none";
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  cancelAtPeriodEnd: boolean;
};

const FIXED_NOW = new Date("2026-04-01T12:00:00.000Z");
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

function makeSubscriptionEvent(
  type: "customer.subscription.updated" | "customer.subscription.deleted",
  params: {
    id: string;
    status: "trialing" | "active" | "past_due" | "canceled";
    currentPeriodEnd: string;
    trialEnd?: string | null;
    previousStatus?: "trialing" | "active" | "past_due" | "canceled";
  },
): Stripe.Event {
  const subscription = {
    id: params.id,
    customer: "cus_transition_test",
    metadata: { orgId: "org_transition_1" },
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
  };

  return {
    id: `evt_${params.id}_${params.status}`,
    object: "event",
    type,
    data: {
      object: subscription,
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
      headers: { "stripe-signature": "sig_transition_test" },
      body: '{"id":"evt_transition"}',
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

test("D2 billing transitions: trialing->active->past_due->restricted->reactivated", async () => {
  let persisted: PersistedSubscription | null = null;
  let confirmationEmailsSent = 0;

  setGlobalRuntime("__TRITA_STRIPE_WEBHOOK_RUNTIME__", {
    webhookSecret: "whsec_transition_test",
    stripe: {
      webhooks: {
        constructEvent: (_payload: string, _sig: string, _secret: string) => {
          if (!constructedEvent) throw new Error("event override missing");
          return constructedEvent;
        },
      },
    },
    prisma: {
      subscription: {
        findUnique: async () => (persisted ? { status: persisted.status } : null),
        upsert: async ({ create, update }: { create: PersistedSubscription; update: Partial<PersistedSubscription> }) => {
          if (!persisted) {
            persisted = { ...create };
            return persisted;
          }
          persisted = { ...persisted, ...update };
          return persisted;
        },
      },
      organization: {
        findUnique: async () => ({
          name: "Transition Org",
          owner: { email: "owner@trita.test" },
        }),
      },
    },
    sendOrderConfirmationEmail: async () => {
      confirmationEmailsSent += 1;
    },
  });

  const trialingEvent = makeSubscriptionEvent("customer.subscription.updated", {
    id: "sub_transition_1",
    status: "trialing",
    trialEnd: "2026-04-08T00:00:00.000Z",
    currentPeriodEnd: "2026-04-08T00:00:00.000Z",
  });

  let response = await dispatchWebhookEvent(trialingEvent);
  assert.equal(response.status, 200);
  assert.ok(persisted);
  assert.equal(persisted?.status, "trialing");
  assert.equal(
    getSubscriptionState(
      persisted
        ? {
            status: persisted.status,
            trialEndsAt: persisted.trialEndsAt,
            currentPeriodEnd: persisted.currentPeriodEnd,
          }
        : null,
      FIXED_NOW,
    ),
    "active",
  );

  const activeEvent = makeSubscriptionEvent("customer.subscription.updated", {
    id: "sub_transition_1",
    status: "active",
    currentPeriodEnd: "2026-05-08T00:00:00.000Z",
    previousStatus: "trialing",
  });
  response = await dispatchWebhookEvent(activeEvent);
  assert.equal(response.status, 200);
  assert.equal(persisted?.status, "active");
  assert.equal(
    getSubscriptionState(
      persisted
        ? {
            status: persisted.status,
            trialEndsAt: persisted.trialEndsAt,
            currentPeriodEnd: persisted.currentPeriodEnd,
          }
        : null,
      FIXED_NOW,
    ),
    "active",
  );
  assert.equal(confirmationEmailsSent, 1);

  const pastDueEvent = makeSubscriptionEvent("customer.subscription.updated", {
    id: "sub_transition_1",
    status: "past_due",
    currentPeriodEnd: "2026-03-20T00:00:00.000Z",
    previousStatus: "active",
  });
  response = await dispatchWebhookEvent(pastDueEvent);
  assert.equal(response.status, 200);
  assert.equal(persisted?.status, "past_due");

  const stateAfterPastDue = getSubscriptionState(
    persisted
      ? {
          status: persisted.status,
          trialEndsAt: persisted.trialEndsAt,
          currentPeriodEnd: persisted.currentPeriodEnd,
        }
      : null,
    FIXED_NOW,
  );
  assert.equal(stateAfterPastDue, "restricted");

  const reactivatedEvent = makeSubscriptionEvent("customer.subscription.updated", {
    id: "sub_transition_1",
    status: "active",
    currentPeriodEnd: "2026-05-20T00:00:00.000Z",
    previousStatus: "past_due",
  });
  response = await dispatchWebhookEvent(reactivatedEvent);
  assert.equal(response.status, 200);
  assert.equal(persisted?.status, "active");
  assert.equal(
    getSubscriptionState(
      persisted
        ? {
            status: persisted.status,
            trialEndsAt: persisted.trialEndsAt,
            currentPeriodEnd: persisted.currentPeriodEnd,
          }
        : null,
      FIXED_NOW,
    ),
    "active",
  );
});

test("D2 billing transitions: restricted->frozen and canceled->reactivated", async () => {
  let persisted: PersistedSubscription | null = null;

  setGlobalRuntime("__TRITA_STRIPE_WEBHOOK_RUNTIME__", {
    webhookSecret: "whsec_transition_test",
    stripe: {
      webhooks: {
        constructEvent: (_payload: string, _sig: string, _secret: string) => {
          if (!constructedEvent) throw new Error("event override missing");
          return constructedEvent;
        },
      },
    },
    prisma: {
      subscription: {
        findUnique: async () => (persisted ? { status: persisted.status } : null),
        upsert: async ({ create, update }: { create: PersistedSubscription; update: Partial<PersistedSubscription> }) => {
          if (!persisted) {
            persisted = { ...create };
            return persisted;
          }
          persisted = { ...persisted, ...update };
          return persisted;
        },
      },
      organization: {
        findUnique: async () => null,
      },
    },
    sendOrderConfirmationEmail: async () => undefined,
  });

  const restrictedEvent = makeSubscriptionEvent("customer.subscription.updated", {
    id: "sub_transition_2",
    status: "past_due",
    currentPeriodEnd: "2026-03-30T00:00:00.000Z",
  });
  let response = await dispatchWebhookEvent(restrictedEvent);
  assert.equal(response.status, 200);
  assert.equal(
    getSubscriptionState(
      persisted
        ? {
            status: persisted.status,
            trialEndsAt: persisted.trialEndsAt,
            currentPeriodEnd: persisted.currentPeriodEnd,
          }
        : null,
      FIXED_NOW,
    ),
    "restricted",
  );

  const frozenEvent = makeSubscriptionEvent("customer.subscription.deleted", {
    id: "sub_transition_2",
    status: "canceled",
    currentPeriodEnd: "2026-02-01T00:00:00.000Z",
    previousStatus: "past_due",
  });
  response = await dispatchWebhookEvent(frozenEvent);
  assert.equal(response.status, 200);
  assert.equal(persisted?.status, "canceled");
  assert.equal(
    getSubscriptionState(
      persisted
        ? {
            status: persisted.status,
            trialEndsAt: persisted.trialEndsAt,
            currentPeriodEnd: persisted.currentPeriodEnd,
          }
        : null,
      FIXED_NOW,
    ),
    "frozen",
  );

  const reactivatedFromCanceledEvent = makeSubscriptionEvent("customer.subscription.updated", {
    id: "sub_transition_2",
    status: "active",
    currentPeriodEnd: "2026-05-01T00:00:00.000Z",
    previousStatus: "canceled",
  });
  response = await dispatchWebhookEvent(reactivatedFromCanceledEvent);
  assert.equal(response.status, 200);
  assert.equal(persisted?.status, "active");
  assert.equal(
    getSubscriptionState(
      persisted
        ? {
            status: persisted.status,
            trialEndsAt: persisted.trialEndsAt,
            currentPeriodEnd: persisted.currentPeriodEnd,
          }
        : null,
      FIXED_NOW,
    ),
    "active",
  );
});

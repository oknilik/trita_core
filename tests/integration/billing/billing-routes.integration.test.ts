import test, { afterEach } from "node:test";
import assert from "node:assert/strict";
import { POST as checkoutPOST } from "@/app/api/billing/checkout/route";
import { POST as purchasePOST } from "@/app/api/billing/purchase/route";
import { POST as portalPOST } from "@/app/api/billing/portal/route";
import { POST as stripeWebhookPOST } from "@/app/api/webhooks/stripe/route";
import { STRIPE_PRICES } from "@/lib/stripe";
import { resolveBillingReturnResolution } from "@/lib/billing/return-resolution";

const restorers: Array<() => void> = [];

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

async function responseJson(response: Response): Promise<unknown> {
  return response.json();
}

afterEach(() => {
  while (restorers.length > 0) {
    const restore = restorers.pop();
    if (restore) restore();
  }
});

test("D1 checkout route: unauthorized is rejected", async () => {
  setGlobalRuntime("__TRITA_BILLING_CHECKOUT_RUNTIME__", {
    auth: async () => ({ userId: null }),
  });

  const req = new Request("http://localhost/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceKey: "team_monthly" }),
  });

  const res = await checkoutPOST(req);
  const body = (await responseJson(res)) as { error: string };
  assert.equal(res.status, 401);
  assert.equal(body.error, "UNAUTHORIZED");
});

test("D1 checkout route: subscription checkout creates expected Stripe payload shape", async () => {
  let capturedSessionPayload: Record<string, unknown> | null = null;
  setGlobalRuntime("__TRITA_BILLING_CHECKOUT_RUNTIME__", {
    auth: async () => ({ userId: "clerk_1" }),
    checkRateLimit: async () => null,
    getActiveOrgMembership: async () => ({
      orgId: "org_1",
      role: "ORG_ADMIN",
      joinedAt: new Date("2026-04-01T10:00:00.000Z"),
    }),
    prisma: {
      userProfile: {
        findUnique: async () => ({
          id: "profile_1",
          email: "billing@test.trita.app",
          locale: "en",
        }),
      },
      subscription: {
        findUnique: async () => ({
          stripeCustomerId: "cus_existing",
          status: "active",
        }),
      },
    },
    stripe: {
      checkout: {
        sessions: {
          create: async (payload: Record<string, unknown>) => {
            capturedSessionPayload = payload;
            return { client_secret: "cs_sub_123" };
          },
        },
      },
    },
    appUrl: "https://example.test",
  });

  const req = new Request("http://localhost/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceKey: "team_monthly" }),
  });

  const res = await checkoutPOST(req);
  const body = (await responseJson(res)) as { clientSecret: string };
  assert.equal(res.status, 200);
  assert.equal(body.clientSecret, "cs_sub_123");
  assert.ok(capturedSessionPayload);
  assert.equal(capturedSessionPayload?.mode, "subscription");
  assert.equal(capturedSessionPayload?.customer, "cus_existing");
  assert.equal(
    (capturedSessionPayload?.line_items as Array<{ price: string }>)?.[0]?.price,
    STRIPE_PRICES.team_monthly,
  );
});

test("D1 checkout route: candidate custom addon produces payment request with computed credits", async () => {
  let capturedSessionPayload: Record<string, unknown> | null = null;
  setGlobalRuntime("__TRITA_BILLING_CHECKOUT_RUNTIME__", {
    auth: async () => ({ userId: "clerk_1" }),
    checkRateLimit: async () => null,
    getActiveOrgMembership: async () => ({
      orgId: "org_1",
      role: "ORG_ADMIN",
      joinedAt: new Date("2026-04-01T10:00:00.000Z"),
    }),
    prisma: {
      userProfile: {
        findUnique: async () => ({
          id: "profile_1",
          email: "billing@test.trita.app",
          locale: "hu",
        }),
      },
      subscription: {
        findUnique: async () => null,
        upsert: async () => ({}),
      },
      organization: {
        findUnique: async () => ({ name: "Org One" }),
      },
    },
    stripe: {
      customers: {
        create: async () => ({ id: "cus_new_1" }),
      },
      checkout: {
        sessions: {
          create: async (payload: Record<string, unknown>) => {
            capturedSessionPayload = payload;
            return { client_secret: "cs_payment_123" };
          },
        },
      },
    },
    appUrl: "https://example.test",
  });

  const req = new Request("http://localhost/api/billing/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ priceKey: "candidate_custom", quantity: 12 }),
  });

  const res = await checkoutPOST(req);
  const body = (await responseJson(res)) as { clientSecret: string };
  assert.equal(res.status, 200);
  assert.equal(body.clientSecret, "cs_payment_123");
  assert.ok(capturedSessionPayload);
  assert.equal(capturedSessionPayload?.mode, "payment");
  assert.equal(capturedSessionPayload?.locale, "hu");
  assert.equal(
    (
      (capturedSessionPayload?.line_items as Array<{ price_data: { unit_amount: number } }>)?.[0]
        ?.price_data?.unit_amount
    ),
    37440,
  );
  assert.equal((capturedSessionPayload?.metadata as Record<string, string>)?.creditCount, "12");
  assert.match(
    String(capturedSessionPayload?.return_url),
    /addon=candidate/,
  );
});

test("D1 purchase route: validates team purchase payload and Stripe shape", async () => {
  setGlobalRuntime("__TRITA_BILLING_PURCHASE_RUNTIME__", {
    auth: async () => ({ userId: "clerk_1" }),
    isOneTimeTier: () => true,
    getOneTimePriceId: () => "price_team_snapshot_test",
    prisma: {
      userProfile: {
        findUnique: async () => ({
          id: "profile_1",
          email: "owner@test.trita.app",
          locale: "en",
        }),
      },
    },
  });

  const missingTeamReq = new Request("http://localhost/api/billing/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier: "team_snapshot" }),
  });
  const missingTeamRes = await purchasePOST(missingTeamReq);
  const missingTeamBody = (await responseJson(missingTeamRes)) as { error: string };
  assert.equal(missingTeamRes.status, 400);
  assert.equal(missingTeamBody.error, "TEAM_ID_REQUIRED");

  let capturedSessionPayload: Record<string, unknown> | null = null;
  setGlobalRuntime("__TRITA_BILLING_PURCHASE_RUNTIME__", {
    auth: async () => ({ userId: "clerk_1" }),
    isOneTimeTier: () => true,
    getOneTimePriceId: () => "price_team_snapshot_test",
    prisma: {
      userProfile: {
        findUnique: async () => ({
          id: "profile_1",
          email: "owner@test.trita.app",
          locale: "en",
        }),
      },
      team: {
        findUnique: async () => ({
          ownerId: "profile_1",
          orgId: "org_1",
        }),
      },
      subscription: {
        findUnique: async () => null,
      },
    },
    getActiveOrgMembership: async () => ({
      orgId: "org_1",
      role: "ORG_ADMIN",
      joinedAt: new Date("2026-04-01T10:00:00.000Z"),
    }),
    stripe: {
      customers: {
        create: async () => ({ id: "cus_new_2" }),
      },
      checkout: {
        sessions: {
          create: async (payload: Record<string, unknown>) => {
            capturedSessionPayload = payload;
            return { url: "https://stripe.test/checkout/session_1" };
          },
        },
      },
    },
    appUrl: "https://example.test",
  });

  const req = new Request("http://localhost/api/billing/purchase", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ tier: "team_snapshot", teamId: "team_1" }),
  });

  const res = await purchasePOST(req);
  const body = (await responseJson(res)) as { url: string };
  assert.equal(res.status, 200);
  assert.equal(body.url, "https://stripe.test/checkout/session_1");
  assert.equal(capturedSessionPayload?.mode, "payment");
  assert.equal((capturedSessionPayload?.metadata as Record<string, string>)?.type, "one_time_purchase");
  assert.equal((capturedSessionPayload?.metadata as Record<string, string>)?.tier, "team_snapshot");
});

test("D1 portal route: enforces auth and returns billing portal session url", async () => {
  setGlobalRuntime("__TRITA_BILLING_PORTAL_RUNTIME__", {
    checkRateLimit: async () => null,
    auth: async () => ({ userId: null }),
  });

  const unauthorized = await portalPOST();
  const unauthorizedBody = (await responseJson(unauthorized)) as { error: string };
  assert.equal(unauthorized.status, 401);
  assert.equal(unauthorizedBody.error, "UNAUTHORIZED");

  let capturedPortalPayload: Record<string, unknown> | null = null;
  setGlobalRuntime("__TRITA_BILLING_PORTAL_RUNTIME__", {
    checkRateLimit: async () => null,
    auth: async () => ({ userId: "clerk_1" }),
    prisma: {
      userProfile: { findUnique: async () => ({ id: "profile_1", locale: "hu" }) },
      subscription: { findUnique: async () => ({ stripeCustomerId: "cus_portal_1" }) },
    },
    getActiveOrgMembership: async () => ({
      orgId: "org_1",
      role: "ORG_ADMIN",
      joinedAt: new Date("2026-04-01T10:00:00.000Z"),
    }),
    stripe: {
      billingPortal: {
        sessions: {
          create: async (payload: Record<string, unknown>) => {
            capturedPortalPayload = payload;
            return { url: "https://stripe.test/portal/session_1" };
          },
        },
      },
    },
    appUrl: "https://example.test",
  });

  const success = await portalPOST();
  const successBody = (await responseJson(success)) as { url: string };
  assert.equal(success.status, 200);
  assert.equal(successBody.url, "https://stripe.test/portal/session_1");
  assert.equal(capturedPortalPayload?.customer, "cus_portal_1");
  assert.equal(capturedPortalPayload?.locale, "hu");
  assert.match(String(capturedPortalPayload?.return_url), /portal=updated/);
});

test("D1 webhook route: basic signature and event handling", async () => {
  setGlobalRuntime("__TRITA_STRIPE_WEBHOOK_RUNTIME__", {
    webhookSecret: undefined,
  });
  const noSecretReq = new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "sig_1" },
    body: "{}",
  });
  const noSecretRes = await stripeWebhookPOST(noSecretReq);
  assert.equal(noSecretRes.status, 500);

  setGlobalRuntime("__TRITA_STRIPE_WEBHOOK_RUNTIME__", {
    webhookSecret: "whsec_test",
  });
  const missingSigReq = new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    body: "{}",
  });
  const missingSigRes = await stripeWebhookPOST(missingSigReq);
  assert.equal(missingSigRes.status, 400);

  setGlobalRuntime("__TRITA_STRIPE_WEBHOOK_RUNTIME__", {
    webhookSecret: "whsec_test",
    stripe: {
      webhooks: {
        constructEvent: () => {
          throw new Error("invalid signature");
        },
      },
    },
  });
  const invalidSigReq = new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "sig_invalid" },
    body: "{}",
  });
  const invalidSigRes = await stripeWebhookPOST(invalidSigReq);
  assert.equal(invalidSigRes.status, 400);

  let createdPurchasePayload: Record<string, unknown> | null = null;
  setGlobalRuntime("__TRITA_STRIPE_WEBHOOK_RUNTIME__", {
    webhookSecret: "whsec_test",
    stripe: {
      webhooks: {
        constructEvent: () =>
          ({
            type: "checkout.session.completed",
            data: {
              object: {
                id: "cs_test_one_time",
                mode: "payment",
                amount_total: 9900,
                currency: "eur",
                payment_intent: "pi_test_1",
                metadata: {
                  type: "one_time_purchase",
                  tier: "team_snapshot",
                  userProfileId: "profile_1",
                  orgId: "org_1",
                  teamId: "team_1",
                },
              },
            },
          }) as { type: string; data: { object: Record<string, unknown> } },
      },
    },
    prisma: {
      purchase: {
        findFirst: async () => null,
        create: async (args: Record<string, unknown>) => {
          createdPurchasePayload = args;
          return {};
        },
      },
    },
  });
  const oneTimeReq = new Request("http://localhost/api/webhooks/stripe", {
    method: "POST",
    headers: { "stripe-signature": "sig_valid" },
    body: '{"id":"evt_1"}',
  });
  const oneTimeRes = await stripeWebhookPOST(oneTimeReq);
  const oneTimeBody = (await responseJson(oneTimeRes)) as { received: boolean };
  assert.equal(oneTimeRes.status, 200);
  assert.equal(oneTimeBody.received, true);
  assert.ok(createdPurchasePayload);
  assert.equal((createdPurchasePayload?.data as Record<string, string>)?.tier, "team_snapshot");
  assert.equal(
    (createdPurchasePayload?.data as Record<string, string>)?.stripeCheckoutSessionId,
    "cs_test_one_time",
  );
});

test("D1 billing return route: resolution redirects and candidate addon processing", async () => {
  const redirectFromMissingSession = await resolveBillingReturnResolution(
    {
      sessionId: undefined,
      addon: undefined,
      userId: "clerk_1",
    },
    {
      findProfileByClerkId: async () => ({ id: "profile_1" }),
      resolveJourneyFallbackForProfileId: async () => "/profile/results",
      retrieveSession: async () => {
        throw new Error("should not be called");
      },
      findCandidateCreditBySession: async () => null,
      addCredits: async () => undefined,
    },
  );
  assert.deepEqual(redirectFromMissingSession, {
    kind: "redirect",
    destination: "/profile/results",
  });

  const redirectFromOpenSession = await resolveBillingReturnResolution(
    {
      sessionId: "cs_open_1",
      addon: undefined,
      userId: null,
    },
    {
      findProfileByClerkId: async () => null,
      resolveJourneyFallbackForProfileId: async () => "/platform/home",
      retrieveSession: async () => ({
        status: "open",
        mode: "subscription",
        metadata: {},
      }),
      findCandidateCreditBySession: async () => null,
      addCredits: async () => undefined,
    },
  );
  assert.deepEqual(redirectFromOpenSession, {
    kind: "redirect",
    destination: "/billing/checkout",
  });

  let addCreditsCalledWith: Record<string, unknown> | null = null;
  const completeAddonResolution = await resolveBillingReturnResolution(
    {
      sessionId: "cs_addon_1",
      addon: "candidate",
      userId: null,
    },
    {
      findProfileByClerkId: async () => null,
      resolveJourneyFallbackForProfileId: async () => "/platform/home",
      retrieveSession: async () => ({
        status: "complete",
        mode: "payment",
        metadata: {
          type: "candidate_addon",
          orgId: "org_1",
          creditCount: "5",
          actorId: "profile_1",
        },
      }),
      findCandidateCreditBySession: async () => null,
      addCredits: async (payload) => {
        addCreditsCalledWith = payload;
      },
    },
  );
  assert.deepEqual(completeAddonResolution, {
    kind: "complete",
    handoffDestination: "/platform/home",
    candidateAddonApplied: true,
  });
  assert.ok(addCreditsCalledWith);
  assert.equal(addCreditsCalledWith?.orgId, "org_1");
  assert.equal(addCreditsCalledWith?.amount, 5);
  assert.match(String(addCreditsCalledWith?.note), /cs_addon_1/);
});

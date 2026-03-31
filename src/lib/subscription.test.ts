import test from "node:test";
import assert from "node:assert/strict";
import { getSubscriptionState } from "@/lib/subscription";

const NOW = new Date("2026-03-31T12:00:00.000Z");

test("returns none when subscription is missing", () => {
  assert.equal(getSubscriptionState(null, NOW), "none");
});

test("returns active for active status", () => {
  assert.equal(
    getSubscriptionState(
      { status: "active", trialEndsAt: null, currentPeriodEnd: null },
      NOW,
    ),
    "active",
  );
});

test("returns active for valid trialing status", () => {
  assert.equal(
    getSubscriptionState(
      {
        status: "trialing",
        trialEndsAt: new Date("2026-04-15T00:00:00.000Z"),
        currentPeriodEnd: null,
      },
      NOW,
    ),
    "active",
  );
});

test("returns restricted for past_due", () => {
  assert.equal(
    getSubscriptionState(
      {
        status: "past_due",
        trialEndsAt: null,
        currentPeriodEnd: new Date("2026-03-20T00:00:00.000Z"),
      },
      NOW,
    ),
    "restricted",
  );
});

test("returns restricted for recently canceled subscription", () => {
  assert.equal(
    getSubscriptionState(
      {
        status: "canceled",
        trialEndsAt: null,
        currentPeriodEnd: new Date("2026-03-15T00:00:00.000Z"),
      },
      NOW,
    ),
    "restricted",
  );
});

test("returns frozen for canceled subscription older than 30 days", () => {
  assert.equal(
    getSubscriptionState(
      {
        status: "canceled",
        trialEndsAt: null,
        currentPeriodEnd: new Date("2026-02-10T00:00:00.000Z"),
      },
      NOW,
    ),
    "frozen",
  );
});


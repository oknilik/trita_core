import test from "node:test";
import assert from "node:assert/strict";
import { getCapabilityGateCopy } from "@/lib/policy-ux";

test("subscription-related denial returns billing reactivation copy", () => {
  const copy = getCapabilityGateCopy({
    locale: "en",
    reason: "SUBSCRIPTION_RESTRICTED",
    upgradeHintCode: "reactivate_subscription",
  });

  assert.equal(copy.ctaHref, "/contact");
  assert.equal(copy.ctaLabel, "Manage subscription");
});

test("role insufficient denial returns role guidance copy", () => {
  const copy = getCapabilityGateCopy({
    locale: "hu",
    reason: "ROLE_INSUFFICIENT",
    upgradeHintCode: "request_manager_access",
  });

  assert.ok(copy.title.includes("jogosults"));
  assert.equal(copy.ctaHref, "/platform/home");
});


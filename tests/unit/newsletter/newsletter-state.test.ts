import test from "node:test";
import assert from "node:assert/strict";
import {
  confirmationDecision,
  providerDeliveryTransition,
  type DeliveryStatus,
} from "@/lib/newsletter";
import { runNewsletterSendQueue } from "@/lib/newsletter-send";

test("csak ervenyes PENDING token aktivalhat feliratkozast", () => {
  const now = new Date("2026-08-21T12:00:00.000Z");
  const future = new Date("2026-08-22T12:00:00.000Z");
  const expired = new Date("2026-08-21T12:00:00.000Z");

  assert.equal(confirmationDecision("PENDING", future, now), "activate");
  assert.equal(confirmationDecision("PENDING", expired, now), "expired");
  assert.equal(confirmationDecision("ACTIVE", expired, now), "already_active");
  assert.equal(confirmationDecision("UNSUBSCRIBED", future, now), "invalid");
  assert.equal(confirmationDecision("BOUNCED", future, now), "invalid");
});

test("keson erkezo webhook nem ir felul erosebb kezbesitesi tenyt", () => {
  const cases: Array<[DeliveryStatus, Parameters<typeof providerDeliveryTransition>[1], DeliveryStatus]> = [
    ["ACCEPTED", "delivered", "DELIVERED"],
    ["FAILED", "delivered", "DELIVERED"],
    ["DELIVERED", "failed", "DELIVERED"],
    ["BOUNCED", "delivered", "BOUNCED"],
    ["DELIVERED", "complaint", "COMPLAINED"],
    ["COMPLAINED", "bounce", "COMPLAINED"],
  ];
  for (const [current, event, expected] of cases) {
    assert.equal(providerDeliveryTransition(current, event), expected);
  }
});

test("egy varatlan kuldesi kivetel nem szakithatja felbe a tobbi cimzettet", async () => {
  const outcomes = await runNewsletterSendQueue(["hibas", "jo"], async (item) => {
    if (item === "hibas") throw new Error("unexpected template failure");
    return { ok: true as const, providerEmailId: "provider-ok" };
  });

  assert.equal(outcomes.length, 2);
  assert.equal(outcomes[0]?.result.ok, false);
  if (!outcomes[0]?.result.ok) assert.equal(outcomes[0]?.result.code, "queue_exception");
  assert.deepEqual(outcomes[1]?.result, { ok: true, providerEmailId: "provider-ok" });
});

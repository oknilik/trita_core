import crypto from "node:crypto";
import test, { after } from "node:test";
import assert from "node:assert/strict";
import { prisma } from "@/lib/prisma";
import {
  markDeliveryFailure,
  requestSubscription,
  reserveDeliveries,
} from "@/lib/newsletter";

const runId = crypto.randomUUID();
const emailPrefix = `newsletter-it-${runId}`;

after(async () => {
  await prisma.newsletterSubscriber.deleteMany({
    where: { email: { startsWith: emailPrefix } },
  });
  await prisma.$disconnect();
});

async function createActiveSubscriber(localPart: string) {
  return prisma.newsletterSubscriber.create({
    data: {
      email: `${emailPrefix}-${localPart}@example.com`,
      locale: "hu",
      status: "ACTIVE",
      topics: ["blog"],
      source: "account",
      confirmToken: crypto.randomUUID(),
      tokenExpiresAt: new Date(),
      unsubToken: crypto.randomUUID(),
      confirmedAt: new Date(),
      confirmationEmailStatus: "NOT_REQUIRED",
    },
  });
}

test("parhuzamos delivery-foglalasnak pontosan egy nyertese van", async () => {
  const subscriber = await createActiveSubscriber("claim");
  const slug = `integration-${runId}`;

  const [left, right] = await Promise.all([
    reserveDeliveries(slug, [subscriber.id]),
    reserveDeliveries(slug, [subscriber.id]),
  ]);
  const wins = [left, right].filter((result) => result.has(subscriber.id));
  assert.equal(wins.length, 1);

  const first = wins[0]!.get(subscriber.id)!;
  assert.equal(first.attemptCount, 1);
  await markDeliveryFailure(first.id, {
    uncertain: false,
    code: "provider_rejected",
    message: "definitive failure",
  });

  const retry = await reserveDeliveries(slug, [subscriber.id]);
  assert.equal(retry.get(subscriber.id)?.id, first.id);
  assert.equal(retry.get(subscriber.id)?.attemptCount, 2);
});

test("publikus kerestol az ACTIVE sor nyelve es temai valtozatlanok", async () => {
  const subscriber = await createActiveSubscriber("active-noop");

  const result = await requestSubscription({
    email: subscriber.email.toUpperCase(),
    locale: "en",
    source: "footer",
    topics: ["newsletter"],
  });
  assert.equal(result.outcome, "already_active");

  const stored = await prisma.newsletterSubscriber.findUniqueOrThrow({
    where: { id: subscriber.id },
    select: { locale: true, topics: true, source: true, status: true },
  });
  assert.deepEqual(stored, {
    locale: "hu",
    topics: ["blog"],
    source: "account",
    status: "ACTIVE",
  });
});

#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const ENV_FILES = [
  ".env",
  ".env.local",
  ".env.development",
  ".env.development.local",
];

function parseDotEnv(contents) {
  const env = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const equalIndex = line.indexOf("=");
    if (equalIndex < 0) continue;
    const key = line.slice(0, equalIndex).trim();
    let value = line.slice(equalIndex + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }
  return env;
}

function loadEnv() {
  const merged = { ...process.env };
  for (const file of ENV_FILES) {
    const absolute = path.resolve(process.cwd(), file);
    if (!existsSync(absolute)) continue;
    const parsed = parseDotEnv(readFileSync(absolute, "utf8"));
    for (const [key, value] of Object.entries(parsed)) {
      merged[key] = value;
    }
  }
  return merged;
}

function classifyKeyMode(value, kind) {
  if (!value) return "missing";
  if (kind === "secret") {
    if (value.startsWith("sk_test_")) return "test";
    if (value.startsWith("sk_live_")) return "live";
  }
  if (kind === "publishable") {
    if (value.startsWith("pk_test_")) return "test";
    if (value.startsWith("pk_live_")) return "live";
  }
  return "unknown";
}

function summarizeKey(value) {
  if (!value) return "missing";
  return `${value.slice(0, 7)}...${value.slice(-4)}`;
}

function authHeader(key) {
  return `Basic ${Buffer.from(`${key}:`).toString("base64")}`;
}

async function createProbePaymentIntent(secretKey) {
  const response = await fetch("https://api.stripe.com/v1/payment_intents", {
    method: "POST",
    headers: {
      Authorization: authHeader(secretKey),
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      amount: "100",
      currency: "eur",
      "automatic_payment_methods[enabled]": "true",
      "metadata[purpose]": "trita_keypair_sanity",
    }),
  });
  const body = await response.json();
  return { ok: response.ok, status: response.status, body };
}

async function readProbePaymentIntentWithPublishable(publishableKey, intentId, clientSecret) {
  const response = await fetch(
    `https://api.stripe.com/v1/payment_intents/${intentId}?client_secret=${encodeURIComponent(clientSecret)}`,
    {
      method: "GET",
      headers: {
        Authorization: authHeader(publishableKey),
      },
    },
  );
  const body = await response.json();
  return { ok: response.ok, status: response.status, body };
}

async function main() {
  const env = loadEnv();
  const secretKey = env.STRIPE_SECRET_KEY || "";
  const publishableKey = env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || "";

  const secretMode = classifyKeyMode(secretKey, "secret");
  const publishableMode = classifyKeyMode(publishableKey, "publishable");

  console.log("Stripe keypair sanity check");
  console.log("==========================");
  console.log(`Secret key:      ${summarizeKey(secretKey)} (${secretMode})`);
  console.log(`Publishable key: ${summarizeKey(publishableKey)} (${publishableMode})`);

  if (!secretKey || !publishableKey) {
    console.error("");
    console.error("FAIL: Missing STRIPE_SECRET_KEY or NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY.");
    process.exit(1);
  }

  if (secretMode !== publishableMode) {
    console.error("");
    console.error(
      `FAIL: Key mode mismatch (${secretMode} vs ${publishableMode}). Use test-test or live-live pair.`,
    );
    process.exit(1);
  }

  const created = await createProbePaymentIntent(secretKey);
  if (!created.ok) {
    console.error("");
    console.error("FAIL: Could not create probe PaymentIntent with secret key.");
    console.error(
      `Stripe response: ${created.status} ${created.body?.error?.type ?? ""} ${created.body?.error?.code ?? ""}`.trim(),
    );
    process.exit(1);
  }

  const probeId = created.body.id;
  const probeClientSecret = created.body.client_secret;

  const read = await readProbePaymentIntentWithPublishable(
    publishableKey,
    probeId,
    probeClientSecret,
  );

  if (!read.ok) {
    console.error("");
    console.error("FAIL: Publishable key cannot read intent created by secret key.");
    console.error(
      `Stripe response: ${read.status} ${read.body?.error?.type ?? ""} ${read.body?.error?.code ?? ""}`.trim(),
    );
    console.error(
      "Likely cause: keys belong to different Stripe accounts, or stale NEXT_PUBLIC key in running dev server.",
    );
    process.exit(1);
  }

  console.log("");
  console.log("PASS: Secret and publishable keys are compatible for PaymentElement flows.");
}

main().catch((error) => {
  console.error("");
  console.error("FAIL: Unexpected error during keypair check.");
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});


#!/usr/bin/env node

const required = [
  "NEXT_PUBLIC_APP_URL",
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SECRET",
  "DATABASE_URL",
  "DIRECT_URL",
  "RESEND_API_KEY",
  "RESEND_WEBHOOK_SECRET",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "CRON_SECRET",
  "ERROR_ALERT_WEBHOOK_URL",
  "ANALYTICS_SALT",
];

const failures = [];
for (const name of required) {
  const value = process.env[name]?.trim();
  if (!value || /REPLACE_ME|dummy|example\.com/i.test(value)) failures.push(`${name}: missing or placeholder`);
}

try {
  const appUrl = new URL(process.env.NEXT_PUBLIC_APP_URL ?? "");
  if (appUrl.protocol !== "https:" || appUrl.hostname !== "trita.io") {
    failures.push("NEXT_PUBLIC_APP_URL: must be https://trita.io for production sign-off");
  }
} catch {
  failures.push("NEXT_PUBLIC_APP_URL: invalid URL");
}

if (process.env.VERCEL_ENV === "preview") {
  if (!process.env.PREVIEW_DATABASE_URL) failures.push("preview: PREVIEW_DATABASE_URL is required");
  if (process.env.DATABASE_URL && process.env.DATABASE_URL === process.env.PRODUCTION_DATABASE_URL) {
    failures.push("preview: DATABASE_URL matches PRODUCTION_DATABASE_URL");
  }
  if (process.env.ALLOW_EXTERNAL_EMAIL === "1") failures.push("preview: external email must remain disabled");
}

if (process.env.LEGAL_RELEASE_APPROVED !== "1") {
  failures.push("LEGAL_RELEASE_APPROVED: legal owner sign-off is required");
}

if (failures.length) {
  console.error("Pilot release preflight failed:\n- " + failures.join("\n- "));
  process.exit(1);
}
console.log("Pilot release preflight passed (configuration presence only; run the signed smoke checklist too).");

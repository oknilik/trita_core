/**
 * seed-reminders.ts — Fake reminder test data generator
 * Creates 12 AssessmentDrafts and 12 ObserverInvitations with variety:
 *   - Some with no reminder sent (active)
 *   - Some with reminder sent recently (< 3 days → "Friss" badge, dimmed)
 *   - Some with reminder sent > 3 days ago (active again)
 *
 * Usage: npx tsx scripts/seed-reminders.ts [--clean]
 *   --clean  Remove all seeded records (cleanup mode)
 */

import { readFileSync } from "fs";
import { resolve } from "path";

function loadEnv() {
  for (const file of [".env.local", ".env"]) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, raw] = match;
        if (!process.env[key]) process.env[key] = raw.replace(/^['"]|['"]$/g, "").trim();
      }
      return;
    } catch { /* try next */ }
  }
}
loadEnv();

import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SEED_TAG = "seed-reminder-test";

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

function hoursAgo(n: number): Date {
  return new Date(Date.now() - n * 60 * 60 * 1000);
}

function makeAnswers(count: number): object {
  const answers: Record<number, number> = {};
  for (let i = 1; i <= count; i++) {
    answers[i] = ((i * 3 + 1) % 5) + 1;
  }
  return answers;
}

// Seed definitions — 12 incomplete draft users + 3 "completed meanwhile"
const DRAFT_SEEDS = [
  // Active (no reminder sent)
  { n: "01", testType: "HEXACO",          answers: 5,  updatedDaysAgo: 5,  lastReminder: null,           reminderCount: 0 },
  { n: "02", testType: "HEXACO",          answers: 15, updatedDaysAgo: 7,  lastReminder: null,           reminderCount: 0 },
  { n: "03", testType: "HEXACO",          answers: 25, updatedDaysAgo: 3,  lastReminder: null,           reminderCount: 0 },
  { n: "04", testType: "HEXACO_MODIFIED", answers: 35, updatedDaysAgo: 10, lastReminder: null,           reminderCount: 0 },
  { n: "05", testType: "HEXACO_MODIFIED", answers: 45, updatedDaysAgo: 4,  lastReminder: null,           reminderCount: 0 },
  // Recently reminded ("Friss" badge, dimmed)
  { n: "06", testType: "HEXACO",          answers: 8,  updatedDaysAgo: 6,  lastReminder: daysAgo(1),     reminderCount: 1 },
  { n: "07", testType: "HEXACO",          answers: 20, updatedDaysAgo: 8,  lastReminder: daysAgo(2),     reminderCount: 1 },
  { n: "08", testType: "BIG_FIVE",        answers: 30, updatedDaysAgo: 5,  lastReminder: hoursAgo(10),   reminderCount: 1 },
  // Reminder sent > 3 days ago (active again)
  { n: "09", testType: "HEXACO",          answers: 12, updatedDaysAgo: 9,  lastReminder: daysAgo(5),     reminderCount: 1 },
  { n: "10", testType: "HEXACO_MODIFIED", answers: 22, updatedDaysAgo: 12, lastReminder: daysAgo(4),     reminderCount: 1 },
  { n: "11", testType: "HEXACO",          answers: 38, updatedDaysAgo: 7,  lastReminder: daysAgo(8),     reminderCount: 2 },
  // Active, BIG_FIVE, almost done
  { n: "12", testType: "BIG_FIVE",        answers: 48, updatedDaysAgo: 3,  lastReminder: null,           reminderCount: 0 },
] as const;

// "Completed meanwhile" draft users — have a draft + an AssessmentResult
// These appear pre-rendered as gray "Már kész" rows
const COMPLETED_DRAFT_SEEDS = [
  { n: "c1", testType: "HEXACO",          answers: 55, updatedDaysAgo: 8,  lastReminder: daysAgo(5), reminderCount: 1 },
  { n: "c2", testType: "HEXACO_MODIFIED", answers: 40, updatedDaysAgo: 6,  lastReminder: null,        reminderCount: 0 },
  { n: "c3", testType: "BIG_FIVE",        answers: 44, updatedDaysAgo: 4,  lastReminder: daysAgo(3),  reminderCount: 1 },
] as const;

// Observer invitation seed definitions — 12 items
const INV_SEEDS = [
  // Active (no reminder sent)
  { n: "01", createdDaysAgo: 4,  lastReminder: null,         reminderCount: 0, observerName: "Kovács Anna (seed)" },
  { n: "02", createdDaysAgo: 6,  lastReminder: null,         reminderCount: 0, observerName: "Nagy Péter (seed)" },
  { n: "03", createdDaysAgo: 8,  lastReminder: null,         reminderCount: 0, observerName: "Szabó Ildikó (seed)" },
  { n: "04", createdDaysAgo: 14, lastReminder: null,         reminderCount: 0, observerName: "Tóth Balázs (seed)" },
  { n: "05", createdDaysAgo: 5,  lastReminder: null,         reminderCount: 0, observerName: "Varga Éva (seed)" },
  // Recently reminded ("Friss" badge, dimmed)
  { n: "06", createdDaysAgo: 7,  lastReminder: daysAgo(1),   reminderCount: 1, observerName: "Horváth Gábor (seed)" },
  { n: "07", createdDaysAgo: 10, lastReminder: daysAgo(2),   reminderCount: 1, observerName: "Kiss Zsuzsanna (seed)" },
  { n: "08", createdDaysAgo: 9,  lastReminder: hoursAgo(8),  reminderCount: 1, observerName: "Fekete Dániel (seed)" },
  // Reminder sent > 3 days ago (active again)
  { n: "09", createdDaysAgo: 11, lastReminder: daysAgo(4),   reminderCount: 1, observerName: "Molnár Réka (seed)" },
  { n: "10", createdDaysAgo: 13, lastReminder: daysAgo(6),   reminderCount: 1, observerName: "Papp Tamás (seed)" },
  { n: "11", createdDaysAgo: 15, lastReminder: daysAgo(7),   reminderCount: 2, observerName: "Lukács Orsolya (seed)" },
  // Active, second reminder pending
  { n: "12", createdDaysAgo: 5,  lastReminder: null,         reminderCount: 0, observerName: "Balogh Márton (seed)" },
] as const;

// "Completed meanwhile" observer invitations — seeded as PENDING then updated to COMPLETED
// These appear pre-rendered as gray "Már kész" rows in the observer section
const COMPLETED_INV_SEEDS = [
  { n: "c1", createdDaysAgo: 9,  completedDaysAgo: 1, lastReminder: daysAgo(6), reminderCount: 1, observerName: "Németh Fanni (seed)" },
  { n: "c2", createdDaysAgo: 7,  completedDaysAgo: 2, lastReminder: null,        reminderCount: 0, observerName: "Szilágyi Krisztián (seed)" },
  { n: "c3", createdDaysAgo: 12, completedDaysAgo: 3, lastReminder: daysAgo(9), reminderCount: 2, observerName: "Erdei Nóra (seed)" },
] as const;

async function clean() {
  // Must delete results before profiles (FK constraint)
  const d0 = await prisma.assessmentResult.deleteMany({
    where: { userProfile: { email: { contains: SEED_TAG } } },
  });
  const d1 = await prisma.assessmentDraft.deleteMany({
    where: { userProfile: { email: { contains: SEED_TAG } } },
  });
  const d2 = await prisma.observerInvitation.deleteMany({
    where: { observerEmail: { contains: SEED_TAG } },
  });
  const d3 = await prisma.userProfile.deleteMany({
    where: { email: { contains: SEED_TAG } },
  });
  console.log(`🧹 Cleaned: ${d0.count} results, ${d1.count} drafts, ${d2.count} invitations, ${d3.count} profiles`);
}

async function seed() {
  // Bail if already seeded
  const existingCount = await prisma.userProfile.count({
    where: { email: { contains: SEED_TAG } },
  });
  if (existingCount > 0) {
    console.log(`ℹ️  Found ${existingCount} seeded profiles already. Run with --clean first to reseed.`);
    return;
  }

  // ── Draft section ─────────────────────────────────────────────────────
  console.log("\n📝 Creating draft users and drafts...");
  let draftCreated = 0;

  for (const s of DRAFT_SEEDS) {
    const email = `${SEED_TAG}-${s.n}@trita-dev.internal`;
    const user = await prisma.userProfile.create({
      data: {
        email,
        username: `Seed User ${s.n}`,
        testType: s.testType,
        deleted: false,
      },
    });

    const updatedAt = daysAgo(s.updatedDaysAgo);
    await prisma.assessmentDraft.create({
      data: {
        userProfileId: user.id,
        testType: s.testType,
        answers: makeAnswers(s.answers),
        currentPage: Math.ceil(s.answers / 10) + 1,
        createdAt: daysAgo(s.updatedDaysAgo + 1),
        updatedAt,
        draftReminderCount: s.reminderCount,
        lastDraftReminderSentAt: s.lastReminder,
      },
    });
    draftCreated++;
  }

  console.log(`   ✅ Created ${draftCreated} incomplete draft records`);
  console.log(`      - 5 active (no reminder sent)`);
  console.log(`      - 3 recently reminded (< 3 days → "Friss")`);
  console.log(`      - 3 re-activated (reminder > 3 days ago)`);
  console.log(`      - 1 BIG_FIVE, almost done`);

  // ── "Completed meanwhile" drafts ─────────────────────────────────────
  let completedDraftCreated = 0;
  for (const s of COMPLETED_DRAFT_SEEDS) {
    const email = `${SEED_TAG}-${s.n}@trita-dev.internal`;
    const user = await prisma.userProfile.create({
      data: {
        email,
        username: `Seed Completed User ${s.n}`,
        testType: s.testType,
        deleted: false,
      },
    });

    const updatedAt = daysAgo(s.updatedDaysAgo);
    await prisma.assessmentDraft.create({
      data: {
        userProfileId: user.id,
        testType: s.testType,
        answers: makeAnswers(s.answers),
        currentPage: Math.ceil(s.answers / 10) + 1,
        createdAt: daysAgo(s.updatedDaysAgo + 2),
        updatedAt,
        draftReminderCount: s.reminderCount,
        lastDraftReminderSentAt: s.lastReminder,
      },
    });

    // Create a completed AssessmentResult so this draft appears as "Már kész"
    const hexacoScores = { H: 65, E: 72, X: 58, A: 80, C: 68, O: 75 };
    const bfasScores = { O: 70, C: 65, E: 60, A: 78, N: 45 };
    await prisma.assessmentResult.create({
      data: {
        userProfileId: user.id,
        testType: s.testType,
        scores: s.testType === "BIG_FIVE" ? bfasScores : hexacoScores,
        isSelfAssessment: true,
        createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000), // completed 12 hours ago
      },
    });
    completedDraftCreated++;
  }
  console.log(`   ✅ Created ${completedDraftCreated} "completed meanwhile" draft records (gray rows)`);

  // ── Observer invitation section ───────────────────────────────────────
  const realInviter = await prisma.userProfile.findFirst({
    where: {
      deleted: false,
      email: { not: { contains: SEED_TAG } },
    },
  });

  if (!realInviter) {
    console.log("\n⚠️  No real user found — skipping observer invitation seeding");
  } else {
    console.log(`\n✉️  Creating observer invitations (inviter: ${realInviter.email})...`);
    let invCreated = 0;

    for (const s of INV_SEEDS) {
      const observerEmail = `${SEED_TAG}-obs-${s.n}@trita-dev.internal`;
      const createdAt = daysAgo(s.createdDaysAgo);
      await prisma.observerInvitation.create({
        data: {
          inviterId: realInviter.id,
          observerEmail,
          observerName: s.observerName,
          testType: realInviter.testType ?? "HEXACO",
          status: "PENDING",
          expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          createdAt,
          reminderCount: s.reminderCount,
          lastReminderSentAt: s.lastReminder,
        },
      });
      invCreated++;
    }

    console.log(`   ✅ Created ${invCreated} pending invitation records`);
    console.log(`      - 5 active (no reminder sent)`);
    console.log(`      - 3 recently reminded (< 3 days → "Friss")`);
    console.log(`      - 3 re-activated (reminder > 3 days ago)`);
    console.log(`      - 1 active, awaiting second reminder`);

    // ── "Completed meanwhile" observer invitations ──────────────────────
    let completedInvCreated = 0;
    for (const s of COMPLETED_INV_SEEDS) {
      const observerEmail = `${SEED_TAG}-obs-${s.n}@trita-dev.internal`;
      const createdAt = daysAgo(s.createdDaysAgo);
      const inv = await prisma.observerInvitation.create({
        data: {
          inviterId: realInviter.id,
          observerEmail,
          observerName: s.observerName,
          testType: realInviter.testType ?? "HEXACO",
          status: "COMPLETED",
          completedAt: daysAgo(s.completedDaysAgo),
          expiresAt: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000),
          createdAt,
          reminderCount: s.reminderCount,
          lastReminderSentAt: s.lastReminder,
        },
      });
      void inv;
      completedInvCreated++;
    }
    console.log(`   ✅ Created ${completedInvCreated} "completed meanwhile" invitation records (gray rows)`);
  }

  console.log("\n✅ Done — refresh /admin → Emlékeztetők tab to see all rows");
  console.log("   Tip: Click any row's Küldés button to test the send flow");
  console.log("   Tip: Run with --clean to remove all seeded records\n");
}

const isClean = process.argv.includes("--clean");
(isClean ? clean() : seed()).finally(() => prisma.$disconnect());

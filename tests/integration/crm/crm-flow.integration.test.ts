/**
 * CRM flow integration tests — valós teszt-DB-vel, a teljes deal-életcikluson:
 * inquiry → deal (kvalifikáció) → naplózás + next action EGY hívásban →
 * quote DRAFT → SENT → ACCEPTED → deal WON; immutabilitás-őrök; „Ma”
 * lekérdezés; inquiry auto-attach (submitInquiry hook); org-access → WON;
 * napi CRM-sweep (notif + dedupe + ajánlat auto-expire).
 *
 * A migrációkat a test:integration bootstrap (migrate deploy) teszi fel —
 * ez a futás egyben az új CRM-migrációk éles próbája is.
 */

import "./admin-env-setup";
import { CRM_TEST_ADMIN_EMAIL } from "./admin-env-setup";
import test from "node:test";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
  attachInquiryToOpenDeal,
  closeDeal,
  createDeal,
  createDealFromInquiry,
  createQuote,
  CrmServiceError,
  deleteDraftQuote,
  duplicateQuote,
  getDueDeals,
  handleOrgAccessGranted,
  logActivity,
  markQuoteAccepted,
  markQuoteSent,
  setNextAction,
  updateDraftQuoteInput,
} from "@/lib/crm/service";
import {
  buildNextActionDueDedupeKey,
  buildQuoteExpiringDedupeKey,
  resolveCrmDueWindow,
} from "@/lib/crm/guards";
import { emptyQuoteInput, calculateQuote } from "@/lib/quote/calculate";
import { quoteInputSchema, rateCardSchema, DEFAULT_RATE_CARD } from "@/lib/quote/rate-card";
import { loadRateCard, saveRateCard } from "@/lib/quote/rate-card.server";
import { runNotificationSweep } from "@/lib/notifications/sweep";

const DAY_MS = 24 * 60 * 60 * 1000;

function makeId(prefix: string): string {
  return `${prefix}_${randomUUID().replace(/-/g, "").slice(0, 10)}`;
}

function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY_MS);
}

function systemActivities(dealId: string) {
  return prisma.crmActivity.findMany({
    where: { dealId, kind: "SYSTEM" },
    orderBy: { createdAt: "asc" },
  });
}

async function createTestInquiry(overrides: Partial<{
  name: string;
  email: string;
  company: string | null;
  topic: string;
  message: string;
}> = {}) {
  return prisma.inquiry.create({
    data: {
      name: overrides.name ?? "Kiss Anna",
      email: overrides.email ?? `${makeId("inq")}@test.trita.app`,
      company: overrides.company === undefined ? "Acme Kft." : overrides.company,
      topic: overrides.topic ?? "demo",
      message: overrides.message ?? "Szeretnénk egy demót a csapatunknak.",
      source: "contact_form",
    },
  });
}

function baseDealInput(email?: string) {
  return {
    contactName: "Teszt Kontakt",
    contactEmail: email ?? `${makeId("deal")}@test.trita.app`,
    company: "Teszt Cég Kft.",
    source: "referral" as const,
  };
}

test("CRM flow", async (t) => {
  // Admin-profil a notification-címzéshez (ADMIN_EMAILS az env-setupból).
  const adminProfile = await prisma.userProfile.create({
    data: {
      id: makeId("crmadmin"),
      clerkId: makeId("clerk"),
      email: CRM_TEST_ADMIN_EMAIL,
      username: "CRM Admin",
    },
  });

  await t.test("inquiry → deal: kontakt-átemelés, link, IN_PROGRESS, SYSTEM-activity", async () => {
    const inquiry = await createTestInquiry();
    const deal = await createDealFromInquiry(inquiry.id);

    assert.equal(deal.title, "Acme Kft. – Demó igény");
    assert.equal(deal.contactName, "Kiss Anna");
    assert.equal(deal.contactEmail, inquiry.email.toLowerCase());
    assert.equal(deal.company, "Acme Kft.");
    assert.equal(deal.source, "inquiry");
    assert.equal(deal.stage, "NEW");
    assert.ok(deal.lastActivityAt, "nyitó SYSTEM-activity frissíti a lastActivityAt-ot");

    const linked = await prisma.inquiry.findUniqueOrThrow({ where: { id: inquiry.id } });
    assert.equal(linked.dealId, deal.id);
    assert.equal(linked.status, "IN_PROGRESS");

    const system = await systemActivities(deal.id);
    assert.equal(system.length, 1);
    assert.ok(system[0].summary.includes("beérkező megkeresésből"));
    assert.ok(system[0].body?.includes("Szeretnénk egy demót"));

    // Már linkelt inquiry-ből nem nyitható második deal.
    await assert.rejects(
      createDealFromInquiry(inquiry.id),
      (err: unknown) => err instanceof CrmServiceError && err.code === "INQUIRY_ALREADY_LINKED",
    );
  });

  await t.test("logActivity: naplózás + következő lépés EGY hívásban (tranzakció)", async () => {
    const deal = await createDeal(baseDealInput());
    const nextAt = daysFromNow(1);

    const { activity, deal: updated } = await logActivity(
      deal.id,
      { kind: "CALL", summary: "Bemutatkozó hívás megvolt" },
      { at: nextAt, note: "Ajánlat-vázlat küldése" },
    );

    assert.equal(activity.kind, "CALL");
    assert.equal(updated.nextActionAt?.getTime(), nextAt.getTime());
    assert.equal(updated.nextActionNote, "Ajánlat-vázlat küldése");
    assert.ok(updated.lastActivityAt && updated.lastActivityAt >= activity.occurredAt);

    // nextAction nélküli naplózás nem nyúl a kitűzött lépéshez.
    const { deal: after } = await logActivity(deal.id, {
      kind: "NOTE",
      summary: "Belső jegyzet",
    });
    assert.equal(after.nextActionAt?.getTime(), nextAt.getTime());

    // Nem létező deal → DEAL_NOT_FOUND, semmi sem íródik.
    await assert.rejects(
      logActivity("no-such-deal", { kind: "NOTE", summary: "x" }),
      (err: unknown) => err instanceof CrmServiceError && err.code === "DEAL_NOT_FOUND",
    );
  });

  await t.test("close_lost: outcomeKind kötelező; zárás törli a next actiont", async () => {
    const deal = await createDeal(baseDealInput());
    await setNextAction(deal.id, daysFromNow(2), "Follow-up");

    await assert.rejects(
      closeDeal(deal.id, { outcome: "LOST" }),
      (err: unknown) => err instanceof CrmServiceError && err.code === "LOST_REASON_REQUIRED",
    );

    const closed = await closeDeal(deal.id, {
      outcome: "LOST",
      outcomeKind: "timing",
      outcomeNote: "Jövő negyedévben térnek vissza",
    });
    assert.equal(closed.stage, "LOST");
    assert.ok(closed.closedAt);
    assert.equal(closed.outcomeKind, "timing");
    assert.equal(closed.nextActionAt, null);
    assert.equal(closed.nextActionNote, null);

    // Zárt deal nem zárható újra.
    await assert.rejects(
      closeDeal(deal.id, { outcome: "WON" }),
      (err: unknown) => err instanceof CrmServiceError && err.code === "INVALID_TRANSITION",
    );
  });

  await t.test("„Ma” lekérdezés: lejárt + mai igen; jövőbeli és zárt nem", async () => {
    const overdue = await createDeal(baseDealInput());
    await setNextAction(overdue.id, daysFromNow(-1), "Tegnapi teendő");
    const today = await createDeal(baseDealInput());
    await setNextAction(today.id, new Date(), "Mai teendő");
    const upcoming = await createDeal(baseDealInput());
    await setNextAction(upcoming.id, daysFromNow(3), "Ráér");
    // Zárt deal lejárt next actionnel (közvetlen DB-írás, stale-adat szimuláció).
    const closedStale = await prisma.deal.create({
      data: {
        title: "Stale zárt deal",
        contactName: "X",
        contactEmail: `${makeId("stale")}@test.trita.app`,
        stage: "LOST",
        nextActionAt: daysFromNow(-2),
        closedAt: new Date(),
        outcomeKind: "other",
      },
    });

    const due = await getDueDeals();
    const dueIds = new Set(due.map((deal) => deal.id));
    assert.ok(dueIds.has(overdue.id), "lejárt next action bent van");
    assert.ok(dueIds.has(today.id), "mai next action bent van");
    assert.ok(!dueIds.has(upcoming.id), "jövőbeli nincs bent");
    assert.ok(!dueIds.has(closedStale.id), "zárt deal nincs bent");
    // Rendezés: a lejárt előbb, mint a mai.
    assert.ok(
      due.findIndex((deal) => deal.id === overdue.id) <
        due.findIndex((deal) => deal.id === today.id),
    );
  });

  await t.test("quote-életciklus: DRAFT → SENT → ACCEPTED → deal WON; immutabilitás", async () => {
    const deal = await createDeal(baseDealInput());
    await setNextAction(deal.id, daysFromNow(2), "Ajánlat után follow-up");

    const quote = await createQuote({ dealId: deal.id, input: emptyQuoteInput() });
    assert.equal(quote.status, "DRAFT");
    assert.ok(quote.quoteNo >= 1);
    assert.ok(quote.title?.includes("Teszt Cég Kft."));

    // netTotal = a pillanatképpel újraszámolt eredmény (kiemelés-konzisztencia).
    const snapshotRate = rateCardSchema.parse(quote.rateCardSnapshot);
    const recomputed = calculateQuote(quoteInputSchema.parse(quote.input), snapshotRate);
    assert.equal(quote.netTotal, recomputed.netTotal);

    // SENT: sentAt + default validUntil (+30 nap) + deal → QUOTED + SYSTEM-activity.
    const sent = await markQuoteSent(quote.id);
    assert.equal(sent.status, "SENT");
    assert.ok(sent.sentAt);
    assert.ok(sent.validUntil);
    const expectedValidUntil = Date.now() + 30 * DAY_MS;
    assert.ok(Math.abs(sent.validUntil.getTime() - expectedValidUntil) < 5 * 60 * 1000);

    const dealAfterSent = await prisma.deal.findUniqueOrThrow({ where: { id: deal.id } });
    assert.equal(dealAfterSent.stage, "QUOTED");
    const sentActivity = (await systemActivities(deal.id)).find((a) =>
      a.summary.includes("Ajánlat kiküldve"),
    );
    assert.ok(sentActivity, "SYSTEM-activity a kiküldésről");

    // Immutabilitás SENT-től: input-írás és törlés tiltott, a sor változatlan.
    await assert.rejects(
      updateDraftQuoteInput(quote.id, { ...emptyQuoteInput(), headcount: 99 }),
      (err: unknown) => err instanceof CrmServiceError && err.code === "QUOTE_NOT_DRAFT",
    );
    await assert.rejects(
      deleteDraftQuote(quote.id),
      (err: unknown) => err instanceof CrmServiceError && err.code === "ONLY_DRAFT_DELETABLE",
    );
    const untouched = await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } });
    assert.equal(untouched.netTotal, quote.netTotal);
    assert.deepEqual(untouched.input, quote.input);

    // Rate card-módosítás a pillanatképet nem érinti, a másolat viszont
    // már a friss kártyával számol újra.
    const { rate: currentRate } = await loadRateCard();
    await saveRateCard({ ...currentRate, baseFee: currentRate.baseFee + 100_000 }, null);
    const stillUntouched = await prisma.quote.findUniqueOrThrow({ where: { id: quote.id } });
    assert.equal(stillUntouched.netTotal, quote.netTotal);
    const copy = await duplicateQuote(quote.id);
    assert.equal(copy.status, "DRAFT");
    assert.ok(copy.quoteNo > quote.quoteNo, "a sorszám globálisan nő");
    assert.equal(copy.validUntil, null);
    assert.equal(copy.netTotal, quote.netTotal + 100_000, "friss rate carddal újraszámolva");
    await deleteDraftQuote(copy.id);
    await saveRateCard(currentRate, null);

    // ACCEPTED: decidedAt + deal → WON (closedAt, next action törölve) + activity.
    const accepted = await markQuoteAccepted(quote.id);
    assert.equal(accepted.status, "ACCEPTED");
    assert.ok(accepted.decidedAt);

    const dealAfterAccept = await prisma.deal.findUniqueOrThrow({ where: { id: deal.id } });
    assert.equal(dealAfterAccept.stage, "WON");
    assert.ok(dealAfterAccept.closedAt);
    assert.equal(dealAfterAccept.nextActionAt, null);
    const wonActivity = (await systemActivities(deal.id)).find((a) =>
      a.summary.includes("deal megnyerve"),
    );
    assert.ok(wonActivity);

    // Döntött állapotból nincs további átmenet.
    await assert.rejects(
      markQuoteSent(quote.id),
      (err: unknown) => err instanceof CrmServiceError && err.code === "INVALID_TRANSITION",
    );
  });

  await t.test("inquiry auto-attach: nyitott dealhez linkel (case-insensitive)", async () => {
    // A submitInquiry ezt a service-hívást best-effort try/catch-ben süti el
    // (lib/inquiries) – itt a szolgáltatás-szintű viselkedést fedjük, mert a
    // lib/inquiries import-lánca (auth → next/navigation) a test-runnerben
    // nem tölthető be.
    const email = `${makeId("attach")}@test.trita.app`;
    const openDeal = await createDeal(baseDealInput(email));
    const inquiry = await createTestInquiry({
      name: "Visszatérő Ügyfél",
      email,
      topic: "pricing",
      message: "Mégis érdekelne az ajánlat.",
    });

    const attached = await attachInquiryToOpenDeal(inquiry.id, email.toUpperCase());
    assert.deepEqual(attached, { dealId: openDeal.id });

    const linked = await prisma.inquiry.findUniqueOrThrow({ where: { id: inquiry.id } });
    assert.equal(linked.dealId, openDeal.id);
    const attachActivity = (await systemActivities(openDeal.id)).find((a) =>
      a.summary.includes("Új megkeresés érkezett"),
    );
    assert.ok(attachActivity);
    assert.ok(attachActivity.body?.includes("Mégis érdekelne"));

    // Zárt deal mellé nem csatolunk: az inquiry az intake-ben marad.
    const closedEmail = `${makeId("closed")}@test.trita.app`;
    const closedDeal = await createDeal(baseDealInput(closedEmail));
    await closeDeal(closedDeal.id, { outcome: "LOST", outcomeKind: "no_response" });
    const intakeInquiry = await createTestInquiry({ email: closedEmail });
    assert.equal(await attachInquiryToOpenDeal(intakeInquiry.id, closedEmail), null);
    const intake = await prisma.inquiry.findUniqueOrThrow({ where: { id: intakeInquiry.id } });
    assert.equal(intake.dealId, null);
    assert.equal(intake.status, "NEW");

    // Már linkelt inquiry-re idempotensen null.
    assert.equal(await attachInquiryToOpenDeal(inquiry.id, email), null);
  });

  await t.test("org-access → WON: activate zár, extend csak activity, idempotens", async () => {
    const owner = await prisma.userProfile.create({
      data: { id: makeId("owner"), clerkId: makeId("clerk"), email: `${makeId("o")}@test.trita.app` },
    });
    const org = await prisma.organization.create({
      data: { name: "CRM Teszt Org", ownerId: owner.id },
    });
    const deal = await createDeal({ ...baseDealInput(), organizationId: org.id });
    await setNextAction(deal.id, daysFromNow(1), "Szerződés-egyeztetés");

    const first = await handleOrgAccessGranted(org.id, "activate", 12);
    assert.deepEqual(first, { dealId: deal.id, transitionedToWon: true });
    const won = await prisma.deal.findUniqueOrThrow({ where: { id: deal.id } });
    assert.equal(won.stage, "WON");
    assert.ok(won.closedAt);
    assert.equal(won.nextActionAt, null);
    const activateActivity = (await systemActivities(deal.id)).find((a) =>
      a.summary.includes("Org-hozzáférés aktiválva (12 hónap)"),
    );
    assert.ok(activateActivity);

    // Ismételt activate: nincs újabb WON-váltás, csak történet-bejegyzés.
    const second = await handleOrgAccessGranted(org.id, "activate", 12);
    assert.deepEqual(second, { dealId: deal.id, transitionedToWon: false });

    // extend a WON dealen: activity az ügyfél-történetben.
    const third = await handleOrgAccessGranted(org.id, "extend", 6);
    assert.deepEqual(third, { dealId: deal.id, transitionedToWon: false });
    const extendActivity = (await systemActivities(deal.id)).find((a) =>
      a.summary.includes("meghosszabbítva (6 hónap)"),
    );
    assert.ok(extendActivity);

    // Org linkelt deal nélkül: no-op.
    const bareOrg = await prisma.organization.create({
      data: { name: "Deal nélküli org", ownerId: owner.id },
    });
    assert.equal(await handleOrgAccessGranted(bareOrg.id, "activate", 12), null);
  });

  await t.test("CRM-sweep: esedékes notif + dedupe + ajánlat-lejárat", async () => {
    const { isoDay } = resolveCrmDueWindow();

    // (a) lejárt next actionű nyitott deal
    const dueDeal = await createDeal(baseDealInput());
    await setNextAction(dueDeal.id, daysFromNow(-1), "Elmaradt hívás");
    // (b) hamarosan lejáró SENT quote
    const expiringDeal = await createDeal(baseDealInput());
    const expiringQuote = await createQuote({ dealId: expiringDeal.id, input: emptyQuoteInput() });
    await markQuoteSent(expiringQuote.id, daysFromNow(2));
    // (c) már lejárt SENT quote → auto-EXPIRED
    const expiredDeal = await createDeal(baseDealInput());
    const expiredQuote = await createQuote({ dealId: expiredDeal.id, input: emptyQuoteInput() });
    await markQuoteSent(expiredQuote.id, daysFromNow(-1));

    const result = await runNotificationSweep();
    assert.ok(result.crm, "a sweep-eredmény tartalmazza a CRM-statisztikát");
    assert.ok(result.crm.autoExpiredQuotes >= 1);
    assert.ok(result.crm.nextActionDeals >= 1);
    assert.ok(result.crm.expiringQuotes >= 1);

    // (c) auto-expire + SYSTEM-activity
    const expired = await prisma.quote.findUniqueOrThrow({ where: { id: expiredQuote.id } });
    assert.equal(expired.status, "EXPIRED");
    const expiredActivity = (await systemActivities(expiredDeal.id)).find((a) =>
      a.summary.includes("Ajánlat lejárt"),
    );
    assert.ok(expiredActivity);

    // (a) admin-notif a lejárt next actionről, napi dedupe-kulccsal
    const dueKey = buildNextActionDueDedupeKey(dueDeal.id, isoDay);
    const dueNotifs = await prisma.notification.findMany({
      where: { userId: adminProfile.id, dedupeKey: dueKey },
    });
    assert.equal(dueNotifs.length, 1);
    assert.equal(dueNotifs[0].type, "CRM_NEXT_ACTION_DUE");
    assert.equal(dueNotifs[0].link, `/admin/crm/${dueDeal.id}`);

    // (b) admin-notif a lejáró ajánlatról (ajánlatonként egyszer)
    const expiringKey = buildQuoteExpiringDedupeKey(expiringQuote.id);
    const expiringNotifs = await prisma.notification.findMany({
      where: { userId: adminProfile.id, dedupeKey: expiringKey },
    });
    assert.equal(expiringNotifs.length, 1);
    assert.equal(expiringNotifs[0].type, "CRM_QUOTE_EXPIRING");
    const vars = expiringNotifs[0].vars as { quoteNo?: string };
    assert.ok(vars.quoteNo?.startsWith("TRT-"));

    // Második futás: a dedupe véd, nem duplikál.
    await runNotificationSweep();
    assert.equal(
      await prisma.notification.count({ where: { userId: adminProfile.id, dedupeKey: dueKey } }),
      1,
    );
    assert.equal(
      await prisma.notification.count({
        where: { userId: adminProfile.id, dedupeKey: expiringKey },
      }),
      1,
    );
  });

  // A DEFAULT_RATE_CARD referencia életben tartása: a teszt a mentett kártya
  // visszaállítása után is determinisztikus marad (lásd quote-életciklus).
  assert.ok(DEFAULT_RATE_CARD.baseFee > 0);
});

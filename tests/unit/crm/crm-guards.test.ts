/**
 * CRM guardok — pure unit tesztek: quote-átmenet mátrix, stage-nyitottság,
 * esedékesség-kosarak (UTC nap-határok), sweep-ablak, dedupe-kulcsok,
 * cím- és sorszám-formázók.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { DEAL_STAGES, QUOTE_STATUSES } from "@/lib/crm/constants";
import {
  buildDealTitleFromInquiry,
  buildNextActionDueDedupeKey,
  buildQuoteExpiringDedupeKey,
  canTransitionQuote,
  formatQuoteNo,
  isOpenStage,
  resolveCrmDueWindow,
  resolveDueBucket,
} from "@/lib/crm/guards";

const MINUTE_MS = 60 * 1000;

test("CRM guards", async (t) => {
  await t.test("canTransitionQuote: teljes mátrix", () => {
    const allowed = new Set([
      "DRAFT>SENT",
      "SENT>ACCEPTED",
      "SENT>DECLINED",
      "SENT>EXPIRED",
    ]);
    for (const from of QUOTE_STATUSES) {
      for (const to of QUOTE_STATUSES) {
        assert.equal(
          canTransitionQuote(from, to),
          allowed.has(`${from}>${to}`),
          `${from} → ${to}`,
        );
      }
    }
    // Ismeretlen státusz sosem léphet sehova.
    assert.equal(canTransitionQuote("BOGUS", "SENT"), false);
  });

  await t.test("isOpenStage: WON/LOST zárt, a többi nyitott", () => {
    const expected: Record<string, boolean> = {
      NEW: true,
      DISCOVERY: true,
      QUOTED: true,
      DORMANT: true,
      WON: false,
      LOST: false,
    };
    for (const stage of DEAL_STAGES) {
      assert.equal(isOpenStage(stage), expected[stage], stage);
    }
    assert.equal(isOpenStage("BOGUS"), false);
  });

  await t.test("resolveDueBucket: határesetek UTC éjfél körül", () => {
    const now = new Date("2026-08-05T10:30:00.000Z");
    const todayStart = new Date("2026-08-05T00:00:00.000Z");
    const tomorrowStart = new Date("2026-08-06T00:00:00.000Z");

    assert.equal(resolveDueBucket(null, now), "none");
    assert.equal(resolveDueBucket(undefined, now), "none");
    // Egy perccel éjfél előtt → tegnapi, lejárt.
    assert.equal(
      resolveDueBucket(new Date(todayStart.getTime() - MINUTE_MS), now),
      "overdue",
    );
    // Pontosan a mai nap kezdete → ma.
    assert.equal(resolveDueBucket(todayStart, now), "today");
    // A mai nap utolsó perce → még ma.
    assert.equal(
      resolveDueBucket(new Date(tomorrowStart.getTime() - MINUTE_MS), now),
      "today",
    );
    // Pontosan holnap éjfél → már jövőbeli.
    assert.equal(resolveDueBucket(tomorrowStart, now), "upcoming");
  });

  await t.test("resolveCrmDueWindow: holnap 0:00 UTC + mai ISO-nap", () => {
    const { dueBefore, isoDay } = resolveCrmDueWindow(new Date("2026-08-05T23:59:59.999Z"));
    assert.equal(dueBefore.toISOString(), "2026-08-06T00:00:00.000Z");
    assert.equal(isoDay, "2026-08-05");

    // Nap eleje ugyanoda esik – az ablak a naptári naptól függ, nem az órától.
    const early = resolveCrmDueWindow(new Date("2026-08-05T00:00:00.000Z"));
    assert.equal(early.dueBefore.toISOString(), "2026-08-06T00:00:00.000Z");
    assert.equal(early.isoDay, "2026-08-05");
  });

  await t.test("dedupe-kulcsok: napi deal-kulcs, egyszeri quote-kulcs", () => {
    assert.equal(
      buildNextActionDueDedupeKey("deal_1", "2026-08-05"),
      "CRM_NEXT_ACTION_DUE:deal_1:2026-08-05",
    );
    assert.equal(buildQuoteExpiringDedupeKey("q_1"), "CRM_QUOTE_EXPIRING:q_1");
  });

  await t.test("buildDealTitleFromInquiry: cég > név, téma opcionális", () => {
    assert.equal(
      buildDealTitleFromInquiry({ name: "Kiss Anna", company: "Acme Kft.", topicLabel: "Demó igény" }),
      "Acme Kft. – Demó igény",
    );
    assert.equal(
      buildDealTitleFromInquiry({ name: "Kiss Anna", company: null, topicLabel: "Árazás" }),
      "Kiss Anna – Árazás",
    );
    assert.equal(
      buildDealTitleFromInquiry({ name: "Kiss Anna", company: "  ", topicLabel: null }),
      "Kiss Anna",
    );
  });

  await t.test("formatQuoteNo: padding + évváltás a createdAt-ból", () => {
    assert.equal(formatQuoteNo(7, new Date("2026-08-05T12:00:00.000Z")), "TRT-2026-0007");
    assert.equal(formatQuoteNo(7, new Date("2027-01-01T00:00:00.000Z")), "TRT-2027-0007");
    // A sorszám globálisan folytonos – 4 jegy fölött nem csonkul.
    assert.equal(formatQuoteNo(12345, new Date("2026-08-05T12:00:00.000Z")), "TRT-2026-12345");
    assert.equal(formatQuoteNo(1, new Date("2026-12-31T23:59:59.000Z")), "TRT-2026-0001");
  });
});

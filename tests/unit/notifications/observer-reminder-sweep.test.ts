import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  selectObserverReminderCandidates,
  OBSERVER_REMINDER_MIN_AGE_DAYS,
  OBSERVER_REMINDER_REPEAT_DAYS,
  OBSERVER_REMINDER_MAX_COUNT,
  OBSERVER_REMINDER_BATCH_LIMIT,
  type ObserverReminderRow,
} from "@/lib/notifications/sweep";

const NOW = new Date("2026-08-10T12:00:00Z");
const DAY = 24 * 60 * 60 * 1000;

function daysAgo(days: number): Date {
  return new Date(NOW.getTime() - days * DAY);
}

function daysAhead(days: number): Date {
  return new Date(NOW.getTime() + days * DAY);
}

function invite(overrides: Partial<ObserverReminderRow> = {}): ObserverReminderRow {
  return {
    status: "PENDING",
    observerEmail: "observer@example.com",
    expiresAt: daysAhead(20),
    createdAt: daysAgo(OBSERVER_REMINDER_MIN_AGE_DAYS + 1),
    lastReminderSentAt: null,
    reminderCount: 0,
    ...overrides,
  };
}

describe("selectObserverReminderCandidates – kiválasztási szabályok", () => {
  it("alap-eset: elég régi, függő, e-mailes meghívó jelölt", () => {
    const candidates = selectObserverReminderCandidates([invite()], NOW);
    assert.equal(candidates.length, 1);
  });

  it("csak PENDING státusz jelölt", () => {
    const candidates = selectObserverReminderCandidates(
      [
        invite({ status: "COMPLETED" }),
        invite({ status: "AWAITING_APPROVAL" }),
        invite({ status: "DECLINED" }),
      ],
      NOW,
    );
    assert.deepEqual(candidates, []);
  });

  it("e-mail nélküli (link-alapú) meghívóra nem megy emlékeztető", () => {
    const candidates = selectObserverReminderCandidates(
      [invite({ observerEmail: null })],
      NOW,
    );
    assert.deepEqual(candidates, []);
  });

  it("lejárt meghívó nem jelölt", () => {
    const candidates = selectObserverReminderCandidates(
      [invite({ expiresAt: daysAgo(1) }), invite({ expiresAt: NOW })],
      NOW,
    );
    assert.deepEqual(candidates, []);
  });

  it("a minimum-kor előtt (túl friss meghívó) nem jelölt", () => {
    const fresh = invite({ createdAt: daysAgo(OBSERVER_REMINDER_MIN_AGE_DAYS - 1) });
    assert.deepEqual(selectObserverReminderCandidates([fresh], NOW), []);
  });

  it("második emlékeztető csak az ismétlési köz letelte után megy", () => {
    const recentlyReminded = invite({
      reminderCount: 1,
      lastReminderSentAt: daysAgo(OBSERVER_REMINDER_REPEAT_DAYS - 1),
    });
    const dueAgain = invite({
      reminderCount: 1,
      lastReminderSentAt: daysAgo(OBSERVER_REMINDER_REPEAT_DAYS + 1),
    });
    const candidates = selectObserverReminderCandidates(
      [recentlyReminded, dueAgain],
      NOW,
    );
    assert.deepEqual(candidates, [dueAgain]);
  });

  it("a max emlékeztető-szám elérése után nincs több küldés", () => {
    const maxed = invite({
      reminderCount: OBSERVER_REMINDER_MAX_COUNT,
      lastReminderSentAt: daysAgo(OBSERVER_REMINDER_REPEAT_DAYS + 5),
    });
    assert.deepEqual(selectObserverReminderCandidates([maxed], NOW), []);
  });

  it("futásonként legfeljebb a plafon-nyi jelölt jön vissza", () => {
    const many = Array.from({ length: OBSERVER_REMINDER_BATCH_LIMIT + 10 }, () =>
      invite(),
    );
    const candidates = selectObserverReminderCandidates(many, NOW);
    assert.equal(candidates.length, OBSERVER_REMINDER_BATCH_LIMIT);
  });
});

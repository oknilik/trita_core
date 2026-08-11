import test from "node:test";
import assert from "node:assert/strict";
import {
  aggregateFakeDoorReport,
  dedupeResponses,
  dedupeViews,
  summariseWillingness,
  type FakeDoorResponseRow,
  type FakeDoorViewRow,
} from "@/lib/fakedoor/aggregate";

// A fake door riport két 2026-08-11-es javításának szerződése:
//  1. a fizetési hajlandóság (willingness) KÖZÖNSÉGENKÉNT szegmentált —
//     a tanácsadói és az egyéni összeg sosem kerül egy mediánba;
//  2. profil-szintű dedup — kliens-választotta sessionId-kkel nem lehet
//     szavazatot halmozni (profilonként az utolsó válasz + első megtekintés).

let seq = 0;
function response(overrides: Partial<FakeDoorResponseRow>): FakeDoorResponseRow {
  seq += 1;
  return {
    audience: "individual",
    priceVariant: 9900,
    interest: "no",
    emailOptIn: false,
    valueGoal: null,
    reasonNo: null,
    maxPriceHuf: null,
    otherText: null,
    sessionId: `session-${seq}`,
    userId: null,
    profileId: null,
    respondedAt: new Date(2026, 0, 1, 0, seq),
    ...overrides,
  };
}

function view(overrides: Partial<FakeDoorViewRow>): FakeDoorViewRow {
  seq += 1;
  return {
    audience: "individual",
    priceVariant: 9900,
    sessionId: `session-${seq}`,
    userId: null,
    profileId: null,
    createdAt: new Date(2026, 0, 1, 0, seq),
    ...overrides,
  };
}

test("willingness közönségenként szegmentált — nincs összevont medián", () => {
  const rows = [
    // Egyéni ár-elutasítók: 2 000 és 4 000 → medián 3 000.
    response({ audience: "individual", reasonNo: "price", maxPriceHuf: 2000 }),
    response({ audience: "individual", reasonNo: "price", maxPriceHuf: 4000 }),
    // Tanácsadói ár-elutasító: 50 000 — összevonva a mediánt felrántaná.
    response({ audience: "consultant", reasonNo: "price", maxPriceHuf: 50000 }),
    // Nem ár-okú elutasítás nem számít bele.
    response({ audience: "individual", reasonNo: "accuracy" }),
  ];
  const report = aggregateFakeDoorReport([], rows);

  assert.equal("willingness" in report, false, "az összevont willingness mező visszakerült");
  const individual = report.willingnessByAudience.find(
    (entry) => entry.audience === "individual",
  );
  const consultant = report.willingnessByAudience.find(
    (entry) => entry.audience === "consultant",
  );
  assert.ok(individual && consultant, "hiányzó közönség-szegmens");
  assert.equal(individual.summary.count, 2);
  assert.equal(individual.summary.median, 3000);
  assert.equal(consultant.summary.count, 1);
  assert.equal(consultant.summary.median, 50000);
  // Üres szegmens (candidate/anon) nem szerepel.
  assert.equal(report.willingnessByAudience.length, 2);
});

test("summariseWillingness: medián, nullák és a látott-ár-arány", () => {
  const summary = summariseWillingness([
    response({ reasonNo: "price", maxPriceHuf: 0, priceVariant: 9900 }),
    response({ reasonNo: "price", maxPriceHuf: 4950, priceVariant: 9900 }),
    response({ reasonNo: "price", maxPriceHuf: 9900, priceVariant: 9900 }),
    response({ reasonNo: "price", maxPriceHuf: null }),
  ]);
  assert.equal(summary.count, 4);
  assert.equal(summary.answered, 3);
  assert.equal(summary.zero, 1);
  assert.equal(summary.median, 4950);
  assert.equal(summary.medianShareOfShownPrice, 50);
});

test("profil-dedup: egy fiók sok sessionId-vel is EGY válasz (a legutolsó)", () => {
  const rows = [
    response({
      profileId: "profile-1",
      sessionId: "session-a",
      interest: "no",
      respondedAt: new Date("2026-01-01T10:00:00Z"),
    }),
    response({
      profileId: "profile-1",
      sessionId: "session-b",
      interest: "yes",
      respondedAt: new Date("2026-01-02T10:00:00Z"),
    }),
    response({
      profileId: "profile-1",
      sessionId: "session-c",
      interest: "no",
      respondedAt: new Date("2026-01-01T08:00:00Z"),
    }),
    response({ profileId: "profile-2", interest: "yes" }),
  ];
  const deduped = dedupeResponses(rows);
  assert.equal(deduped.length, 2);
  const first = deduped.find((row) => row.profileId === "profile-1");
  assert.ok(first);
  assert.equal(first.interest, "yes", "nem a legutolsó válasz maradt");

  const report = aggregateFakeDoorReport([], rows);
  assert.equal(report.total.responses, 2, "a ballot-stuffing átment az aggregáción");
  assert.equal(report.total.yes, 2);
});

test("dedup-kulcs létra: profileId > userId > sessionId", () => {
  const rows = [
    // Ugyanaz a user profil nélkül, két munkamenettel → egy sor.
    response({ userId: "user-1", sessionId: "session-a" }),
    response({ userId: "user-1", sessionId: "session-b" }),
    // Történeti (auth előtti) sorok: csak sessionId — külön maradnak.
    response({ sessionId: "anon-1" }),
    response({ sessionId: "anon-2" }),
  ];
  assert.equal(dedupeResponses(rows).length, 3);
});

test("view-dedup: profilonként az ELSŐ megtekintés számít a nevezőben", () => {
  const views = [
    view({ profileId: "profile-1", createdAt: new Date("2026-01-02T10:00:00Z") }),
    view({ profileId: "profile-1", createdAt: new Date("2026-01-01T10:00:00Z") }),
    view({ profileId: "profile-2" }),
  ];
  const deduped = dedupeViews(views);
  assert.equal(deduped.length, 2);
  const first = deduped.find((row) => row.profileId === "profile-1");
  assert.equal(first?.createdAt.toISOString(), "2026-01-01T10:00:00.000Z");

  const report = aggregateFakeDoorReport(views, []);
  assert.equal(report.total.views, 2);
});

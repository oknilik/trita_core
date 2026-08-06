/**
 * quoteInputSchema — a QuoteInput 1:1 zod-tükre: érvényes/érvénytelen
 * bemenetek + a parse-olt input determinisztikusan ugyanazt a netTotal-t
 * adja a kalkulátorban (a Quote.netTotal kiemelés alapja).
 */

import test from "node:test";
import assert from "node:assert/strict";
import { calculateQuote, emptyQuoteInput } from "@/lib/quote/calculate";
import { DEFAULT_RATE_CARD, quoteInputSchema } from "@/lib/quote/rate-card";

test("quoteInputSchema", async (t) => {
  await t.test("érvényes: a kalkulátor üres bemenete átmegy", () => {
    const parsed = quoteInputSchema.safeParse(emptyQuoteInput());
    assert.ok(parsed.success, JSON.stringify(parsed.success ? null : parsed.error.issues));
  });

  await t.test("érvényes: kedvezmény + minden lépés", () => {
    const parsed = quoteInputSchema.safeParse({
      ...emptyQuoteInput(),
      steps: ["OBSERVER_360", "TEAM_ROLE", "TEAM_ROLE_360", "TRUST_360", "PSYCH_SAFETY"],
      discountPct: 10,
      discountKind: "pilot",
      discountReason: "Alapító partner",
    });
    assert.ok(parsed.success);
  });

  await t.test("érvénytelen bemenetek elutasítva", () => {
    const base = emptyQuoteInput();
    const invalidCases: Array<[string, unknown]> = [
      ["negatív létszám", { ...base, headcount: -1 }],
      ["0 csapat", { ...base, teams: 0 }],
      ["tört létszám", { ...base, headcount: 12.5 }],
      ["ismeretlen lépés", { ...base, steps: ["OBSERVER_360", "BOGUS_STEP"] }],
      ["duplikált lépés", { ...base, steps: ["OBSERVER_360", "OBSERVER_360"] }],
      ["101% kedvezmény", { ...base, discountPct: 101 }],
      ["ismeretlen kedvezmény-fajta", { ...base, discountKind: "friends" }],
      [
        "hiányzó mező",
        Object.fromEntries(Object.entries(base).filter(([key]) => key !== "waves")),
      ],
      ["nem objektum", "not-an-object"],
    ];
    for (const [label, input] of invalidCases) {
      assert.equal(quoteInputSchema.safeParse(input).success, false, label);
    }
  });

  await t.test("parse-olt input → azonos netTotal (kiemelés-konzisztencia)", () => {
    const input = { ...emptyQuoteInput(), discountPct: 10, discountKind: "pilot" as const, discountReason: "pilot" };
    const parsed = quoteInputSchema.parse(input);
    const direct = calculateQuote(input, DEFAULT_RATE_CARD);
    const viaParsed = calculateQuote(parsed, DEFAULT_RATE_CARD);
    assert.equal(viaParsed.netTotal, direct.netTotal);
    assert.ok(viaParsed.netTotal > 0);
    assert.equal(viaParsed.discountAmount, direct.discountAmount);
  });
});

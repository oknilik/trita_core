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

  await t.test("érvényes: kedvezmény + Csapatkép + extrák", () => {
    const parsed = quoteInputSchema.safeParse({
      ...emptyQuoteInput(),
      tier: "kep",
      extraWorkshopDays: 1,
      extraWaves: 2,
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
      ["ismeretlen szint", { ...base, tier: "premium" }],
      ["tört workshop-nap", { ...base, extraWorkshopDays: 0.5 }],
      ["101% kedvezmény", { ...base, discountPct: 101 }],
      ["ismeretlen kedvezmény-fajta", { ...base, discountKind: "friends" }],
      [
        "hiányzó mező",
        Object.fromEntries(Object.entries(base).filter(([key]) => key !== "extraWaves")),
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

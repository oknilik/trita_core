import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateQuote,
  emptyQuoteInput,
  perHeadTotal,
  type QuoteInput,
} from "@/lib/quote/calculate";
import { DEFAULT_RATE_CARD, rateCardSchema } from "@/lib/quote/rate-card";

// Az ajánlat-kalkulátor szerződése.
//
// Ez a fájl azt védi, amitől az ajánlat védhető: a sávos árazás ne legyen
// szakadásos, a kedvezmény ne ehesse meg a fedezetet észrevétlenül, és a
// továbbhárított költség ne szépítse az effektív óradíjat.

const input = (overrides: Partial<QuoteInput> = {}): QuoteInput => ({
  ...emptyQuoteInput(),
  ...overrides,
});

test("a díjtételek megfelelnek a saját sémájuknak", () => {
  // A felületről mentett kártya ugyanezen a sémán megy át — ha az
  // alapértelmezés eltérne tőle, a mentés némán elutasítaná.
  assert.doesNotThrow(() => rateCardSchema.parse(DEFAULT_RATE_CARD));
});

test("a fejenkénti díj marginális: nincs szakadás a sávhatáron", () => {
  // Sávhatár körül a teljes ár nem eshet vissza. Ha esne, 26 fő olcsóbb
  // lenne, mint 25 — ez az első alkunál kiderül, és hiteltelenít.
  for (let heads = 1; heads < 120; heads += 1) {
    const here = perHeadTotal(heads, DEFAULT_RATE_CARD);
    const next = perHeadTotal(heads + 1, DEFAULT_RATE_CARD);
    assert.ok(next >= here, `${heads} → ${heads + 1} fő között visszaesik az ár`);
  }
});

test("a fejenkénti átlagár csökken a létszámmal", () => {
  // Ez a degresszió lényege: a 40. ember elemzése nem kerül annyiba, mint
  // a 4. Ha nem csökkenne, a nagy ügyfélnek irreális árat mondanánk.
  const small = perHeadTotal(8, DEFAULT_RATE_CARD) / 8;
  const mid = perHeadTotal(30, DEFAULT_RATE_CARD) / 30;
  const large = perHeadTotal(80, DEFAULT_RATE_CARD) / 80;
  assert.ok(mid < small);
  assert.ok(large < mid);
});

test("a kiszállásra nem vonatkozik kedvezmény", () => {
  const withTravel = calculateQuote(
    input({ travelDays: 2, discountPct: 20, discountReason: "pilot" }),
    DEFAULT_RATE_CARD,
  );
  const withoutTravel = calculateQuote(
    input({ travelDays: 0, discountPct: 20, discountReason: "pilot" }),
    DEFAULT_RATE_CARD,
  );
  // A kedvezmény összege ugyanaz marad: a kiszállás kimarad az alapból.
  assert.equal(withTravel.discountAmount, withoutTravel.discountAmount);
  assert.equal(
    withTravel.netTotal - withoutTravel.netTotal,
    DEFAULT_RATE_CARD.travelDayFee * 2,
  );
});

test("az alapító kedvezmény alapértelmezetten nem csökkenti a fejdíjat", () => {
  const small = calculateQuote(
    input({ headcount: 8, discountPct: 20, discountReason: "alapító partner" }),
    DEFAULT_RATE_CARD,
  );
  const larger = calculateQuote(
    input({ headcount: 18, discountPct: 20, discountReason: "alapító partner" }),
    DEFAULT_RATE_CARD,
  );
  assert.equal(
    small.discountAmount,
    Math.round(
      (DEFAULT_RATE_CARD.baseFee + DEFAULT_RATE_CARD.workshopDayFee) * 0.2,
    ),
  );
  assert.equal(larger.discountAmount, small.discountAmount);
});

test("a teljes-program kedvezmény a szakmai díjtételekre is vonatkozik", () => {
  const selected = calculateQuote(
    input({ discountPct: 20, discountScope: "base_workshop", discountReason: "pilot" }),
    DEFAULT_RATE_CARD,
  );
  const all = calculateQuote(
    input({ discountPct: 20, discountScope: "all", discountReason: "pilot" }),
    DEFAULT_RATE_CARD,
  );
  assert.ok(all.discountAmount > selected.discountAmount);
  assert.ok(all.netTotal < selected.netTotal);
});

test("a nettó, ÁFA és bruttó összeg összezár", () => {
  const result = calculateQuote(input({ vatRate: 27 }), DEFAULT_RATE_CARD);
  assert.equal(result.vatAmount, Math.round(result.netTotal * 0.27));
  assert.equal(result.grossTotal, result.netTotal + result.vatAmount);
});

test("a továbbhárított költség nem szépíti az effektív óradíjat", () => {
  // A kiszállás nem tanácsadói bevétel. Ha beleszámítana, a kalkulátor
  // pont a legfontosabb számot mutatná túl kedvezőnek.
  const base = calculateQuote(input({ travelDays: 0 }), DEFAULT_RATE_CARD);
  const travelled = calculateQuote(input({ travelDays: 3 }), DEFAULT_RATE_CARD);
  assert.ok(travelled.effectiveHourlyRate != null && base.effectiveHourlyRate != null);
  assert.ok(
    (travelled.effectiveHourlyRate as number) <= (base.effectiveHourlyRate as number),
    "a kiszállás megemelte az effektív óradíjat",
  );
});

test("a mély kedvezmény figyelmeztetést hoz, nem csendes fedezet-vesztést", () => {
  const deep = calculateQuote(
    input({ discountPct: 60, discountScope: "all", discountReason: "" }),
    DEFAULT_RATE_CARD,
  );
  assert.ok(deep.warnings.includes("DISCOUNT_OVER_CAP"));
  assert.ok(deep.warnings.includes("DISCOUNT_WITHOUT_REASON"));
  assert.ok(deep.warnings.includes("BELOW_TARGET_HOURLY"));
});

test("indoklás nélküli kedvezmény akkor is jelez, ha a kereten belül van", () => {
  const modest = calculateQuote(
    input({ discountPct: 5, discountReason: "   " }),
    DEFAULT_RATE_CARD,
  );
  assert.ok(modest.warnings.includes("DISCOUNT_WITHOUT_REASON"));
  assert.ok(!modest.warnings.includes("DISCOUNT_OVER_CAP"));
});

test("az utánkövetés hiánya jelzés – ebből lesz az egyszeri munka", () => {
  const oneOff = calculateQuote(
    input({ waves: 0, retainerMonths: 0 }),
    DEFAULT_RATE_CARD,
  );
  assert.ok(oneOff.warnings.includes("NO_FOLLOW_UP"));

  const followed = calculateQuote(input({ waves: 2 }), DEFAULT_RATE_CARD);
  assert.ok(!followed.warnings.includes("NO_FOLLOW_UP"));
  assert.ok(followed.netTotal > oneOff.netTotal);
});

test("az ismételt hullám olcsóbb, mint a baseline mérés", () => {
  // A setup és a csapat megismerése egyszeri munka: ha egy hullám ugyanannyi
  // lenne, a vevőnek nem érné meg utánkövetést rendelni.
  const one = calculateQuote(input({ waves: 1 }), DEFAULT_RATE_CARD);
  const none = calculateQuote(input({ waves: 0 }), DEFAULT_RATE_CARD);
  const waveCost = one.netTotal - none.netTotal;
  const baselineMeasurement =
    none.lines.find((line) => line.key === "measurement")!.amount +
    none.lines.find((line) => line.key === "steps")!.amount;
  assert.ok(waveCost < baselineMeasurement + DEFAULT_RATE_CARD.baseFee);
});

test("a padló-ár a becsült órákból és a cél-óradíjból jön", () => {
  const result = calculateQuote(input({ travelDays: 1 }), DEFAULT_RATE_CARD);
  assert.equal(
    result.floorPrice,
    Math.round(result.estimatedHours * DEFAULT_RATE_CARD.targetHourlyRate) +
      result.passThroughSubtotal,
  );
});

test("nulla létszámnál sem omlik össze a számítás", () => {
  const result = calculateQuote(input({ headcount: 0 }), DEFAULT_RATE_CARD);
  assert.equal(result.perHeadEffective, null);
  assert.ok(result.netTotal >= DEFAULT_RATE_CARD.baseFee);
});

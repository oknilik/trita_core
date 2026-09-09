import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateQuote,
  emptyQuoteInput,
  estimateHours,
  type QuoteInput,
} from "@/lib/quote/calculate";
import { DEFAULT_RATE_CARD, rateCardSchema, readQuoteInput } from "@/lib/quote/rate-card";
import {
  derivePublicLadder,
  ladderEntryPerHead,
  ladderPrice,
  pilotPerHead,
} from "@/lib/pricing/team-ladder";

// Az ajánlat-kalkulátor szerződése.
//
// Ez a fájl azt védi, amitől az ajánlat védhető: a fejenkénti ár a
// publikus árlétrával azonos, a sávhatáron nincs szakadás, a kedvezmény ne
// ehesse meg a fedezetet észrevétlenül, és a továbbhárított költség ne
// szépítse az effektív óradíjat.

const input = (overrides: Partial<QuoteInput> = {}): QuoteInput => ({
  ...emptyQuoteInput(),
  ...overrides,
});

const ladder = derivePublicLadder(DEFAULT_RATE_CARD);

test("a díjtételek megfelelnek a saját sémájuknak", () => {
  // A felületről mentett kártya ugyanezen a sémán megy át — ha az
  // alapértelmezés eltérne tőle, a mentés némán elutasítaná.
  assert.doesNotThrow(() => rateCardSchema.parse(DEFAULT_RATE_CARD));
});

test("az ajánlat fejenkénti része AZONOS a publikus árlétrával", () => {
  // Ez a modell lényege: amit a vevő az /pricing oldalon lát, az kerül
  // az ajánlatba. Ha a két szám eltérne, az első ajánlatnál kiderülne.
  for (const tier of ["kep", "prog"] as const) {
    for (const heads of [5, 8, 10, 12, 25, 40]) {
      const result = calculateQuote(input({ tier, headcount: heads }), DEFAULT_RATE_CARD);
      const tierLines = result.lines
        .filter((line) => line.key === "tier" || line.key === "tierOver")
        .reduce((sum, line) => sum + line.amount, 0);
      assert.equal(tierLines, ladderPrice(ladder, tier, heads).total, `${tier} ${heads} fő`);
    }
  }
});

test("a fejenkénti díj marginális: nincs szakadás a sávhatáron", () => {
  for (const tier of ["kep", "prog"] as const) {
    for (let heads = 1; heads < 80; heads += 1) {
      const here = ladderPrice(ladder, tier, heads).total;
      const next = ladderPrice(ladder, tier, heads + 1).total;
      assert.ok(next >= here, `${tier}: ${heads} → ${heads + 1} fő között visszaesik az ár`);
    }
  }
});

test("a sávon belül a fejenkénti ár pontosan a hirdetett, felette csökken", () => {
  const band = ladder.firstBandHeads;
  const within = ladderPrice(ladder, "kep", band);
  assert.equal(within.perHeadAverage, ladder.tiers.kep.perHead);
  const above = ladderPrice(ladder, "kep", band * 2);
  assert.ok((above.perHeadAverage as number) < ladder.tiers.kep.perHead);
  assert.equal(above.overHeads, band);
});

test("a belépő ár a szintek közül a legolcsóbb, a pilot-ár a kedvezménnyel számolt", () => {
  const entry = ladderEntryPerHead(ladder);
  assert.equal(entry.tier, "kep");
  assert.equal(entry.perHead, DEFAULT_RATE_CARD.tiers.kep.perHead);
  assert.equal(
    pilotPerHead(ladder, "prog"),
    Math.round((DEFAULT_RATE_CARD.tiers.prog.perHead * (100 - DEFAULT_RATE_CARD.pilotDiscountPct)) / 100),
  );
});

test("a Csapatprogram drágább és több órát visz, mint a Csapatkép", () => {
  const kep = calculateQuote(input({ tier: "kep" }), DEFAULT_RATE_CARD);
  const prog = calculateQuote(input({ tier: "prog" }), DEFAULT_RATE_CARD);
  assert.ok(prog.netTotal > kep.netTotal);
  assert.ok(prog.estimatedHours > kep.estimatedHours);
  assert.equal(
    estimateHours(input({ tier: "prog" }), DEFAULT_RATE_CARD) -
      estimateHours(input({ tier: "kep" }), DEFAULT_RATE_CARD),
    DEFAULT_RATE_CARD.hours.halfDayWorkshop + DEFAULT_RATE_CARD.hours.followUp,
  );
});

test("a csapatonként ismétlődő alkalmak órái a csapatszámmal nőnek", () => {
  // A program minden csapatnak külön eredménymegbeszélést és workshopot
  // ígér. Ha ezeket egyszer számolnánk, több csapatnál az effektív óradíj
  // és a floorPrice túl kedvező képet adna, és elmaradna a figyelmeztetés.
  const h = DEFAULT_RATE_CARD.hours;
  const perTeamTierHours = h.onlineDebrief + h.halfDayWorkshop + h.followUp;
  const one = estimateHours(input({ tier: "prog", headcount: 35, teams: 1 }), DEFAULT_RATE_CARD);
  const five = estimateHours(input({ tier: "prog", headcount: 35, teams: 5 }), DEFAULT_RATE_CARD);
  assert.equal(five - one, 4 * (perTeamTierHours + h.perTeam));

  // Ugyanaz az ár (a létszám azonos), lényegesen kevesebb fedezet: ezt a
  // kalkulátornak látnia kell.
  const singleTeam = calculateQuote(input({ tier: "prog", headcount: 35, teams: 1 }), DEFAULT_RATE_CARD);
  const manyTeams = calculateQuote(input({ tier: "prog", headcount: 35, teams: 5 }), DEFAULT_RATE_CARD);
  assert.equal(singleTeam.netTotal, manyTeams.netTotal);
  assert.ok(manyTeams.effectiveHourlyRate! < singleTeam.effectiveHourlyRate!);
  assert.ok(manyTeams.floorPrice > singleTeam.floorPrice);
  assert.ok(
    manyTeams.warnings.includes("BELOW_TARGET_HOURLY"),
    "öt csapat félnapos workshopja a cél-óradíj alá viszi ezt az árat",
  );
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

test("a kedvezmény minden nem-továbbhárított tételre vonatkozik", () => {
  const result = calculateQuote(
    input({ extraWorkshopDays: 1, discountPct: 10, discountReason: "több csapat" }),
    DEFAULT_RATE_CARD,
  );
  assert.equal(result.discountAmount, Math.round(result.discountableSubtotal * 0.1));
  assert.equal(result.discountableSubtotal, result.listTotal - result.passThroughSubtotal);
});

test("ÁFA és bruttó a nettóból", () => {
  const result = calculateQuote(input({ vatRate: 27 }), DEFAULT_RATE_CARD);
  assert.equal(result.vatAmount, Math.round(result.netTotal * 0.27));
  assert.equal(result.grossTotal, result.netTotal + result.vatAmount);
});

test("a továbbhárított költség nem szépíti az effektív óradíjat", () => {
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
    input({ discountPct: 60, discountReason: "" }),
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

test("a visszamérés hiánya jelzés – csak a Csapatképnél, kör és kísérés nélkül", () => {
  const oneOff = calculateQuote(input({ tier: "kep" }), DEFAULT_RATE_CARD);
  assert.ok(oneOff.warnings.includes("NO_FOLLOW_UP"));

  const program = calculateQuote(input({ tier: "prog" }), DEFAULT_RATE_CARD);
  assert.ok(!program.warnings.includes("NO_FOLLOW_UP"));

  const withWave = calculateQuote(input({ tier: "kep", extraWaves: 1 }), DEFAULT_RATE_CARD);
  assert.ok(!withWave.warnings.includes("NO_FOLLOW_UP"));
  assert.ok(withWave.netTotal > oneOff.netTotal);
});

test("a további mérési kör olcsóbb, mint a szint fejenkénti díja", () => {
  // A setup és a csapat megismerése egyszeri munka: ha egy kör ugyanannyi
  // lenne, a vevőnek nem érné meg utánkövetést rendelni.
  const one = calculateQuote(input({ extraWaves: 1 }), DEFAULT_RATE_CARD);
  const none = calculateQuote(input({ extraWaves: 0 }), DEFAULT_RATE_CARD);
  const waveCost = one.netTotal - none.netTotal;
  assert.ok(waveCost > 0);
  assert.ok(waveCost < ladderPrice(ladder, "prog", 10).total);
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
  assert.equal(result.netTotal, 0);
  assert.ok(result.estimatedHours > 0);
});

test("az örökség-bemenet (programdíjas) átfordul a létrára", () => {
  const legacy = {
    headcount: 12,
    teams: 1,
    steps: ["OBSERVER_360", "TEAM_ROLE"],
    workshopDays: 1.5,
    travelDays: 1,
    waves: 2,
    retainerMonths: 3,
    otherFee: 0,
    otherFeeLabel: "Egyéb díj",
    discountPct: 10,
    discountKind: "pilot",
    discountScope: "base_workshop",
    discountReason: "pilot",
    vatRate: 27,
  };
  const converted = readQuoteInput(legacy);
  assert.ok(converted);
  assert.equal(converted.tier, "prog");
  assert.equal(converted.extraWorkshopDays, 1);
  assert.equal(converted.extraWaves, 1);
  assert.equal(converted.retainerMonths, 3);
  assert.equal(converted.discountKind, "pilot");

  const measurementOnly = readQuoteInput({ ...legacy, workshopDays: 0, waves: 0 });
  assert.equal(measurementOnly?.tier, "kep");
  assert.equal(measurementOnly?.extraWaves, 0);

  assert.equal(readQuoteInput({ nonsense: true }), null);
  assert.equal(readQuoteInput(emptyQuoteInput())?.tier, "prog");
});

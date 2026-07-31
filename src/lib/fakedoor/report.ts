import { prisma } from "@/lib/prisma";
import {
  CAREER_PRICE_VARIANTS,
  CAREER_NO_REASONS,
  CAREER_VALUE_GOALS,
  FAKE_DOOR_AUDIENCES,
  type CareerNoReason,
  type CareerValueGoal,
  type FakeDoorAudience,
} from "@/lib/fakedoor/career";

// Fake door riport — a mérés kiolvasása.
//
// Egyetlen szabály uralja: a konverzió MINDIG válasz / megtekintés, és
// MINDIG szegmentálva. Egy összevont szám a tanácsadói és az egyéni
// válaszokat keverné — a kettő nem ugyanarra a termékre felel.

export interface FakeDoorCell {
  views: number;
  responses: number;
  yes: number;
  no: number;
  emails: number;
  /** válasz / megtekintés */
  responseRate: number | null;
  /** igen / válasz */
  yesRate: number | null;
  /** e-mail / igen — az első lépcső, ami tényleg kerül valamibe */
  emailRate: number | null;
}

export interface FakeDoorReport {
  total: FakeDoorCell;
  byAudience: { audience: FakeDoorAudience; cell: FakeDoorCell }[];
  byPrice: { price: number; cell: FakeDoorCell }[];
  /** Egyéni vevők ársávonként — a döntéshez ez a metszet a lényeg. */
  individualByPrice: { price: number; cell: FakeDoorCell }[];
  valueGoals: { key: CareerValueGoal; count: number }[];
  noReasons: { key: CareerNoReason; count: number }[];
  otherTexts: { interest: string; text: string; audience: string }[];
  /** „Drágának tartom" ág: mennyit adnának érte. */
  willingness: WillingnessSummary;
}

/**
 * Fizetési hajlandóság az ár-elutasítók között.
 *
 * Medián és nem átlag a fő szám: néhány nullás válasz az átlagot lerántja,
 * a mediánt nem — a döntéshez azt kell tudni, hol van a középső ember.
 * A nullák külön is szerepelnek: ők nem alacsonyabb árat kérnek, hanem
 * egyáltalán nem fizetnének ezért a funkcióért.
 */
export interface WillingnessSummary {
  /** Hányan jelölték az árat visszatartó okként. */
  count: number;
  /** Közülük hányan adtak meg összeget. */
  answered: number;
  zero: number;
  median: number | null;
  average: number | null;
  /** A látott árhoz mért arány mediánja (%) — ársávok között összemérhető. */
  medianShareOfShownPrice: number | null;
  /** Egyedi értékek gyakorisággal, növekvő sorrendben. */
  values: { amount: number; count: number }[];
}

interface ViewRow {
  audience: string;
  priceVariant: number;
}
interface ResponseRow {
  audience: string;
  priceVariant: number;
  interest: string;
  emailOptIn: boolean;
  valueGoal: string | null;
  reasonNo: string | null;
  maxPriceHuf: number | null;
  otherText: string | null;
}

function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function summariseWillingness(responses: ResponseRow[]): WillingnessSummary {
  const priceRows = responses.filter((row) => row.reasonNo === "price");
  const answered = priceRows.filter((row) => row.maxPriceHuf != null);
  const amounts = answered.map((row) => row.maxPriceHuf as number).sort((a, b) => a - b);
  // A látott árhoz mért arány teszi összemérhetővé a három ársávot: 4 900-ból
  // a 2 450 ugyanaz a gesztus, mint 14 900-ból a 7 450.
  const shares = answered
    .map((row) =>
      row.priceVariant > 0
        ? Math.round(((row.maxPriceHuf as number) / row.priceVariant) * 100)
        : 0,
    )
    .sort((a, b) => a - b);

  const values = new Map<number, number>();
  for (const amount of amounts) values.set(amount, (values.get(amount) ?? 0) + 1);

  return {
    count: priceRows.length,
    answered: answered.length,
    zero: amounts.filter((amount) => amount === 0).length,
    median: median(amounts),
    average: amounts.length
      ? Math.round(amounts.reduce((sum, value) => sum + value, 0) / amounts.length)
      : null,
    medianShareOfShownPrice: median(shares),
    values: [...values.entries()]
      .map(([amount, count]) => ({ amount, count }))
      .sort((a, b) => a.amount - b.amount),
  };
}

const rate = (value: number, base: number) =>
  base > 0 ? Math.round((value / base) * 1000) / 10 : null;

function cell(views: ViewRow[], responses: ResponseRow[]): FakeDoorCell {
  const yes = responses.filter((row) => row.interest === "yes").length;
  const no = responses.filter((row) => row.interest === "no").length;
  const emails = responses.filter((row) => row.emailOptIn).length;
  return {
    views: views.length,
    responses: responses.length,
    yes,
    no,
    emails,
    responseRate: rate(responses.length, views.length),
    yesRate: rate(yes, responses.length),
    emailRate: rate(emails, yes),
  };
}

export async function buildFakeDoorReport(module: string): Promise<FakeDoorReport> {
  const [views, responses] = await Promise.all([
    prisma.fakeDoorView.findMany({
      where: { module },
      select: { audience: true, priceVariant: true },
    }),
    prisma.fakeDoorResponse.findMany({
      where: { module },
      select: {
        audience: true,
        priceVariant: true,
        interest: true,
        emailOptIn: true,
        valueGoal: true,
        reasonNo: true,
        maxPriceHuf: true,
        otherText: true,
      },
    }),
  ]);

  const countBy = <T extends string>(
    keys: readonly T[],
    pick: (row: ResponseRow) => string | null,
  ) =>
    keys.map((key) => ({
      key,
      count: responses.filter((row) => pick(row) === key).length,
    }));

  return {
    total: cell(views, responses),
    byAudience: FAKE_DOOR_AUDIENCES.map((audience) => ({
      audience,
      cell: cell(
        views.filter((row) => row.audience === audience),
        responses.filter((row) => row.audience === audience),
      ),
    })),
    byPrice: CAREER_PRICE_VARIANTS.map((price) => ({
      price,
      cell: cell(
        views.filter((row) => row.priceVariant === price),
        responses.filter((row) => row.priceVariant === price),
      ),
    })),
    individualByPrice: CAREER_PRICE_VARIANTS.map((price) => ({
      price,
      cell: cell(
        views.filter((row) => row.priceVariant === price && row.audience === "individual"),
        responses.filter(
          (row) => row.priceVariant === price && row.audience === "individual",
        ),
      ),
    })),
    valueGoals: countBy(CAREER_VALUE_GOALS, (row) => row.valueGoal),
    noReasons: countBy(CAREER_NO_REASONS, (row) => row.reasonNo),
    willingness: summariseWillingness(responses),
    otherTexts: responses
      .filter((row) => row.otherText)
      .map((row) => ({
        interest: row.interest,
        text: row.otherText as string,
        audience: row.audience,
      })),
  };
}

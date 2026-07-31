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
  otherText: string | null;
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
    otherTexts: responses
      .filter((row) => row.otherText)
      .map((row) => ({
        interest: row.interest,
        text: row.otherText as string,
        audience: row.audience,
      })),
  };
}

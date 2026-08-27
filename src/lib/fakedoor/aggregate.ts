// Fake door riport — TISZTA aggregáció (a prisma-olvasó héj a report.ts-ben).
//
// Egyetlen szabály uralja: a konverzió MINDIG válasz / megtekintés, és
// MINDIG szegmentálva. Egy összevont szám a tanácsadói és az egyéni
// válaszokat keverné — a kettő nem ugyanarra a termékre felel. Ez a
// FIZETÉSI HAJLANDÓSÁGRA is áll (2026-08-11, fix): a willingness korábban az
// ÖSSZES válasz fölött számolt mediánt, a modul saját invariánsa ellenére.
//
// SZAVAZAT-HALMOZÁS (2026-08-11, fix): az egyediség kulcsa (module,
// kliens-választotta sessionId) volt — egy fiók tetszőleges számú új
// sessionId-vel korlátlan sort tudott gyártani. Az aggregáció ezért
// PROFIL-SZINTEN deduplikál: profilonként a LEGUTOLSÓ válasz számít (a
// meggondolás ott is felülírás, mint a munkameneten belül); a nevezőben
// (views) profilonként az ELSŐ megtekintés. A kulcs-létra a legerősebb
// elérhető azonosító: profileId > userId > sessionId — a route auth mögött
// van, tehát a gyakorlatban mindig van profil/user; a sessionId-fallback a
// történeti (auth előtti) sorokra marad.

import {
  CAREER_PRICE_VARIANTS,
  CAREER_NO_REASONS,
  CAREER_VALUE_GOALS,
  FAKE_DOOR_AUDIENCES,
  type CareerNoReason,
  type CareerValueGoal,
  type FakeDoorAudience,
} from "@/lib/fakedoor/career";

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
  /**
   * „Drágának tartom" ág közönségenként: mennyit adnának érte. SOSEM
   * összevonva — a tanácsadói és az egyéni összeg nem ugyanarra a termékre
   * vonatkozik (üres közönség-szegmens kimarad).
   */
  willingnessByAudience: { audience: FakeDoorAudience; summary: WillingnessSummary }[];
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

export interface FakeDoorViewRow {
  audience: string;
  priceVariant: number;
  sessionId: string;
  userId: string | null;
  profileId: string | null;
  createdAt: Date;
}

export interface FakeDoorResponseRow {
  audience: string;
  priceVariant: number;
  interest: string;
  emailOptIn: boolean;
  valueGoal: string | null;
  reasonNo: string | null;
  maxPriceHuf: number | null;
  otherText: string | null;
  sessionId: string;
  userId: string | null;
  profileId: string | null;
  respondedAt: Date;
}

/** A legerősebb elérhető dedup-kulcs: profil > user > munkamenet. */
function dedupKey(row: {
  profileId: string | null;
  userId: string | null;
  sessionId: string;
}): string {
  if (row.profileId) return `p:${row.profileId}`;
  if (row.userId) return `u:${row.userId}`;
  return `s:${row.sessionId}`;
}

/** Profilonként a LEGUTOLSÓ válasz – a meggondolás felülírás, nem új szavazat. */
export function dedupeResponses(rows: FakeDoorResponseRow[]): FakeDoorResponseRow[] {
  const byKey = new Map<string, FakeDoorResponseRow>();
  for (const row of rows) {
    const key = dedupKey(row);
    const existing = byKey.get(key);
    if (!existing || row.respondedAt >= existing.respondedAt) byKey.set(key, row);
  }
  return [...byKey.values()];
}

/** Profilonként az ELSŐ megtekintés – az újranyitás nem hígít(hat)ja a nevezőt. */
export function dedupeViews(rows: FakeDoorViewRow[]): FakeDoorViewRow[] {
  const byKey = new Map<string, FakeDoorViewRow>();
  for (const row of rows) {
    const key = dedupKey(row);
    const existing = byKey.get(key);
    if (!existing || row.createdAt < existing.createdAt) byKey.set(key, row);
  }
  return [...byKey.values()];
}

function median(sorted: number[]): number | null {
  if (sorted.length === 0) return null;
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 1
    ? sorted[middle]
    : Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

export function summariseWillingness(
  responses: FakeDoorResponseRow[],
): WillingnessSummary {
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

function cell(views: FakeDoorViewRow[], responses: FakeDoorResponseRow[]): FakeDoorCell {
  const yes = responses.filter((row) => row.interest === "yes").length;
  const no = responses.filter((row) => row.interest === "no").length;
  const emails = responses.filter((row) => row.emailOptIn).length;
  // Az emailRate az „igen → email" konverzió, ezért a SZÁMLÁLÓ is csak az
  // igen-ágból jöhet. Az összes opt-in (`emails`) az ár-elutasítókat is
  // tartalmazza (wouldPaySomething), így a korábbi emails/yes arány 100% fölé
  // is mehetett, felfelé torzítva a kereslet-becslést. A teljes opt-in szám
  // külön mezőben marad.
  const yesEmails = responses.filter(
    (row) => row.interest === "yes" && row.emailOptIn,
  ).length;
  return {
    views: views.length,
    responses: responses.length,
    yes,
    no,
    emails,
    responseRate: rate(responses.length, views.length),
    yesRate: rate(yes, responses.length),
    emailRate: rate(yesEmails, yes),
  };
}

export function aggregateFakeDoorReport(
  rawViews: FakeDoorViewRow[],
  rawResponses: FakeDoorResponseRow[],
): FakeDoorReport {
  const views = dedupeViews(rawViews);
  const responses = dedupeResponses(rawResponses);

  const countBy = <T extends string>(
    keys: readonly T[],
    pick: (row: FakeDoorResponseRow) => string | null,
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
    // Fizetési hajlandóság KÖZÖNSÉGENKÉNT – üres szegmens kimarad, összevont
    // szám nincs (a modul-invariáns a willingness-re is áll).
    willingnessByAudience: FAKE_DOOR_AUDIENCES.map((audience) => ({
      audience,
      summary: summariseWillingness(
        responses.filter((row) => row.audience === audience),
      ),
    })).filter((entry) => entry.summary.count > 0),
    otherTexts: responses
      .filter((row) => row.otherText)
      .map((row) => ({
        interest: row.interest,
        text: row.otherText as string,
        audience: row.audience,
      })),
  };
}

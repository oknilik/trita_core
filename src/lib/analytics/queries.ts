import "server-only";

import { prisma } from "@/lib/prisma";

/**
 * Az analitika-fül LEKÉRDEZÉSEI.
 *
 * KÉT FORRÁS, KIMONDOTT HIERARCHIÁVAL:
 *   · **DB-igazság** — a termék-tábláiból (UserProfile, AssessmentResult,
 *     Inquiry…) számolt szám PONTOS. Ez az üzleti KPI.
 *   · **Esemény** — az `AnalyticsEvent` táblából számolt szám LOSSY:
 *     ad-blocker, GPC/DNT-tisztelet, bot-szűrés és a `sendBeacon`
 *     kézbesítési bizonytalansága miatt alulmér.
 *
 * Ha a kettő eltér, a DB nyer. Az admin-felület ezért mindkettőt kiírja,
 * és nem próbálja őket egyetlen számmá gyúrni — a hamis pontosság rosszabb,
 * mint a látható eltérés.
 *
 * ATTRIBÚCIÓ ELEMZÉS-IDŐBEN: eszközön nem tárolunk semmit, ezért az UTM csak
 * azokra az eseményekre kerül rá, amelyek olyan lapon keletkeztek, ahol az
 * URL-ben még ott volt. A látogató további eseményeihez a `visitorRef`-en át
 * kötjük hozzá (ld. `getAcquisitionFunnel`) — ez a kötés a napi rotáció miatt
 * NAPON BELÜL érvényes.
 */

export interface AnalyticsRangeWindow {
  since: Date;
  /** Napi bontású sávok kezdetei (a trend-charthoz). */
  bucketStarts: Date[];
  labels: string[];
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Napi sávok az elmúlt N napra (UTC-nap alapú, mint a visitorRef rotációja). */
export function buildDailyWindow(days: number, now = new Date()): AnalyticsRangeWindow {
  const starts = Array.from({ length: days }, (_, i) => {
    const d = new Date(now.getTime() - (days - 1 - i) * DAY_MS);
    d.setUTCHours(0, 0, 0, 0);
    return d;
  });
  return {
    since: starts[0],
    bucketStarts: starts,
    labels: starts.map((d) => d.toLocaleDateString("hu-HU", { month: "short", day: "numeric" })),
  };
}

function bucketIndex(starts: Date[], at: Date): number {
  let index = -1;
  for (let i = 0; i < starts.length; i++) {
    if (starts[i].getTime() <= at.getTime()) index = i;
    else break;
  }
  return index;
}

// ─────────────────────────────────────────────────────────────────────

export interface TrafficSummary {
  /** Napi egyedi látogató (a rotáló ref miatt: NAPI egyedi, nem havi). */
  dailyVisitors: number[];
  pageViews: number[];
  totalVisitors: number;
  totalPageViews: number;
  /** Van-e egyáltalán adat — üres állapot megkülönböztetése a nullától. */
  hasData: boolean;
}

export async function getTrafficSummary(window: AnalyticsRangeWindow): Promise<TrafficSummary> {
  const rows = await prisma.analyticsEvent.findMany({
    where: { name: "page.view", occurredAt: { gte: window.since } },
    select: { occurredAt: true, visitorRef: true },
  });

  const pageViews = new Array(window.bucketStarts.length).fill(0);
  const visitorsPerBucket = window.bucketStarts.map(() => new Set<string>());

  for (const row of rows) {
    const index = bucketIndex(window.bucketStarts, row.occurredAt);
    if (index < 0) continue;
    pageViews[index] += 1;
    visitorsPerBucket[index].add(row.visitorRef);
  }

  return {
    dailyVisitors: visitorsPerBucket.map((set) => set.size),
    pageViews,
    // A napi egyedi látogatók ÖSSZEGE (nem uniója): a ref naponta rotál,
    // ezért az unió nem jelentene „egyedi embert", csak félrevezető számot.
    totalVisitors: visitorsPerBucket.reduce((sum, set) => sum + set.size, 0),
    totalPageViews: pageViews.reduce((sum, n) => sum + n, 0),
    hasData: rows.length > 0,
  };
}

// ─────────────────────────────────────────────────────────────────────

export interface LabeledCount {
  label: string;
  value: number;
}

export async function getTopPaths(window: AnalyticsRangeWindow, limit = 10): Promise<LabeledCount[]> {
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["path"],
    where: { name: "page.view", occurredAt: { gte: window.since }, path: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { path: "desc" } },
    take: limit,
  });
  return grouped.map((row) => ({ label: row.path ?? "(ismeretlen)", value: row._count._all }));
}

export async function getTopReferrers(window: AnalyticsRangeWindow, limit = 10): Promise<LabeledCount[]> {
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["referrerHost"],
    where: { occurredAt: { gte: window.since }, referrerHost: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { referrerHost: "desc" } },
    take: limit,
  });
  return grouped.map((row) => ({ label: row.referrerHost ?? "(közvetlen)", value: row._count._all }));
}

export async function getTopCampaigns(window: AnalyticsRangeWindow, limit = 10): Promise<LabeledCount[]> {
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["utmSource", "utmCampaign"],
    where: { occurredAt: { gte: window.since }, utmSource: { not: null } },
    _count: { _all: true },
    orderBy: { _count: { utmSource: "desc" } },
    take: limit,
  });
  return grouped.map((row) => ({
    label: [row.utmSource, row.utmCampaign].filter(Boolean).join(" · "),
    value: row._count._all,
  }));
}

// ─────────────────────────────────────────────────────────────────────

export interface FunnelStep {
  label: string;
  /** Eseményből számolt (lossy) érték. */
  eventValue: number | null;
  /** DB-ből számolt (pontos) érték, ha van ilyen forrás. */
  dbValue: number | null;
  note?: string;
}

/**
 * Akvizíciós tölcsér. Ahol létezik DB-forrás, ott AZT is kiírjuk — az
 * eltérés maga is információ (mekkora a mérési veszteség).
 */
export async function getAcquisitionFunnel(window: AnalyticsRangeWindow): Promise<FunnelStep[]> {
  const since = window.since;

  const [landingVisitors, tryStarts, tryCompletes, dbResults, dbProfiles, dbInquiries, inquirySubmits] =
    await Promise.all([
      prisma.analyticsEvent
        .findMany({
          where: { name: "page.view", path: "/", occurredAt: { gte: since } },
          select: { visitorRef: true },
        })
        .then((rows) => new Set(rows.map((r) => r.visitorRef)).size),
      prisma.analyticsEvent
        .findMany({
          where: { name: "assessment.start", occurredAt: { gte: since } },
          select: { visitorRef: true },
        })
        .then((rows) => new Set(rows.map((r) => r.visitorRef)).size),
      prisma.analyticsEvent.count({ where: { name: "assessment.complete", occurredAt: { gte: since } } }),
      prisma.assessmentResult.count({ where: { createdAt: { gte: since } } }),
      prisma.userProfile.count({ where: { deleted: false, createdAt: { gte: since } } }),
      prisma.inquiry.count({ where: { createdAt: { gte: since } } }),
      prisma.analyticsEvent.count({ where: { name: "inquiry.submit", occurredAt: { gte: since } } }),
    ]);

  return [
    {
      label: "Főoldal-látogató",
      eventValue: landingVisitors,
      dbValue: null,
      note: "napi egyedi látogatók összege",
    },
    { label: "Felmérés elindítva", eventValue: tryStarts, dbValue: null },
    {
      label: "Felmérés befejezve",
      eventValue: tryCompletes,
      dbValue: dbResults,
      note: "DB: AssessmentResult",
    },
    { label: "Regisztrált profil", eventValue: null, dbValue: dbProfiles, note: "DB: UserProfile" },
    {
      label: "Megkeresés",
      eventValue: inquirySubmits,
      dbValue: dbInquiries,
      note: "DB: Inquiry",
    },
  ];
}

// ─────────────────────────────────────────────────────────────────────

export interface DropOffPoint {
  index: number;
  viewers: number;
}

/**
 * Kitöltési lemorzsolódás-görbe: hány KÜLÖNBÖZŐ látogató látta az adott
 * sorszámú kérdést. A görbe meredek esése mutatja, hol veszítjük el őket.
 */
export async function getAssessmentDropOff(window: AnalyticsRangeWindow): Promise<DropOffPoint[]> {
  const rows = await prisma.analyticsEvent.findMany({
    where: { name: "assessment.question_view", occurredAt: { gte: window.since } },
    select: { visitorRef: true, props: true },
  });

  const perIndex = new Map<number, Set<string>>();
  for (const row of rows) {
    const props = row.props as { index?: unknown } | null;
    const index = typeof props?.index === "number" ? props.index : null;
    if (index === null) continue;
    if (!perIndex.has(index)) perIndex.set(index, new Set());
    perIndex.get(index)!.add(row.visitorRef);
  }

  return [...perIndex.entries()]
    .map(([index, visitors]) => ({ index, viewers: visitors.size }))
    .sort((a, b) => a.index - b.index);
}

// ─────────────────────────────────────────────────────────────────────

export async function getEventVolume(window: AnalyticsRangeWindow, limit = 25): Promise<LabeledCount[]> {
  const grouped = await prisma.analyticsEvent.groupBy({
    by: ["name"],
    where: { occurredAt: { gte: window.since } },
    _count: { _all: true },
    orderBy: { _count: { name: "desc" } },
    take: limit,
  });
  return grouped.map((row) => ({ label: row.name, value: row._count._all }));
}

export interface RecentEventRow {
  id: string;
  name: string;
  occurredAt: Date;
  path: string | null;
  origin: string;
  deviceClass: string | null;
  isAuthed: boolean;
  props: unknown;
}

/** Nyers esemény-lista — hibakereséshez („megérkezik-e egyáltalán?"). */
export async function getRecentEvents(limit = 25): Promise<RecentEventRow[]> {
  return prisma.analyticsEvent.findMany({
    orderBy: { occurredAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      occurredAt: true,
      path: true,
      origin: true,
      deviceClass: true,
      isAuthed: true,
      props: true,
    },
  });
}

/** Összes tárolt esemény + a legrégebbi dátuma (megőrzés ellenőrzéséhez). */
export async function getStorageStats(): Promise<{ total: number; oldest: Date | null }> {
  const [total, oldest] = await Promise.all([
    prisma.analyticsEvent.count(),
    prisma.analyticsEvent.findFirst({ orderBy: { occurredAt: "asc" }, select: { occurredAt: true } }),
  ]);
  return { total, oldest: oldest?.occurredAt ?? null };
}

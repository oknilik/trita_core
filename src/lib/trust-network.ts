// ─────────────────────────────────────────────────────────────────────
// Bizalmi háló (trust-kör) — kérdéskészlet és TISZTA háló-logika.
// Prisma-mentes, kliens-oldalon is importálható; a szerver-oldali
// betöltés a trust-network.server.ts-ben él.
//
// KONCEPCIÓ (docs/product/feature-ideas.md #1): a dinamika-térkép
// profil-alapú BECSLÉSEIT páronkénti MÉRT relációs adat váltja ki, ahol
// van trust-kör adat — a becslés fallbackként megmarad.
//
// LÁTHATÓSÁGI SZABÁLYOK (a consent-szöveg mondja ki):
// - A pár-szintű él (két irány átlaga) a dinamika-térképen jelenik meg,
//   amit a vezető/tanácsadó lát; egyéni (irányított) válasz soha nem
//   jelenik meg.
// - Csomópont-szintű aggregátum (befelé irányuló bizalom átlaga) csak
//   TRUST_MIN_RATERS (3) értékelőtől létezik — alatta null, a pulse- és
//   peer-küszöb mintája.
// - Pár-él kizárólag mindkét irány meglétekor látható. Egyirányú válasz
//   csak a küszöbölt csomópont-aggregátumba számít, se UI/API/export élként,
//   se tooltipben nem jelenhet meg.
// - Hub- és beágyazatlan-jelölés csak legalább három külön bejövő
//   értékelőnél, kölcsönös élekből számolható.
// ─────────────────────────────────────────────────────────────────────

import { MIN_RATERS_FOR_ANONYMOUS_AGGREGATE } from "./anonymity";

export const TRUST_MIN_RATERS = MIN_RATERS_FOR_ANONYMOUS_AGGREGATE;

export type TrustQuestionId =
  | "trust"
  | "help"
  | "openness"
  | "inclusion"
  | "collaboration";

export interface TrustQuestion {
  id: TrustQuestionId;
  /** A skála felső értéke (1..max, egész). */
  max: 3 | 5;
  /** A kérdés az értékelt személyre E/3-ban utal — a neve a kártya-fejlécben áll. */
  text: { hu: string; en: string };
  /** 3-fokú kérdéseknél a fokozatok feliratai; 5-fokúnál a két végpont. */
  options: { value: number; hu: string; en: string }[];
}

export const TRUST_QUESTIONS: TrustQuestion[] = [
  {
    id: "trust",
    max: 5,
    text: {
      hu: "Mennyire bízol a szakmai ítéletében?",
      en: "How much do you trust their professional judgment?",
    },
    options: [
      { value: 1, hu: "egyáltalán nem", en: "not at all" },
      { value: 5, hu: "teljes mértékben", en: "completely" },
    ],
  },
  {
    id: "help",
    max: 3,
    text: {
      hu: "Milyen gyakran kérsz tőle segítséget vagy véleményt?",
      en: "How often do you ask them for help or input?",
    },
    options: [
      { value: 1, hu: "soha", en: "never" },
      { value: 2, hu: "ritkán", en: "rarely" },
      { value: 3, hu: "rendszeresen", en: "regularly" },
    ],
  },
  {
    id: "openness",
    max: 5,
    text: {
      hu: "Mennyire tudsz vele nyíltan, szépítés nélkül beszélni munkahelyi kérdésekről?",
      en: "How openly can you talk with them about work matters, without sugarcoating?",
    },
    options: [
      { value: 1, hu: "egyáltalán nem", en: "not at all" },
      { value: 5, hu: "teljesen nyíltan", en: "fully openly" },
    ],
  },
  {
    id: "inclusion",
    max: 3,
    text: {
      hu: "Ha fontos döntés előtt állnál, bevonnád?",
      en: "Facing an important decision, would you involve them?",
    },
    options: [
      { value: 1, hu: "nem", en: "no" },
      { value: 2, hu: "attól függ", en: "it depends" },
      { value: 3, hu: "igen", en: "yes" },
    ],
  },
  {
    id: "collaboration",
    max: 3,
    text: {
      hu: "Összességében hogyan jellemeznéd a közös munkátokat?",
      en: "Overall, how would you describe working together?",
    },
    options: [
      { value: 1, hu: "nehézkes", en: "strained" },
      { value: 2, hu: "működik", en: "works" },
      { value: 3, hu: "zökkenőmentes", en: "smooth" },
    ],
  },
];

export const TRUST_QUESTION_COUNT = TRUST_QUESTIONS.length;

/** questionId → 1..max nyers válasz */
export type TrustAnswerSet = Record<string, number>;

export function isValidTrustAnswerSet(
  answers: unknown,
): answers is TrustAnswerSet {
  if (!answers || typeof answers !== "object" || Array.isArray(answers)) return false;
  const map = answers as Record<string, unknown>;
  if (Object.keys(map).length !== TRUST_QUESTION_COUNT) return false;
  return TRUST_QUESTIONS.every((q) => {
    const v = map[q.id];
    return typeof v === "number" && Number.isInteger(v) && v >= 1 && v <= q.max;
  });
}

/** Egy irányított (rater → értékelt) válaszkészlet 0–100 pontszáma. */
export function directedTrustScore(answers: TrustAnswerSet): number {
  let sum = 0;
  for (const q of TRUST_QUESTIONS) {
    sum += ((answers[q.id] - 1) / (q.max - 1)) * 100;
  }
  return Math.round(sum / TRUST_QUESTION_COUNT);
}

export type TrustEdgeType =
  | "strong_trust"
  | "moderate"
  | "weak_trust"
  | "disconnected";

// A moderate él alsó határa — a beágyazatlan (isolated) tagok számítása is
// ehhez köt: aki alatta marad minden élén, annak nincs ≥ moderate kapcsolata.
export const TRUST_EDGE_MODERATE_MIN = 55;

// A publikus mért él mindig kölcsönös. A one-sided konstans csak régi
// snapshotok deszerializálásához marad meg.
export const EDGE_CONFIDENCE_MUTUAL = 100;
export const EDGE_CONFIDENCE_ONE_SIDED = 50;

export function trustEdgeType(score: number): TrustEdgeType {
  if (score >= 75) return "strong_trust";
  if (score >= TRUST_EDGE_MODERATE_MIN) return "moderate";
  if (score >= 35) return "weak_trust";
  return "disconnected";
}

export interface TrustObservationInput {
  aboutUserId: string;
  raterUserId: string;
  answers: TrustAnswerSet;
}

/**
 * (rater → értékelt) páronként az UTOLSÓ megfigyelés nyer — a bemenet
 * időrendben (régi → új) legyen rendezve; az ismételt körök így felülírják
 * a korábbit, nem duplázódnak. A buildTeamTrustNetwork és a manager-cockpit
 * kötegelt betöltőjének közös dedupe-lépése.
 */
export function dedupeLatestTrustObservations<T extends TrustObservationInput>(
  observations: readonly T[],
): T[] {
  const latest = new Map<string, T>();
  for (const obs of observations) {
    latest.set(`${obs.raterUserId}→${obs.aboutUserId}`, obs);
  }
  return [...latest.values()];
}

/** Irányítatlan pár-él: a és b rendezett (a < b), a pontszám az irányok átlaga. */
export interface TrustEdge {
  a: string;
  b: string;
  score: number;
  type: TrustEdgeType;
  /** Mindkét irányból van mért adat (különben egyoldalú kép). */
  mutual: boolean;
}

export interface TrustNodeStat {
  userId: string;
  /** Hányan értékelték (befelé irányuló megfigyelések). */
  inboundCount: number;
  /** Befelé irányuló bizalom átlaga (0–100) — null a küszöb alatt. */
  inboundMean: number | null;
  /**
   * Hány erős (strong_trust), BEFELÉ evidenciált él kapcsolódik hozzá
   * (kölcsönös, vagy egyoldalú, ahol ő az értékelt) — a fejléc-kontrakt
   * szerint a csak-kifelé él nem számít.
   */
  strongEdgeCount: number;
}

export interface TrustNetwork {
  edges: TrustEdge[];
  nodes: TrustNodeStat[];
  /**
   * A csapat összekötő(i): a legtöbb erős, befelé evidenciált éllel
   * (min. 2) rendelkező tag(ok).
   */
  hubUserIds: string[];
  /**
   * Beágyazatlan tagok: legalább 2 befelé evidenciált mért éllel, de
   * egyetlen ≥ moderate él nélkül.
   */
  isolatedUserIds: string[];
  measuredPairCount: number;
  /** Az összes lehetséges pár (ha ismert a taglista), különben null. */
  possiblePairCount: number | null;
  /** measuredPairCount / possiblePairCount — null, ha a taglista nem ismert. */
  coverage: number | null;
}

/**
 * A bizalmi háló felépítése érvényes megfigyelésekből. A hívó felel a
 * (aboutUserId, raterUserId) páronkénti dedupe-ért (legfrissebb kör
 * nyer) — ld. trust-network.server.ts.
 *
 * Ha `memberIds` adott, a megfigyelések a JELENLEGI tag-halmazra szűkülnek
 * (értékelő ÉS értékelt is tag legyen): a kilépett tagok korábbi körökből
 * ittmaradt válaszai nélkül nem duzzad az él-/erős-él-szám, a hub- és
 * beágyazatlan-jelölés, az inbound-átlag — és a lefedettség (mért pár /
 * lehetséges pár a jelenlegi tagokból) sem lépheti túl a 100%-ot.
 */
export function computeTrustNetwork(
  observations: TrustObservationInput[],
  memberIds?: string[],
): TrustNetwork {
  const memberSet = memberIds ? new Set(memberIds) : null;
  const valid = observations.filter(
    (o) =>
      isValidTrustAnswerSet(o.answers) &&
      (!memberSet ||
        (memberSet.has(o.raterUserId) && memberSet.has(o.aboutUserId))),
  );

  // Irányított pontszámok: rater → értékelt.
  const directed = new Map<string, number>();
  const inbound = new Map<string, number[]>();
  for (const obs of valid) {
    const score = directedTrustScore(obs.answers);
    directed.set(`${obs.raterUserId}→${obs.aboutUserId}`, score);
    const list = inbound.get(obs.aboutUserId) ?? [];
    list.push(score);
    inbound.set(obs.aboutUserId, list);
  }

  // Irányítatlan pár-élek: az elérhető irányok átlaga.
  const pairKeys = new Set<string>();
  for (const obs of valid) {
    const [a, b] = [obs.aboutUserId, obs.raterUserId].sort();
    pairKeys.add(`${a}|${b}`);
  }
  const edges: TrustEdge[] = [...pairKeys].sort().flatMap((key) => {
    const [a, b] = key.split("|");
    const ab = directed.get(`${a}→${b}`);
    const ba = directed.get(`${b}→${a}`);
    if (typeof ab !== "number" || typeof ba !== "number") return [];
    const score = Math.round((ab + ba) / 2);
    return [{ a, b, score, type: trustEdgeType(score), mutual: true }];
  });

  // Csomópont-statisztikák — minden érintett (vagy megadott) tagra.
  const nodeIds = new Set<string>(memberIds ?? []);
  if (!memberIds) {
    for (const obs of valid) {
      nodeIds.add(obs.aboutUserId);
      nodeIds.add(obs.raterUserId);
    }
  }
  // A látható élhalmaz eleve csak kölcsönös párokat tartalmaz.
  const inboundEvidencedEdgesFor = (userId: string): TrustEdge[] =>
    edges.filter(
      (e) =>
        (e.a === userId && directed.has(`${e.b}→${userId}`)) ||
        (e.b === userId && directed.has(`${e.a}→${userId}`)),
    );

  const nodes: TrustNodeStat[] = [...nodeIds].sort().map((userId) => {
    const inScores = inbound.get(userId) ?? [];
    const inboundMean =
      inScores.length >= TRUST_MIN_RATERS
        ? Math.round(inScores.reduce((x, y) => x + y, 0) / inScores.length)
        : null;
    const strongEdgeCount = inboundEvidencedEdgesFor(userId).filter(
      (e) => e.type === "strong_trust",
    ).length;
    return { userId, inboundCount: inScores.length, inboundMean, strongEdgeCount };
  });

  const maxStrong = Math.max(0, ...nodes.map((n) => n.strongEdgeCount));
  const hubUserIds =
    maxStrong >= 2
      ? nodes
          .filter((n) => n.inboundCount >= TRUST_MIN_RATERS && n.strongEdgeCount === maxStrong)
          .map((n) => n.userId)
      : [];

  const isolatedUserIds = nodes
    .filter((n) => {
      if (n.inboundCount < TRUST_MIN_RATERS) return false;
      const myEdges = inboundEvidencedEdgesFor(n.userId);
      return myEdges.length >= 2 && myEdges.every((e) => e.score < TRUST_EDGE_MODERATE_MIN);
    })
    .map((n) => n.userId);

  const possiblePairCount =
    memberIds && memberIds.length > 1
      ? (memberIds.length * (memberIds.length - 1)) / 2
      : null;

  return {
    edges,
    nodes,
    hubUserIds,
    isolatedUserIds,
    measuredPairCount: edges.length,
    possiblePairCount,
    // A tag-szűrés után az élszám ≤ lehetséges párszám; a clamp defenzív őr
    // (a lefedettség szemantikailag legfeljebb 100%).
    coverage:
      possiblePairCount && possiblePairCount > 0
        ? Math.min(1, Math.round((edges.length / possiblePairCount) * 100) / 100)
        : null,
  };
}

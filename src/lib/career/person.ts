// PersonInput összeállítása a szerveren — EGY helyen, hogy a képernyő, a PDF és
// a jelölt-réteg ugyanabból az inputból dolgozzon. (A v1-ben a self+observer
// keverés a React-komponensben történt, a PDF-ág pedig kimaradt belőle: ugyanarra
// a userre három különböző eredmény jött.)

import { InvitationStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { SCORING_FULL_FORM_MIN_ITEMS, type ScoreResult } from "@/lib/scoring";
import { estimateInterests, interestsFromTags } from "./interests";
import {
  AXIS_KEYS,
  DIM_CODES,
  RIASEC_LETTERS,
  VETO_TAGS,
  type AssessmentForm,
  type AxisKey,
  type DimCode,
  type EduField,
  type PersonInput,
  type RiasecLetter,
  type VetoTag,
} from "./types";

/** A karrier-wizard mentett háttere (UserProfile.careerBackground JSON). */
export interface StoredCareerBackground {
  status?: "studying" | "working" | "switching";
  eduLevel?: "primary" | "secondary" | "vocational" | "higher" | "specialized" | null;
  riasecScores?: Partial<Record<RiasecLetter, number>>;
  interestTags?: string[];
  /** preferencia- és környezet-tengelyek (F1 óta perzisztálva) */
  prefs?: Partial<Record<AxisKey, -1 | 0 | 1>>;
  leadIntent?: "lead" | "expert" | "unsure";
  currentOccupationId?: string | null;
  currentOccupationLabel?: string | null;
  /** végzettség szakiránya (max 3) */
  eduFields?: string[];
  /** örökölt egyértékű mező */
  eduField?: string | null;
  /** kizárt munka-tulajdonságok (vétó-chipek) */
  vetoes?: string[];
}

/**
 * A kérdőív-forma a TÁROLT kitöltésből: a kanonikus forrás a scoring-motor
 * `form` pecsétje; a pecsét előtti örökség-sorokra a questionCount-heurisztika
 * marad (100 itemes teljes bank = "full", minden más "short").
 * A forma a hibasávot vezérli — a full-kitöltő szűkebb SEM-et érdemel.
 */
function formFromScores(scores: unknown): AssessmentForm {
  const record = scores as { form?: unknown; questionCount?: unknown } | null;
  if (record?.form === "full" || record?.form === "short") return record.form;
  const count = record?.questionCount;
  return typeof count === "number" && count >= SCORING_FULL_FORM_MIN_ITEMS
    ? "full"
    : "short";
}

function pickDims(scores: unknown): Partial<Record<DimCode, number>> {
  const result: Partial<Record<DimCode, number>> = {};
  const dims = (scores as ScoreResult | null)?.type === "likert"
    ? (scores as Extract<ScoreResult, { type: "likert" }>).dimensions
    : null;
  if (!dims) return result;
  for (const dim of DIM_CODES) {
    const value = dims[dim];
    if (typeof value === "number") result[dim] = value;
  }
  return result;
}

function normalizePrefs(
  raw: StoredCareerBackground["prefs"],
): PersonInput["prefs"] {
  if (!raw) return undefined;
  const prefs: NonNullable<PersonInput["prefs"]> = {};
  for (const axis of AXIS_KEYS) {
    const value = raw[axis];
    if (value === -1 || value === 0 || value === 1) prefs[axis] = value;
  }
  return Object.keys(prefs).length > 0 ? prefs : undefined;
}

/**
 * Érdeklődés-forrás lépcsője: MÉRT kérdőív > választott címkék > személyiség-
 * alapú becslés. A forrás a hibasávba is beszámít (a becsült kód zajosabb).
 */
function normalizeInterests(
  background: StoredCareerBackground | null,
  dims: Partial<Record<DimCode, number>>,
  prefs: PersonInput["prefs"],
): PersonInput["interests"] {
  const measured = background?.riasecScores;
  if (measured) {
    const vector: Partial<Record<RiasecLetter, number>> = {};
    for (const letter of RIASEC_LETTERS) {
      const value = measured[letter];
      if (typeof value === "number") vector[letter] = value;
    }
    if (Object.keys(vector).length >= 4) return { vector, source: "measured" };
  }
  const fromTags = interestsFromTags(background?.interestTags);
  if (fromTags) return { vector: fromTags, source: "tags" };
  if (Object.keys(dims).length === 0) return null;
  return { vector: estimateInterests(dims, prefs), source: "estimated" };
}

const EDU_FIELDS: EduField[] = [
  "tech_engineering",
  "economics",
  "health",
  "humanities",
  "natural_science",
  "legal",
  "arts",
  "pedagogy",
  "trade",
  "none_other",
];

/** Vétó-lista normalizálása: csak érvényes címke marad. */
function normalizeVetoes(raw: string[] | undefined): VetoTag[] {
  if (!raw?.length) return [];
  return raw.filter((tag): tag is VetoTag => VETO_TAGS.includes(tag as VetoTag));
}

/** A végzettség szakiránya — az örökölt egyértékű mezőt is tömbként adja vissza. */
function normalizeEduFields(background: StoredCareerBackground | null): EduField[] {
  const raw = background?.eduFields?.length
    ? background.eduFields
    : background?.eduField
      ? [background.eduField]
      : [];
  return raw.filter((field): field is EduField =>
    EDU_FIELDS.includes(field as EduField),
  );
}

export interface BuiltPerson {
  person: PersonInput;
  hasSelfResult: boolean;
  observerCount: number;
}

/**
 * A user teljes karrier-inputja: önértékelés + observer-átlag + mentett
 * wizard-háttér. A hívó felülírhatja a wizard friss (még nem mentett) válaszait.
 */
export async function buildPersonInput(
  userProfileId: string,
  overrides?: Partial<PersonInput>,
): Promise<BuiltPerson> {
  const [profile, latestResult, observerAssessments] = await Promise.all([
    prisma.userProfile.findUnique({
      where: { id: userProfileId },
      select: { careerBackground: true },
    }),
    prisma.assessmentResult.findFirst({
      where: { userProfileId, isSelfAssessment: true },
      orderBy: { createdAt: "desc" },
      select: { scores: true },
    }),
    prisma.observerAssessment.findMany({
      where: {
        invitation: { inviterId: userProfileId, status: InvitationStatus.COMPLETED },
      },
      select: { scores: true },
    }),
  ]);

  const background = (profile?.careerBackground ?? null) as StoredCareerBackground | null;
  const dims = pickDims(latestResult?.scores);

  const observerDims: Partial<Record<DimCode, number>> = {};
  let observerCount = 0;
  if (observerAssessments.length > 0) {
    const sums: Partial<Record<DimCode, { sum: number; n: number }>> = {};
    for (const assessment of observerAssessments) {
      const values = pickDims(assessment.scores);
      let counted = false;
      for (const dim of DIM_CODES) {
        const value = values[dim];
        if (typeof value !== "number") continue;
        const bucket = (sums[dim] ??= { sum: 0, n: 0 });
        bucket.sum += value;
        bucket.n += 1;
        counted = true;
      }
      if (counted) observerCount += 1;
    }
    for (const dim of DIM_CODES) {
      const bucket = sums[dim];
      if (bucket && bucket.n > 0) observerDims[dim] = Math.round(bucket.sum / bucket.n);
    }
  }

  const person: PersonInput = {
    dims,
    form: formFromScores(latestResult?.scores),
    observer: observerCount > 0 ? { dims: observerDims, raterCount: observerCount } : null,
    interests: normalizeInterests(background, dims, normalizePrefs(background?.prefs)),
    prefs: normalizePrefs(background?.prefs),
    eduLevel: background?.eduLevel ?? null,
    eduFields: normalizeEduFields(background),
    leadIntent: background?.leadIntent ?? "unsure",
    vetoes: normalizeVetoes(background?.vetoes),
    ...overrides,
  };

  // Ha a hívó FRISS preferenciákat adott, a becsült érdeklődés-vektor is
  // azokból számoljon (a mért/címke-alapú forrást viszont nem írjuk felül).
  if (overrides?.prefs && person.interests?.source === "estimated") {
    person.interests = {
      vector: estimateInterests(person.dims, person.prefs),
      source: "estimated",
    };
  }

  return {
    person,
    hasSelfResult: Object.keys(dims).length > 0,
    observerCount,
  };
}

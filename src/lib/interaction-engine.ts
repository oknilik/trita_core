// ─────────────────────────────────────────────────────────────────────
// Interakció-szimuláció F2 — kompozíciós motor.
//
// Tiszta függvény: (én pontszámaim, ő pontszámai) → három blokk
// (ami magától megy · ahol súrlódás várható · mit beszéljetek meg előre),
// az F1 reláció-atomokból (`interaction-atoms.ts`) válogatva.
//
// A motor NEM ismer adatvédelmi szabályt: pontszámokat kap, nem tudhat
// hozzájárulásról. A „konkrét kolléga csak megosztott profillal vagy közös
// csapat-tagsággal" korlátot a HÍVÓ (page/route guard) érvényesíti — ez
// tudatos határvonal, ne kerüljön ide.
//
// A kimenet kétnyelvű marad (LocalizedText): a motor locale-független, a
// nyelvet a megjelenítő réteg választja ki. Így a szerver oldalon egyszer
// lefuttatható mind a 30 archetípusra, és csak a kért nyelv szerializálódik.
//
// Terv: docs/product/riport-interakcio-szimulacio-terv.md
// ─────────────────────────────────────────────────────────────────────

import { FRICTION_WEIGHTS } from "@/lib/friction-model";
import {
  LEADER_SUPPLEMENTS,
  atomBlocksFor,
  findAtom,
  type AtomSide,
  type LocalizedText,
  type Pole,
  type RelationAtom,
} from "@/lib/interaction-atoms";
import { TRITAN_ORDER, type TritanDimCode } from "@/lib/tritan";

// ── Pólus-küszöbök ───────────────────────────────────────────────────
// A `profile-engine.ts` házi konvenciója (HIGH 65 / LOW 35, szigorú
// összehasonlítással): a középsáv SZÁNDÉKOSAN néma — kiegyensúlyozott
// dimenzióról nem állítunk dinamikát.
const HIGH_THRESHOLD = 65;
const LOW_THRESHOLD = 35;

/** A pólus-erősség referenciapontja: az 50-es középérték. */
const MIDPOINT = 50;

export type Polarity = Pole | "medium";
export type DimScores = Partial<Record<TritanDimCode, number>>;

/** Adatforrás-szint — a felület ebből rakja ki a pontosság-jelzést. */
export type InteractionLevel =
  /** két prototípus-pontszám — „típus-szintű becslés" */
  | "archetype"
  /** saját valós pontszám + prototípus — „félig becsült" */
  | "profile-archetype"
  /** két valós, megosztott profil — „profil-alapú becslés" */
  | "profile-profile"
  /** mért pár-adat (team-stats él) — „csapat-mérésből" */
  | "measured";

export type InteractionMode = "peer" | "self-leads" | "other-leads";

export interface InteractionInput {
  /** A kérdező pontszámai (0–100), dimenziókód szerint. */
  self: DimScores;
  /** A másik fél pontszámai — valós profil vagy archetípus-prototípus. */
  other: DimScores;
  /** Vezető-mód: ki a vezető a párban. Alapértelmezés: egyenrangú. */
  mode?: InteractionMode;
  level: InteractionLevel;
  /** Hány atomot válogasson ki. Alapértelmezés 3 (a terv 2–3-at mond). */
  maxAtoms?: number;
  /** Hány vezetői kiegészítő jelenjen meg. Alapértelmezés 2. */
  maxLeaderNotes?: number;
}

export interface InteractionLine {
  /** Melyik atomból jött — visszakövethetőség és forrás-badge. */
  atomId: string;
  /** Az érintett dimenziók (azonos atomnál egy, keresztnél kettő). */
  dims: TritanDimCode[];
  text: LocalizedText;
}

export interface LeaderNote {
  dim: TritanDimCode;
  pole: Pole;
  text: LocalizedText;
}

export interface InteractionResult {
  /** Ami magától megy. */
  easy: InteractionLine[];
  /** Ahol súrlódás várható. */
  friction: InteractionLine[];
  /** Mit beszéljetek meg előre — ez a funkció magja, atomonként kötelező. */
  discuss: InteractionLine[];
  /** Vezető-módban a vezető pólusos dimenzióihoz tartozó kiegészítők. */
  leaderNotes: LeaderNote[];
  meta: {
    level: InteractionLevel;
    mode: InteractionMode;
    /** A felhasznált atomok, markánsság szerint csökkenő sorrendben. */
    atomIds: string[];
    /**
     * Egyetlen atom sem aktiválódott — nincs elég markáns eltérés a két
     * profil között. A felület ezt KÜLÖN üzenettel kezeli, nem üres
     * listaként („ez önmagában jó hír"), ezért explicit jelzés.
     */
    sparse: boolean;
    /** Hány jelölt atom volt a válogatás előtt — diagnosztika. */
    candidateCount: number;
  };
}

// ── Pólus-meghatározás ───────────────────────────────────────────────

export function polarityOf(score: number | undefined | null): Polarity | null {
  if (typeof score !== "number" || !Number.isFinite(score)) return null;
  if (score > HIGH_THRESHOLD) return "high";
  if (score < LOW_THRESHOLD) return "low";
  return "medium";
}

/**
 * Pólus-erősség 0–1 között: mennyire távol esik a középértéktől. A
 * küszöbön álló dimenzió 0,3-et kap, a szélsőséges 1,0 közelit — ettől
 * lesz egy 95 vs 20 pár markánsabb, mint egy 66 vs 34.
 */
function poleStrength(score: number): number {
  return Math.min(1, Math.abs(score - MIDPOINT) / MIDPOINT);
}

/** A pólusos (nem középsávos) dimenziók, a kanonikus sorrendben. */
export function polarSides(scores: DimScores): AtomSide[] {
  const sides: AtomSide[] = [];
  for (const dim of TRITAN_ORDER) {
    const polarity = polarityOf(scores[dim]);
    if (polarity === "high" || polarity === "low") {
      sides.push({ dim, pole: polarity });
    }
  }
  return sides;
}

// ── Jelölt-atomok és markánsság ──────────────────────────────────────

interface Candidate {
  atom: RelationAtom;
  mirrored: boolean;
  dims: TritanDimCode[];
  salience: number;
}

/**
 * Bázis-súly: azonos dimenziónál a dimenzió súrlódás-súlya, keresztnél a
 * két dimenzió súlyának átlaga. Így a THOR/ADAP feszültségek természetesen
 * felülre kerülnek, a kereszt-atomok pedig nem nyomják el az azonos
 * dimenziós párokat pusztán azért, mert két dimenziót érintenek.
 */
function baseWeight(atom: RelationAtom): number {
  const wa = FRICTION_WEIGHTS[atom.a.dim] ?? 0;
  if (atom.kind === "same") return wa;
  const wb = FRICTION_WEIGHTS[atom.b.dim] ?? 0;
  return (wa + wb) / 2;
}

/**
 * Jelöltek gyűjtése: a két fél pólusos dimenzióinak minden párosítására
 * megkérdezzük az atom-indexet. Ez egy menetben lefedi az azonos
 * dimenziós (dim × ugyanaz a dim) és a kereszt-párokat is.
 *
 * Ugyanaz az atom kétszer is előjöhet (ha mindkét fél pólusos MINDKÉT
 * érintett dimenzión) — ilyenkor a markánsabb előfordulás marad, mert az
 * írja le jobban, melyik oldalról erős a dinamika.
 */
function collectCandidates(self: DimScores, other: DimScores): Candidate[] {
  const selfSides = polarSides(self);
  const otherSides = polarSides(other);
  const byAtomId = new Map<string, Candidate>();

  for (const mine of selfSides) {
    const myStrength = poleStrength(self[mine.dim] as number);
    for (const theirs of otherSides) {
      const found = findAtom(mine, theirs);
      if (!found) continue;
      const theirStrength = poleStrength(other[theirs.dim] as number);
      // A pár annyira markáns, amennyire a GYENGÉBB oldala — egy alig
      // pólusos fél nem tesz erőssé egy dinamikát.
      const strength = Math.min(myStrength, theirStrength);
      const dims: TritanDimCode[] =
        found.atom.kind === "same"
          ? [found.atom.a.dim]
          : [found.atom.a.dim, found.atom.b.dim];

      const candidate: Candidate = {
        atom: found.atom,
        mirrored: found.mirrored,
        dims,
        salience: baseWeight(found.atom) * strength,
      };
      const existing = byAtomId.get(found.atom.id);
      if (!existing || candidate.salience > existing.salience) {
        byAtomId.set(found.atom.id, candidate);
      }
    }
  }

  return [...byAtomId.values()];
}

/**
 * Válogatás: markánsság szerint csökkenően, de egy atom csak akkor kerül
 * be, ha ÚJ dimenziót hoz — különben három egymás alatti THOR-szöveget
 * kapna a felhasználó. Azonos markánsságnál az atom-ID dönt, hogy a
 * kimenet determinisztikus legyen.
 */
function selectAtoms(candidates: Candidate[], maxAtoms: number): Candidate[] {
  const sorted = [...candidates].sort(
    (a, b) => b.salience - a.salience || a.atom.id.localeCompare(b.atom.id),
  );
  const usedDims = new Set<TritanDimCode>();
  const picked: Candidate[] = [];

  for (const candidate of sorted) {
    if (picked.length >= maxAtoms) break;
    if (candidate.dims.every((dim) => usedDims.has(dim))) continue;
    picked.push(candidate);
    for (const dim of candidate.dims) usedDims.add(dim);
  }

  return picked;
}

// ── Vezetői kiegészítők ──────────────────────────────────────────────

function leaderNotesFor(
  scores: DimScores,
  maxLeaderNotes: number,
): LeaderNote[] {
  return polarSides(scores)
    .map((side) => ({
      dim: side.dim,
      pole: side.pole,
      text: LEADER_SUPPLEMENTS[side.dim][side.pole],
      weight: FRICTION_WEIGHTS[side.dim] ?? 0,
    }))
    .sort((a, b) => b.weight - a.weight || a.dim.localeCompare(b.dim))
    .slice(0, maxLeaderNotes)
    .map(({ dim, pole, text }) => ({ dim, pole, text }));
}

// ── Belépési pont ────────────────────────────────────────────────────

export function simulateInteraction(
  input: InteractionInput,
): InteractionResult {
  const mode = input.mode ?? "peer";
  const maxAtoms = input.maxAtoms ?? 3;
  const maxLeaderNotes = input.maxLeaderNotes ?? 2;

  const candidates = collectCandidates(input.self, input.other);
  const picked = selectAtoms(candidates, maxAtoms);

  const easy: InteractionLine[] = [];
  const friction: InteractionLine[] = [];
  const discuss: InteractionLine[] = [];

  for (const candidate of picked) {
    const blocks = atomBlocksFor(candidate.atom, candidate.mirrored);
    const line = (text: LocalizedText): InteractionLine => ({
      atomId: candidate.atom.id,
      dims: candidate.dims,
      text,
    });
    if (blocks.easy) easy.push(line(blocks.easy));
    if (blocks.friction) friction.push(line(blocks.friction));
    discuss.push(line(blocks.discuss));
  }

  const leaderScores =
    mode === "self-leads" ? input.self : mode === "other-leads" ? input.other : null;

  return {
    easy,
    friction,
    discuss,
    leaderNotes: leaderScores ? leaderNotesFor(leaderScores, maxLeaderNotes) : [],
    meta: {
      level: input.level,
      mode,
      atomIds: picked.map((candidate) => candidate.atom.id),
      sparse: picked.length === 0,
      candidateCount: candidates.length,
    },
  };
}

// ── Archetípus-prototípusok ──────────────────────────────────────────
//
// A 30 archetípus (domináns × második dimenzió) szimulációjához kell egy
// pontszám-vektor. SZÁRMAZTATOTT, nem kézzel írt tábla: a domináns 86, a
// második 74, a maradék négy 50.
//
// Következmény, amit a felületen KI KELL ÍRNI: a maradék négy dimenzió a
// középsávban marad, tehát soha nem aktivál atomot. Ez helyes — egy
// típuscímke tényleg nem mond semmit a másik négy dimenzióról —, de
// enélkül a „típus-szintű becslés" jelölés üres udvariasságnak tűnne.

export const ARCHETYPE_DOMINANT_SCORE = 86;
export const ARCHETYPE_SECONDARY_SCORE = 74;
export const ARCHETYPE_NEUTRAL_SCORE = 50;

export interface ArchetypePair {
  dominant: TritanDimCode;
  secondary: TritanDimCode;
}

export function archetypePrototype(pair: ArchetypePair): DimScores {
  const scores: DimScores = {};
  for (const dim of TRITAN_ORDER) scores[dim] = ARCHETYPE_NEUTRAL_SCORE;
  scores[pair.dominant] = ARCHETYPE_DOMINANT_SCORE;
  scores[pair.secondary] = ARCHETYPE_SECONDARY_SCORE;
  return scores;
}

/** Mind a 30 archetípus-pár, a kanonikus dimenzió-sorrendben. */
export const ARCHETYPE_PAIRS: ArchetypePair[] = TRITAN_ORDER.flatMap(
  (dominant) =>
    TRITAN_ORDER.filter((secondary) => secondary !== dominant).map(
      (secondary) => ({ dominant, secondary }),
    ),
);

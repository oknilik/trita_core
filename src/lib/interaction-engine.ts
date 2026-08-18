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
  PROFILE_HIGH_THRESHOLD,
  PROFILE_LOW_THRESHOLD,
} from "@/lib/profile-engine";
import {
  GAP_ATOMS,
  LEADER_SUPPLEMENTS,
  atomBlocksFor,
  findAtom,
  type AtomBlocks,
  type AtomSide,
  type LocalizedText,
  type Pole,
  type RelationAtom,
} from "@/lib/interaction-atoms";
import { DIFF_MIN_GAP } from "@/lib/personality-type";
import {
  HEXACO_DIMENSION_FACETS,
  HEXACO_ORDER,
  type HexacoCode,
} from "@/lib/hexaco";

// ── Pólus-küszöbök ───────────────────────────────────────────────────
// A `profile-engine.ts` házi konvenciója (szigorú összehasonlítással):
// a középsáv SZÁNDÉKOSAN néma — kiegyensúlyozott dimenzióról nem
// állítunk dinamikát.
const HIGH_THRESHOLD = PROFILE_HIGH_THRESHOLD;
const LOW_THRESHOLD = PROFILE_LOW_THRESHOLD;

/** A pólus-erősség referenciapontja: az 50-es középérték. */
const MIDPOINT = 50;

/**
 * Hány szöveges dinamika-sor jelenhet meg egy páron.
 *
 * A rés-alapú réteg (2026-08-18) előtt ez a plafon SOHA nem telt be valós
 * profilokon — a mérés szerint átlagosan 1,06 atom aktiválódott a 3-as
 * keret mellett, tehát a korlát inert volt. Utána már köt, ezért 4:
 * a három blokk (megy magától · súrlódás · beszéljétek meg) még
 * végigolvasható, a szélesebb lefedettséget pedig a hat dimenziós
 * összevetés-sáv viszi, nem a próza hossza.
 */
export const DEFAULT_MAX_ATOMS = 4;

export type Polarity = Pole | "medium";
export type DimScores = Partial<Record<HexacoCode, number>>;

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
  /**
   * Facet-bontás a két félről (dimenziókód → facetkód → 0–100). Csak a
   * facet-nüanszhoz (L4) kell; hiányában az a réteg némán kimarad —
   * örökség-eredményben nincs facet-bontás, és koholt értéket nem gyártunk.
   */
  selfFacets?: FacetScores;
  otherFacets?: FacetScores;
  /**
   * Facet-szintű különbség-küszöb (√2 · facet-SEM, kerekítve). A HÍVÓ
   * számolja a kérdőív-formából (`facetStandardError`) és adja át — a motor
   * szándékosan nem húzza be a psychometrics modult (az a teljes
   * kérdésbankot importálja). Hiányában a facet-réteg kimarad.
   */
  facetMinGap?: number;
}

export interface InteractionLine {
  /** Melyik atomból jött — visszakövethetőség és forrás-badge. */
  atomId: string;
  /** Az érintett dimenziók (azonos atomnál egy, keresztnél kettő). */
  dims: HexacoCode[];
  /**
   * Milyen bizonyítékon áll a sor:
   *  · `pole` — MINDKÉT fél a szélső sávban (>65 / <35): markáns dinamika;
   *  · `gap`  — a két pontszám különbsége meghaladja a mérési hibát, de
   *    egyik fél sem szélsőséges: mérhető, de halkabb állítás.
   * A felület ezt jelöli — a becsült/mért megkülönböztetés a termék
   * hitelességi alapelve (CLAUDE.md).
   */
  basis: EvidenceBasis;
  text: LocalizedText;
}

export type EvidenceBasis = "pole" | "gap";

/** Facet-bontás: dimenziókód → facetkód → 0–100. */
export type FacetScores = Record<string, Record<string, number>>;

/**
 * Egy dimenzió összevetése a két fél között — ez a réteg MINDIG mind a hat
 * dimenzióról nyilatkozik (amennyiben mindkét oldalon mért), függetlenül
 * attól, hogy született-e róla szöveges atom.
 *
 * SZÁNDÉKOSAN NEM HORDOZ PONTSZÁMOT. A pár-nézet adatvédelmi határa az,
 * hogy a partner nyers értékei nem hagyják el a szervert; a `higher` mező
 * dimenziónként egyetlen bit (ki a magasabb), ami a beszélgetés-indításhoz
 * elég, a profil visszafejtéséhez nem.
 */
export interface DimensionComparison {
  dim: HexacoCode;
  /**
   * `differs` — a különbség eléri a dimenzió-szintű mérési hibát
   * (`DIFF_MIN_GAP` = √2·SEM); `aligned` — a különbség ez alatt van, tehát
   * a két pontszám a mérés felbontásán belül egyezőnek tekintendő.
   */
  state: "aligned" | "differs";
  /** Csak `differs` esetén: melyik oldal a magasabb. */
  higher: "self" | "other" | null;
}

/**
 * Facet-nüansz: dimenzió-szinten EGYEZTEK, de az egyik alskálán mérhető a
 * különbség — „ugyanaz a címke, más működés". Ez a legbizonytalanabb réteg
 * (a rövid formán 2–3 item visz egy facetet), ezért dimenziónként legfeljebb
 * egy, összesen legfeljebb `MAX_FACET_NUANCES` darab.
 */
export interface FacetNuance {
  dim: HexacoCode;
  /** Facet-kód (pl. "organization") — a címkét a nézet-réteg oldja fel. */
  facet: string;
  /** Melyik oldalon hangsúlyosabb ez az alskála. */
  higher: "self" | "other";
}

export interface LeaderNote {
  dim: HexacoCode;
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
  /**
   * Mind a hat (mindkét oldalon mért) dimenzió összevetése, a kanonikus
   * HEXACO-sorrendben. Üres, ha a szint nem két valós profilt hasonlít
   * össze — archetípus-prototípus ellen ez a réteg kitalált adatot
   * állítana.
   */
  dimensions: DimensionComparison[];
  /** Facet-szintű nüanszok (L4). Üres, ha nincs facet-adat vagy küszöb. */
  facetNuances: FacetNuance[];
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
    /** Hány kiválasztott sor áll rés-alapon (a többi pólusos). */
    gapLineCount: number;
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
  for (const dim of HEXACO_ORDER) {
    const polarity = polarityOf(scores[dim]);
    if (polarity === "high" || polarity === "low") {
      sides.push({ dim, pole: polarity });
    }
  }
  return sides;
}

// ── Jelölt-atomok és markánsság ──────────────────────────────────────

interface Candidate {
  /** Atom-azonosító: a determinisztikus holtverseny-döntés kulcsa is. */
  id: string;
  basis: EvidenceBasis;
  dims: HexacoCode[];
  salience: number;
  /** A KÉRDEZŐ nézőpontjára már feloldott szöveg-blokkok. */
  blocks: AtomBlocks;
}

/**
 * Bázis-súly: azonos dimenziónál a dimenzió súrlódás-súlya, keresztnél a
 * két dimenzió súlyának átlaga. Így a C/A feszültségek természetesen
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
      const dims: HexacoCode[] =
        found.atom.kind === "same"
          ? [found.atom.a.dim]
          : [found.atom.a.dim, found.atom.b.dim];

      const candidate: Candidate = {
        id: found.atom.id,
        basis: "pole",
        dims,
        salience: baseWeight(found.atom) * strength,
        blocks: atomBlocksFor(found.atom, found.mirrored),
      };
      const existing = byAtomId.get(found.atom.id);
      if (!existing || candidate.salience > existing.salience) {
        byAtomId.set(found.atom.id, candidate);
      }
    }
  }

  return [...byAtomId.values()];
}

// ── Rés-alapú jelöltek ───────────────────────────────────────────────
//
// A pólus-kapu MINDKÉT féltől szélső értéket vár, ezért egy 62 vs 38 pár
// (24 pont, a mérési hiba több mint kétszerese) néma marad. Ez a réteg a
// KÜLÖNBSÉGRE aktivál — ugyanarra a modellre, amin a `friction-model.ts`
// súrlódás-számítása és a csapat-nézet dinamika-élei már állnak.
//
// Mérés a bevezetés előtti állapotról:
// docs/audits/interaction-pair-coverage-2026-08-18.md

/**
 * A rés-alapú bizonyíték GYENGÉBB a pólusosnál: azonos nyers erősségnél a
 * pólus-atom kerül előre. Enélkül egy nagy, de középsávos rés kiszoríthatná
 * a valóban markáns, kétoldali pólus-dinamikát.
 */
const GAP_SALIENCE_DISCOUNT = 0.8;

/**
 * Rés-erősség 0–1 között, SZÁNDÉKOSAN ugyanazon a skálán, mint a
 * `poleStrength`: ott a középértéktől mért távolság a maximális 50-hez, itt
 * a két pontszám távolsága a maximális 100-hoz viszonyul. Egy 80 vs 20 pár
 * így mindkét mérőszámon 0,6-ot kap, és a rangsort a diszkont dönti el — nem
 * a két skála véletlen meredeksége.
 */
function gapStrength(delta: number): number {
  return Math.min(1, Math.abs(delta) / 100);
}

/**
 * Rés-jelöltek: minden olyan dimenzió, ahol MINDKÉT oldalon van mért érték,
 * és a különbség eléri a dimenzió-szintű mérési hibát (`DIFF_MIN_GAP`).
 * A szöveg iránya a relatív helyzetből jön — a magasabb pontszámú fél
 * olvassa a `view`-t, az alacsonyabb a `viewB`-t.
 *
 * KIZÁRÁS: ha ugyanarra a dimenzióra AZONOS DIMENZIÓS pólus-atom is
 * aktiválódott, a rés-jelölt elmarad. A pólus-atom ugyanarról a dimenzióról
 * beszél, csak erősebb bizonyítékon és konkrétabb szöveggel — a kettő közül
 * a válogatás úgyis egyet engedne be, de a döntést nem bízzuk két, eltérő
 * meredekségű erősség-skála összemérésére. A KERESZT-atom nem zár ki: az a
 * dimenziót egy másikkal való viszonyában tárgyalja, nem önmagában.
 */
function collectGapCandidates(
  self: DimScores,
  other: DimScores,
  poleCandidates: Candidate[],
): Candidate[] {
  const coveredBySameDimAtom = new Set(
    poleCandidates.filter((c) => c.dims.length === 1).map((c) => c.dims[0]),
  );
  const candidates: Candidate[] = [];
  for (const dim of HEXACO_ORDER) {
    if (coveredBySameDimAtom.has(dim)) continue;
    const mine = self[dim];
    const theirs = other[dim];
    if (typeof mine !== "number" || typeof theirs !== "number") continue;
    const delta = mine - theirs;
    if (Math.abs(delta) < DIFF_MIN_GAP) continue;
    const atom = GAP_ATOMS[dim];
    candidates.push({
      id: atom.id,
      basis: "gap",
      dims: [dim],
      salience:
        (FRICTION_WEIGHTS[dim] ?? 0) * gapStrength(delta) * GAP_SALIENCE_DISCOUNT,
      blocks: delta > 0 ? atom.view : atom.viewB,
    });
  }
  return candidates;
}

/**
 * Válogatás: markánsság szerint csökkenően, de egy atom csak akkor kerül
 * be, ha ÚJ dimenziót hoz — különben három egymás alatti C-szöveget
 * kapna a felhasználó. Ez zárja ki azt is, hogy ugyanarról a dimenzióról
 * egy pólus- ÉS egy rés-sor is megszólaljon. Azonos markánsságnál az
 * atom-ID dönt, hogy a kimenet determinisztikus legyen.
 */
function selectAtoms(candidates: Candidate[], maxAtoms: number): Candidate[] {
  const sorted = [...candidates].sort(
    (a, b) => b.salience - a.salience || a.id.localeCompare(b.id),
  );
  const usedDims = new Set<HexacoCode>();
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

// ── Hat dimenziós összevetés ─────────────────────────────────────────

/**
 * Két VALÓS profil szintjei — ezeken a szinteken a másik oldal mért adat,
 * tehát a különbség-alapú rétegek (rés-atomok, dimenzió-összevetés,
 * facet-nüansz) értelmezhetők. Archetípus-prototípus ellen NEM: ott a
 * „másik" négy dimenziója szerkezetileg 50, a rés a kitalált középértékhez
 * mérődne.
 */
function isRealPair(level: InteractionLevel): boolean {
  return level === "profile-profile" || level === "measured";
}

/**
 * Minden (mindkét oldalon mért) dimenzió összevetése, kanonikus
 * HEXACO-sorrendben — ugyanabban, amiben a radar és a dimenzió-akkordeon
 * is fut, hogy a felhasználó felismerje a sorrendet.
 */
function compareDimensions(
  self: DimScores,
  other: DimScores,
): DimensionComparison[] {
  const rows: DimensionComparison[] = [];
  for (const dim of HEXACO_ORDER) {
    const mine = self[dim];
    const theirs = other[dim];
    if (typeof mine !== "number" || typeof theirs !== "number") continue;
    const delta = mine - theirs;
    if (Math.abs(delta) < DIFF_MIN_GAP) {
      rows.push({ dim, state: "aligned", higher: null });
      continue;
    }
    rows.push({ dim, state: "differs", higher: delta > 0 ? "self" : "other" });
  }
  return rows;
}

// ── Facet-nüansz ─────────────────────────────────────────────────────
//
// „Ugyanaz a címke, más működés": ahol a két profil DIMENZIÓ-szinten
// egyezik, ott is elválhat, MELYIK alskála viszi az eredményt. Ez az a
// kérdés, amit a dimenzió-szint nem tud megválaszolni — miért súrlódik
// két, papíron egyforma ember.
//
// Miért ilyen szűk a réteg: a rövid formán 2–3 item visz egy facetet, így
// a facet-szintű különbség-küszöb ~17 pont, és 24 facet egyidejű vizsgálata
// többszörös-összehasonlítási problémát is jelent. Ezért CSAK egyező
// dimenzióban nézünk, dimenziónként a LEGNAGYOBB rést vesszük, és a teljes
// kimenetet két sorra korlátozzuk.

/** Legfeljebb ennyi facet-nüansz jelenhet meg egy páron. */
export const MAX_FACET_NUANCES = 2;

function collectFacetNuances(
  dimensions: DimensionComparison[],
  selfFacets: FacetScores,
  otherFacets: FacetScores,
  facetMinGap: number,
): FacetNuance[] {
  const found: Array<FacetNuance & { delta: number; weight: number }> = [];

  for (const row of dimensions) {
    if (row.state !== "aligned") continue;
    const mine = selfFacets[row.dim];
    const theirs = otherFacets[row.dim];
    if (!mine || !theirs) continue;

    let best: { facet: string; delta: number } | null = null;
    for (const facet of HEXACO_DIMENSION_FACETS[row.dim]) {
      const a = mine[facet];
      const b = theirs[facet];
      if (typeof a !== "number" || typeof b !== "number") continue;
      const delta = a - b;
      // Holtversenynél a kanonikus facet-sorrend dönt (szigorú >), hogy a
      // kimenet determinisztikus legyen.
      if (!best || Math.abs(delta) > Math.abs(best.delta)) {
        best = { facet, delta };
      }
    }
    if (!best || Math.abs(best.delta) < facetMinGap) continue;

    found.push({
      dim: row.dim,
      facet: best.facet,
      higher: best.delta > 0 ? "self" : "other",
      delta: Math.abs(best.delta),
      weight: FRICTION_WEIGHTS[row.dim] ?? 0,
    });
  }

  return found
    .sort((a, b) => b.delta - a.delta || b.weight - a.weight || a.dim.localeCompare(b.dim))
    .slice(0, MAX_FACET_NUANCES)
    .map(({ dim, facet, higher }) => ({ dim, facet, higher }));
}

// ── Belépési pont ────────────────────────────────────────────────────

export function simulateInteraction(
  input: InteractionInput,
): InteractionResult {
  const mode = input.mode ?? "peer";
  const maxAtoms = input.maxAtoms ?? DEFAULT_MAX_ATOMS;
  const maxLeaderNotes = input.maxLeaderNotes ?? 2;
  const realPair = isRealPair(input.level);

  const poleCandidates = collectCandidates(input.self, input.other);
  const candidates = [
    ...poleCandidates,
    ...(realPair
      ? collectGapCandidates(input.self, input.other, poleCandidates)
      : []),
  ];
  const picked = selectAtoms(candidates, maxAtoms);

  const easy: InteractionLine[] = [];
  const friction: InteractionLine[] = [];
  const discuss: InteractionLine[] = [];

  for (const candidate of picked) {
    const line = (text: LocalizedText): InteractionLine => ({
      atomId: candidate.id,
      dims: candidate.dims,
      basis: candidate.basis,
      text,
    });
    if (candidate.blocks.easy) easy.push(line(candidate.blocks.easy));
    if (candidate.blocks.friction) friction.push(line(candidate.blocks.friction));
    discuss.push(line(candidate.blocks.discuss));
  }

  const leaderScores =
    mode === "self-leads" ? input.self : mode === "other-leads" ? input.other : null;

  const dimensions = realPair ? compareDimensions(input.self, input.other) : [];
  const facetNuances =
    realPair && input.selfFacets && input.otherFacets && input.facetMinGap
      ? collectFacetNuances(
          dimensions,
          input.selfFacets,
          input.otherFacets,
          input.facetMinGap,
        )
      : [];

  return {
    easy,
    friction,
    discuss,
    leaderNotes: leaderScores ? leaderNotesFor(leaderScores, maxLeaderNotes) : [],
    dimensions,
    facetNuances,
    meta: {
      level: input.level,
      mode,
      atomIds: picked.map((candidate) => candidate.id),
      sparse: picked.length === 0,
      candidateCount: candidates.length,
      gapLineCount: picked.filter((candidate) => candidate.basis === "gap").length,
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
  dominant: HexacoCode;
  secondary: HexacoCode;
}

export function archetypePrototype(pair: ArchetypePair): DimScores {
  const scores: DimScores = {};
  for (const dim of HEXACO_ORDER) scores[dim] = ARCHETYPE_NEUTRAL_SCORE;
  scores[pair.dominant] = ARCHETYPE_DOMINANT_SCORE;
  scores[pair.secondary] = ARCHETYPE_SECONDARY_SCORE;
  return scores;
}

/** Mind a 30 archetípus-pár, a kanonikus dimenzió-sorrendben. */
export const ARCHETYPE_PAIRS: ArchetypePair[] = HEXACO_ORDER.flatMap(
  (dominant) =>
    HEXACO_ORDER.filter((secondary) => secondary !== dominant).map(
      (secondary) => ({ dominant, secondary }),
    ),
);

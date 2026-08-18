// ─────────────────────────────────────────────────────────────────────
// Interakció-szimuláció F3 — nézet-modell építő.
//
// A motor (`interaction-engine.ts`) locale-független, kétnyelvű szöveget ad
// vissza. Ez a réteg a SZERVEREN fut le mind a 30 archetípusra, és csak a
// kért nyelvet szerializálja — így az archetípus-váltás a felületen azonnali
// (nulla hálózat), és a ~1000 soros atom-tartalom nem kerül a kliens
// bundle-be.
//
// Terv: docs/product/riport-interakcio-szimulacio-terv.md
// ─────────────────────────────────────────────────────────────────────

import type { Locale } from "@/lib/i18n";
import { resolvePersonalityTypeLabel } from "@/lib/personality-type";
import {
  HEXACO_DIMENSIONS,
  HEXACO_FACETS,
  type HexacoCode,
} from "@/lib/hexaco";
import {
  ARCHETYPE_PAIRS,
  archetypePrototype,
  simulateInteraction,
  type DimScores,
  type EvidenceBasis,
  type FacetScores,
  type InteractionResult,
} from "@/lib/interaction-engine";

export interface InteractionTextLine {
  /** Melyik atomból jött — visszakövethetőség, teszt, forrás-badge. */
  atomId: string;
  /** Az érintett dimenziók HEXACO-címkéi, a megjelenítéshez. */
  dimLabels: string[];
  /** `pole` = mindkét fél szélső sávban · `gap` = mérhető, de halkabb. */
  basis: EvidenceBasis;
  text: string;
}

/**
 * Egy dimenzió sora a hat dimenziós összevetés-sávban.
 *
 * PONTSZÁMOT SZÁNDÉKOSAN NEM HORDOZ: a pár-nézet adatvédelmi határa, hogy a
 * partner nyers értékei nem hagyják el a szervert. A `higher` dimenziónként
 * egyetlen bit — a beszélgetés-indításhoz elég, a profil visszafejtéséhez
 * nem.
 */
export interface PairDimensionView {
  dim: HexacoCode;
  dimLabel: string;
  state: "aligned" | "differs";
  higher: "self" | "other" | null;
}

/** Egy facet-nüansz sora — szintén pontszám nélkül. */
export interface PairFacetNuanceView {
  dim: HexacoCode;
  dimLabel: string;
  facet: string;
  facetLabel: string;
  higher: "self" | "other";
}

export interface InteractionLeaderNote {
  dim: HexacoCode;
  dimLabel: string;
  text: string;
}

export interface ArchetypeSimulationView {
  /** Stabil kulcs a kiválasztáshoz: "O-X". */
  key: string;
  dominant: HexacoCode;
  secondary: HexacoCode;
  /** „Energikus újító" — a választó címkéje. */
  label: string;
  easy: InteractionTextLine[];
  friction: InteractionTextLine[];
  discuss: InteractionTextLine[];
  /**
   * A vezető-irány kapcsolóhoz, mindkét irányra előre kiszámolva — a
   * felület hálózat nélkül vált, ahogy a valódi páros nézetben is.
   * Vezetői kiegészítők, ha ÉN vezetek (a nézőpont-tulajdonos).
   */
  leaderNotesSelf: InteractionLeaderNote[];
  /** Vezetői kiegészítők, ha a KARAKTER vezet. */
  leaderNotesOther: InteractionLeaderNote[];
  /** Nincs elég markáns eltérés — a felület külön üzenetet ad. */
  sparse: boolean;
}

export function archetypeKey(
  dominant: HexacoCode,
  secondary: HexacoCode,
): string {
  return `${dominant}-${secondary}`;
}

function dimLabel(dim: HexacoCode, locale: Locale): string {
  const dimension = HEXACO_DIMENSIONS[dim];
  return locale === "hu" ? dimension.hu : dimension.en;
}

type EngineLines = ReturnType<typeof simulateInteraction>["easy"];
type EngineLeaderNotes = ReturnType<typeof simulateInteraction>["leaderNotes"];

function serializeLines(lines: EngineLines, locale: Locale): InteractionTextLine[] {
  return lines.map((line) => ({
    atomId: line.atomId,
    dimLabels: line.dims.map((dim) => dimLabel(dim, locale)),
    basis: line.basis,
    text: line.text[locale],
  }));
}

function serializeDimensions(
  rows: InteractionResult["dimensions"],
  locale: Locale,
): PairDimensionView[] {
  return rows.map((row) => ({
    dim: row.dim,
    dimLabel: dimLabel(row.dim, locale),
    state: row.state,
    higher: row.higher,
  }));
}

function serializeFacetNuances(
  rows: InteractionResult["facetNuances"],
  locale: Locale,
): PairFacetNuanceView[] {
  return rows.flatMap((row) => {
    // A facet-címke KANONIKUS forrása a HEXACO_FACETS térkép; ismeretlen
    // kódra inkább kihagyjuk a sort, mint hogy nyers kód kerüljön ki.
    const label = HEXACO_FACETS[row.facet]?.[locale];
    if (!label) return [];
    return [
      {
        dim: row.dim,
        dimLabel: dimLabel(row.dim, locale),
        facet: row.facet,
        facetLabel: label,
        higher: row.higher,
      },
    ];
  });
}

function serializeLeaderNotes(
  notes: EngineLeaderNotes,
  locale: Locale,
): InteractionLeaderNote[] {
  return notes.map((note) => ({
    dim: note.dim,
    dimLabel: dimLabel(note.dim, locale),
    text: note.text[locale],
  }));
}

// ── Valódi páros mód (B1) ────────────────────────────────────────────

export interface PairSimulationView {
  easy: InteractionTextLine[];
  friction: InteractionTextLine[];
  discuss: InteractionTextLine[];
  /** Vezetői kiegészítők, ha ÉN vezetek (a nézőpont-tulajdonos). */
  leaderNotesSelf: InteractionLeaderNote[];
  /** Vezetői kiegészítők, ha a MÁSIK fél vezet. */
  leaderNotesOther: InteractionLeaderNote[];
  /**
   * Mind a hat dimenzió összevetése — ez a réteg akkor is nyilatkozik, ha
   * szöveges atom nem született róla („megnéztük mind a hatot").
   */
  dimensions: PairDimensionView[];
  /** Facet-szintű nüanszok — üres, ha nincs facet-adat vagy küszöb. */
  facetNuances: PairFacetNuanceView[];
  sparse: boolean;
}

export interface PairSimulationOptions {
  /** Facet-bontás a két félről — hiányában a nüansz-réteg kimarad. */
  selfFacets?: FacetScores | null;
  otherFacets?: FacetScores | null;
  /**
   * Facet-szintű különbség-küszöb (√2 · facet-SEM, kerekítve). A HÍVÓ
   * számolja a kérdőív-formából — a motor nem húzza be a psychometrics
   * modult (az a teljes kérdésbankot importálná).
   */
  facetMinGap?: number | null;
}

/**
 * Két VALÓDI, megosztott profil szimulációja (`level: "profile-profile"`).
 * Az atom-válogatást a mode nem érinti (csak a vezetői kiegészítőket),
 * ezért a blokkok az első futásból jönnek, és mindkét vezető-irány
 * kiegészítőit kiszámoljuk — a felület kapcsolója így hálózat nélkül vált.
 *
 * A dimenzió-összevetés és a facet-nüansz a mode-tól FÜGGETLEN (a két
 * profil viszonya nem változik attól, ki vezet), ezért egyszer, az első
 * futásból szerializálódik.
 */
export function buildPairSimulation(
  selfScores: DimScores,
  otherScores: DimScores,
  locale: Locale,
  options: PairSimulationOptions = {},
): PairSimulationView {
  const facetInput = {
    selfFacets: options.selfFacets ?? undefined,
    otherFacets: options.otherFacets ?? undefined,
    facetMinGap: options.facetMinGap ?? undefined,
  };
  const otherLeads = simulateInteraction({
    self: selfScores,
    other: otherScores,
    mode: "other-leads",
    level: "profile-profile",
    ...facetInput,
  });
  const selfLeads = simulateInteraction({
    self: selfScores,
    other: otherScores,
    mode: "self-leads",
    level: "profile-profile",
  });

  return {
    easy: serializeLines(otherLeads.easy, locale),
    friction: serializeLines(otherLeads.friction, locale),
    discuss: serializeLines(otherLeads.discuss, locale),
    leaderNotesSelf: serializeLeaderNotes(selfLeads.leaderNotes, locale),
    leaderNotesOther: serializeLeaderNotes(otherLeads.leaderNotes, locale),
    dimensions: serializeDimensions(otherLeads.dimensions, locale),
    facetNuances: serializeFacetNuances(otherLeads.facetNuances, locale),
    sparse: otherLeads.meta.sparse,
  };
}

/**
 * Mind a 30 archetípus szimulációja a megadott profilhoz, egy nyelven.
 *
 * Az atom-válogatást a mode nem érinti (csak a vezetői kiegészítőket), ezért
 * a blokkok az `other-leads` futásból jönnek, és — a valódi páros nézettel
 * azonos módon — mindkét vezető-irány kiegészítőit kiszámoljuk, hogy a
 * kapcsoló ott se járjon hálózattal. (A self-irány jegyzetei csak a saját
 * profiltól függnek, tehát mind a 30 archetípusra ugyanazok; a második futás
 * a szimmetria és az olvashatóság kedvéért marad archetípusonként.)
 */
export function buildArchetypeSimulations(
  selfScores: DimScores,
  locale: Locale,
): ArchetypeSimulationView[] {
  return ARCHETYPE_PAIRS.map((pair) => {
    const prototype = archetypePrototype(pair);
    const otherLeads = simulateInteraction({
      self: selfScores,
      other: prototype,
      mode: "other-leads",
      level: "profile-archetype",
    });
    const selfLeads = simulateInteraction({
      self: selfScores,
      other: prototype,
      mode: "self-leads",
      level: "profile-archetype",
    });

    return {
      key: archetypeKey(pair.dominant, pair.secondary),
      dominant: pair.dominant,
      secondary: pair.secondary,
      label:
        resolvePersonalityTypeLabel(pair.dominant, pair.secondary, locale) ??
        dimLabel(pair.dominant, locale),
      easy: serializeLines(otherLeads.easy, locale),
      friction: serializeLines(otherLeads.friction, locale),
      discuss: serializeLines(otherLeads.discuss, locale),
      leaderNotesSelf: serializeLeaderNotes(selfLeads.leaderNotes, locale),
      leaderNotesOther: serializeLeaderNotes(otherLeads.leaderNotes, locale),
      sparse: otherLeads.meta.sparse,
    };
  });
}

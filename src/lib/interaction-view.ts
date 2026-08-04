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
import { TRITAN_DIMENSIONS, type TritanDimCode } from "@/lib/tritan";
import {
  ARCHETYPE_PAIRS,
  archetypePrototype,
  simulateInteraction,
  type DimScores,
} from "@/lib/interaction-engine";

export interface InteractionTextLine {
  /** Melyik atomból jött — visszakövethetőség, teszt, forrás-badge. */
  atomId: string;
  /** Az érintett dimenziók HEXACO-címkéi, a megjelenítéshez. */
  dimLabels: string[];
  text: string;
}

export interface InteractionLeaderNote {
  dim: TritanDimCode;
  dimLabel: string;
  text: string;
}

export interface ArchetypeSimulationView {
  /** Stabil kulcs a kiválasztáshoz: "OPEN-TEMP". */
  key: string;
  dominant: TritanDimCode;
  secondary: TritanDimCode;
  /** „Energikus újító" — a választó címkéje. */
  label: string;
  easy: InteractionTextLine[];
  friction: InteractionTextLine[];
  discuss: InteractionTextLine[];
  /**
   * A vezető-mód kapcsolóhoz. Mindig kiszámoljuk (ugyanaz a futás adja),
   * a felület dönti el, mikor mutatja — így a kapcsoló sem jár hálózattal.
   */
  leaderNotes: InteractionLeaderNote[];
  /** Nincs elég markáns eltérés — a felület külön üzenetet ad. */
  sparse: boolean;
}

export function archetypeKey(
  dominant: TritanDimCode,
  secondary: TritanDimCode,
): string {
  return `${dominant}-${secondary}`;
}

function dimLabel(dim: TritanDimCode, locale: Locale): string {
  const dimension = TRITAN_DIMENSIONS[dim];
  return locale === "hu" ? dimension.hu : dimension.en;
}

/**
 * Mind a 30 archetípus szimulációja a megadott profilhoz, egy nyelven.
 *
 * A `mode: "other-leads"` azért fix, mert így egyetlen futásból megvan az
 * atom-válogatás ÉS a vezetői kiegészítő is; a felület a kapcsolóval csak
 * mutatja vagy elrejti az utóbbit.
 */
export function buildArchetypeSimulations(
  selfScores: DimScores,
  locale: Locale,
): ArchetypeSimulationView[] {
  return ARCHETYPE_PAIRS.map((pair) => {
    const result = simulateInteraction({
      self: selfScores,
      other: archetypePrototype(pair),
      mode: "other-leads",
      level: "profile-archetype",
    });

    const toLines = (
      lines: typeof result.easy,
    ): InteractionTextLine[] =>
      lines.map((line) => ({
        atomId: line.atomId,
        dimLabels: line.dims.map((dim) => dimLabel(dim, locale)),
        text: line.text[locale],
      }));

    return {
      key: archetypeKey(pair.dominant, pair.secondary),
      dominant: pair.dominant,
      secondary: pair.secondary,
      label:
        resolvePersonalityTypeLabel(pair.dominant, pair.secondary, locale) ??
        dimLabel(pair.dominant, locale),
      easy: toLines(result.easy),
      friction: toLines(result.friction),
      discuss: toLines(result.discuss),
      leaderNotes: result.leaderNotes.map((note) => ({
        dim: note.dim,
        dimLabel: dimLabel(note.dim, locale),
        text: note.text[locale],
      })),
      sparse: result.meta.sparse,
    };
  });
}

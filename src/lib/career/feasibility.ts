// Hozzáférés: mi kell ahhoz, hogy valaki BELÉPHESSEN a szerepbe.
//
// Fontos elvi pont: ez NEM illeszkedés. A személyiség-illeszkedés és a
// "megszerezhető-e a belépő" két külön kérdés, ezért külön tengelyen fut, és a
// rangsort nem torzítja — csak jelöli és (opcionálisan) szűri.
//
// A SZINT önmagában nem elég: egy közgazdász diploma nem képesít ápolónak.
// Ezért a szint mellett a SZAKIRÁNYT is nézzük (O*NET CIP-crosszwalkból
// származtatott képzési területek), és a szabályozott szakmákat külön jelöljük.

import type { EduField, EntryLevel, FeasibilityGap } from "./types";

type EduLevel = "primary" | "secondary" | "vocational" | "higher" | "specialized";

const EDU_RANK: Record<EduLevel, number> = {
  primary: 0,
  secondary: 1,
  vocational: 2,
  higher: 3,
  // szakirányú diploma + szakvizsga / kamarai tagság (orvos, jogász, könyvvizsgáló…)
  specialized: 4,
};

const ENTRY_RANK: Record<EntryLevel, number> = {
  open: 0,
  course: 1,
  vocational: 2,
  higher: 3,
  specialized: 4,
};

const GAP_BY_ENTRY: Record<EntryLevel, FeasibilityGap> = {
  open: "ready",
  course: "course",
  vocational: "vocational",
  higher: "degree",
  specialized: "licence",
};

/**
 * A hozzáférés állapota — ezt látja a felhasználó szövegként:
 *  - `field-match`   : a szint ÉS a szakirány is stimmel
 *  - `level-only`    : a szint megvan, de a szakirány más (vagy nem ismert)
 *  - `licence-needed`: szabályozott szakma — szakvizsga / kamarai tagság kell
 *  - `training-needed`: a belépési szint magasabb a mostani végzettségnél
 */
export type AccessState = "field-match" | "level-only" | "licence-needed" | "training-needed";

export interface Feasibility {
  gap: FeasibilityGap;
  /** a VÉGZETTSÉGI SZINT elég-e (a szakirányról külön szól a fieldMatch) */
  ready: boolean;
  /** true/false, ha van szakirány-adat a szerephez és a felhasználó megadta; különben null */
  fieldMatch: boolean | null;
  state: AccessState;
  /**
   * Szabályozott szakma: a belépéshez engedély / kamarai tagság KELL — akkor
   * is, ha a végzettségi szint és a szakirány már megfelel (state="field-match").
   * A `specialized` belépésű szerepekre mindig igaz. Enélkül a UI zöld „elég a
   * végzettséged" chipet mutatna egy engedélyköteles szakmánál.
   */
  licence: boolean;
}

export function feasibilityFor(
  entry: EntryLevel,
  eduLevel: EduLevel | null | undefined,
  userFields?: EduField[] | null,
  occupationFields?: EduField[] | null,
): Feasibility {
  const ready = eduLevel ? EDU_RANK[eduLevel] >= ENTRY_RANK[entry] : entry === "open";

  const hasFieldData = Boolean(occupationFields?.length) && Boolean(userFields?.length);
  const fieldMatch = hasFieldData
    ? (userFields ?? []).some((field) => (occupationFields ?? []).includes(field))
    : null;

  let state: AccessState;
  if (entry === "specialized") {
    // Szabályozott szakma: itt a SZAKIRÁNY nem opció, hanem feltétel. Enélkül
    // hiába van diploma — ezért nem mondhatjuk, hogy „a végzettséged elég".
    state = ready && fieldMatch === true ? "field-match" : "licence-needed";
  } else if (!ready) {
    state = "training-needed";
  } else if (fieldMatch === true) {
    state = "field-match";
  } else {
    state = "level-only";
  }

  // A specialized belépés MINDIG engedély-/kamarai kötelezettséggel jár, akkor
  // is, ha a szint és a szakirány stimmel (state="field-match"). A licenc-jelzés
  // így nem tűnik el a „végzettséged megfelel" esetben sem — a gap és az engine
  // flag is ezt tükrözi.
  const licence = entry === "specialized";

  return {
    gap: ready && !licence ? "ready" : GAP_BY_ENTRY[entry],
    ready,
    fieldMatch,
    state,
    licence,
  };
}

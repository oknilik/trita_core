/**
 * Közös, billentyűzet-only fókuszjelölés világos felületekre.
 *
 * A `focus-visible` miatt egérrel és érintéssel nem jelenik meg. A kétpixeles
 * tokenizált gyűrű és az offset minden krém/kártya felületen olvasható marad.
 */
export const FOCUS_RING_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-surface-canvas";

/** Inverz/sötét felületen a gyűrű körüli rés a háttér színét örökli. */
export const FOCUS_RING_ON_INVERSE_CLASS =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-state-focus-ring focus-visible:ring-offset-2 focus-visible:ring-offset-transparent";

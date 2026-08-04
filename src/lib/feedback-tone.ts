// Tone-nudge (peer feedback F4, könnyű változat): kliens-oldali, halk
// figyelmeztetés, ha a szöveg személy-szintű ítélet felé csúszik
// (Kluger–DeNisi: a self-szintű visszajelzés kontraproduktív). Nem blokkol,
// csak jelez — a döntés a szerzőé marad.

const JUDGMENT_PATTERNS: RegExp[] = [
  /\bmindig\b/i,
  /\bsoha\b/i,
  /\bsosem\b/i,
  /\bilyen vagy\b/i,
  /\bolyan vagy\b/i,
  /\bképtelen\b/i,
  /\blusta\b/i,
  /\bfelelőtlen\b/i,
  /\balkalmatlan\b/i,
  /\byou always\b/i,
  /\byou never\b/i,
  /\byou are so\b/i,
  /\bincompetent\b/i,
  /\blazy\b/i,
];

/** Igaz, ha a szövegben személy-szintű ítéletre utaló fordulat van. */
export function hasJudgmentTone(text: string): boolean {
  return JUDGMENT_PATTERNS.some((re) => re.test(text));
}

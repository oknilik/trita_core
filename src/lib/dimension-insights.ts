import type { Locale } from "@/lib/i18n";

// ─────────────────────────────────────────────────────────────────────
// Dimenzió-szintű rövid jellemzések — a results-oldal (hero insight),
// a ProfileTabs (erősség/figyelendő bulletek) és a persona-riport
// generátor KÖZÖS forrása. Korábban három példányban élt inline,
// drift-veszéllyel (riport-javítási terv 2026-07, P1.5).
//
// Nyelvi elv (P1.4): a felmérés becsül, nem bizonyít. Az erősség-
// mondatok tendenciát jeleznek („jellemzően", „többnyire"), nem
// kategorikus jellem-ítéletet — a gyenge-oldali megfogalmazások eleve
// tendencia-nyelven íródtak, azok változatlanok.
// ─────────────────────────────────────────────────────────────────────

/** Hero-tagline erősség-fele: a legmagasabb dimenzióhoz. */
export const DIMENSION_STRENGTH_VERBS: Record<string, Record<Locale, string>> = {
  // P5.1: viselkedési preferencia, nem erkölcsi ítélet — a „manipulációmentes"
  // implicit módon morálisan minősítette az alacsonyabb pólust.
  INTE: {
    hu: "Jellemzően nyílt lapokkal, közvetlen eszközökkel dolgozol",
    en: "You tend to work with open cards and direct means",
  },
  RESO: {
    hu: "Többnyire mélyen és empatikusan kapcsolódsz másokhoz",
    en: "You tend to connect deeply and empathetically with others",
  },
  TEMP: {
    hu: "Jellemzően energikusan és inspirálóan vagy jelen",
    en: "You typically bring energy and inspiration to your interactions",
  },
  ADAP: {
    hu: "Többnyire rugalmasan és türelmesen kezeled a helyzeteket",
    en: "You tend to handle situations with flexibility and patience",
  },
  THOR: {
    hu: "Jellemzően rendszerben és felelősen működsz",
    en: "You tend to work systematically and responsibly",
  },
  OPEN: {
    hu: "Többnyire kísérletezően és stratégiailag gondolkodsz",
    en: "You tend to think experimentally and strategically",
  },
};

/** Hero-tagline gyenge-fele: a legalacsonyabb dimenzióhoz. */
export const DIMENSION_WEAK_VERBS: Record<string, Record<Locale, string>> = {
  INTE: {
    hu: "a státusz és pozíció természetesebb tereped",
    en: "status and positioning come more naturally to you",
  },
  RESO: {
    hu: "az érzelmi bevonódás kevésbé természetes tereped",
    en: "emotional involvement is less natural for you",
  },
  TEMP: {
    hu: "a társas láthatóság kevésbé természetes tereped",
    en: "social visibility is less natural for you",
  },
  ADAP: {
    hu: "a konfliktusos helyzetekben élesebb reakciók jellemzőek",
    en: "you tend to react more sharply in conflict",
  },
  THOR: {
    hu: "a strukturált végrehajtás kevésbé természetes tereped",
    en: "structured execution is less natural for you",
  },
  OPEN: {
    hu: "a bevált módszereket részesíted előnyben",
    en: "you prefer established methods",
  },
};

/**
 * Erősség-bullet kiegészítők („{dimenzió} — {leírás}" formához).
 * Nyelvi dedup (P3.2): a bullet szándékosan MÁS szókinccsel írja le a
 * dimenziót, mint a hero-tagline — egy oldalon belül ne ismétlődjön
 * ugyanaz a fordulat („hiteles… / hiteles…").
 */
export const DIMENSION_STRENGTH_DESCS: Record<string, Record<Locale, string>> = {
  INTE: { hu: "nyílt működés, kiszámíthatóság, bizalomépítés", en: "open dealing, predictability, trust-building" },
  RESO: { hu: "érzelmi mélység, törődő jelenlét", en: "emotional depth, caring presence" },
  TEMP: { hu: "lendület, társas magabiztosság", en: "momentum, social confidence" },
  ADAP: { hu: "megbocsátás, higgadtság, kompromisszumkészség", en: "forgiveness, composure, willingness to compromise" },
  THOR: { hu: "szervezettség, kitartás, pontosság", en: "organized, persistent, precise" },
  OPEN: { hu: "felfedező szemlélet, komplex gondolkodás", en: "explorer mindset, complex thinking" },
};

/** Figyelendő-bullet kiegészítők — a tagline gyenge-felétől eltérő szókinccsel (P3.2). */
export const DIMENSION_WATCH_DESCS: Record<string, Record<Locale, string>> = {
  INTE: { hu: "erős versenyszellem, státusz-tudatosság", en: "strong competitive drive, status awareness" },
  RESO: { hu: "tárgyilagos, érzelmileg visszafogott stílus", en: "matter-of-fact, emotionally reserved style" },
  TEMP: { hu: "háttérben marad, ritkábban lép színre", en: "stays in the background, steps forward less often" },
  ADAP: { hu: "gyorsabban éleződő viták, kevesebb kompromisszum", en: "debates sharpen quickly, fewer compromises" },
  THOR: { hu: "lazább struktúra, improvizatívabb munkamód", en: "looser structure, more improvised workflow" },
  OPEN: { hu: "az ismert utakat választja, ritkábban kísérletezik", en: "chooses familiar paths, experiments less" },
};

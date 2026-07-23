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
  INTE: {
    hu: "Jellemzően hitelesen és manipulációmentesen működsz",
    en: "You tend to operate with authenticity and integrity",
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

/** Erősség-bullet kiegészítők („{dimenzió} — {leírás}" formához). */
export const DIMENSION_STRENGTH_DESCS: Record<string, Record<Locale, string>> = {
  INTE: { hu: "hiteles, manipulációmentes", en: "authentic, manipulation-free" },
  RESO: { hu: "erős empátia, mély kapcsolódás", en: "strong empathy, deep connection" },
  TEMP: { hu: "inspiráló, energikus jelenlét", en: "inspiring, energetic presence" },
  ADAP: { hu: "megbocsátó, rugalmas, türelmes", en: "forgiving, flexible, patient" },
  THOR: { hu: "szervezettség, kitartás, pontosság", en: "organized, persistent, precise" },
  OPEN: { hu: "kísérletező, stratégiai gondolkodó", en: "experimental, strategic thinker" },
};

/** Figyelendő-bullet kiegészítők. */
export const DIMENSION_WATCH_DESCS: Record<string, Record<Locale, string>> = {
  INTE: { hu: "státuszorientáltabb, versengőbb", en: "more status-oriented, competitive" },
  RESO: { hu: "érzelmileg távolabb, kevesebb empátia", en: "emotionally distant, less empathy" },
  TEMP: { hu: "kisebb társas láthatóság, visszahúzódóbb", en: "lower social visibility, more reserved" },
  ADAP: { hu: "élesebb reakciók konfliktusban", en: "sharper reactions in conflict" },
  THOR: { hu: "kevésbé szervezett, rugalmasabb", en: "less organized, more flexible" },
  OPEN: { hu: "bevált módszereket preferálja", en: "prefers established methods" },
};

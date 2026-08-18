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
//
// E-kivétel (2026-08-11, valencia-revízió — kanonikus kapu:
// score-valence.ts): az Emocionalitás egyik pólusa sem erősség és nem is
// hiányosság. A dimenzió a hero „legerősebb" HELYÉN továbbra is megnevezhető
// (különben egy magas-E kitöltő profilja kiürülne), de a MONDAT ott is
// jellemző-keretezésű, nem erősség-keretezésű; és MINDKÉT pólus prózája
// kétoldalú (hozadék ÉS ára), hogy egyik se olvasódjon verdiktként.
// ─────────────────────────────────────────────────────────────────────

/**
 * Hero-tagline első fele: a legmagasabb dimenzióhoz.
 * A E-nál ez NEM erősség-állítás, hanem jellemző-leírás (ld. fejléc).
 */
export const DIMENSION_STRENGTH_VERBS: Record<string, Record<Locale, string>> = {
  // P5.1: viselkedési preferencia, nem erkölcsi ítélet — a „manipulációmentes"
  // implicit módon morálisan minősítette az alacsonyabb pólust.
  H: {
    hu: "Jellemzően nyílt lapokkal, közvetlen eszközökkel dolgozol",
    en: "You tend to work with open cards and direct means",
  },
  // Jellemző-keretezés, nem erősség-keretezés (ld. fejléc): a mondat leír,
  // nem dicsér, és a hozadék mellett az árát is kimondja — így a hero nem
  // mond ellent a lentebbi facet-bontásnak (Szorongás/Félelem).
  E: {
    hu: "Többnyire hamar megérzed a helyzetek érzelmi töltetét, és sokat viszel magaddal belőle",
    en: "You tend to pick up a situation's emotional charge early, and carry a lot of it with you",
  },
  X: {
    hu: "Jellemzően energikusan és inspirálóan vagy jelen",
    en: "You typically bring energy and inspiration to your interactions",
  },
  A: {
    hu: "Többnyire rugalmasan és türelmesen kezeled a helyzeteket",
    en: "You tend to handle situations with flexibility and patience",
  },
  C: {
    hu: "Jellemzően rendszerben és felelősen működsz",
    en: "You tend to work systematically and responsibly",
  },
  O: {
    hu: "Többnyire kísérletezően és stratégiailag gondolkodsz",
    en: "You tend to think experimentally and strategically",
  },
};

/**
 * Hero-tagline gyenge-fele: a legalacsonyabb dimenzióhoz.
 *
 * A E-sor a HERO-ban NEM érhető el (a kanonikus kapu kizárja a fordított
 * dimenziót a „leggyengébb" slotból — score-valence.deficitSlotEligible,
 * workstyle-content.selectHeroInsightDims). SZÁNDÉKOSAN benne marad, de
 * valencia-mentesre írva: a térkép dim-kód szerinti, és ha egy jövőbeli
 * felület mégis feloldja, ne a régi hiány-keretezés („az érzelmi bevonódás
 * kevésbé természetes tereped") kerüljön ki.
 */
export const DIMENSION_WEAK_VERBS: Record<string, Record<Locale, string>> = {
  H: {
    hu: "a státusz és pozíció természetesebb tereped",
    en: "status and positioning come more naturally to you",
  },
  E: {
    hu: "a higgadtság megőrzése természetesebb, mint mások érzelmi jelzéseinek olvasása",
    en: "staying level comes more naturally than reading others' emotional signals",
  },
  X: {
    hu: "a társas láthatóság kevésbé természetes tereped",
    en: "social visibility is less natural for you",
  },
  A: {
    hu: "a konfliktusos helyzetekben élesebb reakciók jellemzőek",
    en: "you tend to react more sharply in conflict",
  },
  C: {
    hu: "a strukturált végrehajtás kevésbé természetes tereped",
    en: "structured execution is less natural for you",
  },
  O: {
    hu: "a bevált módszereket részesíted előnyben",
    en: "you prefer established methods",
  },
};

/**
 * Dimenzió-kiegészítők a MAGAS pólushoz („{dimenzió} — {leírás}" formához).
 *
 * JELENLEG NEM RENDERELŐDIK: az egyetlen fogyasztója a 2026-08-18-án
 * kivezetett `buildInsightBullets` volt (halott kód, ld. az indoklást a
 * profile-report-view-model.ts-ben). A térkép azért marad, mert a
 * reso-valence-sweep teszt a TARTALMÁT őrzi, és egy jövőbeli felület
 * felhasználhatja — de csak valencia-mentes keretben, NEM „erősség"-listaként.
 * Nyelvi dedup (P3.2): a bullet szándékosan MÁS szókinccsel írja le a
 * dimenziót, mint a hero-tagline — egy oldalon belül ne ismétlődjön
 * ugyanaz a fordulat („hiteles… / hiteles…").
 */
export const DIMENSION_STRENGTH_DESCS: Record<string, Record<Locale, string>> = {
  H: { hu: "nyílt működés, kiszámíthatóság, bizalomépítés", en: "open dealing, predictability, trust-building" },
  // A E-sor a valencia-kapu (score-valence.strengthSlotEligible) miatt
  // NEM kerül erősség-bulletbe. Aligned marad, mert a térkép dim-kód
  // szerinti — a korábbi „érzelmi mélység, törődő jelenlét" erény-keretezés
  // volt (és empátiát ígért, amit ez a skála nem mér).
  E: { hu: "korán érzékeli a feszültséget, és sokat visz magával belőle", en: "registers tension early, and carries a lot of it" },
  X: { hu: "lendület, társas magabiztosság", en: "momentum, social confidence" },
  A: { hu: "megbocsátás, higgadtság, kompromisszumkészség", en: "forgiveness, composure, willingness to compromise" },
  C: { hu: "szervezettség, kitartás, pontosság", en: "organized, persistent, precise" },
  O: { hu: "felfedező szemlélet, komplex gondolkodás", en: "explorer mindset, complex thinking" },
};

/**
 * Dimenzió-kiegészítők az ALACSONY pólushoz — a tagline alsó felétől eltérő
 * szókinccsel (P3.2). Ugyanúgy jelenleg nem renderelődik, ld. a párját fent.
 */
export const DIMENSION_WATCH_DESCS: Record<string, Record<Locale, string>> = {
  H: { hu: "erős versenyszellem, státusz-tudatosság", en: "strong competitive drive, status awareness" },
  // Szintén nem érhető el (deficitSlotEligible kizárja) — kétoldalúra írva:
  // nyomás alatti higgadtság ÉS a jelzések elkerülésének kockázata.
  E: { hu: "nyomás alatt higgadt, mások érzelmi jelzéseit ritkábban veszi észre", en: "steady under pressure, less likely to register others' emotional signals" },
  X: { hu: "háttérben marad, ritkábban lép színre", en: "stays in the background, steps forward less often" },
  A: { hu: "gyorsabban éleződő viták, kevesebb kompromisszum", en: "debates sharpen quickly, fewer compromises" },
  C: { hu: "lazább struktúra, improvizatívabb munkamód", en: "looser structure, more improvised workflow" },
  O: { hu: "az ismert utakat választja, ritkábban kísérletezik", en: "chooses familiar paths, experiments less" },
};

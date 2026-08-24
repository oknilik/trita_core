// Holland-kód (RIASEC) értelmező tartalom. A hat betű John Holland
// érdeklődés-tipológiája (Holland, 1997); a trita a kódot a
// karrier-iránytűben használja (mért kérdőív / címkék / becslés forrással).
//
// PARKOLVA (2026-08-07): a publikus értelmező lap kivezetve, mert a
// karrier-réteg fagyasztva van (fake door mögött) — kifelé nem hivatkozunk
// rá. A tartalom SZÁNDÉKOSAN marad a repóban: a modul élesítésekor ez a
// forrás. Amíg nincs fogyasztója, importálatlan.

import type { RiasecLetter } from "@/lib/career/types";

export interface RiasecLetterContent {
  letter: RiasecLetter;
  emoji: string;
  color: string;
  name: { hu: string; en: string };
  tagline: { hu: string; en: string };
  description: { hu: string; en: string };
  activities: { hu: string[]; en: string[] };
  exampleRoles: { hu: string[]; en: string[] };
}

export const RIASEC_CONTENT: RiasecLetterContent[] = [
  {
    letter: "R",
    emoji: "🔧",
    color: "#8B5CF6",
    name: { hu: "Realistic — Megvalósító", en: "Realistic — Doer" },
    tagline: { hu: "Kézzel fogható dolgokkal dolgozni", en: "Working with tangible things" },
    description: {
      hu: "A Megvalósító típus szereti a gyakorlati, kézzelfogható munkát: építeni, szerelni, működtetni. Gépek, szerszámok, növények, járművek — az számít, aminek látható eredménye van. Kevésbé vonzza a hosszas egyeztetés és a papírmunka.",
      en: "The Doer type enjoys practical, hands-on work: building, fixing, operating. Machines, tools, plants, vehicles — what matters is a visible result. Long meetings and paperwork appeal less.",
    },
    activities: {
      hu: ["szerelés, javítás", "építés, kivitelezés", "gépek kezelése", "kültéri munka"],
      en: ["repairing and fixing", "building and construction", "operating machinery", "outdoor work"],
    },
    exampleRoles: {
      hu: ["Villanyszerelő", "Autószerelő", "CNC-gépkezelő", "Járművezető"],
      en: ["Electrician", "Auto mechanic", "CNC operator", "Driver"],
    },
  },
  {
    letter: "I",
    emoji: "🔬",
    color: "#06B6D4",
    name: { hu: "Investigative — Elemző", en: "Investigative — Thinker" },
    tagline: { hu: "Megérteni, hogyan működnek a dolgok", en: "Understanding how things work" },
    description: {
      hu: "Az Elemző típus kérdez, vizsgál, összefüggéseket keres. Adatok, kísérletek, elméletek — a motivációja a megértés, nem feltétlenül a gyors eredmény. Önálló, elmélyült munkában a legerősebb.",
      en: "The Thinker type asks, investigates, looks for patterns. Data, experiments, theories — the drive is understanding, not necessarily quick results. Strongest in independent, deep work.",
    },
    activities: {
      hu: ["kutatás, elemzés", "problémamegoldás", "adatokkal dolgozás", "kísérletezés"],
      en: ["research and analysis", "problem-solving", "working with data", "experimenting"],
    },
    exampleRoles: {
      hu: ["Kutató", "Adatelemző", "Fejlesztő", "Pszichológus"],
      en: ["Researcher", "Data analyst", "Developer", "Psychologist"],
    },
  },
  {
    letter: "A",
    emoji: "🎨",
    color: "#EC4899",
    name: { hu: "Artistic — Alkotó", en: "Artistic — Creator" },
    tagline: { hu: "Létrehozni valamit, ami előtte nem volt", en: "Creating something new" },
    description: {
      hu: "Az Alkotó típus önkifejezésre és eredetiségre vágyik: írás, design, zene, vizuális világok. Rugalmas kereteket szeret, a szigorú szabályrendszerek fárasztják. Az az eleme, ahol a saját ízlése formálhatja a végeredményt.",
      en: "The Creator type seeks self-expression and originality: writing, design, music, visual worlds. Prefers loose structure; rigid rule systems drain them. In their element when their taste shapes the outcome.",
    },
    activities: {
      hu: ["tervezés, design", "írás, tartalomkészítés", "zene, előadás", "vizuális alkotás"],
      en: ["design work", "writing and content", "music and performing", "visual creation"],
    },
    exampleRoles: {
      hu: ["Grafikus", "UX designer", "Tartalomkészítő", "Kreatív alkotó"],
      en: ["Graphic designer", "UX designer", "Content creator", "Creative"],
    },
  },
  {
    letter: "S",
    emoji: "🤝",
    color: "#10B981",
    name: { hu: "Social — Segítő", en: "Social — Helper" },
    tagline: { hu: "Emberekkel, emberekért dolgozni", en: "Working with and for people" },
    description: {
      hu: "A Segítő típus akkor van elemében, ha másokon segíthet: tanít, gondoz, fejleszt, meghallgat. Az emberi kapcsolat számára nem a munka mellékterméke, hanem a lényege. A tisztán tárgy- vagy adatközpontú munka kevésbé tölti fel.",
      en: "The Helper type thrives on helping others: teaching, caring, developing, listening. Human connection isn't a by-product of the work — it's the point. Purely object- or data-centred work is less fulfilling.",
    },
    activities: {
      hu: ["tanítás, fejlesztés", "gondozás, ápolás", "tanácsadás", "közösségi munka"],
      en: ["teaching and coaching", "caregiving", "counseling", "community work"],
    },
    exampleRoles: {
      hu: ["Tanár", "Ápoló", "HR partner", "Szociális munkás"],
      en: ["Teacher", "Nurse", "HR partner", "Social worker"],
    },
  },
  {
    letter: "E",
    emoji: "🚀",
    color: "#F59E0B",
    name: { hu: "Enterprising — Meggyőző", en: "Enterprising — Persuader" },
    tagline: { hu: "Meggyőzni, vezetni, elérni", en: "Persuading, leading, achieving" },
    description: {
      hu: "A Meggyőző típus célokat hajt: elad, tárgyal, szervez, vezet. Energiát ad neki a verseny és a látható eredmény. Szeret dönteni és felelősséget vinni — a hosszú, magányos elemzés kevésbé az ő terepe.",
      en: "The Persuader type chases goals: selling, negotiating, organizing, leading. Competition and visible wins energize them. They like deciding and owning outcomes — long solitary analysis is less their turf.",
    },
    activities: {
      hu: ["értékesítés, tárgyalás", "vezetés, szervezés", "vállalkozás", "prezentálás"],
      en: ["selling and negotiating", "leading and organizing", "entrepreneurship", "presenting"],
    },
    exampleRoles: {
      hu: ["Értékesítő", "Üzletfejlesztés", "Üzletvezetés", "Ingatlanközvetítő"],
      en: ["Sales representative", "Business development", "Store management", "Real estate agent"],
    },
  },
  {
    letter: "C",
    emoji: "📋",
    color: "#6366F1",
    name: { hu: "Conventional — Rendszerező", en: "Conventional — Organizer" },
    tagline: { hu: "Rendet tenni és rendben tartani", en: "Creating and keeping order" },
    description: {
      hu: "A Rendszerező típus a pontosságban és a jól definiált folyamatokban erős: nyilvántartások, számok, szabályok, határidők. Ő az, akinél nem vész el semmi. A kiszámíthatatlan, folyton változó közeg fárasztja.",
      en: "The Organizer type excels at precision and well-defined processes: records, numbers, rules, deadlines. Nothing gets lost on their watch. Unpredictable, ever-shifting settings wear them out.",
    },
    activities: {
      hu: ["nyilvántartás, adminisztráció", "pénzügyek, számok", "folyamatok követése", "minőség-ellenőrzés"],
      en: ["record-keeping and admin", "finance and numbers", "following processes", "quality control"],
    },
    exampleRoles: {
      hu: ["Könyvelő", "Minőségbiztosítás", "Adótanácsadó", "HR adminisztráció"],
      en: ["Accountant", "Quality assurance", "Tax advisor", "HR administration"],
    },
  },
];

/** Betű szerinti gyors elérés. */
export const RIASEC_CONTENT_BY_LETTER: Record<string, RiasecLetterContent> =
  Object.fromEntries(RIASEC_CONTENT.map((entry) => [entry.letter, entry]));

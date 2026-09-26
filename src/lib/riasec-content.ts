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
    name: { hu: "Realistic – Megvalósító", en: "Realistic – Doer" },
    tagline: { hu: "Kézzelfogható dolgokkal dolgozni", en: "Working with tangible things" },
    description: {
      hu: "A Megvalósító területhez a gyakorlati feladatok tartoznak: építés, szerelés, gépek kezelése vagy munka a szabadban. Ha ez érdekel, valószínűleg szívesen dolgozol olyan feladaton, amelynek kézzelfogható eredménye van.",
      en: "The Doer type enjoys practical, hands-on work: building, fixing, operating. Machines, tools, plants, vehicles – what matters is a visible result. Long meetings and paperwork appeal less.",
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
    name: { hu: "Investigative – Elemző", en: "Investigative – Thinker" },
    tagline: { hu: "Megérteni, hogyan működnek a dolgok", en: "Understanding how things work" },
    description: {
      hu: "Az Elemző területhez a kutatás, az adatok vizsgálata és az összefüggések keresése tartozik. Ha ez érdekel, valószínűleg szívesen jársz utána egy kérdésnek, és időt szánsz arra, hogy megértsd, hogyan működik valami.",
      en: "The Thinker type asks, investigates, looks for patterns. Data, experiments, theories – the drive is understanding, not necessarily quick results. Strongest in independent, deep work.",
    },
    activities: {
      hu: ["kutatás, elemzés", "problémamegoldás", "adatokkal végzett munka", "kísérletezés"],
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
    name: { hu: "Artistic – Alkotó", en: "Artistic – Creator" },
    tagline: { hu: "Létrehozni valamit, ami előtte nem volt", en: "Creating something new" },
    description: {
      hu: "Az Alkotó területhez az írás, a tervezés, a zene és más művészeti tevékenységek tartoznak. Ha ez érdekel, vonzhatnak azok a feladatok, amelyekben saját ötleteidet és ízlésedet is megmutathatod.",
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
    name: { hu: "Social – Segítő", en: "Social – Helper" },
    tagline: { hu: "Emberekkel, emberekért dolgozni", en: "Working with and for people" },
    description: {
      hu: "A Segítő területhez a tanítás, a gondozás, a tanácsadás és a közösségi munka tartozik. Ha ez érdekel, valószínűleg szívesen foglalkozol emberekkel, hallgatod meg őket, és segíted a tanulásukat vagy a mindennapjaikat.",
      en: "The Helper type thrives on helping others: teaching, caring, developing, listening. Human connection isn't a by-product of the work – it's the point. Purely object- or data-centred work is less fulfilling.",
    },
    activities: {
      hu: ["tanítás, fejlesztés", "gondozás, ápolás", "tanácsadás", "közösségi munka"],
      en: ["teaching and coaching", "caregiving", "counseling", "community work"],
    },
    exampleRoles: {
      hu: ["Tanár", "Ápoló", "HR-partner", "Szociális munkás"],
      en: ["Teacher", "Nurse", "HR partner", "Social worker"],
    },
  },
  {
    letter: "E",
    emoji: "🚀",
    color: "#F59E0B",
    name: { hu: "Enterprising – Meggyőző", en: "Enterprising – Persuader" },
    tagline: { hu: "Meggyőzni másokat, vezetni és célokat elérni", en: "Persuading, leading, achieving" },
    description: {
      hu: "A Meggyőző területhez az értékesítés, a tárgyalás, a szervezés és a vezetés tartozik. Ha ez érdekel, vonzhatnak azok a feladatok, amelyekben másokat nyersz meg egy ügynek, döntéseket hozol vagy közös célokért szervezed a munkát.",
      en: "The Persuader type chases goals: selling, negotiating, organizing, leading. Competition and visible wins energize them. They like deciding and owning outcomes – long solitary analysis is less their turf.",
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
    name: { hu: "Conventional – Rendszerező", en: "Conventional – Organizer" },
    tagline: { hu: "Rendet tenni és rendben tartani", en: "Creating and keeping order" },
    description: {
      hu: "A Rendszerező területhez a nyilvántartások, a számok, a szabályok és a munkafolyamatok követése tartozik. Ha ez érdekel, valószínűleg szívesen foglalkozol olyan feladatokkal, amelyekben fontos a rend, a pontosság és az egyértelmű teendők.",
      en: "The Organizer type excels at precision and well-defined processes: records, numbers, rules, deadlines. Nothing gets lost on their watch. Unpredictable, ever-shifting settings wear them out.",
    },
    activities: {
      hu: ["nyilvántartás, adminisztráció", "pénzügyek, számok", "folyamatok követése", "minőségellenőrzés"],
      en: ["record-keeping and admin", "finance and numbers", "following processes", "quality control"],
    },
    exampleRoles: {
      hu: ["Könyvelő", "Minőségbiztosítás", "Adótanácsadó", "HR-adminisztráció"],
      en: ["Accountant", "Quality assurance", "Tax advisor", "HR administration"],
    },
  },
];

/** Betű szerinti gyors elérés. */
export const RIASEC_CONTENT_BY_LETTER: Record<string, RiasecLetterContent> =
  Object.fromEntries(RIASEC_CONTENT.map((entry) => [entry.letter, entry]));

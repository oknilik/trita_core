/**
 * A publikus oldalak keresési szándék-térképe.
 *
 * Nem a (Google által figyelmen kívül hagyott) `meta keywords` mezőt eteti.
 * Azért központi forrás, hogy a title/description, a látható tartalom és a
 * strukturált adatok ugyanazt az oldalszerepet erősítsék, és a fő lapok ne
 * ugyanarra az elsődleges kifejezésre versenyezzenek egymással.
 */
export const SEO_INTENTS = {
  // 2026-09-03: a korábbi /self-awareness lap a főoldalba olvadt (állandó
  // átirányítás) — az önismereti szándék témái is ide tartoznak.
  // 2026-09-05: a „Csapatintelligencia" téma innen a /team-dynamics pillarra
  // költözött — a főoldal a funnel egyéni belépője, a kategória gazdája a
  // pillar. A márka-pozicionálást a description, az OG és az entitás viszi.
  home: {
    path: "/",
    primary: "személyiségteszt magyarul",
    topics: [
      "Személyiségteszt magyarul",
      "Önismereti személyiségteszt",
      "Egyéni személyiségprofil",
      "Hatfaktoros személyiségmodell",
    ],
  },
  // A csapatintelligencia-PILLAR. Az elsődleges kifejezés szándékosan a
  // valós keresési volumenű „csapatdiagnosztika" marad: a „csapatintelligencia"
  // saját kategórianév, amit ez az oldal TANÍT (látható definíció +
  // DefinedTermSet), nem pedig meglévő keresletre céloz. A blog csapat-témájú
  // cikkei erre a lapra linkelnek — hub-and-spoke.
  teamDynamics: {
    path: "/team-dynamics",
    primary: "csapatdiagnosztika",
    topics: [
      "Csapatintelligencia",
      "Csapatdiagnosztika",
      "Csapatdinamika",
      "Csapatszerepek",
      "Bizalmi háló",
      "Pszichológiai biztonság",
    ],
  },
  howWeWork: {
    path: "/how-we-work",
    primary: "csapatfejlesztés",
    topics: ["Csapatfejlesztés", "Szervezetfejlesztés", "Csapatdiagnosztikai program"],
  },
  tryAssessment: {
    path: "/try",
    primary: "ingyenes személyiségteszt",
    topics: ["Ingyenes személyiségteszt", "Online személyiségteszt", "60 kérdéses személyiségteszt"],
  },
} as const;

export type SeoIntent = (typeof SEO_INTENTS)[keyof typeof SEO_INTENTS];

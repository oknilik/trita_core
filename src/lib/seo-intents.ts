/**
 * A publikus oldalak keresési szándék-térképe.
 *
 * Nem a (Google által figyelmen kívül hagyott) `meta keywords` mezőt eteti.
 * Azért központi forrás, hogy a title/description, a látható tartalom és a
 * strukturált adatok ugyanazt az oldalszerepet erősítsék, és a fő lapok ne
 * ugyanarra az elsődleges kifejezésre versenyezzenek egymással.
 */
export const SEO_INTENTS = {
  // A főoldal a márka és a csapatszintű ajánlat gyűjtőlapja. Az ingyenes
  // egyéni profil funnel-belépő, ezért annak tranzakciós keresési szándéka a
  // /try oldalon él; így a két lap nem versenyez ugyanarra a kifejezésre.
  home: {
    path: "/",
    primary: "csapatintelligencia",
    topics: [
      "Csapatintelligencia",
      "Csapatdinamika",
      "Csapatműködés",
      "Közös csapatkép",
      "Egyéni profilok a csapatban",
    ],
  },
  teamDynamics: {
    path: "/team-dynamics",
    primary: "csapatdiagnosztika",
    topics: ["Csapatdiagnosztika", "Csapatdinamika", "Bizalmi háló", "Pszichológiai biztonság"],
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

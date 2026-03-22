// Belbin Self-Perception Inventory — 7 sections × 8 statements
// Each section: distribute 10 points across the 8 statements
// Based on Belbin's original SPI questionnaire (adapted, publicly available version)

export interface BelbinStatement {
  index: number; // 0-7
  hu: string;
  en: string;
}

export interface BelbinSection {
  group: number; // 0-6
  heading: { hu: string; en: string };
  statements: BelbinStatement[];
}

export const BELBIN_SECTIONS: BelbinSection[] = [
  {
    group: 0,
    heading: {
      hu: "Azt hiszem, hogy hasznos tagja vagyok a csapatnak, mert...",
      en: "I believe I can contribute to a team because I...",
    },
    statements: [
      { index: 0, hu: "Képes vagyok megvalósítani és kézzelfogható eredményt elérni.", en: "Can implement decisions and achieve tangible results." },
      { index: 1, hu: "Fellelkesülök, ha megkérdőjelezhetek valamit és vitát indíthatok.", en: "Get excited when I can challenge assumptions and spark debate." },
      { index: 2, hu: "Koordinálni tudom a különböző embereket egy közös cél érdekében.", en: "Can coordinate diverse people toward a common goal." },
      { index: 3, hu: "Könnyen felmérem, mi az elvégzendő feladat, és pontosan elvégzem.", en: "Quickly assess what needs to be done and do it accurately." },
      { index: 4, hu: "Értékelem mások véleményét, és a csoport harmóniáját erősítem.", en: "Value others' opinions and strengthen group harmony." },
      { index: 5, hu: "Analitikus gondolkodásom segít megoldani az összetett problémákat.", en: "My analytical thinking helps solve complex problems." },
      { index: 6, hu: "Széleskörű szakmai tudásom értéket hoz a csapatnak.", en: "My broad expertise brings value to the team." },
      { index: 7, hu: "Megtalálom és kiaknázom a külső lehetőségeket a csapat számára.", en: "I find and exploit external opportunities for the team." },
    ],
  },
  {
    group: 1,
    heading: {
      hu: "Ha gyengeségeim vannak a csapatmunkában, az azért van, mert...",
      en: "If I have a weakness in team work, it can be because I...",
    },
    statements: [
      { index: 0, hu: "Akkor érzem jól magam, ha az emberek közötti kapcsolatok harmonikusak.", en: "Am not at ease unless people relate to each other harmoniously." },
      { index: 1, hu: "Hajlamos vagyok a részletekre és az egyértelműségre összpontosítani.", en: "Am inclined to focus on details and clarity." },
      { index: 2, hu: "Hajlamos vagyok az ötletek generálásának kárára elveszni az öngondolatokban.", en: "Tend to lose myself in self-generated thoughts at the expense of new ideas." },
      { index: 3, hu: "Néha mások rovására is igyekszem érvényesíteni az álláspontomat.", en: "Sometimes assert my position at others' expense." },
      { index: 4, hu: "Néha nehéz ítélkeznem az általam közvetített elemzések fényében.", en: "Sometimes find it difficult to judge based on analyses I have conveyed." },
      { index: 5, hu: "Nehéznek találom a haladást, ha a célok nem egyértelműek.", en: "Find it difficult to move forward unless objectives are clear." },
      { index: 6, hu: "Előfordulhat, hogy ragaszkodom a saját megközelítésemhez, ha jobb megoldás nincs.", en: "May insist on my own approach if no better solution is proposed." },
      { index: 7, hu: "Hajlamos vagyok elveszíteni az érdeklődésemet, amint az első lelkesedés elmúlik.", en: "Tend to lose interest once initial enthusiasm passes." },
    ],
  },
  {
    group: 2,
    heading: {
      hu: "Amikor más emberekkel közös projekten dolgozom...",
      en: "When involved in a project with other people...",
    },
    statements: [
      { index: 0, hu: "Hajlamos vagyok befolyásolni az embereket anélkül, hogy megnyomásuk lenne.", en: "I can subtly influence people without pressuring them." },
      { index: 1, hu: "Az éberen figyelő hozzáállásom megakadályozza, hogy hibákat kövessek el.", en: "My vigilance prevents errors from being made." },
      { index: 2, hu: "Készen állok arra, hogy nyomást gyakoroljak a cselekvés meggyorsítása érdekében.", en: "I am ready to exert pressure to speed up action when needed." },
      { index: 3, hu: "Valami eredetit hozok, amit képes vagyok továbbfejleszteni.", en: "I can offer something original and develop it further." },
      { index: 4, hu: "Mindig kész vagyok pártoló hallgatóság számára egy jó ötletet tovább fejleszteni.", en: "I am always ready to develop a good idea for an interested audience." },
      { index: 5, hu: "Hajlamos vagyok szorosan az eredeti tervhez tartani magam.", en: "I tend to adhere closely to the original plan." },
      { index: 6, hu: "Elvárható tőlem, hogy figyelembe vegyek mindenkit és megőrizzem a csapat kohézióját.", en: "I take everyone's view into account and maintain team cohesion." },
      { index: 7, hu: "Képes vagyok értékelni és felmérni a különböző javaslatokat.", en: "I can evaluate and appraise a range of proposals objectively." },
    ],
  },
  {
    group: 3,
    heading: {
      hu: "Csapatmunkával való megközelítésem jellemzője az, hogy...",
      en: "My approach to group work is characterized by...",
    },
    statements: [
      { index: 0, hu: "Valóban érdekel a munkatársak megismerése.", en: "I have a real interest in getting to know my colleagues better." },
      { index: 1, hu: "Nem hezitálok kihívást intézni mások nézeteivel szemben, ha szükséges.", en: "I do not hesitate to challenge others' views when necessary." },
      { index: 2, hu: "Megcáfolhatatlan érvekkel alátámasztom az álláspontomat.", en: "I support my position with convincing arguments." },
      { index: 3, hu: "Hatékonyan dolgozom, ha a csapat előtt egyértelmű célok állnak.", en: "I work efficiently when the team has clear goals ahead." },
      { index: 4, hu: "Hajlamos vagyok elkerülni a rutinszerű munkát.", en: "I tend to avoid routine work." },
      { index: 5, hu: "Ha szükséges, képes vagyok módszeresen és fegyelemmel megközelíteni a feladatot.", en: "When needed, I can tackle tasks methodically and with discipline." },
      { index: 6, hu: "Biztosítom, hogy a csoport számára releváns ismeretek és készségek elérhetők legyenek.", en: "I ensure that relevant knowledge and skills are available to the group." },
      { index: 7, hu: "Gondoskodóan járulok hozzá mások ötleteinek bővítéséhez.", en: "I contribute constructively to building on others' ideas." },
    ],
  },
  {
    group: 4,
    heading: {
      hu: "A csapatmunkából a következőket szeretem...",
      en: "I gain satisfaction in a job because I...",
    },
    statements: [
      { index: 0, hu: "Élvezem az elemzést, mivel sokféle lehetőséget és változatot mérlegelek.", en: "Enjoy analyzing situations and weighing up a variety of factors." },
      { index: 1, hu: "Érdekelnek az elvont ötletek generálása és a problémák megoldása.", en: "Am interested in generating abstract ideas and solving problems." },
      { index: 2, hu: "Hajlamos vagyok kreatív ötleteket kínálni, amelyek meglepik a csoportot.", en: "Am inclined to offer creative ideas that surprise the group." },
      { index: 3, hu: "Szívesen gondoskodom arról, hogy a feladatok megfelelően legyenek kiosztva.", en: "Enjoy ensuring that tasks are properly allocated." },
      { index: 4, hu: "Hajlamos vagyok kiépíteni és aktiválni az embereket a célok elérése érdekében.", en: "Tend to build on and activate people to achieve goals." },
      { index: 5, hu: "Képes vagyok és szívesen fejlesztek technikai képességeket, és kapcsolatba lépek az emberekkel.", en: "Can develop technical skills and engage with people." },
      { index: 6, hu: "Meg tudom ítélni, hogy a csapat erőfeszítései valóban a prioritásokra irányulnak-e.", en: "Can judge whether the team's efforts are truly directed at priorities." },
      { index: 7, hu: "Hajlamos vagyok szorgalmasan és kitartóan dolgozni, amíg a munka el nem készül.", en: "Tend to work diligently and persistently until the job is done." },
    ],
  },
  {
    group: 5,
    heading: {
      hu: "Ha váratlanul feladatot kapok, amit be kell fejeznem korlátozott időn belül...",
      en: "If I am suddenly given a difficult task with limited time and unfamiliar people...",
    },
    statements: [
      { index: 0, hu: "Hajlamos vagyok visszahúzódni egy sarokba, és megoldást keresni, mielőtt kapcsolatba lépek.", en: "I tend to retreat to a corner and think up a solution before making contact." },
      { index: 1, hu: "Hajlamos vagyok együttműködni a legerősebb akarattal rendelkező személlyel.", en: "I tend to collaborate with whoever has the most decisive will." },
      { index: 2, hu: "Megtalálom azt, aki csökkenti a terhelést és elosztja a feladatokat.", en: "I find someone who can reduce the load and distribute the work." },
      { index: 3, hu: "Természetes sürgősségem segít abban, hogy időben teljesítsünk.", en: "My natural sense of urgency ensures we keep to schedule." },
      { index: 4, hu: "Megőrzöm a hidegvéremet és gondolkodom, ha az emberek megterhelnek.", en: "I retain my coolness and think clearly when people are under stress." },
      { index: 5, hu: "Célirányos maradok a nyomás ellenére is.", en: "I remain purposeful despite the pressure." },
      { index: 6, hu: "Hajlamos vagyok irányítani a megbeszélést, ha szükségesnek érzem a haladást.", en: "I tend to take charge of the discussion if I feel progress is needed." },
      { index: 7, hu: "Rendelkezésre bocsátom a szaktudásomat, ahol az hasznos lehet a csoport számára.", en: "I offer my expertise wherever it may be useful to the group." },
    ],
  },
  {
    group: 6,
    heading: {
      hu: "A csapatmunkával kapcsolatos általános érzéseim...",
      en: "In general, the things I find most satisfying in team work are...",
    },
    statements: [
      { index: 0, hu: "Szívesen elvégzem a szükséges munkát, anélkül hogy az elismerés hajtana.", en: "I can do what is necessary without being driven by recognition." },
      { index: 1, hu: "Olyan problémákon dolgozni, amelyek az én speciális területem.", en: "Working on problems that are specifically in my area." },
      { index: 2, hu: "Szeretem, ha valóban fontos és releváns célra lehet összpontosítani.", en: "I like when I can focus on a truly important and relevant goal." },
      { index: 3, hu: "Szeretem az emberekbe való befektetés és a valódi kapcsolatok kialakítását.", en: "I enjoy investing in people and building genuine relationships." },
      { index: 4, hu: "Szívesen kezelem a részleteket és a pontosságot a végső eredményben.", en: "I enjoy managing details and precision in the final outcome." },
      { index: 5, hu: "Szeretem, ha megmutathatom, hogy milyen jól el tudok végezni valami nehezet.", en: "I like showing that I can do something difficult really well." },
      { index: 6, hu: "Örülök, ha tanácsot adhatok a csoport stratégiai irányával kapcsolatban.", en: "I am glad when I can give advice on the group's strategic direction." },
      { index: 7, hu: "Élvezem, ha elősegíthetem az együttműködést és az emberek aktivizálását.", en: "I enjoy facilitating cooperation and getting people involved." },
    ],
  },
];

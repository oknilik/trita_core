import type { TestConfig } from "./types";

/**
 * Official HEXACO-PI-R (60 questions)
 * TODO: Replace placeholder questions with the official HEXACO-PI-R question bank
 */
export const hexacoConfig: TestConfig = {
  type: "HEXACO",
  name: "HEXACO-PI-R",
  description: "A hivatalos HEXACO személyiségteszt 60 kérdéssel.",
  format: "likert",
  dimensions: [
    {
      code: "H",
      label: "Őszinteség-Alázat",
      labelByLocale: {
        en: "Honesty–Humility",
        de: "Ehrlichkeit–Bescheidenheit",
      },
      color: "#818CF8",
      description: "Ez a dimenzió azt méri, mennyire vagy őszinte, szerény és igazságos másokkal szemben. A magas érték megbízhatóságot és etikus viselkedést jelöl, míg az alacsonyabb érték pragmatikusabb, versengőbb hozzáállást tükröz.",
      descriptionByLocale: {
        en: "Measures how honest, modest, and fair you are toward others. High scores indicate trustworthiness and ethical behavior, while lower scores reflect a more pragmatic, competitive approach.",
        de: "Misst, wie ehrlich, bescheiden und fair du anderen gegenüber bist. Hohe Werte stehen für Vertrauenswürdigkeit und ethisches Verhalten, niedrigere Werte für eine pragmatischere, wettbewerbsorientierte Haltung.",
      },
      insights: {
        low: "Pragmatikus megközelítés, hajlamos a saját érdekeid előtérbe helyezésére.",
        mid: "Kiegyensúlyozott hozzáállás az őszinteség és a gyakorlatiasság között.",
        high: "Megbízható, szerény hozzáállás, magas etikai érzékenységgel.",
      },
      insightsByLocale: {
        en: {
          low: "Pragmatic approach, often prioritizing your own interests.",
          mid: "Balanced between honesty and practicality.",
          high: "Reliable and modest, with strong ethical sensitivity.",
        },
        de: {
          low: "Pragmatischer Ansatz, häufig mit Fokus auf eigene Interessen.",
          mid: "Ausgewogen zwischen Ehrlichkeit und Praktikabilität.",
          high: "Zuverlässig und bescheiden, mit hoher ethischer Sensibilität.",
        },
      },
    },
    {
      code: "E",
      label: "Érzelmi stabilitás",
      labelByLocale: {
        en: "Emotionality",
        de: "Emotionalität",
      },
      color: "#FB7185",
      description: "Az érzelmi reakciók intenzitását és az érzelmi sebezhetőséget méri. Magasabb értéknél erősebb az empátia és az érzelmi kötődés, míg alacsonyabb értéknél inkább a higgadtság és az érzelmi távolságtartás jellemző.",
      descriptionByLocale: {
        en: "Measures intensity of emotional reactions and vulnerability. Higher scores reflect stronger empathy and emotional bonding, while lower scores indicate calmness and emotional distance.",
        de: "Misst die Intensität emotionaler Reaktionen und Verletzlichkeit. Höhere Werte stehen für stärkere Empathie und Bindung, niedrigere Werte für mehr Ruhe und emotionale Distanz.",
      },
      insights: {
        low: "Érzelmileg stabil, ritkán aggódsz vagy idegeskedsz.",
        mid: "Önkontrollált, de stresszhelyzetben előfordulhat fokozott óvatosság.",
        high: "Mély érzelmi átélés, erős empátia és érzékenység jellemez.",
      },
      insightsByLocale: {
        en: {
          low: "Emotionally stable; you rarely worry or feel anxious.",
          mid: "Self-controlled, but may become more cautious under stress.",
          high: "Deep emotional experience with strong empathy and sensitivity.",
        },
        de: {
          low: "Emotional stabil; du sorgst dich selten oder bist selten nervös.",
          mid: "Selbstkontrolliert, aber in Stresssituationen vorsichtiger.",
          high: "Tiefes emotionales Erleben mit starker Empathie und Sensibilität.",
        },
      },
    },
    {
      code: "X",
      label: "Extraverzió",
      labelByLocale: {
        en: "Extraversion",
        de: "Extraversion",
      },
      color: "#F59E0B",
      description: "A társas energia szintjét és a szociális magabiztosságot méri. Magas értéknél élénk, társaságkedvelő személyiség rajzolódik ki, míg alacsonyabb értéknél az egyéni tevékenységek és a visszahúzódás a jellemzőbb.",
      descriptionByLocale: {
        en: "Measures social energy and confidence. High scores indicate a lively, sociable personality, while lower scores favor solitary activities and reservedness.",
        de: "Misst soziale Energie und Selbstsicherheit. Hohe Werte deuten auf eine lebhafte, gesellige Persönlichkeit hin, niedrigere Werte auf eher zurückgezogene, individuelle Aktivitäten.",
      },
      insights: {
        low: "Inkább introvertált, a nyugodt, egyéni tevékenységeket preferálod.",
        mid: "Kiegyensúlyozott társas energia: tudsz vezetni, de szeretsz fókuszálni is.",
        high: "Energikus, társaságkedvelő, magabiztos közösségi helyzetekben.",
      },
      insightsByLocale: {
        en: {
          low: "More introverted; you prefer calm, individual activities.",
          mid: "Balanced social energy: you can lead and also focus independently.",
          high: "Energetic, outgoing, confident in social situations.",
        },
        de: {
          low: "Eher introvertiert; du bevorzugst ruhige, individuelle Aktivitäten.",
          mid: "Ausgewogene soziale Energie: du kannst führen und dich zugleich gut fokussieren.",
          high: "Energisch, gesellig, selbstbewusst in sozialen Situationen.",
        },
      },
    },
    {
      code: "A",
      label: "Barátságosság",
      labelByLocale: {
        en: "Agreeableness",
        de: "Verträglichkeit",
      },
      color: "#34D399",
      description: "Az együttműködési hajlandóságot és a mások iránti türelmet méri. Magas értéknél megbocsátó, kompromisszumkész természet jellemző, míg alacsonyabb értéknél kritikusabb, konfrontatívabb stílus.",
      descriptionByLocale: {
        en: "Measures cooperation and tolerance toward others. High scores indicate a forgiving, compromise-oriented nature, while lower scores reflect a more critical, confrontational style.",
        de: "Misst Kooperationsbereitschaft und Geduld gegenüber anderen. Hohe Werte stehen für eine verzeihende, kompromissbereite Art, niedrigere für einen kritischeren, konfrontativeren Stil.",
      },
      insights: {
        low: "Határozott, kritikus gondolkodás, nem félsz a konfrontációtól.",
        mid: "Rugalmas együttműködés, de meg tudod védeni az álláspontodat.",
        high: "Erős együttműködési készség, konfliktushelyzetben is empatikus.",
      },
      insightsByLocale: {
        en: {
          low: "Decisive and critical; you are not afraid of confrontation.",
          mid: "Flexible cooperation, while still defending your position.",
          high: "Strong cooperative spirit; empathetic even in conflict.",
        },
        de: {
          low: "Entschlossen und kritisch; du scheust keine Konfrontation.",
          mid: "Flexibel kooperativ, kannst aber deinen Standpunkt verteidigen.",
          high: "Hohe Kooperationsbereitschaft; empathisch auch in Konflikten.",
        },
      },
    },
    {
      code: "C",
      label: "Lelkiismeretesség",
      labelByLocale: {
        en: "Conscientiousness",
        de: "Gewissenhaftigkeit",
      },
      color: "#A78BFA",
      description: "A szervezettséget, kitartást és fegyelmet méri. Magas értéknél gondos, tervszerű munkavégzés jellemző, míg alacsonyabb értéknél rugalmasabb, spontánabb hozzáállás.",
      descriptionByLocale: {
        en: "Measures organization, persistence, and discipline. High scores reflect careful, structured work; lower scores indicate a more flexible, spontaneous approach.",
        de: "Misst Organisation, Ausdauer und Disziplin. Hohe Werte stehen für sorgfältiges, planvolles Arbeiten, niedrigere für einen flexibleren, spontanen Ansatz.",
      },
      insights: {
        low: "Spontán, rugalmas megközelítés, kevésbé kötött tervekhez.",
        mid: "Megbízható végrehajtás, de tudsz alkalmazkodni a változásokhoz.",
        high: "Rendszerezett, következetes munkastílus, magas felelősségtudat.",
      },
      insightsByLocale: {
        en: {
          low: "Spontaneous and flexible; you prefer fewer fixed plans.",
          mid: "Reliable execution, with the ability to adapt to change.",
          high: "Structured, consistent work style with strong responsibility.",
        },
        de: {
          low: "Spontan und flexibel; du bevorzugst weniger feste Pläne.",
          mid: "Zuverlässige Umsetzung, mit Anpassungsfähigkeit an Veränderungen.",
          high: "Strukturiert und konsequent mit hohem Verantwortungsbewusstsein.",
        },
      },
    },
    {
      code: "O",
      label: "Nyitottság",
      labelByLocale: {
        en: "Openness",
        de: "Offenheit",
      },
      color: "#38BDF8",
      description: "A szellemi kíváncsiságot, kreativitást és az új élmények iránti nyitottságot méri. Magas értéknél vonzódás az absztrakt gondolkodáshoz, míg alacsonyabb értéknél a gyakorlatias, hagyományos megoldások preferálása.",
      descriptionByLocale: {
        en: "Measures intellectual curiosity, creativity, and openness to new experiences. High scores indicate attraction to abstract thinking, while lower scores prefer practical, traditional approaches.",
        de: "Misst intellektuelle Neugier, Kreativität und Offenheit für neue Erfahrungen. Hohe Werte zeigen eine Neigung zu abstraktem Denken, niedrigere bevorzugen praktische, traditionelle Lösungen.",
      },
      insights: {
        low: "Gyakorlatias, hagyományos megközelítés, bevált módszereket preferálsz.",
        mid: "Nyitott az új ötletekre, de a realitás talaján maradsz.",
        high: "Kíváncsi, kreatív gondolkodás, vonzzák az újító megoldások.",
      },
      insightsByLocale: {
        en: {
          low: "Practical and traditional; you prefer proven methods.",
          mid: "Open to new ideas while staying grounded in reality.",
          high: "Curious and creative; drawn to innovative solutions.",
        },
        de: {
          low: "Praktisch und traditionell; du bevorzugst bewährte Methoden.",
          mid: "Offen für neue Ideen, bleibst aber realitätsnah.",
          high: "Neugierig und kreativ; angezogen von innovativen Lösungen.",
        },
      },
    },
  ],
  questions: [
    // ── H: Őszinteség-Alázat (10 kérdés) ──
    { id: 1, dimension: "H", text: "HEXACO H1 — cseréld ki a hivatalos kérdésre" },
    { id: 2, dimension: "H", text: "HEXACO H2 — cseréld ki a hivatalos kérdésre" },
     /*
    { id: 3, dimension: "H", text: "HEXACO H3 — cseréld ki a hivatalos kérdésre" },
    { id: 4, dimension: "H", text: "HEXACO H4 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 5, dimension: "H", text: "HEXACO H5 — cseréld ki a hivatalos kérdésre" },
    { id: 6, dimension: "H", text: "HEXACO H6 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 7, dimension: "H", text: "HEXACO H7 — cseréld ki a hivatalos kérdésre" },
    { id: 8, dimension: "H", text: "HEXACO H8 — cseréld ki a hivatalos kérdésre" },
    { id: 9, dimension: "H", text: "HEXACO H9 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 10, dimension: "H", text: "HEXACO H10 — cseréld ki a hivatalos kérdésre" },
     /*
    // ── E: Érzelmi stabilitás (10 kérdés) ──
    { id: 11, dimension: "E", text: "HEXACO E1 — cseréld ki a hivatalos kérdésre" },
    { id: 12, dimension: "E", text: "HEXACO E2 — cseréld ki a hivatalos kérdésre" },
    { id: 13, dimension: "E", text: "HEXACO E3 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 14, dimension: "E", text: "HEXACO E4 — cseréld ki a hivatalos kérdésre" },
    { id: 15, dimension: "E", text: "HEXACO E5 — cseréld ki a hivatalos kérdésre" },
    { id: 16, dimension: "E", text: "HEXACO E6 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 17, dimension: "E", text: "HEXACO E7 — cseréld ki a hivatalos kérdésre" },
    { id: 18, dimension: "E", text: "HEXACO E8 — cseréld ki a hivatalos kérdésre" },
    { id: 19, dimension: "E", text: "HEXACO E9 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 20, dimension: "E", text: "HEXACO E10 — cseréld ki a hivatalos kérdésre" },
     /*
    // ── X: Extraverzió (10 kérdés) ──
    { id: 21, dimension: "X", text: "HEXACO X1 — cseréld ki a hivatalos kérdésre" },
    { id: 22, dimension: "X", text: "HEXACO X2 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 23, dimension: "X", text: "HEXACO X3 — cseréld ki a hivatalos kérdésre" },
    { id: 24, dimension: "X", text: "HEXACO X4 — cseréld ki a hivatalos kérdésre" },
    { id: 25, dimension: "X", text: "HEXACO X5 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 26, dimension: "X", text: "HEXACO X6 — cseréld ki a hivatalos kérdésre" },
    { id: 27, dimension: "X", text: "HEXACO X7 — cseréld ki a hivatalos kérdésre" },
    { id: 28, dimension: "X", text: "HEXACO X8 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 29, dimension: "X", text: "HEXACO X9 — cseréld ki a hivatalos kérdésre" },
    { id: 30, dimension: "X", text: "HEXACO X10 — cseréld ki a hivatalos kérdésre" },
    /*
    // ── A: Barátságosság (10 kérdés) ──
    { id: 31, dimension: "A", text: "HEXACO A1 — cseréld ki a hivatalos kérdésre" },
    { id: 32, dimension: "A", text: "HEXACO A2 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 33, dimension: "A", text: "HEXACO A3 — cseréld ki a hivatalos kérdésre" },
    { id: 34, dimension: "A", text: "HEXACO A4 — cseréld ki a hivatalos kérdésre" },
    { id: 35, dimension: "A", text: "HEXACO A5 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 36, dimension: "A", text: "HEXACO A6 — cseréld ki a hivatalos kérdésre" },
    { id: 37, dimension: "A", text: "HEXACO A7 — cseréld ki a hivatalos kérdésre" },
    { id: 38, dimension: "A", text: "HEXACO A8 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 39, dimension: "A", text: "HEXACO A9 — cseréld ki a hivatalos kérdésre" },
    { id: 40, dimension: "A", text: "HEXACO A10 — cseréld ki a hivatalos kérdésre" },

    // ── C: Lelkiismeretesség (10 kérdés) ──
     /*
    { id: 41, dimension: "C", text: "HEXACO C1 — cseréld ki a hivatalos kérdésre" },
    { id: 42, dimension: "C", text: "HEXACO C2 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 43, dimension: "C", text: "HEXACO C3 — cseréld ki a hivatalos kérdésre" },
    { id: 44, dimension: "C", text: "HEXACO C4 — cseréld ki a hivatalos kérdésre" },
    { id: 45, dimension: "C", text: "HEXACO C5 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 46, dimension: "C", text: "HEXACO C6 — cseréld ki a hivatalos kérdésre" },
    { id: 47, dimension: "C", text: "HEXACO C7 — cseréld ki a hivatalos kérdésre" },
    { id: 48, dimension: "C", text: "HEXACO C8 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 49, dimension: "C", text: "HEXACO C9 — cseréld ki a hivatalos kérdésre" },
    { id: 50, dimension: "C", text: "HEXACO C10 — cseréld ki a hivatalos kérdésre" },

    // ── O: Nyitottság (10 kérdés) ──
    { id: 51, dimension: "O", text: "HEXACO O1 — cseréld ki a hivatalos kérdésre" },
    { id: 52, dimension: "O", text: "HEXACO O2 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 53, dimension: "O", text: "HEXACO O3 — cseréld ki a hivatalos kérdésre" },
    { id: 54, dimension: "O", text: "HEXACO O4 — cseréld ki a hivatalos kérdésre" },
    { id: 55, dimension: "O", text: "HEXACO O5 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 56, dimension: "O", text: "HEXACO O6 — cseréld ki a hivatalos kérdésre" },
    { id: 57, dimension: "O", text: "HEXACO O7 — cseréld ki a hivatalos kérdésre" },
    { id: 58, dimension: "O", text: "HEXACO O8 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 59, dimension: "O", text: "HEXACO O9 — cseréld ki a hivatalos kérdésre" },
    { id: 60, dimension: "O", text: "HEXACO O10 — cseréld ki a hivatalos kérdésre" },
     */
  ],
};

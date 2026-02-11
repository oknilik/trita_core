import type { TestConfig } from "./types";

/**
 * Big Five / OCEAN personality test
 * TODO: Replace placeholder questions with validated Big Five question bank (e.g., IPIP-NEO)
 */
export const big5Config: TestConfig = {
  type: "BIG_FIVE",
  name: "Big Five",
  description: "Az öt nagy személyiségvonás (OCEAN) mérése.",
  format: "likert",
  dimensions: [
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
        en: "Measures intellectual curiosity, creativity, and openness to new experiences. High scores are drawn to abstract thinking; lower scores prefer practical, traditional approaches.",
        de: "Misst intellektuelle Neugier, Kreativität und Offenheit für neue Erfahrungen. Hohe Werte neigen zu abstraktem Denken, niedrigere bevorzugen praktische, traditionelle Ansätze.",
      },
      insights: {
        low: "Gyakorlatias, hagyományos megközelítés, bevált módszereket preferálsz.",
        mid: "Nyitott az új ötletekre, de a realitás talaján maradsz.",
        high: "Kíváncsi, kreatív gondolkodás, vonzzák az újító megoldások.",
      },
      insightsByLocale: {
        en: {
          low: "Practical and traditional; you prefer proven methods.",
          mid: "Open to new ideas while staying grounded.",
          high: "Curious and creative; drawn to novel solutions.",
        },
        de: {
          low: "Praktisch und traditionell; du bevorzugst bewährte Methoden.",
          mid: "Offen für neue Ideen, bleibst aber realitätsnah.",
          high: "Neugierig und kreativ; angezogen von neuen Lösungen.",
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
        en: "Measures organization, persistence, and discipline. High scores indicate careful, structured work; lower scores reflect a more flexible, spontaneous style.",
        de: "Misst Organisation, Ausdauer und Disziplin. Hohe Werte stehen für sorgfältiges, planvolles Arbeiten, niedrigere für einen flexibleren, spontanen Stil.",
      },
      insights: {
        low: "Spontán, rugalmas megközelítés, kevésbé kötött tervekhez.",
        mid: "Megbízható végrehajtás, de tudsz alkalmazkodni a változásokhoz.",
        high: "Rendszerezett, következetes munkastílus, magas felelősségtudat.",
      },
      insightsByLocale: {
        en: {
          low: "Spontaneous and flexible; you prefer fewer fixed plans.",
          mid: "Reliable execution with the ability to adapt.",
          high: "Structured and consistent with strong responsibility.",
        },
        de: {
          low: "Spontan und flexibel; du bevorzugst weniger feste Pläne.",
          mid: "Zuverlässige Umsetzung mit Anpassungsfähigkeit.",
          high: "Strukturiert und konsequent mit hohem Verantwortungsbewusstsein.",
        },
      },
    },
    {
      code: "E",
      label: "Extraverzió",
      labelByLocale: {
        en: "Extraversion",
        de: "Extraversion",
      },
      color: "#F59E0B",
      description: "A társas energia szintjét és a szociális magabiztosságot méri. Magas értéknél élénk, társaságkedvelő személyiség rajzolódik ki, míg alacsonyabb értéknél az egyéni tevékenységek és a visszahúzódás a jellemzőbb.",
      descriptionByLocale: {
        en: "Measures social energy and confidence. High scores indicate a lively, sociable personality; lower scores favor solitary activities and reservedness.",
        de: "Misst soziale Energie und Selbstsicherheit. Hohe Werte deuten auf eine lebhafte, gesellige Persönlichkeit hin, niedrigere auf zurückgezogene, individuelle Aktivitäten.",
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
          high: "Energetic, outgoing, confident in social settings.",
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
        en: "Measures cooperation and tolerance toward others. High scores indicate a forgiving, compromise‑oriented nature; lower scores reflect a more critical, confrontational style.",
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
          mid: "Flexible cooperation while defending your position.",
          high: "Strong cooperative spirit; empathetic even in conflict.",
        },
        de: {
          low: "Entschlossen und kritisch; du scheust keine Konfrontation.",
          mid: "Flexibel kooperativ und dennoch standhaft.",
          high: "Hohe Kooperationsbereitschaft; empathisch auch in Konflikten.",
        },
      },
    },
    {
      code: "N",
      label: "Neuroticizmus",
      labelByLocale: {
        en: "Neuroticism",
        de: "Neurotizismus",
      },
      color: "#FB7185",
      description: "Az érzelmi instabilitás és a stresszre való érzékenység mértékét méri. Magas értéknél intenzívebb a szorongás és a negatív érzelmek átélése, míg alacsonyabb értéknél érzelmi stabilitás és nyugodtság jellemző.",
      descriptionByLocale: {
        en: "Measures emotional instability and sensitivity to stress. High scores indicate stronger anxiety and negative affect; lower scores reflect emotional stability and calmness.",
        de: "Misst emotionale Instabilität und Stressanfälligkeit. Hohe Werte stehen für stärkere Ängstlichkeit und negative Affekte, niedrigere für emotionale Stabilität und Gelassenheit.",
      },
      insights: {
        low: "Érzelmileg stabil, ritkán aggódsz vagy idegeskedsz.",
        mid: "Általában kiegyensúlyozott, de stresszhelyzetben fokozott érzékenység.",
        high: "Intenzív érzelmi megélés, hajlamos a szorongásra és stresszre.",
      },
      insightsByLocale: {
        en: {
          low: "Emotionally stable; you rarely worry or feel anxious.",
          mid: "Generally balanced, but more sensitive under stress.",
          high: "Intense emotional experience; prone to anxiety and stress.",
        },
        de: {
          low: "Emotional stabil; du sorgst dich selten oder bist selten nervös.",
          mid: "Meist ausgeglichen, aber unter Stress sensibler.",
          high: "Intensives emotionales Erleben; anfälliger für Angst und Stress.",
        },
      },
    },
  ],
  questions: [
    // ── O: Nyitottság (10 kérdés) ──
    { id: 1, dimension: "O", text: "BIG5 O1 — cseréld ki a hivatalos kérdésre" },
    { id: 2, dimension: "O", text: "BIG5 O2 — cseréld ki a hivatalos kérdésre" },
    { id: 3, dimension: "O", text: "BIG5 O3 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 4, dimension: "O", text: "BIG5 O4 — cseréld ki a hivatalos kérdésre" },
    { id: 5, dimension: "O", text: "BIG5 O5 — cseréld ki a hivatalos kérdésre" },
    { id: 6, dimension: "O", text: "BIG5 O6 — cseréld ki a hivatalos kérdésre", reversed: true },
   /*
    { id: 7, dimension: "O", text: "BIG5 O7 — cseréld ki a hivatalos kérdésre" },
    { id: 8, dimension: "O", text: "BIG5 O8 — cseréld ki a hivatalos kérdésre" },
    { id: 9, dimension: "O", text: "BIG5 O9 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 10, dimension: "O", text: "BIG5 O10 — cseréld ki a hivatalos kérdésre" },

    // ── C: Lelkiismeretesség (10 kérdés) ──
    { id: 11, dimension: "C", text: "BIG5 C1 — cseréld ki a hivatalos kérdésre" },
    { id: 12, dimension: "C", text: "BIG5 C2 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 13, dimension: "C", text: "BIG5 C3 — cseréld ki a hivatalos kérdésre" },
    { id: 14, dimension: "C", text: "BIG5 C4 — cseréld ki a hivatalos kérdésre" },
    { id: 15, dimension: "C", text: "BIG5 C5 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 16, dimension: "C", text: "BIG5 C6 — cseréld ki a hivatalos kérdésre" },
    { id: 17, dimension: "C", text: "BIG5 C7 — cseréld ki a hivatalos kérdésre" },
    { id: 18, dimension: "C", text: "BIG5 C8 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 19, dimension: "C", text: "BIG5 C9 — cseréld ki a hivatalos kérdésre" },
    { id: 20, dimension: "C", text: "BIG5 C10 — cseréld ki a hivatalos kérdésre" },

    // ── E: Extraverzió (10 kérdés) ──
    { id: 21, dimension: "E", text: "BIG5 E1 — cseréld ki a hivatalos kérdésre" },
    { id: 22, dimension: "E", text: "BIG5 E2 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 23, dimension: "E", text: "BIG5 E3 — cseréld ki a hivatalos kérdésre" },
    { id: 24, dimension: "E", text: "BIG5 E4 — cseréld ki a hivatalos kérdésre" },
    { id: 25, dimension: "E", text: "BIG5 E5 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 26, dimension: "E", text: "BIG5 E6 — cseréld ki a hivatalos kérdésre" },
    { id: 27, dimension: "E", text: "BIG5 E7 — cseréld ki a hivatalos kérdésre" },
    { id: 28, dimension: "E", text: "BIG5 E8 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 29, dimension: "E", text: "BIG5 E9 — cseréld ki a hivatalos kérdésre" },
    { id: 30, dimension: "E", text: "BIG5 E10 — cseréld ki a hivatalos kérdésre" },

    // ── A: Barátságosság (10 kérdés) ──
    { id: 31, dimension: "A", text: "BIG5 A1 — cseréld ki a hivatalos kérdésre" },
    { id: 32, dimension: "A", text: "BIG5 A2 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 33, dimension: "A", text: "BIG5 A3 — cseréld ki a hivatalos kérdésre" },
    { id: 34, dimension: "A", text: "BIG5 A4 — cseréld ki a hivatalos kérdésre" },
    { id: 35, dimension: "A", text: "BIG5 A5 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 36, dimension: "A", text: "BIG5 A6 — cseréld ki a hivatalos kérdésre" },
    { id: 37, dimension: "A", text: "BIG5 A7 — cseréld ki a hivatalos kérdésre" },
    { id: 38, dimension: "A", text: "BIG5 A8 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 39, dimension: "A", text: "BIG5 A9 — cseréld ki a hivatalos kérdésre" },
    { id: 40, dimension: "A", text: "BIG5 A10 — cseréld ki a hivatalos kérdésre" },

    // ── N: Neuroticizmus (10 kérdés) ──
    { id: 41, dimension: "N", text: "BIG5 N1 — cseréld ki a hivatalos kérdésre" },
    { id: 42, dimension: "N", text: "BIG5 N2 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 43, dimension: "N", text: "BIG5 N3 — cseréld ki a hivatalos kérdésre" },
    { id: 44, dimension: "N", text: "BIG5 N4 — cseréld ki a hivatalos kérdésre" },
    { id: 45, dimension: "N", text: "BIG5 N5 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 46, dimension: "N", text: "BIG5 N6 — cseréld ki a hivatalos kérdésre" },
    { id: 47, dimension: "N", text: "BIG5 N7 — cseréld ki a hivatalos kérdésre" },
    { id: 48, dimension: "N", text: "BIG5 N8 — cseréld ki a hivatalos kérdésre", reversed: true },
    { id: 49, dimension: "N", text: "BIG5 N9 — cseréld ki a hivatalos kérdésre" },
    { id: 50, dimension: "N", text: "BIG5 N10 — cseréld ki a hivatalos kérdésre" },
     */
  ],
};

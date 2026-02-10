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
      color: "#38BDF8",
      description: "A szellemi kíváncsiságot, kreativitást és az új élmények iránti nyitottságot méri. Magas értéknél vonzódás az absztrakt gondolkodáshoz, míg alacsonyabb értéknél a gyakorlatias, hagyományos megoldások preferálása.",
      insights: {
        low: "Gyakorlatias, hagyományos megközelítés, bevált módszereket preferálsz.",
        mid: "Nyitott az új ötletekre, de a realitás talaján maradsz.",
        high: "Kíváncsi, kreatív gondolkodás, vonzzák az újító megoldások.",
      },
    },
    {
      code: "C",
      label: "Lelkiismeretesség",
      color: "#A78BFA",
      description: "A szervezettséget, kitartást és fegyelmet méri. Magas értéknél gondos, tervszerű munkavégzés jellemző, míg alacsonyabb értéknél rugalmasabb, spontánabb hozzáállás.",
      insights: {
        low: "Spontán, rugalmas megközelítés, kevésbé kötött tervekhez.",
        mid: "Megbízható végrehajtás, de tudsz alkalmazkodni a változásokhoz.",
        high: "Rendszerezett, következetes munkastílus, magas felelősségtudat.",
      },
    },
    {
      code: "E",
      label: "Extraverzió",
      color: "#F59E0B",
      description: "A társas energia szintjét és a szociális magabiztosságot méri. Magas értéknél élénk, társaságkedvelő személyiség rajzolódik ki, míg alacsonyabb értéknél az egyéni tevékenységek és a visszahúzódás a jellemzőbb.",
      insights: {
        low: "Inkább introvertált, a nyugodt, egyéni tevékenységeket preferálod.",
        mid: "Kiegyensúlyozott társas energia: tudsz vezetni, de szeretsz fókuszálni is.",
        high: "Energikus, társaságkedvelő, magabiztos közösségi helyzetekben.",
      },
    },
    {
      code: "A",
      label: "Barátságosság",
      color: "#34D399",
      description: "Az együttműködési hajlandóságot és a mások iránti türelmet méri. Magas értéknél megbocsátó, kompromisszumkész természet jellemző, míg alacsonyabb értéknél kritikusabb, konfrontatívabb stílus.",
      insights: {
        low: "Határozott, kritikus gondolkodás, nem félsz a konfrontációtól.",
        mid: "Rugalmas együttműködés, de meg tudod védeni az álláspontodat.",
        high: "Erős együttműködési készség, konfliktushelyzetben is empatikus.",
      },
    },
    {
      code: "N",
      label: "Neuroticizmus",
      color: "#FB7185",
      description: "Az érzelmi instabilitás és a stresszre való érzékenység mértékét méri. Magas értéknél intenzívebb a szorongás és a negatív érzelmek átélése, míg alacsonyabb értéknél érzelmi stabilitás és nyugodtság jellemző.",
      insights: {
        low: "Érzelmileg stabil, ritkán aggódsz vagy idegeskedsz.",
        mid: "Általában kiegyensúlyozott, de stresszhelyzetben fokozott érzékenység.",
        high: "Intenzív érzelmi megélés, hajlamos a szorongásra és stresszre.",
      },
    },
  ],
  questions: [
    // ── O: Nyitottság (10 kérdés) ──
    { id: 1, dimension: "O", text: "BIG5 O1 — cseréld ki a hivatalos kérdésre" },
    { id: 2, dimension: "O", text: "BIG5 O2 — cseréld ki a hivatalos kérdésre" },
    { id: 3, dimension: "O", text: "BIG5 O3 — cseréld ki a hivatalos kérdésre", reversed: true },
     /*
    { id: 4, dimension: "O", text: "BIG5 O4 — cseréld ki a hivatalos kérdésre" },
    { id: 5, dimension: "O", text: "BIG5 O5 — cseréld ki a hivatalos kérdésre" },
    { id: 6, dimension: "O", text: "BIG5 O6 — cseréld ki a hivatalos kérdésre", reversed: true },
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

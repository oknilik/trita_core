import type { TestConfig } from "./types";

/**
 * MBTI — Myers-Briggs Type Indicator (binary A/B format)
 * TODO: Replace placeholder questions with validated MBTI question bank
 */
export const mbtiConfig: TestConfig = {
  type: "MBTI",
  name: "MBTI",
  description: "Myers-Briggs típusmutató kétválasztós kérdésekkel.",
  format: "binary",
  dimensions: [
    {
      code: "EI",
      label: "Extraverzió / Introverzió",
      color: "#F59E0B",
      description: "Azt méri, honnan meríted az energiádat. Az extravertált a külvilágból, társas interakcióból nyer erőt, míg az introvertált a belső világ felé fordul és az egyedüllétben töltődik.",
      insights: {
        low: "Introvertált: energiádat a belső világodból meríted, elmélyült gondolkodó vagy.",
        mid: "Kiegyensúlyozott: mindkét irányban kényelmesen mozogsz.",
        high: "Extrovertált: energiádat a külvilágból meríted, szívesen vagy társaságban.",
      },
    },
    {
      code: "SN",
      label: "Érzékelés / Intuíció",
      color: "#34D399",
      description: "Az információfeldolgozás módját méri. Az érzékelő a konkrét tényekre és tapasztalatokra támaszkodik, míg az intuitív az összefüggéseket és a lehetőségeket keresi.",
      insights: {
        low: "Intuitív: az összképet és a lehetőségeket keresed, absztrakt gondolkodó.",
        mid: "Kiegyensúlyozott: a konkrét és az elvont között könnyedén váltasz.",
        high: "Érzékelő: a konkrét tényekre és részletekre fókuszálsz, gyakorlatias.",
      },
    },
    {
      code: "TF",
      label: "Gondolkodás / Érzés",
      color: "#818CF8",
      description: "A döntéshozatal alapját méri. A gondolkodó logikus elemzéssel dönt, míg az érző az értékek és az emberi hatás alapján mérlegeli a választásait.",
      insights: {
        low: "Érző: döntéseidet az értékek és az emberek hatása vezérli.",
        mid: "Kiegyensúlyozott: logika és empátia egyaránt jellemez.",
        high: "Gondolkodó: logikus, objektív elemzéssel hozod a döntéseidet.",
      },
    },
    {
      code: "JP",
      label: "Megítélés / Észlelés",
      color: "#FB7185",
      description: "Az életszervezés módját méri. A megítélő tervszerű, szervezett és döntésorientált, míg az észlelő rugalmas, spontán és nyitott az új lehetőségekre.",
      insights: {
        low: "Észlelő: rugalmas, spontán, nyitott az új lehetőségekre.",
        mid: "Kiegyensúlyozott: tudsz tervezni, de alkalmazkodni is.",
        high: "Megítélő: szervezett, tervszerű, szereted a világos kereteket.",
      },
    },
  ],
  questions: [
    // ── E/I: Extraverzió / Introverzió ──
    {
      id: 1,
      dichotomy: "EI",
      optionA: { text: "MBTI EI-1A — cseréld ki", pole: "E" },
      optionB: { text: "MBTI EI-1B — cseréld ki", pole: "I" },
    },
    {
      id: 2,
      dichotomy: "EI",
      optionA: { text: "MBTI EI-2A — cseréld ki", pole: "E" },
      optionB: { text: "MBTI EI-2B — cseréld ki", pole: "I" },
    },
    {
      id: 3,
      dichotomy: "EI",
      optionA: { text: "MBTI EI-3A — cseréld ki", pole: "E" },
      optionB: { text: "MBTI EI-3B — cseréld ki", pole: "I" },
    },
    {
      id: 4,
      dichotomy: "EI",
      optionA: { text: "MBTI EI-4A — cseréld ki", pole: "E" },
      optionB: { text: "MBTI EI-4B — cseréld ki", pole: "I" },
    },
    {
      id: 5,
      dichotomy: "EI",
      optionA: { text: "MBTI EI-5A — cseréld ki", pole: "E" },
      optionB: { text: "MBTI EI-5B — cseréld ki", pole: "I" },
    },

    // ── S/N: Érzékelés / Intuíció ──
    {
      id: 6,
      dichotomy: "SN",
      optionA: { text: "MBTI SN-1A — cseréld ki", pole: "S" },
      optionB: { text: "MBTI SN-1B — cseréld ki", pole: "N" },
    },
    {
      id: 7,
      dichotomy: "SN",
      optionA: { text: "MBTI SN-2A — cseréld ki", pole: "S" },
      optionB: { text: "MBTI SN-2B — cseréld ki", pole: "N" },
    },
    {
      id: 8,
      dichotomy: "SN",
      optionA: { text: "MBTI SN-3A — cseréld ki", pole: "S" },
      optionB: { text: "MBTI SN-3B — cseréld ki", pole: "N" },
    },
    {
      id: 9,
      dichotomy: "SN",
      optionA: { text: "MBTI SN-4A — cseréld ki", pole: "S" },
      optionB: { text: "MBTI SN-4B — cseréld ki", pole: "N" },
    },
    {
      id: 10,
      dichotomy: "SN",
      optionA: { text: "MBTI SN-5A — cseréld ki", pole: "S" },
      optionB: { text: "MBTI SN-5B — cseréld ki", pole: "N" },
    },

    // ── T/F: Gondolkodás / Érzés ──
    {
      id: 11,
      dichotomy: "TF",
      optionA: { text: "MBTI TF-1A — cseréld ki", pole: "T" },
      optionB: { text: "MBTI TF-1B — cseréld ki", pole: "F" },
    },
    {
      id: 12,
      dichotomy: "TF",
      optionA: { text: "MBTI TF-2A — cseréld ki", pole: "T" },
      optionB: { text: "MBTI TF-2B — cseréld ki", pole: "F" },
    },
    {
      id: 13,
      dichotomy: "TF",
      optionA: { text: "MBTI TF-3A — cseréld ki", pole: "T" },
      optionB: { text: "MBTI TF-3B — cseréld ki", pole: "F" },
    },
    {
      id: 14,
      dichotomy: "TF",
      optionA: { text: "MBTI TF-4A — cseréld ki", pole: "T" },
      optionB: { text: "MBTI TF-4B — cseréld ki", pole: "F" },
    },
    {
      id: 15,
      dichotomy: "TF",
      optionA: { text: "MBTI TF-5A — cseréld ki", pole: "T" },
      optionB: { text: "MBTI TF-5B — cseréld ki", pole: "F" },
    },

    // ── J/P: Megítélés / Észlelés ──
    {
      id: 16,
      dichotomy: "JP",
      optionA: { text: "MBTI JP-1A — cseréld ki", pole: "J" },
      optionB: { text: "MBTI JP-1B — cseréld ki", pole: "P" },
    },
    {
      id: 17,
      dichotomy: "JP",
      optionA: { text: "MBTI JP-2A — cseréld ki", pole: "J" },
      optionB: { text: "MBTI JP-2B — cseréld ki", pole: "P" },
    },
    {
      id: 18,
      dichotomy: "JP",
      optionA: { text: "MBTI JP-3A — cseréld ki", pole: "J" },
      optionB: { text: "MBTI JP-3B — cseréld ki", pole: "P" },
    },
    {
      id: 19,
      dichotomy: "JP",
      optionA: { text: "MBTI JP-4A — cseréld ki", pole: "J" },
      optionB: { text: "MBTI JP-4B — cseréld ki", pole: "P" },
    },
    {
      id: 20,
      dichotomy: "JP",
      optionA: { text: "MBTI JP-5A — cseréld ki", pole: "J" },
      optionB: { text: "MBTI JP-5B — cseréld ki", pole: "P" },
    },
  ],
};

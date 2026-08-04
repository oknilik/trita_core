// Vendég-tölcsér (/ → /try → claim) — seed-esetek; a teljes leltár a
// pre-pilot sweep alapján bővül.
export const cases = [
  {
    id: "TRY-01",
    area: "Vendég-tölcsér",
    name: "Vendég teljes kitöltés → teaser → claim regisztrációval",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions: "Inkognitó böngésző, nincs bejelentkezett munkamenet.",
    steps:
      "1. Nyisd meg a főoldalt, kattints a vendég-teszt CTA-ra. 2. Töltsd ki mind a 60 kérdést. 3. A záróoldalon nézd meg a teasert. 4. Kattints az eredmény-mentésre, regisztrálj a teszt-emaillel. 5. Fejezd be az onboardingot.",
    expected:
      "A teaser a tényleges válaszokból számolt kiemeléseket mutatja; regisztráció után a vendég-kitöltés a fiókhoz kapcsolódik, a /profile/results a teljes riportot adja, újra-kitöltés nélkül.",
    automated: "partial",
    coveredBy: "tests/unit/assessment/guest-teaser.test.ts",
    priority: "P1",
  },
  {
    id: "TRY-02",
    area: "Vendég-tölcsér",
    name: "Részleges vendég-kitöltés → visszatérés folytatáshoz",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions: "Inkognitó böngésző.",
    steps:
      "1. Kezdd el a vendég-tesztet, válaszolj kb. 20 kérdésre. 2. Zárd be a fület. 3. Nyisd meg újra a /try oldalt ugyanabban a böngészőben.",
    expected:
      "A záróoldal részleges állapotot ismer fel: a kitöltés folytatható onnan, ahol abbamaradt (nem nullázódik), és a felület jelzi a mentett állapotot.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
];

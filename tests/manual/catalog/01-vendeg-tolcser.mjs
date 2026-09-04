// Vendég-tölcsér (/ landing → /try → /try/complete → claim) — teljes
// leltár a kódból: landing self/team mód, vendég-kitöltés, teaser,
// review=1, claim + hibaágak. Route-ok: src/app/(marketing)/page.tsx,
// src/app/(app)/try/{page,complete,claim}, api/assessment/claim-guest.
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
  {
    id: "TRY-03",
    area: "Vendég-tölcsér",
    name: "Landing self-mód: hero CTA a /try-ra visz",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions: "Inkognitó böngésző, üres localStorage (nincs draft).",
    steps:
      "1. Nyisd meg a főoldalt (/) paraméter nélkül. 2. Nézd meg a mód-váltót és a hero CTA-t. 3. Kattints a fő CTA-ra.",
    expected:
      "A főoldal egyetlen, egyéni ígérettel nyit (nincs self/team váltó). A hero CTA a /try-ra visz, ahol a teszt intro-képernyője jelenik meg (3 lépés + „Kezdjük el” gomb, 60 kérdés / percbecslés).",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "TRY-04",
    area: "Vendég-tölcsér",
    name: "Csapatos átvezető: /team-dynamics + pilot CTA",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions: "Inkognitó böngésző.",
    steps:
      "1. Nyisd meg a főoldalt, és görgess a szilvaszínű „Csapatként folytatnátok?” blokkig. 2. Kattints „A csapatdiagnosztika részletei” linkre. 3. A /team-dynamics oldalon kattints a hero CTA-ra, majd vissza; és az oldal alján a záró CTA-ra is.",
    expected:
      "A főoldali blokk elsődleges gombja a /team-dynamics mélyoldalra visz, a másodlagos link a /pilot oldalra. A mélyoldalon a hero és a szekciók csapatszöveget és szilva-akcentet hordoznak, módváltó nincs. A hero és az oldal-alji elsődleges CTA is a /pilot oldalra visz; a hero másodlagos CTA-ja a /contact oldalra mutat.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "TRY-05",
    area: "Vendég-tölcsér",
    name: "Landing CTA felirata folytatásra vált meglévő draftnál",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions: "TRY-02 utáni állapot: részleges vendég-draft a böngészőben.",
    steps:
      "1. A megkezdett kitöltés után menj vissza a főoldalra (/). 2. Nézd meg a hero és az oldal-alji CTA feliratát. 3. Kattints a CTA-ra.",
    expected:
      "Mindkét CTA a folytatásra utaló feliratot mutatja (nem az induló „ingyenes teszt” szöveget), és a /try-ra visz, ahol a kitöltés a mentett helyről folytatódik.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "TRY-06",
    area: "Vendég-tölcsér",
    name: "Bejelentkezett user a /try-on → journey-átirányítás",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Bejelentkezett, onboardolt fiók.",
    steps: "1. Bejelentkezve írd be kézzel a /try URL-t.",
    expected:
      "Nem jelenik meg vendég-teszt: azonnali átirányítás a /dashboard journey-elosztóra, onnan a szerep/állapot szerinti kezdőoldalra (pl. eredmények vagy /assessment).",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "TRY-07",
    area: "Vendég-tölcsér",
    name: "/try/complete draft nélkül → vissza a /try-ra",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions: "Inkognitó böngésző, üres localStorage.",
    steps: "1. Írd be közvetlenül a /try/complete URL-t kitöltés nélkül.",
    expected:
      "Rövid töltő-spinner után automatikus átirányítás a /try-ra (a záróoldal nem renderel üres/törött teasert draft nélkül).",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "TRY-08",
    area: "Vendég-tölcsér",
    name: "/try/complete részleges drafttal → folytatásra hívó záróoldal",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions: "Részleges vendég-draft (kb. 20 válasz) a böngészőben.",
    steps:
      "1. Részleges kitöltés után írd be kézzel a /try/complete URL-t. 2. Nézd meg a megjelenő tartalmat. 3. Kattints a „Folytatom a tesztet” gombra.",
    expected:
      "„Majdnem kész!” címsor jelenik meg folytatás-CTA-val; NINCS ünneplés, NINCS teaser-kártya és NINCSENEK regisztrációs CTA-k (félkész draftra a claim úgyis hibázna). A CTA visszavisz a kérdéssorba az első megválaszolatlan kérdéshez.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "TRY-09",
    area: "Vendég-tölcsér",
    name: "„Válaszok átnézése” (review=1): teljes drafttal is a kérdéssoron marad",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions:
      "Teljes (60 válaszos) vendég-draft a böngészőben, /try/complete nyitva.",
    steps:
      "1. A záróoldalon kattints a „Válaszok átnézése” linkre. 2. Ellenőrizd, hogy a kérdéssoron maradsz (nincs visszapattanás a záróoldalra). 3. Lépkedj vissza az Előző gombbal, módosíts pár választ. 4. Kattints a „Kiértékelés” gombra.",
    expected:
      "A /try?review=1 a kérdéssort mutatja (a teljes-draft auto-redirect kimarad), a válaszok szerkeszthetők. Kiértékelés után visszakerülsz a záróoldalra, és a teaser a MÓDOSÍTOTT válaszokból számol (markáns módosításnál a típusnév/top-dimenziók változnak).",
    automated: "partial",
    coveredBy: "tests/unit/assessment/guest-teaser.test.ts",
    priority: "P2",
  },
  {
    id: "TRY-10",
    area: "Vendég-tölcsér",
    name: "/try teljes drafttal (review nélkül) → automatikus ugrás a záróoldalra",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions: "Teljes vendég-draft a böngészőben.",
    steps:
      "1. Teljes kitöltés után írd be kézzel a /try URL-t (review paraméter nélkül).",
    expected:
      "Nem a 60. kérdésre esel vissza: automatikus átirányítás a /try/complete záróoldalra, ahol a teaser és a regisztrációs CTA-k látszanak.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "TRY-11",
    area: "Vendég-tölcsér",
    name: "Bejelentkezett user a záróoldalon → automatikus claim-indítás",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "Teljes vendég-draft a böngészőben, közben egy másik fülön bejelentkezés megtörtént.",
    steps:
      "1. Teljes vendég-drafttal jelentkezz be egy fiókba (pl. másik fülön). 2. Nyisd meg a /try/complete oldalt.",
    expected:
      "A záróoldal regisztrációs fal helyett azonnal a /try/claim-re visz, a claim lefut, és az eredmény a bejelentkezett fiókhoz kapcsolódik (továbbirányítás az onboardingra/journey-re).",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "TRY-12",
    area: "Vendég-tölcsér",
    name: "Claim hálózati hiba → hibaüzenet + „Újra” gomb ténylegesen újrapróbál",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions:
      "Teljes vendég-draft, regisztráció folyamatban; a hálózat megszakítható (repülő mód / DevTools offline).",
    steps:
      "1. A záróoldalról indíts regisztrációt, és a /try/claim betöltése ELŐTT kapcsold ki a hálózatot. 2. Várd meg a hibaüzenetet. 3. Kapcsold vissza a hálózatot, kattints az „Újra” gombra.",
    expected:
      "Hibaüzenet + „Újra” gomb jelenik meg (nem végtelen spinner). Az Újra gomb ténylegesen újraindítja a claimet: sikeres mentés után az onboarding jön, a draft csak ekkor törlődik (kudarcnál megmarad, adat nem vész el).",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "TRY-13",
    area: "Vendég-tölcsér",
    name: "Claim draft nélkül (másik böngésző / törölt tár) → csendes továbblépés",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "Friss fiók vendég-kitöltés nélkül EBBEN a böngészőben (pl. a kitöltés másik gépen történt, vagy a localStorage törölve).",
    steps:
      "1. Bejelentkezve írd be kézzel a /try/claim URL-t olyan böngészőben, ahol nincs vendég-draft.",
    expected:
      "Nincs hibaüzenet és nincs beragadt töltés: automatikus továbbirányítás az /onboarding-ra (ill. kész onboardingnál a journey szerinti oldalra); eredmény NEM jön létre üres válaszkészletből.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "TRY-14",
    area: "Vendég-tölcsér",
    name: "Vendég-kitöltés claimje meglévő, eredménnyel bíró fiókba",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "Fiók korábbi kitöltött eredménnyel; ugyanabban a böngészőben friss, teljes vendég-draft (kijelentkezve kitöltve).",
    steps:
      "1. Kijelentkezve töltsd ki a vendég-tesztet a záróoldalig. 2. A záróoldalon a „Bejelentkezés” utat választva lépj be a meglévő fiókba. 3. Várd meg a claimet, nyisd meg a /profile/results oldalt.",
    expected:
      "A claim lefut, és a vendég-kitöltés lesz a legutóbbi eredmény: a /profile/results az ÚJ kitöltés pontszámait mutatja (a kitöltés dátuma a mai nap); a korábbi eredmény nem vész el, de nem ez jelenik meg.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
];

// Fiók és onboarding — Clerk custom sign-up/sign-in flow (email-kód +
// Google SSO) és a kétlépéses onboarding. Kód: src/app/(auth)/sign-up,
// sign-in, sign-out, sso-callback; src/app/(app)/onboarding/{page,
// OnboardingClient}. Consulting-led mód: nincs intent-választó, minden
// regisztráció az explore úton indul.
export const cases = [
  {
    id: "AUTH-01",
    area: "Fiók és onboarding",
    name: "Email-regisztráció happy path: kód kérése → megerősítés → onboarding",
    persona: "új user",
    emails: { fő: "AUTO" },
    preconditions: "Inkognitó böngésző; a teszt-email postafiók elérhető.",
    steps:
      "1. Nyisd meg a /sign-up oldalt. 2. Írd be a teszt-emailt, kattints a „Kód küldése és folytatás” gombra. 3. Nyisd meg a beérkező emailt, másold ki a 6 jegyű kódot. 4. Írd be a kódot, kattints a megerősítésre.",
    expected:
      "A kód-kérés után az „Email megerősítése” képernyő jön a beírt címmel; a levél megérkezik a teszt-postafiókba. Helyes kóddal a munkamenet létrejön, és az /onboarding?intent=explore oldalra kerülsz (consulting-led: intent-választó nem jelent meg a formon).",
    automated: "partial",
    coveredBy: "tests/e2e/journey/journey-entrypoints-smoke.test.ts",
    priority: "P1",
  },
  {
    id: "AUTH-02",
    area: "Fiók és onboarding",
    name: "Regisztráció már létező email-címmel → értelmes hibaüzenet",
    persona: "új user",
    emails: { fő: "AUTO" },
    preconditions: "A teszt-email már regisztrálva van (pl. AUTH-01 után).",
    steps:
      "1. Kijelentkezve nyisd meg a /sign-up oldalt. 2. Írd be a már regisztrált emailt, kérd a kódot.",
    expected:
      "Nem megy tovább a kód-képernyőre: piros hibadoboz jelenik meg „Ez az email cím már regisztrálva van. Jelentkezz be.” szöveggel, és a lap alján elérhető a bejelentkezés link.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "AUTH-03",
    area: "Fiók és onboarding",
    name: "Regisztrációs kód-megerősítés hibás kóddal, majd helyessel",
    persona: "új user",
    emails: { fő: "AUTO" },
    preconditions: "Sign-up kód-képernyő nyitva, a levél megérkezett.",
    steps:
      "1. Írj be szándékosan hibás 6 jegyű kódot, küldd el. 2. Nézd meg a hibaüzenetet. 3. Írd be a helyes kódot, küldd el újra.",
    expected:
      "Hibás kódnál hibaüzenet jelenik meg (érvénytelen kód), a képernyő nem lép tovább és a mező újra szerkeszthető. A helyes kóddal a folyamat rögtön továbbmegy az onboardingra — nem kell újratölteni.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "AUTH-04",
    area: "Fiók és onboarding",
    name: "Kód újraküldése: 30 mp-es visszaszámláló + új levél",
    persona: "új user",
    emails: { fő: "AUTO" },
    preconditions: "Sign-up (vagy sign-in) kód-képernyő nyitva.",
    steps:
      "1. A kód-képernyőn figyeld az újraküldés gombot közvetlenül a megnyitás után. 2. Várd ki a 30 másodpercet. 3. Kattints az újraküldésre. 4. Ellenőrizd a postafiókot.",
    expected:
      "Az első 30 mp-ben a gomb tiltott és visszaszámlálót mutat („Próbáld újra N mp múlva”). Lejárta után kattintható; kattintásra megerősítő jegyzet jelenik meg, és új kód-levél érkezik, amellyel a belépés működik.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "AUTH-05",
    area: "Fiók és onboarding",
    name: "Vissza-lépés a kód-képernyőről az űrlapra",
    persona: "új user",
    emails: { fő: "AUTO" },
    preconditions: "Sign-up kód-képernyő nyitva, esetleg hibaüzenettel.",
    steps:
      "1. A kód-képernyőn kattints a vissza linkre. 2. Nézd meg az űrlap állapotát. 3. Indíts új kód-kérést másik email-címmel.",
    expected:
      "Visszakerülsz a regisztrációs űrlapra; a kód-mező, a hibaüzenet és a visszaszámláló kiürül/nullázódik. Új címmel a kód-kérés tiszta lappal indul.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "AUTH-06",
    area: "Fiók és onboarding",
    name: "Google SSO regisztráció → sso-callback → onboarding",
    persona: "új user",
    emails: { fő: "trita.qa@gmail.com" },
    preconditions:
      "Inkognitó böngésző; a teszt Google-fiók még nincs a platformon regisztrálva.",
    steps:
      "1. A /sign-up oldalon kattints a Google-gombra. 2. Vidd végig a Google-választót a teszt-fiókkal. 3. Figyeld a visszairányítást.",
    expected:
      "A gombon töltés-spinner fut a redirect alatt; a Google-engedély után a /sign-up/sso-callback köztes oldalon át az /onboarding?intent=explore oldalra érkezel bejelentkezve — email-kód lépés nélkül.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "AUTH-07",
    area: "Fiók és onboarding",
    name: "Email-kódos bejelentkezés happy path meglévő fiókkal",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Regisztrált, onboardolt fiók; kijelentkezett állapot.",
    steps:
      "1. Nyisd meg a /sign-in oldalt. 2. Írd be a fiók emailjét, kérd a kódot. 3. Írd be a levélben kapott kódot, erősítsd meg.",
    expected:
      "A kód-képernyő a beírt címet mutatja; helyes kóddal bejelentkezel, és a /dashboard journey-elosztón át a szerep szerinti kezdőoldalra kerülsz (self-usernél az eredményekre/tesztre).",
    automated: "partial",
    coveredBy: "tests/e2e/journey/journey-entrypoints-smoke.test.ts",
    priority: "P1",
  },
  {
    id: "AUTH-08",
    area: "Fiók és onboarding",
    name: "Bejelentkezés nem létező email-címmel → „nincs fiók” hibaág",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions: "Kijelentkezett állapot; a beírt cím sosem regisztrált.",
    steps:
      "1. A /sign-in oldalon írj be egy nem regisztrált emailt, kérd a kódot.",
    expected:
      "Nem jön kód-képernyő: hibadoboz jelenik meg „Nem található fiók ezzel az email címmel.” szöveggel, és a lap alján a regisztrációra mutató link kínálja a helyes utat.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "AUTH-09",
    area: "Fiók és onboarding",
    name: "Bejelentkezési kód-megerősítés hibás kóddal",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Sign-in kód-képernyő nyitva meglévő fiókkal.",
    steps:
      "1. Írj be hibás kódot, küldd el. 2. Utána írd be a helyes kódot.",
    expected:
      "Hibás kódra hibaüzenet jön („Érvénytelen kód…” vagy a Clerk pontosabb üzenete), a munkamenet nem jön létre; a helyes kód ezután gond nélkül beléptet.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "AUTH-10",
    area: "Fiók és onboarding",
    name: "Google SSO bejelentkezés meglévő fiókkal",
    persona: "self-user",
    emails: { fő: "trita.qa@gmail.com" },
    preconditions: "A Google-fiókkal korábban már regisztráltál (AUTH-06).",
    steps:
      "1. Kijelentkezve nyisd meg a /sign-in oldalt. 2. Kattints a Google-gombra, válaszd a már regisztrált fiókot.",
    expected:
      "A /sign-in/sso-callback után bejelentkezve a /dashboard journey-elosztóra érkezel; NEM jön létre duplikált fiók és nem indul újra az onboarding.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "AUTH-11",
    area: "Fiók és onboarding",
    name: "redirect_url megőrzése a teljes auth-flown át (vendég-claim ragasztó)",
    persona: "új user",
    emails: { fő: "AUTO" },
    preconditions: "Kijelentkezett állapot.",
    steps:
      "1. Nyisd meg a /sign-up?redirect_url=/try/claim URL-t. 2. A lap alján kattints a bejelentkezés linkre, majd vissza a regisztrációra — figyeld az URL-t. 3. Vidd végig az email-kódos regisztrációt.",
    expected:
      "A sign-up↔sign-in linkek megőrzik a redirect_url paramétert. A sikeres megerősítés után NEM az onboardingra, hanem a /try/claim célra kerülsz (a vendég-eredmény mentése azonnal indul).",
    automated: "partial",
    coveredBy: "tests/e2e/journey/journey-entrypoints-smoke.test.ts",
    priority: "P1",
  },
  {
    id: "AUTH-12",
    area: "Fiók és onboarding",
    name: "Külső redirect_url elutasítása (open-redirect védelem)",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions: "Kijelentkezett állapot, meglévő fiók.",
    steps:
      "1. Nyisd meg a /sign-in?redirect_url=https://example.com URL-t. 2. Jelentkezz be email-kóddal.",
    expected:
      "A belépés után NEM külső oldalra, hanem az alapértelmezett /dashboard journey-elosztóra kerülsz — a nem „/”-rel kezdődő redirect_url figyelmen kívül marad.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "AUTH-13",
    area: "Fiók és onboarding",
    name: "Kijelentkezés a /sign-out oldalon át",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Bejelentkezett munkamenet.",
    steps:
      "1. Kattints a fejlécben a kijelentkezésre (vagy nyisd meg a /sign-out URL-t). 2. A landing betöltése után próbáld megnyitni a /profile/results oldalt.",
    expected:
      "Rövid spinner után a főoldalra (/) kerülsz kijelentkezve; a védett oldal ezután a /sign-in-re irányít — a munkamenet ténylegesen megszűnt.",
    automated: "partial",
    coveredBy: "tests/e2e/journey/journey-entrypoints-smoke.test.ts",
    priority: "P2",
  },
  {
    id: "ONB-01",
    area: "Fiók és onboarding",
    name: "Onboarding happy path: alapadatok → hozzájárulás → journey",
    persona: "új user",
    emails: { fő: "AUTO" },
    preconditions: "Friss regisztráció után az /onboarding oldalon állsz.",
    steps:
      "1. Töltsd ki az 1. lépést: felhasználónév (2–20 karakter), születési év, nem, ország; a karrier-blokk (végzettség/iparág) maradhat üresen. 2. Kattints a Tovább gombra. 3. A 2. lépésen pipáld be a hozzájárulást, kattints a beküldésre.",
    expected:
      "A lépésjelző 1→2-re vált (a sáv nem mutat 100%-ot az utolsó lépés beküldése előtt). Beküldés után a /dashboard journey-elosztóra kerülsz, amely friss self-usernél az /assessment tesztre visz.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "ONB-02",
    area: "Fiók és onboarding",
    name: "Onboarding 1. lépés validációi: hiányzó/érvénytelen mezők",
    persona: "új user",
    emails: { fő: "AUTO" },
    preconditions: "Az /onboarding 1. lépésén állsz.",
    steps:
      "1. Üres űrlappal kattints a Tovább gombra — figyeld, hova ugrik a fókusz. 2. Írj be 1 karakteres felhasználónevet, lépj ki a mezőből. 3. Írj be érvénytelen születési évet (pl. a tárgyév, vagy 3 számjegy). 4. Töltsd ki a nevet és az évet helyesen, de ne válassz nemet/országot, kattints a Tovább gombra.",
    expected:
      "A Tovább mindig az ELSŐ hibás mezőhöz görget és fókuszál, a mező körül rövid kiemelés villan. A rövid név és az érvénytelen év alatt mező-szintű hibaszöveg jelenik meg (az évnél a megengedett tartománnyal). Hiányzó nem/ország esetén a megfelelő blokk kap kiemelést; a 2. lépésre csak teljes, érvényes űrlappal lehet átjutni.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "ONB-03",
    area: "Fiók és onboarding",
    name: "Onboarding 2. lépés: hozzájárulás-kapu + működő Vissza gomb",
    persona: "új user",
    emails: { fő: "AUTO" },
    preconditions: "Az onboarding 1. lépése érvényesen kitöltve, a 2. lépésen állsz.",
    steps:
      "1. A hozzájárulás bepipálása NÉLKÜL figyeld a beküldő gombot. 2. Nyisd meg az adatkezelési linket. 3. Kattints a Vissza gombra, ellenőrizd az 1. lépés mezőit. 4. Menj újra a 2. lépésre, pipáld be a hozzájárulást és küldd be.",
    expected:
      "Pipa nélkül a beküldő gomb tiltott (halvány, nem kattintható). Az adatkezelési link új fülön nyílik. A Vissza ténylegesen az 1. lépésre visz, az összes korábban beírt érték megőrződik. Pipával a beküldés lefut.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "ONB-04",
    area: "Fiók és onboarding",
    name: "Onboarding mentési hiba → toast, adatvesztés nélkül",
    persona: "új user",
    emails: { fő: "AUTO" },
    preconditions:
      "Onboarding 2. lépés kitöltve; a hálózat megszakítható (DevTools offline).",
    steps:
      "1. A beküldés ELŐTT kapcsold ki a hálózatot. 2. Kattints a beküldésre. 3. Kapcsold vissza a hálózatot és küldd be újra.",
    expected:
      "Hiba-toast jelenik meg, az oldal az onboardingon marad, a kitöltött értékek nem vesznek el; a második beküldés sikeres, és a journey-re továbbít.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "ONB-05",
    area: "Fiók és onboarding",
    name: "Kész onboardinggal az /onboarding újranyitása → journey-átirányítás",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Onboardolt fiók bejelentkezve.",
    steps: "1. Írd be kézzel az /onboarding URL-t.",
    expected:
      "Az űrlap nem jelenik meg újra: automatikus átirányítás a journey szerinti oldalra (eredménnyel a /profile/results, enélkül az /assessment irányba) — az onboarding nem tölthető ki kétszer.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "ONB-06",
    area: "Fiók és onboarding",
    name: "Consulting-led: intent=team mélylink is a személyes onboardingra esik",
    persona: "új user",
    emails: { fő: "AUTO" },
    preconditions: "Friss, onboarding nélküli fiók bejelentkezve.",
    steps:
      "1. Nyisd meg az /onboarding?intent=team URL-t (régi self-serve mélylink).",
    expected:
      "NEM nyílik org-létrehozó wizard: a normál kétlépéses személyes onboarding jelenik meg (szervezet kizárólag admin/tanácsadói úton jön létre).",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
];

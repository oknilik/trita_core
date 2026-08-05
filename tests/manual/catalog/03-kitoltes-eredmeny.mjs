// Kitöltés és eredmény — bejelentkezett /assessment flow (draft, milestone,
// retake, hibaágak) és a /profile/results riport-állapotok + PDF. Kód:
// src/app/(app)/assessment/{page,AssessmentClient}, api/assessment/{draft,
// submit}, src/app/(app)/profile/results/page.tsx, components/profile/
// ProfileTabs. Megjegyzés: SELF_PAYWALL_ENABLED=false — minden user a
// teljes (Plus) riportot kapja, a basic-kapuzás jelenleg inaktív.
export const cases = [
  {
    id: "ASSESS-01",
    area: "Kitöltés és eredmény",
    name: "Bejelentkezett teljes kitöltés: intro → 60 kérdés → kiértékelés → riport",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "Onboardolt fiók, MÉG NINCS kitöltött eredmény és nincs draft.",
    steps:
      "1. Nyisd meg az /assessment oldalt. 2. Az intro-képernyőn kattints a „Kezdjük el” gombra. 3. Töltsd ki mind a 60 kérdést (a mérföldkő-képernyőkön a Tovább gombbal). 4. Az utolsó kérdés után figyeld a „Kiértékelés” gombot / automatikus lezárást. 5. Várd végig a kiértékelő animációt.",
    expected:
      "Az intro csak első nyitáskor látszik (3 lépés + időbecslés). A haladás-sor „N / 60”-at és perc-becslést mutat. A beküldés után rövid kiértékelő képernyő fut, majd (csapat-tagság nélkül) a saját riportra jutsz: a /profile/results a friss kitöltés eredményét mutatja.",
    automated: "partial",
    coveredBy:
      "tests/e2e/assessment/assessment-flow.test.ts; tests/client/assessment/assessment-client.integration.test.tsx",
    priority: "P1",
  },
  {
    id: "ASSESS-02",
    area: "Kitöltés és eredmény",
    name: "Draft-mentés + visszatérés: „Folytatom később” → folytatás ugyanonnan",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Onboardolt fiók eredmény nélkül.",
    steps:
      "1. Kezdd el a tesztet, válaszolj kb. 15 kérdésre. 2. Várj pár másodpercet (szerver-mentés), majd kattints a fejlécben a „Folytatom később” gombra. 3. A megjelenő oldalon kattints a folytatás CTA-ra.",
    expected:
      "Kitöltés közben a fejléc mentett állapotot jelez. A „Folytatom később” a /profile/results-ra visz, ahol NEM a riport, hanem „folyamatban lévő kitöltés” képernyő fogad folytatás-gombbal (nincs redirect-hurok). A folytatás az első megválaszolatlan kérdésnél nyit, a korábbi válaszok megvannak, intro nélkül.",
    automated: "partial",
    coveredBy:
      "tests/e2e/assessment/assessment-flow.test.ts; tests/integration/journey/guardrails.integration.test.ts",
    priority: "P1",
  },
  {
    id: "ASSESS-03",
    area: "Kitöltés és eredmény",
    name: "Szerver-draft másik böngészőből folytatva (kereszt-eszköz)",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "ASSESS-02 szerinti részleges kitöltés az A böngészőben (a 2 mp-es szerver-mentés lefutott).",
    steps:
      "1. Nyiss egy MÁSIK böngészőt/profilt (B), jelentkezz be ugyanazzal a fiókkal. 2. Nyisd meg az /assessment oldalt.",
    expected:
      "A B böngészőben is az első megválaszolatlan kérdésnél folytatódik a kitöltés a szerver-draftból — az intro kimarad, a válaszok száma egyezik az A böngészőben hagyottal.",
    automated: "partial",
    coveredBy: "tests/client/assessment/assessment-client.integration.test.tsx",
    priority: "P2",
  },
  {
    id: "ASSESS-04",
    area: "Kitöltés és eredmény",
    name: "Hiányzó válasz: Tovább/Enter válasz nélkül → kiemelés",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Kitöltés folyamatban, az aktuális kérdés megválaszolatlan.",
    steps:
      "1. Egy megválaszolatlan kérdésen kattints a „Tovább” gombra (vagy nyomj Entert). 2. Figyeld a kérdéskártyát.",
    expected:
      "Nem lépsz tovább: a kérdéskártya rövid (kb. 1 mp) kiemelés-villanást kap, jelezve hogy előbb választani kell; a Tovább gomb válasz nélkül halvány/inaktív állapotú.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "ASSESS-05",
    area: "Kitöltés és eredmény",
    name: "Mérföldkő-képernyők 25/50/75%-nál",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Kitöltés folyamatban.",
    steps:
      "1. Válaszolj a kérdések 25%-áig (15. válasz körül). 2. Nézd meg a közbeékelt képernyőt. 3. Kattints az Előző gombra, majd a Tovább gombra. 4. Haladj tovább az 50% és 75% jelekig.",
    expected:
      "Mindhárom jelnél egyszeri „Mérföldkő” közjáték jön (cím + tipp + 10 szegmenses haladás-sáv); az Előző visszazárja a kérdéshez, a Tovább a következő kérdésre visz. Ugyanaz a mérföldkő visszalépegetésnél nem jön elő újra.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "ASSESS-06",
    area: "Kitöltés és eredmény",
    name: "Automatikus továbblépés kapcsoló ki/be",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Kitöltés folyamatban.",
    steps:
      "1. Alapállapotban válassz egy értéket — figyeld a lépést. 2. Kapcsold KI a lábléc „automatikus továbblépés” pipáját. 3. Válassz értéket a következő kérdésen. 4. Módosítsd a választ, majd kattints a Tovább gombra.",
    expected:
      "Bekapcsolva a válasz után rögtön (töredék mp) a következő kérdés jön. Kikapcsolva a kérdésen maradsz, a válasz szabadon módosítható, és csak a Tovább gomb léptet.",
    automated: "partial",
    coveredBy: "tests/client/assessment/assessment-client.integration.test.tsx",
    priority: "P3",
  },
  {
    id: "ASSESS-07",
    area: "Kitöltés és eredmény",
    name: "Billentyű-gyorsítók: 1–5 válasz, Enter továbblépés",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Kitöltés folyamatban, asztali böngésző.",
    steps:
      "1. Asztali nézetben keresd meg a billentyű-tippet a kérdés alatt. 2. Nyomd meg a 3-as billentyűt egy kérdésen. 3. Kikapcsolt auto-továbblépésnél nyomj Entert.",
    expected:
      "A tipp asztali nézetben látszik. Az 1–5 billentyű a megfelelő Likert-értéket választja ki; az Enter a Tovább gombbal azonosan lép (válasz nélkül csak a kiemelés-villanást adja).",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "ASSESS-08",
    area: "Kitöltés és eredmény",
    name: "Kész-állapot: /assessment meglévő eredménnyel → retake-sáv → újratöltés",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Kitöltött eredmény van, folyamatban lévő draft NINCS.",
    steps:
      "1. Írd be kézzel az /assessment URL-t. 2. Olvasd el a megjelenő sávot a /profile/results tetején. 3. Kattints az „Újratöltés indítása” gombra. 4. Ellenőrizd a megnyíló tesztet.",
    expected:
      "Az /assessment nem enged néma újrakitöltést: átirányít a /profile/results?retake=true oldalra, ahol magyarázó sáv közli, hogy az eredmény kész, és mi történik újratöltéskor. Az „Újratöltés indítása” az /assessment?confirmed=true címre visz: a teszt ÜRESEN indul (0 válasz, régi draft-maradvány nélkül).",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "ASSESS-09",
    area: "Kitöltés és eredmény",
    name: "Retake végigvitele: az új kitöltés lesz a megjelenő eredmény",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "ASSESS-08 után az újratöltés elindítva.",
    steps:
      "1. Töltsd ki újra mind a 60 kérdést, markánsan más válaszokkal. 2. A kiértékelés után nyisd meg a /profile/results oldalt. 3. Hasonlítsd össze a pontszámokat/típuscímkét a korábbival.",
    expected:
      "A riport az ÚJ kitöltésből számol (a kitöltés dátuma frissül, a dimenzió-pontszámok az új válaszokat tükrözik); a megkezdett retake-draft a beküldéssel eltűnik.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "ASSESS-10",
    area: "Kitöltés és eredmény",
    name: "Beküldési hiba: hálózat-kiesés a Kiértékelés alatt",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "Mind a 60 kérdés megválaszolva, a hálózat megszakítható (DevTools offline).",
    steps:
      "1. Az utolsó válasz ELŐTT kapcsold ki a hálózatot. 2. Add meg az utolsó választ / kattints a „Kiértékelés” gombra. 3. Figyeld a visszajelzést. 4. Kapcsold vissza a hálózatot és próbáld újra.",
    expected:
      "A kiértékelő animáció megszakad, hiba-toast jelenik meg; a kérdéssor válaszai MEGMARADNAK (nem nullázódik), és a Kiértékelés újra megnyomható — online állapotban a beküldés lefut, az eredmény létrejön.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "ASSESS-11",
    area: "Kitöltés és eredmény",
    name: "Draft-szigetelés: kijelentkezés után a vendég/másik user nem örökli a válaszokat",
    persona: "self-user",
    emails: { fő: "AUTO", másik: "AUTO" },
    preconditions:
      "Bejelentkezett user részleges kitöltéssel ugyanabban a böngészőben.",
    steps:
      "1. Bejelentkezve válaszolj kb. 10 kérdésre az /assessment oldalon. 2. Jelentkezz ki. 3. Nyisd meg vendégként a /try oldalt. 4. Jelentkezz be a MÁSIK teszt-fiókkal és nyisd meg az /assessment oldalt.",
    expected:
      "A vendég-teszt üresen, az intróval indul (nem örökli a user válaszait), és a másik fiók kitöltése is tiszta lappal kezdődik — a bejelentkezett draft profil-azonosítóval szigetelt kulcson tárolódik.",
    automated: "partial",
    coveredBy: "tests/unit/assessment/assessment-draft-storage.test.ts",
    priority: "P3",
  },
  {
    id: "RES-01",
    area: "Kitöltés és eredmény",
    name: "Riport teljes tartalma friss kitöltés után (Plus-szint mindenkinek)",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Kitöltött eredmény van, observer-visszajelzés nincs.",
    steps:
      "1. Nyisd meg a /profile/results oldalt. 2. Menj végig a hero-n és az „Eredmények” fül szekcióin. 3. Ellenőrizd a dimenzió-kártyákat és a munkastílus-szekciókat.",
    expected:
      "A hero a neved + kitöltés-dátum + típuscímke + karakter-ábra kombinációt mutatja. Mind a 6 HEXACO-dimenzió pontszámmal és sávos megjelenítéssel + szöveges insighttal jelenik meg; a fejlődési fókusz és a Plus-tartalom (hogyan dolgozol, nyomás alatt, ideális környezet, szerep-illeszkedés) is látszik — kapuzás/paywall NINCS (a paywall kikapcsolt).",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "RES-02",
    area: "Kitöltés és eredmény",
    name: "Üres állapot: nincs eredmény és nincs draft → barátságos indító",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "Onboardolt fiók kitöltés nélkül (a journey-t megkerülve, pl. kézi URL-lel).",
    steps:
      "1. Írd be kézzel a /profile/results URL-t eredmény nélküli fiókkal. 2. Nézd meg a képernyőt és a fejléc-navigációt.",
    expected:
      "Nincs kényszer-redirect a tesztre: indító képernyő jön „teszt indítása” CTA-val, miközben a teljes navigáció (profil, kijelentkezés) elérhető marad. A CTA az /assessment oldalra visz.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "RES-03",
    area: "Kitöltés és eredmény",
    name: "Külső kép fül observer-adat nélkül: összevetés-placeholder + meghívó-kezelő",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "Kitöltött eredmény, 0 beérkezett observer-visszajelzés, nincs org-tagság.",
    steps:
      "1. A /profile/results oldalon válts a „Külső kép” (összehasonlítás) fülre. 2. Nézd meg az összevetés-blokkot és a meghívó-szekciót.",
    expected:
      "Az összevetés observer-adat nélküli állapotot mutat (nem üres/törött diagram, hanem magyarázat, hogy külső visszajelzéssel nyílik meg), és ugyanazon a fülön ott a meghívó-kezelő, ahonnan ismerős hívható meg — zsákutca nélkül.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "RES-04",
    area: "Kitöltés és eredmény",
    name: "PDF-letöltés a hero-ból: generálás-visszajelzés + tartalom-egyezés",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Kitöltött eredmény, observer-adat nincs.",
    steps:
      "1. A /profile/results hero-jában kattints a PDF-gombra. 2. Figyeld a gomb állapotát generálás közben és után. 3. Nyisd meg a letöltött PDF-et, vesd össze a képernyővel.",
    expected:
      "A gomb generálás alatt pörgő állapotot, végén rövid kész-visszajelzést mutat. A PDF letöltődik, és a képernyővel egyező adatokat hoz: név, típuscímke, 6 dimenzió a kanonikus HEXACO-sorrendben, munkastílus-blokkok; observer-összevetés blokk NINCS benne (nincs elég observer-adat).",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "RES-05",
    area: "Kitöltés és eredmény",
    name: "Régi fül-linkek átirányítása: career/workstyle/invites paraméterek",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Kitöltött eredmény van.",
    steps:
      "1. Nyisd meg sorban: /profile/results?tab=career, ?tab=workstyle, ?tab=invites URL-eket.",
    expected:
      "A ?tab=career a /career oldalra irányít át; a ?tab=workstyle az Eredmények fület nyitja (a munkastílus ott szekció); a ?tab=invites a Külső kép fülre esik — egyik régi link sem fut 404-re vagy üres fülre.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "RES-06",
    area: "Kitöltés és eredmény",
    name: "Retake-sáv „Maradok az eredményeknél” ága",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "Kitöltött eredmény van, a /profile/results?retake=true sáv látszik (ASSESS-08 1–2. lépése).",
    steps:
      "1. A retake-sávban kattints a „Maradok az eredményeknél” gombra.",
    expected:
      "A sáv eltűnik (az URL paraméter nélküli /profile/results-ra vált), a meglévő riport változatlanul látszik, új kitöltés NEM indul és draft nem jön létre.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
];

// Observer-visszajelzés — meghívó-küldés, /observe/[token] kitöltő,
// kampány-alapú jóváhagyás, küszöbök és a comparison tab állapotai.
// Forrás-kód: src/app/api/observer/*, src/app/(app)/observe/[token]/,
// src/lib/observer/, src/lib/observer-flow.ts,
// src/components/results/{InvitationsTab,ComparisonTab,ObserverFlowStatusCard}.tsx,
// src/components/team/ObserverApprovalCard.tsx.
export const cases = [
  // ── Meghívó-küldés (limit, duplikáció, saját cím, e-mail) ────────────────
  {
    id: "OBS-01",
    area: "Observer-visszajelzés",
    name: "Email-alapú observer-meghívó küldése → meghívó e-mail kézbesítése",
    persona: "self-user (Plus, nem org-tag)",
    emails: { fő: "AUTO", observer: "AUTO" },
    preconditions:
      "A fő fiók regisztrált, self-kitöltése kész (TSFI-S). Az observer-cím postafiókja elérhető.",
    steps:
      "1. Lépj be a fő fiókkal, nyisd meg a /profile/results?tab=comparison oldalt. 2. A meghívó-blokk űrlapjába írd be az observer teszt-emailt, küldd el. 3. Nézd meg a listát és a számlálókat. 4. Nyisd meg az observer postafiókját.",
    expected:
      "A meghívó a Függőben csoportba kerül (⏳, „Ismerős” típus-badge), a Kiküldve számláló 1/5-re nő. Az observer-címre observer-meghívó levél érkezik, benne a fő neve és működő /observe/<token> link. A link 30 napig érvényes (a lista dátuma a küldés napja).",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "OBS-02",
    area: "Observer-visszajelzés",
    name: "Meghívó-limit: az 5. aktív meghívó után az űrlap lezár, törléssel felszabadul",
    persona: "self-user (Plus)",
    emails: { fő: "AUTO" },
    preconditions: "A fő fióknak nincs korábbi observer-meghívója.",
    steps:
      "1. A /profile/results?tab=comparison meghívó-blokkjában küldj ki 5 meghívót (email-es és üres/link-alapú vegyesen). 2. Figyeld a Kiküldve számlálót és az űrlapot. 3. Próbálj 6.-at küldeni. 4. Törölj (✕) egy függő meghívót, nézd meg újra az űrlapot.",
    expected:
      "5 aktív meghívónál a számláló 5/5, az űrlap helyén a limit-üzenet jelenik meg — 6. meghívó nem adható fel (API-szinten INVITE_LIMIT_REACHED). A limitbe minden nem-visszavont meghívó beleszámít (függő és kitöltött is); egy meghívó visszavonása után az űrlap újra elérhető (4/5).",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "OBS-03",
    area: "Observer-visszajelzés",
    name: "Duplikált email-cím: ugyanarra a címre nem megy ki második aktív meghívó",
    persona: "self-user (Plus)",
    emails: { fő: "AUTO", observer: "AUTO" },
    preconditions: "OBS-01 mintájára már él egy függő meghívó az observer-címre.",
    steps:
      "1. A meghívó-űrlapba írd be újra ugyanazt az observer-emailt, küldd el. 2. Ismételd meg a címet eltérő kis/nagybetűkkel (pl. csupa nagybetűs local part). 3. Ellenőrizd a listát.",
    expected:
      "Mindkét próbára lokalizált hibaüzenet jön (DUPLICATE_INVITE_EMAIL kód alapján), új sor nem keletkezik — az egyezés kis/nagybetű-független. Visszavont (törölt) meghívó címére viszont újra lehet küldeni.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "OBS-04",
    area: "Observer-visszajelzés",
    name: "Saját email-cím tiltása a meghívó-űrlapon",
    persona: "self-user (Plus)",
    emails: { fő: "AUTO" },
    preconditions: "A fő fiók belépve, meghívó-keret szabad.",
    steps:
      "1. A meghívó-űrlapba írd be a fő fiók SAJÁT email-címét, küldd el. 2. Próbáld meg eltérő kis/nagybetűzéssel is.",
    expected:
      "Lokalizált hibaüzenet (SELF_INVITE kód alapján), meghívó nem jön létre egyik írásmóddal sem — saját magát senki nem hívhatja meg observernek.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },

  // ── /observe/[token] állapotok ───────────────────────────────────────────
  {
    id: "OBS-05",
    area: "Observer-visszajelzés",
    name: "Érvényes token: teljes observer-kitöltés (intro → 60 item → confidence → done)",
    persona: "vendég (observer, belépés nélkül)",
    emails: { fő: "AUTO", observer: "AUTO" },
    preconditions:
      "A fő fiókból email-es meghívó kiküldve az observer-címre (OBS-01 lépései).",
    steps:
      "1. Inkognitó böngészőben nyisd meg a meghívó-emailben kapott /observe/<token> linket. 2. Az intro-oldalon válassz kapcsolat-típust és ismeretségi időt, indíts. 3. Válaszold meg mind a 60 kérdést (figyeld a 25/50/75%-os mérföldkő-képernyőket és a haladásjelzőt). 4. A confidence-kérdés után küldd be. 5. A fő fiókkal nézd meg a meghívó-listát.",
    expected:
      "A kitöltő végig a fő nevét mutatja („kire gondolj” sáv). Beküldés után köszönő (done) képernyő jelenik meg regisztrációs CTA-val; a fő listájában a meghívó a Beérkezett csoportba kerül „Kitöltve” státusszal.",
    automated: "partial",
    coveredBy:
      "tests/e2e/observer/observer-flow.test.ts (token→submit→COMPLETED) + tests/integration/observer/observer-token-acceptance.integration.test.ts",
    priority: "P1",
  },
  {
    id: "OBS-06",
    area: "Observer-visszajelzés",
    name: "Lejárt token (30 nap): lejárati képernyő, kitöltés nem indítható",
    persona: "vendég (observer)",
    emails: { fő: "AUTO" },
    preconditions:
      "Teszt-DB-ben egy meghívó expiresAt mezője a múltba állítva (dev-segítség kell — a lejárat normál úton a küldéstől 30 nap).",
    steps:
      "1. Nyisd meg a lejáratott meghívó /observe/<token> linkjét inkognitóban. 2. Próbálj bármilyen módon kitöltést indítani.",
    expected:
      "⏰ ikonos „lejárt” kártya jelenik meg (observer.expiredTitle/Body szövegek), kérdőív-űrlap nem érhető el; közvetlen API-beadás is INVITE_EXPIRED hibát ad.",
    automated: "partial",
    coveredBy:
      "tests/e2e/observer/observer-flow.test.ts (expired state) + tests/unit/observer/token-validation.test.ts",
    priority: "P2",
  },
  {
    id: "OBS-07",
    area: "Observer-visszajelzés",
    name: "Visszavont meghívó linkje: inaktív képernyő",
    persona: "vendég (observer)",
    emails: { fő: "AUTO" },
    preconditions: "A fő fióknak van függő link-alapú meghívója.",
    steps:
      "1. A fő fiókban másold ki a függő meghívó linkjét, majd vond vissza (✕). 2. Inkognitóban nyisd meg a kimásolt linket.",
    expected:
      "😕 ikonos „már nem aktív” kártya (observer.inactiveTitle/Body), kérdőív nem indítható. A fő listájából a meghívó eltűnt, a keret (N/5) felszabadult.",
    automated: "partial",
    coveredBy:
      "tests/integration/observer/observer-token-acceptance.integration.test.ts (canceled → INVITE_CANCELED) + tests/unit/observer/token-validation.test.ts",
    priority: "P2",
  },
  {
    id: "OBS-08",
    area: "Observer-visszajelzés",
    name: "Már kitöltött token újranyitása: köszönő állapot, dupla beadás nincs",
    persona: "vendég (observer)",
    emails: { fő: "AUTO", observer: "AUTO" },
    preconditions: "OBS-05 lefutott: a token kitöltött (COMPLETED).",
    steps:
      "1. Nyisd meg újra ugyanazt a /observe/<token> linket (akár másik böngészőben is). 2. Próbálkozz újrakitöltéssel.",
    expected:
      "🎉 ikonos „már kitöltötted” kártya (observer.completeTitle/Body), az űrlap nem érhető el; ismételt API-beadás ALREADY_USED hibát ad, a főnél NEM keletkezik második beérkezett értékelés.",
    automated: "partial",
    coveredBy: "tests/e2e/observer/observer-flow.test.ts (already completed reopen)",
    priority: "P2",
  },
  {
    id: "OBS-09",
    area: "Observer-visszajelzés",
    name: "Blokkolt indítás utáni figyelmeztetés az intrón (UX-B20)",
    persona: "vendég (observer)",
    emails: { fő: "AUTO" },
    preconditions: "Érvényes, még nem kitöltött meghívó-link.",
    steps:
      "1. Nyisd meg a /observe/<token> intro-oldalát. 2. NE válassz se kapcsolat-típust, se időtartamot, kattints a Kezdés gombra. 3. Válaszd ki csak az egyiket, kattints újra. 4. Válaszd ki mindkettőt, kattints újra.",
    expected:
      "A figyelmeztető szöveg („válaszd ki mindkettőt”) CSAK a blokkolt indítási kísérlet UTÁN jelenik meg — előre nem szidjuk a kitöltőt, és a gomb nem letiltott állapotú. Mindkét mező kiválasztása után az indítás továbbengedi a kérdőívre.",
    automated: "full",
    coveredBy:
      "tests/client/observer/observer-client.integration.test.tsx (UX-B20: blocked start + hint only after attempt)",
    priority: "P3",
  },

  // ── Draft, confidence, menet közbeni visszavonás ─────────────────────────
  {
    id: "OBS-10",
    area: "Observer-visszajelzés",
    name: "Observer-oldali draft: szerver-mentés + visszatérés másik böngészőből",
    persona: "vendég (observer)",
    emails: { fő: "AUTO", observer: "AUTO" },
    preconditions: "Érvényes külsős meghívó-link (email-es vagy link-alapú).",
    steps:
      "1. Kezdd el a kitöltést, válaszolj kb. 20 kérdésre, majd várj pár másodpercet (a mentés 2 mp-es késleltetéssel fut). 2. Zárd be a fület. 3. Nyisd meg a linket MÁSIK böngészőben/profilban (localStorage nélkül). 4. Folytasd egy-két válasszal, zárd be, és nyisd meg újra az eredeti böngészőben.",
    expected:
      "A kitöltés mindkét visszatérésnél az első megválaszolatlan kérdés oldalán folytatódik, a korábbi válaszok megőrződnek (a szerver-oldali draft tokenhez kötött, nem géphez); a már elért mérföldkő-képernyők nem ismétlődnek. A fejlécben látszik a mentett állapot jelzése.",
    automated: "partial",
    coveredBy:
      "tests/client/observer/observer-client.integration.test.tsx (draft resume) + tests/integration/observer/observer-token-acceptance.integration.test.ts (draft törlődik submit után)",
    priority: "P1",
  },
  {
    id: "OBS-11",
    area: "Observer-visszajelzés",
    name: "Confidence rating: kötelező az utolsó lépésben, 1–5 skálán mentődik",
    persona: "vendég (observer)",
    emails: { fő: "AUTO" },
    preconditions: "Observer-kitöltés az utolsó kérdésig kitöltve.",
    steps:
      "1. Az utolsó kérdés után érkezz a confidence-képernyőre („mennyire magabiztosan ítélted meg…”). 2. Kattints a Beküldés gombra kiválasztott érték NÉLKÜL. 3. Válassz egy 1–5 értéket, küldd be. 4. Ellenőrizd a Vissza gombot is: a confidence-ről visszaléphetsz a kérdésekhez.",
    expected:
      "Érték nélkül a beküldés nem fut le — a confidence-kártya kiemelést kap (highlight), a gomb halvány. Érték kiválasztása után a beküldés sikeres (a válasz a beadással együtt tárolódik); a Vissza gomb a kérdőívhez visz válaszvesztés nélkül.",
    automated: "partial",
    coveredBy:
      "tests/integration/observer/observer-token-acceptance.integration.test.ts (confidence tárolás/null) + tests/client/observer/observer-client.integration.test.tsx (confidence fázis)",
    priority: "P2",
  },
  {
    id: "OBS-12",
    area: "Observer-visszajelzés",
    name: "Kitöltés közben visszavont meghívó: beküldéskor inaktív képernyő, nem nyers hiba",
    persona: "vendég (observer) + self-user",
    emails: { fő: "AUTO", observer: "AUTO" },
    preconditions: "Függő meghívó, az observer elkezdte a kitöltést.",
    steps:
      "1. Az observer töltse a kérdőívet a confidence-lépésig. 2. Közben a fő fiókban vond vissza a meghívót (✕). 3. Az observer válasszon confidence-értéket és küldje be.",
    expected:
      "A beküldés nem sikerül, de nem generikus hibát dob: a kitöltő a 😕 „már nem aktív” képernyőre vált (INVITE_CANCELED ág), a válaszok nem kerülnek be, a főnél nem jelenik meg beérkezett értékelés.",
    automated: "partial",
    coveredBy:
      "tests/client/observer/observer-client.integration.test.tsx (INVITE_CANCELED → inactive UI)",
    priority: "P2",
  },
  {
    id: "OBS-13",
    area: "Observer-visszajelzés",
    name: "Belső kolléga-meghívó: kollégalistából, app-értesítés + címzett-kötés",
    persona: "org-tag (self-user) + kolléga",
    emails: { fő: "AUTO", kolléga: "AUTO", külsős: "AUTO" },
    preconditions:
      "A fő és a kolléga ugyanazon szervezet (és közös csapat) tagja, mindkettő kész self-kitöltéssel. A külsős cím nem tagja a szervezetnek.",
    steps:
      "1. A fő a Külső kép fül kolléga-választójából hívja meg a kollégát. 2. A kolléga fiókjával nézd meg a harang-értesítést és a postafiókot, nyisd meg a linket. 3. Nyisd meg ugyanazt a linket kijelentkezve, majd a külsős (harmadik) fiókkal belépve is. 4. A kollégával kezdd meg a kitöltést.",
    expected:
      "A meghívó a listában „Csapattárs” badge-dzsel jelenik meg (közös csapat nélkül „Szervezeti”), a kolléga-sor „Meghívva” jelölést kap. A kolléga app-értesítést (harang) ÉS emailt kap a linkkel. A link kijelentkezve a sign-in-re irányít, más belépett userrel 🔒 „nem neked szól” kártyát ad; a kollégánál a kapcsolat-típus fixen „kolléga” (a többi opció szürke).",
    automated: "partial",
    coveredBy:
      "tests/unit/observer/invite-policy.test.ts (TEAM/ORG típus) + tests/integration/observer/observer-link-service.integration.test.ts (címzett-eltérés elutasítása)",
    priority: "P2",
  },

  // ── Kampány-alapú külső meghívó: jóváhagyási kör ─────────────────────────
  {
    id: "OBS-14",
    area: "Observer-visszajelzés",
    name: "Kampányban külső meghívó → jóváhagyásra vár + jóváhagyás-kérés a vezetőknek",
    persona: "org-tag (kampány-résztvevő)",
    emails: { fő: "AUTO", observer: "AUTO", vezető: "AUTO" },
    preconditions:
      "Aktív observer-lépéses (OBSERVER_360) kampány, amelyben a külső értékelők NEM engedélyezettek szabadon (allowExternalObservers ki); a fő résztvevő, a vezető ORG_MANAGER vagy org admin ugyanabban a szervezetben.",
    steps:
      "1. A fő a Külső kép fülön a külső (email-es) űrlapból hívja meg az observer-címet. 2. Figyeld a visszajelzést és a meghívó-listát. 3. Nézd meg az observer postafiókját. 4. Lépj be a vezetővel, nyisd meg a harang-panelt.",
    expected:
      "A fő toastot kap („jóváhagyásra vár”), a meghívó 🔒 „Jóváhagyásra vár” státusszal listázódik. Az observer-címre EKKOR MÉG NEM megy levél. A vezető (és minden org admin/menedzser/tanácsadó) observer-kategóriájú app-értesítést kap a fő nevével és a célszeméllyel, linkje a csapat Tagok fülére visz.",
    automated: "partial",
    coveredBy: "tests/unit/observer/invite-policy.test.ts (jóváhagyási szabály)",
    priority: "P1",
  },
  {
    id: "OBS-15",
    area: "Observer-visszajelzés",
    name: "Külső meghívó jóváhagyása: e-mail kimegy, a meghívó tag értesül",
    persona: "vezető (ORG_MANAGER / org admin)",
    emails: { fő: "AUTO", observer: "AUTO", vezető: "AUTO" },
    preconditions:
      "OBS-14 lefutott (annak fiókjaival folytatod): van jóváhagyásra váró külső meghívó.",
    steps:
      "1. A vezetővel nyisd meg a /team/<id>?tab=members oldalt — „Jóváhagyásra váró külső értékelők” kártya. 2. Kattints a jóváhagyásra. 3. Nézd meg az observer postafiókját. 4. A fő fiókkal ellenőrizd a harangot és a meghívó-listát.",
    expected:
      "A kártyáról a tétel eltűnik, a meghívó Függőben státuszra vált. Az observer MOST kapja meg a meghívó-emailt működő linkkel (a 30 napos lejárat a jóváhagyástól számít). A fő „jóváhagyva” app-értesítést kap, amely az eredmény-oldal Külső kép fülére linkel.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "OBS-16",
    area: "Observer-visszajelzés",
    name: "Külső meghívó elutasítása: visszavonás + értesítés, e-mail nem megy ki",
    persona: "vezető (ORG_MANAGER / org admin)",
    emails: { fő: "AUTO", observer: "AUTO", vezető: "AUTO" },
    preconditions:
      "OBS-14 lépéseivel ÚJ jóváhagyásra váró külső meghívó (friss observer-címmel).",
    steps:
      "1. A vezetővel a csapat Tagok fülén a jóváhagyó kártyán kattints az elutasításra. 2. Nézd meg az observer postafiókját. 3. A fő fiókkal ellenőrizd a harangot és a meghívó-listát. 4. Ha a link korábban kimásolásra került, nyisd meg.",
    expected:
      "A meghívó visszavont (CANCELED) lesz és eltűnik a függő listából; az observer-címre SOHA nem megy levél. A fő „elutasítva” app-értesítést kap a célszemély nevével. A link megnyitva a 😕 inaktív kártyát adja.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },

  // ── Küszöb az eredmény-oldalon (org: min. 3 értékelő) ────────────────────
  {
    id: "OBS-17",
    area: "Observer-visszajelzés",
    name: "Kampány-vezérelt küszöb: 2 kitöltésnél az összevetés zárva, 2/3 állapot látszik",
    persona: "org-tag (kampány-résztvevő)",
    emails: { fő: "AUTO" },
    preconditions:
      "A fő aktív observer-kampány résztvevője (OBS-14 org-környezete), és PONTOSAN 2 beérkezett observer-kitöltése van (két link-alapú meghívó inkognitóban kitöltve).",
    steps:
      "1. A fő fiókkal nyisd meg a /profile/results?tab=comparison oldalt. 2. Nézd meg az állapot-kártyát és a foglaltság-jelzőt. 3. Keresd az összevetés-grafikonokat. 4. Nézd meg a meghívó-blokk info-sávját.",
    expected:
      "Önkép–külső kép grafikon MÉG NINCS: „Külső visszajelzés — folyamatban” kártya jelenik meg 3 helyből 2 kipipált körrel (2/3 számláló), alatta a meghívó-kezelő él (további felkérés küldhető). Az info-sáv a min. 3 értékelős küszöböt kommunikálja — 2 kitöltés tehát nem fedi fel az aggregátumot (anonimitás-védelem).",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "OBS-18",
    area: "Observer-visszajelzés",
    name: "A 3. kitöltés beérkezik: az összevetés megnyílik (available állapot)",
    persona: "org-tag (kampány-résztvevő)",
    emails: { fő: "AUTO" },
    preconditions: "OBS-17 utáni állapot: 2 beérkezett kitöltés, van még függő meghívó-link.",
    steps:
      "1. Inkognitóban töltsd ki a 3. observer-meghívót. 2. A fő fiókkal frissítsd a /profile/results?tab=comparison oldalt. 3. Kattints az „Összevetés megnyitása” CTA-ra.",
    expected:
      "Az állapot-kártya zöldre vált: „Megérkezett a külső visszajelzésed” (3 kolléga), CTA-val. Az összevetés-nézet megnyílik: dimenziónként self- és observer-sáv, ahol az observer-érték a 3 kitöltés átlaga; az observer-számláló badge 3 értékelőt jelez.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },

  // ── Comparison tab (self-serve): üres / feles / teljes ───────────────────
  {
    id: "OBS-19",
    area: "Observer-visszajelzés",
    name: "Comparison tab üres állapota: CTA a meghívó-blokkra görget",
    persona: "self-user (Plus, nem org-tag)",
    emails: { fő: "AUTO" },
    preconditions: "A fő fióknak nincs beérkezett observer-kitöltése.",
    steps:
      "1. Nyisd meg a /profile/results?tab=comparison oldalt. 2. Olvasd el az üres-állapot kártyát. 3. Kattints az „Observer meghívása” CTA-ra.",
    expected:
      "📊 ikonos „nincs még adat” kártya jelenik meg magyarázattal és következő-lépés sorral. A CTA NEM navigál el: ugyanazon a fülön a meghívó-blokkhoz (#invitations) görget, ahol azonnal küldhető felkérés.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "OBS-20",
    area: "Observer-visszajelzés",
    name: "Comparison feles állapot: 1 kitöltésnél még nincs összevetés (min. 2 self-serve-ben)",
    persona: "self-user (Plus, nem org-tag)",
    emails: { fő: "AUTO" },
    preconditions: "A fő fióknak PONTOSAN 1 beérkezett observer-kitöltése van.",
    steps:
      "1. Nyisd meg a /profile/results?tab=comparison oldalt. 2. Nézd meg, megjelenik-e grafikon. 3. Olvasd el a meghívó-blokk info-sávját és a Beérkezett számlálót.",
    expected:
      "Egyetlen kitöltésnél az összevetés-grafikon MÉG NEM jelenik meg (egy értékelő beazonosítható lenne) — az üres-állapot kártya marad. A Beérkezett számláló 1-et mutat, az info-sáv jelzi, hogy self-serve-ben legalább 2 beérkezett kitöltés kell.",
    automated: "partial",
    coveredBy:
      "tests/integration/observer/observer-result-linkage.integration.test.ts (1 observer → küszöb alatt)",
    priority: "P3",
  },
  {
    id: "OBS-21",
    area: "Observer-visszajelzés",
    name: "Comparison teljes állapot: 2+ kitöltésnél önkép–külső kép, vakfolt-elemzés",
    persona: "self-user (Plus, nem org-tag)",
    emails: { fő: "AUTO" },
    preconditions:
      "OBS-20 után a 2. observer-kitöltés is beérkezett (két külön inkognitó-kitöltés).",
    steps:
      "1. Frissítsd a /profile/results?tab=comparison oldalt. 2. Nézd végig a szakaszokat: áttekintő kártya, 6 dimenzió-kártya, vakfolt-blokk, sötét összegző. 3. Vesd össze a számokat: az observer-sáv a 2 kitöltés átlaga.",
    expected:
      "A fejléc-badge 2 értékelőt jelez. Az áttekintő kártya egyező/eltérő dimenzió-számot és átlagos eltérést mutat; ±10 pont feletti eltérésnél a dimenzió-kártya meleg kiemelést és 💡 insight-szöveget kap, a vakfolt-blokk felsorolja őket; egyezésnél zöld „nincs vakfolt” kártya. A sötét összegző pontokba szedi a mintázatot.",
    automated: "partial",
    coveredBy:
      "tests/integration/observer/observer-result-linkage.integration.test.ts (2 observer → adat + átlagolás) + tests/e2e/observer/observer-flow.test.ts (2 válasz perzisztálása)",
    priority: "P1",
  },
  {
    id: "OBS-22",
    area: "Observer-visszajelzés",
    name: "Kitöltés-értesítő e-mail a meghívónak: a 2. beérkezett kitöltéstől",
    persona: "self-user (Plus)",
    emails: { fő: "AUTO" },
    preconditions:
      "A fő fióknak 1 beérkezett observer-kitöltése van, és van még függő meghívó (OBS-20→21 lánc közben ellenőrizhető).",
    steps:
      "1. Az 1. observer-kitöltés után nézd meg a fő postafiókját. 2. Töltesd ki a 2. meghívót inkognitóban. 3. Nézd meg újra a fő postafiókját.",
    expected:
      "Az 1. kitöltés után NEM megy e-mail a főnek (in-app értesítés viszont van). A 2. beérkezett kitöltéstől a fő observer-összefoglaló e-mailt kap a saját nyelvén, amely az eredmény-oldalra hív — így a levél csak akkor jön, amikor már van megnézhető összevetés.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
];

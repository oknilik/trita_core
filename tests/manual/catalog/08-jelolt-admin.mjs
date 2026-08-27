// Jelölt-flow (meghívó, token-alapú kitöltés, opcionális csapatszerep-
// lépés, kitöltés-értesítés, tanácsadói kör hozzáférés) és platform-admin
// org-access (/admin?tab=orgs → POST /api/admin/org-access, ADMIN_EMAILS
// kapu). A lépések a kód tényleges ágaira épülnek:
// src/lib/candidate-apply/service.ts · lib/acceptance/service.ts (candidate
// ág + notifyCandidateCompleted) · api/candidate/[token]/* ·
// api/admin/org-access/route.ts · lib/auth.ts (requireAdmin) ·
// app/(app)/hiring/[orgId]/page.tsx.
export const cases = [
  // ── Jelölt-flow ───────────────────────────────────────────────────────
  {
    id: "CAND-01",
    area: "Jelölt-flow",
    name: "Jelölt-meghívó létrehozása tanácsadóként – link + email, 30 napos lejárat",
    persona: "tanácsadó",
    emails: { "tanácsadó": "AUTO", "jelölt": "AUTO" },
    preconditions:
      "Tanácsadói kör (ORG_CONSULTANT / platform-tanácsadó / ADMIN_EMAILS) hozzáférés egy orghoz; a Jelöltek menü látszik.",
    steps:
      "1. Nyisd meg a /hiring/[orgId] felületet, indíts új jelölt-meghívót (név + pozíció + a jelölt email-címe, opcionális csapat; a csapatszerep-lépés kapcsolót hagyd most KI). 2. Küldd el. 3. Nézd meg a jelölt-listát és a jelölt postafiókját.",
    expected:
      "A meghívó PENDING státusszal jön létre, 30 napos lejárattal és kripto-random tokenű /apply/[token] linkkel; a megadott címre meghívó-email megy ki; a lista mutatja a jelöltet; kredit jelenleg NEM fogy és paywall nem jelenik meg (CANDIDATE_GATING_ENABLED=false).",
    automated: "partial",
    coveredBy:
      "tests/integration/apply/apply-flow.integration.test.ts (létrehozás jogosult tanácsadóval)",
    priority: "P1",
  },
  {
    id: "CAND-02",
    area: "Jelölt-flow",
    name: "Jelölt-felület hozzáférés-kapu: csak a tanácsadói kör",
    persona: "org admin + manager + tag",
    emails: { admin: "AUTO", manager: "AUTO", tag: "AUTO" },
    preconditions:
      "NEM-tanácsadó org admin, manager és tag fiókok; egy másik org egy csapatának azonosítója is ismert.",
    steps:
      "1. Mindhárom szereppel nyisd meg közvetlen URL-lel a /hiring/[orgId] oldalt, és nézd a fejléc-menüt. 2. API-val próbálj jelölt-meghívót létrehozni nem-tanácsadó szereppel. 3. Tanácsadóként próbálj meghívót létrehozni egy IDEGEN org csapatára.",
    expected:
      "A /hiring nem-tanácsadónak 404-et ad (a Jelöltek menüpont sem jelenik meg – a sima ORG_ADMIN-nak sem); az API nem-tanácsadónak 403 FORBIDDEN; idegen org csapatára a tanácsadó kérése is FORBIDDEN – az org/csapat-kontextus szerver-oldalon ellenőrzött.",
    automated: "partial",
    coveredBy:
      "tests/integration/apply/apply-flow.integration.test.ts (role gate + idegen csapat)",
    priority: "P1",
  },
  {
    id: "CAND-03",
    area: "Jelölt-flow",
    name: "Jelölt-kitöltés tokennel: auth nélkül, draft-folytatással, idempotens beadással",
    persona: "jelölt (vendég)",
    emails: { "jelölt": "AUTO" },
    preconditions: "CAND-01 PENDING meghívója; inkognitó böngésző.",
    steps:
      "1. Nyisd meg az /apply/[token] linket inkognitóban. 2. Kezdd el a 60 itemes tesztet, válaszolj kb. 20 kérdésre, zárd be a fület. 3. Nyisd meg újra a linket (akár másik gépen). 4. Fejezd be és add be. 5. Nyisd meg újra a linket, és próbáld újra beadni.",
    expected:
      "A kitöltő auth nélkül működik; a szerver-oldali piszkozat (megkezdett állapot + válasz-számláló) visszatöltődik, nem nullázódik; hiányos beadás MISSING_ANSWER hibával elutasítva; sikeres beadásnál a meghívó COMPLETED lesz; az ismételt beadás ALREADY_USED, a link újranyitva már-kitöltve nézetet ad.",
    automated: "partial",
    coveredBy:
      "tests/integration/join/join-acceptance-matrix.integration.test.ts (apply endpoint-állapotok + progress) · tests/integration/apply/apply-flow.integration.test.ts (idempotens submit)",
    priority: "P1",
  },
  {
    id: "CAND-04",
    area: "Jelölt-flow",
    name: "Opcionális csapatszerep-lépés a jelölt-kitöltésben – átugorható, egyszer beadható",
    persona: "jelölt (vendég) + tanácsadó",
    emails: { "tanácsadó": "AUTO", "jelölt-a": "AUTO", "jelölt-b": "AUTO" },
    preconditions:
      "Két meghívó: az egyik bekapcsolt csapatszerep-lépéssel (includeTeamRole), a másik nélküle.",
    steps:
      "1. A jelölt-a a szerep-lépéses meghívón adja be a fő tesztet – figyeld a felajánlott 2. lépést. 2. Töltse ki a szerep-kérdőívet (8–12 jelölés + 3 kiemelés), add be, majd próbáld újra beadni. 3. A jelölt-b a szerep-lépés NÉLKÜLI meghívón adja be a fő tesztet – figyeld, kap-e szerep-lépést; API-val próbálj szerep-választ küldeni a tokenjére. 4. Egy harmadik, fő teszt előtti tokenre is próbálj szerep-választ küldeni API-val.",
    expected:
      "A szerep-lépés csak bekapcsolt meghívón jelenik meg, és átugorható (a kitöltés e nélkül is COMPLETED marad); ismételt szerep-beadás ALREADY_USED; nem engedélyezett meghívón NOT_ENABLED; a fő teszt beadása előtt MAIN_ASSESSMENT_MISSING; az eredmény-nézeten a szerep-blokk csak tényleges kitöltésnél jelenik meg.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "CAND-05",
    area: "Jelölt-flow",
    name: "Kitöltés-értesítés: in-app + email a tanácsadói körnek és az org adminoknak",
    persona: "tanácsadó + org admin + manager",
    emails: { "tanácsadó": "AUTO", admin: "AUTO", manager: "AUTO", "jelölt": "AUTO" },
    preconditions:
      "Org kiosztott tanácsadóval, NEM-tanácsadó adminnal és managerrel; PENDING jelölt-meghívó.",
    steps:
      "1. A jelölt adja be a tesztet. 2. Nézd meg a tanácsadó és az admin értesítés-panelét és postafiókját. 3. Nézd meg a manager panelét és postafiókját is. 4. Kattints az email eredmény-linkjére.",
    expected:
      "A tanácsadó és az org admin in-app értesítést ÉS emailt kap a jelölt nevével/pozíciójával; a manager és a tag nem kap; az email linkje a /hiring/[orgId]/candidates/[inviteId] eredmény-oldalra visz; az értesítés-küldés hibája a jelölt beadását nem buktatja (fire-and-forget).",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "CAND-06",
    area: "Jelölt-flow",
    name: "Token-állapot ágak az /apply oldalon: lejárt, visszavont, kész, érvénytelen",
    persona: "jelölt (vendég)",
    emails: { "tanácsadó": "AUTO", "jelölt": "AUTO" },
    preconditions:
      "Három meghívó: egy visszadátumozott lejáratú (teszt-DB-ben expiresAt a múltba állítva), egy visszavonható PENDING és egy COMPLETED.",
    steps:
      "1. Nyisd meg a lejárt meghívó linkjét, és próbálj beadni API-val is. 2. Tanácsadóként vond vissza a PENDING meghívót, majd nyisd meg a linkjét. 3. Nyisd meg a COMPLETED linket. 4. Nyiss meg egy kitalált tokent.",
    expected:
      "Lejártnál lejárt-nézet, beadás INVITE_EXPIRED; visszavontnál visszavont-nézet, beadás INVITE_REVOKED; késznél már-kitöltve nézet, beadás ALREADY_USED; kitalált token 404 – egyik ág sem enged kitöltő-felületet.",
    automated: "partial",
    coveredBy:
      "tests/integration/acceptance/service.integration.test.ts (expired apply model) · tests/integration/join/join-acceptance-matrix.integration.test.ts (invalid/expired/completed endpoint-ágak)",
    priority: "P2",
  },
  {
    id: "CAND-07",
    area: "Jelölt-flow",
    name: "Jelölt-kezelés: eredmény-nézet, visszavonás, email újraküldés",
    persona: "tanácsadó",
    emails: { "tanácsadó": "AUTO", "jelölt": "AUTO" },
    preconditions:
      "Egy COMPLETED jelölt (szerep-kitöltéssel) és egy PENDING meghívó emaillel.",
    steps:
      "1. Nyisd meg a kész jelölt eredmény-oldalát. 2. Küldd újra a PENDING meghívó emailjét (resend). 3. Vond vissza a PENDING meghívót, majd nyisd meg a linkjét. 4. Nézd meg a csapat/org statisztikákat.",
    expected:
      "Az eredmény-oldal a jelölt HEXACO-profilját és (ha van) csapatszerep-blokkját mutatja forrás-jelzéssel; a resend új emailt küld ugyanarra a tokenre; a visszavonás CANCELED státuszt ad, a link ezután visszavont-nézet; a jelölt-eredmény a csapat- és org-átlagokban NEM jelenik meg.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },

  // ── Platform-admin org-access ─────────────────────────────────────────
  {
    id: "ADMIN-01",
    area: "Platform-admin org-access",
    name: "ADMIN_EMAILS kapu: a /admin csak listázott emailnek, nav-link nélkül",
    persona: "trita admin + org admin",
    emails: { fő: "AUTO" },
    preconditions:
      "Egy ADMIN_EMAILS-ben listázott fiók és egy nem-listázott (akár ORG_ADMIN szerepű) fiók.",
    steps:
      "1. A nem-listázott fiókkal írd be kézzel a /admin URL-t. 2. A listázott fiókkal nyisd meg a /admin-t, majd a ?tab=orgs fület. 3. Nézd végig mindkét fiók fejléc-navját admin-linket keresve. 4. Kijelentkezve is nyisd meg a /admin-t.",
    expected:
      "A nem-listázott user csendben a journey-home-ra kerül (nincs 403-oldal, nincs információ-szivárgás); kijelentkezve sign-in-re; a listázott admin látja a füleket (Áttekintés · Szervezetek · Emlékeztetők · ...); a navigációban egyik fióknál sincs admin-link – a felület csak beírt URL-lel érhető el.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "ADMIN-02",
    area: "Platform-admin org-access",
    name: "Org-access activate: kézi hozzáférés-adás, élesedő org-capability-k",
    persona: "trita admin + org admin",
    emails: { fő: "AUTO", "org-admin": "AUTO" },
    preconditions:
      "Subscription nélküli (vagy inaktív) org; trita admin fiók; a művelet előtt az org írás-műveletei korlátozottak.",
    steps:
      "1. A /admin?tab=orgs listában keresd meg az orgot, és aktiváld (planType + hónapok). 2. Nézd meg az org-kártya státuszát és lejáratát. 3. Lépj be az org adminjaként, és próbálj írás-műveletet (tag-meghívó, szerep-módosítás).",
    expected:
      "A subscription active lesz, a periódus-vég = most + N hónap, az admin-lista mutatja a státuszt és a lejáratot; az org írás-capability-jei (meghívás, tag-kezelés) élesednek, a korlátozás-bannerek eltűnnek.",
    automated: "partial",
    coveredBy:
      "tests/unit/subscription/subscription.test.ts (állapotgép) · tests/unit/policy/capability-matrix.data-driven.test.ts (active capability-k)",
    priority: "P1",
  },
  {
    id: "ADMIN-03",
    area: "Platform-admin org-access",
    name: "Trial és extend: próbaidő, majd hosszabbítás a helyes bázis-dátumtól",
    persona: "trita admin",
    emails: { fő: "AUTO" },
    preconditions:
      "Két org: egy subscription nélküli (trialhoz) és egy aktív, jövőbeli periódus-végű (extendhez).",
    steps:
      "1. Adj trialt az első orgnak, és nézd meg a lejáratot. 2. Hosszabbítsd meg (extend) a második orgot N hónappal – nézd meg az új periódus-véget. 3. Járasd le (deactivate), majd extendeld újra, és nézd meg a bázis-dátumot. 4. A trial-os orgot aktiváld.",
    expected:
      "Trial: trialing státusz a TRIAL_DAYS szerinti lejárattal, aktív-szerű capability-kkel; extend jövőbeli periódus-végnél ATTÓL számol tovább, lejárt/leállított orgnál a mai naptól; activate a trialEndsAt-ot törli és active-ra vált.",
    automated: "partial",
    coveredBy:
      "tests/unit/subscription/subscription.test.ts · tests/unit/policy/capabilities.test.ts (trialing aktív-szerű)",
    priority: "P2",
  },
  {
    id: "ADMIN-04",
    area: "Platform-admin org-access",
    name: "Deactivate: azonnali korlátozás az org felületén",
    persona: "trita admin + org admin",
    emails: { fő: "AUTO", "org-admin": "AUTO" },
    preconditions: "Aktív subscription-ű org, belépni tudó org adminnal.",
    steps:
      "1. Deaktiváld az org hozzáférését a /admin?tab=orgs felületen. 2. Lépj be az org adminjaként, nézd a bannereket. 3. Próbálj írás-műveletet (meghívó küldése, tag-szerep módosítás, csapat-létrehozás). 4. Aktiváld újra, és ismételd meg a próbát.",
    expected:
      "A subscription canceled + azonnali periódus-vég; az org-felület korlátozott állapotba vált: az írás-capability-k CAPABILITY_DENIED-del tiltottak, a felület korlátozás-bannert és /contact-ra mutató CTA-t ad, az olvasás a policy szerint megmarad; újra-aktiválás után minden helyreáll.",
    automated: "partial",
    coveredBy:
      "tests/unit/policy/policy-regression.test.ts · tests/unit/policy/capability-matrix.data-driven.test.ts (restricted/frozen mátrix)",
    priority: "P1",
  },
  {
    id: "ADMIN-05",
    area: "Platform-admin org-access",
    name: "set_credits: jelölt-kredit beállítása (gating jelenleg kikapcsolva)",
    persona: "trita admin + tanácsadó",
    emails: { fő: "AUTO", "tanácsadó": "AUTO" },
    preconditions: "Org subscription nélkül; tanácsadói hozzáférés a hiring-felülethez.",
    steps:
      "1. Állíts be kredit-számot az orgnak a /admin?tab=orgs felületen. 2. Nézd meg az admin-lista kredit-oszlopát. 3. Tanácsadóként hozz létre jelölt-meghívót, majd nézd meg újra a kreditet.",
    expected:
      "A candidateCredits mentődik (subscription nélküli orgnál none státuszú subscription-sor jön létre hozzá); a gating kikapcsolt állapotában a jelölt-meghívó ettől függetlenül létrehozható és a kredit NEM fogy – a szám változatlan marad.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "ADMIN-06",
    area: "Platform-admin org-access",
    name: "assign_consultant: tanácsadó kiosztása emaillel – valódi tagság nem konvertálódik",
    persona: "trita admin",
    emails: { fő: "AUTO", "tanácsadó": "AUTO" },
    preconditions:
      "Létező user-fiók a tanácsadó-emailen (org-tagság nélkül); az orgban van valódi ORG_MEMBER tag is.",
    steps:
      "1. A /admin?tab=orgs org-kártyáján add meg a tanácsadó emailjét és oszd ki. 2. Próbáld kiosztani (a) egy nem-létező emailre, (b) az org meglévő valódi tagjának emailjére is. 3. Nézd meg az org-kártya tanácsadó-listáját és tag-számát.",
    expected:
      "Sikeres kiosztásnál ORG_CONSULTANT tagság jön létre és a tanácsadó megjelenik a kártya listáján; nem-létező email USER_NOT_FOUND; meglévő (nem-consultant) tag emailje 409 ALREADY_MEMBER – valódi tagság nem konvertálódik csendben tanácsadóivá; az org tag-száma a kiosztástól NEM nő.",
    automated: "partial",
    coveredBy:
      "tests/unit/policy/policy-engine.test.ts (consultant admin-paritás capability-oldala)",
    priority: "P1",
  },
  {
    id: "ADMIN-07",
    area: "Platform-admin org-access",
    name: "remove_consultant: elvétel után megszűnik a hozzáférés, valódi tagot nem érint",
    persona: "trita admin + tanácsadó",
    emails: { fő: "AUTO", "tanácsadó": "AUTO" },
    preconditions: "ADMIN-06 kiosztott tanácsadója; az orgban valódi tag is van.",
    steps:
      "1. Vedd el a tanácsadót az org-kártyán. 2. A volt tanácsadó lépjen be, és próbálja megnyitni az org-oldalt. 3. Próbáld az elvételt az org egy valódi (nem-consultant) tagjának emailjével is.",
    expected:
      "A tanácsadó tagság-sora törlődik, a kártya-listából eltűnik; a volt tanácsadó az orgot nem éri el (self-only vagy másik-org felületre kerül, org-menük nélkül); valódi tag emailjére NOT_FOUND – ez az út valódi tagságot nem távolít el.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
];

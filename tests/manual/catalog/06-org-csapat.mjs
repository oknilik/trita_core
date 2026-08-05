// Org- és csapat-tagság: org-meghívó ágak (/join/org/[inviteId]), szerep ×
// navigáció/home (journey resolveHome), LAST_ADMIN-védelem, multi-org
// váltás, csapat-join (/join/[token]), csapatkép-küszöbök és manager
// cockpit. A lépések a kód tényleges ágaira épülnek:
// src/lib/acceptance/service.ts · journey/home.ts · navigation/config.ts +
// visibility.ts · api/org/[id]/members/[userId]/route.ts · org-context.ts ·
// team-auth.ts · manager-cockpit.ts + app/(app)/manager/page.tsx.
export const cases = [
  // ── Org-meghívó (/join/org/[inviteId]) ────────────────────────────────
  {
    id: "ORG-01",
    area: "Org-meghívó",
    name: "Org-meghívó kijelentkezett (új) userként — sign-up → profil-kiegészítés → tagság",
    persona: "új meghívott + org admin",
    emails: { admin: "AUTO", "meghívott": "AUTO" },
    preconditions:
      "Létező szervezet, amelybe az admin fiók be tud lépni; a meghívott címmel még nincs fiók. A meghívotthoz inkognitó böngésző.",
    steps:
      "1. Adminként küldj org-meghívót a meghívott címre (/org/[id]?tab=members, szerep: ORG_MEMBER). 2. A levélbeli /join/org/[token] linket nyisd meg kijelentkezett (inkognitó) böngészőben. 3. Kövesd a sign-up átirányítást, regisztrálj a meghívott címmel. 4. Visszairányítás után a join-oldalon töltsd ki a hiányzó profil-mezőket, és fogadd el a meghívót.",
    expected:
      "Kijelentkezve a /sign-up-ra kerülsz redirect_url=/join/org/[token] paraméterrel; regisztráció után a join-oldal a szervezet nevét mutatja és profil-kiegészítést kér; elfogadás után ORG_MEMBER tagság jön létre, az org lesz az aktív kontextus, a journey a szerep szerinti home-ra visz, és az org adminja »meghívó elfogadva« értesítést kap.",
    automated: "partial",
    coveredBy:
      "tests/integration/join/join-acceptance-matrix.integration.test.ts · tests/integration/acceptance/service.integration.test.ts",
    priority: "P1",
  },
  {
    id: "ORG-02",
    area: "Org-meghívó",
    name: "Org-meghívó bejelentkezett, onboardolt userrel — a meghívó szerepével jön létre a tagság",
    persona: "self-user + org admin",
    emails: { admin: "AUTO", "meghívott": "AUTO" },
    preconditions:
      "A meghívott fiók létezik, onboardingja kész, nincs org-tagsága. Az admin ORG_MANAGER szereppel hívja meg.",
    steps:
      "1. Adminként küldj meghívót ORG_MANAGER szereppel. 2. A meghívott bejelentkezve nyissa meg a /join/org/[token] linket. 3. Ellenőrizd, hogy a join-oldal a meglévő profilt ismeri fel (nem kér újra profil-mezőket). 4. Fogadd el a meghívót. 5. Nyisd meg újra ugyanazt a linket.",
    expected:
      "A tagság a meghívóban rögzített szereppel (ORG_MANAGER) jön létre; elfogadás után a journey a szerep szerinti home-ra visz (manager: kezelt csapat híján org-oldal / 1 csapatnál csapatoldal); a meghívó-sor elfogyott — a link újra megnyitva 404-et ad.",
    automated: "partial",
    coveredBy:
      "tests/integration/join/join-acceptance-matrix.integration.test.ts (api.org.join valid token)",
    priority: "P1",
  },
  {
    id: "ORG-03",
    area: "Org-meghívó",
    name: "Érvénytelen / felhasznált / visszavont org-meghívó link → 404",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "Bejelentkezett fiók; egy korábban már elfogadott meghívó linkje (pl. ORG-02-ből) és egy admin által visszavonható függő meghívó.",
    steps:
      "1. Nyiss meg egy kitalált tokenű /join/org/... linket. 2. Nyisd meg egy már elfogadott meghívó linkjét egy HARMADIK fiókkal. 3. Adminként vonj vissza (törölj) egy függő meghívót, majd nyisd meg a linkjét.",
    expected:
      "Mindhárom ágon a 404 not-found oldal jelenik meg, fél-kész join-nézet nélkül. Megjegyzés: az org-meghívónak NINCS idő-alapú lejárata — a link a felhasználásig/visszavonásig él; a lejárt-analóg állapot = törölt sor = 404.",
    automated: "partial",
    coveredBy:
      "tests/e2e/journey/journey-entrypoints-smoke.test.ts (invalid token 404) · tests/integration/join/join-acceptance-matrix.integration.test.ts (INVITE_NOT_FOUND)",
    priority: "P2",
  },
  {
    id: "ORG-04",
    area: "Org-meghívó",
    name: "Már org-tag nyitja a saját függő meghívóját — nincs join↔dashboard redirect-hurok",
    persona: "org tag",
    emails: { fő: "AUTO", admin: "AUTO" },
    preconditions:
      "A user már aktív tagja az orgnak, de a címére még létezik függő org-meghívó-sor (pl. a tagság másik úton jött létre).",
    steps:
      "1. Tagként nyisd meg a függő org-meghívó /join/org/[token] linkjét. 2. Figyeld, hova kerülsz (ne legyen join↔dashboard pattogás). 3. Nyisd meg a /dashboard-ot. 4. Nyisd meg újra a meghívó-linket.",
    expected:
      "A join-oldal azonnal a journey-home-ra irányít; a lógva maradt meghívó-sort a rendszer törli, ezért a /dashboard pending-join elsőbbsége megszűnik (nem irányít vissza a join-oldalra); a link újra megnyitva 404.",
    automated: "partial",
    coveredBy:
      "tests/integration/acceptance/service.integration.test.ts (already member → already accepted)",
    priority: "P1",
  },
  {
    id: "ORG-05",
    area: "Org-meghívó",
    name: "Névre szóló meghívó másik fiókkal — INVITE_EMAIL_MISMATCH",
    persona: "self-user (rossz címzett)",
    emails: { "címzett": "AUTO", "másik-fiók": "AUTO" },
    preconditions:
      "Névre szóló org-meghívó a címzett email-címére; egy másik, a címzettől eltérő emailű bejelentkezett fiók.",
    steps:
      "1. A másik fiókkal nyisd meg a címzettnek szóló /join/org/[token] linket. 2. Próbáld elfogadni a meghívót.",
    expected:
      "Az elfogadás 403 INVITE_EMAIL_MISMATCH hibával elutasítva, lokalizált hibaüzenettel; tagság nem jön létre — a kapu szerver-oldali, a kliens-állapottól függetlenül véd. (Case-insensitive email-összevetés: eltérő kis/nagybetűs saját cím még átmegy.)",
    automated: "partial",
    coveredBy:
      "tests/integration/join/join-acceptance-matrix.integration.test.ts (email mismatch — közös runJoinTransaction kapu)",
    priority: "P1",
  },

  // ── Szerepek × navigáció és home-cél ──────────────────────────────────
  {
    id: "ORG-06",
    area: "Szerepek és navigáció",
    name: "ORG_ADMIN belépés: org-cockpit home + admin-nav",
    persona: "org admin",
    emails: { fő: "AUTO" },
    preconditions: "ORG_ADMIN szerepű fiók aktív org-kontextussal, kész self-teszttel.",
    steps:
      "1. Lépj be, figyeld hova visz a belépés/Vezérlő. 2. Nézd végig a fejléc-menüt és a menüpontok célpontjait. 3. Nyisd meg a Csapatok és a Szervezet menüt.",
    expected:
      "Home = /org/[id] (org-cockpit). Nav: Vezérlő · Feladataim · Csapatok (link az /org/[id]?tab=teams fülre) · Szervezet (link /org/[id], aktív mérés esetén badge). Nincs Eredményeim és nincs Analitika menü; Jelöltek menü csak a tanácsadói körnek jelenik meg.",
    automated: "partial",
    coveredBy:
      "tests/unit/journey/home.test.ts (admin → org cockpit) · tests/unit/navigation/nav-visibility.test.ts · tests/e2e/navigation/critical-ia-smoke.test.ts",
    priority: "P1",
  },
  {
    id: "ORG-07",
    area: "Szerepek és navigáció",
    name: "ORG_MANAGER belépés: manager-home + manager-nav (cockpit csak 2+ csapatnál)",
    persona: "org manager",
    emails: { fő: "AUTO" },
    preconditions:
      "ORG_MANAGER szerepű fiók, kész self-teszt, PONTOSAN 1 kezelt csapat (manager team-szereppel).",
    steps:
      "1. Lépj be, figyeld a home-célt. 2. Nézd végig a fejléc-menüt. 3. (ORG-06 adminjával) adj a managernek egy második kezelt csapatot, és lépj be újra.",
    expected:
      "A journey a /manager-re visz, de 1 kezelt csapatnál az azonnal a /team/[id]-ra irányít (nincs duplikált cockpit); 2+ csapatnál a cockpit-összegző marad. Nav: Vezérlő · Feladataim · Csapatom (1 csapatnál közvetlen link, többnél dropdown) — nincs Szervezet menü, Jelöltek csak tanácsadói körnek.",
    automated: "partial",
    coveredBy:
      "tests/unit/journey/home.test.ts (manager cockpit) · tests/unit/navigation/nav-visibility.test.ts",
    priority: "P1",
  },
  {
    id: "ORG-08",
    area: "Szerepek és navigáció",
    name: "ORG_MEMBER belépés: assessment-kötelezettség, majd csapat- vagy személyes home",
    persona: "org tag",
    emails: { fő: "AUTO" },
    preconditions: "ORG_MEMBER szerepű fiók self-teszt NÉLKÜL; egy csapat-tagsággal.",
    steps:
      "1. Lépj be kitöltetlen self-teszttel — figyeld a home-célt. 2. Töltsd ki a tesztet. 3. Nyisd meg a Vezérlőt csapattagként. 4. (Külön fiókkal) ismételd meg csapat-tagság nélküli org-taggal. 5. Nézd végig a fejléc-menüt.",
    expected:
      "Kitöltetlen selfnél a home az /assessment; kész selfnél csapattagként a /team/[id], csapat nélkül a /profile/results — plain tag SOHA nem kerül az /org/[id]-ra (redirect-loop guard). Nav: Vezérlő · Eredményeim · Interakció · Feladataim · saját csapat(ok); nincs Szervezet és nincs Jelöltek menü.",
    automated: "partial",
    coveredBy:
      "tests/unit/journey/home.test.ts (org member ágak + loop-guard) · tests/unit/navigation/nav-visibility.test.ts",
    priority: "P1",
  },
  {
    id: "ORG-09",
    area: "Szerepek és navigáció",
    name: "ORG_CONSULTANT: admin-paritás + Tanácsadó-badge, tag-számokba nem számít",
    persona: "tanácsadó",
    emails: { "tanácsadó": "AUTO", admin: "AUTO" },
    preconditions:
      "ADMIN-06 szerint kiosztott ORG_CONSULTANT az orgban; az orgban van legalább 3 kitöltött tag (HEXACO-átlaghoz).",
    steps:
      "1. Jegyezd fel az org tag-számát és HEXACO-átlagát a tanácsadó nélkül (admin nézet). 2. Lépj be tanácsadóként — figyeld a home-ot és a navot. 3. Nyisd meg a Tagok fület, keresd meg a tanácsadót. 4. Töltse ki a tanácsadó a self-tesztet, majd nézd meg újra az org-átlagot és tag-számot. 5. Adminként nyisd meg az org-meghívó szerep-választóját.",
    expected:
      "A tanácsadó home-ja az org-cockpit, navja admin-paritású (Csapatok · Szervezet · Jelöltek — a tanácsadói kör hiring-menüt is kap); a tag-listában »Tanácsadó« badge-dzsel jelenik meg; a tag-szám és az org HEXACO-átlag NEM változik a kitöltésétől; a meghívó szerep-választójában az ORG_CONSULTANT nem osztható ki.",
    automated: "partial",
    coveredBy:
      "tests/unit/policy/policy-engine.test.ts (consultant admin-paritás) · tests/unit/journey/context.test.ts (szerep→kontextus) · tests/unit/policy/org-member-patch-authz.test.ts (PATCH-enum consultant nélkül)",
    priority: "P1",
  },

  // ── LAST_ADMIN-védelem és multi-org ───────────────────────────────────
  {
    id: "ORG-10",
    area: "Org-tagság és váltás",
    name: "LAST_ADMIN: az utolsó admin nem fokozható le és nem távolítható el",
    persona: "org admin",
    emails: { admin: "AUTO", tag: "AUTO" },
    preconditions: "Org PONTOSAN 1 ORG_ADMIN-nal és legalább 1 ORG_MEMBER taggal.",
    steps:
      "1. Adminként a Tagok fülön próbáld az egyetlen admint (magadat) ORG_MEMBER-re lefokozni. 2. Próbáld az admint eltávolítani. 3. Nevezd ki a tagot második adminná, majd ismételd meg az 1. lépést.",
    expected:
      "Az 1–2. lépés 400 LAST_ADMIN hibával elutasítva (lokalizált üzenet), a szerep és a tagság változatlan marad; második admin kinevezése után a lefokozás már engedélyezett.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "ORG-11",
    area: "Org-tagság és váltás",
    name: "LAST_ADMIN: a jelenlévő ORG_CONSULTANT nem számít második adminnak",
    persona: "org admin + tanácsadó",
    emails: { admin: "AUTO", "tanácsadó": "AUTO" },
    preconditions:
      "Org 1 ORG_ADMIN-nal és egy kiosztott ORG_CONSULTANT-tal (ADMIN-06), más admin nélkül.",
    steps:
      "1. Adminként próbáld az egyetlen admint lefokozni. 2. Próbáld eltávolítani. 3. Ellenőrizd, hogy a tanácsadó szerepe közben változatlan.",
    expected:
      "A védelem a tanácsadó jelenlétében is él: mindkét művelet LAST_ADMIN hibával elutasítva — az admin-darabszámba csak az ORG_ADMIN szerep számít, az ORG_CONSULTANT nem.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "ORG-12",
    area: "Org-tagság és váltás",
    name: "Multi-org váltás: az aktív org kontextusa vezérli a home-ot és a navot",
    persona: "két-orgos user",
    emails: { fő: "AUTO" },
    preconditions:
      "Egy fiók két org tagja eltérő szereppel (A-ban ORG_ADMIN, B-ben ORG_MEMBER), kész self-teszttel.",
    steps:
      "1. Lépj be, nyisd meg a fejléc org-váltóját, és nézd meg a felsorolt tagságokat. 2. Válts a B orgra. 3. Nézd a Vezérlő célját és a fejléc-menüt. 4. Válts vissza A-ra. 5. Jelentkezz ki és be — melyik org aktív?",
    expected:
      "A váltó minden aktív tagságot mutat org-névvel; váltás után a home és a nav a MINDENKORI aktív org szerepét tükrözi (A: org-cockpit + admin-nav; B: tag-home + tag-nav); a kijelölés perzisztens — új belépésnél az utoljára választott org az aktív. Idegen orgId-ra a váltás 403 FORBIDDEN.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "ORG-13",
    area: "Org-tagság és váltás",
    name: "Aktív org-tagság megszűnése után a kontextus öngyógyít",
    persona: "két-orgos user + org admin",
    emails: { fő: "AUTO", admin: "AUTO" },
    preconditions:
      "A user két org tagja, az AKTÍV orgjából az admin el tudja távolítani (a user ott nem utolsó admin).",
    steps:
      "1. A user aktív orgja legyen A. 2. A-org adminja távolítsa el a usert a Tagok fülön. 3. A user frissítse az oldalt / lépjen be újra. 4. Ismételd meg úgy, hogy a usernek csak 1 tagsága volt.",
    expected:
      "Nincs hibaoldal vagy beragadt állapot: az aktív kontextus automatikusan a megmaradt tagságra áll át, a home/nav ahhoz igazodik; utolsó tagság megszűnésekor self-only felület (személyes eredmények, org-menük nélkül).",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },

  // ── Csapat-join (/join/[token]) ───────────────────────────────────────
  {
    id: "TEAM-01",
    area: "Csapat-meghívó",
    name: "Csapat-meghívó azonos org tagjának — csatlakozás duplikált org-tagság nélkül",
    persona: "org tag + manager",
    emails: { manager: "AUTO", "meghívott": "AUTO" },
    preconditions:
      "A meghívott az org aktív tagja (csapat-tagság nélkül), a manager a csapat kezelője.",
    steps:
      "1. Managerként küldj csapat-meghívót a Tagok fülről a meghívott címére. 2. A meghívott bejelentkezve nyissa meg a /join/[token] linket. 3. Ellenőrizd a felkínált nézetet (csapat + org név). 4. Fogadd el. 5. Nyisd meg újra a linket.",
    expected:
      "A join-oldal csapat-csatlakozás nézetet ad a csapat- és org-névvel; elfogadás után TeamMember-sor jön létre (az org-tagság NEM duplikálódik), az org az aktív kontextus, a journey a home-ra visz; a névre szóló meghívó-sor törlődik — a link újra 404.",
    automated: "partial",
    coveredBy:
      "tests/integration/join/join-acceptance-matrix.integration.test.ts (api.team.join valid token)",
    priority: "P1",
  },
  {
    id: "TEAM-02",
    area: "Csapat-meghívó",
    name: "Csapat-meghívó másik org aktív tagjának — explicit org-váltás kell",
    persona: "másik org tagja",
    emails: { fő: "AUTO", manager: "AUTO" },
    preconditions:
      "A meghívott A-org aktív tagja; a meghívó B-org egyik csapatába szól (a meghívott B-nek nem tagja).",
    steps:
      "1. A meghívott nyissa meg a B-csapat /join/[token] linkjét. 2. Nézd meg az org-váltás nézetet (jelenlegi org + cél-org). 3. Kattints a váltás gombra. 4. Ellenőrizd a tagságokat és az aktív kontextust.",
    expected:
      "Sima elfogadás helyett org-váltó nézet jelenik meg; a váltás gomb után B-orgban ORG_MEMBER + csapattagság jön létre, az aktív kontextus B-re áll; az A-tagság MEGMARAD (nem destruktív váltás); a journey az új kontextus home-jára visz.",
    automated: "partial",
    coveredBy:
      "tests/integration/join/join-acceptance-matrix.integration.test.ts (org mismatch) · tests/integration/acceptance/service.integration.test.ts",
    priority: "P1",
  },
  {
    id: "TEAM-03",
    area: "Csapat-meghívó",
    name: "Már-csapattag nyitja a függő csapat-meghívót — takarítás, nincs hurok",
    persona: "csapattag",
    emails: { fő: "AUTO" },
    preconditions:
      "A user már a csapat tagja, de a címére még él függő csapat-meghívó-sor.",
    steps:
      "1. Nyisd meg a függő meghívó /join/[token] linkjét. 2. Figyeld az átirányítást. 3. Nyisd meg a /dashboard-ot, majd újra a linket.",
    expected:
      "Azonnali redirect a journey-home-ra; a lógó meghívó-sor törlődik (a pending-join elsőbbség nem ragad be, nincs join↔dashboard hurok); a link ezután 404.",
    automated: "partial",
    coveredBy:
      "tests/integration/join/join-acceptance-matrix.integration.test.ts (already member)",
    priority: "P2",
  },
  {
    id: "TEAM-04",
    area: "Csapat-meghívó",
    name: "Nyílt (többször használható) csapat-link — nem fogy el, email-kötés nélkül",
    persona: "két külön user",
    emails: { admin: "AUTO", user1: "AUTO", user2: "AUTO" },
    preconditions:
      "Admin-paritású fiók, amely nyílt meghívó-linket tud generálni a csapathoz (link-megosztó funkció).",
    steps:
      "1. Generálj nyílt csapat-linket. 2. Csatlakozz vele a user1 fiókkal. 3. Csatlakozz ugyanazzal a linkkel a user2 fiókkal. 4. Nyisd meg a linket harmadszor is.",
    expected:
      "Mindkét fiók csatlakozik ugyanazon a linken (email-egyezés nem követelmény); a nyílt link a felhasználások után is él (nem törlődik); már-tag user a home-ra kerül.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },

  // ── Csapatkép- és heatmap-küszöbök ────────────────────────────────────
  {
    id: "TEAM-05",
    area: "Csapatkép-küszöbök",
    name: "3 kitöltés alatt: gyűjtés-először állapot, csapat-mintázat nem számolódik",
    persona: "tanácsadó",
    emails: { "tanácsadó": "AUTO" },
    preconditions:
      "Csapat legalább 3 taggal, de 3-nál KEVESEBB kész self-kitöltéssel; tanácsadói (ORG_CONSULTANT) hozzáférés.",
    steps:
      "1. Tanácsadóként nyisd meg a /team/[id]?tab=intelligence fület. 2. Nézd meg a prioritás-kártyákat és az evidencia-jelzést. 3. Nyisd meg a ?tab=profile fület (csapat-mintázat).",
    expected:
      "Gyűjtés-először állapot: hiányzó-kitöltések prioritás-kártya a hiányzók számával és meghívó/emlékeztető CTA-val; az evidencia-minőség jelölése részleges (nem sufficient); a csapat-mintázat (pattern-kód) 3 kitöltés alatt NEM áll össze — a felület a küszöböt kommunikálja, nem üres/hibás nézetet ad.",
    automated: "partial",
    coveredBy:
      "tests/unit/team/team-pattern.test.ts (3 alatt null) · tests/unit/platform/team-intelligence.test.ts (küszöb + prioritás) · tests/e2e/team/team-intelligence-visual.test.ts (low-data layout)",
    priority: "P1",
  },
  {
    id: "TEAM-06",
    area: "Csapatkép-küszöbök",
    name: "Heatmap hiányzó kitöltéssel: üres cella, nem nulla",
    persona: "tanácsadó",
    emails: { "tanácsadó": "AUTO" },
    preconditions:
      "4 tagú csapat 3 kész kitöltéssel (1 tag kitöltés nélkül); tanácsadói hozzáférés.",
    steps:
      "1. Nyisd meg a csapat heatmap-nézetét (intelligence/profil réteg). 2. Nézd meg a kitöltés nélküli tag sorát. 3. Vesd össze a kitöltött tagok celláit a zóna-címkékkel (magas/közepes/alacsony). 4. Nézd meg az org-oldali HEXACO-átlagot is.",
    expected:
      "A heatmap 3 kitöltésnél már él; a kitöltés nélküli tag cellái üres jelölést (–) mutatnak, NEM 0 értéket; a kitöltött celláknál a szín-intenzitás és a zóna-címke a pontszámot követi (H/E/X/A/C/O betűkkel); az org-szintű HEXACO-átlag csak 3+ kitöltött tagnál jelenik meg.",
    automated: "partial",
    coveredBy:
      "tests/e2e/team/team-intelligence-visual.test.ts (sufficient-data snapshot)",
    priority: "P2",
  },
  {
    id: "TEAM-07",
    area: "Csapatkép-küszöbök",
    name: "Nyers csapat-fülek tanácsadó-only: admin/manager/tag átirányul az overview-ra",
    persona: "org admin + manager + tag",
    emails: { admin: "AUTO", manager: "AUTO", tag: "AUTO" },
    preconditions:
      "Csapat 3+ kitöltéssel; NEM-tanácsadó org admin, manager és tag fiókok; nincs publikált csapat-riport.",
    steps:
      "1. Mindhárom szereppel nyisd meg közvetlen URL-lel: /team/[id]?tab=intelligence, ?tab=profile, ?tab=teamRole. 2. Nyisd meg a ?tab=report fület publikált riport nélkül. 3. Nézd meg, mit mutat az overview.",
    expected:
      "A nyers egyéni/páros adatot hordozó fülek (intelligence, profile, teamRole) NEM-tanácsadónak nem nyílnak meg — átirányítás ?tab=overview-ra (a kör: ORG_CONSULTANT + platform-tanácsadó/admin); a report fül publikált riport nélkül szintén overview-ra irányít; az overview haladás-nézetet ad, publikálás után a validált riportot.",
    automated: "partial",
    coveredBy:
      "tests/unit/platform/team-intelligence.test.ts (raw team results are consultant-only)",
    priority: "P1",
  },

  // ── Manager cockpit ───────────────────────────────────────────────────
  {
    id: "TEAM-08",
    area: "Manager cockpit",
    name: "Cockpit-küszöb: 1 csapatnál redirect, 2+ csapatnál összegző, csapat híján fallback",
    persona: "org manager",
    emails: { fő: "AUTO" },
    preconditions:
      "ORG_MANAGER fiók változtatható számú kezelt csapattal (0 → 1 → 2, az admin segítségével).",
    steps:
      "1. Kezelt csapat NÉLKÜL nyisd meg a /manager-t. 2. 1 kezelt csapattal nyisd meg újra. 3. 2 kezelt csapattal nyisd meg újra, és nézd a csapat-kártyák sorrendjét.",
    expected:
      "0 csapat: NEM a /dashboard-ra dob (loop-guard), hanem az org-cockpitra, org-tagság híján a /profile/results-ra; 1 csapat: azonnali redirect /team/[id]-ra; 2+ csapat: cockpit-összegző csapat-kártyákkal (kitöltöttség-sávok, a legalacsonyabb kitöltöttségű elöl), összesített metrikákkal és esemény-listával.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "TEAM-09",
    area: "Manager cockpit",
    name: "Next-step ágak I.: tag-hiány (<3 tag) előbb, mint kitöltés-hiány",
    persona: "org manager",
    emails: { fő: "AUTO" },
    preconditions:
      "Manager 2 kezelt csapattal, amelyből az egyik 3-nál kevesebb tagú; a másikban van kitöltetlen self-teszt.",
    steps:
      "1. Nyisd meg a /manager cockpitot és nézd a javasolt-következő-lépés kártyát. 2. Hívj meg tagokat, hogy minden csapat 3+ tagú legyen (kitöltetlen self maradjon). 3. Nézd meg újra a kártyát.",
    expected:
      "Amíg van 3 tag alatti csapat, a next-step »Csapat bővítése« (a 3-as küszöb indoklásával, tag-meghívó CTA a members fülre) — ez megelőzi a kitöltés-hiányt; utána »Kitöltések lezárása« a hiányzó kitöltők számával és a tag-státusz CTA-val.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "TEAM-10",
    area: "Manager cockpit",
    name: "Next-step ágak II.: futó kör követése, majd minden-rendben állapot",
    persona: "org manager",
    emails: { fő: "AUTO" },
    preconditions:
      "Manager 2 kezelt csapattal, mindkettő 3+ tagú és 100% self-kitöltöttségű; egy csapaton aktív kampány (tanácsadó indította).",
    steps:
      "1. Aktív kampány mellett nyisd meg a cockpitot, nézd a next-step kártyát. 2. Zárasd le a kört a tanácsadóval. 3. Nézd meg újra a kártyát.",
    expected:
      "Futó körnél »Feedback kör nyomon követése« X/Y observer-visszajelzés számmal és a kampány-fülre mutató CTA-val (/org/[id]?tab=campaigns); teendő nélkül »Minden rendben« nézet a csapatkép CTA-val.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
];

// Kampány-életciklus (DRAFT→ACTIVE→CLOSED, 6 mérés-lépés, ütem-kapu,
// értesítések, tanácsadó-only kezelés) és csapatszerep-360 (self + peer,
// min. 3 értékelő, becsült vs mért forrás-badge). A lépések a kód
// tényleges ágaira épülnek: src/app/api/org/[id]/campaigns/[campaignId]/
// route.ts · lib/campaign-steps-core.ts + campaign-steps.ts ·
// measurement-auth.ts · team-role-questions.ts · team-role-peer.ts ·
// team-role-estimate.ts · components/team/TeamRoleSection.tsx.
export const cases = [
  // ── Kampány-életciklus ────────────────────────────────────────────────
  {
    id: "CAMP-01",
    area: "Kampány-életciklus",
    name: "Több-lépéses kampány létrehozása vázlatként (wizard)",
    persona: "tanácsadó",
    emails: { "tanácsadó": "AUTO" },
    preconditions:
      "ORG_CONSULTANT hozzáférés egy 3+ tagú csapatot tartalmazó orgban.",
    steps:
      "1. Nyisd meg az /org/[id]?tab=campaigns fület, indíts új mérést. 2. Válassz TÖBB mérést (pl. külső visszajelzés + csapatszerep-kérdőív + csapattársi szerep-visszajelzés). 3. Válassz cél-csapatot és résztvevőket. 4. Az azonnali aktiválás kapcsolót hagyd KI, mentsd el. 5. Nézd meg a Kampányok fület.",
    expected:
      "A kampány DRAFT státuszban jön létre auto-névvel; a lépések kanonikus sorrendben tárolódnak (személyiség → szerepek → biztonság), duplikátum nélkül; a résztvevő-lista rögzül; a vázlat szerkeszthetőként jelenik meg a listában, a tagok még SEMMILYEN értesítést nem kapnak.",
    automated: "partial",
    coveredBy:
      "tests/unit/platform/campaign-steps.test.ts (normalizeCampaignSteps)",
    priority: "P1",
  },
  {
    id: "CAMP-02",
    area: "Kampány-életciklus",
    name: "DRAFT szerkesztése aktiválás előtt – csapat-kötött lépéshez cél-csapat kell",
    persona: "tanácsadó",
    emails: { "tanácsadó": "AUTO" },
    preconditions: "CAMP-01 vázlat-kampánya.",
    steps:
      "1. A vázlaton módosítsd a nevet, a mérés-készletet és a lépés-ütemet (óra). 2. Cserélj cél-csapatot. 3. Próbáld a csapat-kötött lépést (pl. csapatszerep) cél-csapat NÉLKÜL menteni. 4. Mentsd el a végleges összeállítást.",
    expected:
      "Aktiválás előtt minden módosítható (mérések, cél-csapat(ok), ütem, név, leírás), a lépés-sorrend mentéskor újra-normalizálódik; csapat-kötött lépés cél-csapat nélkül TEAM_REQUIRED hibával elutasítva; másik org csapata INVALID_TEAM.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "CAMP-03",
    area: "Kampány-életciklus",
    name: "Vázlat nem zárható le – az elvetés útja a törlés",
    persona: "tanácsadó",
    emails: { "tanácsadó": "AUTO" },
    preconditions: "Egy DRAFT kampány.",
    steps:
      "1. Próbáld a vázlatot lezárni (ha a felület nem kínálja, API-val: PATCH status=CLOSED). 2. Töröld (vesd el) a vázlatot. 3. Nézd meg a Lezárt körök listát.",
    expected:
      "DRAFT→CLOSED tiltott (409 DRAFT_CANNOT_CLOSE) – a Lezárt körök listába csak ténylegesen futott mérés kerülhet; a törölt vázlat sehol (a lezárt listában sem) jelenik meg többé.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "CAMP-04",
    area: "Kampány-életciklus",
    name: "Aktiválás: visszafordíthatatlan indítás, fast-forward és szerep-kör bekapcsolás",
    persona: "tanácsadó + csapattagok",
    emails: { "tanácsadó": "AUTO", "tag-self-kész": "AUTO", "tag-self-nélkül": "AUTO" },
    preconditions:
      "DRAFT kampány, első lépése külső visszajelzés (OBSERVER_360), tartalmaz csapatszerep-lépést is; a résztvevők közt van kész self-tesztű és self-teszt nélküli tag.",
    steps:
      "1. Aktiváld a kampányt. 2. Nézd meg a két tag kampány-állapotát (melyik lépésük nyitott). 3. Nézd meg a cél-csapat oldalát (szerep-kör jelzés). 4. Próbáld az aktív kampány összetételét (mérések/cél-csapat) utólag szerkeszteni. 5. Keresd a felületen a DRAFT-ba visszaállítás lehetőségét.",
    expected:
      "Státusz ACTIVE (activatedAt rögzül); a self-kész tag az OBSERVER_360 lépésen automatikusan túllép (fast-forward – nem ragad be), a self-nélkülinek az első lépése nyílik; CAMPAIGN_LAUNCHED értesítés megy ki; a csapatszerep-lépés miatt a csapat szerep-köre bekapcsol; az összetétel-szerkesztés CAMPAIGN_NOT_DRAFT hibával elutasítva, és a felület nem kínál visszaállítást – az indítás visszafordíthatatlan.",
    automated: "partial",
    coveredBy:
      "tests/unit/platform/campaign-steps.test.ts (lépés-teljesítés + fast-forward logika)",
    priority: "P1",
  },
  {
    id: "CAMP-05",
    area: "Kampány-életciklus",
    name: "Lépések felhasználónkénti, sorrendi nyitása – ütem-kapu és küldés-most",
    persona: "csapattag + tanácsadó",
    emails: { tag1: "AUTO", tag2: "AUTO", "tanácsadó": "AUTO" },
    preconditions:
      "Aktív, több-lépéses kampány 24 órás lépés-ütemmel; két résztvevő eltérő haladással.",
    steps:
      "1. Tag1 teljesítse az aktuális lépését (pl. self-teszt beadás). 2. Nézd meg tag1 következő lépését közvetlenül utána (Feladataim / csapat-banner). 3. Tanácsadóként használd a küldés-most opciót. 4. Ellenőrizd tag2 állapotát (nem változhatott). 5. Ismételd meg a küldés-most-ot.",
    expected:
      "A következő lépés a beadás után NEM nyílik azonnal – az ütem-kapu (24 h) zárja; a küldés-most (force release) azonnal nyitja, és MEASUREMENT_STEP_OPENED értesítés megy ki a lépés kitöltő-linkjével; 0 órás ütemnél a nyitás azonnali; a tagok egymástól függetlenül haladnak; az ismételt release a dedupe-kulcs miatt nem duplikál értesítést.",
    automated: "partial",
    coveredBy:
      "tests/unit/platform/campaign-steps.test.ts · tests/unit/team/trust-network.test.ts (isStepGateOpen ütem-kapu)",
    priority: "P1",
  },
  {
    id: "CAMP-06",
    area: "Kampány-életciklus",
    name: "Kampány-értesítési lánc: launched → step-opened → closed, role-aware címzés",
    persona: "org tag + manager + admin",
    emails: { tag: "AUTO", manager: "AUTO", admin: "AUTO" },
    preconditions:
      "Indítható és zárható kampány; tag, manager és admin fiók ugyanabban az orgban.",
    steps:
      "1. Indítsd el a kört, és nézd meg mindhárom szerep értesítés-panelét. 2. Teljesíts egy lépést és figyeld a következő-lépés értesítést. 3. Zárd le a kört, nézd meg újra a paneleket. 4. Zárd le még egyszer (ismételt PATCH), és számold az értesítéseket.",
    expected:
      "Indításkor CAMPAIGN_LAUNCHED, lépés-nyitáskor MEASUREMENT_STEP_OPENED (a kitöltőnek), zárásnál CAMPAIGN_CLOSED érkezik – a címzett-kör a notification-policy minimum-szerepét követi; a dedupe-kulcs miatt ismétlés nem duplikál. Megjegyzés: a CAMPAIGN_MILESTONE típus definiált, de jelenleg nincs kibocsátója – mérföldkő-értesítés NEM várható (ismert rés).",
    automated: "partial",
    coveredBy:
      "tests/unit/notifications/notification-policy.test.ts · tests/unit/notifications/notification-dedupe.test.ts",
    priority: "P2",
  },
  {
    id: "CAMP-07",
    area: "Kampány-életciklus",
    name: "Zárás: CLOSED állapot, szerep-kör kikapcsol, eredmények megmaradnak",
    persona: "tanácsadó",
    emails: { "tanácsadó": "AUTO" },
    preconditions:
      "Aktív kampány csapatszerep-lépéssel, részleges kitöltésekkel.",
    steps:
      "1. Zárd le a kört a Kampányok fülön. 2. Nézd meg a kör helyét a listában (aktív vs lezárt). 3. Nyisd meg a cél-csapat oldalát (szerep-kör jelzés). 4. Résztvevőként próbáld a lezárt kör kitöltőjét megnyitni/beadni. 5. Nézd meg a begyűjtött eredményeket.",
    expected:
      "Státusz CLOSED (closedAt rögzül), a kör a Lezárt körök listába kerül; a csapat szerep-kör jelzése kikapcsol; CAMPAIGN_CLOSED értesítés megy ki; a lezárt körre új beadás már nem könyvelődik; a már begyűjtött eredmények olvashatók maradnak.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "CAMP-08",
    area: "Kampány-életciklus",
    name: "Mérés-kezelés tanácsadó-only: admin/manager/tag számára tiltott",
    persona: "org admin + manager + tag + tanácsadó",
    emails: { admin: "AUTO", manager: "AUTO", tag: "AUTO", "tanácsadó": "AUTO" },
    preconditions:
      "Org NEM-tanácsadó adminnal, managerrel és taggal; van DRAFT és ACTIVE kampány.",
    steps:
      "1. Mindhárom nem-tanácsadó szereppel keresd a mérés-indítás/aktiválás/zárás akciókat a felületen. 2. API-val is próbáld: PATCH státusz-váltás, résztvevő-hozzáadás, DELETE. 3. Ismételd tanácsadóként.",
    expected:
      "A mérés-mutációk csak a tanácsadói körnek (ORG_CONSULTANT / platform-tanácsadó / ADMIN_EMAILS fiók) engedettek – másnak a felület nem kínálja, az API 403 CONSULTANT_ONLY hibát ad (a sima ORG_ADMIN-nak is!); a tanácsadó mindhárom műveletet el tudja végezni.",
    automated: "partial",
    coveredBy:
      "tests/client/policy/page-action-gating.integration.test.tsx (create campaign gating)",
    priority: "P1",
  },

  // ── Csapatszerep-360 ──────────────────────────────────────────────────
  {
    id: "ROLE-01",
    area: "Csapatszerep-360",
    name: "Self szerep-kérdőív: 8–12 jelölés + pontosan 3 kiemelés, trita-szerepnyelv",
    persona: "csapattag",
    emails: { fő: "AUTO" },
    preconditions:
      "Aktív szerep-kör (csapatszerep-lépéses kampány) a user csapatán; a user lépése nyitott.",
    steps:
      "1. Nyisd meg a kitöltőt (/assessment/team-roles, értesítés-linkről vagy Feladataimból). 2. Próbálj 8-nál kevesebb jelöléssel beadni. 3. Jelölj 8–12 jellemző állítást, próbáld 2 vagy 4 kiemeléssel beadni. 4. Emelj ki pontosan 3-at, add be. 5. Nézd meg az eredményt és a szövegezést.",
    expected:
      "Érvénytelen készlet (8 alatt, 12 felett, nem pontosan 3 kiemelt) nem adható be; sikeres beadás után a 9 trita-szerep profilja + top-szerepek jelennek meg; a kampány-lépés teljesül, a következő lépés (ütem szerint) nyílik; a user-facing szövegben sehol nem szerepel a Belbin név – a mérés neve csapatszerep-kérdőív.",
    automated: "partial",
    coveredBy:
      "tests/unit/team/team-role-scoring.test.ts (itembank + validálás + pontozás)",
    priority: "P1",
  },
  {
    id: "ROLE-02",
    area: "Csapatszerep-360",
    name: "Peer-kép anonimitás-küszöb: 3 értékelő alatt nincs aggregátum",
    persona: "csapattagok (értékelt + 3 értékelő)",
    emails: { "értékelt": "AUTO", "értékelő1": "AUTO", "értékelő2": "AUTO", "értékelő3": "AUTO" },
    preconditions:
      "Aktív csapattársi szerep-visszajelzés (TEAM_ROLE_360) lépés egy 4+ fős csapaton; az értékeltnek kész self szerep-kitöltése.",
    steps:
      "1. Az értékelő1 és értékelő2 adjon szerep-visszajelzést az értékeltre (/assessment/team-roles/peers). 2. Nézd meg az értékelt peer-képét (saját eredmény-nézet és tanácsadói dossier). 3. Az értékelő3 is adjon visszajelzést. 4. Nézd meg újra.",
    expected:
      "2 értékelőnél NINCS aggregált peer-kép: küszöb-szöveg jelenik meg (legalább 3 értékelő kell, jelenlegi darabszámmal), és egyéni értékelő-válasz SOHA, sehol nem látszik; a 3. beérkezésekor összeáll az átlagolt szerep-profil + top-szerepek, az értékelő-szám kiírásával.",
    automated: "partial",
    coveredBy:
      "tests/unit/team/team-role-scoring.test.ts (peer aggregate anonymity threshold)",
    priority: "P1",
  },
  {
    id: "ROLE-03",
    area: "Csapatszerep-360",
    name: "Forrás-badge: HEXACO-becslés vs valódi kitöltés – a mért mindig felülír",
    persona: "tanácsadó",
    emails: { "tanácsadó": "AUTO", "tag-kitöltés-nélkül": "AUTO" },
    preconditions:
      "Csapat, ahol van szerep-kérdőívet kitöltött ÉS csak self-tesztes (szerep-kérdőív nélküli) tag is; tanácsadói hozzáférés a /team/[id]?tab=teamRole fülhöz.",
    steps:
      "1. Nyisd meg a szerep-fület, nézd meg a két tag kártyáját és jelölését. 2. Nézd meg az összesítő sort (kitöltés/becslés arány). 3. A kitöltés nélküli tag töltse ki a szerep-kérdőívet. 4. Frissítsd a nézetet.",
    expected:
      "A kitöltés nélküli tag szerep-képe a HEXACO-profilból becsült, explicit »becslés« badge-dzsel; a kitöltött tagnál valódi-kitöltés jelölés; az összesítő kiírja az arányt (X valódi kitöltés · Y profil-alapú becslés); kitöltés után a mért eredmény azonnal felülírja a becslést (valódi kitöltés > becslés precedencia) és a badge átvált.",
    automated: "partial",
    coveredBy:
      "tests/unit/team/team-role-precedence.test.ts (resolveDisplayRoleScores)",
    priority: "P1",
  },
  {
    id: "ROLE-04",
    area: "Csapatszerep-360",
    name: "Önkép vs csapatkép összevetés a top-3 szerepeken",
    persona: "csapattag",
    emails: { fő: "AUTO" },
    preconditions:
      "A tagnak kész self szerep-kitöltése ÉS 3+ értékelős peer-képe van (ROLE-02 után).",
    steps:
      "1. Nyisd meg a saját eredmény-nézet szerep-szekcióját (/profile/results). 2. Vesd össze az önkép és a csapatkép top-3 listáját. 3. Tanácsadóként nézd meg ugyanezt a tag-dossziéban.",
    expected:
      "A top-3 önkép és top-3 csapatkép egymás mellett jelenik meg; a közös, a csak-önkép és a csak-csapatkép szerepek megkülönböztetve; küszöb alatti peer-képnél az összevetés nem jelenik meg (csak a küszöb-szöveg); a dossziét kizárólag a tanácsadói kör éri el, a sima org admin nem.",
    automated: "partial",
    coveredBy:
      "tests/unit/team/team-role-scoring.test.ts (self vs peer top-3) · tests/unit/policy/member-dossier.test.ts (dossier-hozzáférés)",
    priority: "P2",
  },
  {
    id: "ROLE-05",
    area: "Csapatszerep-360",
    name: "Szerep-kör életciklus a csapat-felületen: kör-kártya haladással",
    persona: "tanácsadó",
    emails: { "tanácsadó": "AUTO" },
    preconditions:
      "Csapatszerep-lépéses kampány DRAFT-ban; 3+ tagú cél-csapat.",
    steps:
      "1. Aktiváld a kampányt, és nyisd meg a csapat szerep-nézetét. 2. Nézd a kör-kártya állapotát kitöltések előtt. 3. Két tag töltse ki, frissíts. 4. Zárd le a kört, frissíts.",
    expected:
      "Aktiváláskor a kör aktív jelzést és X/Y kitöltés-haladást mutat a kitöltetlen tagok számával; minden beérkezett kitöltésnél frissül; záráskor az aktív jelzés eltűnik, a begyűjtött szerep-eredmények (forrás-badge-ekkel) megmaradnak.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
];

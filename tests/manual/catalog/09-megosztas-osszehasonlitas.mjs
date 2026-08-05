// Megosztás és összehasonlítás — ShareModal (halasztott link-létrehozás,
// email, visszavonás), publikus /share/[token] + OG-kép, és a valódi páros
// összehasonlítás (/interaction, consent-oldal állapotgépe). Kód:
// components/results/{ShareModal,CompareInviteCard,PairInteractionView},
// api/profile/share{,/send}, app/(app)/share/[token], api/interaction/
// invite{,/[token]/accept}, app/(app)/interaction/compare/[token],
// lib/compare-invite.ts (max 3 aktív meghívó, 30 nap TTL).
export const cases = [
  {
    id: "SHARE-01",
    area: "Megosztás és összehasonlítás",
    name: "ShareModal megnyitása még NEM hoz létre publikus linket",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "Kitöltött eredmény; korábban soha nem volt megosztás ezen a fiókon.",
    steps:
      "1. A /profile/results hero-jában nyisd meg a megosztás-modalt. 2. Nézd meg a link-mezőt kattintás nélkül. 3. Zárd be a modalt bármilyen művelet nélkül, majd nyisd meg újra.",
    expected:
      "A modal előnézeti kártyát (név + típuscímke + top-2 dimenzió chip) mutat, de a link-mező csak „…” placeholder-t tartalmaz — publikus URL csak az első tényleges megosztási szándéknál (másolás/küldés) készül. Újranyitáskor sincs kész link.",
    automated: "full",
    coveredBy: "tests/client/results/share-modal.integration.test.tsx",
    priority: "P2",
  },
  {
    id: "SHARE-02",
    area: "Megosztás és összehasonlítás",
    name: "Link másolása: első másolás létrehozza + vágólapra teszi",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "ShareModal nyitva, link még nincs létrehozva.",
    steps:
      "1. Kattints a „Link másolása” gombra. 2. Figyeld a gomb visszajelzését és a link-mezőt. 3. Illeszd be a vágólap tartalmát egy inkognitó ablak címsorába. 4. Másold újra, hasonlítsd össze a két URL-t.",
    expected:
      "Első kattintásra a link-mezőben megjelenik a https://…/share/<token> URL, a gombon pár másodpercre „Másolva” pipa látszik (nincs böngésző-alert). Az inkognitóban megnyitott link a megosztott profilt tölti be. Az ismételt másolás UGYANAZT az URL-t adja (idempotens).",
    automated: "partial",
    coveredBy: "tests/client/results/share-modal.integration.test.tsx",
    priority: "P1",
  },
  {
    id: "SHARE-03",
    area: "Megosztás és összehasonlítás",
    name: "Megosztó link küldése emailben",
    persona: "self-user",
    emails: { fő: "AUTO", címzett: "AUTO" },
    preconditions:
      "ShareModal nyitva (a linket előzőleg nem kötelező létrehozni).",
    steps:
      "1. Írd be a címzett teszt-emailjét az email-mezőbe. 2. Kattints a küldés gombra. 3. Nyisd meg a címzett postafiókját, kattints a levélben kapott linkre.",
    expected:
      "Küldés közben a gomb „küldés” állapotot mutat, siker után zöld „Email elküldve” visszajelzés jön és a mező kiürül. A címzett levelet kap a feladó nevével; a benne lévő link a működő /share/<token> oldalra visz (a token szerver-oldalon jött létre, ha addig nem létezett).",
    automated: "partial",
    coveredBy: "tests/client/results/share-modal.integration.test.tsx",
    priority: "P2",
  },
  {
    id: "SHARE-04",
    area: "Megosztás és összehasonlítás",
    name: "Érvénytelen email a küldő-mezőben → helyi validáció",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "ShareModal nyitva.",
    steps:
      "1. Írj be érvénytelen címet (pl. „nememail”), kattints a küldésre. 2. Kezdd el javítani a mezőt.",
    expected:
      "A mező alatt azonnali hibaszöveg jelenik meg, hálózati kérés NEM indul (nem jön „elküldve” állapot); gépelésre a hibajelzés eltűnik. Üres mezőnél a küldés gomb eleve tiltott.",
    automated: "full",
    coveredBy: "tests/client/results/share-modal.integration.test.tsx",
    priority: "P3",
  },
  {
    id: "SHARE-05",
    area: "Megosztás és összehasonlítás",
    name: "Megosztás visszavonása → a publikus link megszűnik",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "Élő megosztó link (SHARE-02), az URL kimásolva egy jegyzetbe.",
    steps:
      "1. A ShareModalban kattints a visszavonás gombra. 2. Nézd meg a modal állapotát. 3. Nyisd meg a korábban kimásolt /share/<token> URL-t inkognitóban.",
    expected:
      "A modal visszavont állapotra vált („Új link létrehozása” gombbal). A régi URL többé nem mutatja a profilt: barátságos „Ez a link már nem él” oldal jön (nem 404), rajta saját teszt (/try) és bejelentkezés CTA-kkal.",
    automated: "partial",
    coveredBy: "tests/client/results/share-modal.integration.test.tsx",
    priority: "P1",
  },
  {
    id: "SHARE-06",
    area: "Megosztás és összehasonlítás",
    name: "Új link visszavonás után: friss token, a régi halott marad",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "SHARE-05 után: visszavont állapotú modal, régi URL feljegyezve.",
    steps:
      "1. Kattints az „Új link létrehozása” gombra, majd másold ki az új linket. 2. Hasonlítsd össze a régi URL-lel. 3. Nyisd meg mindkettőt inkognitóban.",
    expected:
      "Az új token KÜLÖNBÖZIK a régitől; az új link a profilt mutatja, a régi továbbra is a „link már nem él” oldalt adja — a visszavonás nem éled újra.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "SHARE-07",
    area: "Megosztás és összehasonlítás",
    name: "Publikus /share/[token] oldal tartalma kijelentkezett látogatónak",
    persona: "vendég",
    emails: { fő: "AUTO" },
    preconditions: "Élő megosztó link; inkognitó böngésző.",
    steps:
      "1. Nyisd meg a /share/<token> oldalt kijelentkezve. 2. Görgesd végig a teljes oldalt.",
    expected:
      "Fejléc: a megosztó felhasználóneve + karakter-ábra + típuscímke + kitöltés-dátum. Alatta 6 dimenziós sáv-összefoglaló (pontszám + szint-címke), dimenziónkénti insight-kártyák, munkastílus-szekciók és top-3 csapatszerep (HEXACO-ból becsült). Az oldal alján „készítsd el a sajátod” CTA-doboz a /try-ra.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "SHARE-08",
    area: "Megosztás és összehasonlítás",
    name: "Megosztott oldal bejelentkezett látogatónak: nincs önreklám-CTA",
    persona: "self-user",
    emails: { fő: "AUTO", megosztó: "AUTO" },
    preconditions:
      "Élő megosztó link egy MÁSIK user profiljáról; te bejelentkezve.",
    steps:
      "1. Bejelentkezett munkamenetben nyisd meg a más által küldött /share/<token> linket. 2. Görgess az oldal aljára.",
    expected:
      "A profil-tartalom ugyanúgy megjelenik, de az oldal-alji „készítsd el a sajátod” CTA-doboz NEM látszik (bejelentkezett usernek nincs értelme).",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "SHARE-09",
    area: "Megosztás és összehasonlítás",
    name: "OG-kép: személyre szabott link-előnézet, érvénytelen tokenre brand-kép",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Élő megosztó link.",
    steps:
      "1. Illeszd be a /share/<token> linket egy előnézet-generálóba (pl. Slack/Discord üzenet vagy opengraph.xyz). 2. Nézd meg a kapott képet. 3. Ismételd meg a token utolsó karakterét elrontva.",
    expected:
      "Az érvényes link előnézeti képe a megosztó nevét, típuscímkéjét és a domináns dimenzió glyph-sziluettjét mutatja (1200×630). Az elrontott tokenre generikus trita brand-kép jön — nem hibaoldal és nem 500-as kép.",
    automated: "partial",
    coveredBy: "tests/unit/results/share-og.test.ts",
    priority: "P2",
  },
  {
    id: "SHARE-10",
    area: "Megosztás és összehasonlítás",
    name: "Kártya-kép letöltése a ShareModalból",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "ShareModal nyitva, kitöltött eredmény.",
    steps:
      "1. A modal előnézeti kártyája alatt kattints a kép-letöltés gombra (mobilon a natív megosztásra). 2. Nyisd meg a letöltött képet.",
    expected:
      "PNG-kártya töltődik le a névvel, típuscímkével és a karakter-ábrával — kliens-oldali render, számszerű pontszám nem szerepel a képen, és a letöltéshez publikus link nem jön létre.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "CMP-01",
    area: "Megosztás és összehasonlítás",
    name: "/interaction belépő saját eredménnyel: szimulátor + meghívó-kártya",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Kitöltött saját eredmény, még nincs páros meghívó.",
    steps:
      "1. Nyisd meg a /interaction oldalt. 2. Nézd meg a meghívó-kártyát és az archetípus-választós szimulációt. 3. Válts archetípust a választóban.",
    expected:
      "Az oldal saját intróval nyit; felül az „összehasonlítás valódi kollégával” kártya (üres lista-állapottal), alatta az archetípus-szimuláció a saját típusoddal az egyik oldalon. Az archetípus-váltás hálózati kérés nélkül azonnal új szöveget hoz.",
    automated: "partial",
    coveredBy:
      "tests/client/results/interaction-section.integration.test.tsx; tests/unit/platform/interaction-view.test.ts",
    priority: "P2",
  },
  {
    id: "CMP-02",
    area: "Megosztás és összehasonlítás",
    name: "/interaction saját eredmény nélkül → állapot-oldal teszt-CTA-val",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Onboardolt fiók kitöltött eredmény NÉLKÜL.",
    steps: "1. Nyisd meg a /interaction oldalt eredmény nélküli fiókkal.",
    expected:
      "Nem néma visszapattanás: címzett állapot-oldal magyarázza, hogy az összehasonlításhoz saját kitöltés kell, CTA-val az /assessment oldalra.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "CMP-03",
    area: "Megosztás és összehasonlítás",
    name: "Páros meghívó-link létrehozása (email nélkül) + másolás",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Kitöltött eredmény, kevesebb mint 3 aktív meghívó.",
    steps:
      "1. A /interaction meghívó-kártyáján hagyd üresen az email-mezőt, kattints az „Összehasonlító link készítése” gombra. 2. Nézd meg a lista új sorát. 3. Kattints a másolás gombra, illeszd be az URL-t jegyzetbe.",
    expected:
      "A listában új „függőben” állapotú sor jelenik meg a mai dátummal, másolás/QR/visszavonás gombokkal. A másolás pár másodperces „másolva” visszajelzést ad, és a vágólapon a /interaction/compare/<token> URL van. A kártya jelzi a limitet (max 3 aktív) és hogy az email opcionális.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "CMP-04",
    area: "Megosztás és összehasonlítás",
    name: "Páros meghívó email-küldéssel",
    persona: "self-user",
    emails: { fő: "AUTO", partner: "AUTO" },
    preconditions: "Kitöltött eredmény, kevesebb mint 3 aktív meghívó.",
    steps:
      "1. Írd be a partner teszt-emailjét a meghívó-kártya mezőjébe, kattints a link-készítésre. 2. Figyeld a visszajelzést. 3. Nyisd meg a partner postafiókját.",
    expected:
      "„Email elküldve” jellegű visszajelzés jön és a mező kiürül; a lista új függő sort mutat. A partner levelet kap a meghívó nevével, benne a /interaction/compare/<token> linkkel.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "CMP-05",
    area: "Megosztás és összehasonlítás",
    name: "Email-kézbesítési hiba: a link attól még él",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions:
      "Dev/staging környezet, ahol az email-küldés hibára állítható (pl. érvénytelen RESEND_API_KEY).",
    steps:
      "1. Hibára állított email-küldés mellett készíts meghívót email-címmel. 2. Nézd meg a visszajelzést és a listát. 3. Másold ki és nyisd meg a linket.",
    expected:
      "A felület jelzi, hogy az email küldése nem sikerült, de a meghívó LÉTREJÖTT: a függő sor ott van, a link másolható és működik — a kézbesítési hiba nem nyeli el a linket.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "CMP-06",
    area: "Megosztás és összehasonlítás",
    name: "QR-kód megjelenítés és beolvasás (workshop-út)",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Függő páros meghívó létezik; kéznél egy telefon.",
    steps:
      "1. A függő meghívó soránál kattints a QR gombra. 2. Olvasd be a kódot a telefon kamerájával. 3. Kattints a QR gombra újra.",
    expected:
      "A kártya alján QR-kép jelenik meg magyarázó szöveggel; a beolvasott URL a /interaction/compare/<token> consent-oldalra visz (telefonon bejelentkezés után). Az újbóli kattintás elrejti a QR-t.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "CMP-07",
    area: "Megosztás és összehasonlítás",
    name: "Meghívó-limit: a 4. aktív link elutasítása",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Kitöltött eredmény, 0 aktív meghívó induláskor.",
    steps:
      "1. Készíts egymás után 3 meghívó-linket (email nélkül). 2. Próbálj negyediket készíteni. 3. Vonj vissza egyet, és próbáld újra.",
    expected:
      "Az első 3 létrejön; a 4. kérésre hibaüzenet jön a limitről (max 3 aktív meghívó), új sor NEM keletkezik. Egy meghívó visszavonása után a készítés újra működik — a visszavont/lejárt nem számít bele a limitbe.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "CMP-08",
    area: "Megosztás és összehasonlítás",
    name: "Consent-oldal kijelentkezve: sign-in a token megőrzésével",
    persona: "self-user",
    emails: { fő: "AUTO", partner: "AUTO" },
    preconditions:
      "Függő meghívó-link; a partner-fióknak van kitöltött eredménye; a partner kijelentkezve.",
    steps:
      "1. Kijelentkezett böngészőben nyisd meg a kapott /interaction/compare/<token> linket. 2. Jelentkezz be a partner-fiókkal a felkínált sign-in oldalon.",
    expected:
      "A link a /sign-in oldalra visz redirect_url-lel; a belépés után automatikusan a consent-oldalra kerülsz (a token nem veszik el útközben) — a meghívó nevével és elfogadás/elutasítás gombokkal.",
    automated: "none",
    coveredBy: "",
    priority: "P1",
  },
  {
    id: "CMP-09",
    area: "Megosztás és összehasonlítás",
    name: "Consent elfogadása → páros nézet mindkét oldalon",
    persona: "két self-user",
    emails: { fő: "AUTO", partner: "AUTO" },
    preconditions:
      "Függő meghívó; mindkét fiókban kitöltött saját eredmény; a partner a consent-oldalon áll.",
    steps:
      "1. Partnerként olvasd el a consent-kártyát (mit lát a másik fél), kattints az „Elfogadom — mutassátok” gombra. 2. Nézd meg a betöltő oldalt. 3. A meghívó fiókjában frissítsd a /interaction oldalt, nyisd meg a párt.",
    expected:
      "Elfogadás után a partner a /interaction?pair=<id> páros nézetre kerül. A meghívó oldalán a sor „elfogadva” állapotra vált a partner nevével és „megnyitás” linkkel — ugyanaz a páros nézet nyílik. A meghívó in-app értesítést is kap az elfogadásról.",
    automated: "partial",
    coveredBy: "tests/unit/results/pair-simulation.test.ts",
    priority: "P1",
  },
  {
    id: "CMP-10",
    area: "Megosztás és összehasonlítás",
    name: "Consent elutasítása („mégsem”) ága",
    persona: "self-user",
    emails: { fő: "AUTO", partner: "AUTO" },
    preconditions: "Függő meghívó, a partner a consent-oldalon áll.",
    steps:
      "1. A consent-oldalon a partner kattintson az elutasítás/mégsem gombra. 2. A meghívó oldalán ellenőrizd a meghívó állapotát.",
    expected:
      "A partner a /dashboard-ra kerül, elfogadás NEM történik: a meghívó a meghívónál továbbra is „függőben” marad, és a link később még elfogadható.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "CMP-11",
    area: "Megosztás és összehasonlítás",
    name: "Consent saját eredmény nélkül: a jutalom kitöltéshez kötött",
    persona: "self-user",
    emails: { fő: "AUTO", partner: "AUTO" },
    preconditions:
      "Függő meghívó; a partner-fióknak NINCS kitöltött eredménye.",
    steps:
      "1. A partner-fiókkal nyisd meg a meghívó-linket. 2. Kövesd a felkínált CTA-t, töltsd ki a tesztet. 3. Nyisd meg újra ugyanazt a linket.",
    expected:
      "Először állapot-oldal jön: az összehasonlításhoz saját kitöltés kell, CTA az /assessment-re (consent-gomb nincs). A kitöltés után ugyanaz a link már a consent-kártyát mutatja, és az elfogadás működik.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
  {
    id: "CMP-12",
    area: "Megosztás és összehasonlítás",
    name: "Saját meghívó-link megnyitása → vissza a kezelőhöz",
    persona: "self-user",
    emails: { fő: "AUTO" },
    preconditions: "Saját függő meghívó-link kimásolva.",
    steps:
      "1. A meghívó (saját) fiókkal nyisd meg a saját /interaction/compare/<token> linkedet.",
    expected:
      "Nincs ön-összehasonlítás: automatikus átirányítás a /interaction kezelő-oldalra, consent-kártya nem jelenik meg.",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "CMP-13",
    area: "Megosztás és összehasonlítás",
    name: "Érvénytelen vagy visszavont meghívó-link → barátságos hibalap",
    persona: "self-user",
    emails: { fő: "AUTO", partner: "AUTO" },
    preconditions:
      "Egy visszavont meghívó linkje (CMP-16 előkészítheti) és egy kitalált token.",
    steps:
      "1. Bejelentkezve nyisd meg a /interaction/compare/ertelmetlen-token URL-t. 2. Nyisd meg egy VISSZAVONT meghívó korábban kimásolt linkjét.",
    expected:
      "Mindkét esetben ugyanaz a barátságos állapot-oldal jön („Ez a link nem él” jellegű cím + magyarázat + vissza-CTA a /dashboard-ra); nem 404, nem üres oldal, és consent-gomb nem jelenik meg.",
    automated: "partial",
    coveredBy: "tests/unit/results/compare-invite.test.ts",
    priority: "P2",
  },
  {
    id: "CMP-14",
    area: "Megosztás és összehasonlítás",
    name: "Lejárt meghívó (30 nap TTL) → érvénytelen állapot",
    persona: "self-user",
    emails: { fő: "AUTO", partner: "AUTO" },
    preconditions:
      "Dev/staging DB-hozzáférés: egy függő meghívó expiresAt mezője múltba állítva.",
    steps:
      "1. Állítsd a meghívó lejáratát a múltba (DB). 2. A partner-fiókkal nyisd meg a linket. 3. A meghívó fiókjában nézd meg a /interaction listát.",
    expected:
      "A partner az érvénytelen-link állapot-oldalt kapja (elfogadás nem lehetséges); a meghívó listájában a lejárt meghívó nem szerepel az aktívak között, és nem számít bele a 3-as limitbe.",
    automated: "partial",
    coveredBy: "tests/unit/results/compare-invite.test.ts",
    priority: "P3",
  },
  {
    id: "CMP-15",
    area: "Megosztás és összehasonlítás",
    name: "Már elfogadott meghívó: harmadik fél nem léphet be a párba",
    persona: "self-user",
    emails: { fő: "AUTO", partner: "AUTO", harmadik: "AUTO" },
    preconditions:
      "Elfogadott pár (CMP-09); egy HARMADIK, eredménnyel bíró fiók is elérhető.",
    steps:
      "1. A harmadik fiókkal nyisd meg ugyanazt a meghívó-linket. 2. A partner-fiókkal is nyisd meg újra ugyanazt a linket.",
    expected:
      "A harmadik fél az érvénytelen-link állapot-oldalt kapja (a pár zárt, nem veheti át). A már elfogadó partner ugyanazon a linken viszont közvetlenül a páros nézetre kerül (idempotens újra-nyitás).",
    automated: "none",
    coveredBy: "",
    priority: "P3",
  },
  {
    id: "CMP-16",
    area: "Megosztás és összehasonlítás",
    name: "Páros nézet tartalma: szimuláció igen, partner-pontszámok nem",
    persona: "két self-user",
    emails: { fő: "AUTO", partner: "AUTO" },
    preconditions: "Elfogadott pár (CMP-09).",
    steps:
      "1. Nyisd meg a páros nézetet (/interaction?pair=<id>) a meghívó fiókjával. 2. Nézd végig a fejlécet és a szöveg-blokkokat. 3. Keresd meg, szerepel-e bárhol a partner számszerű dimenzió-pontszáma.",
    expected:
      "A fejléc mindkét felet mutatja: karakter-ábra + típuscímke + név mindkét oldalon. A dinamika-szimuláció szöveges blokkokat ad (erősségek/súrlódás/beszéljétek meg). A partner NUMERIKUS pontszámai sehol nem jelennek meg — csak a szimuláció szövege és az ábra.",
    automated: "partial",
    coveredBy:
      "tests/unit/results/pair-simulation.test.ts; tests/unit/results/interaction-language.test.ts",
    priority: "P1",
  },
  {
    id: "CMP-17",
    area: "Megosztás és összehasonlítás",
    name: "Elfogadott pár visszavonása bármelyik fél által → mindkét oldalon megszűnik",
    persona: "két self-user",
    emails: { fő: "AUTO", partner: "AUTO" },
    preconditions: "Elfogadott pár; a páros nézet URL-je feljegyezve.",
    steps:
      "1. A PARTNER fiókjával a /interaction listában kattints a pár melletti visszavonásra. 2. Frissítsd a meghívó fiókjában a /interaction oldalt. 3. Mindkét fiókkal próbáld megnyitni a feljegyzett /interaction?pair=<id> URL-t.",
    expected:
      "A pár mindkét fél listájából eltűnik (a visszavonás nem csak a meghívó joga). A pair-URL egyik oldalon sem mutat páros nézetet többé — az alap szimulátor-nézet jön, a partner adataihoz nincs további hozzáférés.",
    automated: "none",
    coveredBy: "",
    priority: "P2",
  },
];

# 2026-08-23 — Az audit javító köre

A teljes projekt-audit (`docs/audits/teljes-audit-2026-08-23.md`) nyolc
indulási blokkolót és tizennyolc P1 tételt talált. Ez a kör azt javítja
belőlük, ami kódból elintézhető.

## Ami eltört volna élesítéskor

**Clerk dev-instance a prod fejlécben.** A `next.config.ts` minden válaszra
`preconnect`-et tett a `perfect-elf-67.clerk.accounts.dev` hostra, és a CSP is
csak ezt engedte. Éles Clerk instance mellett ez három sebből vérzett: rossz
hostra nyitott TLS-kapcsolatot minden oldalbetöltésnél (tehát lassított, nem
gyorsított), kiszórta a fejlesztői instance nevét minden látogatónak, és — a
legrosszabb — a CSP nem engedte volna az éles Clerk-szkriptet, tehát az
enforce-ra váltás a bejelentkezést törte volna el.

A host mostantól a **publishable key-ből oldódik fel** (`src/lib/clerk-host.ts`):
a kulcs base64-ben kódolva tartalmazza a Frontend API hostját. Ismeretlen kulcs
esetén a preconnect fejléc kimarad — egy rossz hostra nyitott kapcsolat
rosszabb a hiányzónál. Nyolc unit-teszt zárja a feloldást.

**A rate limit némán fail-open volt.** Upstash nélkül a `newsletter` tier
kivételével minden más átengedte a kérést. A gond nem a döntés volt, hanem hogy
NÉMA: a végpontokon ott a `checkRateLimit` hívás, tehát védettnek *látszottak*,
miközben Redis nélkül egyik sem korlátozott.

Mostantól a besorolás a valós kockázat mentén megy
(`FAIL_CLOSED_IN_PRODUCTION`): a belépés nélkül hívható és **levelet küldő**
tierek (`auth`, `public`, `contact`, `analytics`, `newsletter`) élesben fail-closed
503-at adnak; a belépéshez kötött `api`/`billing` marad fail-open, mert ott a
visszaélés felülete eleve korlátos, a leállás viszont az egész appot elvinné.
A hiányzó konfigurációt tierenként **egyszer** naplózzuk — enélkül egy
analitika-beacon minden kérése egy-egy sort írt volna, és pont a jelzést
fojtotta volna el. Döntés-zár teszttel.

## Amit eddig senki nem látott

**Nem volt hibariasztás.** A szerver-oldali seam megvolt
(`instrumentation.ts` → `onRequestError`), a kliens-oldali is (`ErrorScreen` →
client-logger), de mindkettő csak logot írt: a szerver a Vercel stdout-jára, a
kliens a látogató böngésző-konzoljára. Oda senki nem néz. A pilot-playbook
viszont „munkanapon 24 órán belüli reakciót" ígér a partnernek.

Új `src/lib/error-alert.ts`: fojtott (10 perces ablakban max. 10, ismétlés
ujjlenyomat alapján kiszűrve), fire-and-forget webhook-riasztás. Slack és
Discord közvetlenül működik. Felhasználói tartalmat nem visz — csak hibatípus,
útvonal, üzenet-fej. Nem Sentry, mert az függőség + fiók + DSN; ez ugyanazt a
szerepet tölti be egyetlen lecserélhető hívási ponttal.

A kliens-oldali hibahatár mostantól jelent is: `/api/client-error`
(zárt séma, csonkolt mezők, stacket nem fogad, válasz mindig 204).

**A CSP report-only volt, report-uri nélkül.** A fejléc-komment azt állította,
hogy a böngésző jelenti a sértéseket „console + report-to"-ra — a `report-to`
valójában nem volt beállítva. Így a sértések csak a látogató konzoljára
kerültek, és az „élesben figyeljük, aztán enforce-ra váltunk" terv nem volt
végrehajtható. Új `/api/csp-report` végpont: mindkét böngésző-formátumot
fogadja, és csak a sértés három azonosító mezőjét naplózza (a `script-sample`
felhasználói szöveget is tartalmazhat).

**És azonnal talált is valamit.** Az első e2e-futásra kiderült, hogy a saját
CSP-nk blokkolja a `https://va.vercel-scripts.com` hostot — vagyis a
**Vercel Analytics és a Speed Insights** mérő-szkriptjét, mindkettő élő
függőség. Enforce-ra váltáskor mindkettő némán elhalt volna élesben. A host
felvéve a `script-src`-be (a mért adat azonos originre megy, azt a
`connect-src 'self'` fedi). Pontosan ezért kellett a riport-cél: report-uri
nélkül ez a rés a látogatók konzoljában maradt volna.

## Ami a CI-ből hiányzott

A workflow futtatott unit, integration, client és e2e tesztet — de **nem
futtatott type-checket, lintet és buildet**. Egy nem forduló build először a
Vercel deploynál derült volna ki, éles ágon. Új `checks` job: `pnpm check` +
`pnpm build`, hermetikus teszt-env-ekkel. A push-trigger kiegészült az
ügynök-ágakkal (`claude/**`, `chore/**`, `fix/**`) — eddig azok CI nélkül
maradtak a PR megnyitásáig.

Egy piros kliens-teszt is állt a `main`-en: a `608a7d8` nyelvi átnézés átírta a
`results.pairDriverTitle` kulcsot, a tesztet nem. A javítás nem a szöveget
másolja vissza, hanem a **szótárból olvassa** — így a következő nyelvi kör nem
tudja újra elrontani.

Az ESLint mostantól kihagyja a futtatás-artifactokat. Egy `pnpm test:e2e` után
a Playwright report-bundle-je (minifikált JS) 3000+ hamis leletet adott a
következő `pnpm check`-re; a CI-ben ez azért nem látszott, mert ott külön
jobban fut a lint és az e2e — helyben viszont mindig eltalálta a fejlesztőt.

## Tömeges meghívás

A pilot kerete 15–20 csapat és 200–500 egyéni kitöltő. A meghívó űrlapok
viszont egyetlen címet fogadtak (`z.object({ email })`): ötszáz embert egyesével
felvinni a program legdrágább és teljesen automatizálható munkaóráját jelentette.

Az org- és a csapat-meghívó végpont mostantól kötegelt törzset is fogad
(`{ emails: [...] }`), és címenkénti kimenetet ad vissza. **Az egyelemű alak
válasz-szerződése bitre változatlan** — a régi hívók nem tudnak róla.

A kliens 25-ös kötegekre bontja a beillesztett listát: minden új címhez kimegy
egy levél, sorban, és egy 500-as köteg túllépné a szerver-nélküli
futásidő-korlátot — félúton elvágva pedig nem tudnánk, mi ment ki. Így a
haladás látszik, és egy megszakadt köteg után az addigi eredmény megmarad.

A listaelemző (`src/lib/bulk-invite.ts`) a valós beillesztési módokra készült:
sortörés, vessző, pontosvessző, tabulátor, és a levelezőből másolt
`Név <cím@pelda.hu>` alak. Kisbetűsít, duplikátumot szűr, az értelmezhetetlen
tokeneket pedig **külön visszaadja** — nem dobja el némán. Ugyanez a modul fut
a kliens előnézetén és a szerver validálása mellett.

Az összegzés megkülönbözteti a „meghívó létrejött, levél kiment" és a „meghívó
létrejött, de a levél NEM ment ki" esetet, és utóbbinál **névvel** kiírja a
címeket — azoknak kézzel kell linket küldeni, és összesítésből nem derülne ki, kinek.

## A pilot-lánc tesztelése

A playbook három rétegének (self → bizalmi háló → pulse) és a rá épülő
riport-lépéseknek a tiszta logikája jól fedett unit-szinten, de **sem
integrációs, sem e2e teszt nem érintette a valós adatbázis-műveleteket**. Az
üzleti értéket adó lánc a perzisztencia szintjén teszteletlen volt.

Új `tests/integration/team/scan-v1-lane.integration.test.ts` (11 teszt):

- a pulse-válasz valóban user-referencia nélkül kerül a táblába, és a
  mezőkészlete zárt — minden új mező azonosíthatóságot vihetne be;
- a beküldési dátum nap pontosságúra csonkolt (enélkül a válasz párosítható
  volna a résztvevő `completedAt` értékével);
- az anonimitás-padló a valódi lekérdezésen keresztül is áll — alatta null,
  a padlót elérve megjelenik;
- a kampány-hatókör vörösvonala: másik kör adata nem szivárog be (különben a
  visszamérés „előtte–utána" állítása hamis alapra épülne);
- a trust-kör egyediségi kulcsa felülírásként viselkedik, nem duplázásként;
- a `TRUST_360` lépés csak teljes csapat-lefedettségtől számít teljesítettnek;
- a résztvevő SELF → TRUST → PULSE sorrendben halad, és a sorrenden kívüli
  teljesítés nem lépteti;
- a publikált riport aggregátuma nem mozdul az utólagos adatváltozástól.

**A `pnpm test:pilot` kapu is átszabva.** Eddig három e2e-t futtatott, közülük
az observert — ami a playbook szerint *nem* része a Scan v1-nek —, a Scan v1
három rétege viszont egyáltalán nem szerepelt benne. A kapu tehát nem azt
védte, amit a pilot ténylegesen futtat. Mostantól előbb a mérési lánc fut
(integration), utána a böngésző-szintű kritikus utak.

### Az e2e flakiness gyökéroka

A suite `next dev` ellen fut, tehát **minden útvonal első betöltése
fordítással jár, és ez a fordítás a teszt saját idejébe számít**. Eddig a
`retries: 2` fedte el: az első futás bemelegítette a szervert, a második
átment. Ez működött, de a jelzést is elnyelte — egy valódi lassulás ugyanúgy
„flaky retry"-ként ment volna át.

Három rétegben javítva:

1. **`globalSetup`** (`tests/e2e/global-setup.ts`): a suite előtt lekér kilenc
   publikus útvonalat. Ez a közös réteget (middleware, gyökér-layout, Clerk
   provider, i18n, design-tokenek) lefordítja, mielőtt bármelyik teszt órája
   elindulna. ~11 s, egyszer.
2. **Teszt-timeout 30 s → 60 s**, plusz `test.slow()` a hét oldalletöltést
   végző IA-smoke teszten (az hideg szerverrel 43 s).
3. **`expect.timeout` 5 s → 15 s.** Ez volt a megfoghatatlan maradék: az
   `expect(...)` SAJÁT időkorláttal dolgozik, amit a teszt-timeout nem fed. Az
   alapértelmezett 5 s meleg alkalmazásra van szabva; ha egy állítás olyan
   képernyőt vár, amit a szerver épp fordít, „element not found"-ot jelent —
   ami valódi hibának *látszik*. A suite több tesztje eddig egyenként írt ki
   `{ timeout: 15_000 }`-et ugyanezért; most ez az alapérték.

Eredmény: **három egymást követő, TÖRÖLT `.next`-tel indított futás 39/39
zölden** — pontosan az a helyzet, amiben a CI is dolgozik (friss checkout).

## Kisebb tételek

- **i18n:** nyolc bedrótozott magyar szöveg a belépett fejléc
  felhasználó-menüjében („Profil beállítások", „Eredményeim", „Kijelentkezés",
  „Nyelv", „Fiók", „Új ügyfél-szervezet", „Bezárás"). A legláthatóbb felület
  volt, ahol az EN-re váltott felhasználó magyarul látott mindent.
- **`.env.example` bekerült a repóba.** A `CLAUDE.md` és a launch-checklist
  egyaránt „a teljes env-listaként" hivatkozott rá, de a `.gitignore` `.env*`
  mintája kizárta: az élesítéshez szükséges készlet egyetlen gépen és a Vercel
  felületén élt.
- **A hírlevél bekerült a blog parkolási kapuja alá.** Visszaparkoláskor a
  felület eltűnt volna (Footer/NavBar kapuzott), de a feliratkozó API nyitva
  maradt volna — parkolt felület nem tarthat fenn élő adatgyűjtő végpontot.
- **OpenAPI:** 82 leírt útvonal a kódbeli 121 mellett. Az egész hírlevél- és
  CRM-felület, az analitika, a peer-feedback és a pilot-kritikus
  riport-akció végpont hiányzott. Mostantól 121 = 121, plusz egy stale
  bejegyzés (`/api/org/{id}/remind`) törölve. Egy hiányos leíró rosszabb a
  hiányzónál: úgy néz ki, mintha teljes volna.
- **Doksi-szinkron:** a `CLAUDE.md` a hiringet aktívként, a `/pricing`-et élő
  oldalként, a `Purchase`/`BillingEventLog` modelleket meglévőként, az admint
  4 fülesként és a lintet „~60 örökölt hibásként" írta le — mind a öt eltért a
  kódtól. A `portfolio-parking-2026-08.md` a blogot parkoltként sorolta,
  miközben aktív.
- **Repo-higiénia:** a `README.md` a create-next-app boilerplate volt; a
  generált audit-kimenetek (`audit-reports/`, `artifacts/`) és egy 40 kB-os
  landing-mockup commitolva voltak. Az előbbiek mostantól git-ignoráltak — egy
  régi futás pillanatképe így nem néz ki jelenlegi állapotnak.

## Ami NEM ebben a körben dől el

- **Valós cégadatok** (`LEGAL_DOCS_ARE_DRAFT`) és **ÁSZF** — üzleti és jogi
  bemenet kell hozzá, nem kód.
- **A route-ok Clerk-alapú authorizációjának integrációs fedése.** Az
  integrációs réteg ma csak publikus/tokenes route-handlereket hív; a
  belépéshez kötöttekhez harness-döntés kell (Clerk-mock vagy `getServerAuth`
  seam), és a CI Node 20-on fut, ahol a `mock.module` még nem elérhető.
- **A `tritan-vs-mbti` blog-slugok.** A kivezetett brand publikus URL-ben van,
  de a csere 301-eket igényel, és a hírlevél idempotencia-kulcsa
  `(subscriberId, slug)` — egy admin „küldés most" a slug cseréje után
  újraküldené a cikket a teljes listának. Tulajdonosi döntés.
- **213 tipográfia-skála eltérés** ügyfél-felületen. Vizuális regressziós háló
  nélkül tömeges cseréje kockázatos.

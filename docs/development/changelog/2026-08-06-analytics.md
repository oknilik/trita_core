# 2026-08-06 — Saját, first-party esemény-követés (analitika)

Terv és alternatíva-összevetés: `docs/product/analytics-plan-2026-08.md`
Üzemeltetői kézikönyv: `docs/development/analytics.md`

## Meghozott döntések

A terv négy döntési pontjából három lezárult:

- **#1 Motor** → **saját rendszer**, külső analitikai szolgáltató nélkül.
  (A PostHog/GA4 nem került be; a `trackEvent` határfelület miatt később
  bármikor rákapcsolható, és a historikus adat visszamenőleg feltölthető.)
- **#2 Anonim azonosítás** → **(i) nincs tartós azonosító**: napi rotáló,
  szerver-oldalon számolt álnév, semmilyen eszköz-oldali tárolás nélkül.
  Következmény: **nincs süti-elfogadó sáv**, és **nincs több napon átívelő
  attribúció**.
- **#3 Terjedelem** → **(a) csak a saját felületeink**; az ügyfél-szervezeti
  felületek részletes mérése nem került bele.
- **#4 Google Ads** → továbbra is NYITOTT. Ha lesz, a GA4 külön,
  marketing-célú rétegként visszajöhet — de akkor a süti-sáv elkerülhetetlen.

## Mi épült

**Adatmodell.** Egyetlen `AnalyticsEvent` tábla (`prisma/schema.prisma`,
migráció: `20260806120000_add_analytics_event`). A `userProfileId`
SZÁNDÉKOSAN valódi id, nem hash — így az események JOIN-olhatók a
termék-adatokkal; profil-törléskor NULL-ra áll.

**Könyvtár** (`src/lib/analytics/`):

- `events.ts` — **zárt esemény-katalógus**: 19 esemény, mindegyik zod
  `.strict()` sémával, iránnyal (`client`/`server`/`both`), leírással és a
  mérési kérdés azonosítójával (P1-P7 / A1-A7). Ez a PII-védelem szerkezeti
  garanciája: ismeretlen kulcs = eldobás.
- `context.ts` — tiszta függvények: útvonal-normalizálás (token → sablon),
  napi rotáló látogató-azonosító, eszköz-osztály, bot-szűrés, UTM, referrer-host.
- `client.ts` — `track()`: sor + `sendBeacon`, GPC/DNT tisztelet, ~1 kB,
  nulla függőség, soha nem dob kivételt.
- `server.ts` — `trackServerEvent()`: fire-and-forget, hibát elnyel.
- `queries.ts` — az admin-fül aggregációi.
- `retention.ts` — a 12 hónapos megőrzés egyetlen forrása.

**Végpontok.** `POST /api/e` (nodejs runtime, `analytics` rate-limit tier,
mindig 204-et ad) és `GET /api/cron/analytics-retention` (heti, vasárnap
04:30 UTC — `vercel.json`).

**Admin.** Új **Analitika** fül (`/admin?tab=analytics`), a Vezérlő mellett
(nem a Működés alatt: ez terméki döntéstámogatás, nem üzemeltetés). Forgalom,
akvizíciós tölcsér, kitöltési lemorzsolódás-görbe, top útvonalak/források/UTM,
esemény-volumen, nyers esemény-lista és adatkezelési lábjegyzet. Az
`AdminRangeFilter` tab-paraméterezhető lett (a default `overview` maradt,
a régi hívások változatlanok).

**Beépített mérési pontok.**

| Hol | Esemény |
|---|---|
| marketing layout | `page.view` |
| `ModeSwitcher` | `landing.mode_switch` |
| `HeroSection`, `CtaSection` | `cta.click` |
| `PricingContent` GYIK | `faq.open` |
| `ContactForm` | `form.start`, `form.submit` |
| `AssessmentClient` | `assessment.start`, `assessment.question_view`, `assessment.abandon` |
| `/api/assessment/submit` | `assessment.complete` (szerver) |
| Clerk webhook | `auth.signup` (szerver) |
| `/api/contact` | `inquiry.submit` (szerver) |
| `/api/observer/invite`, `/api/observer/submit` | `observer.invite_created`, `observer.assessment_complete` (szerver) |
| kampány-aktiválás | `campaign.step_launch` (szerver) |
| `ProfileTabs`, `/team/[id]`, `OrgPageShell` | `surface.tab_view` (közös `TabViewTracker`) |
| PDF-letöltés, megosztó-link, megosztó-kép | `results.export` |
| `ReadingProgress` | `blog.read_progress` (25/50/75/100%) |
| `PatternExplorer` | `patterns.explore` |

**Adatvédelmi átvezetés** — a #14 (új, tipizált adatvédelmi dokumentum)
mergelése után a `src/lib/legal/privacy-policy.ts`-be, HU és EN egyaránt:
a `purposes` jogalap-táblába új sor a használat-mérésről (jogos érdek,
first-party, külső szolgáltató nélkül); a `retention` táblába az
esemény-megőrzés (12 hónap, profil-törléskor azonnali elvágás); a `cookies`
szakaszba bekezdés a napi rotáló álnévről, a GPC/DNT-tiszteletről és arról,
hogy esemény-tulajdonságban nincs PII. A tiltakozási jog (GDPR 21. cikk) az
új dokumentumban már szerepelt.

## Őrzés

Új `tests/unit/analytics/` réteg (27 teszt) + egy client-teszt:

- **katalógus-teszt** — minden séma zárt; nincs tiltott nevű tulajdonság
  (email, name, token, message, answer, score…); minden eseményhez tartozik
  mérési kérdés; `domain.action` névkonvenció; a szerver-only események
  kliensről elutasítva; az üzletileg kritikus események szerver-oldaliak.
- **kontextus-teszt** — a token-útvonalak sablonra cserélődnek; a query
  string sosem tárolódik; a látogató-azonosító naponta rotál és nem
  tartalmazza az IP-t; bot-szűrés; UTM; megőrzési határ.
- **lefedettség-teszt** — minden deklarált eseménynek van hívóhelye, nincs
  hívás nem létező névre, és a szerver/kliens irány betartva.

## Ugyanebben a körben: a maradék négy esemény bekötve

Az első vágásban négy esemény deklarálva volt, de hívóhely nélkül. Mind
bekerült:

- **`surface.tab_view`** — új, közös `TabViewTracker` komponens mind a
  három fülrendszerre (`results`, `team`, `org`). Prop-változásra tüzel, nem
  kattintásra: így a KEZDŐ fül is mérve van, és a szerver-oldalon feloldott
  `/team/[id]?tab=` is (ott nincs kliens-oldali váltás-kezelő). A manager
  cockpitnak nincs fülrendszere (a `page.view` fedi); az admin-felület
  szándékosan méretlen.
- **`results.export`** — PDF-letöltés, megosztó-link és megosztó-kép. A
  letöltés SZÁNDÉKÁT mérjük (kattintás), nem a fájl elkészültét.
- **`blog.read_progress`** — a meglévő `ReadingProgress` scroll-számításába
  kötve (nincs új listener), mérföldkövenként egyszer.
- **`patterns.explore`** — a felfedező által kidobott mintázat, mintánként
  egyszer (a csúszka-mozgatás nem szór eseményt).

**Új guardrail**: `instrumentation-coverage.test.ts` a forráskódot pásztázza,
és elbukik, ha egy deklarált eseménynek nincs hívóhelye, ha nem létező névre
hívnak, vagy ha szerver-only eseményt kliens-oldali `track()` küldene. Ez a
teszt pont ezt a rést fogta volna meg az első körben.

Új client-teszt: `tab-view-tracker.test.tsx` (kezdő fül mérve, azonos fül nem
duplikál, váltásra új esemény, nem renderel DOM-ot).

## Nyitott / következő kör

1. **`ANALYTICS_SALT` beállítása élesben** — enélkül a látogató-azonosító
   kitalálható egy ismert IP+UA párból. A kód figyelmeztet, ha hiányzik.
2. ~~Az adatvédelmi tájékoztató átvezetése az új dokumentumba~~ — **kész**
   (ld. fent). A `recipients` szakasz szándékosan ÉRINTETLEN: nincs új
   adatfeldolgozó, mert a mérés first-party.

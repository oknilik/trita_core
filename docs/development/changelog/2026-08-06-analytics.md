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

- `events.ts` — **zárt esemény-katalógus**: 17 esemény, mindegyik zod
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

**Adatvédelmi átvezetés** (`src/lib/i18n/auth.ts`, `privacy.*`): a technikai
adatkör bővült a használati eseményekkel; a süti-szakasz kimondja, hogy a
mérés sem tesz le semmit az eszközön; a látogatottság-szakasz leírja a saját
rendszert, a napi rotáló álnevet, a GPC/DNT-tiszteletet, a jogos érdek
jogalapot és a 12 hónapos megőrzést; a jogok közé bekerült a **tiltakozás**
(GDPR 21. cikk), ami eddig hiányzott.

## Őrzés

Új `tests/unit/analytics/` réteg (23 teszt):

- **katalógus-teszt** — minden séma zárt; nincs tiltott nevű tulajdonság
  (email, name, token, message, answer, score…); minden eseményhez tartozik
  mérési kérdés; `domain.action` névkonvenció; a szerver-only események
  kliensről elutasítva; az üzletileg kritikus események szerver-oldaliak.
- **kontextus-teszt** — a token-útvonalak sablonra cserélődnek; a query
  string sosem tárolódik; a látogató-azonosító naponta rotál és nem
  tartalmazza az IP-t; bot-szűrés; UTM; megőrzési határ.

Verifikáció: `pnpm check` 0 hiba · unit 528 · client 110 · dummy-env prod
build zöld, a `/` továbbra is statikusan prerenderelt (a mérés nem törte el
a marketing-fa statikus renderét).

## Nyitott / következő kör

1. **`ANALYTICS_SALT` beállítása élesben** — enélkül a látogató-azonosító
   kitalálható egy ismert IP+UA párból. A kód figyelmeztet, ha hiányzik.
2. Auth-mögötti fül-mérés (`surface.tab_view`) és export (`results.export`)
   a katalógusban DEKLARÁLVA van, de a hívások még nincsenek beépítve —
   ez a következő kör (a fülrendszerek külön-külön kezelik az aktív fület,
   nincs közös Tabs primitív).
3. Blog olvasási mélység (`blog.read_progress`) szintén deklarált, de a
   `ReadingProgress` komponensbe még nincs bekötve.
4. A `/patterns` `patterns.explore` eseménye deklarált, bekötetlen.
5. Az adatvédelmi tájékoztató a `claude/privacy-page-refresh` branchen
   újraírt (17 szakaszos) változatba is átvezetendő — ott a `purposes`
   táblába kell egy sor a használat-mérésről, és a `recipients` szakasz
   ÉRINTETLEN maradhat, mert nincs új adatfeldolgozó.

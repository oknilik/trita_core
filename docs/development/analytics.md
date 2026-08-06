# Analitika — saját, first-party esemény-követés

> Üzemeltetői és fejlesztői kézikönyv. A DÖNTÉSEK indoklása és az
> alternatívák összevetése: `docs/product/analytics-plan-2026-08.md`.
> Bevezetve: 2026-08-06.

---

## 1. Mit építettünk, és miért így

Saját eseményrendszer: az események a **mi** végpontunkra érkeznek és a **mi**
adatbázisunkban maradnak. Nincs mögötte külső analitikai szolgáltató.

```
  Böngésző                         Szerver-oldali kód
  (CTA, GYIK, űrlap,               (route handler sikerága:
   kérdés-index)                    kitöltés kész, meghívó, regisztráció)
      │                                       │
  track() ──► sor ──► sendBeacon         trackServerEvent()
      │                                       │
      └────────► POST /api/e ◄────────────────┘
                     │
              katalógus-validáció (zod, .strict)
                     │
              AnalyticsEvent tábla (Neon, EU)
                     │
              /admin?tab=analytics
```

**Négy tervezési döntés, amit érdemes ismerni:**

| Döntés | Miért |
|---|---|
| **Saját `/api/e` végpont, nem külső script** | A marketing-fa JS-fogyókúrája megmarad (0 extra vendor-bundle); az azonos eredetű kérést az ad-blockerek nem szűrik; a CSP szűk maradhat (`connect-src 'self'`); a látogató IP-je nem jut ki harmadik félhez, mert nincs harmadik fél. |
| **Zárt esemény-katalógus** | A tulajdonságok zárt (`.strict()`) zod-sémán mennek át — az ismeretlen kulcs eldobás. A PII-védelem így SZERKEZETI, nem fegyelmi kérdés. |
| **Az üzletileg fontos események szerver-oldaliak** | A „kitöltés kész", „regisztráció", „megkeresés" nem hamisítható és nem ad-blockolható. A kliens-oldali események csak MINTÁZATOT adnak, üzleti számot nem. |
| **Nincs semmilyen eszköz-oldali tárolás** | Se süti, se localStorage. A látogató-azonosító napi rotáló, szerver-oldalon számolt álnév → nem kell süti-elfogadó sáv, és a „nem rakunk le semmit" állítás igaz marad. |

---

## 2. Adatvédelmi garanciák (és ami őrzi őket)

| Garancia | Amit csinál | Amit őriz |
|---|---|---|
| Esemény-tulajdonságban nincs PII | Minden séma `.strict()`, csak deklarált skalár kulcsok | `tests/unit/analytics/event-catalog.test.ts` — tiltott prop-nevek, zártság, skalár-kényszer |
| Útvonalban nincs token | `normalizePath()` sablonra cseréli (`/observe/[token]`), a query stringet eldobja | `tests/unit/analytics/context.test.ts` |
| Nincs IP-tárolás | Az IP csak a napi hash bemenete, sehol nem íródik ki | `context.test.ts` — a ref nem tartalmazza az IP-t |
| Napi rotáció | `sha256(salt + UTC-nap + ip + ua)` | `context.test.ts` — más nap ≠ más ref |
| GPC / Do Not Track tisztelet | A kliens semmit nem küld, ha a böngésző tiltást jelez | `client.ts::isTrackingRefused` |
| Bot-forgalom kizárása | `isBotUserAgent()` a végponton és szerver-oldalon | `context.test.ts` |
| Megőrzés 12 hónap | Heti cron törli a régebbit | `retention.ts` + `/api/cron/analytics-retention` |
| Törlési jog | Profil-törléskor az események `userProfileId`-ja NULL-ra áll | `/api/profile/delete` tranzakciója |

**Az adatvédelmi tájékoztató érintett szakaszai**
(`src/lib/legal/privacy-policy.ts`, HU és EN egyaránt): a `purposes`
jogalap-táblában a használat-mérés sora, a `retention` táblában az
esemény-megőrzés, és a `cookies` szakasz bekezdése a napi rotáló álnévről,
a GPC/DNT-tiszteletről és arról, hogy nincs külső szolgáltató. A
tiltakozási jog a `rights` szakaszban már benne van. **Ha a megőrzési idő
vagy a jogalap változik, OTT IS át kell vezetni** — a szerkezeti egyezést
`tests/unit/legal/privacy-policy.test.ts` őrzi, a tartalmi frissességet
nem tudja őrizni semmi, csak a fegyelem.

---

## 3. Fájltérkép

| Fájl | Szerep |
|---|---|
| `src/lib/analytics/events.ts` | **Az esemény-katalógus.** Minden esemény neve, sémája, iránya (client/server) és a mérési kérdés, amire válaszol. |
| `src/lib/analytics/context.ts` | Tiszta segédfüggvények: útvonal-normalizálás, látogató-azonosító, eszköz-osztály, bot-szűrés, UTM. |
| `src/lib/analytics/client.ts` | `track()` — böngészőből, sorral + `sendBeacon`-nal. |
| `src/lib/analytics/server.ts` | `trackServerEvent()` — route handlerekből, fire-and-forget. |
| `src/lib/analytics/queries.ts` | Az admin-fül lekérdezései. |
| `src/lib/analytics/retention.ts` | A megőrzési idő egyetlen forrása. |
| `src/app/api/e/route.ts` | A beérkeztető végpont. |
| `src/app/api/cron/analytics-retention/route.ts` | Heti takarítás. |
| `src/app/(app)/admin/_tabs/AnalyticsTab.tsx` | Az admin „Analitika" fül. |
| `src/components/analytics/AnalyticsPageView.tsx` | Oldalletöltés-mérés — CSAK a marketing layoutban. A bejelentkezett fán szándékosan nincs: ott a `surface.tab_view` és a folyamat-események mondják meg, mit használnak; a nyers oldalletöltés-szám nem adna hozzá semmit. |
| `src/components/analytics/TabViewTracker.tsx` | Fül-megtekintés — EGY komponens mind a három fülrendszerhez. |

---

## 4. Hogyan veszel fel új eseményt

1. **Kérdezd meg: melyik mérési kérdésre válaszol?** Ha nincs válasz, ne
   vedd fel. (`docs/product/analytics-plan-2026-08.md`, II. fejezet: P1-P7,
   A1-A7.) A katalógus `question` mezője kötelező, teszt őrzi.
2. Vedd fel a katalógusba (`events.ts`):
   ```ts
   "team.report_publish": spec({
     schema: z.object({ member_count_bucket: tag(16) }).strict(),
     origin: "server",
     description: "Csapatriport publikálása.",
     question: "A7",
   }),
   ```
3. Hívd meg:
   - böngészőből: `track("team.report_publish", { member_count_bucket: "6-10" })`
   - szerverről: `trackServerEvent("team.report_publish", { … }, { userProfileId })`
4. `pnpm test:unit` — a katalógus-teszt azonnal szól, ha tiltott
   tulajdonság-nevet vagy nyitott sémát írtál.

**Szabályok, amiket a teszt kikényszerít:**
- a séma `.strict()`, és csak skalár mezőket deklarál,
- a tulajdonság-név nem lehet a `FORBIDDEN_PROP_NAMES` listán (email, name,
  token, message, answer, score, …),
- az esemény-név `domain.action` alakú,
- üzletileg kritikus esemény csak `origin: "server"` lehet.

**Amit soha ne tegyél eseménybe:** e-mail, név, szabad szöveg, kérdőív-válasz,
dimenzió-pontszám, meghívó-token, szervezet- vagy csapatnév. Ha egy szám
érdekel (pl. csapatméret), tedd SÁVBA (`"6-10"`), ne pontos értékbe.

### Fül-mérés: miért komponens, és nem a váltás-kezelő

A `TabViewTracker` prop-változásra tüzel, nem kattintásra. Három ok:

1. **A kezdő fül is fül-megtekintés.** A váltás-kezelő csak a kattintást
   látná; a „melyik fülre érkezik, és ott meg is áll" — a használat-kérdés
   érdemi fele — kimaradna.
2. **A négy fülrendszer másképp működik.** A `/team/[id]` SZERVER-oldalon
   oldja fel a `?tab=`-ot (nincs kliens-oldali kezelő, amibe be lehetne
   kötni); a `ProfileTabs` és az `OrgPageShell` kliens-állapotban tartja; a
   mélylinkelt `?tab=` pedig mindkettőnél kezelő nélkül vált.
3. Egy helyen dől el, mi számít duplikátumnak (ugyanaz a felület+fül pár egy
   szerelés alatt egyszer megy ki).

Bekötve: `results` (ProfileTabs), `team` (`/team/[id]`), `org`
(OrgPageShell). A **manager cockpitnak nincs fülrendszere** — ott a
`page.view` fedi le a használatot. Az **admin-felület szándékosan
méretlen**: a saját belső használatunk zaj a termék-kérdésekhez.

### Lefedettség-őrzés

`tests/unit/analytics/instrumentation-coverage.test.ts` a FORRÁSKÓDOT
pásztázza, és elbukik, ha:

- egy katalógusban deklarált eseménynek nincs hívóhelye („deklarált, de
  sosem érkezik" — rosszabb, mintha nem is lenne: az admin-felületen üres
  sorként ül, és senki nem tudja, hiba-e vagy tényleg nem történt meg),
- valaki nem létező esemény-névre hív,
- szerver-only eseményt kliens-oldali `track()` küld (vagy fordítva).

---

## 5. Környezeti változók

| Változó | Kötelező? | Mit csinál |
|---|---|---|
| `ANALYTICS_SALT` | **Élesben igen** | A napi rotáló látogató-azonosító sója. Enélkül a hash kitalálható egy ismert IP+UA párból, és a pszeudonimitás ígérete nem tartható. A rendszer só nélkül is MŰKÖDIK (a mérés soha nem áll az üzemeltetés útjába), de figyelmeztet: egyszeri `analytics.salt_missing` warn a logban, és **állandó, látható sáv az `/admin?tab=analytics` fül tetején**. Generálás: `openssl rand -hex 32`. |
| `ANALYTICS_ENABLED` | nem | `0` esetén a teljes mérés némán kikapcsol (a `/api/e` 204-et ad, a szerver-oldali hívások no-opok). Vészkapcsoló. |
| `CRON_SECRET` | élesben igen | A megőrzési cron `Bearer` tokenje (a `release-steps` cronnal közös). |

A `ANALYTICS_SALT` **rotálása**: bármikor cserélhető. A csere napján a
látogató-azonosítók megváltoznak, tehát az aznapi „egyedi látogató" szám
felfelé torzul. Ezért hónap eleji cserét javaslunk, ha egyáltalán kell.

---

## 6. Admin-felület

`/admin?tab=analytics` (ADMIN_EMAILS-guard, HU-only, mint a többi fül).

Amit mutat:
- **Forgalom**: napi egyedi látogató + oldalletöltés idősor.
- **Akvizíciós tölcsér**: minden lépésnél KÉT szám — eseményből számolt
  (lossy) és DB-ből számolt (pontos). Szándékosan nincs összegyúrva: az
  eltérés maga is információ (mennyit visz el az ad-blocker és a
  nyomkövetés-tiltás).
- **Kitöltési lemorzsolódás**: hány külön látogató látta az N. kérdést.
- **Top útvonalak / hivatkozók / UTM-kampányok.**
- **Esemény-volumen** és **legutóbbi események** (hibakereséshez).
- **Adatkezelési lábjegyzet**: mit mérünk, mit nem, meddig őrizzük.

### Miért két szám mindenhol

A DB-szám (pl. `AssessmentResult` darabszám) PONTOS. Az eseményszám
ALULMÉR — ad-blocker, GPC/DNT, bot-szűrés és a `sendBeacon` kézbesítési
bizonytalansága miatt. **Ha a kettő eltér, a DB nyer.** Üzleti riportba
soha ne az eseményszám kerüljön.

---

## 7. Hibakeresés

**„Nem látok adatot az admin-fülön."**
1. Nézd meg a *Legutóbbi események* táblát — ha ott sincs semmi, egyetlen
   esemény sem érkezett.
2. A **saját böngésződ** GPC/DNT-jelzése elnyeli a saját látogatásaidat. Ez
   szándékos. Teszteléshez használj olyan böngészőt, ahol nincs bekapcsolva.
3. `ANALYTICS_ENABLED=0` van beállítva?
4. A dev-szerver logjában keresd az `analytics.*` eseményeket:
   `analytics.unknown_event`, `analytics.props_invalid`,
   `analytics.origin_rejected`, `analytics.write_failed`.

**„Az esemény eltűnik, de hibát sem látok."**
A `/api/e` MINDIG 204-et ad — hibás bemenetre is, szándékosan (a végpont nem
térképezhető ki kívülről). A valódi ok a szerver-logban van, `warn` szinten.

**„A tölcsér első lépése kisebb, mint a második."**
Normális lehet: a `page.view` a landingre szűrve csak azokat számolja, akik a
főoldalon jártak; aki közvetlenül a `/try`-ra érkezett (pl. blogból), nem
jelenik meg az első lépésben.

---

## 8. Tudatos korlátok (v1)

- **Nincs több napon átívelő attribúció.** A látogató-azonosító naponta
  rotál, ezért a „márciusi blogcikkből lett júniusi ügyfél" kérdés nem
  mérhető. Ez az ára annak, hogy nincs süti-sáv. (Ha ez később kell:
  `analytics-plan-2026-08.md` IV.2, (ii) vagy (iii) opció.)
- **Nincs session replay, hőtérkép, egérmozgás** — és nem is lesz, amíg
  bejelentkezett felületen személyiség-eredmény látszik.
- **Nincs egyéni felhasználó-szintű viselkedés-nézet** a felületen. Az
  elemzés aggregált; az adat JOIN-olható, de nem építünk „ki mit csinált"
  képernyőt.
- **Nincs A/B keretrendszer.** A fake door (`FakeDoorView`) továbbra is a
  maga kézi variáns-sorsolásával megy.
- **Az UTM csak arra az oldalletöltésre kerül rá**, ahol az URL-ben még ott
  volt (nincs hol tárolni). A látogató további eseményeihez elemzés-időben,
  a `visitorRef`-en át köthető — napon belül.

---

## 9. Ha később mégis kell külső eszköz

A `trackEvent` határfelület miatt ez nem újratervezés: az `/api/e`
végpontban a `prisma.analyticsEvent.createMany` helyére (vagy MELLÉ) kerül
egy adapter, ami a választott szolgáltatóhoz továbbít. Mivel az események a
saját adatbázisunkban vannak, a **historikus adat visszamenőleg feltölthető**
— a várakozással nem veszítünk adatot.

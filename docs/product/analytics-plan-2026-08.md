# Felhasználói interakció-követés (analitika) — terv

> Státusz: **DÖNTÉSRE VÁRÓ TERV**. Kód még nem készült. A III. fejezet végén
> négy döntési pont van — azok nélkül nem érdemes implementálni, mert
> mindegyik más architektúrát eredményez.
> Készült: 2026-08-06 · Branch: `claude/analytics-plan`

---

## 0. Összefoglaló egy bekezdésben

Az eszközválasztás a KISEBBIK kérdés. A nagyobbik az, hogy (a) melyik
kérdésekre akarunk választ, (b) kell-e süti-elfogadó sáv — mert ma nincs, és a
frissen írt adatvédelmi tájékoztató kifejezetten azt állítja, hogy „nem
használunk marketing- vagy nyomkövető sütiket", (c) mit szabad kiengedni egy
külső szolgáltatóhoz egy olyan termékből, amely munkavállalók
személyiség-eredményeit kezeli. A javaslatom: **saját, first-party
esemény-végponton keresztül gyűjtött, süti nélküli mérés, EU-ban tárolt
elemző motorral (PostHog EU Cloud), a kritikus üzleti KPI-kre pedig
DB-ből számolt, pontos riport** — a Google Analytics nem a legjobb választás
ehhez a termékhez, és az indoklás nem ideológiai, hanem gyakorlati (lásd
III.4).

---

## I. Mit tudunk MA (repo-ellenőrzéssel)

| Ami már megvan | Hol | Mit ad |
|---|---|---|
| Vercel Analytics + Speed Insights | `src/app/layout.tsx:88-89` | Süti nélküli oldalletöltés-szám, forrás (referrer), Core Web Vitals. Nincs funnel, nincs esemény-tulajdonság. |
| Strukturált logger `event` konvencióval | `src/lib/logger.ts` | `domain.action[_result]` esemény-nevek, entitás-mezők, redaction. **Kész vokabulárium** — az analitika ugyanezt a névteret örökölheti. |
| Fake door mérés (nézet + válasz) | `FakeDoorView`, `FakeDoorResponse` (`prisma/schema.prisma:925-967`), `src/lib/fakedoor/` | Precedens: DB-be írt, munkamenetre kulcsolt esemény + admin-kiértékelés + CSV-export. |
| First-party munkamenet-süti | `src/lib/fakedoor/session.ts` | httpOnly, 1 éves, szerver-oldalon írt UUID. Precedens az azonosításra — és egyben nyitott jogi kérdés (lásd IV.2). |
| Rate limit infra | `src/lib/rate-limit.ts` (Upstash) | Egy esemény-végpont visszaélés-védelme kész mintából jön. |
| Admin-felület fülekkel, DB-aggregátumokkal | `src/app/(app)/admin/_tabs/OverviewTab.tsx` | Már ma számol regisztráció-, kitöltés-, observer- és feedback-metrikákat. |
| Kérés-korreláció | `src/proxy.ts` (`x-request-id`, `x-pathname`) | Szerver-oldali eseményhez ingyen jár a kontextus. |

**Ebből két következtetés adódik, és mindkettő formálja a tervet:**

1. **A funnel jelentős része MA IS kiszámolható a DB-ből** — pontosan, nem
   becsléssel. `AssessmentDraft` (hol hagyta abba), `AssessmentResult`,
   `ObserverInvitation.status`, `CampaignParticipant`, `Inquiry`,
   `CandidateInvite`. Aki eseményrendszert épít ezek MELLÉ, az duplikálja az
   igazságot. A helyes vágás: **DB = üzleti KPI (pontos), esemény = viselkedés
   (mintázat)**.
2. **A hiányzó rész a publikus oldal**: honnan jön a látogató, mit csinál a
   landingen, hol pattan le a `/try`-on, melyik blogcikk hoz megkeresést. Erre
   ma egyetlen adatunk sincs a nyers oldalletöltés-számon túl.

---

## II. Mérési terv (ez az igazi munka — az eszköz utána jön)

Nem eseményeket kell gyűjteni, hanem kérdésekre válaszolni. Az alábbi lista a
javaslatom; a döntésnél ezt érdemes húzni-vágni, mert minden sor tartozik
valakihez, aki cselekedni fog belőle.

### II.1 Publikus (auth nélküli) — az akvizíciós lánc

| # | Kérdés | Kinek | Miből |
|---|---|---|---|
| P1 | Melyik csatorna/kampány/blogcikk hoz olyan látogatót, akiből megkeresés lesz? | tanácsadó (sales) | UTM + referrer → `Inquiry` / regisztráció |
| P2 | A landing két módja (egyéni / csapat) közül melyik konvertál? Váltanak-e? | termék | `mode` váltás esemény + CTA-kattintás |
| P3 | Hol esik ki a látogató a `/try` folyamatban — a start előtt, kérdés közben, az eredmény előtti regisztrációnál? | termék | kérdés-index események + `AssessmentDraft` |
| P4 | A `/pricing` GYIK-ből melyik kérdésre kattintanak? (= mi a valódi vásárlói kétely) | sales + copy | `details` nyitás esemény |
| P5 | A kapcsolati űrlapot hányan kezdik el és hagyják ott? | sales | form_start / form_submit |
| P6 | A `/patterns` és `/holland-kod` behozza-e a látogatót a termékbe? | tartalom | belső link-kattintás → `/try` |
| P7 | Mobil vs. desktop viselkedés-különbség a fentiekben | termék | eszköz-dimenzió minden eseményen |

### II.2 Bejelentkezés mögötti — az aktivációs és használati lánc

| # | Kérdés | Kinek | Miből |
|---|---|---|---|
| A1 | A regisztrációtól az első értelmezett eredményig mennyi idő telik, és hol akad el? | termék | journey stage-váltás események + DB |
| A2 | A 60 kérdéses kitöltés mely kérdésénél a legnagyobb a lemorzsolódás? | termék + módszertan | kérdés-index esemény (DB-draft finomítása) |
| A3 | Az observer-meghívó lánc hol szakad: kiküldés → megnyitás → kitöltés? | termék | `ObserverInvitation` (DB) + megnyitás-esemény |
| A4 | A vezetői/szervezeti cockpit mely fülét használják valójában? Mi az, amit senki? | roadmap | fül-váltás esemény |
| A5 | A tanácsadó mit néz meg egy ügyfél-workshop előtt? | belső folyamat | felület-megnyitás események |
| A6 | Melyik riport-elemet exportálják/osztják meg? | termék | export/share esemény |
| A7 | Kampány-lépések: hol áll meg egy 360°-os kör? | ügyfélsiker | `CampaignParticipant` (DB) |

### II.3 Amit SZÁNDÉKOSAN nem mérünk (v1 nem-célok)

- **Session replay / képernyőfelvétel** — sem publikusan, sem auth mögött.
  Egy replay a bejelentkezett felületen munkavállalók személyiség-eredményét
  rögzítené videóként egy külső szolgáltatónál. A kockázat/haszon arány
  rossz, és az első ügyfél-audit kérdése lenne.
- **Egyéni felhasználó-szintű „ki mit csinált" nézet** a felületen. Az elemzés
  aggregált; a személyre bontott viselkedés-napló egy HR-termékben veszélyes
  precedens (és a saját anonimitási ígéretünkkel feszül).
- **Hőtérkép / egérmozgás.**
- **Hirdetési remarketing-pixel** (Meta, LinkedIn, Google Ads). Ez az, ami
  miatt süti-sáv KELLENE — és ma nincs értékesítési csatorna, ami indokolná.
- **A/B tesztelés** — v1-ben nem; a választott eszköz viszont ne zárja ki
  (lásd III.3, feature flag).

---

## III. Alternatívák

### III.1 Az öt reális irány

**(A) Google Analytics 4 (+ Google Tag Manager)**
A „default" választás. Ingyenes, mindenki ismeri, a Search Console-lal
összeköthető (van is `docs/development/search-console-setup.md`).

**(B) Süti nélküli, EU-s web-analitika** — Plausible / Umami / Matomo
Egyszerű forgalom + esemény, süti és eszközön tárolt azonosító nélkül,
elfogadó sáv nélkül. Umami self-hostolható (MIT), Plausible EU-s SaaS,
Matomo EU-s SaaS vagy saját szerver.

**(C) Termék-analitika** — PostHog (EU Cloud) / Mixpanel / Amplitude
Funnel, retention, kohorsz, feature flag, esemény-tulajdonságok. PostHog EU
Cloud (Frankfurt) EU-ban tárol, van szerver-oldali SDK-ja és bőkezű ingyenes
sávja; a Mixpanel/Amplitude US-központú és fizetős sávban komolyabb.

**(D) A meglévő Vercel Web Analytics kiterjesztése egyedi eseményekkel**
Nincs új szolgáltató, nincs új süti, már benne van az adatvédelmi
tájékoztatóban. Egyedi események csomagfüggők (fizetős sávtól) — a döntés
előtt ellenőrizendő.

**(E) Saját, first-party esemény-pipeline** — Prisma-tábla + `/api/…` végpont
+ admin-fül, a `FakeDoorView` mintájára. Teljes kontroll, az adat ugyanabban a
DB-ben van, mint a felhasználók → **JOIN-olható** (ez az egyetlen megoldás,
ami a „melyik viselkedés vezet befejezett kitöltéshez" kérdést pontosan
megválaszolja).

### III.2 Összevetés

| Szempont | (A) GA4+GTM | (B) Plausible/Umami | (C) PostHog EU | (D) Vercel | (E) Saját |
|---|---|---|---|---|---|
| Publikus forgalom, forrás/attribúció | ★★★ | ★★★ | ★★★ | ★★ | ★ (építeni kell) |
| Funnel / lemorzsolódás elemzés | ★★ (nehézkes) | ★ | ★★★ | ✗ | ★★ (amit megírunk) |
| Auth mögötti termék-analitika | ★ | ✗ | ★★★ | ✗ | ★★★ |
| DB-adattal JOIN-olható | ✗ | ✗ | ✗ (export-tal nehézkes) | ✗ | ★★★ |
| **Kell süti-elfogadó sáv?** | **IGEN** | nem | nem (süti nélküli módban) | nem | nem |
| Adat helye | US (DPF) | EU | EU (Frankfurt) | EU/US | saját DB (EU, Neon) |
| Ad-blocker által blokkolva | 30-50% | ~10-20% | ~10-20% (first-party proxyval ~0) | alacsony | ~0 |
| Kliens-bundle terhelés | ~50-100 kB (+GTM) | ~1-2 kB | ~30-50 kB (vagy 0, ha szerver-oldali) | már bent van | ~0,5 kB |
| CSP-hatás | rossz (GTM = tetszőleges script) | kicsi | kicsi | nincs | nincs |
| Belépési költség (fejlesztés) | 0,5-1 nap + sáv (2 nap) | 0,5 nap | 1-2 nap | 0,5 nap | 4-6 nap |
| Üzemeltetési teher | alacsony | alacsony (SaaS) / közepes (self-host) | alacsony | nincs | **magas** (mi tartjuk karban) |
| Ad-hoc kérdés megválaszolása („miért esett a konverzió?") | ★★ | ★ | ★★★ | ✗ | ✗ (amit nem írtunk meg, nincs) |
| Havi költség (nagyságrend, ellenőrizendő) | 0 | 0 (self-host) – ~€9-19 | 0 (1M esemény/hó ingyenes sáv) | csomagfüggő | ~0 (meglévő DB) |

### III.3 Miért nem a GA4 ehhez a termékhez

Nem elvi kifogás — négy konkrét ok:

1. **Süti-elfogadó sáv kellene.** A GA4 eszközön tárolt azonosítót használ →
   ePrivacy szerint hozzájárulás-köteles. Ez (a) új felület, (b) a frissen
   írt adatvédelmi tájékoztató két állítását megbuktatja („nem használunk
   nyomkövető sütiket", „ezért nem is jelenítünk meg süti-elfogadó felugrót"),
   (c) az EU-s elutasítási arány mellett a mért adat 30-60%-a eleve elveszik —
   vagyis pont a hitelesség-költség után kapunk hiányos adatot.
2. **A termék pozicionálásával feszül.** Munkavállalói személyiségadatot
   kezelő platformot adunk el magyar cégeknek; az adatvédelmi kérdőívüket
   nekünk kell kitölteni. A „minden látogatói adat megy a Google-hez" sor ott
   magyarázkodás. (A 2022-es osztrák/francia/olasz GA-határozatokat a 2023-as
   DPF-megfelelőség orvosolta — de a *kérdést* nem szünteti meg egy
   beszállítói auditban.)
3. **GTM-et nem szabad betenni.** A CSP ma report-only, és a terv az élesítés
   (`next.config.ts`); a GTM örökre `unsafe-inline`-t és tetszőleges,
   kódfelülvizsgálat nélkül injektált scriptet jelent egy olyan felületen,
   ahol bejelentkezett HR-adat van.
4. **A GA4 a mi kérdéseinkre gyengén válaszol.** A GA4 marketing-attribúcióban
   erős; a „a 37. kérdésnél morzsolódnak le" és „melyik org-fület nem használja
   senki" típusú kérdés a GA4-ben kínszenvedés, a (C)/(E) irányban pedig
   natív.

**Ahol viszont a GA4 valóban jobb:** ha lesz Google Ads kampány, a
konverzió-import és a Search Console-integráció miatt gyakorlatilag
megkerülhetetlen. Ez a nyitott kérdés → Döntés #4.

### III.4 Javaslat: kétrétegű, first-party architektúra

Nem egy eszköz, hanem egy **határfelület** + mögötte cserélhető motor.

```
   Publikus lap (marketing)          Auth-mögötti felület          Szerver-oldali
   CTA, mód-váltás, GYIK,            fül-váltás, export,           események
   űrlap-kezdés, scroll              kérdés-index                  (a valódi történés)
        │                                  │                              │
        └──────────► trackEvent() ◄────────┘                              │
                     (src/lib/analytics)                                  │
                          │                                               │
                    POST /api/e   ◄── first-party, same-origin ───────────┘
                          │
              ┌───────────┴───────────┐
              ▼                       ▼
      esemény-sink (adapter)    (opcionális) events tábla
      → PostHog EU (v1)          → DB-JOIN-os elemzéshez
      → Umami / saját (csere
        egy fájl átírásával)
```

**Miért ez a forma:**

- **`trackEvent()` egyetlen határfelület.** A hívási helyek nem tudják, mi van
  mögötte. Eszközváltás = egy adapter-fájl. Ez a legfontosabb architekturális
  döntés, és FÜGGETLEN attól, melyik szolgáltatót választjuk — ha a Google
  mellett döntesz, akkor is így kell megépíteni.
- **Saját `/api/e` végpont, nem külső script.** (a) A marketing-fa
  JS-fogyókúrája megmarad (a `next.config.ts` kommentárjai alapján ez komoly
  befektetés volt — egy 50-100 kB-os analitika-script visszacsinálná).
  (b) Az ad-blockerek a same-origin végpontot nem szűrik. (c) A CSP szűk
  maradhat (`connect-src 'self'`). (d) A szolgáltató felé a mi szerverünk
  beszél, tehát a látogató IP-je nem is jut ki hozzá.
- **Szerver-oldali események ott, ahol a valódi történés van.** A „kitöltés
  befejezve", „meghívó kiküldve", „kampány indítva" események már ma is
  megtörténnek szerver-oldali route handlerekben — ott kell rögzíteni, nem
  kliens-oldali kattintásból. Pontosabb, nem blokkolható, és nem igényel
  eszközön tárolt azonosítót.
- **A DB marad az üzleti igazság.** Az admin „Analitika" fül a Prismából
  számol (pontos szám); az esemény-stream a *mintázatot* magyarázza. Ha a
  kettő eltér, a DB nyer.

**Konkrét v1 összeállítás (a javaslatom):**

| Réteg | Eszköz | Miért |
|---|---|---|
| Oldalletöltés, Core Web Vitals | marad Vercel Analytics | benne van, süti nélküli, már a tájékoztatóban is |
| Esemény-motor (funnel, kohorsz) | **PostHog EU Cloud**, szerver-oldali SDK-val | EU-tárolás, DPA, ingyenes sáv bőven elég, funnel/retention natív; kliens-bundle 0, mert a `/api/e` mögül szerverről küldünk |
| Üzleti KPI | **saját, DB-ből számolt admin-fül** | pontos, JOIN-olható, nálunk marad |
| A/B és feature flag | később, PostHog-ban (v1-ben ki) | a fake door precedense mutatja, hogy lesz rá igény |

**Ha a PostHog kiesik** (pl. „semmilyen külső szolgáltató"): ugyanez az
architektúra `events` Prisma-táblával és admin-fül-lekérdezésekkel működik —
a `trackEvent()` határfelület miatt ez nem újratervezés, hanem egy adapter.
Ára: nincs ad-hoc elemzés, minden kérdéshez kódot írunk (+4-6 nap, és utána
folyamatos teher).

---

## IV. Adatvédelmi következmények (ezt a részt nem lehet átugrani)

### IV.1 Mi változik az adatvédelmi tájékoztatóban

A `claude/privacy-page-refresh` branchen most készült tájékoztató érintett
szakaszai (`src/lib/legal/privacy-policy.ts`):

- `purposes` — új sor a jogalap-táblába: *„Termékhasználat elemzése,
  hibakeresés, fejlesztési döntések — technikai és használati adatok —
  jogos érdek, 6. cikk (1) f)"*. Auth mögött ez a helyes jogalap, MERT nincs
  eszközön tárolt azonosító (server-side), és aggregáltan használjuk.
- `recipients` — a választott szolgáltató felvétele adatfeldolgozóként (PostHog
  esetén: PostHog, EU/Frankfurt, DPA).
- `retention` — az esemény-adat megőrzési ideje (javaslat: **12 hónap**, utána
  csak aggregátum).
- `cookies` — CSAK akkor változik, ha süti/eszköz-tárolás mellett döntünk.
- `data` — „technikai adatok" bővítése az esemény-adatokkal.

### IV.2 A kellemetlen kérdés: mi az anonim látogató azonosítója?

Ez a terv EGYETLEN valódi kompromisszuma, ezért külön döntés (Döntés #2).

| Opció | Mit tud | Mit nem | Kell hozzájárulás? |
|---|---|---|---|
| **(i) Nincs tartós azonosító** — napi rotáló, sózott hash (IP+UA), ahogy a Plausible csinálja | Napi egyedi látogató, azonos napon belüli funnel | Több napon átívelő attribúció („a márciusi blogcikkből lett júniusi ügyfél") | **Nem** (nincs eszköz-tárolás) |
| **(ii) First-party httpOnly süti** (a `fakedoor/session.ts` mintája) | Teljes attribúció, visszatérő látogató | — | **Igen** (analitikai célra ez nem „feltétlenül szükséges" süti) |
| **(iii) Vegyes**: alap = (i); a süti CSAK akkor íródik, ha a látogató elfogadja | Mindkettő, önkéntes alapon | Az elfogadók arányában részleges | Igen, de nem blokkoló sávval |

Megjegyzés a tisztesség kedvéért: a mai `trita_fakedoor_session` süti már ma
is mérési célt szolgál, miközben a tájékoztató „kizárólag technikailag
szükséges" sütiket állít. Ez a feszültség a döntéstől függetlenül rendezendő
(vagy a süti kerül a „szükséges" indoklás alá dokumentáltan, vagy a
tájékoztató szövege pontosodik).

### IV.3 Kemény szabályok az esemény-tartalomra (v1-től, teszttel őrizve)

1. **Tilos** esemény-tulajdonságban: e-mail, név, szabad szöveg, kérdőív-válasz,
   dimenzió-pontszám, csapat- vagy szervezetnév, meghívó-token.
2. Azonosító csak **pszeudonim** (`userId` hash vagy belső id), és csak az
   auth-mögötti eseményeken.
3. Az esemény-tulajdonságok **allowlistán** mennek át — ami nincs a listán,
   az nem megy ki. Ezt unit-teszt őrzi (a `check-colors` / `no-PII` mintára).
4. Az `/observe/[token]` és `/share/[token]` felületeken az útvonal-paraméter
   soha nem kerül eseménybe (a token maga személyes adatot nyit).
5. Nincs cross-site pixel, nincs adattovábbítás hirdetési célra.

---

## V. Esemény-taxonómia (javaslat)

A `logger.ts` konvencióját örökli: `domain.action[_result]`, snake_case
tulajdonságok. Az esemény-nevek TELJES készlete egy modulban él
(`src/lib/analytics/events.ts`), típusos payloaddal — kézzel írt string
sehol.

```
publikus:
  page.view                      { path, locale, referrer_host, utm_* }
  landing.mode_switch            { from, to }
  cta.click                      { cta_id, surface, position }
  faq.open                       { faq_id, surface }
  form.start                     { form_id }
  form.submit                    { form_id, outcome }
  blog.read_progress             { slug, milestone: 25|50|75|100 }
  try.start                      { entry_surface }
  try.question_view              { index }            ← lemorzsolódás-görbe
  try.abandon                    { last_index }
  try.complete                   { duration_s }

auth mögött:
  auth.signup_complete           { method }
  journey.stage_enter            { stage }
  assessment.resume              { last_index }
  observer.invite_created        { channel }
  observer.invite_opened         { }                  ← token NÉLKÜL
  observer.assessment_complete   { }
  results.tab_view               { tab }
  results.export                 { format }
  team.tab_view                  { tab }
  org.tab_view                   { tab }
  campaign.step_launch           { step_type }
  consultant.report_open         { }
```

Minden eseményen automatikusan (a szerver tölti ki, nem a hívó):
`ts`, `session_ref`, `is_authenticated`, `role_class` (member/manager/admin/
consultant/anon), `device_class`, `locale`, `app_version`.

**Fegyelmi szabály:** új esemény csak akkor kerül be, ha a II. fejezet
valamelyik kérdéséhez tartozik. Az „inkább gyűjtsünk mindent, majd jó lesz"
két hónap alatt zajjá válik, és GDPR-oldalról indokolhatatlan.

---

## VI. Ütemezés (a döntés után)

| Fázis | Tartalom | Becslés |
|---|---|---|
| **F0** | Mérési terv véglegesítése (II. fejezet húzása), esemény-lista lezárása | 0,5 nap (közös) |
| **F1** | `src/lib/analytics/` — `trackEvent()`, típusos esemény-katalógus, allowlist-szűrő, sink-adapter; `/api/e` végpont rate limittel; no-PII unit-teszt | 1,5 nap |
| **F2** | Szerver-oldali események bekötése a MEGLÉVŐ route handlerekbe (kitöltés kész, meghívó, kampány, inquiry) | 1 nap |
| **F3** | Publikus kliens-események + UTM-elkapás + attribúció a regisztrációig | 1 nap |
| **F4** | Auth-mögötti események (fül-váltás, export, kérdés-index) | 1 nap |
| **F5** | Admin „Analitika" fül: DB-ből számolt pontos KPI-k (funnel-számok, lemorzsolódás-görbe) | 1,5 nap |
| **F6** | Adatvédelmi tájékoztató átvezetése + `docs/` dokumentáció + megőrzési takarító job | 0,5 nap |
| | **Összesen** | **~7 nap** (süti-sáv nélkül) |
| F7 (csak ha kell) | Süti-elfogadó sáv, Consent Mode, preferencia-tárolás, tájékoztató-átírás | +2 nap |

Az F1-F2 önmagában is szállítható és már értéket ad (a szerver-oldali
események a legpontosabbak).

---

## VII. Kockázatok

| Kockázat | Kezelés |
|---|---|
| Az esemény-adat és a DB eltér, és senki nem tudja, melyik igaz | Kimondott hierarchia: DB = KPI, esemény = mintázat. Az admin-fülön a KPI-k DB-ből jönnek. |
| Az esemény-katalógus elburjánzik | Zárt, típusos katalógus + a „melyik kérdéshez tartozik" szabály; a katalógus fájl fejlécében a II. fejezet kérdés-azonosítói. |
| Külső szolgáltató kiesik / árat emel | `trackEvent()` adapter — csere egy fájl. |
| Véletlenül PII kerül eseménybe | Allowlist + unit-teszt; a szabály a kódban, nem a fejekben. |
| A mérés lassítja az oldalt | Kliens-oldalon `sendBeacon`, nincs blokkoló script; szerver-oldalon tűz-és-felejtsd, hiba esetén némán elnyelve (a mérés SOHA ne törjön el felhasználói folyamatot). |
| Ügyfél-audit rákérdez | EU-tárolás + adatfeldolgozói szerződés + a tájékoztatóban nevesítve + nincs replay/pixel. |

---

## VIII. Döntési pontok

**Döntés #1 — Esemény-motor.**
(a) PostHog EU Cloud *(javaslatom)* · (b) süti nélküli web-analitika
(Plausible/Umami) és nincs termék-analitika · (c) saját DB-tábla, külső
szolgáltató nélkül (+4-6 nap, nincs ad-hoc elemzés) · (d) GA4.

**Döntés #2 — Anonim azonosítás** (IV.2 táblázat):
(i) nincs tartós azonosító, nincs sáv *(javaslatom)* · (ii) first-party süti +
süti-sáv · (iii) vegyes.

**Döntés #3 — Az auth-mögötti mérés terjedelme.**
(a) csak a saját felületeink használata *(javaslatom)* · (b) plusz a
tanácsadói/ügyfél-szervezeti felületek részletes mérése is — ez utóbbinál az
ügyfél-szervezettel kötött szerződés is érintett lehet.

**Döntés #4 — Lesz-e Google Ads / Search Console-konverzió a következő
12 hónapban?** Ha igen, a GA4 külön, marketing-célú rétegként visszajöhet a
képbe (a fenti architektúra mellett is), és akkor a süti-sáv előbb-utóbb
elkerülhetetlen — érdemes ezt előre tudni, mert a IV.1 szerinti
tájékoztató-szöveget máshogy írjuk meg.

---

## IX. Amit a terv NEM tartalmaz

Session replay · hőtérkép · egyéni felhasználó-szintű viselkedés-nézet a
felületen · hirdetési pixel · A/B keretrendszer (v1) · külső adattárház
(BigQuery/Snowflake) · marketing automatizáció / e-mail-nyomkövetés.

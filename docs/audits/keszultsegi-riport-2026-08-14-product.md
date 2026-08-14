# Készültségi riport — PRODUCT LEAD szemmel

> Alap: `main` @ `63da5ae` (2026-08-12). Vizsgálat dátuma: 2026-08-14.
> Referencia-horizont: `docs/product/pre-pilot-plan-2026-09.md` — **pilot-indulás
> 2026-09-08**, azaz innen **~3,5 hét**.

## 0. Egymondatos ítélet

**A termék tartalmilag kész — a baj a szélein van: a legfontosabb konverziós út
a legkevésbé megépített, a tanácsadói munkafolyamat végén nincs átadható
termék, és egy gomb hazudik.** A maradék munka nem feature-építés, hanem
a tölcsér és a szállítás lezárása.

---

## 1. Hol tart a termék

Az elmúlt hetek (changelog 2026-08-04 … 08-11) **kilenc motor-audit kört**
zártak le, a `motor-known-residuals.md` konvergencia-szabálya teljesült, és a
tulajdonosi döntés a kód-körök leállítása volt. Ez helyes döntés: ami maradt,
azt pilot-adat oldja fel.

Ami ma **működik és kész**:

- Teljes self-út: onboarding → TSFI-S (60 item, ~9 perc) → eredmények → PDF.
- Observer 360 (publikus token, 30 nap, anonimitás-padló 3 értékelő).
- Csapatszerep-kérdőív (self + peer), bizalmi kör, pszichológiai biztonság pulse.
- Kampány-gépezet (DRAFT→ACTIVE→CLOSED), többlépéses, újrafuttatási körökkel.
- Org/csapat cockpitok, tag-dossié, jelölt-flow (2026-07-23 óta újra aktív).
- Journey engine mint egyetlen belépési elosztó — ez a rendszer legjobb része.
- First-party analitika zárt esemény-katalógussal, süti nélkül.

Ez **sok**. A kockázat nem az, hogy kevés van, hanem hogy a meglévő nem ér el a
felhasználóig.

---

## 2. P0 — a pilot előtt

### A1. „{count} személynek küldtünk emlékeztetőt" — pedig nem küldtünk

`src/app/api/org/[id]/campaigns/[campaignId]/remind/route.ts:92`:
`// In a real implementation, you would send reminder emails here.`
A felület viszont ezt írja ki (`src/lib/i18n/org.ts:626`):

> „{count} személynek küldtünk emlékeztetőt"

**Termék-szempontból ez a legdrágább hiba a rendszerben**, és nem a hiányzó
funkció miatt. Egy consulting-led pilot kritikus mutatója a **kitöltési arány**.
A tanácsadó megnyomja a gombot, sikert lát, és **nem küld kézzel emlékeztetőt** —
a kampány pedig félig kitöltve marad. Utána nem a gombra fog gyanakodni, hanem
a termékre („nem reagálnak rá az emberek").

Ráadásul ez pont az az elv, amit a termék magáról állít: **forrás- és
evidencia-őszinteség minden kimeneten**. Ha az „elküldtük" nem igaz, semmilyen
confidence-badge nem hitelesíthető.

Döntés kell: kiküldés (a `notifications/` orchestrator és az observer-reminder
sweep mintája adott), vagy a gomb szövegének azonnali igazítása („{count} tag
nem kezdte el") + a küldés levétele a felületről.

### A2. A fő lead-út a legkevésbé megépített

A landing hero CTA-ja a `/pilot`-ra megy
(`src/components/landing/HeroSection.tsx`), a `/pricing` is oda és a
`/contact`-ra, a `/patterns` a `/pilot`-ra és az `/advisory`-ra, az `/advisory`
és minden belső upgrade-CTA a `/contact`-ra. **Négy lead-út, három különböző
backenddel:**

| Út | Perzisztál? | Analitika? | Validáció | i18n |
|---|---|---|---|---|
| `/contact` → `/api/contact` | **igen** (`inquiries.ts`) | **igen** (`inquiry.submit`) | Zod | igen |
| `/pilot` → `/api/pilot-apply` | **nem** (csak e-mail) | **nem** | nincs | **nem** |
| `/advisory` → `/api/advisory/request` | **nem** (csak e-mail) | **nem** | — | — |

Vagyis: a **legjobban megépített út a `/contact`**, ami a másodlagos CTA,
a **hero CTA pedig mérhetetlen és nyom nélküli**. Konkrétan:

- **Nincs egyetlen analitikai esemény sem** a `/pilot` oldalon — sem
  `form.start`, sem `form.submit`, sem `cta.click` (a `PilotContent.tsx`-ben
  nincs `track` hívás). A pilot legfontosabb tölcsérét **nem fogjuk tudni
  megmérni**, miközben a `docs/product/analytics-plan-2026-08.md` pont erre
  készült.
- **A jelentkezés sehol nem tárolódik.** Ha a Resend-küldés elhal (a domain-
  verifikáció a `send.trita.io`-n él, a route viszont `hello@trita.io`-ról küld),
  a lead **nyomtalanul elveszik** — nincs se DB-sor, se admin-értesítő.
- **Az EN látogató magyar e-mailt kap.** A `/pilot` oldal szépen i18n-elt
  (64 `t()` hívás), az API viszont bedrótozott magyar szövegeket ad:
  „Hiányzó kötelező mezők.", „Szerverhiba. Próbáld újra.", és a visszaigazoló
  levél is végig magyar, „Leinad · Trita" aláírással.

Ez egy nap munka, és a pilot mérhetőségének **előfeltétele**.

### A3. Jogi tervezet-állapot — ügyfélszerződést blokkol

`src/lib/legal/company.ts:23` `LEGAL_DOCS_ARE_DRAFT = true`, a cégadatok
helykitöltők (`taxNumber: "99999999-2-42"`). Következmény: az adatvédelmi
tájékoztató „Tervezet" jelöléssel és `noindex`-szel él, a sitemapből kimarad.

Egy consulting-led pilotban az ügyfél **szervezet**, nem magánszemély —
a HR/jogi átvilágítás első kérdése az adatkezelői adat és a DPA lesz. A kód
oldaláról ez **egy sor** (`LEGAL_DOCS_ARE_DRAFT = false`), de hat üzleti adat
és egy DPA-sablon kell hozzá. Ez a `launch-checklist.md` 5. pontja, és ma is
nyitott — **ez a leghosszabb átfutású tétel**, ezért ezzel kellene kezdeni,
nem befejezni.

---

## 3. P1 — a pilot első két hetéhez

### B1. Nincs csapat- vagy szervezeti riport-export

Ez a legnagyobb **terméki** hiány a consulting-led modellben.

A PDF-motor (`src/components/pdf/`) 8 oldalt tud — Cover, Start, Summary,
Collab, Career, PlusWorkStyle, PlusFacets, Reflect —, és **kizárólag az egyéni
profilhoz** van bekötve (`src/components/profile/ProfileTabs.tsx`). A
`src/components/team/`, `org/`, `manager/` alatt **egyetlen PDF- vagy
export-hivatkozás sincs**; CSV-export egyedül az admin fake-door karrier-
riportban van.

Vagyis: a tanácsadó lefuttat egy hatlépéses kampányt, megnézi a
team-intelligence nézetet a képernyőn — és **nincs mit letennie az ügyfél
asztalára**. A workshop utáni leave-behind, a vezetőnek küldött összefoglaló,
a szerződéses „riport" nincs meg. A `docs/pilot/riport-ertelmezesi-sablonok.md`
létezik, de az **kézi** munkát ír le.

Legkisebb életképes megoldás: a meglévő PDF-primitívekből (`PdfDimStrip`,
`PdfCard`, `PdfInsightPair`, `PdfTeamRoles` — utóbbi **már megvan**) egy 4–6
oldalas csapat-riport. A tartalom kész, csak nincs kivezetve.

### B2. Az IA szétesőben — négy publikus oldal ugyanarra a kérdésre

Ma él: `/` (landing), `/pricing`, `/about` („Mi az a Trita?"), `/rolunk`
(„a műhely"), `/pilot`, `/advisory`, `/patterns`, `/contact`, `/blog`, `/try`,
plusz a `/founding`, ami 307-tel a `/pilot`-ra megy.

Két konkrét baj:
- **`/about` és `/rolunk` egy nyelvi felületen kétnyelvű slug.** Kétnyelvű
  oldalon az egyik URL angol, a másik magyar — és a kettő egymásra hivatkozik
  (`AboutContent.tsx` → `/rolunk`, `RolunkContent.tsx` → `/about`). A látogató
  szempontjából ez két „rólunk" oldal.
- **A `CLAUDE.md` route-térképe elavult**: nem szerepel benne az `/about`,
  a `/rolunk`, a `/pilot` és a `/tasks`. Új fejlesztő (vagy ügynök) rossz
  térképpel indul.

Nem sürgős, de a pilot alatt jönnek az első valódi látogatók — érdemes
eldönteni, melyik a kanonikus „rólunk", és a másikat 301-gyel ráirányítani.

### B3. E2E-fedettség vs. a tanácsadói munkafolyamat

63 oldalra és 110 API route-ra **6 e2e spec** jut. Ami **le van fedve**:
assessment-flow, journey-entrypoints, critical-IA smoke, observer-flow,
team-intelligence vizuál, téma-galéria.

Ami **nincs**: a teljes tanácsadói kör — org létrehozás → tagok meghívása →
csapatba sorolás → kampány indítása → lépések nyitása → riport megnyitása.
Ez pont az az út, amit a pilot alatt **élő ügyfél előtt** fogsz kattintani.
Egy darab „happy path" e2e erre többet ér, mint húsz újabb unit-teszt.

---

## 4. Amit a pilot előtt NEM kell megcsinálni

A `pre-pilot-plan-2026-09.md` 3. szakasza már jól kijelölte a halasztott
tételeket (A3 claim-út, B1 riport-IA, B11 archetípus-választó, B19 tab-gépezet,
BL-CONF confidence-egységesítés). **Ezekkel egyetértek, ne nyíljanak fel.**

Amit még hozzátennék a „ne most" listához:
- A `full` (100 itemes) forma élesítése — a `DEFAULT_ASSESSMENT_FORM = "short"`
  helyes pilot-döntés; a hosszabb forma kitöltési arányt rontana.
- Bármilyen új mérési réteg. Négy már van (self, observer, csapatszerep,
  trust/pulse) — a pilot azt fogja megmutatni, hogy ezekből melyiket használják
  egyáltalán.
- Billing. A consulting-led modell nem igényli, a `billing-v1-parked` tag áll.

---

## 5. Amit a pilotból meg akarunk tudni (és amihez ma nincs műszer)

Ha a pilot célja tanulás, előre el kell dönteni, mit mérünk. Az esemény-katalógus
(`src/lib/analytics/events.ts`) 20 eseményt ismer, és a self-út végig le van
fedve (`assessment.start` / `question_view` / `abandon` / `complete`). Hiányzik:

| Kérdés | Van rá esemény? |
|---|---|
| Hány pilot-jelentkezés jött, honnan? | **nincs** (A2) |
| Meghívott org-tagok közül hány töltötte ki? | részben (`campaign.step_launch` van, kitöltési arány DB-ből) |
| Melyik intelligence-fület nézik a vezetők? | **igen** (`surface.tab_view`) |
| Letöltik-e a PDF-et? | **igen** (`results.export`) |
| Az observer-kör tényleg elér 3 értékelőt? | **igen** (`observer.invite_created` + `assessment_complete`) |

Tehát egyetlen érdemi lyuk van, és az pont a tölcsér eleje (A2).

---

## 6. Sorrend, ahogy én csinálnám

**Most azonnal (átfutás miatt):**
1. A3 — cégadatok összeszedése + DPA-sablon jogi átnézésre. Ez nem kódmunka,
   és ez tart a legtovább.

**Ezen a héten (~2 nap fejlesztés):**
2. A1 — emlékeztető: küldjön vagy mondjon igazat.
3. A2 — `/pilot` út rendbetétele: perzisztálás + `form.submit` esemény +
   `EMAIL_FROM` + Zod + EN-visszaigazoló.

**Következő két hétben (~3-4 nap):**
4. B1 — csapat-riport PDF (4-6 oldal a meglévő primitívekből).
5. B3 — egy „tanácsadói happy path" e2e.

**Pilot után, adat alapján:**
6. B2 — IA-tisztítás, `/about` vs `/rolunk` döntés.

A pilot **nem csúszik** ettől: az 1-3 tétel a jelenlegi tempóval bőven belefér
a 3,5 hétbe, a 4-es pedig akár a pilot első hetében is landolhat — az első
csapat-riportra úgyis csak a kampány lezárása után lesz szükség.

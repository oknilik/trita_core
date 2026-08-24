# Élesítési checklist

> Azok a tételek, amiket **kódból nem lehet elintézni** — env-beállítás, DNS,
> külső fiók, üzleti adat. Ezek nélkül a kód működik, de valamit rosszul
> vagy hiányosan csinál, és erre semmilyen teszt nem fog figyelmeztetni.
>
> Utolsó frissítés: 2026-08-23 (teljes audit — `docs/audits/teljes-audit-2026-08-23.md`).
>
> A teljes, magyarázatos env-lista a repóban: **`.env.example`**.

---

## 0. Clerk — ÉLES instance kulcsa (ÚJ, 2026-08-23)

**Állapot: KÖTELEZŐ, ellenőrizendő.**

A `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` kódolva tartalmazza a Clerk Frontend API
hostját, és a CSP + a `preconnect` fejléc **ebből oldódik fel**
(`src/lib/clerk-host.ts`). Korábban a preconnect a fejlesztői instance hostját
(`perfect-elf-67.clerk.accounts.dev`) drótozta be minden válaszba; ez javítva,
de a helyes működés a helyes kulcson múlik.

- [ ] A Vercel **production** környezetében `pk_live_…` kulcs áll (nem `pk_test_`).
- [ ] Ellenőrzés élesítés után:
      `curl -sI https://trita.io | grep -i '^link:'` — az éles Clerk hostra
      mutasson, ne `*.clerk.accounts.dev`-re.
- [ ] A CSP `script-src`/`connect-src`/`frame-src` ugyanezt a hostot tartalmazza
      (a `Content-Security-Policy-Report-Only` fejlécből olvasható).

## 0/b. Hibariasztás — `ERROR_ALERT_WEBHOOK_URL` (ÚJ, 2026-08-23)

**Állapot: KÖTELEZŐ élesben.**

A kezeletlen szerver-hibák (`instrumentation.ts`) és a kliens-oldali
hibahatár-jelentések (`/api/client-error`) enélkül CSAK a Vercel stdout-jába
kerülnek. A pilot-playbook „munkanapon 24 órán belüli reakciót" ígér a
partnernek — ehhez tudni kell, hogy egyáltalán történt hiba.

- [ ] Slack (vagy Discord) incoming webhook létrehozva, az URL a Vercel
      env-jében `ERROR_ALERT_WEBHOOK_URL` néven.
- [ ] Füst-teszt: egy szándékos 500 után megérkezik-e a riasztás.
- [ ] A riasztás fojtott (10 perces ablakban max. 10, ismétlés kiszűrve) —
      ha zajos, a `src/lib/error-alert.ts` konstansai hangolhatók.

## 0/c. Rate limit — az Upstash a TELJES publikus felület előfeltétele

**Állapot: KÖTELEZŐ élesben.** *(2026-08-23: a korábbi „csak a hírlevélhez kell"
olvasat téves volt.)*

`UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` nélkül productionben a
belépés nélkül hívható és levelet küldő tierek (`public`, `contact`, `invite`,
`auth`, `analytics`, `newsletter`) **fail-closed 503-at** adnak, az
`api`/`billing` tier pedig
korlátozás nélkül fut. A tierenkénti döntés: `FAIL_CLOSED_IN_PRODUCTION`
(`src/lib/rate-limit.ts`), unit-teszt zárja.

A publikus capability-tokenes route-ok két keretet kapnak: magas, közös IP-
abúzus plafont (`public`) és külön, hash-elt tokenenkénti `api` keretet. Így a
közös irodai NAT nem fogja össze a pilot résztvevőit, a nyers token pedig nem
kerül az Upstashba.

A bulk meghívás saját `invite` tiert használ: 20 kérés / 5 perc × 25 címzett,
vagyis egy teljes 500 fős pilotlista végigküldhető anélkül, hogy a 3/perces
kapcsolatfelvételi keret a 4. kötegnél megszakítaná.

- [ ] Mindkét Upstash env beállítva.
- [ ] Az Upstash adatbázis EU-régióban fut; DPA és retention ellenőrizve.
- [ ] Ellenőrzés: a `/contact` űrlap beküldése működik (nem 503).
- [ ] Füst-teszt: a 4. azonos kulcsú contact-kérés 429-et ad, majd a reset
      után ismét átmegy (a sikeres build önmagában nem ellenőrzi a Redis-elérést).

---

## 1. Kanonikus domain — `NEXT_PUBLIC_APP_URL`

**Állapot: ellenőrizendő.**

Ebből képződik minden canonical, hreflang, OG-URL, sitemap-bejegyzés és a
JSON-LD összes `@id` horgonya. Ha rossz, a kereső a saját tartalmunkat egy
másik hostra attribuálja — ez rosszabb, mintha hiányozna.

- [ ] A Vercelen `NEXT_PUBLIC_APP_URL=https://trita.io` (záró perjel nélkül).
- [ ] Ellenőrzés élesítés után: `curl -s https://trita.io/robots.txt` — a
      `Host:` és a `Sitemap:` sor a `.io`-ra mutasson.
- [ ] `curl -s https://trita.io/sitemap.xml | head` — az URL-ek is.

Kódbeli fallback: `https://trita.io` (`src/lib/seo.ts`, unit-teszt őrzi).
A fallback csak háló — élesben az env dönt.

## 2. A `.hu` domain átirányítása

**Állapot: nyitott, ops-feladat.**

A `trita.hu` korábban a kanonikus domain volt (a kódbeli fallback is az volt
2026-08-06-ig). Ha a domain regisztrálva van és felel HTTP-re, két domain
szolgálná ki ugyanazt a tartalmat — a linkerő megoszlik, és a kereső
duplikátumot lát.

- [ ] **301** a `trita.hu` (és `www.trita.hu`) minden útvonaláról a `.io`
      megfelelőjére — nem csak a főoldalra, útvonal-megtartással.
- [ ] Ha a domain nem a miénk / nem felel: ezt a tételt zárd le, nincs teendő.

## 3. Google Search Console

**Állapot: nyitott.**

- [ ] A `https://trita.io` property bejelentése (domain-property, ha a DNS
      elérhető — az minden aldomaint fed).
- [ ] `https://trita.io/sitemap.xml` beküldése.
- [ ] Ha volt `.hu` property: a **címváltoztatás (Change of Address)**
      eszközzel jelezni az átköltözést — a 301 mellé ez gyorsítja az
      átindexelést.
- [ ] Beállítás után 1-2 héttel: lefedettségi jelentés átnézése (mi
      indexelődött, mi nem, és miért).

Meglévő doksi: `docs/development/search-console-setup.md`

## 4. Analitika só — `ANALYTICS_SALT`

**Állapot: KÖTELEZŐ a `claude/analytics-tracking` mergelése előtt.**

A napi rotáló látogató-álnév sója. Enélkül a látogató-azonosító kitalálható
egy ismert IP + böngésző párból — a pszeudonimitás ígérete (amit az
adatvédelmi tájékoztató is kimond) nem tartható.

- [ ] `openssl rand -hex 32` → Vercel env: `ANALYTICS_SALT`
- [ ] A kód figyelmeztet, ha élesben hiányzik (`analytics.salt_missing`
      warn a logban) — de nem áll le, tehát a hiány csendben megmarad.
- [ ] Ellenőrzés: `/admin?tab=analytics` → *Legutóbbi események* táblában
      érkezik-e adat. (A saját böngésződ GPC/DNT-jelzése elnyeli a saját
      látogatásaidat — ez szándékos.)

Doksi: `docs/development/analytics.md`, 5. fejezet.

## 5. Hírlevél-feladó elkülönítése

**Állapot: AJÁNLOTT a hírlevél élesítése előtt, KÖTELEZŐ a lista növekedésével.**

A blog-feliratkozás (2026-08-21) az első TÖMEGES levelünk. Ha ugyanarról a
feladó-aldomainről megy, mint a meghívók és a belépési kódok, egy
spam-panasz-hullám azok kézbesítését is rontja.

- [ ] Külön Resend-domain a hírlevélnek (`news.trita.io`), MX/SPF/DKIM
      rekordokkal.
- [ ] A `newsletter_*` sablonok feladója erre állítva.
- [ ] A `CRON_SECRET` be van állítva — enélkül a `/api/cron/blog-digest`
      és `/api/cron/newsletter-maintenance` élesben fail-closed (401).
- [ ] `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` beállítva —
      ld. a 0/c pontot: ez nem csak a feliratkozásra vonatkozik.
- [ ] `RESEND_WEBHOOK_SECRET` + a webhook felvéve a Resendben
      (`email.delivered`, `email.failed`, `email.suppressed`, `email.bounced`,
      `email.complained` → `/api/webhooks/resend`). E nélkül nincs valós
      kézbesítési státusz, és a visszapattant címek a listán maradnak.
- [ ] A napi maintenance cron futása ellenőrizve: outbox-retry, stale-claim
      recovery és a tájékoztató szerinti 12 hónapos törlés.

Doksi: `docs/development/resend-domain-ops.md`.

## 6. Valós cégadatok a jogi oldalakra

**Állapot: BLOKKOLT — üzleti adat kell hozzá.**

Az adatvédelmi tájékoztató tartalmilag kész, de az adatkezelő azonosító
adatai helykitöltők (`src/lib/legal/company.ts`). Emiatt a lap látható
„Tervezet" jelölést kap, **és `noindex`-et is** (a sitemapből is kimarad) —
egy indexelt jogi oldal kitalált cégjegyzékszámmal akkor is félrevezet, ha a
lap tetején ott a figyelmeztetés, mert a találati lista snippetjében az nem
látszik.

Ami kell:

- [ ] Teljes cégnév
- [ ] Székhely (pontos, ahogy a cégkivonatban áll)
- [ ] Cégjegyzékszám
- [ ] Adószám
- [ ] Képviselő neve és tisztsége
- [ ] Döntés: kell-e dedikált adatvédelmi postafiók? (jelenleg a
      `privacyEmail` a `hello@trita.io`-ra fut)

Élesítés ezután **egy lépés**: `LEGAL_DOCS_ARE_DRAFT = false`
(`src/lib/legal/company.ts`). Ettől egyszerre tűnik el a tervezet-jelölés,
kerül vissza a lap a sitemapbe, és szűnik meg a `noindex`.

Két további jogi tétel, ami nem kódfüggő:

- [ ] **Adatfeldolgozói szerződés (DPA)** a szervezeti ügyfelekkel — a
      tájékoztató hivatkozik rá („a megrendelő az adatkezelő, mi
      adatfeldolgozók vagyunk").
- [ ] **Jogi átnézés.** A dokumentum szakmailag felépített és a termék valós
      működését írja le, de nem ügyvédi munka.

---

## Ami kódból már meg van oldva (nem checklist-tétel)

- Kanonikus fallback, robots.txt AI-crawler szabályok, sitemap, strukturált
  adat, `/llms.txt` — `docs/development/changelog/2026-08-06.md`
- A bejelentkezés mögötti zóna meta-szintű `noindex`-e (a `/try` kivételével)
- A tervezet-állapotú `/privacy` `noindex` + sitemap-kihagyás
- Analitika megőrzési takarítás (heti cron), profil-törléskori anonimizálás

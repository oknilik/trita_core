# 2026-08-21 — Hírlevél és blog-feliratkozás

Eddig nem volt semmilyen feliratkozás: aki elolvasott egy cikket vagy kitöltötte
a vendég-tesztet, nyomtalanul elment. Ez a kör behozza a teljes láncot —
űrlap → double opt-in → napi kiküldés → leiratkozás → admin-rálátás.

## Hol jelenik meg

| Hely | Változat | `source` |
|---|---|---|
| `/blog` lista alja | `panel` | `blog_index` |
| `/blog/[slug]` cikk vége + oldalsáv | `panel` + `compact` | `blog_post` |
| Lábléc (minden publikus oldal) | `inline`, `onInverse` | `footer` |
| `/try/complete` (vendég-teszt záró) | `compact` | `try_complete` |
| `/email-preferences` (belépve) | kapcsoló | `account` |

Amit **nem** csinálunk: nincs modal, nincs exit-intent, és a `/contact`
űrlapba sem került rejtett pipa — a kapcsolatfelvételi célhoz kötött adatot
külön, önkéntes hozzájárulás nélkül nem használhatjuk marketingre.

## Double opt-in — miért kötelező

A cím beírása nem hozzájárulás: bárki beírhat egy idegen címet. A sor
`PENDING`-ként jön létre, és csak a levélben lévő token megnyitásával lesz
`ACTIVE`; küldeni kizárólag `ACTIVE` sorra szabad (`listSendableSubscribers` a
kapu). A `confirmedAt` innentől a hozzájárulás bizonyítéka.

**Egy dokumentált kivétel:** a belépett felhasználó `/email-preferences`
kapcsolója azonnal aktivál. Ott a címet a Clerk már verifikálta, a kapcsoló
átbillentése maga a kifejezett hozzájárulás — a megerősítő levél nem adna új
garanciát, cserébe a saját beállítás-oldalán küldene egy „erősítsd meg"
levelet, amit a felhasználó joggal érezne hibának.

## Kiküldés: cron, nem publikálás-gomb

A blog forrásigazsága a git, nincs „publikálva" DB-esemény. Az admin Blog fül
github módban **commitol**, amit a Vercel percekkel később élesít — a gombra
kötött azonnali küldés tehát olyan linket vinne ki, ami a kattintás
pillanatában még 404. A napi cron (`/api/cron/blog-digest`, 06:00 UTC) csak azt
látja, ami már deployolva van.

Két védelem a hibás küldés ellen:

- **`NewsletterDelivery` napló** `(subscriberId, slug)` unique-kal — kétszer
  futó cron, kézi „küldés most" és félbeszakadt futás után sem megy ki
  ugyanaz a cikk kétszer ugyanannak a címzettnek. A naplózás kötegenként
  történik, nem a futás végén.
- **14 napos visszatekintő ablak** — az induláskor meglévő ~10 cikkes archívum
  nem zúdul rá senkire, és egy hosszabb cron-kiesés után sem megy ki fél év
  termése egyetlen reggelen. Aki a cikk megjelenése UTÁN erősítette meg a
  feliratkozását, szintén nem kap visszamenőleges levelet.

## Leiratkozás

Token-alapú, **belépés nélküli**, egy kattintás. A levél `List-Unsubscribe` +
`List-Unsubscribe-Post` fejlécet visz (RFC 8058) — enélkül a Gmail/Yahoo
tömeges-küldő szabályai büntetik a levelet, akkor is, ha a tartalom rendben
van. A fejléc miatt a levelező előre és ismételten is POST-olhat a végpontra,
ezért mindkét ág idempotens.

## Adatvédelem

- Az `/api/newsletter/subscribe` **minden ágon ugyanazt a választ adja** —
  különben a végpont e-mail-cím-ellenőrzővé válna (bárki megtudhatná egy
  címről, hogy feliratkozott-e nálunk).
- Az adatvédelmi tájékoztató bővült (HU+EN, szerkezetileg szimmetrikusan):
  új adatkör (feliratkozási adatok), új cél-sor (hozzájárulás, 6. cikk (1) a),
  új megőrzési sor.
- Analitika: `newsletter.submit` / `.confirm` / `.unsubscribe` — mind
  szerver-oldali, `.strict()` sémával; e-mail szerkezetileg nem kerülhet bele.

## Admin

`/admin?tab=blog` tetején: feliratkozó-számok (DB-ből, nem eseményből),
utolsó kiküldés, cikk-választó **próbafutással** és „küldés most"-tal, CSV-export
az aktív feliratkozókról. A kézi küldés ugyanazt a motort és naplót használja,
mint a cron.

## Új felületek

- `POST /api/newsletter/subscribe` · `GET /api/newsletter/confirm` ·
  `GET|POST /api/newsletter/unsubscribe`
- `GET|POST /api/admin/newsletter` · `GET /api/cron/blog-digest`
- `/newsletter/confirmed` · `/newsletter/unsubscribed` (mindkettő `noindex`,
  robots-disallow)
- `src/lib/newsletter.ts` (állapotgép) · `src/lib/newsletter-digest.ts` (kiküldés)
- `NewsletterSubscriber` + `NewsletterDelivery` modell
  (migráció: `20260821120000_add_newsletter_subscription`)

## Nyitott teendő élesítéshez

A `RESEND_FROM_EMAIL` domainjének verifikáltnak kell lennie (ma is az), és a
tömeges küldés miatt érdemes a Resendben **külön feladó-domaint vagy
subdomaint** használni a hírlevélre, hogy egy esetleges spam-panasz ne rontsa
a tranzakcionális levelek (meghívó, belépési kód) kézbesíthetőségét. Ez
kódból nem intézhető — ld. `launch-checklist.md`.

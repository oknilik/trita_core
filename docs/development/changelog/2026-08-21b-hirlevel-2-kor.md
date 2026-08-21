# 2026-08-21 (2. kör) — Hírlevél: lead-összekötés, kattintás, bounce, szerkesztett szám

Az első kör (`2026-08-21-hirlevel-blog-feliratkozas.md`) működő feliratkozást
adott. Ez a kör azt teszi hozzá, amitől a lista **hasznos** lesz, nem csak
létezik.

## 1. Feliratkozó → lead (a legfontosabb)

A `NewsletterSubscriber` eddig zsákutca volt: gyűltek a címek, de az
értékesítési folyamat nem tudott róluk. Most az `Inquiry` email-alapú
auto-linkjének mintájára, ugyanazon a kulcson (normalizált cím) összeáll a
kettő — `src/lib/newsletter-engagement.ts`.

Hol látszik: **Beérkező** (CRM + admin Kérdések fül), **Ma**-nézet
deal-kártyái, és a **deal-részletező** fejléce. A badge azt mondja: mióta
feliratkozó, hány levelet vett át a szolgáltató, hány kézbesült, hány első
linkkérés érkezett, és mi volt a feliratkozás forrása (tooltip).

Miért számít: aki fél éve olvassa a blogot és 6 levélből 4-re kattintott, azzal
nem ugyanaz a hívás kezdődik, mint egy hideg érdeklődővel. A leiratkozott és a
kézbesíthetetlen állapotot is kiírjuk — az is információ, és megelőzi a kínos
„nem kaptad meg a hírlevelünket?" kérdést.

Egyetlen lekérdezés minden listanézetben (N+1 nélkül), és **kizárólag
admin-felületen** hívjuk: új adatot nem hoz létre, csak összeolvassa a meglévőt.

## 2. Kattintás-mérés

Eddig azt tudtuk, hányan iratkoztak fel. Azt nem, hogy elolvassa-e bárki.

**Nyitást szándékosan nem mérünk**: követő pixellel menne, ami süti-jellegű
nyomkövetés, ráadásul az Apple Mail Privacy Protection előre letölti a képeket
— a szám tehát egyszerre tolakodó és hamis. A már meglévő cikk-link kérését
rögzítjük, külön követő pixel nélkül.

A tárolt adatot ezért pontosan **első linkkérésnek** nevezzük, nem biztos
olvasásnak vagy kattintásnak: biztonsági linkscanner és továbbított levél is
kiválthatja. CRM-ben csak alacsony bizonyosságú kontextus.

A levélbeli cikk-linkek `/api/newsletter/click?d=<deliveryId>&to=<slug>`-on
mennek át. A `to` **slug, nem URL**, és csak publikált cikkre oldjuk fel — a
paraméter nem tud nyílt átirányítássá válni; ismeretlen slugnál a bloglistára
megyünk, tehát a kattintás akkor sem vész el. A mérés hibája sosem töri el az
átirányítást.

**Egy szerkezeti következmény:** a `NewsletterDelivery` sor mostantól a küldés
ELŐTT, egyetlen atomi `INSERT … ON CONFLICT … WHERE … RETURNING` művelettel
jön létre (`reserveDeliveries`), mert a levélbe kerülő link az id-jét hordozza.
A hibaág nem törli az auditnyomot: `FAILED` (biztos hiba) vagy `UNKNOWN`
(bizonytalan kimenet) állapotot ír. Csak a biztos hiba próbálható újra, legfeljebb
ötször; minden DB-attempt külön Resend-idempotenciakulcsot kap.

Az admin Blog fülön: kattintási arány összesen és küldésenként.

## 3. Resend bounce-webhook

`/api/webhooks/resend`, svix aláírás-ellenőrzéssel (a Clerk-webhook mintájára),
`RESEND_WEBHOOK_SECRET`-tel. A napló a szolgáltatói átvételt nem nevezi
kézbesítésnek; a tényleges állapotot webhook írja:

| esemény | állapot | miért |
|---|---|---|
| `email.delivered` | `DELIVERED` | a fogadó mail-szerver átvette |
| `email.failed` | `FAILED` | biztos hiba, újrapróbálható |
| `email.suppressed` | `SUPPRESSED` + cím kizárása | Resend-szuppresszió |
| `email.bounced` (Permanent) | `BOUNCED` | a cím nem létezik — technikai tény |
| `email.complained` | `UNSUBSCRIBED` | spamnek jelölte — ez SZÁNDÉK, a helyes válasz a leiratkoztatás |

A soft bounce (átmeneti) **nem** vezet kizáráshoz. A küldő kód továbbra sem
minősít címet kézbesíthetetlennek: ez a webhook dolga.

## 4. Szerkesztett hírlevél-szám

A cikk-értesítő gépi és cikkenkénti; havi 4-5 cikknél az havi 4-5 levél. Az
új `NewsletterIssue` a másik forma: a szerkesztő ír egy nyitó szöveget és
beválogat max. 6 cikket.

- Munkamenet: **mentés → valódi HTML-előnézet → végleges tárgy/nyelv/címzett
  ellenőrzés → küldés**. A küldés csak az előnézett tartalom SHA-256 hashével
  indulhat; bármilyen szerkesztés érvényteleníti az előnézetet.
- A `SENT` szám **nem szerkeszthető és nem törölhető**: a levél kiment, a
  szövegét utólag átírni azt jelentené, hogy a napló mást mond, mint amit a
  címzettek kaptak.
- A kiküldés ugyanazt a naplót használja, `issue:<id>` dedupe-kulccsal —
  ugyanaz az idempotencia-garancia védi, mint a digestet.
- Részleges hiba `PARTIAL`: a tartalom onnantól változtathatatlan, a folytatás
  kizárólag a biztosan kimaradt címzetteket próbálja újra.
- A bevezető **sima szöveg**: escape-eljük, és csak a bekezdés-tördelést
  értelmezzük. Ez az egyetlen sablonunk, amibe ember által írt szöveg kerül,
  ezért van rá külön teszt.

**Topic-váltás:** a `topics` alapértelmezése `["blog", "newsletter"]` lett, és
a migráció a meglévő sorokat is bővíti. Ez nem hozzájárulás-tágítás: a
megerősítő levél szövege eddig is mindkettőt ígérte („új blogbejegyzésnél és
időnként egy-egy gyakorlati összefoglalónál"), csak a default volt szűkebb —
azaz a szerkesztett szám sosem talált volna címzettet.

Fiókos felhasználónál a két téma külön kapcsoló; mindkettő kikapcsolása
leiratkozás. A publikus űrlap egyértelműen mindkét tartalomtípusra kér
hozzájárulást, és aktív címnél aláíratlan kérés nem írhat nyelvet vagy témát.

## 5. Képek és levélkliens-kompatibilitás

A cikk saját `/blog/<slug>/opengraph-image` képe bekerül a cikkértesítőbe és
a szerkesztett szám cikkkártyájának bal oldalára. Mobilon a kép a szöveg fölé
fordul. A kép azonos, nem címzettre szabott URL, van alt-szövege, és blokkolt
képnél a teljes cím/leírás/CTA használható marad. Minden más levél külső képe
továbbra is tesztben tiltott; a szójel és a formanyelvi jel inline CID.

## 6. Biztonság és megőrzés

- GET többé nem módosít feliratkozást: a confirm és a látható leiratkozás
  külön megerősítő oldal, a mutáció POST. Az RFC 8058 fejléc saját idempotens
  POST-végpontot kap.
- A double-opt-in levél DB-outboxból, limitált soron és retry-val megy.
- Productionben az Upstash nélküli publikus feliratkozás fail-closed; IP- és
  hash-elt e-mail-cooldown együtt véd.
- A maintenance cron helyreállítja a beragadt claimet, retry-zza az outboxot,
  törli a lejárt pending sort, illetve 12 hónap után az inaktív feliratkozó és
  személyhez kötött delivery/linkkérés adatát.
- A DB CHECK constrainttel is őrzi a locale/status/topic/source értékkészletet
  és a nemnegatív számlálókat.

## Élesítéshez

- [ ] `RESEND_WEBHOOK_SECRET` beállítása + a webhook felvétele a Resendben
      (`email.delivered`, `email.failed`, `email.suppressed`, `email.bounced`,
      `email.complained` → `/api/webhooks/resend`).
      E nélkül a végpont fail-closed (500), a lista-higiénia nem működik.
- [ ] `UPSTASH_REDIS_REST_URL` és `UPSTASH_REDIS_REST_TOKEN` productionben
      beállítva; nélkülük a feliratkozás szándékosan 503.
- [ ] A `20260821170000_newsletter_delivery_safety` migráció és a
      `/api/cron/newsletter-maintenance` napi futása ellenőrizve.

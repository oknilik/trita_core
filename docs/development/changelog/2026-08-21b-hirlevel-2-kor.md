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
olvasó, hány levelet kapott, hányra kattintott, és mi volt a feliratkozás
forrása (tooltip).

Miért számít: aki fél éve olvassa a blogot és 6 levélből 4-re kattintott, azzal
nem ugyanaz a hívás kezdődik, mint egy hideg érdeklődővel. A leiratkozott és a
kézbesíthetetlen állapotot is kiírjuk — az is információ, és megelőzi a kínos
„nem kaptad meg a hírlevelünket?" kérdést.

Egyetlen lekérdezés minden listanézetben (N+1 nélkül), és **kizárólag
admin-felületen** hívjuk: új adatot nem hoz létre, csak összeolvassa a meglévőt.

## 2. Kattintás-mérés

Eddig azt tudtuk, hányan iratkoztak fel. Azt nem, hogy elolvassa-e bárki.

**Nyitást szándékosan nem mérünk**: követő pixellel megy, ami süti-jellegű
nyomkövetés, ráadásul az Apple Mail Privacy Protection előre letölti a képeket
— a szám tehát egyszerre tolakodó és hamis. A kattintás önkéntes cselekvés, és
a levélben amúgy is van link.

A levélbeli cikk-linkek `/api/newsletter/click?d=<deliveryId>&to=<slug>`-on
mennek át. A `to` **slug, nem URL**, és csak publikált cikkre oldjuk fel — a
paraméter nem tud nyílt átirányítássá válni; ismeretlen slugnál a bloglistára
megyünk, tehát a kattintás akkor sem vész el. A mérés hibája sosem töri el az
átirányítást.

**Egy szerkezeti következmény:** a `NewsletterDelivery` sor mostantól a küldés
ELŐTT jön létre (`reserveDeliveries`), mert a levélbe kerülő link az id-jét
hordozza. A hibaág ezzel megfordul: sikertelen küldésnél a foglalást eldobjuk
(`releaseDelivery`), így a következő futás újrapróbálja.

Az admin Blog fülön: kattintási arány összesen és küldésenként.

## 3. Resend bounce-webhook

`/api/webhooks/resend`, svix aláírás-ellenőrzéssel (a Clerk-webhook mintájára),
`RESEND_WEBHOOK_SECRET`-tel. Két esemény, szándékosan **eltérő**
következménnyel:

| esemény | állapot | miért |
|---|---|---|
| `email.bounced` (Permanent) | `BOUNCED` | a cím nem létezik — technikai tény |
| `email.complained` | `UNSUBSCRIBED` | spamnek jelölte — ez SZÁNDÉK, a helyes válasz a leiratkoztatás |

A soft bounce (átmeneti) **nem** vezet kizáráshoz. A küldő kód továbbra sem
minősít címet kézbesíthetetlennek: ez a webhook dolga.

## 4. Szerkesztett hírlevél-szám

A cikk-értesítő gépi és cikkenkénti; havi 4-5 cikknél az havi 4-5 levél. Az
új `NewsletterIssue` a másik forma: a szerkesztő ír egy nyitó szöveget és
beválogat max. 6 cikket.

- Munkamenet: **mentés → előnézet → küldés**. Az előnézet mondja meg, hogy a
  beválogatott slugok tényleg publikált cikkek-e az adott nyelven, és hánynak
  menne ki.
- A `SENT` szám **nem szerkeszthető és nem törölhető**: a levél kiment, a
  szövegét utólag átírni azt jelentené, hogy a napló mást mond, mint amit a
  címzettek kaptak.
- A kiküldés ugyanazt a naplót használja, `issue:<id>` dedupe-kulccsal —
  ugyanaz az idempotencia-garancia védi, mint a digestet.
- A bevezető **sima szöveg**: escape-eljük, és csak a bekezdés-tördelést
  értelmezzük. Ez az egyetlen sablonunk, amibe ember által írt szöveg kerül,
  ezért van rá külön teszt.

**Topic-váltás:** a `topics` alapértelmezése `["blog", "newsletter"]` lett, és
a migráció a meglévő sorokat is bővíti. Ez nem hozzájárulás-tágítás: a
megerősítő levél szövege eddig is mindkettőt ígérte („új blogbejegyzésnél és
időnként egy-egy gyakorlati összefoglalónál"), csak a default volt szűkebb —
azaz a szerkesztett szám sosem talált volna címzettet.

Ha a szerkesztett formára állsz át, a cikkenkénti levél kikapcsolása annyi,
hogy a feliratkozóknál a `blog` topicot leveszed.

## Élesítéshez

- [ ] `RESEND_WEBHOOK_SECRET` beállítása + a webhook felvétele a Resendben
      (`email.bounced`, `email.complained` → `/api/webhooks/resend`).
      E nélkül a végpont fail-closed (500), a lista-higiénia nem működik.

# 2026-08-19 — A levél-réteg behozása az aktuális arculatra

A levél-keret 2026-07-23-án készült el, és utána **négy design-körön át
érintetlen maradt**: a jelentés-alapú szín-rendszer (08-05), a háromszintű
formanyelv (08-09), a lezárt tipográfiai skála és a webbel egységesített
PDF-riport (08-18) mind kikerülte. A 08-18-i tipográfiai changelog ki is
mondja: `src/lib/emails.ts` — „nem érintett, inline stílus, nem Tailwind".

Ez a kör a levelet ugyanoda hozza, ahol a web és a PDF már áll, és — mert a
kimaradás oka a hiányzó kényszer volt — **őrt is állít mögé**.

Teljes szabály-doksi: `docs/development/email-design.md`.

## A leltár, amiből indultunk

21 HTML-sablon (20 az `emails.ts`-ben + 1 a hiring-route-ban inline
komponálva), ebből **2 halott** — `order_confirmation` (a billing parkolva,
nincs hívóhely) és `coach_application` (nincs hívóhely).

| Amit a levél elavultan vitt | Mire cserélődött |
|---|---|
| háromszínű szójel homok plaketten | kanonikus egyszínű `trıta` + bronz i-pont |
| bronz CTA fehér felirattal — **3,28:1**, AA-bukó | zsálya CTA fehér felirattal — **6,06:1** |
| kártya 12px / gomb 16px | kártya **20** (`radius-2xl`) / gomb **12** (`radius-lg`) |
| fehér vászon, kártya nélkül | krém vászon + fehér kártya (`surface-canvas`/`-card`) |
| 30 / 24 / 16 / 14 / 13 / 12 px, eyebrow 0,1em | zárt létra, eyebrow a `text-label` receptjével (0,14em + 700) |
| `faint` (mutedWarm) 12px-en — **4,40:1** | `muted` — 5,30:1 fehéren, 4,82:1 krémen |
| nulla formanyelv | 3. szintű jel (csillag · nap · ellensúly) a láblécben |
| 21 hívásból 8 címsor, 12 preheader | mindkettő **kötelező**, a típusban |
| 4 párhuzamos aláírás | 1 kanonikus + 1 dokumentált személyes kivétel |
| leiratkozás nyers URL-ként a törzsben, 2 levélen | lábléc-slot, linkként, minden életciklus-levélen |

A **3,28:1** nem elméleti: a 16px/600-as felirat nem minősül nagy szövegnek,
tehát 4,5:1 kellett volna. A weben ezt a csapdát már megoldották — a
`--palette-text-on-accent` szándékosan sötét, mert „az akcentek MINDKÉT
témában világosak" —, a levél viszont nem tudott róla.

## Két család

- **`client`** (meghívó, eredmény, emlékeztető, üdvözlő): bronz eyebrow +
  formanyelvi jel a láblécben.
- **`system`** (kód, magic link, admin-értesítő): halk eyebrow, jel nélkül.
  Ott a kód megtalálása a feladat, nem a márka jelenléte.

## Eszközök: miért kép, és miért hosztolt

`pnpm build:email-art` két PNG-t renderel Chromiumban a helyi TTF-ekből
(`public/email/wordmark.png`, `mark.png`), és melléjük egy generált
méret-modult (`src/lib/email-art.ts`).

- A szójel élő szövegként nem rakható ki hűen: a bronz i-pont
  `position:absolute`-ot kérne (a Gmail eltávolítja), a Fraunces pedig a
  kliensek többségében nem töltődne be.
- **A `data:` URI nem járható út**: a Gmail kidobja képforrásként, és az
  inline SVG-t sem rendereli. A cid-melléklet működne, de minden levélre
  gemkapcsot tenne — marad a hosztolt fájl.
- Kikapcsolt képnél a szójel `alt` szövege lép a helyére (a `<img>`-en
  megadott betű- és színstílusokkal), a dekoratív jel nyomtalanul eltűnik.

A jel geometriája a **közös `miro-primitives.ts`-ből** jön, ugyanazokkal a
konstansokkal, mint a `StarLoader` — a levél jele nem tud elcsúszni a
felületétől.

## Betűkép

`<link>`-elt DM Sans + Fraunces, **mso-feltételes blokkban**. Az Apple Mail
és az iOS betölti; a Gmail és az Outlook illesztett tartalékra esik (Georgia,
illetve a rendszer-humanista sor). Az Outlook külön kijelölést kap, mert
ismeretlen családnál nem a stack következő elemére lép, hanem Times New
Roman-ra.

Eddig a fejléc `Fraunces`-t kért webfont nélkül — tehát **minden kliensben
Georgia renderelt**.

## Sötét mód: marad a világos zár, de a blokk újraírva

A `@media (prefers-color-scheme: dark)` blokk nem fölösleges duplázás: több
kliens (Apple Mail, Outlook.com) sötét módban saját inverziót futtat, amit a
`color-scheme: light only` önmagában nem állít meg. A blokk viszont a RÉGI
osztályokra mutatott (`.em-head`, `.em-wm-*`) — az új szerkezetre újraírva.

## Technikai egységesítés

**`scripts/email-samples.ts` (új).** Minden sablon, mindkét nyelven, a
**valódi küldő-útról**: a Resend `fetch`-hívását kapjuk el, tehát a tárgy, a
HTML és a sima szöveges változat is az, ami élesben kimenne. Ebből dolgozik
az előnézet-generátor ÉS a guardrail-teszt — amit szemmel ellenőrzöl, azt
ellenőrzi a CI is.

A korábbi `preview-emails.ts` 12 kézzel másolt, csak magyar mintát ismert a
21-ből, és a törzsszövegei már nem egyeztek az élessel. Most **41 renderelés**
készül (21 sablon × HU/EN, az admin-értesítő magyar-only).

**A hiring kredit-levél átkerült az email-modulba.** Ez volt az egyetlen
sablon, ami route-ban komponálódott (`/api/hiring/request-credits`), saját —
és rossz domainre (`trita.app`) mutató — `APP_URL`-fallbackkel.

**`APP_URL` az `email-layout.ts`-be került**, egyetlen modul-szintű
konstansként. A Turbopack-kerülőút megjegyzése vele ment.

**Kivezetett fájlok/exportok.** `renderInfoTable`, `EMAIL_EYEBROW`,
`EMAIL_UL`, `EMAIL_LI` — mindegyik egyetlen fogyasztója a törölt
`order_confirmation` / `coach_application` volt. `renderSecondaryButton` nem
került be hívó nélkül: a bronz-tinta szabályt az `actionSecondary*` tokenek
és a kontraszt-teszt őrzi.

## Guardrail

`tests/unit/design/email-templates.test.ts` — 15 eset, mind a 41 renderelésen:

1. eyebrow + Fraunces címsor + preheader minden sablonon (nem üresen);
2. minden sablon mindkét nyelven renderel;
3. **számolt** kontraszt: az akciógombok és a szöveg-szerepek AA-t teljesítenek
   a krém vásznon ÉS a fehér kártyán;
4. nincs nyers hex a levél-modulokban, és a renderelt HTML-ben csak
   `EMAIL_COLORS`-érték szerepelhet színként;
5. a levél a dokumentált fok-létrán marad, az eyebrow a `text-label` receptjével;
6. kanonikus szójel megy ki, a kivezetett elemek nem térnek vissza;
7. kártya 20 / gomb 12; a webfont-link mso-feltételes;
8. formanyelvi jel csak az ügyfél-családon, dekorációként;
9. egyetlen kanonikus aláírás; leiratkozás minden életciklus-levélen;
10. minden levélnek van sima szöveges változata, HTML-szivárgás nélkül.

**Visszaellenőrizve a javítás ELŐTTI állapoton**: a régi CTA- és
halk-szín-tokenekkel három őr bukik, és a kontraszt-teszt pontosan a
bejelentett **3,28:1**-et írja ki.

## Ami szándékosan kimaradt

- **Valódi sötét levél-változat.** Külön paletta + kliens-mátrix
  (Apple Mail / Gmail / Outlook sötétben) — önálló kör.
- **Az `emails.ts` szövegei továbbra sem az i18n-modulból jönnek.** Saját
  `translations` objektumban élnek, ami szembemegy a projekt konvenciójával.
  Tartalmi migráció, nem arculati — külön kör.
- **`features/interest` és `inquiries` admin-lead levelei.** Ezek
  szándékosan `text/plain`-ek (belső értesítők), nincs HTML-rétegük.

## Ellenőrzés

Type-check 0 hiba · ESLint tiszta · `check:colors` zöld · unit **1101/1101** ·
client **229/229** · 41 előnézet renderel.

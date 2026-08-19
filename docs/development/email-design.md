# Levél-arculat — a harmadik médium

> Állapot: **ÉLES (2026-08-19)** · Modulok: `src/lib/email-layout.ts`,
> `src/lib/emails.ts`, `src/lib/design-tokens.ts` (`EMAIL_COLORS`),
> `src/lib/email-art.ts` (generált) · Előnézet: `pnpm preview:emails` ·
> Guardrail: `tests/unit/design/email-templates.test.ts`

A Trita három médiumban beszél: **web**, **PDF-riport**, **levél**. A három
ugyanazt a rendszert használja, de mindegyik a saját korlátai szerint
fordítja le — a web CSS-változókkal, a PDF pt-ben, a levél inline hexben.
A KÖZÖS elem a *szerep*, nem az érték.

Ez a doksi a levél-médium szabályait rögzíti.

---

## 1. Miért kellett külön kör

A levél-keret 2026-07-23-án készült el, és utána négy design-körön át
érintetlen maradt: a jelentés-alapú szín-rendszer (08-05), a háromszintű
formanyelv (08-09), a lezárt tipográfiai skála és a webbel egységesített
PDF-riport (08-18) mind kikerülte. A tipográfiai zárás changelogja ki is
mondja: `src/lib/emails.ts` — „nem érintett, inline stílus, nem Tailwind".

Nem hanyagság volt: a levél zárt, működő rendszer, amihez semmi nem
kényszerített hozzányúlást. Ezért a kör **nem csak átszínez, hanem őrt is
állít** (8. fejezet) — hogy a következő design-kör ne tudja csendben itt
hagyni.

Amit az átállás előtti állapot vitt: kivezetett háromszínű szójel, bronz
elsődleges gomb **3,28:1** fehér felirattal (AA-bukó minden levélben),
fordított sarok-létra (kártya 12 / gomb 16), skálán kívüli fokok, 21
layout-hívásból 8 címsor, négy párhuzamos aláírás, és nulla formanyelv.

---

## 2. A keret

```
krém vászon (surface-canvas)
├── fejléc:  kanonikus szójel ····························· típus-felirat
├── FEHÉR KÁRTYA (surface-card · 20px sarok · 1px sand keret)
│   ├── eyebrow      pötty + 11px/0,14em/700 verzál
│   ├── címsor       Fraunces 26px, tinta
│   ├── törzs        16px/26px
│   ├── akció        zsálya gomb, fehér felirat, 12px sarok
│   └── halk zárás   hajszálvonal + 14px muted
└── lábléc:  formanyelvi jel · aláírás · trita.io · © · [leiratkozás]
```

Az `EmailLayoutParams` típus **kötelezővé teszi** az `eyebrow`, `heading`,
`preheader`, `kind`, `family` és `signOff` mezőt. Ez szándékos: a korábbi
szórás azért állhatott elő, mert ezek opcionálisak voltak. A szerződés a
típusban él, nem konvencióban.

## 3. Két család

| | `client` (ügyfél) | `system` (rendszer) |
|---|---|---|
| Mikor | meghívó, eredmény, emlékeztető, üdvözlő | kód, magic link, admin-értesítő |
| Eyebrow | bronz pötty + `accentText` felirat | halk `muted` pötty és felirat |
| Formanyelvi jel | van (lábléc) | nincs |
| Miért | a márka jelen lehet | a kód megtalálása a feladat, nem a márka |

## 4. Színek — `EMAIL_COLORS`

A készlet **szerep-lista**, nem érték-lista, és mindig a `COLORS`-ból
származik. Nyers hex a levél-modulokban tilos (a guardrail hard-failel).

| Szerep | Érték | Miért |
|---|---|---|
| `canvas` | cream | az app `surface-canvas`-a |
| `card` | fehér | `surface-card`; a QR-doboz is ezt kéri (beolvashatóság) |
| `border` | sand | `border-default` — keret és hajszálvonal egyben |
| `heading` / `body` | ink / ink-body | |
| `muted` | muted | **nem** `mutedWarm`: az fehéren 4,40:1 volt, AA alatt |
| `actionPrimaryBg/Fg` | sage / fehér | `action-primary`, 6,06:1 |
| `actionSecondaryBg/Fg` | bronze / **ink** | 5,20:1 — a fehér itt 3,28:1 lenne |
| `accent` / `accentText` | bronze / bronze-dark | grafikai akcent vs. 11px-es felirat |
| `wordmark` / `wordmarkDot` | ink / bronze | a kanonikus szójel két színe |

> **A bronz szabálya.** Bronz felületre TINTA felirat kerül, sosem fehér.
> Ez ugyanaz a döntés, ami a weben a `--palette-text-on-accent`-et sötéten
> tartja („az akcentek MINDKÉT témában világosak"). Ezen bukott meg a
> korábbi CTA.

## 5. Fok-létra

`34` (kód) · `26` (címsor) · `16` (törzs) · `14` (halk) · `13` (aláírás) ·
`12` (lábléc) · `11` (eyebrow). Más fok nem fordulhat elő — guardrail őrzi.

**A 16px törzs a skála egyetlen dokumentált levél-kivétele.** A webes
`text-body` 15px, de a levél mobil-inboxban olvasódik, gyakran rossz
fényviszonyok között, és nincs körülötte zoom-kontextus. Ugyanaz az elv,
ahogy a PDF pt-ben méretez: a médium diktálja a fokot, a SZEREP marad közös.

Az eyebrow a `text-label` **receptjét** viszi: 0,14em betűköz + 700 súly —
nem csak a méretét.

## 6. Sarkok

Kártya **20px** (`--ui-radius-2xl`, a `Card` primitív), gomb **12px**
(`--ui-radius-lg`, a `Button` primitív), kód-doboz **16px**
(`--ui-radius-xl`). Az átállás előtt a kártya és a gomb fel volt cserélve.

## 7. Eszközök — `cid:` inline csatolmány

Két PNG, generátorral: `pnpm build:email-art` (`scripts/build-email-art.ts` →
`src/lib/email-art.ts`, base64-ben).

- **szójel** — a kanonikus `trıta` Fraunces-ben, bronz i-ponttal.
- **formanyelvi jel** — a 3. szint: tinta-csillag, bronz nap, zsálya
  ellensúly. A geometria a közös `miro-primitives.ts`-ből jön, tehát a levél
  jele nem tud elcsúszni a felületétől.

**Miért kép.** A szójel élő szövegként nem rakható ki hűen: a bronz i-pont
`position:absolute`-ot igényelne (a Gmail eltávolítja), a Fraunces pedig a
kliensek többségében nem töltődik be. Kikapcsolt képnél a szójel `alt`
szövege lép a helyére (a `<img>`-en megadott betű- és színstílusokkal), a
dekoratív jel (`alt=""` `role="presentation"`) nyomtalanul eltűnik.

**Miért `cid:`, és nem hosztolt URL (2026-08-19 javítás).** Az első kör
hosztolt URL-t használt (`${APP_URL}/email/…`), és **élesben nem töltődött
be**. Két néma buktatója van, mindkettő elég önmagában is:

- a küldéskor kiszámolt `NEXT_PUBLIC_APP_URL` nem feltétlenül az a hoszt,
  ahová az eszköz kikerült (preview-deploy vs. produkció, illetve a még nem
  deployolt ág);
- a Vercel deployment protection a preview-domainen a kép-kérést is
  elutasítja, tehát a Gmail proxyja 401-et kap.

A `data:` URI sem járható: a Gmail eltávolítja a data-URI képforrásokat. Marad
a `cid:` INLINE csatolmány — a Resend a `contentId` megadásakor
`content_disposition: "inline"`-t küld, tehát nem lesz belőle gemkapocs, a
levél viszont **magával viszi a képet**. Nincs hoszt-, deploy- vagy
env-függés. (A megosztó-levél QR-kódja is így utazik.)

A bájtok azért a JS-modulban élnek, és nem a `public/`-ból olvasódnak
futásidőben: a `public/` **nem része a szerverless bundle-nek**, tehát egy
`readFileSync` élesben elszállna. Együtt ~4,3 kB.

**A csatolást a küldő-kapu végzi** (`sendEmail` az `emails.ts`-ben), nem a
hívó — így egy sablon nem tud kép nélkül kimenni. A guardrail két oldalról
zárja: minden `cid:` hivatkozáshoz kell csatolmány, és a levélben **nem
lehet külső képforrás**.

## 8. Betűkép

`<link>`-elt Google Fonts (DM Sans + Fraunces), **mso-feltételes blokkban**.
A WebKit-alapú kliensek (Apple Mail, iOS) betöltik; a Gmail és az Outlook a
tartalékra esik — ezért a tartalék nem generikus, hanem illesztett (Fraunces
mellé Georgia, DM Sans mellé a rendszer-humanista sor).

Az Outlook külön eset: ismeretlen családnál **nem** a stack következő elemére
lép, hanem Times New Roman-ra. Ezért kap saját `[if mso]` kijelölést.

## 9. Sötét mód

A levél **világos-zárt** (`color-scheme: light only`), és a
`@media (prefers-color-scheme: dark)` blokk a világos értékeket `!important`-tal
újra kimondja. Ez **nem duplázás**: több kliens (Apple Mail, Outlook.com)
sötét módban saját inverziót futtat, amit a `color-scheme` önmagában nem
állít meg — enélkül a levél félig invertált, olvashatatlan köztes állapotba
esik. Valódi sötét levél-változat készítése önálló kör lenne, saját
kliens-mátrixszal.

## 10. Nyelv

**Egyetlen szabály: `normalizeLocale()`, aminek az alapértelmezése a
`DEFAULT_LOCALE` — magyar.** Ugyanaz, amit az app minden más felülete használ.

Ez 2026-08-19-én javítás volt: magyar felhasználók angol leveleket kaptak.
Három ok versengett egymással.

1. `getLocale(email)` a címzett **e-mail-TLD-jéből tippelt** (`.hu` → magyar,
   minden más → angol), tehát egy gmail.com-os magyar felhasználó angolul
   kapta. A heurisztika elvben rossz — a levélcím nem nyelvi jelzés —, ezért
   kivezetve, nem javítva.
2. Hat küldő `?? "en"`-re esett vissza, hat másik `?? "hu"`-ra.
3. A hívási helyek saját ternáriusai közül több `: "en"`-nel zárt — köztük a
   Clerk-webhook `resolvedLocale`-ja, ami a **belépési kódot és a magic
   linket** viszi: ha a DB-olvasás hibázott vagy a profil még nem létezett,
   az első levél angolul ment ki.

**A hívó felelőssége** a felhasználó TÁROLT beállítását (`UserProfile.locale`)
átadni. Ahol a címzettnek nincs fiókja (külső meghívott: observer, csapat-,
org-, jelölt-meghívó), ott a **küldő felületi nyelve** (`getServerLocale()`) a
legjobb elérhető tudás; ha az sincs, marad a magyar.

Guardrail: locale nélkül hívva a levél magyarul megy ki, és a küldő-modulban
nem lehet angolra eső alapértelmezés.

## 11. Aláírás és leiratkozás

Egyetlen kanonikus aláírás locale-onként (`SIGN_OFF`). **Egyetlen dokumentált
kivétel**: a pilot- és advisory-visszaigazolás `Leinad · Trita`-val megy —
azok személyes követő levelek („24 órán belül személyesen kereslek"), ott a
csapat-aláírás rendszerüzenetté hűtené a hangot.

A leiratkozó-link a **lábléc-slotba** kerül (`optOut`), linkként — nem nyers
URL-ként a törzsbe. Kötelező minden ÉLETCIKLUS-levélen (`welcome`,
`reflection_prompt`, `draft_reminder`); a működési levelekre (kód, meghívó,
eredmény, kampány-lépés) nem vonatkozik, mert azokról nem a platform dönt.

## 12. Előnézet és guardrail

```bash
pnpm preview:emails        # mind a 19 sablon × HU/EN → .email-previews/index.html
pnpm build:email-art       # a két eszköz újragenerálása (src/lib/email-art.ts)
```

Mindkettő — és a guardrail-teszt is — **ugyanabból a listából** dolgozik
(`scripts/email-samples.ts`), és a **valódi küldő-utat** járja: a Resend
`fetch`-hívását kapjuk el, tehát a tárgy, a HTML és a sima szöveges változat
is az, ami élesben kimenne. A korábbi előnézet kézzel másolt mintákat vitt,
és ezért folyamatosan szétcsúszott a valósággal.

Az előnézet a `cid:` hivatkozásokat `data:` URI-ra írja át — ezt egy böngésző
nem tudná feloldani. Ez az EGYETLEN pont, ahol az előnézet eltér az élestől.

A `tests/unit/design/email-templates.test.ts` őrzi: szerkezet · számolt
kontraszt · token-tisztaság · fok-létra · kanonikus szójel · család-szabály ·
aláírás · leiratkozás · **kép-csatolmányok** · **nyelvi alapértelmezés** ·
text/plain megléte.

## 13. Új sablon felvétele

1. Fordítás-blokk `subject` · `kind` · `eyebrow` · `heading` · `preheader`
   mezőkkel, HU **és** EN.
2. Küldő függvény `src/lib/emails.ts`-ben (sehol máshol — a levél-HTML nem
   route-ban komponálódik), és a küldés a közös `sendEmail()` kapun megy.
3. Család kiválasztása (`client` / `system`) — ez dönti el az eyebrow tónusát
   és azt, hogy a levél viszi-e a formanyelvi jelet.
4. A hívási hely adja át a címzett tárolt nyelvét; ha nincs fiókja, a küldő
   felületi nyelvét (`getServerLocale()`).
5. Felvétel a `scripts/email-samples.ts` listájába.
6. `pnpm preview:emails` — szemre; `pnpm test:unit` — a guardrail.

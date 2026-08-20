# 2026-08-19 (utókör) — Két éles hiba a levél-rétegben: nyelv és képek

Az arculati átállás (`2026-08-19-level-arculat-atallas.md`) után a valódi
küldés két hibát hozott vissza. Egyik sem az arculat kérdése volt — az egyik
régi, öröklött hiba, amit a kör nem érintett, a másik az átállás saját,
frissen bevezetett hibája.

---

## 1. Magyar felhasználók angol levelet kaptak

**Nem az átállás okozta** — a levél-réteg indulása óta így működött. Három ok
versengett egymással:

| # | Ok | Hatás |
|---|---|---|
| 1 | `getLocale(email)` a címzett **e-mail-TLD-jéből tippelt**: `.hu` → magyar, minden más → angol | egy gmail.com-os magyar felhasználó angolul kapta |
| 2 | Hat küldő `?? "en"`-re esett vissza, hat másik `?? "hu"`-ra | sablononként más nyelv ugyanannak a felhasználónak |
| 3 | A hívási helyek saját ternáriusai közül több `: "en"`-nel zárt | ld. lentebb |

A 3. pont legsúlyosabb esete a **Clerk-webhook** `resolvedLocale`-ja:

```ts
const resolvedLocale: "hu" | "en" = locale ?? "en";
```

Ez viszi a **belépési kódot és a magic linket** — vagyis a legelső levelet,
amit egy felhasználó lát. Ha a DB-olvasás hibázott, vagy a profil még nem
létezett (frissen regisztrált), az első levél angolul ment ki.

### A javítás

**Egyetlen szabály: `normalizeLocale()`, alapértelmezésben a `DEFAULT_LOCALE`
— magyar.** Ugyanaz, amit az app minden más felülete használ.

- `getLocale(email)` **kivezetve, nem javítva**: a levélcím nem nyelvi jelzés,
  a heurisztika elvben rossz.
- Mind a 18 küldő `normalizeLocale(params.locale)`-t hív.
- A hívási helyek ad-hoc ternáriusai (`x === "en" ? "en" : "hu"`,
  `?? "hu"`, `(x === "hu" || x === "en") ? x : "en"`) mind
  `normalizeLocale(x)`-re cserélve — 9 fájlban.
- Ahol eddig **semmit nem adtak át** (páros összehasonlítás, org-meghívó,
  jelölt-újraküldés), ott most a küldő felületi nyelve megy
  (`getServerLocale()`): a címzettnek nincs fiókja, tehát tárolt nyelve sincs,
  és a meghívó kontextusa a legjobb elérhető tudás.

A `UserProfile.locale` mező végig létezett; a hiba az volt, hogy a réteg nem
egy helyen oldotta fel, és ahol nem kapott értéket, ott **angolra** esett.

---

## 2. A levélben lévő képek nem töltődtek be

**Ezt az átállás okozta.** Az első kör hosztolt URL-lel vitte a szójelet és a
formanyelvi jelet (`${APP_URL}/email/wordmark.png`). Két néma buktatója van,
és mindkettő elég önmagában is:

- a küldéskor kiszámolt `NEXT_PUBLIC_APP_URL` **nem feltétlenül az a hoszt**,
  ahová az eszköz kikerült — preview-deploy vs. produkció, illetve egy még
  nem deployolt ág;
- a Vercel **deployment protection** a preview-domainen a kép-kérést is
  elutasítja, tehát a Gmail képproxyja 401-et kap.

A választás indoklása az eredeti körben hibás volt: a cid-mellékletet azzal
vetettem el, hogy „minden levélre gemkapcsot tenne". A Resend típusa ezt
kifejezetten cáfolja — `contentId` megadásakor `content_disposition: "inline"`
megy ki, tehát nem lesz belőle csatolmány-jelzés.

### A javítás

**`cid:` inline csatolmány**, a bájtok base64-ben a generált
`src/lib/email-art.ts`-ben:

- a levél **magával viszi a képet** — nincs hoszt-, deploy- vagy env-függés;
- a bájtok azért a JS-modulba égnek, és nem a `public/`-ból olvasódnak
  futásidőben, mert a **`public/` nem része a szerverless bundle-nek**: egy
  `readFileSync` élesben elszállna;
- `public/email/*.png` kivezetve — a generátor már csak a modult írja.

Együtt ~4,3 kB levelenként.

**A csatolást a küldő-kapu végzi, nem a hívó.** Új belső `sendEmail()`
függvény, amin **mind a 19 sablon** átmegy; a `family` kötelező paraméter,
ebből dől el, melyik eszköz kell. Így szerkezetileg lehetetlen, hogy egy
sablon kép nélkül menjen ki. Mellékesen 19 példányban ismételt
hibakezelés-blokk tűnt el.

---

## Guardrail — mindkét hiba-osztályra

Négy új eset a `tests/unit/design/email-templates.test.ts`-ben:

- minden `cid:` hivatkozáshoz tartozik inline csatolmány **és fordítva**
  (árva csatolmány sem lehet), a bájtok tényleg ott vannak;
- a levél **nem hivatkozhat külső képforrásra** — ez zárja ki, hogy a hosztolt
  minta visszaszivárogjon;
- locale nélkül hívva a levél **magyarul** megy ki (welcome, kód, csapat-meghívó);
- a küldő-modulban nem lehet `?? "en"` alapértelmezés, és a TLD-heurisztika
  nem térhet vissza.

**Visszaellenőrizve a hibás állapoton**: a hosztolt URL-t és az `?? "en"`-t
visszatéve **hat** eset bukik.

## Egyéb

- `scripts/preview-emails.ts` az előnézetben `cid:` → `data:` URI-ra írja át a
  képeket (a böngésző a `cid:`-et nem tudja feloldani). Ez az egyetlen pont,
  ahol az előnézet eltér az élestől.
- `tests/unit/results/share-email-qr.test.ts` premisszája megváltozott: a
  `cid:` mostantól MINDEN levélben szerepel, ezért az „QR nélkül nincs cid"
  állítás a QR saját azonosítójára szűkült.
- `src/app/api/hiring/request-credits/route.ts` saját `APP_URL`-fallbackje
  (`https://trita.app` — rossz domain) az előző körben már kivezetésre került.

## Ellenőrzés

Type-check 0 hiba · ESLint tiszta · `check:colors` zöld · unit **1105/1105** ·
client **229/229** · 41 előnézet renderel.

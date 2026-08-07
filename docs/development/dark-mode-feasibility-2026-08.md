# Sötét mód — megvalósíthatósági vizsgálat

> Készült: 2026-08-07 · Kiindulás: `main` (df29acc) · Branch:
> `claude/dark-mode-feasibility`
>
> Ez **vizsgálat, nem megvalósítás**. A technikai állításokat fordítással
> igazoltam (Tailwind v4 CLI, valódi `globals.css`), nem dokumentációból
> idézem — ahol „igazolva" szerepel, ott lefutott build a bizonyíték.

---

## 1. Összefoglaló

A jelenlegi állapot **jobb, mint amire számítani lehetne**: a színrendszer
egyetlen forrásigazságból (`globals.css` `@theme` blokk) dolgozik, a kódban
gyakorlatilag nincs szétszórt hardkódolt szín, és **egyetlen `dark:` variáns
sincs** a JSX-ben, amit ki kellene bogozni.

A jó hír, hogy a mechanikus rész egyetlen fájl átstrukturálásával megoldható,
**nulla komponens-módosítással**. A rossz hír, hogy ez a munka kisebbik fele:
a nagyobbik a **jelentés-újraszármaztatás** (a réteg-akcentek, az értékelő
rampa és a dimenzió-színek nem invertálhatók, újra kell vezetni őket sötét
alapra), plusz az, hogy **jelenleg nincs képi regressziós háló**, ami
megvédené a „nem törhet el" ígéretet.

**Javaslat: a pilot (2026-09-08) előtt ne induljon el.** A 3. opció
(rendszerkövetés az app-fán, kapcsolóval) a pilot után egy jól körülhatárolt,
~3-4 hetes kör. Az 1. fázis (a témázható alapréteg) viszont **most, önállóan
is megéri** — kockázatmentes, nem változtat semmit vizuálisan, és minden
későbbi opciót kinyit.

---

## 2. Mit találtam — a jelenlegi állapot mérve

| Mit | Mennyi | Jelentés |
|---|---|---|
| `dark:` variáns a JSX-ben | **0** | Nincs örökség, amit ki kellene bogozni |
| Szín-használat összesen | ~5 900 osztály | Ebből ~4 100 nevesített paletta-utility (`bg-sage`, `text-ink`, `border-sand`…), ~1 470 `bg-[var(--color-…)]` arbitrary, ~320 nevesített szemantikus |
| Hardkódolt hex TS/TSX-ben | 189 db / 30 fájl | Túlnyomó részt **jogosan** fix: `color-system.ts` (80), `design-tokens.ts` (34), PDF, email, OG-képek, favicon |
| TS-oldali szín nem-PDF komponensben | 30 előfordulás | SVG-fill és inline style — **ezt a CSS-változó nem éri el** |
| Clerk beépített komponens | **0** | Saját sign-in/up flow → nincs Clerk-téma teendő |
| `color-scheme` | `light` fixen | `globals.css:369` |
| Képi regressziós teszt | **0** | A baseline-ok törölve (macOS-only, stale) — explicit TODO |

**Konklúzió:** a kódbázis nincs elrontva. Egy jól karbantartott token-rendszer
áll rendelkezésre, ami eddig egyszerűen nem volt témázhatóra tervezve.

---

## 3. A döntő technikai tény — a `@theme inline`

A `globals.css` minden tokent a **`@theme inline`** blokkban deklarál. Ez nem
mindegy: a Tailwind v4 az `inline` opció mellett a *deklarált értéket* fordítja
be az utilitybe, nem a változó-hivatkozást.

Fordítással igazolva (`@tailwindcss/cli` v4, valódi `globals.css`):

| Deklaráció a `@theme inline`-ban | Generált utility | Futásidőben felülírható? |
|---|---|---|
| `--color-sage: #3d6b5e` (literál) | `.bg-sage { background-color: #3d6b5e }` | **NEM** — beégett |
| `--color-surface-canvas: var(--color-cream)` | `.bg-surface-canvas { background-color: var(--color-cream) }` | IGEN |
| `bg-[var(--color-sage)]` (arbitrary) | `background-color: var(--color-sage)` | IGEN |

Két további tény, amit külön ellenőriztem, mert intuitíven mást sugallna:

- **Minden token bekerül a `:root`-ba**, a `@layer theme { :root, :host }`
  blokkba — tehát az ~1 470 `bg-[var(--color-…)]` arbitrary használat
  **már ma is futásidejű változóra hivatkozik**, azaz eleve témázható.
- A beágyazott hivatkozás (`--color-surface-canvas: var(--color-cream)`) NEM
  laposodik ki literálra: a `var(--color-cream)` láncot megtartja.

Vagyis a probléma pontosan körülhatárolható: **a nyers paletta literál
deklarációi** (sage, bronze, ink, cream, sand, muted, a `dim-*`, `layer-*`,
`eval-*`, `paper-*` készletek és a számozott aliasok) égnek be az utilitykbe.
A szerep-tokenek (`surface-*`, `text-*`, `border-*`, `action-*`) már ma is
hivatkozások.

---

## 4. A megoldás az 1. fázisra — MEGVALÓSÍTVA (2026-08-07)

> **Állapot: kész, ezen a branchen.** 120 literál token átemelve a
> `--palette-*` rétegbe. Ellenőrzés: type-check + lint + `check:colors`
> tiszta, 560 unit + 120 client teszt zöld, és a generált CSS
> **pixelre azonos** (ld. 4.1). Vizuálisan semmi nem változott.


Egyetlen szerkezeti változtatás `globals.css`-ben: **a nyers paletta kikerül a
`@theme`-ből egy sima `:root`-ba, a `@theme inline` pedig már csak hivatkozik
rá.**

```css
/* 1. A nyers paletta sima :root-ban — EZ lesz a témázható réteg */
:root {
  --palette-sage:  #3d6b5e;
  --palette-cream: #f7f4ef;
  --palette-ink:   #1a1a2e;
  /* … a teljes nyers készlet */
}

/* 2. A @theme inline CSAK hivatkozik — a szerep-tokenek változatlanok */
@theme inline {
  --color-sage:  var(--palette-sage);
  --color-cream: var(--palette-cream);
  --color-ink:   var(--palette-ink);
  --color-surface-canvas: var(--color-cream);   /* változatlan */
  --color-text-primary:   var(--color-ink);     /* változatlan */
}

/* 3. A sötét készlet ugyanazokat a nyers változókat írja felül */
:root[data-theme="dark"] {
  --palette-sage:  #74ab97;
  --palette-cream: #17171b;
  --palette-ink:   #f2eee7;
}
```

A prototípust lefordítottam. A kimenet:

```css
.bg-sage           { background-color: var(--palette-sage); }   /* ✓ témázható */
.bg-cream          { background-color: var(--palette-cream); }  /* ✓ */
.bg-surface-canvas { background-color: var(--color-cream); }    /* ✓ láncon át */
.text-text-primary { color: var(--color-ink); }                 /* ✓ */
```

**Minden nevesített utility `var()`-ra fordul.** Ez azt jelenti:

- ~5 900 szín-használat válik témázhatóvá,
- **egyetlen komponenst sem kell módosítani**,
- világos módban a kimenet **bitre azonos** marad (ugyanaz az érték, csak egy
  indirekcióval), tehát ez a lépés **önmagában nem tud vizuálisan törni**.

### 4.1 Hogyan igazoltuk, hogy nem tört el

Négy egymást kiegészítő ellenőrzés futott:

1. **Feloldott CSS-érték összevetés.** A `main` és az átalakított
   `globals.css` fordítása a valódi `src` fa ellen, majd minden generált
   utility `var()` láncának visszafejtése literálig. Eredmény: **1 896
   utility szabály mindkét oldalon, 0 hiányzó, 0 új, 0 megváltozott
   feloldott érték.**
2. **Pixel-összevetés.** Próbalap mind az **1 281 utility-osztállyal**
   (`bg-*`, `text-*`, `border-*`, `ring-*`, gradiensek, árnyékok…), a két
   stíluslappal rendereltetve, teljes lapos képernyőkép. Eredmény:
   **0 eltérő pixel** 7,3 millióból. (Első futásra az `animate-pulse` és
   `animate-spin` cellák eltértek — a két felvétel más animációs fázisban
   készült; animáció-kikapcsolással a lap teljesen azonos.)
3. **Teszt- és típus-ellenőrzés.** `pnpm check` (type-check + lint +
   check:colors) tiszta, `pnpm test:unit` **560/560**, `pnpm test:client`
   **120/120** zöld.
4. **Az őr saját tesztje.** Az új `check-colors` (c) ellenőrzést szándékos
   rontással próbáltam ki (egy token visszaírása literálra) — helyes
   sorszámmal elbukik, visszaállítva zöld.

**Az egyetlen valós különbség** az opacity-módosítós osztályok
(`bg-bronze/10`, `bg-[var(--color-…)]/20` — 155 db) fallback-sora:

| | Alap-deklaráció | `@supports (color-mix)` alatt |
|---|---|---|
| Előtte | `color-mix(in oklab, #c17f4a 10%, transparent)` | — |
| Utána | `var(--palette-bronze)` (teljes fedés) | `color-mix(in oklab, var(--palette-bronze) 10%, transparent)` |

`color-mix`-et támogató böngészőben a végeredmény **azonos** (a
`color-mix(in oklab` előfordulások száma is változatlan: 250). Csak
`color-mix` nélküli böngészőben térne el — de a generált CSS **mindkét
változatban** használ `@property`-t és `color-mix`-et, vagyis az a böngésző
eleve nem tudja megjeleníteni az oldalt. **A különbség a gyakorlatban
elérhetetlen.**

### Amit az 1. fázis még érintett

- `tests/unit/design/design-tokens-sync.test.ts` — a feloldó a teljes
  változónevet kulcsolja, és bármelyik réteg `var()` hivatkozását követi
  (`--color-surface-canvas` → `--color-cream` → `--palette-cream` → hex).
  10/10 zöld.
- `scripts/check-colors.mjs` — **új (c) ellenőrzés**: literál hex a `@theme`
  blokkban hard fail. Ez tartja meg az architektúrát a jövőben.
- `docs/development/color-system-2026-08.md` — új 0/a. fejezet a
  réteg-szerkezetről és az új token felvételének szabályáról.

---

## 5. Amit az 1. fázis NEM old meg — ez a tényleges munka

### 5.1 Jelentés-újraszármaztatás (a legnagyobb tétel)

A Trita token-rendszere **négy jelentés-osztályt** különböztet meg
(`color-system-2026-08.md`): neutrális alap · réteg-akcent · adat-identitás ·
státusz/értékelés. Ezek **nem invertálhatók** — a viszonyaikat kell újra
levezetni sötét alapra:

- **Réteg-akcentek** (self/team/org/candidate). A `globals.css` maga rögzíti,
  hogy a glow-színek „CSAK sötét herón" használhatók, mert fehéren AA-bukók.
  Sötét módban ez a viszony **megfordul**: a hero eddigi sötét gradiense
  elveszti a figura-háttér elválást a sötét oldalalaptól. A négy hero-készletet
  (from/mid/to/glow/badge/soft) újra kell hangolni — ez nem színcsere, hanem
  tervezői döntés.
- **Dimenzió-hármasok** (H/E/X/A/C/O). 18 érték, világos felületre hangolva; a
  `-soft` tintek (`#eef0f8` stb.) sötéten használhatatlanok. Az egész készletet
  újra kell lépcsőzni és **kontraszt-validálni**.
- **Értékelő rampa** (`eval-high/mid/low`). Kimondott elv: „hangosabb→halkabb",
  a piros tilos. Sötéten a „halkabb" fok könnyen a háttérbe olvad — a rampa
  iránya megmarad, de a lépcsők nem.
- **Paper marketing-téma** (founding / patterns / fakedoor). Ez tudatosan
  egyetlen vizuális világ. **Döntés kell:** részt vesz-e a sötét módban, vagy
  szándékosan világos marad. Javaslat: maradjon világos, mert a „papír"
  metafora sötéten értelmét veszti.

### 5.2 Árnyékok

A `--ui-shadow-*` skála öt fokozata ink-alapú (`rgba(26,26,46,…)`), plusz
**66 arbitrary `shadow-[…]`** osztály a komponensekben. Sötét alapon a sötét
árnyék láthatatlan — a mélység-jelzést keretre vagy világosság-lépcsőre kell
cserélni. Ez nem token-csere: a skála egészét újra kell gondolni.

### 5.3 TS-oldali színek (30 előfordulás)

`CelebrationBurst`, `QrCodeBadge`, `DynamicsMap`, `TeamReportView`,
`ShareCardDownload`, `TypeGlyph` — ezek `design-tokens.ts`-ből vesznek hexet
inline style-ba vagy SVG-attribútumba. **A CSS-változó ide nem ér el.**
Kezelés: ahol SVG-ről van szó, `currentColor`-ra vagy `var(--…)`-ra váltás
(SVG-ben működik); ahol canvas/generált kép, ott a témát propként kell
levinni.

### 5.4 Fix médiumok — ezeket ki kell zárni

| Felület | Teendő |
|---|---|
| **PDF** (`components/pdf/`) | Szerver-oldalon renderel, CSS nem éri el → magától védett. Ellenőrizni, hogy a `PDF_COLORS` ne a témázott rétegre mutasson. |
| **Email** (`email-layout.ts`) | **Már védett**: `color-scheme: light only` + `meta supported-color-schemes` + `!important`. Példásan megoldva, nem kell hozzányúlni. |
| **OG-képek, favicon** | Szerver-oldali render (`opengraph-image.tsx`, `icon.tsx`) → magától védett. |

### 5.5 Platform-részletek

- `color-scheme: light` (`globals.css:369`) → dinamikussá kell tenni, különben
  a natív form-vezérlők, a görgetősáv és az iOS-autofill világos marad egy
  sötét lapon.
- **Téma-villanás (FOUC).** Next.js App Routerben szerver-oldali render mellett
  a mentett témát a festés ELŐTT kell alkalmazni — blokkoló inline script a
  `<head>`-ben, ami a `localStorage`-ból ráteszi a `data-theme`-et a `<html>`-re.
  Enélkül minden oldalbetöltésnél felvillan a világos téma.
- **ThemeProvider.** A `LocaleProvider.tsx` mintája közvetlenül követhető
  (context + `useState` + `localStorage`), a beállítás a `UserProfile`-ba is
  menthető, ha eszközök közt kell vinni.
- **Doodle SVG-k** (`public/doodles/`, 26 db, `#000000` fill): jelenleg
  **sehol nincsenek használatban** a `src`-ben — halott asset, nem teendő.

---

## 6. A legnagyobb kockázat: nincs háló

`tests/e2e/team/team-intelligence-visual.test.ts` fejlécében rögzítve: a
pixel-szintű `toHaveScreenshot` asszerciók strukturális assertekre lettek
cserélve, a baseline-ok törölve (macOS-en készültek, a CI Linuxán nem
léteztek). A visszaélesztés explicit TODO.

**Ez azt jelenti, hogy a „vizuális élmény nem törhet" ígéretet ma semmi nem
őrzi.** Egy sötét mód bevezetése két felület-készletet hoz létre ugyanazon a
kódon — kézi ellenőrzéssel ez nem tartható.

Van viszont mire építeni: a `tests/unit/design/surface-hero-theme.test.ts` már
tartalmaz WCAG-kontraszt függvényt és AA-küszöb assertet. Ez a **token-szintű
kontraszt-teszt** magja: minden szerep-token párra (szöveg × felület)
mindkét témában futtatható, és sokkal olcsóbb, mint a képi baseline.

**Sorrend-javaslat:** előbb a token-szintű kontraszt-teszt, csak utána a
sötét készlet. Így a paletta tervezése közben azonnal látszik, mi bukik.

---

## 7. Opciók

| | Mit jelent | Munka | Kockázat | Mikor |
|---|---|---|---|---|
| **A — Nem csinálunk** | Marad világos. A `color-scheme: light` szándékos döntés. | 0 | 0 | — |
| **B — Csak alapréteg** | Az 1. fázis (témázható tokenek), sötét készlet nélkül. Vizuálisan nem változik semmi. | — | — | **✅ KÉSZ (2026-08-07)** |
| **C — Rendszerkövetés** | Sötét készlet + kapcsoló (rendszer/világos/sötét). | — | — | **✅ ALAP KÉSZ (2026-08-07), ld. 10.** |
| **D — Teljes felület** | Minden publikus oldal is, hero-gradiensek újratervezve. | 6–8 hét | Magas | 2027 |

### Javaslat

**Most: B.** Kockázatmentes, fél-egy nap, és minden későbbi opciót kinyit
anélkül, hogy bármit eldöntene. A pilot előtt egy hónappal ez az egyetlen
felelős lépés.

**Pilot után: C.** Az app-fa (dashboard, csapat, org, riportok) a tényleges
napi használati felület — ott van értelme a sötét módnak. A marketing-fa és a
paper-téma maradjon világos: ez nem hiányosság, hanem a márka döntése, és
felére vágja a felületet.

**D-t nem javaslom** addig, amíg nincs képi regressziós háló és a pilot nem
adott visszajelzést arról, hogy egyáltalán kéri-e valaki.

---

## 8. Ha a C indul — végrehajtási sorrend

1. **Alapréteg** (= B fázis): nyers paletta kiemelése, `@theme inline`
   hivatkozásokra, sync-teszt regex bővítése. *Vizuálisan nulla változás.*
2. **Kontraszt-háló**: token-szintű WCAG-teszt minden szöveg × felület párra,
   a `surface-hero-theme.test.ts` mintájára. Világos témán is le kell futnia
   zölden, mielőtt a sötét készlet elkészül.
3. **Neutrális sötét készlet**: alap, felület, keret, szöveg-fokozatok. A
   semleges szín ne tiszta szürke legyen, hanem a bronz felé hajló meleg —
   különben elveszik a Trita karaktere.
4. **Szerep-tokenek** sötét megfelelői (sage/bronze világosítva), kontraszt-
   teszttel validálva.
5. **Jelentés-osztályok** újraszármaztatása: dimenzió-hármasok → értékelő
   rampa → réteg-akcentek. Ez a leghosszabb tétel, tervezői döntésekkel.
6. **Árnyék-skála** átgondolása (keret/világosság alapra).
7. **Platform**: `ThemeProvider`, FOUC-elhárító inline script, dinamikus
   `color-scheme`, kapcsoló a fejléc-navba.
8. **TS-oldali színek** (30 hely) témafüggővé tétele.
9. **Kizárások ellenőrzése**: PDF, email, OG — mindegyik maradjon világos.
10. **Képi baseline** generálása CI-ben (Linux), a folyamat rögzítésével — a
    `visual-regression` TODO lezárása.

---

## 9. Egy mondatban

A kódbázis nincs elrontva, és a mechanikus rész meglepően olcsó: **egyetlen
fájl átstrukturálása témázhatóvá tesz ~5 900 szín-használatot, komponens-
módosítás nélkül** — ezt érdemes most megcsinálni. A tényleges munka viszont
nem a színcsere, hanem a **jelentés újraszármaztatása** sötét alapra és a
**hiányzó regressziós háló pótlása**; ez a pilot utánra való, és az app-fára
szűkítve fele akkora, mint a teljes felületre.

---

## 10. C fázis — megvalósítva (2026-08-07)

### 10.1 A hatókör-tanulság — ezért NEM csak az app-fa sötét

A terv az volt, hogy a sötét mód csak a bejelentkezett app-fára vonatkozik, a
marketing világos marad. Ezt megépítettük (`.theme-scope` burkoló, a sötét
blokk szelektora `[data-theme="dark"] .theme-scope`), és **méréssel derült ki,
hogy CSS-szemantikailag nem működhet**:

```
scope --palette-cream    #141418   ← a felülírás MEGÉRKEZIK
scope --color-cream      #f7f4ef   ← de az alias VILÁGOS marad
kártya tényleges háttér  #ffffff
```

Az ok: a `--color-x: var(--palette-x)` aliasok a `:root`-on vannak
**deklarálva**, és a `var()` a *deklaráló* elemen helyettesítődik be. A
gyerekelem a már behelyettesített (világos) értéket örökli — egy
leszármazottra tett `--palette-*` felülírás tehát az alias-réteget nem éri el.
Ezért a felület felében (ami `--palette-*`-ra fordul) átfordult a szín, a
másik felében (ami `--color-*`-ra) nem — vegyes, törött állapot.

Leszármazott-hatókörhöz **mindkét réteget** újra kellene deklarálni (~120
palette + ~150 alias token), ami garantáltan elcsúszna. Ezért a sötét blokk a
`:root[data-theme="dark"]`-on ül: **a hatókör az egész dokumentum**, a
marketing-fa is átfordul, és a paper-téma (founding / patterns) is kapott
sötét készletet — meleg, sötét papír.

### 10.2 Mi készült el

| Tétel | Állapot |
|---|---|
| **Kontraszt-háló** (`tests/unit/design/token-contrast.test.ts`) | 5 teszt, mindkét témára. Szöveg×felület párok AA-küszöbbel + **felület-elválás** (panel ne olvadjon a szülőbe). |
| **Sötét készlet** | 115 token: neutrálisok, zsálya, bronz, jelölt-réteg, státusz, 18 dimenzió-érték, réteg-akcentek, hero-gradiensek, paper-téma, árnyék-skála. |
| **Platform** | `ThemeProvider` (`useSyncExternalStore`), festés előtti inline script (nincs villanás), `trita_theme` preferencia-süti a `trita_locale` mintájára, dinamikus `color-scheme`. |
| **Kapcsoló** | `ThemeToggle` — három állapot (rendszer/világos/sötét), i18n HU+EN, asztali és mobil menüben. |
| **Közös token-feloldó** | `tests/unit/design/css-tokens.ts` — a szinkron-teszt is erre állt át (a saját feloldója „utolsó nyer" alapon a sötét értékeket olvasta volna). |

### 10.3 Tervezői döntések, amiket a háló kényszerített ki

- **Két szerep megfordul.** A világos zsálya-gombra sötét felirat kerül
  (`action-primary-fg`), és a `text-inverse` is sötétre vált. Ugyanaz a token
  szolgálja a gomb-kitöltést és az akcentet — sötéten csak így marad mindkettő
  olvasható.
- **A mélységet a felület-világosság viszi**, nem az árnyék (canvas #141418 →
  kártya #1d1d23 → muted #23232a). Az ink-alapú árnyék sötéten láthatatlan.
- **A neutrális nem tiszta szürke**, hanem a bronz felé hajlik — enélkül
  elveszne a Trita meleg karaktere.

A háló futás közben **három valódi hibát** fogott meg: két sötét státusz-háttér
beleolvadt a kártyába, és kiderült, hogy a `state-warning-bg` **a világos
témában is** alig válik el a fehér kártyától (1.037) — ez utóbbi meglévő
adósságként nyilvántartásba került, nem írtuk át csendben a világos témát.

### 10.5 Ami még hátravan

| Tétel | Miért nem most |
|---|---|
| **TS-oldali színek** (30 hely: `DynamicsMap`, `TeamReportView`, `TypeGlyph`, `CelebrationBurst`, `QrCodeBadge`, `ShareCardDownload`) | SVG-fill és inline style — a CSS-változó nem éri el. Komponensenkénti döntés kell (`currentColor` vs. téma-prop). |
| **Hero-gradiensek valós oldalon** | A token-szintű ellenőrzés zöld, de a gradiensek figura-háttér viszonyát futó appon kell megnézni. |
| **Marketing-fa átnézése** | A hatókör-döntés miatt a landing/blog/founding is sötétre vált — ezt végig kell nézni. |
| **Képi CI-baseline** | A `visual-regression` TODO továbbra is nyitott; most már két témára kellene. |
| **8 világos kontraszt-adósság + 1 felület-adósság** | Nyilvántartva, racsnival védve. Javításuk vizuális változás — külön döntés. |


### 10.4 A hatókör visszavétele — és az utolsó mérföld (2026-08-07, 2. kör)

A 10.1-ben leírt CSS-akadály miatt a sötét mód először **globális** lett. A
futó appon lefotózva kiderült, hogy ennek ára van: a **marketing-fa törött**
volt sötéten — a wordmark eltűnt, a minta-kártya hero-ja világos zöld lett
fehér szöveggel, a chipek olvashatatlanok.

Ezért visszavettük az app-fás hatókört. Az akadály megkerülhető, csak
drágábban: a scope-elemen **mindkét réteget** deklarálni kell (120
`--palette-*` + 198 `--color-*` alias). Ez generált, és **kétirányú őr**
tartja szinkronban (`check-colors` (d)): ha a `@theme`-be új token kerül és a
sötét blokkból kimarad, sötéten a világos értékén ragadna; ha fordítva, akkor
világosban lenne feloldatlan. Az őr azonnal fogott is 8 hiányzó tokent, amit a
generálásom kihagyott (sorvégi kommentes deklarációk), és egy saját hibámat,
ahol egy tokent a rossz blokkba szúrtam be.

**Az utolsó mérföld: 542 témázhatatlan osztály.** A hatókör helyes volt, de a
felületek fele mégsem fordult át — mert `bg-white`-ot használtak, ami a
Tailwind BEÉPÍTETT fehérje, nem a mi tokenünk. Migrálva:

| Mit | Mennyi |
|---|---|
| `bg-white` → `bg-surface-card` | 539 hely, 173 fájlban |
| `bg-[rgba(250,249,246,0.95)]` (fejléc) → `--color-surface-header` | 6 hely, 4 fájlban |
| self hero-gradiens → saját `layer-self-hero-*` tokenek | 2 hely |

Az **áttetsző** fehérek (`bg-white/15`, `bg-white/[0.06]` — 109 hely) és a
színezetek (`bg-[rgba(26,92,58,0.08)]` — 10 hely) **szándékosan maradtak**:
azok fátylak sötét herón, nem felületek. A `check-colors` (e) ellenőrzése
ugyanezt a határt húzza meg — az átlátszatlan felület hiba, az áttetsző réteg
nem.

A self hero azért kapott saját tokeneket, mert eddig az akcent-tokenekből
kölcsönzött (`accent-self-strong/deep/deeper`), amiket sötéten világosra
kellett vinni — ettől a sötét hero világos zöld lett fehér szöveggel. A többi
réteg (team/org/candidate) már eleve saját hero-tokent használt.

**Bizonyítás.** A világos mód a teljes migráció után is **pixelre azonos**: a
futó appon (`/try`, `/`, `/pricing`) teljes lapos képernyőkép a migráció előtt
és után — 0 eltérő pixel mindhárom oldalon, 7,1 millióból. A hatókör
ellenőrizve: sötét sütivel a landing `body`-ja `rgb(247,244,239)` és nincs
rajta `.theme-scope`; a `/try` `.theme-scope`-ja `rgb(20,20,24)`.

---

## 11. Belépett felületek — valódi appon ellenőrizve (2026-08-07, 3. kör)

Az előző kör csak a `/try`-t látta futni (az az egyetlen auth nélkül elérhető
app-oldal). Ehhez a körhöz felhúztunk egy helyi PostgreSQL-t, feltoltuk a
sémát, seedeltünk egy org + csapat + 6 profilt, és a repóban meglévő e2e
auth-bypasst (`TRITA_E2E_AUTH_BYPASS=1`) használva **végignéztük a
`/dashboard`, `/profile/results`, `/team/[id]` és `/org/[id]` felületeket
mindkét témában**.

### 11.1 Amit talált

A hatókör és a token-réteg helyesen működött, de előkerült a következő
réteg: **Tailwind ALAP-PALETTA osztályok** (`bg-amber-50`, `text-rose-700`,
`bg-slate-50`…), 488 előfordulás. Ezek a Tailwind saját palettájából jönnek,
nem a mi tokenjeinkből — tehát kimaradnak a témázásból.

**299-et migráltunk** — azokat, ahol a státusz-család egyértelmű:
`amber-*` → `state-warning-*`, `rose-*` → `state-error-*`,
`emerald-*` → `state-success-*`, `blue-*` → `state-info-*`.

**189 maradt**, és ez tudatos megállás: nekik nincs egyértelmű
token-megfelelőjük (pl. a hideg `slate-50` helyett melyik meleg
felület-token a helyes?), tehát szemantikai döntést igényelnek, és minden
csere **látható változás a világos témán is**. Költségkeret őrzi őket
(`check-colors` (f)): nem nőhetnek, a cél a csökkenés.

### 11.2 Egy korrekció a mérésről

A migrációt először „pixel-azonosnak" hittük, mert a token-hexek megegyeztek
a Tailwind v3-as hex-értékeivel. A pixel-teszt megfogta, hogy ez **nem
igaz**: a Tailwind v4 a palettáját **oklch**-ban tárolja, és a telített
színek renderelve eltérnek a v3 hexektől.

| | Tailwind v4 renderelve | Trita token |
|---|---|---|
| `amber-50` | `#fffbeb` | `#fffbeb` — azonos |
| `rose-700` | `#c70036` | `#be123c` |
| `emerald-700` | `#007a55` | `#047857` |

A migráció tehát **elmozdítja** ezeket a színeket a saját tokenjeink felé.
A mért hatás: a négy vizsgált oldalból hármon **0 eltérő pixel**, a
csapatoldalon **204 pixel** (egy státusz-badge), **max 9/255 csatorna-
eltéréssel** — érzékelhetetlen. Ez a `color-system-2026-08.md` kimondott
iránya (a Tailwind-defaultoktól a saját rendszer felé), de vizuális
változás, nem azonosság — ezért van itt leírva.

### 11.3 Ami továbbra is hátravan

| Tétel | Miért |
|---|---|
| **189 Tailwind-paletta osztály** | Szemantikai döntés kell darabonként; keret őrzi |
| **TS-oldali színek** (30 hely) | SVG-fill és inline style — a CSS-változó nem éri el |
| **Képi CI-baseline** | A `visual-regression` TODO nyitva, most már két témára |
| **Több app-felület** | A kampány-, jelölt- és riport-nézetek még nincsenek átnézve |

---

## 12. A Tailwind-paletta migráció lezárása (2026-08-07, 4. kör)

Döntés született: a maradék 189 osztály is a **saját tokenek felé** mozdul, a
világos téma kis elmozdulását vállalva. A migráció ezzel **lezárult** — a
`check-colors` (f) kerete **0**, új Tailwind-paletta osztály nem kerülhet be.

### 12.1 Hogyan készült a leképezés

Nem kézzel: **adatvezérelten**, hogy az elmozdulás bizonyíthatóan minimális
legyen.

1. A Tailwind v4 alap-palettája **oklch**-ban van a fordított CSS-ben — ezt
   sRGB-re konvertáltuk (ugyanúgy, ahogy a böngésző teszi).
2. Minden osztályhoz kijelöltük a **szemantikailag helyes token-családot**
   (amber→warning, rose/red/pink→error, emerald/green→success,
   sky/blue→info, slate/gray→meleg neutrális).
3. A családon belül a **perceptuálisan (OKLab) legközelebbi** tokent
   választottuk.

Eredmény: **78 különböző osztály, 189 előfordulás, 45 fájl**. Az elmozdulás
zöme ΔE < 6 (érzékelhetetlen–finom); a legkisebbek 0,0–1,0 (pl.
`bg-red-50` → `bg-state-error-soft` **azonos**).

### 12.2 Az egyetlen nagy váltás: indigo → zsálya

Az `indigo` család (42 előfordulás) volt a kivétel, ΔE 21–28 — ez valódi
hue-váltás (kék-ibolya → zöld). Indokolt: **az indigónak nincs Trita-
jelentése**. A kontextus-vizsgálat szerint admin-felületeken „kijelölt
állapot" és „elsődleges akció" szerepben állt (`AdminReminderSection`,
`AdminDraftReminderSection`, `Modal`, `NotificationPanel`, `TeamInsights`) —
vagyis pontosan azt csinálta, amire a platformnak már van színe: a zsálya.
A `bg-indigo-600` → `bg-sage` váltás a fehér feliratot is olvashatóan hagyja
(6,06:1).

Ugyanezen az alapon ment a `purple`/`violet` (4 előfordulás) is a
zsálya-családra.

### 12.3 Ellenőrzés

`type-check` + `lint` + `check:colors` tiszta, **565 unit + 120 client** zöld.
A `/admin`, `/team/[id]` felületek a futó appon (helyi PostgreSQL + e2e
auth-bypass) mindkét témában átnézve.

### 12.4 Ami a sötét módból még hátravan

| Tétel | Miért |
|---|---|
| **TS-oldali színek** (30 hely) | SVG-fill és inline style — a CSS-változó nem éri el |
| **Kampány-, jelölt-, riport-nézetek** | A seed nem fedte le őket; futó appon még nincsenek átnézve |
| **Képi CI-baseline** | A `visual-regression` TODO nyitva, most már két témára |
| **8 kontraszt- + 1 felület-adósság** (világos téma) | Nyilvántartva, racsnival védve; javításuk külön döntés |

---

## 13. TS-oldali színek és a képi háló (2026-08-07, 5. kör)

### 13.1 TS-oldali színek — a CSS-változó által nem elért réteg

A 30 előfordulás átvizsgálva; **két csoportra bomlik**.

**Témázható lett (DOM):**

| Hol | Mit |
|---|---|
| `DynamicsMap`, `TeamReportView` | `DYNAMICS_COLORS` → új `DYNAMICS_COLORS_CSS` (var-alapú) |
| `TypeGlyph` | `GLYPH_COLORS` → új `GLYPH_COLORS_CSS` (var-alapú) |
| `CelebrationBurst` | már eleve `var(--color-*)` volt — nem kellett hozzányúlni |

A literál térképek **megmaradtak**, mert az OG-kép (satori) és a PDF nem tud
CSS-változót feloldani. A kettő elcsúszása néma hiba lenne (a felület és az
exportált kép más színt mutatna ugyanarra a fogalomra), ezért új teszt köti
össze őket: `tests/unit/design/ts-color-maps.test.ts` feloldja a CSS-alakot a
világos értékkészleten, és a literálhoz méri.

**Szándékosan NEM témázható (a kódban indokolva):**

| Hol | Miért |
|---|---|
| `QrCodeBadge` | A QR mindig sötét modul / világos alap. Az invertált QR-t a szkennerek jelentős része nem olvassa — a sötét mód kedvéért nem kockáztatjuk a működését. A kód a saját világos lapján ül. |
| `ShareCardDownload` | Canvas → letölthető PNG, azaz **fix médium** (mint a PDF, az email, az OG). A megosztott kártya bárhol megjelenhet, ezért mindig a világos márkaképet viszi. |

### 13.2 Képi regressziós háló

Új: **token-galéria** (`/dev/tokens`, élesben `notFound()`) + Playwright
spec (`tests/e2e/visual/theme-gallery.spec.ts`), ami mindkét színsémán
fotózza.

**Miért nem valódi app-oldal a célpont.** A korábbi baseline-ok azért
avultak el, mert adatfüggő oldalakat fotóztak. A galérián nincs adat, dátum,
animáció és véletlen — ami eltér, az tényleg a design-rendszer változása.
Ez a design-rendszert őrzi, **nem az elrendezést**: a komponens-szintű
vizuális háló továbbra is nyitott tétel.

Két tervezési részlet, amit a mérés kényszerített ki:

- **A galéria inline stílust használ, nem Tailwind arbitrary osztályt.** A
  Tailwind statikusan pásztáz, tehát a `bg-[var(--color-${x})]` interpolált
  alakot nem látja. Az első változatban a minták csak azért voltak
  színesek, mert *más fájlok* használták ugyanazokat az osztályokat
  literálisan — ha egy token sehol máshol nem szerepel, a minta némán
  színtelen maradt volna. Pontosan ott, ahol a galéria dolga a hiány
  kimutatása.
- **Baseline nélkül a teszt kihagyja magát**, és a skip a teszt törzsén
  KÍVÜL van (különben a böngésző-indítás előbb elhasalna). Így hiányzó
  baseline nem buktat CI-t, és a háló attól a pillanattól őriz, hogy valaki
  commitolt egyet.

**Baseline létrehozása** — azon a platformon, amin a CI fut:

```
UPDATE_VISUAL_BASELINE=1 pnpm exec playwright test tests/e2e/visual --update-snapshots
```

Az env-kapcsoló azért kell, mert a Playwright külön worker-processzben
futtat, oda a `--update-snapshots` CLI-argumentum nem jut el.

> **Baseline ebben a körben NEM készült.** A konténerben chromium 1194 van, a
> projekt Playwrightja 1217-et vár, és a fejlesztői proxy nem engedi a
> böngészőt a 4100-as e2e portra. Más böngészőbuilddel készült baseline
> garantáltan hamis riasztást adna — ezért nem commitoltunk egyet sem. Az
> első CI-futásnak a fenti paranccsal kell létrehoznia.
>
> A `playwright.config.ts` kapott egy `PLAYWRIGHT_CHROMIUM_PATH` felülírást
> (a meglévő `PLAYWRIGHT_BASE_URL` mintájára) zárt környezetekhez; üresen
> hagyva a Playwright a saját letöltését használja — CI-ben ez a helyes.

---

## 14. UX-audit: a színséma-váltás második rétege (2026-08-07, 6. kör)

A visszajelzés az volt, hogy **„rengeteg helyen maradt világos vagy nem elég
kontrasztos nézet vagy elem — akár a footer színe is"**. Ehhez a körhöz nem
szemre néztük végig a felületet, hanem **mérőeszközt írtunk**: egy Playwright-
szkript végigjárja a route-okat, és MINDEN látható elemre kiszámolja

1. a saját hátterének világosságát (sötét sémán világos felület = hiba),
2. a szövege kontrasztját a *tényleges* háttéren (az áttetsző rétegeket
   komponálva, felfelé az első átlátszatlan ősig).

Ami gradiens/kép alatt ül, az külön kosárba megy — ott a számított érték
hamis lenne, azt kézzel kell nézni.

### 14.1 A négy hibaosztály, amit a mérés kihozott

**(1) A marketing-fa nem követte a színsémát.** Az 1. fázisban a
`.theme-scope` szándékosan csak az `(app)` shellre került. A felhasználó
viszont a fejlécben kapott egy választót — és a landing/árazás/blog attól
világos maradt. Ez a kapcsoló hazudott. A marketing layout is megkapta a
hatókört; a statikus prerendert nem töri (puszta osztály, nem olvas sütit).

> **A mérés:** marketing-fa sötéten **125 világos felület → 0**.

**(2) A Tailwind kigyomlálta a szerep-tokenek negyedét — csak világosban.**
Ez a kör legfontosabb felfedezése. A Tailwind v4 alapból **csak azokat** a
`@theme`-változókat írja ki, amelyekre generált utility hivatkozik. A sötét
blokkot viszont KÉZZEL írjuk, ott mind a 204 token szerepel. Következmény:
egy futásidőben összerakott `var(--color-…)` (inline stílus, SVG-attribútum,
template-literál gradiens) **világosban üresen jött vissza, sötéten működött**.

Böngészőben mérve: **204-ből 50 token** hiányzott a világos kimenetből — köztük
a teljes `--color-role-*` és `--color-founding-*` család. A token-galéria négy
réteg-heró gradienséből három emiatt volt színtelen; a fehér feliratuk krémen
ült (1,10:1).

A javítás egy szó: `@theme static inline`. A `static` mindet kiírja. Guard:
`check-colors` (g) — enélkül a (d) ellenőrzés (alias-teljesség) egy olyan
készlethez mér, ami valójában ki sem kerül.

**(3) Fordított akcent, rögzített felirat.** A rendszer akcentjei
MEGFORDULNAK a két sémán: a zsálya világosban sötét (`#3d6b5e`), sötéten
világos (`#7fbfa6`). A `bg-sage text-white` gomb ezért világosban 5,9:1,
sötéten **2,1:1**. Ugyanez a bronzzal, a jelölt-terrakottával és a
státusz-`fg` tokenekkel háttérként.

A megoldás nem új mechanizmus, hanem a MÁR MEGLÉVŐ „on-surface" tokenek
következetes használata — ezek szintén fordulnak, tehát a világos téma
**nem változik**:

| Háttér | Felirat | Világos | Sötét |
|---|---|---|---|
| `bg-sage` / `action-primary-bg` | `--color-action-primary-fg` | fehér | `#10241d` |
| `bg-bronze` / `accent-primary` | `--color-text-on-accent` | `#1a1a2e` | `#17171c` |
| `bg-accent-candidate` | `--color-text-on-candidate` (ÚJ) | fehér | `#2a1a12` |
| destruktív gomb | `--color-action-destructive-fg` | fehér | fehér |

A destruktív a kivétel: a mély piros mindkét sémán sötét marad, ott a fehér
helyes. Ezért kaptak a `bg-state-error-solid` gombok a szemantikailag pontos
`action-destructive-*` párost.

**80 `bg-sage`-gomb + 9 jelölt-gomb + 7 destruktív gomb + 5 bronz-CTA.**

**(4) Grafikai token szövegként.** A `--color-state-*-solid` a státusz
GRAFIKAI változata (pötty, donut, él) — küszöbe 3:1. Szövegként 4,5:1 kellene,
amit a success/warning/info nem hoz (3,77 / 3,19 / 3,68 fehér lapon). **44
előfordulás** ment át a `-fg` szerep-tokenre; guard: `check-colors` (e).

Ugyanez a bronz-eyebrow: 11 px-es nagybetűs szöveg brand-bronzzal krémen
**2,99:1**. A `SectionEyebrow` és 40 kézzel írt eyebrow a mélyebb
`--color-accent-primary-strong`-ra került (5,7:1). **Ez a világos témát is
javítja** — a hiba a sötét mód előtt is fennállt.

### 14.2 Két eset, ahol adat és nem token a szín

- **A 15 mintázat-akcent** (`pattern-data.ts`) `light-dark(világos, sötét)`
  párrá vált. Miért nem token: ez ADAT, nem szerep — 15 hue, amit egyetlen
  marketing-lap használ; tokenpárként 30 sorral hizlalná a globals.css-t.
  Miért `light-dark()`: az érték inline stílusként megy a DOM-ba, a függvény
  pedig a `color-scheme`-ből dolgozik, amit a `.theme-scope` már beállít. A
  sötét párokat kontrasztra hangoltuk (mind ≥ 4,6:1 a sötét paper-lapon),
  hue és telítettség marad.
- **A kiemelt blog-vizuál** (`BlogArtVisual`, `variant="featured"`)
  szándékosan sötét alap fehér idézettel — de `var(--color-sage-deep)`-ből
  épült, ami sötéten világos mentává fordul. A réteg-heró tokenekre került:
  azok mindkét sémán sötétek. Ugyanez a hiba a `/privacy` fejlécsávjában és
  a `/holland-kod` CTA-sávjában.

Ez a visszatérő minta érdemel egy nevet: **„szándékosan sötét panel, amit
témakövető tokenből építettek"**. A helyes forrás vagy a
`--color-surface-inverse`, vagy a `--color-layer-*-hero-*` — ezek sötéten is
sötétek maradnak. Ugyanez a hiba volt az árazás-, blog- és auth-oldal
`from-[var(--color-text-primary)]` gradiensében: SZÖVEG-tokenből épült
felület. Erre már statikus szabály is figyel (`check-colors` (e)) —
azért ez, mert a mérőeszköz sem látja: gradiens alatt nem tud kontrasztot
számolni, tehát ez az egy osztály csak kódból fogható meg.

### 14.3 Új felület-token

`--color-paper-elevated` (fehér / `#232019`): a mintázat-kártyák literál
`"white"` hátteret kaptak. A `paper-card` nem volt jó rá — az a chipek
tónusa; ez a lap FÖLÖTT ülő réteg.

### 14.4 Mérleg

21 route mérve mindkét sémán (marketing + app együtt):

| | előtte | utána |
|---|---|---|
| SÖTÉT — világos felület | 141 | **0** |
| SÖTÉT — kontraszt-bukás | 53 | **0** |
| VILÁGOS — kontraszt-bukás | 54 | 11 |
| `--color-*` token hiányzik a világos kimenetből | 50 / 204 | **0** |

A világosban maradt 11 tétel: **5** nagy bronz kiemelés (2,99:1 a 3:1-es
küszöb mellett — 0,3%), **5** `text-faint` a token-galérián (a racsniban
nyilvántartott adósság), és **1 mérési műtermék** (a kiemelt blog-idézet
fölött a vizuál TESTVÉR elem, nem ős, ezért a szkript a kártya fehérét látja
alatta). Egyik sem új, és egyik sem a sötét módból jön — mind a 14.5-ben
felsorolt, tudatos tétel.

A `--palette-muted` 2%-os sötétítése (`#6e6e80` → `#6a6a7b`) egy lépésben
20 találatot vitt AA fölé, és három tételt kivett a `KNOWN_DEBT` racsniból.
A `design-tokens-sync` teszt azonnal elkapta, hogy a TS-oldali literált is
frissíteni kell — pontosan ezért van.

A `check-colors` három új szabállyal bővült: (e)-be a
`text-state-*-solid` tiltás és a „szöveg-token háttérként" minta
(`bg-ink`, `from-[var(--color-text-primary)]`), plusz az új (g) a
`@theme static`-ra. A token-kontraszt háló megkapta az `on-accent` /
`on-candidate` / `on-inverse` párokat és a `paper-elevated` felületet.

### 14.5 Ami tudatosan MARADT

- **A nagy `em` kiemelések brand-bronzzal (2,99:1).** A küszöb ott 3:1
  (nagy szöveg), tehát 0,3%-kal marad alatta. A landing-főcím kiemelésének
  átszínezése brand-döntés, nem hozzáférhetőségi kényszer — külön kérdés.
- **A `text-faint` / `text-muted` meleg felületeken (4,0–4,3:1).** Ezek a
  `KNOWN_DEBT` racsniban vannak, a sötét mód előttről; a padlójuk alá nem
  mehetnek.
- **Képi CI-baseline.** Továbbra is a CI platformján kell legenerálni.

---

## 15. A réteg-herók (2026-08-07, 7. kör)

A kérdés az volt, hogy a herók színe nem vész-e a háttérbe, vagy nem
túl erős-e. A mérés mindkettőre választ adott — és kihozott egy olyan
hibát, amit a mérőeszköz addig NEM látott.

### 15.1 A hero sötéten nem létezett

A `SurfaceHero` a `LAYER_THEMES` LITERÁL hexeiből dolgozott, tehát a
gradiens mindkét sémán UGYANAZ volt. Világosban ez helyes: a sötét panel a
krém vászon fölött 7–8:1-gyel elválik. Sötéten viszont a lap saját
réteg-tónusa (`bg-surface-*-accent-soft`) épp a hero sötét végével esett
egybe:

| réteg | lap-tónus | hero `-to` | elválás |
|---|---|---|---|
| self | `#17302a` | `#1a2e28` | **1,02** |
| team | `#2e2029` | `#2f2035` | **1,02** |
| org | `#1a2634` | `#172737` | **1,01** |
| candidate | `#33231a` | `#47251a` | 1,11 |

1,0 azt jelenti: a panel alsó fele NEM LÉTEZETT. A hero felső sarka még
derengett, a többi beleolvadt a lapba.

Miért nem fogta meg a háló: a felület-elválás teszt küszöbe 1,05 volt (a
világos téma saját padlójából származtatva), és ezek a párok nem is
szerepeltek a listán. Új, szigorúbb ellenőrzés került be (`HERO_MIN = 1.35`,
külön teszt), mert egy teljes szélességű panel más ügy, mint egy chip.

### 15.2 A megoldás — a figura-háttér viszony megfordítása

Világosban a hero SÖTÉTEBB a lapnál. Sötéten fordítva kell: a hero a
kiemelt panel, a lap a háttér. Két mozdulat:

1. **A lap-tónus a vászonhoz simul** (1,06–1,09), nem a heróhoz. Saját
   token (`--color-layer-*-wash`), mert a `-soft` a chipek tintje — a kettő
   sötéten ellentétes irányba mozdul. Világos értékei változatlanok.
2. **A hero stopjai megemelve**: 2,30 / 1,85 / 1,45 a lap-tónushoz mérve.
   A hue és a telítettség marad, csak a világosság nő. Fehér felirat
   7,3–7,6:1.

Ehhez a `SurfaceHero` átállt a szerep-tokenekre (`layerHeroGradientCss`);
a literál `layerHeroGradient` marad a FIX médiumoknak (react-pdf borító).
A jelölt-hero stopjai saját palettát kaptak: eddig az akcentekből
kölcsönöztek, azok viszont sötéten VILÁGOSSÁ fordulnak — a hero világos
peach-gradiens lett volna fehér felirattal.

### 15.3 A halk fehér-létra — a „túl erős" ellentéte

A herókon egy egész létra élt: `text-white/[0.28]`, `/0.34`, `/0.35`,
`/0.4`, `/0.45`, `/0.5`, `/0.52`, `/0.65`, `/0.72`, `/0.75`. A
legvilágosabb stopon ezek **2,5–3,4:1**-et adtak — a másodlagos mondat
gyakorlatilag eltűnt, MINDKÉT sémán. (A gradiens miatt a mérőeszköz ezeket
külön kosárba tette, ezért nem szerepeltek a kontraszt-listán.)

A létra két fokra egyszerűsödött, tokenekkel:

- **`--color-text-on-inverse`** — cím, statisztika-szám (közel fehér).
- **`--color-text-on-inverse-muted`** (`#dad5ce`, fix mindkét sémán) —
  minden másodlagos sor, címke, chip-felirat. A legvilágosabb hero-stopon
  4,6–5,0:1.

74 hely (55 alfás + 19 átlátszatlan hero-tipó). A `SectionEyebrow`
`onDark` tónusa ugyanide került.

**A „túl erős" kérdésre a válasz: nem az.** A világos hero 6–8:1-gyel
válik el a lap tónusától — ez a szándékos, drámai brand-idióma, és a
felirat-kontraszt is rendben van rajta. Amit rontani lehetett rajta, az a
halk alszöveg volt; az most olvasható. A hero HÁTTÉRSZÍNE világosban
változatlan.

### 15.4 Mérleg

| | előtte | utána |
|---|---|---|
| hero `-to` elválása a laptól (sötét) | 1,01–1,11 | **1,45** |
| hero `-from` elválása a laptól (sötét) | 1,60–2,22 | **2,30** |
| hero másodlagos szöveg | 2,5–3,4:1 | **4,6–5,0:1** |
| világos hero háttér | — | változatlan |

---

## 16. A hatókör lezárása (2026-08-07, 8. kör)

A hatókör kétszer maradt hiányos, ugyanabból az okból: **a kimaradt fa
nem néz ki hibásan**. Világos marad, ami magában rendben van — csak épp
nem az, amit a látogató kért. Előbb a marketing-fa (6. kör), most a
belépő-fa.

Ami hiányzott:

- **`(auth)`** — `/sign-in`, `/sign-up`, SSO-callback, `/sign-out`. Ezek
  definíció szerint auth NÉLKÜLI lapok, és jellemzően a marketing-oldalról
  érkezik rájuk a látogató — aki ott már sötétre váltott.
- **`src/app/error.tsx`** — a gyökér-hibahatár. Egyetlen csoport-layout sem
  fut körülötte, csak a root, tehát a hatókört magának kell felvennie.

Az `(auth)` lapok osztályai már mind tokenizáltak voltak (`bg-cream`,
`bg-surface-card`, `border-sand`, `--color-border-default`) — csak a
hatókör hiányzott. A Google-logó hexei szándékosan literálok (harmadik fél
brandje, `check-colors` alól kivéve).

**Guard: `check-colors` (h)** — minden `src/app/(*)/layout.tsx`-nek
tartalmaznia kell a `theme-scope` wrappert. Egy új route-csoport így nem
tud némán kimaradni. (Regresszióval ellenőrizve: a wrapper eltávolítása
exit 1.)

**Mérés** — 12 publikus útvonalon (landing, árazás, blog, minták,
founding, kapcsolat, adatvédelem, holland-kód, pilot, sign-in, sign-up,
try): mindenhol megvan a hatókör, és sötéten `--color-surface-canvas` =
`#141418`, `--color-text-primary` = `#f3efe8`.

> **Amit NEM tudtam itt megnézni:** a Clerk-es űrlap maga. A konténerben
> nincs valódi Clerk-kulcs, ezért a `useSignIn` sosem tölt be, és a lap a
> Suspense-fallbackon marad. A hatókör és a tokenek bizonyítottan
> működnek, de a belépő-űrlap vizuális átnézése egy valódi previewn még
> hátravan.

---

## 17. Amit a mérőeszköz nem látott (2026-08-07, 9. kör)

Két konkrét bejelentés érkezett — „a főoldalon vannak hibák sötét módban" és
„az adatvédelem oldal szétcsúszik" —, és mindkettő olyasmit hozott fel, amit
az addigi mérés SZERKEZETILEG nem tudott megfogni.

### 17.1 A mérés vakfoltja: a hajtás alatti tartalom

A marketing-lapok `whileInView` revealeket használnak: a hajtás alatti
blokkok `opacity: 0`-val indulnak, és csak görgetésre jelennek meg. A
mérőszkript viszont kihagyja a `opacity === "0"` elemeket (helyesen — a
rejtett elem kontrasztja értelmetlen).

**Következmény: a landing/blog/founding fele SOSEM került mérésre.** Az
addigi „0 találat a marketingen" ezért túl szép volt. A szkript most
végiggörget a lapon, mielőtt mér. Ez azonnal kihozta az alábbiakat.

### 17.2 Hidratálási hiba MINDEN oldalon

A festés előtti script a `data-theme`-et a `<html>`-re teszi; a
szerver-HTML-ben viszont nincs ilyen attribútum (a gyökér-layout
szándékosan nem olvas sütit — az az egész marketing-fát dinamikussá
tenné). A React ezt attribútum-eltérésként jelentette, minden
oldalbetöltésnél:

```
<html lang="hu"
-     data-theme="dark"
```

Javítás: `suppressHydrationWarning` a `<html>`-en. Ez CSAK ennek az elemnek
a saját attribútumaira hat, a gyerekek hidratálását nem némítja el. (Ez a
`next-themes` és társai bevett megoldása is.)

### 17.3 Világító sáv a landing hero-kártyája alatt

`bg-gradient-to-b from-white to-[var(--color-surface-subtle)]` — a
gradiens-stop a Tailwind BEÉPÍTETT fehérje, nem a mi tokenünk. A
`check-colors` (e) tiltotta a `bg-white`-ot, de a `from/via/to-white`
alakot nem: a hero alatti elhalványuló CTA-sáv így vakítóan világos maradt
sötéten. 10 hely javítva, a szabály kiterjesztve.

### 17.4 Az adatvédelem-oldal 390px-en 586px széles volt

Nem szín, hanem elrendezés: a jogalap-táblázat `min-w-[520px]`-et kap
(szándékosan, saját vízszintes görgetővel), a rács-elem viszont
alapértelmezésben `min-width: auto` — vagyis a TARTALOM min-content
méretére feszül. A sáv így 520px alá nem mehetett, és mivel mobilon
egysávos a rács, a tartalomjegyzék is 562px széles lett.

Javítás: `min-w-0` a rács-elemeken (+ `minmax(0,1fr)` a kétsávos
elrendezésben). A táblázat saját görgetője csak akkor tud dolgozni, ha a
sáv szűkebb lehet nála. Mérve: 390/430/768/1280px-en a dokumentum
szélessége = a viewporté.

### 17.5 Regresszió a 6. körből: a MÉLY akcent

A bronz-sweep egy kalap alá vette az összes bronz hátteret. Pedig kétféle
van, és ez a különbség a színséma-váltás lényege:

| | világos | sötét | felirat |
|---|---|---|---|
| `bronze`, `accent-primary` | világos | világos | **fix sötét tinta** |
| `bronze-dark`, `accent-primary-strong` | SÖTÉT | VILÁGOS | **forduló** |

A fejléc „Try it →" gombja (`bg-bronze-dark`) így fix sötét tintát kapott,
és világosban **4,89 → 3,49:1**-re romlott — miközben a fölötte lévő
komment épp azt magyarázta, miért 4,89. Új token:
`--color-text-on-accent-deep` (fehér / `#17171c`), és három új pár a
kontraszt-hálóban, hogy ez ne fordulhasson elő újra.

### 17.6 Mellékesen: a blog-vizuál hidratálási hibája

A generatív SVG a szülőben létrehozott PRNG-t adta le propként, és a
motívum a SAJÁT renderjében fogyasztotta. A PRNG állapotot hordoz, tehát
egy különálló újrarender (dev StrictMode dupla render) elcsúsztatta a
sorozatot — a szerver és a kliens más geometriát rajzolt, és a React
hidratálási HIBÁVAL (nem figyelmeztetéssel) újraépítette a fát. Most a
motívum a magot kapja és maga hozza létre a generátort: minden render
ugyanonnan indul. A kirajzolt kép nem változik.

Ez nem a sötét módból jött — csak ugyanaz a konzol-ellenőrzés hozta ki.

### 17.7 A footer hullám-éle

`fill="var(--color-ink)"` — SZÖVEG-token egy nagy SVG-kitöltésen. Sötét
sémán az ink világos, tehát a footer fölötti hullám **krém sávként
világított** az oldal és a footer között. A törzs gradiense addigra már a
`--color-surface-inverse`-re volt átállítva, a hullám viszont nem: a két
felület elvált egymástól.

Most ugyanaz a token tölti ki, mint a gradiens `from-` stopját — a varrat
így nem tud elcsúszni. Világosban ez pixelre azonos a korábbival
(`surface-inverse` = `#1a1a2e` = a régi ink).

Ezt a `check-colors` (e) sem fogta meg: a szabályai osztály-neveket
néznek (`bg-ink`, `from-[var(--color-text-primary)]`), az SVG-attribútumot
nem. Kiterjesztve a `fill="var(--color-ink | --color-text-primary)"`
alakra is — az SVG-ben lévő SZÖVEG a finomabb `text-secondary` /
`ink-body` fokozatokat használja, azokat nem érinti.

---

## 18. A mérőeszköz vak volt az oklab-színekre (2026-08-07, 10. kör)

A bejelentés — „a hero alatti chipek és az egyén/csapat váltó szövegei nem
olvashatóak sötét módban" — olyan hibát írt le, amire a mérés **0 találatot**
adott. A tool hibázott, nem a szem.

### 18.1 A vakfolt

A szkript a `getComputedStyle(el).backgroundColor` sztringjét egy
`rgba?(…)` regexszel bontotta fel. A Tailwind v4 viszont az
opacity-modifikátoroknál **`oklab(0.99 … / 0.6)`** alakot ad vissza. A
regex ezt nem ismerte fel, `null`-t adott — és a mérés ilyenkor „nincs
háttér"-nek vette az elemet, és FELFELÉ lépett a szülőhöz.

Vagyis **minden `bg-white/60`-szerű felület átlátszó volt a háló számára**.
A landing hero-chipjei és a mód-váltó pontosan ilyenek.

Javítás: a színt a BÖNGÉSZŐVEL oldatjuk fel — 1×1-es canvasra festve,
`getImageData`-val visszaolvasva. Ez minden CSS-színformát sRGB-re hoz.
A hatás azonnal látszott: a marketing-fán a mért találatok száma
**18 → 135**-re nőtt (a többségük a gradiens-kosárba, kézi nézésre).

### 18.2 Amit ez kihozott

**A magas alfájú fehér FELÜLET, nem fátyol.** A `check-colors` szándékosan
engedi az áttetsző fehéret: a sötét herókon az 2–22%-os fátyol. A 40% fölötti
fehér viszont a lapon ülő kártya/pirula — sötéten majdnem fehér blokk lesz,
a rajta lévő (témakövető) szöveg pedig olvashatatlan.

16 hely: a landing hero-chipjei, az egyén/csapat váltó, a nav
user-blokkja, riport-chipek, onboarding-panelek. Mind
`bg-[var(--color-surface-card)]/N`-re. Világosban pixelre azonos
(`surface-card` = `#ffffff`). A szabály kiterjesztve: 40% fölött hiba.

**A footer halk létrája.** A `text-[var(--color-text-on-inverse)]/55`
oszlop-címkék (PRODUCT / ACCOUNT / LEGAL) 3,5:1-et adtak a footer alján —
ugyanaz a minta, mint a heróknál. A `-muted` tokenre kerültek (7 hely,
footer + az adatvédelem fejlécsávja).

### 18.3 Tanulság a hálóról

Két kör alatt kétszer derült ki, hogy a mérés **kevesebbet lát, mint amit
állít**: előbb a hajtás alatti (opacity:0) tartalom maradt ki, most az
oklab-színek. Mindkétszer a felhasználó szeme találta meg, amit a szám nem.

A „0 találat" ezért önmagában nem bizonyíték — csak akkor ér valamit, ha a
tool lefedettségét is ellenőrizzük. A konkrét ellenőrzés, ami ezt kihozta:
a javítás VISSZAVÉTELE és újramérés. Ha a szám nem mozdul, a háló nem lát.

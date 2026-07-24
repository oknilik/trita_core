# trita — Tipográfiai audit (2026-07-24)

Módszer: a teljes `src/` kódszintű felmérése (osztály-statisztika grep-pel), a `globals.css` típus-tokenek, a `layout.tsx` font-betöltés, a PDF (`components/pdf/styles.ts`) és az email réteg (`lib/email-layout.ts`) átnézése, összevetve a saját tervetekkel (`docs/development/ui-unification-plan.md`).

---

## Összkép

A betűtípus-alap erős és következetes: **Fraunces** (display/címek, variable, optical size + italic tengellyel) és **DM Sans** (folyószöveg) párosa a webes felületen és a PDF-ben is ugyanaz. A 2026-07-22-es UI-egységesítési tervben definiált **7 szerepes méret-skála tokenizálva van** a globals.css-ben — a gond nem a rendszer hiánya, hanem hogy **szinte senki nem használja**: a kódban három párhuzamos méret-nyelv él egymás mellett (token-skála ~51 használat, Tailwind alapértelmezett ~1 570, kézi `text-[Npx]` ~1 165). A kép tehát vizuálisan közel egységes (mert a kézi értékek jellemzően ugyanazokra a px-ekre lőnek), de rendszer-szinten törékeny: egy skála-hangolás ma a felület ~3%-át mozgatná.

---

## Ami egységes és jó

- **Fontpáros és betöltés:** `next/font`-tal, `display: swap`, variable tengelyekkel; a PDF ugyanazt a két családot regisztrálja ttf-ből. A logó (font-black Fraunces) és a hero-címek nyelve azonos a marketing- és app-oldalon.
- **Skála-tokenek léteznek** (display 34 · title 26 · heading 20 · body 15 · caption 13 · label 11 · micro 10), jó vonalközökkel, és van lint-szabály a 10px alatti méretre (a most beadott commitomat is elkapta — működik).
- **A 10px alatti kivételek dokumentáltak:** az AssessmentClient 5–7px-es szövegei dekoratív thumbnail-mockok, `aria-hidden` + indokolt `eslint-disable` párossal — rendben vannak.
- **Leading-fegyelem:** a folyószöveg túlnyomórészt `leading-relaxed` (249×), ez konzisztens olvasási ritmust ad.
- **Email:** rendszer-font stack (`-apple-system…Arial`) — email-kontextusban ez helyes döntés, nem hiba.

---

## Leletek (súlyosság szerint)

### 🔴 1. A `font-mono` valójában DM Sans — 242 használat félrevezető
`globals.css:14`: `--font-mono: var(--font-dm-sans);` — a teljes „mono dev-esztétika" (`font-mono text-[10px] uppercase tracking-widest` eyebrow-k, 41+32+14+13… előfordulás) **nem mono betűvel renderel**, hanem ugyanazzal a DM Sans-szal, csak az osztálynév állítja, hogy mono. Vagy tölts be valódi monót (pl. DM Mono, illik a családhoz) és akkor a „// szekció" esztétika tényleg megszólal, vagy vezesd ki a `font-mono` osztályt (SectionEyebrow `clean` variánsra cserélve) — a mostani állapot a leendő fejlesztőket is megtéveszti.

### 🔴 2. A PDF-ben nincs valódi félkövér: minden súly ugyanaz a Regular fájl
`src/components/pdf/styles.ts:8–19`: a Fraunces 400 ÉS 600, valamint a DM Sans 400, 500 ÉS 600 mind a `-Regular.ttf`-re mutat. A react-pdf nem szintetizál súlyt → a PDF-riportban a „semibold" címkék és kiemelések **vizuálisan nem különböznek** a törzsszövegtől; a hierarchia, amit a web mutat, a PDF-ben elvész. Töltsd le és regisztráld a Medium/SemiBold vágásokat.

### 🔴 3. Három párhuzamos méret-rendszer — a token-skála adopciója ~3%
Mért használat:

| Rendszer | Előfordulás |
|---|---|
| Token-skála (`text-micro/caption/label`) | 51 (micro 16 · caption 27 · label 8 · **body/heading/title/display: 0**) |
| Tailwind named (`text-xs…text-5xl`) | ~1 572 (xs 585 · sm 661 · 2xl 101 · xl 83…) |
| Kézi `text-[Npx]` | ~1 165 (10px 422 · 11px 267 · 13px 171 · 12px 128 · 15px 38 · 22px 32…) |

A négy leggyakoribb kézi érték (10/11/12/13px, együtt 988 db) egy az egyben megfeleltethető a micro/label/caption tokeneknek — ez codemod-dal gépiesen migrálható. A 22px (32×) és 15px (38×) a heading/body tokenek jelöltjei.

### 🟡 4. A de facto törzsméret (14px) nincs is a skálában
A leggyakoribb méret az egész projektben a `text-sm` = **14px** (661×), miközben a skála 13px-es captiont és 15px-es bodyt definiál — 14px-es szerep nincs. Vagyis a felület legnagyobb felülete a tokenrendszeren *kívül* él. Döntés kell: (a) a `text-sm` használatok idővel body(15)/caption(13) szerepekre válnak szét, vagy (b) a skála kap egy 14px-es szerepet. Enélkül a skála sosem lesz kanonikus.

### 🟡 5. Eyebrow/címke: 12+ tracking-variáns, a primitív megkerülve
389 kézi `uppercase + tracking` minta él a kódban, legalább 12 különböző ritkítással: `tracking-widest` 178 · `wide` 79 · `[2px]` 25 · `[0.18em]` 24 · `[0.12em]` 11 · `[1px]` 10 · `[0.16em]` 9 · `[0.2em]` 7 · `[0.14em]` 7… A `SectionEyebrow` primitív (mono/clean hangfekvéssel, egyetlen 0.14em trackinggel) készen áll, de a kézi minták zöme nem ezt használja. Ez a legnagyobb „ugyanaz a szerep, más a hangja" forrás a felületen.

### 🟡 6. Címsor-szerep keveredés: h1/h2 Fraunces nélkül, sőt token nélkül
Az admin szekciókban `<h2 className="text-xl font-semibold text-gray-900">` (AdminReminderSection, AdminDraftReminderSection), az org-kampány oldalon `<h2 className="text-sm font-semibold">` — se Fraunces, se heading-token, és a `text-gray-900` a szín-tokenrendszeren is kívül van. Összesen **201 `text-gray-*`/`bg-gray-*`** előfordulás él a token-paletta (ink/muted/sand) mellett — főleg admin felületeken. A címsor-elv („Fraunces = cím, DM Sans = szöveg") a fő útvonalakon tartott, az admin/belső oldalakon szétesik.

### 🟡 7. Marketing hero-címek: 8 különböző clamp() képlet
`clamp(28px,3.5vw,42px)` 4× mellett még 7 egyedi képlet (`2.1rem,4.5vw,3.4rem` · `3rem,8vw,5.2rem` · `30px,5vw,44px` · `2rem,4vw,3rem`…). Ugyanaz a „reszponzív display" szerep oldalanként kicsit másképp skálázódik. Egy-két közös clamp-token (`--text-display-fluid`, `--text-hero-fluid`) rendbe tenné.

### 🟢 8. Súly-használat: érthető mintázat, két kilógóval
Megoszlás: semibold 769 · medium 235 · bold 105 · normal 33 · black 11 · light 5. A terv Fraunces **500**-at ír a címekhez, a kódban viszont a marketing-címek `font-normal`(400)-t, az app-címek vegyesen 500/600-at használnak — apró, de látható különbség a két felület címei közt. A `font-black` a logóra koncentrálódik (rendben).

### 🟢 9. Kézi leading-értékek szórványa
A `leading-relaxed` dominancia mellett 8+ arbitrary érték (`[1.7]` 8× · `[1.8]` 4× · `[1.45]` 4× · `[1.02]`…) — a token-vonalközök (1.65/1.55/1.4) lefednék ezeket.

### 🟢 10. PDF: 6–7pt-os szövegek
`pdf/styles.ts`: az alap 9.5pt már a terv szerinti, de több stílus 7pt, egy 6pt — nyomtatva ez 8px-nél is kisebb, a webes 10px-es a11y-padló szellemével ellentétes. Javasolt padló a PDF-ben: 7.5–8pt.

---

## Javasolt sorrend (ha nekiálltok)

1. **PDF súly-fájlok regisztrálása** (#2) — fél óra, azonnal látható minőség-ugrás a riportban.
2. **font-mono döntés** (#1) — DM Mono betöltése *vagy* a mono-esztétika kivezetése; utána a 242 hely gépiesen cserélhető.
3. **Codemod a 10/11/12/13px → micro/label/caption migrációra** (#3) — 988 előfordulás, szabályos minta, alacsony kockázat; közben eyebrow-k SectionEyebrow-ra (#5).
4. **text-sm (14px) sorsának eldöntése** (#4) — enélkül a skála nem tud kanonikussá válni.
5. **Admin felületek: gray-* → token, címsorok Fraunces/heading** (#6).
6. **Clamp-tokenek a marketing display-hez** (#7), leading-tokenek (#9), PDF-padló (#10).

---

*Megjegyzés: a fenti számok a 2026-07-24-i állapotot mérik (`consulting_cleanup` branch, a mai 22 commit után). A saját 07-22-es auditotok 263× `text-[10px]`-et mért — ma 422 van, tehát a kézi méretek a terv ellenére tovább szaporodnak; az adopciót valószínűleg csak codemod + szigorúbb lint (meglévő fájlokra is) fordítja meg.*

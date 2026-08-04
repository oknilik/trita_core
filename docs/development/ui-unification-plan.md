# UI-egységesítési terv — 2026-07-22 audit

Vizuális változat (élő demókkal): claude.ai artifact „Trita UI-egységesítés".
Hatókör: web-nézetek, PDF-riport, emailek, formok, statikus + generált elemek.

## Állapotkép

Erős alap: Fraunces + DM Sans páros, meleg krém vászon, sage–bronz akcentus,
felület-témák (self=sage · team=terracotta · org=kék), tokenizált szín/motion/
radius/shadow/spacing skála, Modal/Toast/primitív réteg.

A hiányzó réteg a **fegyelem**: tipográfiai skála nincs tokenizálva, a
primitívek adopciója alacsony, a PDF és az email saját szín-másolatból él.

## Diagnózis (mért evidenciával)

| # | Probléma | Evidencia |
|---|---|---|
| 1 | Nincs betűméret-token; 8–40px kézzel szórva; 8–9px a11y-sértő | 263× `text-[10px]`, 259× `[11px]`, 160× `[13px]`, 126× `[9px]`, 21× `[8px]`; 20+ méret összesen |
| 2 | Eyebrow/címke 6+ tracking-variánssal + mono „//" vs. clean keveredés | 157× `tracking-widest`, 26× `[2px]`, 24× `[0.18em]`, 11× `[0.12em]`… |
| 3 | Primitívek nem terjedtek el | Button-import 16 fájl vs. 273 inline `<button>`; TextField 14 vs. 51 `<input>` |
| 4 | Hex/rgba szivárgás a tsx-ekben; hero-opacitás 20+ `white/[0.x]` variáns | 119 fájl nyers hexszel; `#8c4a31` 6×, rgba(26,26,46,…) 30+ |
| 5 | Radius-drift a `--ui-radius` skála mellett | 72× `rounded-[10px]`, 30× `[24px]`, 13× `[12px]`, 12× `[14px]` |
| 6 | Emoji a fő CTA-kon (📤 📄) vs. SVG ikonrendszer máshol | ProfileHero share/PDF gomb; 36× „✓" szövegként |
| 7 | PDF: 8pt alap (sűrű), saját hex-paletta duplikálva | `src/components/pdf/styles.ts` |
| 8 | Email: harmadik vizuális világ (gradient+hullám), inline hexek | `src/lib/emails.ts` buildEmailLayout |

## Javaslatok

### 1. Típus-skála token (a gerinc)

Hét szerep, CSS-tokenként a globals.css `@theme`-be, Tailwind utility-vel:

| Szerep | Méret | Betű | Megjegyzés |
|---|---|---|---|
| display | 34px / 1.1 | Fraunces 500, −0.01em | hero-címek (md: 40) |
| title | 26px / 1.18 | Fraunces 500 | oldal/riport-címek |
| heading | 20px / 1.25 | Fraunces 500 | szekció-címek |
| body | 15px / 1.65 | DM Sans 400 | folyószöveg |
| caption | 13px / 1.55 | DM Sans 400 | másodlagos szöveg |
| label | 11px / — | DM Sans 600, +0.14em, uppercase | eyebrow/badge — EGYETLEN tracking |
| micro | 10px / 1.4 | DM Sans 400 | metaadat; ez a legkisebb — 8/9px tilos |

Bevezetés: új kód csak skálát használ; meglévő fokozatosan (boy scout rule);
lint-szabály az arbitrary `text-[Npx]`-re új fájlban.

### 2. Eyebrow-primitív két hangfekvéssel

`SectionEyebrow` kiterjesztése: `tone="clean"` (ügyfél-felület, label-stílus)
és `tone="mono"` („// admin" — belső/admin felületek tudatos dev-esztétikája).
Minden kézi eyebrow erre cserélendő.

### 3. Web·PDF·email token-szinkron

Közös `src/lib/design-tokens.ts` (hex-értékek TS-ben) → a globals.css, a
pdf/styles.ts és az emails.ts EBBŐL fordul. PDF: 8pt→9.5pt alap; archetípus-
borítóoldal. Email: a sötét-sage hero-nyelv átvétele a gradient-fejléc helyén;
dimenzió-chipek az „eredmény kész" levélben.

### 4. Ikon-egységesítés

Emoji ki a CTA-kból (📤→share-ikon, 📄→doc-ikon); a szórt inline SVG-k közös
`Icon` komponensbe (20px viewBox, 1.8 stroke — a nav már ezt használja).

### 5. Élmény-réteg (elköteleződés + prémium pillanatok)

1. **Eredmény-reveal**: beadás után dimenzió-értékek count-up + stagger.
2. **Radar-rajz**: stroke-dashoffset draw-in (~2 s), reduced-motion tisztelettel.
3. **Observer-slotok**: „3 értékelő" absztrakció helyett 3 vizuális hely, ami
   telik — a hiányzó slot maga a CTA.
4. **Archetípus-kártya**: megosztható, gradiens személyiség-kártya a
   share-modalban (név + archetípus + top-dimenziók) — organikus terjedés.
5. **Haladás-gyűrű**: kitöltöttség gyűrűként (hero-aside, org-kitöltöttség).
6. **Publikálás-rituálé**: team-riport publikálásakor visszafogott sage–bronz
   szirom-animáció (egyszeri, 2 s).
7. `tabular-nums` minden szám-oszlopon (dashboardok, admin).

## Ütemterv

- **F1 — Alapozás** ✅ (2026-07-22): típus-tokenek + Eyebrow-variánsok +
  emoji→SVG a fő CTA-kon + 8/9px kivezetés (10px lint-padló).
- **F2 — Konszolidáció** ✅ (2026-07-22): design-tokens.ts EMAIL/PDF exportok
  + szinkron-teszt, sub-10px lint-error, primitív-adopció minta (inquiry
  felületek). Folyamatos rész: boy scout rule a többi felületen.
- **F3 — Élmény-réteg** ✅ (2026-07-22): CountUp + ProgressRing +
  CelebrationBurst primitívek; eredmény-reveal a DimensionStripben
  (stagger + sáv-felhúzás), observer-slotok az ObserverFlowStatusCardban
  (≤8 küszöbig), archetípus-kártya a ShareModalban, haladás-gyűrűk az org
  hero aside-ban, publikálás-rituálé a TeamReportEditorban. A radar-chart
  draw-in már korábban is élt (framer-motion scale+stagger) — változatlan.
  Mind reduced-motion-tisztelettel.
- **Follow-up kör** ✅ (2026-07-22): PDF base 8→9.5pt + archetípus-borítóoldal
  (sötét-sage SVG-gradiens hero, számozáson kívül); email-fejléc a sötét-sage
  hero-nyelven (fehér cím, bronz szeriff-logó); közös ikon-készlet
  (ui/icons.tsx — 20-as viewBox, 1.8 stroke) ProfileHero-adopcióval;
  tabular-nums a numerikus gócokon (AdminStatCard, DimensionStrip, org hero).
  Megjegyzés: a PDF belső 5–7pt explicit méretei külön, render-verifikált
  kört igényelnek; „eredmény kész" email nem létezik (chips-terv okafogyott).

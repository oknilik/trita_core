# Trita szín-rendszer — teljes audit és egységesítési terv (2026-08)

> Állapot: **VÉGREHAJTVA (2026-08-05, ld. 6. fejezet)** · Készült: 2026-08-05, a
> `tritanium-polish` branchen · Előzmények: `ui-token-map.md` (2026-04 token-audit),
> `ui-hex-replacement-policy.md` (top-30 hex→token csere), `design-tokens-sync.test.ts`
> (CSS↔TS szinkron-őr). Ez a doksi a **jelentés-alapú** egységesítést tervezi meg —
> a 2026-04-es csere **érték-alapú** volt (hex→token névvel, jelentés-vizsgálat
> nélkül), ennek mellékhatásait is itt takarítjuk fel.

---

## 0/a. Rétegek — a témázható alapréteg (2026-08-07 kiegészítés)

A szín-rendszer azóta **két rétegben** él a `globals.css`-ben. Ez nem
átszínezés volt: az értékek változatlanok, csak a hely változott, hogy a
paletta futásidőben felülírható legyen.

```
:root { --palette-*: #hex }     ← 1. NYERS réteg (sima :root, @theme-en KÍVÜL)
        ↓ var()                    Az ÉRTÉKEK forrásigazsága. Ez a felülírható.
@theme inline { --color-*: var(--palette-*) }   ← 2. SZEREP réteg
        ↓                                          Ez nevezi meg a jelentést.
.bg-sage { background-color: var(--palette-sage) }   ← generált utility
```

**Miért.** A Tailwind v4 az `@theme inline`-ban **literálként** megadott
értéket beégeti az utilitybe (`.bg-sage { background-color: #3d6b5e }`), és
onnantól futásidőben nem felülírható. A `var()` hivatkozást viszont
megtartja. A nyers értékek kiemelésével mind a ~5 900 szín-használat
témázhatóvá vált, komponens-módosítás nélkül.

**Szabály új token felvételekor.** A nyers hex a `--palette-*` blokkba megy,
a `@theme` tokenje pedig **csak hivatkozzon rá**. Ezt a
`scripts/check-colors.mjs` (c) ellenőrzése kényszeríti ki — literál hex a
`@theme`-ben hard fail. Szerep-tokent, ami másik szerep-tokenre mutat
(`--color-surface-canvas: var(--color-cream)`), változatlanul így kell írni.

Részletek és a sötét mód további lépései:
`docs/development/dark-mode-feasibility-2026-08.md`.

---

## 0. Vezetői összefoglaló

**Leltár-számok (2026-08-05):**

| Metrika | Érték |
|---|---|
| `--color-*` token a `globals.css`-ben | **132** |
| TS-oldali konstans (`design-tokens.ts`) | COLORS 20 · EMAIL_COLORS 12 · PDF_COLORS 16 · CSS_VARS 18 |
| Nyers hex a `src`-ben összesen (ts/tsx/css) | **477** |
| Nyers hex a token-fájlokon KÍVÜL | **341**, 68 fájlban |
| Tailwind default-paletta utility (`bg-amber-50` stb.) | **546** előfordulás, 81 fájlban |
| HEXACO dimenzió-színtérkép | **4 különböző paletta 7 fájlban** + PDF (nincs hue) + heatmap-legend (ötödik eltérés) |
| Csapatszerep-színtérkép | 1 db (9 hue, kevert token/hex, 3 státusz-színt „kölcsönöz") |
| Destruktív/piros család | **5 különböző vörös** (`#e11d48`, rose-600/700, `#c0392b`/`#a93226`, `#8c4a31`, `#EF4444`) |
| Zöld árnyalat (siker + brand + adat vegyesen) | 12+ |
| Arany/gold árnyalat | 4 közeli (`#d2a36a`, `#d8a253`, `#d4a15a`, `#d4a67a`) |

**Fő ütközések:** `#f59e0b` (amber) egyszerre 5 jelentés; `#10b981` (emerald) 6
jelentés; a jelölt-felületeken az **O (Nyitottság) dimenzió = hiba-piros
`#EF4444`**; a candidate réteg-akcent (`#8a4a32`) és a „brand-destruktív" gomb
(`#8c4a31`) **egy számjegyre** van egymástól ellentétes jelentéssel; az org-akcent
két értéken él (`#3f6d9a` token vs `#2f4863` hero).

**A javaslat 5 kulcs-döntése** (részletek a 2. fejezetben):

1. **Négy szín-osztály, szigorúan szétválasztva:** neutrális alap (cream/ink/sand) ·
   réteg-akcent (zsálya/szilva/éjkék/terrakotta — „hol vagyok") · adat-paletta
   (dimenziók + szerepek — „mit látok", értékítélet-mentes) · státusz + értékelő
   ramp („mi a rendszer/értékelés állapota"). Egy hue egy osztályban él.
2. **Egyetlen kanonikus HEXACO-paletta** (6 hue, base/strong/soft hármasokkal,
   világossági lépcsővel, CVD-tudatosan), minden médiumban azonos (web, team,
   PDF, OG) — a mai 4 térkép + PDF-hiány helyett. Warning-amber, success-emerald
   és hiba-piros **kizárva** a dimenzió-térből.
3. **Csapatszerep: 9 önálló hue helyett 3 család × árnyalat** (gondolkodó=indigó,
   cselekvő=okker, emberközpontú=moha) — a kódban már létező hármas kategorizálásra
   építve, mindig felirattal.
4. **Státusz-egykapu:** minden siker/hiba/figyelmeztetés/info a `state-*` tokeneken
   át; egyetlen destruktív vörös; a terrakotta felszabadul a candidate réteg
   kizárólagos használatára. Értékelő skálákon (tier, fit, confidence) **piros
   sosem** — helyette a zsálya→bronz→neutrális ramp.
5. **Source-of-truth és őrzés:** `globals.css` ↔ `design-tokens.ts` szinkron marad
   az igazság; új `src/lib/color-system.ts` exportálja a szemantikus térképeket
   (DIMENSION_COLORS, TEAM_ROLE_FAMILIES, LAYER_THEMES, EVAL_RAMP) web+PDF+OG
   számára; CI-guardrail tiltja a nyers hexet és a kivezetett hexek visszaszivárgását.

---

## 1. Jelenlegi állapot — leltár

### 1.1 Token-források

| Forrás | Tartalom | Megjegyzés |
|---|---|---|
| `src/app/globals.css:28-54` | Brand-paletta: sage (6), bronze (4), ink (5), surface (5) | Rendben; ez az identitás-mag |
| `src/app/globals.css:56-114` | Szemantikus réteg: surface/text/border/action/focus/state | Jó szerkezet; a `state-*` négyes (info/success/warning/error, bg+fg+border) definiált, de a komponensek zöme NEM ezt használja (ld. 1.6) |
| `src/app/globals.css:116-151` | „Hex replacement semantic aliases" — a 2026-04-es top-30 csere tokenjei | **Probléma-fészek:** érték-alapú nevek (`--color-visual-gradient-indigo`, `--color-state-success-strong` stb.), amiket azóta jelentés-idegen helyeken használnak (szerep-szín, dimenzió-szín, avatar) |
| `src/app/globals.css:227-241` | Numbered aliasok (sage-700/500/100, bronze-*, ink-*, cream-*) | Részben redundáns a névvel jelölt tokenekkel (pl. `--color-sage-700` = `--color-sage`) |
| `src/app/globals.css:243-251` | Founding-oldal saját palettája (`--color-founding-*`) | Duplikálva komponensben is (ld. 1.8 „paper" témák) |
| `src/lib/design-tokens.ts:11-39` | `COLORS` — a CSS-paletta TS-tükre | Szinkron-teszt őrzi (`tests/unit/design/design-tokens-sync.test.ts`) |
| `src/lib/design-tokens.ts:46-64` | `EMAIL_COLORS` | Rendben: brand-only, hexben fordul (email-kliens korlát) |
| `src/lib/design-tokens.ts:69-87` | `PDF_COLORS` | Rendben mint mechanizmus; tartalmilag hiányzik belőle a dimenzió-réteg |
| `src/app/globals.css:399` | `.ambient-glow` — `#6366f1, #8b5cf6, #d946ef` gradient | Marketing-dekoráció, a fuchsia (`#d946ef`) sehol máshol nem tokenizált |

### 1.2 HEXACO dimenzió-színek — **4 párhuzamos paletta + 2 további eltérés**

| # | Hely | INTE (H) | RESO (E) | TEMP (X) | ADAP (A) | THOR (C) | OPEN (O) | Hol jelenik meg |
|---|---|---|---|---|---|---|---|---|
| P1 | `src/lib/questions/tritan.ts:56,93,130,167,204,241` (kérdésbank-config) | `#818CF8` indigo-400 | `#FB7185` rose-400 | `#F59E0B` amber-500 | `#34D399` emerald-400 | `#A78BFA` violet-400 | `#38BDF8` sky-400 | Saját eredmények (`profile/results`), karrier-oldal, GrowthFocus, CareerGrowthPlan, **TeamHeatmap** (a manager-oldal a configból kapja) |
| P2 | `src/lib/team-stats.ts:18-23` + másolat `src/components/team/TeamReportView.tsx:29-35` + `TeamReportMemberView.tsx:23-29` | `#6366F1` indigo-500 | `#EC4899` pink-500 | `#F59E0B` | `#10B981` emerald-500 | `#8B5CF6` violet-500 | `#06B6D4` cyan-500 | Csapat-riportok, team-intelligence kimenetek |
| P3 | `src/app/(app)/hiring/[orgId]/candidates/[inviteId]/page.tsx:28-35` + másolat `src/app/(app)/org/[id]/campaigns/[campaignId]/page.tsx:52-57` | indigó (var) | **violet (var)** | **`#06B6D4` cián** | success-zöld (var) | **warning-amber (var)** | **`#EF4444` PIROS** | Jelölt-eredmény, kampány-riport |
| P4 | `src/app/(marketing)/blog/[slug]/page.tsx:91-98` (badge-trió bg/text/border) | sage-tokenek | `#5b21b6` violet | `#1d4ed8` **info-kék** | `#166534` zöld | bronz-tokenek | `#86198f` fuchsia | Blog-cikkek dimenzió-badge-ei |
| — | `src/components/pdf/components/PdfDimensionChart.tsx:16` | — | — | — | — | — | — | **A PDF-ben nincs dimenzió-hue**: tier-színezés (sage/bronz/ink300) + sage-mono radar |
| — | `src/components/manager/TeamHeatmap.tsx:176-179` legend | — | — | — | — | — | — | A legend `bg-indigo-100/300/500` — nem a tényleges cellaszínek |

**Következmények:**
- Ugyanaz a személy ugyanazon dimenziója **más színű** a saját eredményén (P1),
  a csapat-riportban (P2), jelöltként (P3) és a blogban (P4).
- P3-ban a hue-k **át vannak keverve** P2-höz képest: a violet ott RESO, P2-ben
  THOR; a cián ott TEMP, P2-ben OPEN. Aki mindkét felületet használja
  (tanácsadó!), annak a szín-emlékezete aktívan félrevezet.
- **Pszichológiai hiba:** P3-ban OPEN = `#EF4444` (hiba-piros) — a Nyitottság
  skála „riasztó színt" kap; ADAP = success-zöld, THOR = warning-amber. Egy
  jelölt-riportban ez implicit értékítélet a skálák között.

### 1.3 Réteg-akcentek (self / team / org / candidate)

| Réteg | Forrás | Értékek | Tokenizált? |
|---|---|---|---|
| self (zsálya) | `src/components/ui/patterns/SurfaceHero.tsx:14-20` | hero: `var(--color-accent-self-strong)`(#2a5244)→`sage-deep`→`#1a2e28`; akcent a herón: bronz | **Igen** (var-okkal) ✓ |
| team (szilva) | `SurfaceHero.tsx:21-26` | hero: `#66455d`→`#4a314a`→`#2f2035`; primary `#d48e62` barack; badge `#f3c39d` | **Nem** — nyers hex. A `--color-surface-team-accent` token (globals.css:64) ugyan `#d48e62`, de a hero nem használja |
| org (éjkék) | `SurfaceHero.tsx:27-32` | hero: `#2f4863`→`#22374d`→`#172737`; primary `#d2a36a` arany; badge `#f4c792` | **Nem** — ÉS ütközik: a `--color-surface-org-accent` token értéke `#3f6d9a` (globals.css:67) — **két org-akcent él párhuzamosan** |
| candidate (terrakotta, 2026-08-05) | `SurfaceHero.tsx:36-41` | hero: `#8a4a32`→`#6d3826`→`#47251a`; primary `#e0a878`; badge `#f6cfa8` | **Nem** — nyers hex |

További réteg-akcent szórványok (nyers hexben):
- `src/app/(app)/team/[id]/loading.tsx:13,28` — szilva skeleton (`#4a314a`, `#d48e62`)
- `src/app/(app)/org/[id]/loading.tsx:9,24` — éjkék skeleton (`#22374d`, `#d2a36a`)
- `src/app/(app)/team/[id]/page.tsx:403,409` — MetricTile akcentek: `#66455d`, `#a66a8c` (világos szilva — sehol máshol)
- `src/components/ui/primitives/SectionEyebrow.tsx:20,30` — candidate eyebrow `#e0a878` — **fehér alapon 2.09:1, AA-bukó**, ha valaha világos felületre kerül
- `src/app/(app)/hiring/[orgId]/_components/HiringDashboard.tsx:220,261,325` — a hiring-hero **sötétzöld** (`#234538`→`#172f28`) + **org-arany** `#d2a36a` akcent — se nem candidate-terrakotta, se nem org-éjkék: ötödik, ad-hoc identitás

### 1.4 Csapatszerep-színek (9 szerep)

`src/components/team/TeamRoleSection.tsx:24-34` — az egyetlen térkép:

| Kód | Szerep | Szín | Probléma |
|---|---|---|---|
| OG | Ötletgazda | `var(--color-visual-gradient-indigo)` = `#6366f1` | = radar-self + INTE(P2) + avatar |
| KE | Kapcsolatépítő | `#0ea5e9` sky | = TeamReportView „Kiegészítő" dinamika |
| KO | Koordinátor | `var(--color-state-success-strong)` = `#10b981` | **státusz-token szerep-színként** |
| HA | Hajtóerő | `var(--color-state-warning-strong)` = `#f59e0b` | **warning szerep-színként** + TEMP + friction |
| ER | Értékelő-elemző | `var(--color-visual-gradient-violet)` = `#8b5cf6` | = THOR(P2) + RESO(P3) + radar |
| CS | Csapatsegítő | `#ec4899` pink | = RESO(P2) |
| MV | Megvalósító | `#14b8a6` teal | fehéren 2.49:1 |
| MI | Minőségőr | `#f97316` orange | fehéren 2.80:1 |
| SZ | Szakértő | `#84cc16` lime | chip-szövegként a saját 9%-os tintjén **1.85:1** |

A chip-minta (`TeamRoleSection.tsx:56`): `${color}18` háttér + a szín maga
szövegként — a világos hue-knál (SZ, HA, MV, MI, KE) AA-bukó. Megjegyzés: a
szekció alján (`TeamRoleSection.tsx:346-358`) **már létezik a 3 kategóriás
csoportosítás** (gondolkodó/cselekvő/emberközpontú) — a 2. fejezet erre épít.

### 1.5 Értékelő skálák (tier / fit / verdict / confidence)

| Hely | Skála | Színek | Értékelés |
|---|---|---|---|
| `src/lib/dimension-utils.ts:20-51` (`tierColors`) | erősség / mérsékelt / figyelendő | sage / bronz / szürke+homok | **Jó minta** — nincs piros/zöld moralizálás; tokenizálandó |
| `src/components/pdf/components/PdfDimensionChart.tsx:16` | tier a PDF-ben | sage / bronz / ink300 | Konzisztens a fentivel ✓ |
| `src/components/results/career/CareerResults.tsx:67-70` | illeszkedés-pont | `#10B981` / sage / `#F59E0B` | Emerald+amber kilóg; az amber-szöveg fehéren 2.15:1 |
| `src/app/(app)/hiring/.../[inviteId]/page.tsx:410-414` | fit-címke | sage / `#92400e` / bronz | Harmadik változat ugyanarra a fogalomra |
| `src/lib/pattern-data.ts:313-316` + `PatternExplorer.tsx:159-233` | minta-verdict | `#2e6b50` zöld / `#b5651d` / `#6b6b6b` | Negyedik változat; `#2e6b50` a sage közeli-de-más rokona |
| `src/components/pdf/components/PdfComparison.tsx:21-25` | self-observer gap | **`#c0392b` tégla-PIROS** (large) / bronz / sageLight | **Pszichológiai hiba:** a nagy önkép-külsőkép eltérés (vakfolt) információ, nem hiba — a piros szégyen-jelzésként hat |

### 1.6 Státusz / szemantikus színek

A `state-*` tokenkészlet definiált (globals.css:96-114) és a primitívek
(`Button`, `StatusChip`, `InlineBanner`, `TextField`) helyesen ezt használják
(~49 előfordulás). **De** a komponens-állomány zöme Tailwind default-osztályokkal
dolgozik — 546 előfordulás, 81 fájl. Fő gócok:

| Hely | Mit csinál | Probléma |
|---|---|---|
| `src/components/ui/Toast.tsx:80-92` | success=`green-*`, error=`rose-*`, info=`indigo-*` | `green-*` ≠ a token-emerald; info-indigó ≠ token info-kék (`#1d4ed8`); harmadik zöld-család |
| `src/app/(app)/profile/page.tsx:425-449` | fiók-törlés zóna | Saját vörös-készlet: `#c0392b`, `#a93226`, `#e8cece`, `#f5dede`, `#fdf0f0` — ötödik piros-család |
| `src/components/ui/Modal.tsx:96,153,186,297` | destruktív megerősítés | Két ág: rose-* ÉS „brand" ág `#8c4a31` terrakotta — **a candidate réteg-akcenttől (`#8a4a32`) 1 számjegyre** |
| `src/components/dashboard/DashboardPrimitives.tsx:126` | `rose` chip-variáns | Valójában `#8c4a31` terrakottával renderel („error" jelentéssel) |
| `src/components/manager/CandidateRevokeButton.tsx:35,62`, `src/components/results/ShareModal.tsx:352` | visszavonás/törlés | Szintén `#8c4a31`-alapú destruktív |
| `src/components/team/TeamReportView.tsx:68-96` | dinamika-trió: aligned `#10B981` / complementary `#0EA5E9` / friction `#F59E0B` | Önmagában CVD-validált (komment szerint), de a hue-k a success/warning készlettel és a szerep-színekkel osztoznak |
| `src/components/team/DynamicsMap.tsx:12-13,220` | ugyanez a fogalomkör: complementary `#d3cfc6` **bézs**, friction `#f59e0b` | **Ugyanaz a jelentés két külön színnel** (complementary: sky vs bézs); `src/app/(app)/manager/page.tsx:337,343` a bézs-amber párost követi |
| `src/components/org/CampaignCard.tsx:188-195,256,288` | donut/step színek: `#059669`, `#d8a253`, `#06B6D4`, indigó, violet | Success-zöld és cián dekoratív szerepben; `#d8a253` a 4 arany egyike |
| `src/app/(app)/onboarding/OrgOnboardingWizard.tsx:376` | folyamat-chip | `#d4a15a`/`#8f602f` — még egy arany |
| `src/lib/ui/avatar.ts:3-25` | avatar-paletta | `state-success-strong` és `state-warning-strong` **identitás-színként** |

### 1.7 Vizualizációk (radar, heatmap, glyph)

| Hely | Színek | Értékelés |
|---|---|---|
| `src/components/dashboard/RadarChart.tsx:131-173,232,391-398` | self-polygon: indigó→violet→**`#D946EF` fuchsia** gradient; observer-polygon: success-zöld→`#14B8A6` teal; rács: `#C7D2FE`/`#DDD6FE`/`#EEF2FF` hűvös ködök; tengely-címke `#94A3B8` slate | A „kozmikus" gradient a brand meleg-nyugodt karakteréből kilóg; az observer-zöld a siker-szemantikát tölti rá a külső visszajelzésre; a slate-szürke idegen a meleg neutrálisoktól |
| `src/components/dashboard/RadarLegendNote.tsx:11-12` | self-pötty violet, observer-pötty success-zöld | A radar-színekhez kötve — együtt migrálandó |
| `src/components/manager/TeamHeatmap.tsx:96-101,138-141` | dim-hue alfa-rámpa cellák + **fehér betűs dim-badge** | Az alfa-rámpa (intenzitás=pontszám) jó, ítélet-mentes minta ✓; a fehér betű a P1-hue-kon 1.9–3.0:1 — **AA-bukó**; `#f9fafb`/`#f3f4f6` hideg szürkék a no-data cellán |
| `src/components/type/TypeGlyph.tsx` + `src/lib/type-glyph.ts:24-30` | teljes egészében brand-tokenekből (cream/bronz/ink/sage) | **Mintapélda** ✓ |
| `src/app/(app)/admin/_tabs/OverviewTab.tsx:320-321` + `AdminTrendChart.tsx` | trend-vonalak: `#217a55` + bronz; tengelyek token-értékű nyers hexek | `#217a55` a 12 zöld egyike — sage-re húzható |
| `src/components/assessment/EvaluatingScreen.tsx:156-160` | `#8b2f09` égetett narancs gradient | Egyszeri, bronz-családba vonható |

### 1.8 Oldal-lokális palettacsomagok, közeli-duplikátumok, egyebek

| Csoport | Helyek | Értékek | Javaslat-irány |
|---|---|---|---|
| „Paper" marketing-téma (3 példány) | globals.css:243-251 (founding), `PatternExplorer.tsx:16-25`, `CareerFakeDoor.tsx:46-62` | `#FAF7F2` / `#F3EDE4` / `#2C2420` / `#5C4F45` / `#1a1410` / `#E8E0D4` (±) | Egy közös `paper-*` sub-témába vonni |
| **Bug-gyanú** | `PatternExplorer.tsx:23` | `accent: var(--color-action-primary-bg)` (zsálya) mellett `accentHover: #a83508` (égetett narancs) | Hover ≠ az alapszín családja — javítandó |
| Minta-atlasz (16 szín) | `src/lib/pattern-data.ts:102-256` | Földszín-paletta mintánként (`#b5651d`, `#8b3a2a`, `#2e6b50`, `#3d4f6b`…) | Karakterében jó (nyugodt, földes); maradhat kurátori palettaként, de a verdict-triót az EVAL-rampra kell húzni és a sage-közeli zöldet egyesíteni |
| RIASEC (karrier) | `src/lib/riasec-content.ts:23-118` | Ugyanaz a 6 Tailwind-hue mint P2, **átkeverve** (R=violet, I=cián, A=pink, S=emerald, E=amber, C=indigó) | Nyitott döntés (4. fejezet, C) |
| Ink-közeli szürkék | `#5a5a6e` (3 OG-kép + `ShareCardDownload.tsx:91`), `#8a8a98` (`emails.ts:669,714-715`, `ShareCardDownload.tsx:105`), `#8a8a9a` (ink-300), `#6b6b6b` (pattern-neutral), `#6e6e80` (muted) | öt közeli szürke | Kettőre szűkíteni (ink-body, muted) |
| Zöld-görgeteg | sage `#3d6b5e` · `#2e6b50` · `#217a55` · `#234538` (hiring hero) · `#2a5244` · `#1a2e22` (`DashboardPrimitives.tsx:83`) · `#1a2e28` · `#8ad0b4` (ProgressRing default + org/manager progress) · `#dfeae5`/`#edf4ef`/`#eef6f2`/`#dfeee8` soft-tintek · success-zöldek | 12+ | Sage-skálára + state-success-re rendezni |
| Arany-négyes | `#d2a36a` (org-glow) · `#d8a253` (CampaignCard) · `#d4a15a` (OrgOnboardingWizard) · `#d4a67a` (PDF bronzeLight) | négy közeli arany | Egy org-glow token + PDF-only világosítás |
| Ikonok | `src/app/icon.tsx:18-45`, `apple-icon.tsx` | `#6B4A3F`→`#B5836A` barna gradient, `#B85A34` mag | Nem a token-palettából; ráadásul a `#B85A34` terrakotta-közeli (candidate-hue) — nyitott döntés (E) |
| OG-képek | `src/app/opengraph-image.tsx:25-82`, blog + share OG | Brand-hexek inline (`#f7f4ef`, `#c17f4a`, `#3d6b5e`, `#1a1a2e`) + `#5a5a6e` | `design-tokens.ts`-importra állítható (edge-runtime-ban is működik) |
| Google-logó | sign-in/up | `#4285F4` stb. | Harmadik fél brand-színe — **kivétel, marad** |
| InvitationsTab/ComparisonTab empty-state | `InvitationsTab.tsx:443-451`, `ComparisonTab.tsx:110` | `#7a6f63`, `#dcccb5`, `#7d5a40`, `#fff7ec` | bronz/homok tokenekre húzható |
| CelebrationBurst | `CelebrationBurst.tsx:10` | brand-színek nyers hexben | tokenre |

### 1.9 Kontraszt-mérések (WCAG, kiemelt bukók)

| Pár | Arány | Ítélet |
|---|---|---|
| fehér ↔ `#F59E0B` (heatmap TEMP-badge, P1/P2) | **2.15** | bukó (kis szöveg AA: 4.5) |
| fehér ↔ `#34D399` (ADAP-badge P1) | **1.92** | bukó |
| fehér ↔ `#38BDF8` / `#818CF8` / `#FB7185` / `#A78BFA` (P1) | 2.14 / 2.98 / 2.69 / 2.72 | bukó |
| fehér ↔ `#10B981` / `#06B6D4` (P2) | 2.54 / 2.43 | bukó |
| `#84cc16` SZ-chip a saját tintjén | **1.85** | bukó |
| `#c17f4a` bronz szövegként fehéren / krémen | 3.28 / 2.99 | csak nagy szövegre elég — bronz **szöveghez** mindig `bronze-700 #8a5530` (6.14) vagy `bronze-dark #9a6538` (4.89) |
| `#d48e62` team-akcent szövegként fehéren | 2.68 | bukó — világos felületen a szilva (`#66455d`) a team-szín |
| `#e0a878` candidate-eyebrow fehéren | 2.09 | bukó (sötét herón 4.48 ✓ — „on-dark only" szabály kell) |
| `#8ad0b4` progress fehéren | 1.79 | csak vastag, felirat-kísért grafikára engedhető |
| `#d8a253` / `#F59E0B` szövegként fehéren | 2.28 / 2.15 | bukó (CareerResults low-fit szöveg!) |
| `#6e6e80` muted fehéren / krémen | 4.99 / 4.55 | ✓ (a 2026-07 tipó-audit javítása jó) |
| org `#3f6d9a` fehéren | 5.43 | ✓ |

---

## 2. Javasolt egységes rendszer

### 2.0 Alapelvek (UX + pszichológiai indoklás)

1. **Egy szín = egy jelentés-osztály.** Négy osztály van; hue csak egy osztályhoz
   tartozhat. A jelentés-osztályok: **neutrális alap** · **réteg-akcent** ·
   **adat-identitás** · **státusz/értékelés**. Ahol két osztály ugyanazon a
   képernyőn él (pl. team-hero + heatmap), a forma is elválasztja őket: a
   réteg-akcent mindig „chrome"-on (hero, eyebrow, nav, gomb), az adat-szín
   mindig „mark"-on (sáv, cella, badge-kör) jelenik meg.
2. **A személyiség-pólusok nem jó/rossz.** A dimenzió-paletta identitást kódol,
   nem értéket: nincs piros, nincs success-zöld, nincs warning-amber a hat hue
   között. Az intenzitás (alfa-rámpa, sáv-hossz) kódolhat *nagyságot* — ez
   perceptuálisan magnitúdó, nem morális ítélet. Ahol a termék szándékosan
   értékel (illeszkedés, erősség-tier, adat-megbízhatóság), ott az **értékelő
   ramp** beszél: zsálya→bronz→neutrális — „hangosabb→halkabb", sosem
   „jó→rossz-piros".
3. **Alacsony arousal-alap, riasztás csak valódi hibára.** A felület 90%-a a
   meleg neutrálisokból él (cream/ink/sand); a telített színek kis felületű
   akcentek. Piros kizárólag: hiba-állapot, destruktív művelet megerősítése.
   A „kozmikus" fuchsia-gradientek és a hideg slate-szürkék kivezetése a
   nyugalom-érzet része.
4. **AA-kontraszt párban gondolkodva.** Minden adat-hue három formában létezik:
   `base` (mark: min. 3:1 fehér kártyán), `strong` (szöveg/ikon: min. 4.5:1
   fehéren ÉS krémen ÉS a saját `soft`-ján), `soft` (háttér-tint). Fehér betűs
   kitöltött badge csak `strong`-on ülhet.
5. **Színvak-biztonság = hue + világosság együtt.** A hat dimenzió L*
   világossági lépcsőn ül (41→62), a kilenc szerep három hue-családra és
   családon belüli árnyalat-lépcsőre egyszerűsödik; szín önmagában sosem
   egyetlen jelentéshordozó (betű-badge, felirat, ikon mindig kíséri — ez ma
   is így van, szabályként rögzítjük).
6. **Minden szín tokenből.** Nyers hex csak a token-definíciós fájlokban
   (`globals.css`, `design-tokens.ts`, `color-system.ts`); mindenhol máshol
   `var(--color-…)`, token-utility vagy TS-konstans. A meglévő
   `ui-hex-replacement-policy.md` szabálya CI-őrt kap.

### 2.1 Szemantikus térkép (áttekintés)

```
NEUTRÁLIS ALAP        cream · sand · warm-* · ink-skála · fehér
  └─ minden felület, tipográfia, keret

RÉTEG-AKCENT („hol vagyok")            ADAT-IDENTITÁS („mit látok")
  self      zsálya  #3d6b5e              H  indigó   #4f5aa8
  team      szilva  #66455d              E  mályva   #b4688a
  org       éjkék   #2f4863              X  okker    #c08d2e
  candidate terrakotta #8a4a32           A  moha     #78924f
  (+ bronz mint globális brand-akcent)   C  petrol   #3d7f95
                                         O  viola    #7b5fae
                                         szerep-családok: indigó/okker/moha
                                         minta-atlasz: pattern-data földszínek

STÁTUSZ (rendszer-állapot)             ÉRTÉKELŐ RAMP (szándékos értékelés)
  success  #047857 / #ecfdf5             high    zsálya  (#3d6b5e / #e8f2f0)
  warning  #b45309 / #fffbeb             mid     bronz   (#8a5530 / #fdf5ee)
  error    #be123c / #fff1f2             neutral homok   (#6e6e80 / #f2ede6)
  info     #1d4ed8 / #eff6ff             (piros TILOS ezen a skálán)
  destruktív gomb #e11d48
```

Kereszt-szabályok:
- A zsálya kettős szerepe (brand-primary + self-réteg + eval-high) **szándékos
  és megtartott**: a termék alapállása az egyén erőforrás-oldali olvasata.
- Az emerald/amber/piros/info-kék hue-k **kizárólag** státuszként élhetnek.
- A terrakotta **kizárólag** candidate-rétegként él (destruktív-terrakotta
  kivezetve).
- A szilva/éjkék/terrakotta réteg-hue nem szerepelhet adat-palettában (a
  mályva-E és a szilva-team megkülönböztetése: E jóval világosabb, L*53 vs
  a team-akcent L*~34, és soha nem ugyanabban a szerepkörben jelenik meg).

### 2.2 Dimenzió-paletta (kanonikus, minden médiumra)

Kontraszt-értékek méréssel igazolva (ld. 1.9 metodika); L*-lépcső:
H 41 · O 46 · C 50 · E 53 · A 56 · X 62 — grayscale-ben és CVD-szimulációban is
lépcsőzik. Implementáláskor a dataviz-validátorral még finomhangolható
(±2 L* tolerancia), a horgony-hue-k rögzítettek.

| Dim | HEXACO | Hue (pszichológiai indoklás) | `base` (mark) | `strong` (szöveg; fehéren/krémen/softon) | `soft` (tint) |
|---|---|---|---|---|---|
| INTE | **H** Becsületesség-Alázat | indigó — mély, higgadt, megbízható | `#4f5aa8` | `#3e4785` (8.6 / 7.8 / 7.6) | `#eef0f8` |
| RESO | **E** Emocionalitás | mályva — meleg, lágy érzelmi rezonancia, nem riadó-rózsaszín | `#b4688a` | `#8e4263` (6.8 / 6.2 / 6.0) | `#f9eef3` |
| TEMP | **X** Extraverzió | okker/arany — napfény, kifelé forduló energia (≠ warning-amber: tompább, barnább, és sosem háromszög-ikonnal) | `#c08d2e` | `#8a6215` (5.5 / 5.0 / 4.8) | `#f8efdc` |
| ADAP | **A** Barátságosság | moha — természet, szelídség (≠ success-emerald: sárgászöld, deszaturált) | `#78924f` | `#556b35` (5.9 / 5.4 / 5.3) | `#eff3e4` |
| THOR | **C** Lelkiismeretesség | petrol — hűvös-stabil, strukturált | `#3d7f95` | `#2c5f72` (7.0 / 6.4 / 6.1) | `#e6f1f5` |
| OPEN | **O** Nyitottság | viola — képzelet, rendhagyó gondolkodás | `#7b5fae` | `#5f4693` (7.5 / 6.9 / 6.5) | `#f1ecf9` |

Használati szabályok:
- **Kitöltött badge fehér betűvel** (heatmap-fejléc H/E/X/A/C/O körök):
  `strong` kitöltés (fehér↔strong minden dimenzióra ≥ 5.4:1 ✓). A mai
  `base`-szintű kitöltés fehér betűvel tilos.
- **Heatmap-cellák**: a jelenlegi alfa-rámpa marad, az új `base`-ekkel; a
  cella-felirat marad ink-alapú (ma is az — ✓); a legend a valódi hue-kból
  generálódik (a `bg-indigo-*` sor törlendő); no-data cella: `warm-mid` +
  `sand` (meleg neutrális a mai `#f9fafb` helyett).
- **Sávok/vonalak** fehér kártyán: `base` (mind ≥3:1, X-okker 3.3, A-moha 3.6);
  krém-felületen sáv mindig fehér/`soft` tracken fut.
- **Chipek** (blog-badge, GrowthFocus, CareerGrowthPlan): `strong` szöveg
  `soft` háttéren, `base` border (a mai `${color}18`-minta helyett).
- Az altruizmus-interstitial (`questions/tritan.ts:278`, ma ADAP-zöld
  duplikát): a moha `soft/strong` párost kapja, saját hue nélkül — közbülső
  skála, nem hetedik dimenzió.
- **RadarChart** (saját eredmény): polygon-gradient `H-base → O-base`
  (`#4f5aa8`→`#7b5fae`) — az identitás-tengely két „belső" színe; a fuchsia
  (`#D946EF`) kivezetve. **Observer-polygon: bronz `#c17f4a`** — a külső
  perspektíva a brand meleg akcentusát kapja, nem a siker-zöldet: a
  visszajelzés nem osztályzat. Rács/aura: `H-soft` és `warm` tintek a hideg
  `#EEF2FF`/slate helyett; tengely-felirat `muted`.
- **PDF**: a `PdfDimensionChart` sávjai és fejléc-akcentjei az új
  `strong`-okat kapják (print-en is ≥4.5 a fehéren); a radar maradhat
  sage-mono (nyugodt print-karakter) — a tier-jelölés (sage/bronz/ink300)
  változatlan.

### 2.3 Csapatszerep-színek: 3 család × árnyalat

A `TeamRoleSection.tsx:346-358` már ma is három kategóriába sorolja a 9
szerepet — a szín-rendszer ezt teszi láthatóvá 9 versengő hue helyett:

| Család | Szerepek | Hue (a dim-palettából örökölt horgony) | chip: szöveg/háttér | sáv-árnyalatok (családon belül) |
|---|---|---|---|---|
| Gondolkodó | OG · ER · SZ | indigó | `#3e4785` / `#eef0f8` | `#4f5aa8` · `#7580c4` · `#a3abdd` |
| Cselekvő | HA · MV · MI | okker | `#8a6215` / `#f8efdc` | `#8a6215` · `#c08d2e` · `#dcbd7a` |
| Emberközpontú | KE · KO · CS | moha | `#556b35` / `#eff3e4` | `#556b35` · `#78924f` · `#a9bd85` |

- A szerep-chip mindig feliratos (ma is), a szín csak a családot kódolja —
  9 megkülönböztethető hue helyett 3 hue × 3 világosság: CVD-biztos, és a
  csapat-nézet vizuális zaja drasztikusan csökken (nyugalom-elv).
- Indoklás a hue-öröklésre: szerep-vizualizáció és dimenzió-vizualizáció soha
  nem él ugyanazon az ábrán (külön tabok); a formanyelv is eltér (szerep=chip
  felirattal, dimenzió=betű-badge/sáv). Ha jövőbeli nézet mégis egymás mellé
  tenné őket, a szerep-oldal kötelezően chip+felirat marad.
- A becsült vs mért forrás-badge (kérdőíves/HEXACO-becslés) **neutrális marad**
  (ink/homok) — a forrás-jelölés nem kaphat minőség-színt, csak a confidence
  (eval-ramp).

### 2.4 Réteg-akcent tokenek

Új token-blokk a `globals.css`-be + `LAYER_THEMES` a `color-system.ts`-be
(a SurfaceHero, loading-skeletonök, SectionEyebrow, MetricTile-akcentek innen):

```
--color-layer-self-accent:      #3d6b5e   (= sage; light-felületi akcent)
--color-layer-self-hero-from:   #2a5244   -mid: #1e3d34   -to: #1a2e28
--color-layer-self-glow:        #c17f4a   (akcent a sötét herón — bronz)
--color-layer-self-soft:        #e8f2f0

--color-layer-team-accent:      #66455d   (light-felületi akcent/szöveg, fehéren ~9:1)
--color-layer-team-bright:      #a66a8c   (mark világos felületen)
--color-layer-team-hero-from:   #66455d   -mid: #4a314a   -to: #2f2035
--color-layer-team-glow:        #d48e62   (CSAK sötét herón — fehéren 2.68, tiltva szövegként)
--color-layer-team-badge:       #f3c39d   (sötét herón 7.2:1 ✓)
--color-layer-team-soft:        #f6e8dc

--color-layer-org-accent:       #2f4863   (kanonikus org-szín; a #3f6d9a → -bright)
--color-layer-org-bright:       #3f6d9a   (fehéren 5.4:1 — light-felületi szöveg/mark)
--color-layer-org-hero-from:    #2f4863   -mid: #22374d   -to: #172737
--color-layer-org-glow:         #d2a36a   (sötét herón 5.3:1 ✓; a #d8a253/#d4a15a beolvad)
--color-layer-org-badge:        #f4c792
--color-layer-org-soft:         #e8eff7   -border: #bfd0e2

--color-layer-candidate-accent: #8a4a32   (light-felületi szöveg/akcent)
--color-layer-candidate-hero-from: #8a4a32  -mid: #6d3826  -to: #47251a
--color-layer-candidate-glow:   #e0a878   (CSAK sötét herón — fehéren 2.09)
--color-layer-candidate-badge:  #f6cfa8
--color-layer-candidate-soft:   #f7e9df   (új)
```

- A `--color-surface-team/org-accent*` régi tokenek átirányítva az új nevekre
  (alias-átmenet, majd kivezetés).
- SectionEyebrow-szabály: világos felületen a réteg `accent` (sötét) változata,
  sötét herón a `glow`/`badge` változat — a mai candidate-eyebrow (`#e0a878`)
  világos-felületi használata tilos.

### 2.5 Státusz + értékelő ramp

Státusz (a meglévő `state-*` tokenek maradnak az igazság, kiegészítéssel):

| Státusz | fg (szöveg) | bg | border | solid (grafikai, ≥3:1) |
|---|---|---|---|---|
| success | `#047857` (5.5) | `#ecfdf5` | `#a7f3d0` | `#059669` |
| warning | `#b45309` (5.0) | `#fffbeb` | `#fde68a` | `#d97706` — **a `#f59e0b` „warning-strong" kivezetve** (szövegként 2.15, adat-színként foglalt volt) |
| error | `#be123c` (6.3) | `#fff1f2` | `#fecdd3` | `#e11d48` |
| info | `#1d4ed8` (6.7) | `#eff6ff` | `#bfdbfe` | `#3b82f6` |
| destruktív gomb | fehér `#e11d48`-on (4.7 ✓), hover `#be123c` | | | |

- **Egyetlen destruktív vörös**: a Modal „brand"-ág (`#8c4a31`), a profil
  törlés-zóna (`#c0392b`/`#a93226`), a CandidateRevokeButton és a
  DashboardPrimitives „rose"-chip mind a `state-error`/`action-destructive`
  tokenekre áll. Pszichológiai megjegyzés: a destruktív-megerősítés jogosan
  riaszt (valódi, visszafordíthatatlan művelet) — itt a piros helyes.
- Toast: `green-*`→`state-success-*`, `rose-*`→`state-error-*`,
  `indigo-*`→`state-info-*`.
- Dinamika-trió (aligned/complementary/friction): **kivételként dokumentált**
  státusz-jellegű kódolás — `state-success-solid` / `state-info-solid` /
  `state-warning-solid`, mindig felirattal és a meglévő „nem jelent tényleges
  konfliktust" magyarázattal. A `DynamicsMap` bézs-complementary (`#d3cfc6`)
  megszűnik — egy fogalom, egy szín.

Értékelő ramp (tokenizálva; tier, fit, verdict, confidence, adat-minőség):

```
--color-eval-high-fg:  #1e3d34   -accent: #3d6b5e   -bg: #e8f2f0   (zsálya)
--color-eval-mid-fg:   #8a5530   -accent: #c17f4a   -bg: #fdf5ee   (bronz)
--color-eval-low-fg:   #6e6e80   -accent: #8a8a9a   -bg: #f2ede6   (neutrális)
```

- A `tierColors` (dimension-utils) értékei gyakorlatilag már ezek — tokenre
  húzás. CareerResults (`#10B981`/`#F59E0B`) és a hiring-fit (`#92400e`)
  erre áll át; a pattern-verdict zöldje (`#2e6b50`) a zsálya-családba olvad.
- PdfComparison gap-színezés: piros helyett **bronz-magnitúdó-rámpa**
  (`sageLight → bronze → bronze-700`) — a nagy gap „figyelemre érdemes
  vakfolt", nem hiba.
- Pszichológiai indoklás: a ramp „hangerőt" kódol (kirajzolódó → halkabb),
  nem érdemet; a neutrális fokozat nem „hiány-szürke" hanem a homok-család
  meleg neutrálisa.

### 2.6 Egyéb rendezések

| Terület | Javaslat |
|---|---|
| `--color-visual-gradient-*`, `--color-visual-cyan*` | Kivezetés. Radar → dim-tokenek; avatar → új `AVATAR_COLORS` a hat dim-`base`-ből (determinisztikus, nyugodt, státusz-mentes); CampaignCard step-színek → org-réteg + eval/neutrális készlet; `ambient-glow` fuchsia → bronz-sage duóra szelídítve vagy törlés (marketing-döntés) |
| Ink-szürkék | `#5a5a6e` → `ink-body`; `#8a8a98` → `ink-300`; `#6b6b6b` → `muted`. OG-képek és `ShareCardDownload` a `design-tokens.ts`-ből importál |
| Zöldek | `#217a55`, `#2e6b50` → sage/sage-700; `#234538`-hiring-hero → nyitott döntés (D); `#8ad0b4` → új `--color-sage-300: #8ad0b4` néven tokenizálva, „csak vastag grafikai elem, felirattal" megkötéssel; `#1a2e22` → `sage-deep` |
| Paper-téma | `--color-paper-{bg,card,text,muted,heading,border}` közös blokk; a `founding-*` tokenek átnevezve, `PatternExplorer` és `CareerFakeDoor` lokál-palettái törölve; `PatternExplorer.tsx:23` accentHover-bug javítva (sage-dark) |
| Emailek | Változatlan brand-only paletta (helyes!); az `emails.ts` szórvány-hexei (`#8a8a98`, fehér) az `EMAIL_COLORS`-ba |
| Számozott aliasok | `sage-700`≡`sage`, `cream-100`≡`cream` stb. duplikátumok összevonása egy irányba (a nevesített token marad) |

---

## 3. Migrációs terv

A sorrend úgy épül, hogy minden fázis önállóan zöld (type-check + unit + client),
és a vizuális kockázat izolált. **Időzítési megkötés: a 0–1. fázis additív
(ütközésmentes), a 2–7. fázis csak a most futó három komponens-ág merge-e UTÁN
induljon** — a SurfaceHero/eyebrow/team-komponens fájlokat ők is fogják.

| Fázis | Mit | Fájlok | Kockázat / ellenőrzés |
|---|---|---|---|
| **0. Őrzés** | `scripts/check-colors.mjs` (a `ui-surface-guardrail.mjs` mintájára): (a) nyers hex tiltása `src/components`+`src/app` scope-ban (kivétel: token-fájlok, Google-logó blokk), (b) kivezetett hexek tiltólistája (`#f59e0b`, `#10b981`, `#6366f1`, `#8b5cf6`, `#ec4899`, `#06b6d4`, `#818cf8`, `#ef4444`, `#d946ef`, `#8c4a31`, `#c0392b`…), (c) Tailwind default-paletta osztályok figyelése új kódban. Először warn-only, a 3. fázis után hard-fail | új script + CI-hook | Nincs runtime-hatás |
| **1. Token-réteg (additív)** | `globals.css`: `layer-*`, `dim-*` (6×3), `role-family-*`, `eval-*`, `paper-*`, státusz-`solid` tokenek; `design-tokens.ts`: tükör-konstansok; új `src/lib/color-system.ts` (DIMENSION_COLORS: base/strong/soft kód szerint, TEAM_ROLE_FAMILIES, LAYER_THEMES, EVAL_RAMP, AVATAR_COLORS); `design-tokens-sync.test.ts` bővítése az új párokkal | globals.css, design-tokens.ts, +1 új lib, +teszt | Csak bővítés; a sync-teszt fogja az elgépelést |
| **2. Dimenzió-egykapu** | A 4 paletta + legend a `color-system.ts`-re áll: `questions/tritan.ts` (config.color — ellenőrizve: a szín kódoldali, DB-be nem íródik), `team-stats.ts:18-23`, `TeamReportView.tsx:29-35`, `TeamReportMemberView.tsx:23-29`, `campaigns/[campaignId]/page.tsx:52-57`, `candidates/[inviteId]/page.tsx:28-35`, `blog/[slug]/page.tsx:91-98`, `TeamHeatmap.tsx` (badge→strong, legend-generálás, no-data→warm), `GrowthFocus`/`CareerGrowthPlan`/`ProfileTabs` chip-mintája (strong-on-soft) | 10 fájl | **A legnagyobb vizuális változás.** Kézi átnézés: saját eredmény, team-profil tab, heatmap, kampány-riport, jelölt-riport, blog. A jelölt-oldali OPEN-piros eltűnése kommunikálandó a tanácsadói körnek |
| **3. Státusz-söprés** | Toast, Modal (brand-ág), profile törlés-zóna, DashboardPrimitives `rose`, CandidateRevokeButton, ShareModal, dinamika-trió (TeamReportView + DynamicsMap + manager/page egységesítés), CareerResults/hiring-fit → eval-ramp, admin-szekciók rose/amber/emerald osztályai → state-tokenek | ~15 fájl | Alacsony; state-tokenek már léteznek. Playwright-smoke a destruktív flow-kra (org-törlés, revoke) |
| **4. Réteg-akcentek** | SurfaceHero → LAYER_THEMES; team/org loading-skeletonök; SectionEyebrow candidate-szabály; team/org/manager MetricTile-akcentek; org-akcent kettősség feloldása (`#3f6d9a`→`-bright`); OrgOnboardingWizard/CampaignCard aranyai → org-glow | ~10 fájl | Közepes; erős átfedés a párhuzamos ügynökök munkájával — **utolsóként rebase-elni** |
| **5. Vizualizációk** | RadarChart (self H→O gradient, observer→bronz, rács-melegítés) + RadarLegendNote; avatar.ts; CelebrationBurst tokenre; AdminTrendChart/OverviewTab zöldje→sage; EvaluatingScreen; TypeGlyph (nincs teendő ✓) | 7 fájl | Radar: az observer-szín jelentés-váltása (zöld→bronz) — release-note a comparison-nézethez |
| **6. PDF + email + OG** | `PDF_COLORS` bővítés (dim-strong hármasok, eval-ramp), `PdfComparison` piros→bronz-rámpa, `CoverPage` hexek→tokenek, `PdfDimensionChart` sávak; `EMAIL_COLORS`-ba a szórvány-hexek; 3 OG-kép + ikonok → `design-tokens.ts` import | ~9 fájl | **Külön figyelem:** react-pdf Node-ban renderel (CSS-var NEM megy — csak TS-konstans); email inline-hex marad (kliens-korlát); OG edge-runtime: a `design-tokens.ts` import működik, de a bundle-méretre figyelni. PDF-et kézzel generálni HU+EN nyelven, email-sablonokat Resend-previewben átnézni |
| **7. Takarítás** | Near-dupe hexek cseréje (1.8 táblázat), paper-téma összevonás, PatternExplorer hover-bug, InvitationsTab/ComparisonTab, `visual-*` és régi `surface-team/org-accent*` tokenek törlése, numbered-alias dedup, `ui-hex-replacement-policy.md` és `ui-token-map.md` frissítése erre a doksira mutatva; guardrail hard-fail | sok apró | Grep-alapú; a 0. fázis scriptje méri a maradékot (cél: 0 nyers hex a UI-scope-ban) |

**Általános kockázatok:**
- Nincs screenshot-regressziós infra — a 2., 4., 5. fázis után kézi vizuális
  átnézés kell (érintett útvonalak listája fázisonként fent).
- DB-t a migráció nem érint (szín sehol nem perzisztált — a score-JSON-ok
  kód nélküliek, a szín render-időben csatolódik); ezt a 2. fázis elején
  greppel újra igazolni.
- A dimenzió-hue-váltás a visszatérő felhasználóknak észrevehető — a
  changelog-ba és (tanácsadói) release-jegyzetbe egy mondat: „a skálaszínek
  egységesek lettek minden nézetben".
- i18n: színhez kötött szöveg nincs, de a heatmap-legend és a módszertani
  jegyzetek szövegei érintettek lehetnek — HU+EN kulcsok együtt mozogjanak.

---

## 4. Nyitott döntések

| # | Kérdés | Opciók | Ajánlás |
|---|---|---|---|
| **A** | X-okker vs warning-amber közelsége (mindkettő sárgás) | (1) marad az okker + a `#f59e0b` teljes kivezetése adat-szerepből, a warning mindig ikon+felirat kíséretű; (2) X átcsúsztatása korall irányba (ütközne a candidate-terrakottával) | **(1)** — az okker tompább/barnább (`#c08d2e` vs `#f59e0b`), és a két szín soha nem áll azonos formanyelvben (mark vs banner) |
| **B** | Szerep-színek: 3 család (2.3) vs 9 feljavított egyedi hue | 9 hue AA-ra és CVD-re igazítva is zajos marad | **3 család** — a kódban már létező kategorizálásra épül |
| **C** | RIASEC-paletta (karrier-felület, jelenleg fakedoor mögött) | (1) elhalasztani a karrier-réteg élesítéséig; (2) a 6 dim-hue újrafelhasználása dokumentált, eltérő jelentéssel | **(1)** — parkolt felület; addig a `riasec-content.ts` színei nem szivárognak új nézetbe |
| **D** | Hiring-konzol (tanácsadói jelölt-lista) identitása | (1) candidate-terrakotta hero (a jelölt-domain egy színe); (2) marad a sötétzöld+arany, tokenizálva mint „consultant"-változat | **(1)** — a jelölt-domainnek egy hangja legyen a jelölt-nézettel; a tanácsadó-perspektívát a badge/eyebrow jelzi |
| **E** | Favicon/app-ikon barna-terrakotta palettája (`#6B4A3F`/`#B5836A`/`#B85A34`) | (1) bronz-családra igazítás; (2) marad mint történeti védjegy | Brand-döntés — implementációt nem blokkolja (7. fázis) |
| **F** | „figyelendő"/low tier neutrális fokozatának hangneme | A szín-oldal rendben (nem piros); a *felirat* („figyelendő") enyhén deficit-nyelvű — szöveg-kérdés, nem szín-kérdés | Külön UX-writing körre átadni; a szín-migrációt nem érinti |

---

*Metodika: WCAG 2.x kontraszt-számítás scripttel (relatív luminancia); L\*
becslés CIE-képlettel; a CVD-ellenőrzés implementációkor a dataviz-validátorral
zárandó (a DYNAMICS_SEGMENTS-nél már bevált gyakorlat). Minden hivatkozott
sor-szám a 2026-08-05-i `tritanium-polish` állapotra vonatkozik.*

---

## 5. Döntési kör — 2026-08-05 (UX + pszichológiai lencse, LEZÁRVA)

| # | Döntés | Indoklás |
|---|---|---|
| A | **(1)** — X marad okker, `#f59e0b` teljesen kivezetve adat-szerepből; warning mindig ikon+felirat kíséretű, és forma-nyelvben sosem áll adat-mark pozícióban | a tompa okker vs élénk amber két külön percepciós regiszter |
| B | **3 szerep-család** (gondolkodó=indigó · cselekvő=okker · emberközpontú=moha), családon belül árnyalat-lépcső + kötelező felirat | a 9 önkényes hue hamis precizitást sugall; a család a termék saját fogalmi szintje |
| C | **(1)** — RIASEC-paletta a karrier-réteg élesítéséig parkolva | fakedoor mögötti felület nem húzhat el rendszer-döntést |
| D | **(1)** — a hiring-konzol is candidate-terrakotta hero-t kap; a tanácsadó-perspektívát badge/eyebrow jelzi | egy domain = egy hang |
| E | Favicon/app-ikon: **marad**, brand-döntésként megjelölve — nem blokkol | a `#B85A34` terrakotta-közelsége miatt a candidate-akcent véglegesítése után érdemes újranézni |
| F | „figyelendő" felirat → **UX-writing backlogra** átadva; szín-oldala rendben | deficit-nyelv, nem szín-kérdés |

**+1 módosítás a 2.2 palettán (pszichológiai lencse):** az **E és O hue-ja
cserél** — E (Emocionalitás) = **viola `#7b5fae`**, O (Nyitottság) =
**mályva `#b4688a`**. Indok: az érzelmesség-dimenzió rózsaszínes kódolása
genderklisét kockáztat egy értékítélet-mentesnek szánt skálán; a viola
introspektív-semleges, a mályva a nyitottság/kreativitás mellett
klisémentesen áll. A base/strong/soft hármasok és az L*-lépcső pozíciói a
cserével együtt mozognak (a 2.2 tábla e szerint értelmezendő).

A migráció a 3. fejezet fázisai szerint indul, MIUTÁN a párhuzamos
komponens-ágak (share ✓ / candidate / eyebrow) e branchen landoltak.

---

## 6. Végrehajtva — 2026-08-05

A migráció a `tritanium-polish` branchen, a 3. fejezet fázisai szerint
(ésszerű összevonásokkal), az 5. fejezeti döntésekkel és az **E/O
hue-cserével** (E=viola `#7b5fae`, O=mályva `#b4688a`) együtt.

| Fázis | Megvalósult | Fájlok |
|---|---|---|
| **1. Source-of-truth** | Új `src/lib/color-system.ts` (DIMENSION_COLORS base/strong/soft × 6, TEAM_ROLE_FAMILIES 3 család + szerep-hozzárendelés, LAYER_THEMES a meglévő candidate-tokenekkel összehangolva, EVAL_RAMP, STATE_SOLID, DYNAMICS_COLORS, AVATAR_COLORS). `globals.css`: `--color-dim/role/layer/eval-*` + `state-*-solid` + `sage-300` + `paper-*` tokenek additívan; `--color-visual-*` és `state-success/warning-strong` törölve; `surface-team/org-accent*` alias-átmenetben a layer-tokenekre; founding→paper; numbered-alias dedup; `text-faint` pótolva. `design-tokens.ts`: `COLORS.ink300`, `PDF_COLORS.bronze700`. | globals.css · design-tokens.ts · +1 új lib |
| **2. Dimenzió-egykapu** | Mind a 4 párhuzamos paletta + legend a color-systemre: `questions/tritan.ts` (config.color=base; altruizmus=moha strong), `team-stats.ts` (dimConfigs=base, top3Dims=strong a fehér betűs pill-ekhez), `TeamReportView`, `TeamReportMemberView`, kampány-riport, jelölt-riport (O-piros megszűnt; fehér betűs badge-ek strong-on), blog-badge (strong-on-soft, N=neutrális), `TeamHeatmap` (fejléc/leírás-badge strong, cella-rámpa base, legend a valódi rámpából, no-data warm), GrowthFocus/CareerGrowthPlan/ProfileTabs chip-minta strong-on-soft + AA-szövegek. | 12 fájl |
| **3. Státusz-egykapu** | Toast (state-tokenek), Modal brand-danger (`#8c4a31`→action-destructive/state-error — a candidate-ütközés feloldva), profil törlés-zóna (ötödik piros-család→state-error), DashboardStatusChip `rose`, CandidateRevokeButton, ShareModal-revoke, dinamika-trió egykapu (TeamReportView+DynamicsMap+manager — bézs-complementary megszűnt, state-*-solid), TeamRoleSection bannerek + forrás-badge neutrális, CampaignCard státusz-jelzők. | ~11 fájl |
| **4. Réteg-akcentek** | SurfaceHero → LAYER_THEMES (a surface-hero-theme teszt mostantól hexben is méri: self badge 4.32→4.87 AA-ra igazítva `#eeb681`), team/org loading-skeletonök, SectionEyebrow candidate-szabály (+ `candidateOnDark` tónus a sötét herókra), team MetricTile-ok, org-akcent kettősség feloldva (`#2f4863` kanonikus / `#3f6d9a`=bright), OrgOnboardingWizard + CampaignCard + OverviewTabView aranyai → org-glow. D-döntés ellenőrizve: a hiring-konzol már candidate-hero ✓. | ~10 fájl |
| **5. Vizualizációk + eval** | RadarChart: self-polygon H→E→O base-gradiens (fuchsia ki), observer→bronz, rács/aura meleg (slate/indigó ködök ki), dim-címkék strong; RadarLegendNote; avatar.ts→AVATAR_COLORS; `tierColors`→eval-tokenek (AA-fg-k); CareerResults fitColor→EVAL_RAMP; hiring-fit címke+gap→eval/bronz-magnitúdó; pattern-verdict→EVAL_RAMP (+`#2e6b50`→sage az atlaszban); PatternExplorer paper-téma + accentHover-bug (sage-dark); AdminTrendChart/OverviewTab→sage/bronz tokenek; EvaluatingScreen→bronze-700; CelebrationBurst tokenre. | ~14 fájl |
| **6. PDF + email + OG** | PdfComparison gap: piros→bronz-magnitúdó (sageLight→bronze→bronze700); PdfDimensionChart sávok dim-strong (kód-alapú lookup, ProfileTabs kódot ad át; tier-jelölés változatlan); CoverPage→LAYER self hero-stopok; emails.ts szórvány-szürkéi→EMAIL_COLORS.faint (két-szürkés készlet); 3 OG-kép + ShareCardDownload→`design-tokens.ts` import (edge-kompatibilis). | ~9 fájl |
| **7. Takarítás + őrzés** | `scripts/check-colors.mjs` (`pnpm check:colors`, a `pnpm check` része): kivezetett hexek tiltólistája (hard fail) + nyers-hex keret a UI-scope-ban (23, fájllistával); `design-tokens-sync.test.ts` var()-lánc-feloldással az összes új token-párra + kivezetett-token őr + E/O-döntés őr; 1.8-as apróságok (ink-szürkék: `#5a5a6e`→ink-body, `#8a8a98`→ink300/faint, `#6b6b6b`→muted; zöldek: `#217a55`/`#2e6b50`→sage, `#8ad0b4`→sage-300 token, `#1a2e22`→sage-deep, `#edf4ef`/`#eef6f2`→sage-ghost; InvitationsTab/ComparisonTab→bronz/homok; TeamRoles near-dupe→bronze-100/edge); ambient-glow fuchsia→sage–bronz duó; `ui-hex-replacement-policy.md` + `ui-token-map.md` erre a doksira mutat. | script + teszt + sok apró |

**Kontraszt-bukók sorsa (1.9):** a fehér betűs dim-badge-ek strong-ra álltak
(≥5.4:1); a bronz/ink300 kis szövegek eval-fg fokozatokra (`#8a5530` /
`#6e6e80`); a SZ-chip 1.85:1 mintája megszűnt (családi strong-on-soft);
a team-akcent (`#d48e62`) és a candidate-glow (`#e0a878`) on-dark-only —
világos felületen szilva ill. terrakotta accent; a CareerResults low-fit
amber ki; a self hero-badge 4.87:1-re igazítva.

**Tudatosan későbbre hagyva / nem változott:**

- **RIASEC-paletta** (C-döntés): parkolva a karrier-réteg élesítéséig —
  a guardrail kivétel-listáján dokumentálva.
- **Favicon/app-ikon** (E-döntés): marad, brand-döntésig.
- **Google-logó**: harmadik fél brand-színei, kivétel.
- **„figyelendő" felirat** (F-döntés): UX-writing backlog.
- Maradék 23 nyers hex a UI-scope-ban (keretben rögzítve): PDF-fehérek
  (CoverPage), kurátori minta-atlasz akcentek (`#8b3a2a`, `#3d4f6b`…),
  neutrális hover-tintek (`#dbeee8`, `#f7ede1`, `#dfeae5`, `#faf5ef`),
  admin-értesítő email-hexek (API route-ok), observe-oldali `#cfe2d6`
  keret — mind jelentés-semleges; cél a keret fokozatos csökkentése.
- A Tailwind default-utility állomány jelentés-semleges része (dekoratív
  szürkék/neutrálisok, státusz-szerepben álló státusz-osztályok pl.
  TeamReportView psych-safety) nem lett erőből átírva — a doksi migrációs
  elve szerint csak a jelentés-osztályt sértők mozogtak.
- Nincs screenshot-regressziós infra: a 2/4/5. fázis érintett útvonalainak
  kézi vizuális átnézése a következő élő smoke-kör feladata; a dim-hue-váltás
  a visszatérő felhasználóknak észrevehető → egy mondat a tanácsadói
  release-jegyzetbe („a skálaszínek egységesek lettek minden nézetben").

**Verifikáció (2026-08-05):** `pnpm check` (type-check + lint + check:colors)
0 hiba · `test:unit` 469/469 · `test:client` 92/92 · `test:integration`
121/121 (helyi Postgres 5433) · dummy-env `pnpm build` zöld.

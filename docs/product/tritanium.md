# Tritanium — Lumina × Trita elemzés és terv (v3, a valós kódbázison)

> **Státusz (2026-08-04): VÉGREHAJTVA a `tritanium` branchen.** A 0–4. kör
> mindegyike implementálva (P0.1–P0.5 javítások, A1 vendég-teaser, A2 OG-kép,
> C1+C2 riport-stabilitás + „Csapat nyomás alatt", B1 valódi páros
> összehasonlítás, D1 reflexiós utókövetés). P0.6-ról a vizsgálat kiderítette,
> hogy korábban már lezárták (append-only séma él). A3 (kártya-letöltés)
> tudatosan kihagyva — opcionális volt. Részletek és follow-upok:
> `docs/development/changelog/2026-08-04.md`. Verifikáció: `pnpm check` 0 hiba,
> unit 456 zöld, client 92 zöld, production build zöld (env-hiányos konténerben
> dummy RESEND/Clerk kulcsokkal); integration/e2e test-DB híján nem futott.
> **Előzmény:** a v1–v2 elemzés az elavult `main`-en (kutatási MVP) készült és
> semmissé lett téve. Ez a v3 a `consulting_cleanup` → `main` merge (PR #10) utáni
> **valós** kódbázis teljes átvilágítására épül (3 párhuzamos kód-audit:
> taxonómia/vizuál, team-intelligence, funnel/monetizáció).
> **Viszonyítási pont:** a „Lumina Learning × Trita" piackutatási riport (2026-08)
> és a **szeptember 8-i pilot-kickoff** (`docs/pilot/pilot-1-kor-utemterv.md`).

---

## 1. Vezetői összefoglaló

**A piackutatási riport Trita-képe helytálló.** A „6 faktor → 4 tengely → 16
mintázat", a mintázat-vizualizáció, a stabilitási jelzések és a számított
csapatdiagnosztika mind létező, tesztelt kódrendszer. A riport egyetlen
következtetését sem kell visszavonni; a korábbi kételyem az elavult `main`-ből
fakadt.

**A vizsgálat három fő eredménye:**

1. **A zászlóshajó-differenciátor jelenleg törött.** A 16 csapatmintázat számítása
   három egymásra rakódó hiba miatt gyakorlatilag nem jut el a felhasználóig
   (→ 4. fejezet, P0-lista). A szeptember 8-i pilot előtt ez a legfontosabb teendő —
   minden Lumina-inspirált fejlesztés előtt.
2. **A Lumina-riport ajánlásainak nagy része már megvalósult** — gyakran jobban,
   mint a Lumina-eredeti (pl. mért trust-háló a becsült dinamika mögé). A valódi
   rések pontosan azonosíthatók: a `/try` vendégteszt **nulla értéket ad** a
   regisztráció előtt; a párösszehasonlítás **egyjátékos** (archetípus-prototípussal,
   nem valódi emberrel); és **nincs semmilyen utókövetés** (a retenció legnagyobb
   lyuka).
3. **A termék fegyelme jó irányba tart** — a career-modul „painted door" mérése
   (3 árszint, WTP-csúszka) példaértékű; a monetizáció konzisztensen
   consulting-led. A riport „mit ne vegyél át" figyelmeztetései közül a
   portfólió-szélesedés az egyetlen élő kockázat.

| Kör | Tartalom | Mikor | Effort |
|---|---|---|---|
| **0** | Pilot-kritikus javítások (mintázat-lánc + precedencia) | **szept. 8 előtt** | S–M |
| 1 | Vendégteszt azonnali vizuális eredménye + OG-kép a megosztáshoz | szept. 8 előtt erősen ajánlott | M |
| 2 | Valódi párösszehasonlítás (meghívó-linkkel) | pilot alatt/után | M–L |
| 3 | Stabilitás + „csapat nyomás alatt" a riportban | pilot 1. kör riportjaihoz | M |
| 4 | Reflexiós utókövetés (minimál nurture) | pilot után | M |
| BL | Interjúkérdés-generálás, leader-riport, partner-lépcső, nyelvi egységesítés | később | — |

---

## 2. A riport érvényessége — verdikt a kód alapján

| Riport-állítás | Kód-valóság |
|---|---|
| „6 faktor → 4 tengely → 16 mintázat" | ✅ Csapatszinten: `team-pattern.ts` — 4 tengely (Hajtóerő=X · Kohézió=(A+H)/2 · Fegyelem=C · Nyitottság=O), 16 nevesített mintázat, 5 fokozatú tengely-értékelés. Egyéni szinten emellett 30 archetípus él (domináns+másodlagos dimenzió, `personality-type.ts`). |
| „Miró-nyelvű mintázatábra" | ✅ Egyéni szinten: `TypeGlyph` — forma+motívum grammatika (bronz alapforma = domináns, tus-motívum = másodlagos, 5 intenzitás-fokozat), nem 36 kézi rajz. ❌ Csapatmintázatnak nincs glyphje. |
| „facet-minőségjelzések + stabilitási figyelmeztetés" | ✅ Számítva: tengely-stabilitás (küszöb-közelség), diverzitás, kompozit confidence, egyén↔mintázat távolság; ötféle mért/becsült forrás-jelölés. ⚠️ A stabilitás-figyelmeztetést renderelő kártya jelenleg nincs bekötve (P0.3). |
| „számított csapatszintű mintázat, intenzitás- és diverzitás-elemzés" | ✅ + azon túl: dinamika-térkép (súlyozott súrlódás-becslés, mért trust-felülírással), 9 szerepes csapatszerep-modell peer-körrel (n≥3), pszichológiai biztonság index (8 item, n≥3), bizalmi háló (hub/beágyazatlan), 9 fejezetes csapatriport befagyasztott pillanatképpel. |
| „a Lumina Team csak vizualizál — a Trita számol" | ✅ Ma is igaz differenciátor — DE a mintázat-lánc végén a P0-hibák miatt a számítás eredménye jelenleg „Ismeretlen minta"-ként jelenik meg. A védőárok valós, csak be kell hegeszteni. |
| „H-dimenziós együttműködési kockázat-mérés" | ✅ A TSFI méri a H-t (INTE); a kohézió-tengely és a `cohesion_risk` prioritás-szabály explicit erre épül. |

---

## 3. Lumina-ajánlások × valós állapot (a riport 6. fejezete tételesen)

### #1 Splash-analóg belépő-élmény — **RÉSZLEGES, itt a legnagyobb rés**

| Elem | Állapot |
|---|---|
| Taster-teszt | ✅ `/try` — vendég, auth nélkül, TSFI-S 60 item (~9 perc), sitemap-prioritás 0.9 |
| **Azonnali, vizuális eredmény** | ❌ **A vendég SEMMIT nem lát**: kamu 2,5 mp-es „kiértékelés" progress → 🎉 → regisztrációs fal (`try/complete`). A pontszám, az archetípus-név, a glyph — semmi. A funnel legszélesebb pontja pont ott ejti el a látogatót, ahol az értéket kellene átadnia. |
| Megosztható vizuál | ⚠️ Van share-link (`/share/[token]`, token + visszavonás + email-küldés) és ShareModal archetípus-kártyával — de `noindex` ÉS **nincs OG-kép route**: Slackbe/LinkedInre illesztve generikus site-kártya jelenik meg, nem a felhasználó glyphje. A kártya JSX-ként létezik, képként soha nem renderelődik. |
| QR-mechanika | ❌ nincs (repo-szerte nulla találat) |

→ **1. kör: A1 (vendég-teaser) + A2 (OG-kép).** A Lumina-riport legfontosabb
ajánlásának pontos, kódra fordított megfelelője.

### #1b Share & Compare (párösszehasonlítás) — **EGYJÁTÉKOS MA**

Az interakció-motor kiforrott (30 reláció-atom, súrlódás-súlyok, hedge-nyelvi
guardrail tesztekkel, vezető-mód), de a másik fél **mindig szintetikus
archetípus-prototípus** (`ArchetypePicker`): a motor deklarálja a
`profile-profile` szintet, ám azt **semmi nem hívja** — két valódi profil
összehasonlítására nincs út, meghívó sincs hozzá. Az egyetlen működő
akvizíciós hurok az observer-flow (`/sign-up?observeToken=`).

→ **2. kör: B1 — valódi páros összehasonlítás meghívó-linkkel.** A termék
legnagyobb kihasználatlan virális hurka (a Luminánál bizonyítottan működő
mechanika), és az infrastruktúra 80%-a készen áll.

### #2 Persona-gondolat (mindennapi vs. túlfeszített) — **EGYÉNILEG KÉSZ, CSAPATSZINTEN FÉLBEHAGYVA**

- Egyéni: ✅ `SOLO_DIM_PRESSURE` — 12 tétel (6 dim × high/low), stress + blindspot
  bontásban, hipotézis-keretezéssel; PDF-ben és profilon él. A júliusi
  riport-javítási terv (P2/2.1) további mélyítést már betervezett — **nem duplikáljuk**.
- Csapat: ⚠️ a stabilitás/instabil tengelyek/`tensionAxes` **kiszámolódnak, de a
  riportba nem kerülnek be** (a riport csak mintázat-nevet + confidence-t visz), és
  nincs „csapat nyomás alatt" fejezet.

→ **3. kör: C1 (stabilitás bekötése a riportba) + C2 („Nyomás alatt" fejezet).**

### #3 Qualification-lépcső / Essentials-Premium — **CSÍRÁBAN**

Tanácsadói szerep (`ORG_CONSULTANT`), kézi org-aktiválás, admin ajánlat-kalkulátor
(programdíj + degresszív marginális fejenkénti sávok + follow-up mint külön termék —
a riport 5. fejezetének leckéi már beépítve!). Partner-minősítési termék nincs.
→ Backlog (2027), a kalkulátor a mag.

### #4 Spark Coach utókövetés — **SEMMI (a legnagyobb retenciós lyuk)**

28 értesítés-típus — mind tranzakcionális. Egyetlen cron (kampánylépés-nyitás).
A `notifications/sweep.ts` bekötetlen placeholder, saját TODO-jában a digest.
**A tesztet kitöltő user egy `RESULT_READY` értesítést kap, aztán soha többé
semmit** — hacsak tanácsadó nem indít kampányt.
→ **4. kör: D1 — minimál reflexiós szekvencia** a meglévő notification-hub +
sweep infrastruktúrára.

### #5 Select-tanulság: interjúkérdés-generálás — **HIÁNYZIK, pont ott, ahol a helye lenne**

A hiring-felület él (jelölt-token, TSFI-S + opcionális csapatszerep-lépés,
manager-összefoglaló, jelölt↔csapat gap-elemzés) — de interjúkérdést nem
generál; az `interviewFindings` kézzel írt mező. Pikáns: az „interview"
értékcél iránti keresletet a career fake door **B2C oldalon méri**, miközben a
B2B hiring-felületen — ahol a legtöbbet érne — nincs ilyen.
→ Backlog E1 (pilot után; a tanácsadói demókban erős).

### #6 Vezetői nézet — **RÉSZLEGESEN KÉSZ**

Interakció vezető-módja (leaderNotes), riport „Hogyan vezesd ezt a csapatot"
fejezete, `leader_team_mismatch` prioritás-szabály. Dedikált vezető×csapat
illeszkedés-riport nincs. → Backlog.

### #7 Partner-tartalomfolyam — nincs, backlog (2027-es partnermodellel együtt).

### „Mit NE vegyen át" — érvényesség ma

- **Szín-gravitáció:** ✅ tartva — a TypeGlyph forma/motívum-alapú, nem színkód.
  ⚠️ Kis drift: a `/patterns` explorer mintázatonkénti hex-színeket használ — ne
  fejlődjön szín=mintázat kódrendszerré.
- **Portfólió-szélesség:** ⚠️ **ez az élő kockázat.** Career-motor (477 foglalkozás,
  21 család) + hiring + interakció + blog + team — sok felület egy pilot előtt.
  A career painted-door fegyelme a jó minta: ami nem pilot-kritikus, az mérjen,
  ne épüljön.
- **Practitioner-közvetett modell:** ✅ tartva — közvetlen consulting-led, minden
  pénz-út `/contact`/`/pilot`.

---

## 4. A vizsgálat lelete: pilot-kritikus hibák (P0) — a terv 0. köre

Ezek nem Lumina-átvételek, hanem a meglévő differenciátor működőképessé tétele.
**Javaslat: minden más előtt, szeptember 8. előtt.**

| # | Hiba | Hatás | Hol |
|---|---|---|---|
| P0.1 | A mintázat-kód pólus-betűi elromlottak egy júliusi mechanikus átnevezésben (`"E"→"RESO"`, `"C"→"THOR"`, `"X"→"TEMP"` a `poleLetter` hívásokban és a `flipMap`-ben) — a kód `RESOTHORSTEMP`-szerű, a `PATTERN_NAMES` kulcsai `ECSX…RVFP` maradtak | **16-ból 15 mintázat „Ismeretlen minta"** — a publikált csapatriportokban is ez a címke jelenik meg | `src/lib/team-pattern.ts:209-214, 234-236` (commit `48b75ea`) |
| P0.2 | A pattern API a display-kódokat (`dims.H/E/X/A/C/O`) olvassa a tárolt belső kódok (TEMP/RESO/…) helyett — ugyanaz a hiba, amit a `team-stats.ts`-ben már javítottak | `insufficientData: true` mindig → az advisory oldal sosem mutat mintázatot | `src/app/api/team/[id]/pattern/route.ts:68` |
| P0.3 | `TeamPatternCard` (stabilitás-jegyzet + confidence-badge + tengelysávok renderelője) **árva — nincs importálója**; ahogy a `TeamMap` és `RoleFitMap` sem | A kiszámolt stabilitás-figyelmeztetés sehol nem jelenik meg | `src/components/team/TeamPatternCard.tsx` |
| P0.4 | Az intelligence tab feltétel nélkül becslést mutat csapatszerepre, a kérdőíves eredményt ignorálva — a máshol 4 helyen betartott „kitöltés > becslés" precedencia ellenében | Mért adat helyett becslés a tanácsadói felületen — a termék hitelességi alapelvét sérti | `src/components/team/TeamIntelligence.tsx:176-211` |
| P0.5 | `source: "estimate"` sosem perzisztálódik → `teamRoleEstimateCount` mindig 0 | A riport becslés/kitöltés aránya hamis | `TeamRoleTabView.tsx:39` + submit route |
| P0.6 | (Már ismert, belső terv: `ujrafuttatas-korok-terv.md`) TeamRoleAnswer/Score `@unique(userProfileId)` — újrakitöltéskor **adatvesztés** | A pilot előtt lezárandó (a terv maga mondja) | Prisma séma |

Tanulság-jegyzet a P0.1-hez: a `calculateTeamPattern`-t egyetlen unit teszt sem
fedi — a javító PR-nek a 16 kód × név feloldását és a flipMap-et is teszttel
kell rögzítenie (a repo PR-sablonja ezt amúgy is megköveteli).

---

## 5. A terv körönként

### 0. kör — P0 javítások (szept. 8 előtt; S–M)
A 4. fejezet hat tétele. P0.1+P0.2+P0.3 együtt egy PR-ben értelmes (a
mintázat-lánc végigjavítása + bekötés + tesztek); P0.4+P0.5 egy másikban;
P0.6 a meglévő belső terv szerint.

### 1. kör — Belépő-élmény (Lumina #1; szept. 8 előtt erősen ajánlott; M)

**A1 — Vendég-teaser a `/try` végén.** A kitöltés után a vendég azonnal kapjon
**kliens-oldalon számolt** eredmény-ízelítőt: a saját TypeGlyph + archetípus-név
(pl. „Energikus újító") + a két domináns dimenzió chipje. A pontozás pure
function (`calculateScores`), a glyph pure SVG — szerver nélkül renderelhető.
A teljes riport (facetek, munkastílus, PDF) marad regisztráció mögött; a
teaser alatt a meglévő claim-CTA. Adatvédelmi elv: a teaser semmit nem tárol
szerveren. *Kockázat-jegyzet: a claim-flow localStorage-függése (más
böngésző = elveszett válaszok) ismert korlát — a teaser ezen nem ront, de a
CTA-szöveg jelezze, hogy „ebben a böngészőben folytasd".*

**A2 — OG-kép a `/share/[token]`-hez.** `opengraph-image.tsx` route a blog-OG
mintájára: glyph + archetípus-név + „trita" a brand-tokenekkel (bronz/krém/tus,
Fraunces — a betűk assets/og alatt már ott vannak!). A `noindex` maradhat —
az OG-kép attól még működik link-előnézetként. Ezzel a megosztott profil végre
önmagát árulja.

**A3 (opcionális) — kártya-kép letöltés/Web Share** a ShareModalból (a meglévő
kártya-JSX képpé renderelése). Csak ha az 1. kör után marad kapacitás.

### 2. kör — Valódi párösszehasonlítás (Lumina #1b; M–L)

**B1 — „Hasonlítsuk össze" meghívó-link.** A meglévő darabokból: az interakció-
oldalra „Összehasonlítás valódi kollégával" belépő → token-alapú meghívó (az
observer-invite infra mintájára: lejárat, visszavonás, `?compareToken=`
regisztráció-átvezetés) → a másik fél kitölti/összeköti a saját tesztjét →
**kölcsönös consent** után mindkét fél az interakció-oldal „valódi pár" módját
látja: `simulateInteraction(level: "profile-profile")` — ami már ma is
tesztelt kódút — + a két glyph egymás mellett. Elvek: csak dimenzió-szintű
adat; a hedge-nyelvi guardrail (interaction-language) kötelező marad;
bármelyik fél visszavonhat; QR a linkhez opcionális extra (workshop-helyzet).
DB: 1 új tábla (CompareInvite). *A pilot-szervezeteken belül ez tanácsadói
demó-eszköz is.*

### 3. kör — Stabilitás + „Nyomás alatt" a csapatriportban (Lumina #2; M)

**C1 — A számított stabilitás bekötése**: `TeamReportAggregates.pattern` bővítése
(`stability`, `stabilityNote`, `unstableAxes`, top `tensionAxes`) + render a
riport mintázat-fejezetében (amber jegyzet, a meglévő mért/becsült
badge-nyelvvel). A TeamPatternCard-bekötés (P0.3) után természetes folytatás.

**C2 — „Csapat nyomás alatt" fejezet**: az egyéni `SOLO_DIM_PRESSURE` tartalmak
csapat-aggregátuma — mely dimenzió-pólusok koncentrálódnak a csapatban, és
ezek nyomás alatt milyen kollektív mintává állhatnak össze (pl. sok THOR-high →
kontroll-spirál; sok ADAP-high → látszat-harmónia). Hipotézis-keretezés, max 3
állítás, akcióval zárva — a riport-értelmezési sablonok hangnemében.

### 4. kör — Reflexiós utókövetés (Lumina #4; M)

**D1 — Minimál nurture a meglévő infrastruktúrán**: a `sweep.ts` placeholder
bekötése a cron mellé + egy új, `reflection` kategóriájú értesítés/e-mail a
kitöltés után 7 nappal: 1 személyre szabott reflexiós kérdés a legmarkánsabb
dimenzió `SOLO_DIM_PRESSURE`/insight tartalmából + 1 CTA (observer-meghívás
VAGY interakció-oldal). Opt-out kötelező; dedupe a notification-hub meglévő
kulcs-mechanizmusával. Nem sorozat — egyetlen, jól megírt érintés, mérhető
open/click-kel; a folytatásról adat döntsön.

### Backlog (pilot után / 2027)

| Tétel | Lumina-horgony | Megjegyzés |
|---|---|---|
| E1 interjúkérdés-generálás a jelölt-nézetbe | #5 Select | jelölt-dimenziók × csapat-gap → hedge-nyelvű kérdés-javaslatok; a career fake door „interview" kereslet-adata dönt |
| Vezető×csapat illeszkedés-riport | #6 Leader | a `leader_team_mismatch` szabály kiterjesztése |
| Partner-minősítési lépcső + tartalomfolyam | #3, #7 | a kvóta-kalkulátor és a pilot-playbook a mag |
| 16-mintázat névkészlet-egységesítés | (koherencia) | `pattern-data.ts` publikus nevei ≠ `team-pattern.ts` nevei (pl. „Innovációs Motor" vs „Innovátor Gépezet") — egy nyelvet beszéljen a marketing és a riport |
| Confidence-jelölés egységesítés | (koherencia) | ötféle párhuzamos forrás/confidence-rendszer → közös badge-komponens |
| `/holland-kod` zsákutca feloldása | (koherencia) | indexelt SEO-oldal CTA-ja ma a fake doorba fut — vagy irányítson a `/try`-ra, vagy jelezze őszintén a mérést |
| Csapatmintázat-glyph | Miró-nyelv | a TypeGlyph grammatika kiterjesztése a 16 mintázatra |

---

## 6. Claude Code promptok

### 6.0 — Közös guardrail (minden prompt elejére)

```text
KONTEXTUS: Trita — consulting-led személyiség- és csapatintelligencia platform
(CLAUDE.md). Pilot-kickoff: 2026-09-08.
SZABÁLYOK:
- Instrumentum-fájlokhoz (src/lib/questions/*) és scoringhoz NE nyúlj, kivéve ha
  a feladat explicit kéri.
- Minden user-facing szöveg i18n-nel (t/tf, src/lib/i18n/), HU+EN.
- Design: CSS-variable tokenek (bg-cream, text-ink, text-bronze, bg-sage,
  border-sand, font-fraunces); tipográfia a 7 szerep-utilityvel; Button/TextField
  primitívek; mobile-first, min-h-[44px], csak md: breakpoint.
- Becsült vs mért adat: minden intelligence-kimeneten kötelező a forrás/
  confidence jelölés — ez a termék hitelességi alapelve.
- API route-okon Zod; hibakód-minta (rövid kód, kliens lokalizál).
- A PR-sablon quality gate-je él: journey/observer/assessment/policy érintésekor
  unit + integration teszt kötelező; kritikus flow-nál e2e.
- A munka végén: pnpm check + pnpm test:unit (és érintettség szerint
  test:client / test:integration) zölden.
```

### 6.1 — P0.1+P0.2+P0.3: a mintázat-lánc helyreállítása

```text
[6.0 guardrail]

FELADAT: A 16 csapatmintázat lánca három ponton törött — javítsd végig, tesztekkel.

1) src/lib/team-pattern.ts, poleLetter hívások (kb. 209-214. sor) és flipMap
   (kb. 234-236. sor): egy mechanikus átnevezés (commit 48b75ea) a pólus-betűket
   elrontotta ("E"→"RESO", "C"→"THOR", "X"→"TEMP"). A PATTERN_NAMES kulcsai
   4 betűs kódok (ECSX…RVFP). Állítsd vissza az egykarakteres pólus-betűket:
   drive: "E"/"R", cohesion: "C"/"V", discipline: "S"/"F", openness: "X"/"P" —
   a flipMap-ben ugyanígy. FIGYELEM: a fájlban máshol a TEMP/RESO/THOR/OPEN
   belső dimenziókódok helyesek — csak a pólus-betű literálokat javítsd.
2) src/app/api/team/[id]/pattern/route.ts (kb. 68. sor): a tárolt score-JSON
   belső kódokat használ (TEMP/RESO/INTE/THOR/ADAP/OPEN — src/lib/tritan.ts),
   a route viszont dims.H/E/X/A/C/O-t olvas, ezért membersWithScores mindig
   üres és insufficientData: true. Javítsd a belső kódokra — mintaként ott a
   team-stats.ts már javított olvasója.
3) src/components/team/TeamPatternCard.tsx jelenleg árva (nincs importálója),
   pedig ez rendereli a mintázat-nevet, tengelysávokat, confidence-badge-et és
   a stabilitás-jegyzetet. Kösd be a csapat-oldal intelligence tabjára
   (TeamIntelligence környékén), a team-stats.ts patternResult adatából; ≥3
   kitöltő alatt ne jelenjen meg (a calculateTeamPattern null-t ad — kezeld).
4) TESZTEK (nincs meglévő fedés!): tests/unit/team/team-pattern.test.ts —
   (a) mind a 16 tengely-kombinációra a generált kód feloldódik PATTERN_NAMES-ben
   (nem "Ismeretlen minta"); (b) flipMap/alternativeCode is érvényes kódot ad;
   (c) <3 tag → null; (d) stabilitás-fokozatok határesetei. A pattern API-ra
   integration teszt belső kódos score-okkal.

ELFOGADÁS: mind a 16 mintázat névvel + tartalommal oldódik fel; az advisory
oldal mintázatot mutat elegendő adatnál; a stabilitás-jegyzet megjelenik a
csapat-oldalon; pnpm check + test:unit + test:integration zöld.
```

### 6.2 — P0.4+P0.5: csapatszerep-precedencia és forrás-számláló

```text
[6.0 guardrail]

FELADAT: A "kitöltés > becslés" precedencia-szabály két megsértésének javítása.

1) src/components/team/TeamIntelligence.tsx (kb. 176-211. sor): a "Becsült
   csapatszerep profil" blokk feltétel nélkül estimateTeamRolesFromTritan-t
   hív, a kérdőíves eredményt ignorálva. Kövesse a máshol (team-stats.ts,
   team-report.ts, TeamRoleSection.tsx) már betartott szabályt: ha a tagnak van
   questionnaire-forrású TeamRoleScore-ja, azt mutassa "kitöltött" badge-dzsel;
   becslést csak fallbackként, "becslés" badge-dzsel.
2) A source="estimate" sosem perzisztálódik, ezért a TeamRoleTabView
   teamRoleEstimateCount-ja (kb. 39. sor) mindig 0. NE kezdd el a becslést
   DB-be írni (a becslés számított!) — ehelyett a számláló a megjelenített
   tagok tényleges forrás-bontásából számolódjon (hány tagnál questionnaire,
   hánynál futott becslés-fallback).
3) Unit teszt mindkettőre (tests/unit/team/ alá): kevert forrású tag-lista →
   helyes precedencia és helyes count-ok.

ELFOGADÁS: kérdőívet kitöltött tagnál soha nem becslés jelenik meg; a
becslés/kitöltés arány valós; pnpm check + test:unit zöld.
```

### 6.3 — A1: vendég-teaser a /try végén

```text
[6.0 guardrail]

FELADAT: A /try vendégteszt a kitöltés után adjon azonnali, kliens-oldali
eredmény-ízelítőt a regisztrációs fal ELŐTT (Lumina "Taster Splash" elv: az
érték egy szelete azonnal, a teljes riport regisztrációért).

1) A guest submit ág (src/components/assessment/AssessmentClient.tsx, guest
   branch) a kamu progress után NE üres ünneplő-oldalra vigyen: a localStorage
   draftból kliens-oldalon számítsd ki a pontszámokat (calculateScores pure
   function — ellenőrizd, hogy kliensre importálható; ha szerver-only függése
   van, bontsd ki a pure részt), majd a /try/complete oldalon jelenítsd meg:
   - a vendég TypeGlyph-je (hero variáns) + archetípus-név
     (resolvePersonalityTypeFromScores + resolvePersonalityTypeLabel),
   - a két domináns dimenzió chipje (címke + 1 mondatos insight),
   - alatta a meglévő claim-CTA-k változatlanul (sign-up/sign-in →
     /try/claim), kiegészítve: "az eredményed ebben a böngészőben vár —
     regisztráció után automatikusan a fiókodba kerül".
2) SEMMI nem íródik szerverre a claim előtt (a jelenlegi elv marad); a teljes
   riport (facetek, munkastílus, PDF, megosztás) regisztráció mögött marad.
3) A /try/complete legyen üres-draft-biztos: ha nincs localStorage draft
   (közvetlen URL-belépés), a mai viselkedés maradjon (CTA-k eredmény nélkül).
4) i18n kulcsok HU+EN (assessment névtérbe); client teszt a teaser-render
   három állapotára (van draft / nincs draft / hiányos draft).

ELFOGADÁS: vendégként végigkitöltve a záróoldalon glyph + archetípus-név +
2 dimenzió-chip látszik hálózati hívás nélkül; claim után az eredmény a
fiókban van; pnpm check + test:unit + test:client zöld.
```

### 6.4 — A2: OG-kép a megosztott profilhoz

```text
[6.0 guardrail]

FELADAT: opengraph-image route a /share/[token] oldalhoz, hogy a megosztott
link Slack/LinkedIn/iMessage előnézetben a felhasználó archetípus-kártyáját
mutassa (ma a generikus site-kártya jelenik meg).

1) ÚJ: src/app/(app)/share/[token]/opengraph-image.tsx — a meglévő
   blog/[slug]/opengraph-image.tsx mintájára (ImageResponse, edge/nodejs
   runtime a minta szerint; a Fraunces/DM Sans fontok az assets/og/ alatt
   már ott vannak).
   Tartalom: bal oldalt a TypeGlyph kompozíció OG-re egyszerűsítve (az
   ImageResponse SVG-támogatása korlátos — a type-glyph.ts geometriájából
   a forma+motívum path-okat renderelnifetch-elhető inline SVG-ként vagy
   egyszerűsített alakzatokkal), jobbra: archetípus-név (Fraunces), a két
   domináns dimenzió címkéje, "trita" szignó. Brand-tokenek: krém háttér,
   tus szöveg, bronz forma.
2) Érvénytelen/visszavont tokenre is adjon értelmes (generikus brand) képet —
   ne 500-azzon.
3) A page metadata (share/[token]/page.tsx) og:title/og:description igazítása:
   "<név> — <archetípus> | Trita" + 1 mondat; a robots noindex marad.
4) Teszt: unit a kép-inputot előállító helperre (token → megjelenítendő
   adatok, érvénytelen token ág).

ELFOGADÁS: érvényes share-linkre az OG-kép a glyph-kártyát adja; érvénytelen
tokenre brand-képet; pnpm check + test:unit zöld.
```

### 6.5 — B1: valódi párösszehasonlítás (vázlat — 2. kör indítása előtt véglegesítendő)

```text
[6.0 guardrail]

FELADAT: "Hasonlítsuk össze — hogyan működnénk együtt?" — két VALÓDI profil
összehasonlítása kölcsönös beleegyezéssel (ma az interakció-oldal csak
archetípus-prototípussal megy; a simulateInteraction "profile-profile" szintje
tesztelt, de bekötetlen).

1) Prisma (additív): CompareInvite { id, token @unique, inviterId,
   partnerId?, status PENDING|ACCEPTED|REVOKED|EXPIRED, createdAt, acceptedAt?,
   expiresAt } + relációk. Migráció + a profil-törlés flow REVOKED-ra állítja.
2) API-k (Zod + hibakódok): POST /api/interaction/invite (csak saját
   eredménnyel; max 3 aktív; 30 nap); GET /api/interaction/invite/[token]
   (validálás); POST .../accept (auth + saját eredmény + consent szöveg);
   DELETE (visszavonás bármelyik féltől).
3) Flow: az /interaction oldalon belépő "Valódi kollégával" → link/QR nélkül
   először: link-másolás (a QR későbbi extra); a fogadó fél auth nélkül a
   consent-oldalra jut → sign-up/sign-in ?compareToken= átvezetéssel (az
   observeToken minta szerint) → ha nincs saját eredménye, a /try-claim útra
   fut, és a token megmarad → accept után MINDKÉT fél az interakció-oldal
   "valódi pár" módját látja: simulateInteraction({self, other, level:
   "profile-profile"}) szerver-oldalon, mindkét irányból a saját nézőpontjával
   (viewA/viewB az atomokban már kezelt).
4) UI: a meglévő InteractionSection minta — két glyph + név-dekompozíció,
   easy/friction/discuss blokkok, vezető-kapcsoló; forrás-jelzés: "mindkét fél
   mért profilja" (a mai "type-level estimate" jelzés helyett). A hedge-nyelvi
   guardrail (interaction-language teszt) erre a szintre is fusson.
5) Privacy: csak dimenzió-szintű adat; facet soha; REVOKED után egyik fél sem
   éri el; a partner pontszámai számszerűen NEM jelennek meg a másik félnek —
   csak a szimuláció szövege és a glyph.
6) Tesztek: unit (invite lifecycle, guard-ok), integration (accept-flow),
   client (consent + páros nézet), + interaction-language a profile-profile
   kimenetre.

ELFOGADÁS: teljes kör két fiókkal végigjátszható; visszavonás azonnal hat;
tokenes átvezetés sign-up-on át is túléli; pnpm check + tesztek zölden.
```

### 6.6 — C1+C2: stabilitás és „Nyomás alatt" a csapatriportban

```text
[6.0 guardrail]
ELŐFELTÉTEL: 6.1 (P0 mintázat-lánc) kész.

FELADAT: A kiszámolt, de riportba nem jutó stabilitás-jelzések bekötése + új
"Csapat nyomás alatt" fejezet.

1) src/lib/team-report.ts, buildTeamReportAggregates: a pattern mező bővítése —
   stability, stabilityNote, unstableAxes (tengely-címkékkel), és a
   styleDistances-ből a tensionAxes top-2 (név nélkül, csak darabszám+tengely,
   a "egyéni adat nem kerül vezetői üzenetbe" elv szerint). Régi pillanatképek:
   opcionális mező, guard (a trustHighlights mintája).
2) TeamReportView mintázat-fejezet: amber stabilitás-jegyzet (a TeamPatternCard
   nyelvén), confidence-badge, instabil tengelyek felsorolása "a mintázat
   kontextusfüggő" keretezéssel.
3) ÚJ fejezet "Csapat nyomás alatt" (a pszich. biztonság fejezet elé):
   - bemenet: a tagok dimenzió-pólus eloszlása (≥50% high vagy low egy
     dimenzión → "koncentráció");
   - tartalom: ÚJ csapat-szintű pressure-készlet a src/lib/profile-content.ts
     SOLO_DIM_PRESSURE mintájára — 12 tétel (6 dim × pólus), de többes számú,
     kollektív keretezéssel (pl. THOR-high koncentráció → "nyomás alatt a
     kontroll-igény összeadódhat: több ellenőrzés, lassuló átadások"), HU+EN,
     hipotézis-nyelven, 1 akció-mondattal zárva;
   - max 3 állítás, a legerősebb koncentrációk szerint; forrás-jegyzet
     ("önértékelésekből becsült kollektív minta");
   - a narratíva-prefill (buildDraftNarrativePrefill) kapjon 1 mondatos
     összefoglalót belőle a risks szekcióba.
4) Tesztek: unit a koncentráció-számításra és a fejezet-inputra; a meglévő
   team-report tesztek bővítése a bővült aggregátumra.

ELFOGADÁS: új publikálású riportban megjelenik a stabilitás-jegyzet és a
"Nyomás alatt" fejezet; régi pillanatképek nem törnek; pnpm check + tesztek
zölden.
```

### 6.7 — D1: reflexiós utókövetés (vázlat — 4. kör előtt véglegesítendő)

```text
[6.0 guardrail]

FELADAT: Egyetlen, jól célzott reflexiós érintés a kitöltés után 7 nappal, a
meglévő notification-hub + sweep infrastruktúrán (ma a sweep.ts bekötetlen
placeholder; a user a RESULT_READY után soha többé nem hall felőlünk).

1) src/lib/notifications/types.ts: új típus REFLECTION_PROMPT (kategória:
   assessment); role-aware címzés a meglévő minta szerint.
2) src/lib/notifications/sweep.ts: valódi sweep-lépés — azok a userek, akiknek
   a legutóbbi self-eredménye 7-10 napja készült ÉS még nem kaptak
   REFLECTION_PROMPT-ot (dedupe-kulcs a hub meglévő mechanizmusával):
   in-app értesítés + e-mail (lib/emails.ts új sablon, HU+EN).
   Tartalom: 1 reflexiós kérdés a user legmarkánsabb dimenziójának
   SOLO_DIM_PRESSURE / insight szövegéből származtatva + 1 CTA (ha nincs
   completed observere: observer-meghívás; különben: /interaction).
   E-mailben opt-out link kötelező.
3) vercel.json: a sweep hívása a meglévő napi cron route-ból (a release-steps
   mellé/mögé — döntsd el a route-szerkezetet a meglévő minta szerint).
4) Tesztek: unit a kiválasztási logikára (7-10 napos ablak, dedupe, opt-out),
   a sablon mindkét nyelvére.

ELFOGADÁS: a jogosult user pontosan egyszer kap reflexiós érintést; opt-out
működik; pnpm check + test:unit zöld.
```

---

## 7. Nyitott döntések (a te jóváhagyásodra)

- [ ] **0. kör most:** a P0-javítások mehetnek-e azonnal (külön PR-ekben, a 6.1
      és 6.2 promptokkal)? *Ez nem Lumina-kérdés, hanem pilot-készenlét.*
- [ ] **1. kör a pilot előtt:** A1 (vendég-teaser) + A2 (OG-kép) beférjen-e a
      szeptember 8. előtti sávba? (Javaslat: igen — a pilot-szervezetek tagjai
      is ezen a funnelen jönnek be.)
- [ ] **A1 hatóköre:** elég-e a glyph + archetípus-név + 2 chip, vagy mutassunk
      dimenzió-sávokat is? (Javaslat: a szűkebb — az érték-ígéret maradjon a
      teljes riportnál.)
- [ ] **B1 időzítése:** pilot alatt (tanácsadói demó-érték) vagy pilot után?
- [ ] **C2 tartalom:** a csapat-pressure készlet hangneme/példái rendben
      (hipotézis-nyelv, max 3 állítás)?
- [ ] **D1:** kell-e most, vagy pilot utánra? (A pilot-szervezetekben a
      kampánymotor amúgy is ütemez — D1 elsősorban az organikus/self-serve
      userek retencióját szolgálja.)
- [ ] **Backlog-sorrend:** E1 (interjúkérdés) előrehozása, ha a career fake door
      „interview" kereslet-adata erős?

## 8. Változásnapló

| Dátum | Esemény |
|---|---|
| 2026-08-04 | v3: teljes újravizsgálat a consulting_cleanup → main merge után; v1–v2 semmissé téve |
| 2026-08-04 | Végrehajtás a `tritanium` branchen: P0.1–P0.5 + A1 + A2 + C1+C2 + B1 + D1 (ld. changelog/2026-08-04.md); P0.6 már korábban lezárva; A3 kihagyva (opcionális) |

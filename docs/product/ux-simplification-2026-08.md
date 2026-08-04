# UX-egyszerűsítés — teljes folyamat-audit és megvalósítás (2026-08-04)

> **Cél:** a teljes élmény „egyszerű és tökéletes, sallangmentes" — Lumina Spark-i
> vezetett, rétegzett feltárás (egyszerre egy dolog, mélység igény szerint), a
> Trita design-tokeneken belül, vizuális redesign nélkül.
> **Módszer:** két teljes kód-alapú UX-audit (publikus tölcsér + belépett élmény
> és társas hurkok), 40 lelet file:line evidenciával. A státusz-oszlop mutatja,
> mi valósult meg MOST a `tritanium` branchen, és mi került indoklással backlogra.
> **Kapcsolódó elmaradás beépítve:** riport-javítási terv P1/1.1 (ál-percentilis) —
> a logika már ki volt vezetve, a render-lánc és a landing-badge még élt.

## Visszatérő gyökérok

A flag-átállások (`isConsultingLed`, `SELF_PAYWALL_ENABLED=false`,
`CAREER_MODULE_READY=false`) egész ágakat némítottak el úgy, hogy a környező
tartalom nem lett újratervezve: az oldal kiszámol és leküld olyan iránymutatást
(journey next-step, growth-tartalom), amit soha nem mutat meg. A mostani kör
ennek a láthatatlan súlynak a nagyját eltávolítja vagy megmutatja.

## A) Publikus tölcsér (landing → /try → kitöltés → claim → onboarding)

| # | Lelet (evidencia) | Javítás | Státusz |
|---|---|---|---|
| A1 | Onboarding „Vissza" gomb halott: `setStep(2)` a 2. lépésen (`OnboardingClient.tsx:468`) — elütést csak újratöltéssel lehet javítani | `setStep(1)` | ✅ KÉSZ |
| A2 | Claim „Újra" gomb nem indít újra semmit → örök spinner 60 megválaszolt kérdéssel (`try/claim/page.tsx:76-84`) | retry-nonce a dep-listába | ✅ KÉSZ |
| A3 | „azonnal megtekintheted" ígéret után 5 képernyős fal (auth→claim→onboarding 2 lépés→dashboard) | claim-út újrarendezése: eredmény előre, onboarding utána/összevonva | ⏳ BACKLOG (M — flow-átrendezés, pilot után) |
| A4 | Időbecslés önellentmondás: landing ~10 perc (9 mp/item) vs. teszt-fejléc 15 mp/item → „~15 perc" az 1. kérdésnél (`AssessmentClient.tsx:116`) | egy konstansból: `estimateAssessmentMinutes` | ✅ KÉSZ |
| A5 | Vendégnél „✓ Mentve" badge, miközben csak localStorage-ba ment (`:635-637`) | vendégnél „Mentve ebben a böngészőben" | ✅ KÉSZ |
| A6 | 3–4,6 mp SZÁNDÉKOS kamu „kiértékelés" várakozás (`:358-361`, `:391-394`) — a sallang definíciója | ~700 ms-ra vágva | ✅ KÉSZ |
| A7 | A fő „Tovább" gomb random kiszürkül autosave alatt (`:811`) | `isSavingDraft` ki a disabled-ből (fire-and-forget) | ✅ KÉSZ |
| A8 | 3 kényszer-interstitial (25/50/75%) saját gomb nélkül | 1 milestone + saját „Folytatom" gomb | ⏳ BACKLOG (S — dramaturgia-döntés) |
| A9 | „Kiértékelés" némán visszateleportál az első kihagyott kérdéshez (`:331-335`) | highlightMissing + jelzés | ✅ KÉSZ |
| A10 | Minden self-serve user átpattan a team-roles oldalon, ami csak visszadobja | handoff-path közvetlenül | ⏳ BACKLOG (S — journey-mellékhatás tesztelendő) |
| A11 | Kétlépéses onboarding, ahol a 2. lépés EGY checkbox (`:422-485`) | egy képernyő, consent a submit felett | ⏳ BACKLOG (M — auth-flow teszt kell) |
| A12 | Billentyű-gyorsítók (1–5, Enter) és auto-advance léteznek, de sehol nincsenek elmagyarázva (kulcsok megírva, nem renderelve) | hint-ek renderelése | ✅ KÉSZ |
| A13 | Kész-de-nem-regisztrált vendég a 60. kérdésre esik vissza a „Folytasd" CTA-ról | teljes draftnál /try → /try/complete átirányítás | ✅ KÉSZ |
| A14 | /try/complete félkész draftnál is ünnepel, teaser némán tűnik el | ünneplés csak teljes draftnál; félkésznél „folytatom" állapot + válasz-átnézés link | ✅ KÉSZ |
| A15 | Team-mód: history-szennyező toggle (push), nem perzisztens, 3 különböző team-CTA | router.replace + mode-aware fejléc-CTA | ✅ RÉSZBEN (replace kész; fejléc-CTA + perzisztencia backlog — useSearchParams a globális navban CSR-bailout kockázat) |
| A16 | Onboarding progress 100%-ot mutat a befejezetlen utolsó lépésen | step/2 formula | ✅ KÉSZ |
| A17 | Üres krém-képernyő amíg a localStorage feloldódik (`:521-523`) | brand-spinner | ✅ KÉSZ |
| A18 | NavBar CTA-címke render-időben olvas localStorage-t → hydration mismatch | useEffect-minta (mint a landingen) | ✅ KÉSZ |
| A19 | `hasAssessmentDraftInStorage` némán elnyeli a `scope` argumentumot | scope továbbadása | ✅ KÉSZ |
| A20 | Journey-szövegek belső zsargonban és i18n-en kívül („observer", „insight", „journey") | i18n + köznyelvi magyar | ✅ KÉSZ (nyelvi kör: journey-szövegek köznyelvire) (2. feladat) |

## B) Belépett élmény + társas hurkok

| # | Lelet (evidencia) | Javítás | Státusz |
|---|---|---|---|
| B1 | A teljes riport egyetlen scroll, térkép nélkül (~15 blokk, `ProfileTabs.tsx:1030-1085`) | szekció-ugró sáv + WorkStyle expander | ⏳ BACKLOG (M — IA-átrendezés, pilot-riportokkal együtt) |
| B2 | A growth-tartalom legenerálódik, de CSAK a PDF-be kerül; árva GrowthFocus/BlindSpotAnalysis komponensek | „Fejlődési fókusz" szekció a képernyőn | ✅ KÉSZ (GrowthFocus bekötve) |
| B3 | Next-best-action kártya SOHA nem renderel (consulting-led gate mindig igaz) — az egész journey-számítás holt súly | a next-step sáv feltétel nélkül, consulting-safe céllal | ✅ KÉSZ |
| B4 | Ugyanaz az insight-szöveg 4× a hajtás felett (hero chips, InsightPair, strip, accordion) | InsightPair eltávolítva — az accordion a próza gazdája | ✅ KÉSZ |
| B5 | Observer-CTA zsákutca org-tagoknak: cselekvésre hív, majd közli, hogy nem lehet | CTA elrejtve locked flow-nál | ✅ KÉSZ |
| B6 | A share-modal megnyitáskor legyártja a publikus linket + a preview alulkommunikálja a megosztott tartalmat | link csak első másolás/küldéskor + „ezt fogja látni" lista | ✅ KÉSZ |
| B7 | /interaction egyetlen belépője a riport legalja; nav-ban nincs | nav-elem + látható belépő | ✅ KÉSZ (nav-elem) |
| B8 | Két halott gomb a locked állapotokban (visszakapcsolt paywallnál azonnal élesedne) | /contact-ra kötve | ✅ KÉSZ |
| B9 | A két legnehezebb dynamic oldalnak (results, interaction) nincs loading boundary-je | skeleton loading.tsx mindkettőre | ✅ KÉSZ |
| B10 | /interaction néma redirect eredmény nélkül (email-ből érkezőnek magyarázat nélkül) | StatePage a redirect helyett | ✅ KÉSZ |
| B11 | Archetípus-választó: 30 kombináció egyszerre, előre kitöltött idegen elemzéssel | rétegzett feltárás (második mező választás után) | ⏳ BACKLOG (M) |
| B12 | Két szomszédos szekció neve „szerep" (RoleFit vs Csapatszerep) | címek megkülönböztetése | ✅ KÉSZ (nyelvi kör: „Munkakör-illeszkedés") |
| B13 | Az interakció-oldal a CTA-kártya szövegét ismétli intro-ként; a megírt intro halott kód | interactionIntro használata | ✅ KÉSZ |
| B14 | Invite-form menet közben átcímkézi magát (colleagues fetch után) | stabil cím + skeleton | ⏳ BACKLOG (S) |
| B15 | Comparison üres-állapot CTA teljes router-navigáció ugyanarra az oldalra | scroll-to-anchor | ✅ KÉSZ |
| B16 | Notification-panel: dismiss undo nélkül; üres állapot akció nélkül | üres állapotba next-step sor (undo backlog) | ✅ RÉSZBEN |
| B17 | Ál-percentilis: logika kivezetve, de a render-lánc + PDF + i18n kulcs + landing „Top 25%" badge még él | teljes kivezetés; landing-badge valós állításra cserélve | ✅ KÉSZ |
| B18 | Nav-címkék hardcode magyarok bilingvális felület körül | i18n-esítés | ✅ KÉSZ (nyelvi kör: nav.* szótár) |
| B19 | 2 tabhoz túlméretezett tab-gépezet (scroll-fade, auto-center, router.push ugrás) | egyszerű szegmens-gombok | ⏳ BACKLOG (S — vizuális regresszió-teszt nélkül kockázatos) |
| B20 | Observer-kitöltés: idő előtti figyelmeztetés + a záró CTA címkéje nem oda visz, ahova mutat | figyelmeztetés csak blokkolt indításnál; CTA-címke javítva | ✅ KÉSZ |

## Megvalósítási jegyzetek

- Minden változás a meglévő tokenekkel (cream/ink/bronze/sage/sand, szerep-
  tipográfia, Button/TextField primitívek); új vizuális elem nem került be.
- A backlog-tételek indoklása a táblában; a „NYELVI KÖR" jelölésűek a 2. feladat
  (nyelvi-pszichológiai átírás) természetes részei, ott készülnek el.
- Verifikáció a kör végén: `pnpm check`, unit + client suite, production build.

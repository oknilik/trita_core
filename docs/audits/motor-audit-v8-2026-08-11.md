# Motor-audit v8 — vak kör a v7-javítások után (2026-08-11)

> **Módszer:** hat, egymásról nem tudó elemző, KIZÁRÓLAG a kód alapján (a korábbi
> auditok doksija tiltva), egy-egy motor-szeletre. Az osztályozás
> (`[CODE]` / `[STRUCTURAL]`) és a ledgerhez mérés a szintézis lépésben történt,
> nem az elemzőknél — így az elfogulatlanság megmarad.
> Ledger: `motor-known-residuals.md`. Konvergencia-szabály: egy kör akkor
> konvergált, ha **nulla új kód-szintű bugot** ad.

## Verdikt

**A kör NEM konvergált — de nem regresszió miatt.** A v7 deliverable-jei állnak;
minden új lelet egy MÁSIK testvér-felület volt, amit az adott osztály-szintű
döntés még nem érte el. 13 új `[CODE]` tétel javítva ebben a körben.

## Amit a vak szem MEGERŐSÍTETT (a v7 munka áll)

| Terület | Független megerősítés |
|---|---|
| HEXACO-címkék | A nyers dimenzió-kódok (INTE/RESO/TEMP/ADAP/THOR/OPEN) SEHOL nem jelennek meg user-facing szövegként. A TSX-ben maradt literálok kizárólag objektum-kulcsok, sorrend-tömbök, React `key` propok és defenzív `?? code` fallbackek. Ellenőrzött felületek: results, team, org, manager, hiring, landing, try, profile, blog, patterns, PDF. |
| Hero-CTA-k (self/team/org/hiring) | Mind a négy variáns CTA-ja látható és kontraszt-helyes (sötét kitöltés + fehér szöveg, vagy világos `theme.primary` + `text-on-accent`). Nem maradt láthatatlan vagy rossz színű gomb. |
| Márkanevek | „Belbin" csak kód-kommentben; „TRITAN"/„Tritan" mint márka nincs user-copyban. |
| Scoring/type-mag | Reverse-scoring (item-szintű `6 − value`), `DIFF_MIN_GAP = 15` (a kérdésbankból újraszámolva: 58 item → SEM≈10.36 → √2·SEM≈14.65 → 15), determinisztikus rangsor, hedge-kapuk, NaN/üres-input védelem — tiszta. |
| Anonimitás-padlók | Minden padló a kanonikus `MIN_RATERS_FOR_ANONYMOUS_AGGREGATE = 3`-ra oldódik (observer-reveal, peer-szerep, trust, dossier, psych-safety) — nincs eltérő konstans, nincs off-by-one. |
| Hozzáférés-kontroll | LAST_ADMIN + konzultáns-kizárás, IDOR-ownership ellenőrzések, token-join email-illesztés, Clerk-webhook Svix-aláírás, konzultáns-only mérési felületek — tiszta. |
| A v8 elején javított A1/A2 | A `shareToken` visszavonása és a profil-tombstone függetlenül visszaigazolva („no orphaned public exposure"). |

## Az ÚJ kód-réteg (mind javítva)

### Téma A — RESO (Emocionalitás) valencia-inverzió (osztály-szintű)

A RESO fordított irányú: **alacsony = érzelmi stabilitás, ami nem hiányosság.**
Három felület nyers magas/alacsony alapon osztott erősség/kockázat címkét:

1. **`team-report.ts` (HIGH)** — a legalacsonyabb csapatátlag a `risks` blokkba
   került `getWatchAreaInsight`-tal. RESO-nál ez kettősen hibás: a szöveg a MAGAS
   pólust írja le, de csak akkor tüzel, ha a dimenzió a LEGALACSONYABB — tehát
   affirmatívan fordított. Egy nyugodt, stabil csapat „kockázatként" látta a
   stabilitását.
2. **`team-insights.ts` — `generateTeamSummary`** — a „legalacsonyabb csapatátlag …
   érdemes megnézni, hogy a szerep igényeihez ez elég-e" mondat a stabilitást
   kérdőjelezte meg.
3. **Jelölt-összegző (`hiring/[orgId]/candidates/[inviteId]`)** — RESO-alacsony a
   narancs „figyelendő", RESO-magas a zöld „erősségek" panelbe került: fordított
   döntéstámogatás a felvételi folyamatban.

**Javítás:** RESO kizárva a valenciás erősség/figyelendő válogatásból mindhárom
helyen (ugyanaz a minta, amit a `workstyle-content.ts` az egyéni prózában követ).
A pólus-tudatos dimenzió-szöveg változatlanul, helyesen jeleníti meg.

### Téma B — ± szám a felületen (a 2026-08-11 döntés testvér-felületei)

1. **`i18n/landing.ts` (HIGH, publikus)** — a landing team-hero kiírta:
   „Csapatátlag **± szórás**" / „Team average **± spread**". A testvér
   (`org.ts` `stdDevHint`) már tisztítva volt, ez kimaradt.
2. **`team-intelligence.ts` (MEDIUM)** — a `dimension_spread` („(N pont)") és a
   `leader_team_mismatch` („(N, illetve M pont)") `reason` szövege még számot
   hordozott, miközben a `cohesion_risk` sibling már tisztított volt. A `reason`
   szó szerint renderel a konzultánsi intelligence-tabon.

**Javítás:** a számok kikerültek, a kiváltó logika (szórás/delta küszöb) változatlan.

### Téma C — GDPR-törlés kiterjesztés

A scrub **tombstone-t** csinál (nem sortörlést), ezért az FK `SetNull`/`Cascade`
soha nem tüzel — csak a kézzel érintett táblák tisztulnak. Kimaradt:

- **`Inquiry`** — a kapcsolat-űrlap saját `name`/`email`/`company`/szabad-szöveges
  `message` mezői. Auto-linkelnek a profilhoz ÉS az orghoz, és az org-oldalon a
  konzultáns, illetve a platform-admin visszaolvassa. A törlést kérő ember neve,
  emailje és üzenete bent maradt, staff számára olvashatóan.
- **`CandidateInvite`** — a jelöltként felmért ember `email`/`name` mezői.

**Javítás:** mindkettő redaktálva (profil-id VAGY case-insensitive email szerint);
a score pszeudonimizálva marad az anonim aggregátumhoz. Integrációs teszt fedi.

### Egyedi leletek

| # | Súly | Hol | Mi volt | Javítás |
|---|---|---|---|---|
| 1 | MED | `InvitationsTab.tsx` | A kliens a COMPLETED meghívókat is beszámolta az 5-es keretbe, a szerver csak a függőket → 5 kitöltött válasz után a kérő-űrlap véglegesen eltűnt, holott a szerver elfogadta volna | függő-alapú kapu a közös `OBSERVER_INVITE_MAX_ACTIVE`-val |
| 2 | LOW | `member-dossier.ts` | `computeObserverAverage` 1–2 értékelőből is kiadott dimenzió-átlagot (csak a KÉSZLET-számra kapuzott), míg a facet-sibling per-értékre kapuz → padló alatti felfedés | per-érték `DOSSIER_OBSERVER_MIN` (a régi viselkedést rögzítő unit-teszt az anonimitás-szemantikára frissítve) |
| 3 | LOW | `api/team/[id]/pattern` | hiányos score-JSON-nál `dims.INTE` dereferencia → az egész endpoint 500-azott | a tag kihagyása (mint a `team-stats.ts` loaderben) |
| 4 | LOW | `career/engine.ts` | a H-padlós komponens is kiváltotta az „above-target" jelzést — ugyanarra a dimenzióra egyszerre „a magas H itt nem hátrány" ÉS „a cél fölött vagy" | H-padlós komponens kizárva a jelzésből |
| 5 | LOW | `candidate-credits.ts` | `useCredit` „race-safe"-nek dokumentálta magát, de check-then-act volt → két párhuzamos hívás 1-es egyenlegen −1-re vitte, mindkettő „sikerrel" | a `> 0` őr magára az UPDATE-re került (feltételes írás) |
| 6 | LOW | `fakedoor/report.ts` | `emailRate` az ÖSSZES opt-int osztotta a csak-igen bázissal → 100% felett is mehetett, felfelé torzítva a kereslet-becslést | a számláló az igen-kohorszra szűkítve |
| 7 | LOW | `results/page.tsx`, `questions/tritan.ts` | a facet-megjegyzés „≥2 értékelőt" írt (a kód 3-at kényszerít); a TSFI-config leírása a tiltott „HEXACO-alapú" megfogalmazást hordozta (nem renderelt, de egy wiring-változásra volt a felülettől) | megjegyzés javítva; „Hatfaktoros, validált…" |
| 8 | LOW | `team-intelligence.ts` | a vezető-csapat összevetés bázisa TARTALMAZTA a vezetőt → a delta tompult (kis csapatban a vezető a bázis negyede) | bázis a nem-vezető tagokból |

## `[STRUCTURAL]` — ledgerhez rendelve (nem új bug)

- **W1 differencia-támadás — ÚJ RÉSZLET, ugyanaz a gyökér.** A dimenzió-átlag mellett
  a FACET-átlag (~24 egyenlet betöltésenként) is újraszámol; ez a csatorna élesíti az
  egy-nevesített-rater visszafejtését, és a korábbi mitigációs jegyzetek csak a
  dimenzió-átlagot említették. A javítási irány ugyanaz (snapshot + kvantálás), de a
  facet-rétegre is ki kell terjednie. **Pilot-kalibrált termék-döntés.**
- **W2 kijelentkezett self-submission.** Változatlanul dokumentált, tudatos rés;
  a v8 megjegyzés annyit tesz hozzá, hogy a hamis „külső" adat a dossier-en át az
  org-adminhoz is eljut. Belépve zárva.
- **Org-roster email-láthatóság (ÚJ termék-döntés).** `GET /api/org/[id]` és a
  kampány-résztvevő lista bármely tagnak kiadja a tag- és a függő-meghívott
  email-címeket. A hatókör-ellenőrzés megvan, a kérdés a szándékolt nyilvánosság.
- **Kettős pólus-küszöb (65/35 vs 70/40).** Ismét felszínre jött, ledgerelt,
  pilot-kérdés.
- **Hero „legerősebb/leggyengébb" kapu `2·SEM`-et használ** a kanonikus
  `√2·SEM` helyett. Konzervatív irányban téved (alul-állít), és unit-teszt rögzíti,
  ezért döntés, nem defekt — de a megjegyzés matematikailag rosszul nevezi meg a
  különbség-hibát. Külön nevesített konstansként érdemes rendezni.

## Számok

- **Elemzők:** 6 · **összes lelet:** 21 · **`[CODE]`:** 13 (mind javítva) ·
  **`[STRUCTURAL]`:** 8 (ledgerelt/termék-döntés).
- **Regresszió a v7-javításokban:** 0.
- **Új strukturális meglepetés a validitási alapban:** 0 (nyolc kör óta stabil).
- **Tesztek a javítások után:** type-check tiszta, unit 823/823, client 148/148,
  integration 137/137.

## Következő lépés

A szabály szerint: mivel ez a kör még adott új kód-leletet, **egy újabb vak kör
indokolt** a mostani javítások után. A minta viszont erősen jelzi, hogy ami maradt,
az testvér-felület-lefedettség — nem új hiba-osztály. Ha a következő kör nulla új
kód-bugot ad, a kód-körök lezárulnak, és a **pilot** (a validitási alap
kalibrációja) jön: `scripts/research/norms-from-results.ts` +
`friction-calibration.ts` készen áll, a referencia-minta hiányzik.

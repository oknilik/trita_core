# Motor — ismert / elfogadott maradék (ledger)

> Élő dokumentum. Ez a **kanonikus alapvonal** a motor-auditok konvergenciájához:
> ami itt szerepel, az NEM „új lelet" egy következő vak körben — vagy pilot-adatot
> igényel (kóddal nem javítható), vagy tudatos termék-döntés/tervezési kompromisszum.
> Utolsó frissítés: 2026-08-11 (a v5-javítási kör után).

## Miért van erre szükség (a végtelen-kör probléma)

Négy vak audit-kör (v1–v4) után a megfigyelés: a vak elemzők **nem tévesen**
re-detektálnak — a javítások tartanak (a v4 mind a hat területen 0 regressziót
igazolt). Ami *visszatér*, az két, strukturálisan mindig jelen lévő dolog:

1. **A validitási alap** — nem-normált POMP, kézi SEM-konstansok, kalibrálatlan
   küszöbök. Egy emlékezet nélküli, kód-alapon ítélő elemző ezt **mindig** meg
   fogja találni, mert tényleg ott van. **Kóddal nem javítható** — pilot-minta kell.
2. **A dokumentált/elfogadott kompromisszumok** — pl. a W2-maradék, a kettős
   pólus/tier-küszöb. A vak szem újra felhozza, mert nem ismeri a korábbi döntést.

Ez a ledger ezt a kettőt rögzíti, hogy a következő kör **szintézise** ehhez
mérhessen, és a valóban ÚJ, kód-szintű bugokat elkülönítse.

## Konvergencia-szabály (a megállási feltétel)

Egy vak audit-kör **konvergáltnak** számít, ha — a leleteit ehhez a ledgerhez
mérve — **nulla új, kód-szintű bugot** ad (minden lelet vagy itt szerepel, vagy
pilot-gated, vagy már-elfogadott tradeoff). Ekkor:

- A **kód-körök leállnak**. A következő lépés **NEM újabb audit**, hanem a **pilot**
  (a validitási alap kalibrációja) — mert ami maradt, azt csak adat oldja fel.
- Az auditok **teljesen vakok maradnak** (kód-alapú, a korábbi körök doksija tiltva)
  — az elfogulatlanság megőrzése miatt. A ledgerhez mérés a **szintézis** lépésben
  történik (a fő ügynök osztályozza: ÚJ-kód-bug / ledgerelt / pilot-gated), nem az
  elemzőknél.
- Új kód-bug esetén egy fókuszált javító-kör indul, **osztály-szinten** (minden
  testvér-felületet végigvezetve, nem csak az elsőn — ez volt a v4 fő tanulsága).

A ledger minden javító-kör után frissül: az újonnan elfogadott tradeoffok bekerülnek,
a megoldott pilot-tételek kikerülnek.

---

## 1. Pilot-gated validitási alap (kóddal NEM javítható — adat kell)

Az eszközök készen állnak (`scripts/research/`: norms-from-results, friction-calibration);
a referencia-minta hiányzik. Amíg nincs pilot:

- **Nem-normált POMP.** A dimenzió-pont `round(((átlag−1)/4)·100)` — 0–100-ra vetített
  nyers átlag, nem percentilis. A norma bedrótozva, kikapcsolva (`ACTIVE_NORM_TABLE = null`).
- **SEM-konstansok.** A `MEAN_ITEM_R = 0.22` és `SCORE_SD = 20` (`psychometrics.ts`)
  kézzel beállított priorok. Minden mérési-hiba-alapú belső döntés ezekből ered.
  (A ± a felületen NEM jelenik meg — ld. 4. pont —, de a belső logikát ezek vezérlik.)
- **Kettős pólus/tier-küszöb.** 65/35 (`profile-engine`, narratíva-logika) vs 70/40
  (`dimension-utils`, vizuális tier). TUDATOSAN külön mechanizmusok; a közös vágás és
  annak ÉRTÉKE pilot-kérdés. A v5 összehangolta a felületi megjelenést (a forrás-chip
  és a strip nem mond ellent), de a küszöb-értékek priorok maradnak.
- **Csapat-küszöbök.** 16-minta taxonómia (`team-pattern.ts` „kalibrálandó"), friction
  aligned/complementary 12/22, cohesion-diverzitás sávok, stability 3.75 — mind hand-set.
- **Cohesion konstrukció.** `mean((ADAP+INTE)/2)` empirikus alap nélkül; a tag-átlag
  varianciája ~1/√2-szeres — a v5 a sávokat igazíthatja, de a konstrukció validációja
  pilot-kérdés.
- **Karrier súlyok (N=0).** A rang-súlyok, a HEXACO→RIASEC leképezés (gyengén támogatott
  linkek: Realistic←THOR, Social←ADAP), az observer-cap és zaj-faktor mind priorok.
  A known-groups harness a v5-ben körkörösség-mentessé vált, de tényleges validációhoz
  mért-kérdőív párok kellenek.
- **Csapatszerep-becslő súlyok (v6).** A `team-role-estimate.ts` HEXACO→szerep súlyai
  nem-normáltak (per-szerep pozitív-összeg 0.45–0.90), ezért a szociálisan kívánatos,
  egyenletesen emelt profil strukturálisan a magas-nyereségű szerepek felé húz. Interim
  [kód]: a súlyvektorok elérhető-tartomány szerinti normálása; teljes: pilot-kalibráció.
- **Glyph-intenzitás sáv (v6).** A `type-glyph.ts` intenzitás-vágásai (25/40/62/80) egy
  HARMADIK, dokumentálatlan küszöb-család a 40/70 és 35/65 mellett — ugyanaz a
  pilot-normálás rendezi, de amíg nincs, legalább a tier-konstansokból származtatandó.

## 2. Termék-döntést igénylő maradék (nem bug — döntés kell)

- **W2 — kijelentkezett self-submission.** A külső/link-tokenre KIJELENTKEZVE beküldött
  observer-értékelést auth-mentesen nem lehet a beküldő ≠ értékelt alapon kiszűrni
  (külső tokennél nincs a beküldőhöz kötött profil). BELÉPVE zárva (403, self-guard a
  submiten ÉS a v5 óta a draft olvasásán/írásán is). Teljes zárás vagy (a) auth-kötelező
  külső-submit — a dokumentált „auth nélküli observer-flow" (CLAUDE.md) megváltoztatása —,
  vagy (b) strukturális (zajos/karantén aggregátum, pilot). **Nyitva, tudatosan.**
- **Approval-kapu org-váltással.** Egy több-org tag az aktív-org váltásával
  approval nélkül gyárthat külső meghívót; a teljes zárás kampány-scope-hoz kötött
  aggregációt igényel (modell-döntés).
- **Törölt profil demográfia-retenció.** A v5 után a törlés a PII-t (email/observer-
  kapcsolat) elvágja; a `username`/`birthYear`/`gender`/`country`/`careerBackground`
  megtartása vagy törlése kis termék/jogi döntés (a completed observer-score anonim
  aggregátumhoz kötődik).
- **ANONYMOUS observer-típus.** Definiált, de sosem gyártott enum-ág. Bekötni (nyílt
  link) vagy törölni — elnevezési/termék-döntés.

## 3. Elfogadott tervezési kompromisszumok (a vak szem újra felhozhatja)

- **Anonimitás-padló = 3** (`MIN_RATERS_FOR_ANONYMOUS_AGGREGATE`). Az observer-reveal,
  a peer-szerep, a trust-node-aggregátum, a psych-safety és a dossier alatta null-t ad.
  A szemantikailag KÜLÖN 3-asok (statisztikai elégségesség, graf-fokszám) tudatosan
  külön konstansok.
- **Becslés vs mérés.** Becsült (HEXACO-származtatott) érték csak forrás-badge-dzsel,
  a PDF-ben szám nélkül. A v5 kiterjesztette az összes testvér-felületre; ha egy jövő
  kör mégis talál egy jelöletlen becslést, az ÚJ bug (nem ledgerelt).
- **A differencia-támadás maradéka (W1).** Az observer-átlag betöltésenként újraszámol;
  a completion-értesítés anonim, a completed-lista a v5 óta nap-pontos, a `relationship`
  mező nem szivárog. A teljes zárás zajos/kvantált aggregátum → pilot.
- **A közös rangsor holtverseny-tie-breakje** (`rankDimensionScores` TRITAN_ORDER;
  a csapatszerep FNV-hash) determinisztikus és szándékos.

## 4. Mérési hiba a felületen — TERMÉK-DÖNTÉS (2026-08-11)

**A mérési hiba (±) SZÁMKÉNT nem jelenik meg a felületen.** Indok: a facet-/altruizmus-
szintű ± (~15–16 pont) elsőre riasztóan nagy, és nem szolgálja a felhasználó első
benyomását. A v5 minden numerikus ±-t / SEM-sávot / „becsült mérési hibája" jegyzetet
eltávolított a UI-ról (dimenzió-szint is).

- A **mérési-hiba fegyelem a LOGIKÁBAN él**, nem a kijelzőn: a különbség-kapuk a KÉT pont
  KÜLÖNBSÉGÉNEK hibáját használják (`DIFF_MIN_GAP = round(√2·SEM) = 15`,
  `diffStandardError`), nem az 1×SEM-et — így ott NEM állítunk sorrendet/címkét, ahol a
  delta a hibán belül van (a próza is főnév-only / hedge-elt). Ez szám nélkül történik.
- A felhasználónak szóló **magyarázatot** (mit jelent a mérési hiba, miért nem
  pont-pontos a kép) egy **külön, központi leírás** adja majd — TBD (a termék-tulaj írja).
  Amíg nincs, a UI nem kommunikál ±-t.
- **Következmény a jövő auditokra:** ha egy vak kör azt jelzi, hogy „a facet ± nélkül
  jelenik meg" vagy „a mérési hiba nincs kivezetve", az **NEM új bug** — ez a döntés.
  Ha viszont egy ±-szám valahol MÉGIS megjelenik a UI-n, az regresszió (ÚJ bug).
- **Nyitott al-döntés (v6):** a karrier-modul (parkolt) még kiír egy numerikus
  konfidencia-sávot (`bandLow–bandHigh%`). Vagy a fő ±-döntés kiterjed rá (le a
  felületről), vagy a karrier tudatosan kivétel — ez egy tisztázandó termék-al-döntés,
  nem új bug.

---

## Változásnapló (a ledger frissítései)

- **2026-08-11 (v6 után):** a hatodik vak kör (6 elemző) MINDEN struktúrális leletét
  ehhez a ledgerhez rendeltük — 0 új struktúrális meglepetés (a validitási alap
  konvergált). Hozzáadva: csapatszerep-becslő súlyok (§1), glyph-intenzitás sáv (§1),
  karrier konfidencia-sáv ±-al-döntés (§4). A v6 új KÓD-rétege külön dokumentumban:
  `motor-audit-v6-2026-08-11.md` (egy v7 kód-kör bemenete). A konvergencia-szabály
  szerint: a struktúra kész, a kód-oldal még egy fókuszált kört igényel.
- **2026-08-11 (v5 után):** ledger létrehozva. A v5 lezárta: a v3-fixek testvér-
  felületeit (W6 case-insensitive + CANCELED + Clerk-webhook közös scrub; W1 nap-pontos
  + `relationship` drop; csapatszerep badge/exact/scope; S3-próza), a privacy-réteget
  (karrier observer-blend gate, külső draft self-guard, role-round GET guard, dossier
  org-scope), a RESO fordított orientációt, a HowYouWork slot-hibát, a nulla-sentinelt,
  a SE(diff) kaput, a karrier struktúrát (known-groups composite, scoped bázis), és a
  ± eltávolítását a felületről. A fenti 1–4. pont a MARADÉK, ami nem kód-kérdés.

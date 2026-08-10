# 2026-08-10 — motor-audit v2 javítási kör

A `docs/audits/motor-audit-v2-2026-08-10.md` (vak újra-vizsgálat) leleteinek
javítása: 5 élő bug, 7 biztonsági/hozzáférési lelet, a csapat-réteg statisztikai
fegyelme, a karrier-motor mélyrétege, és a konszolidáció. Minden ellenőrzés
zöld: `pnpm check` PASS · unit 733 · client 121.

## Élő bugok

- **Vendég-teaser Altruizmus-szivárgás**: a `/try/complete` a rangsorból kiszűri
  az interstitiális `I` skálát (`computeGuestTeaserScores` csak a 6 kanonikus
  dimenziót rangsorolja) — nincs többé üres glyph vagy „I × …" felirat.
- **Ideális-környezet tábla**: a `getEnvRows` strukturált sorokat ad (stabil
  `key` + `level`), a megjelenítő a marker-pozíciót és a pólus-feliratokat
  kanonikus kulcsból oldja fel — az EN üres pólusok és a RESO-sor fordított
  jelölése megszűnt.
- **Ragadós kitöltési zsákutca**: a szerver-piszkozat a kiszolgált kérdés-id
  halmazra szűrve kerül a state-be (mint az observer-kliens) — a formán kívüli
  id-k nem okoznak hamis „kész" állapotot vagy 400-as submitet; a cross-tab
  storage-kulcs is konzisztens.
- **Hiring csapatátlag-jelölő** + **org HEXACO-átlag**: a törött Tailwind-osztály
  javítva (látható a tüske), az org-átlag a legutolsó kitöltésből számol
  (`orderBy` a `distinct` előtt).

## Biztonság / hozzáférés

- **Candidate csapatszerep-route**: a kanonikus `isValidTeamRoleSelectionSet`
  (a „pontosan 3 kiemelt" szabállyal) — nincs többé 4 szerep 100%-on.
- **Jóváhagyás-kapu**: a token-életciklus külön `awaiting_approval` állapotot ad;
  a submit 403 `INVITE_NOT_APPROVED`-dal utasítja el; az observe-oldal
  „jóváhagyásra vár" állapot-kártyát mutat (nem a kitöltő űrlapot).
- **Self-submission tiltás**: a meghívó nem küldheti be a saját „külső"
  értékelését (403 `SELF_SUBMISSION`, minden observer-típusnál).
- **Fiók-törlés (GDPR)**: a törléskor a törölt userhez tartozó függő
  (`PENDING`/`AWAITING_APPROVAL`) observer-meghívók lezárva/anonimizálva (token
  érvénytelen, reminder leáll); a lezárt aggregátum megmarad.
- **Rate-limit + méret-korlát**: `checkRateLimit("api")` + `answers .max` a
  claim-guest / observer-submit / candidate-submit endpointokon.
- **Differencia-támadás (részleges)**: a self-serve observer-reveal küszöb
  n≥3-ra emelve; a completion-értesítés anonim (nincs rater-név). A maradék
  kockázat (aktív differenciálás lapozások közt) kis-N 360-nál nem zárható
  teljesen — kód-kommentben dokumentálva.

## Csapat-réteg

- **Bessel-korrekciós közös szórás** (`src/lib/stats/dimension-stats.ts`) — az öt
  populációs-SD implementáció helyett torzítatlan mintaszórás. A szórás n=3–8-nál
  ~10–18%-kal magasabb; a küszöbök változatlanok (kalibráció = pilot).
- **`disconnected` trust-él már nem súrlódás** — a kapcsolat hiánya kimarad, nem
  növeli a frictionShare-t.
- **„aligned = bizalom" de-konfláció**: a magas aligned-arány MÉRT bizalomból
  pozitív bizalmi erősséget ad, nem „homogén profil / közös vakfolt" szöveget
  (az csak profil-becslésből jön).
- **Coverage-tudatos adatminőség**: „elégséges" csak ≥3 kitöltés ÉS ≥50%
  lefedettség mellett (3/50 → „részleges").
- **Kampány-scope**: egy csapat aktív kampánya csak a rá célzott lehet
  (`getCampaignTeamIds`) — a cross-team szivárgás megszűnt. Az üres `teamIds` =
  „nincs cél-csapat" (nem org-wide), ellenőrizve — a szűrés helyes.
- **Egységes él-forrás-számláló** (`isMeasuredDynamicsSource`, trust_round ∪
  observer) + halott-kód takarítás (topDim/bottomDim, daysActive, GRADE_LABELS,
  StyleDistance.deviations, getDimensionInsight, Big-Five „N" blokk).

## Karrier-motor (parkolt; hiring-ág + API él)

- **Diversify rang-monotonitás**: a diverzifikált lista rang szerint rendezve tér
  vissza — a `clusterByOverlap` nem kap negatív gapet.
- **Scoped mód**: a low-differentiation felező itt is érvényes; az ipari
  evidencia egyszer számít (a duplikált +5 kivezetve, max +17 → +12).
- **Licenc-caveat**: a `specialized` (engedélyköteles) szakmák mindig kapnak
  licenc/kamarai jelzést (a `CareerResults` a `licence-ready` flag alapján
  chipet mutat), akkor is, ha a végzettség „elég".
- **Szerver-oldali RIASEC-teljesség**: „measured" csak hiánytalan 6-betűs
  vektorból; parciális → tags/estimated (route 400 `RIASEC_INCOMPLETE`).
- **`/api/career/fit` kapuzva** `CAREER_MODULE_READY` (+ org-hide) mögé — 404,
  amíg a feature „nem létezik".
- A súlyok priorok (N=0 kalibráció) — a kalibráció a pilot után esedékes.

## Konszolidáció

- **Anonimitás-reveal küszöb** egyetlen kanonikus konstansból
  (`MIN_RATERS_FOR_ANONYMOUS_AGGREGATE`, `src/lib/anonymity.ts`); a 4 domain-nevű
  alias és az org-átlag kapuja hivatkozik rá. A szemantikailag különböző 3-asok
  (statisztikai elégségesség `MIN_INTELLIGENCE_ASSESSMENTS`, graf-fokszám
  `ALIGNED_HUB_MIN_DEGREE`) tudatosan KÜLÖN maradtak. A journey hármas deklaráció
  deduplikálva (`src/lib/journey/constants.ts`); a névtelen literálok elnevezve.
  Érték nem változott (mind 3), viselkedés-azonos.

## Nyitva (tudatosan)

- A csapat-réteg küszöbeinek (12/22 súrlódás, minta-küszöbök) tényleges
  RE-kalibrációja pilot-adatot igényel — a Bessel-váltás a torzítatlan becslőt
  adja, de a küszöb-értékek a pilot-normákig priorok maradnak.
- A karrier-motor súlyai kalibrálatlanok (N=0); a `scripts/research/` eszközök
  készen állnak a pilot utáni kalibrációra.
- A differencia-támadás maradék kockázata (kis-N 360) csak strukturális
  változással (fagyasztott/zajos aggregátum) zárható teljesen.

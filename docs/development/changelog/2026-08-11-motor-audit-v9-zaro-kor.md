# 2026-08-11 — Motor-audit v9: a záró vak kör és javításai

> A kilencedik (és tulajdonosi döntéssel **utolsó**) vak kód-kör, teljes
> javítási körrel. Audit-jelentés és verdikt: `docs/audits/motor-audit-v9-2026-08-11.md`.
> Ledger: `docs/audits/motor-known-residuals.md` (v9 bejegyzés).

## Miért ez volt az utolsó vak kör

A v8 még adott új kód-leletet, ezért a konvergencia-szabály szerint indult egy
újabb vak kör. A v9 hat elemzője ~40 megerősített kód-leletet hozott (8 HIGH), és
ezek egy része **nem** testvér-felület volt, hanem korábban nem auditált kódutakon
lévő valódi logikai hiba. A tanulság nem az, hogy „még egy kör kell", hanem hogy
túl sok párhuzamos render-/számítás-út van: a válasz **szerkezeti**, nem újabb audit.

Ezért a kör három dolgot zárt le egyszerre: (1) minden megerősített kód-lelet
javítása, (2) a leggyakoribb visszatérő osztály felszámolása egy kanonikus
modullal, (3) a kalibrációs út előkészítése.

## Előkészítő kör — három ismert következetlenség (`8186bf9`)

- **friction-kalibrációs script drift:** a `disconnected` él kikerült a
  konkordancia-hipotézisből és a vágás-javaslatból (a runtime `trustToDynamicsEdge`
  óta a kapcsolat hiánya nem súrlódás-jel); a leíró eloszlás-táblában marad.
- **research/stats.ts fejléc:** az elavult „a src ÷n-t használ" hivatkozás javítva
  (a `stats/dimension-stats.ts` óta ott is Bessel-korrigált szórás van).
- **hero-kapu:** a `2·SEM` nevesítve (`HERO_RANGE_GATE_FACTOR`) és a félrevezető
  komment javítva — ez **terjedelem**-statisztika hat dimenzión (max−min), nem
  páronkénti különbség, ezért szándékosan szigorúbb a kanonikus √2·SEM-nél.
  Viselkedés változatlan, +2 unit teszt rögzíti.
- **facet-kapu (~22 pont):** dokumentálva, hogy a ritka jelzés tudatos (a rövid
  formán ~2,4 item/facet), pilot-α után újraértékelendő.

## Szerkezeti lépés — kanonikus valencia-kapu

Új: **`src/lib/score-valence.ts`**. Minden „pontszám → erősség / kockázat /
fejlesztendő" besorolás ezen megy át (`deficitSlotEligible`,
`strengthSlotEligible(surface)`), a korábban legalább hat fájlban szétszórt
`!== "RESO"` literálok helyett. A felület-típus (`self` vs `evaluative`) explicit,
így a nyitott „magas Emocionalitás a saját eredmény-oldalon" termék-döntés
**egy helyen** vezethető át. Új felületen tilos kézzel RESO-t szűrni.

A következő szerkezeti lépés (külön munka, nem audit): **display-gate réteg** —
egyetlen modul minden „pontszám → címke/szín/szöveg" transzformációra.

## Javítások területenként

### Observer / 360 / GDPR
- **Kijelentkezett draft-olvasás lezárva (HIGH):** külső meghívónál a szerver-oldali
  félkész, névvel azonosítható rater-válaszok bárki számára kiszolgálódtak, aki
  birtokolta a tokent — így az értékelt a saját meghívó-linkjén elolvashatta a
  kolléga folyamatban lévő válaszait. Új `observer/draft-cookie.ts`: HMAC-SHA256
  a meghívó azonosítójára, meglévő szerver-titokkal, httpOnly/sameSite=lax,
  token-lejárathoz kötve — a draft csak a rögzítő böngészőnek megy vissza.
- Dossier és manager-cockpit observer-időbélyegek **nap-pontosra** vágva; a
  cockpit feed **kampány/org-scope-olt** (a privát, nem-org visszajelzés nem
  szivárog a vezetői nézetbe).
- **GDPR-scrub kiterjesztés:** `TeamPendingInvite`, `OrganizationPendingInvite`,
  `ConsultantInvite` törlés, `FakeDoorResponse` PII-redakció, és a már kiküldött
  értesítések `vars` mezőinek (név/email) redakciója.
- Draft POST/DELETE a kanonikus token-lifecycle kapun (lejárt PENDING token nem
  írhat); `observerSuspectCount` csak a 3-as padló felett; `/api/observer/link`
  rate-limit + inviter self-guard.

### Csapat-dinamika
- **Trust-hub / „beágyazatlan tag" irány-szemantika (HIGH):** a címkék a csomópont
  KIMENŐ értékeléseiből is számoltak, rater-minimum nélkül, és névvel kerültek a
  publikált riportba — két teammate szigorú értékelése önmagát bélyegezte
  „beágyazatlannak". Mostantól csak befelé-evidenciált élekből.
- **Psych-safety kampány-scope (HIGH):** a pulzus csak a legacy `teamId`-re szűrt,
  így több-csapatos kampánynál a másik csapat névtelen válaszai az egyik csapat
  riportjába folytak. `getCampaignTeamIds`-alapú, egy-csapatos aggregáció.
- **Mért szerep-kitöltés bekerül a csapat-aggregátumokba** személyiségteszt nélkül
  is (eddig a lefedettségi mátrix hamis „hiányzó szerepet" jelzett, és az
  intelligencia-fül hamis prioritást emelt).
- `intelligence-data` nem fabrikál 50-eket a hiányzó dimenziókra; hub-forrás
  egységesítés (térkép = riport); valódi „vár a kitöltésre" számláló (draft-alapú);
  TeamInsights RESO-kizárás a fejlesztendő-slotból; pattern-API tanácsadói kapura
  emelve; org-átlagok `leftAt: null`; fejlődési ív helyes score-olvasás + időbeli
  bázis; „tagpár" → őszinte megfogalmazás.

### Csapatszerep
- A **becslés-ág nem megy ki önképként** a peer-összevetésbe (eddig egy TRITAN-ból
  származtatott tipp jelent meg „Te látod magadban…" verdiktként olyan tagnál, aki
  sosem töltötte ki a szerep-kérdőívet).
- Profil-státusz % valódi személyiségprofilra; `hasCompleteTritanDims` egységes
  használat; `Object.hasOwn` + mind a 9 kanonikus kód a mért ághoz; peer-upsert
  `teamId`-frissítés; halott `GET /api/team/role-round` törölve (openapi is követve).

### Karrier / hiring
- **Jelölt-meghívó org-útvonala (HIGH, élő):** „csapat nélkül" ágon a létrehozó
  aktív orgja alá került a meghívó — és később a jelölt teljes eredménye —, nem a
  hiring-oldal orgja alá. Cross-org PII-elcsúszás tanácsadói fióknál.
- **Karrier observer-blend invertálhatóság (HIGH):** a kliensnek küldött `userRaw`
  a blendelt érték volt, és mivel az observer-súly 3+ értékelőnél konstans 0,5, az
  aggregátum pontosan visszafejthető volt. `userRaw` mostantól a self-pontszám.
- H-floor egységes kezelés a fejlődési tervben; egy-forrású szint-létra
  (nincs „elérhető" + „képzés kell" egy kártyán); SE-tudatos címkék;
  szerver-oldali RIASEC-pontozás; fake-door szegmentált fizetési hajlandóság +
  profil-dedup; hiányzó rate-limitek (email-küldő route-okon is); progress
  `answeredCount` szerver-oldali clamp; `leftAt` szűrők; kredit-refund rendezés.

### Interpretáció / pontozás
- **Lapos profil hero (HIGH):** a kapu eddig csak a „leggyengébb" állítást fojtotta
  el, a „legerősebb" mondat 2 pontos, mérési hibán belüli előnyből is kiment —
  miközben ugyanazon az oldalon minden dimenzió „mérsékelt" volt. Most
  kiegyensúlyozott-profil mondat megy ki.
- **Fabrikált nulla (HIGH):** hiányzó dimenzió-kulcs valós 0-ként renderelt
  („figyelendő" badge, alacsony-pólus próza, #1 fejlesztendő terület) — a facet-
  szinten már rendezett minta most a dimenzió-szintre is kiterjed.
- Observer-konfidencia csak a reveal-küszöb felett megy a kliensnek; ideál-környezet
  hedge a 65–70 sávban; growth-intro őszinte szöveg; role-fit disclaimer a
  felületen is (nem csak PDF-ben) + a `secondary` mondat; glyph aria-label
  bizonytalansági variánsa; share metadata locale; growth-hint max 2/dimenzió;
  altruizmus valencia-mentes címke; **bank-fingerprint hash** (a provenance-pecsét
  eddig nem tudta érzékelni egy item kulcsolásának változását); facet-címke drift;
  halott aspects-út; napi sweep kanonikus rangsora; persona-fixture gap ≥ 15.

## Kalibráció — IPIP referencia (belső használatra)

Új: **`scripts/research/norms-from-ipip-dataset.ts`**. Az OpenPsychometrics
IPIP–HEXACO item-szintű nyers adatából (~22 ezer kitöltés) a **saját pontozó-
motorunkkal** számol referencia-statisztikát: dimenziónként n / átlag / minta-SD /
decilisek, **valódi Cronbach-α** és megfigyelt item-korreláció, implied SEM — a
jelenlegi priorok (`MEAN_ITEM_R=0.22`, `SCORE_SD=20`) mellé állítva, plusz
sáv-kihasználtság a 40/70 és 35/65 rendszerre.

**Termékdöntés (2026-08-11):** ez a tábla **kizárólag belső kalibrációra** való —
percentilisként nem jelenik meg, és nem kerül az `ACTIVE_NORM_TABLE`-be. A minta
nemzetközi, angol nyelvű, önszelektált online populáció; a forrás-jelölés ezt
kötelezően tartalmazza. A hazai pilot-norma marad az arany standard.
Doksi: `docs/research/ipip-reference-2026-08.md` (állapot: adatra vár — a
futtatókörnyezetben a proxy tiltja a letöltést).

## Következő lépések (nem audit)

1. Display-gate réteg megépítése (a v9 fő szerkezeti ajánlása).
2. IPIP-referencia futtatása egy letöltésre képes gépről → α/SEM/küszöb visszamérés.
3. Hazai pilot-minta gyűjtése → valódi normatábla.
4. A ledger §2 termék-döntései (RESO magas pólus a self-felületen, org-roster
   email-láthatóság, W2, küszöb-alatti darabszám, altruizmus-paritás, leave-one-out
   bázis) tulajdonosi állásfoglalást várnak.

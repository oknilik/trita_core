# Kollégai visszajelzés (peer feedback) modul — tervezési javaslat, 1. kör

> Készült: 2026-07-24. Cél: a kollégák tudjanak egymásnak visszajelzést adni
> — kampány-elemként ÉS önállóan is; az anonimitás kérdését a szakirodalom
> alapján döntjük el, nem defaultból.

## 0. Amit a kutatás mond (vezetői összefoglaló)

1. **A visszajelzés nem magától jó.** Kluger–DeNisi (1996) metaanalízise
   (607 hatásméret): a visszajelzés-beavatkozások **~harmada RONTOTTA** a
   teljesítményt — jellemzően akkor, amikor a személyre („ilyen vagy”) és
   nem a feladatra/viselkedésre irányult. Következmény: a formátumnak kell
   kikényszerítenie a viselkedés-szintet — szabad szövegdoboz helyett
   struktúra. (Ez egybevág a saját P1/P5.1 elvünkkel: viselkedéses keret,
   nem jellem-ítélet.)
2. **A jövő-irányú keretezés jobban működik, mint a múlt kritikája.**
   A feedforward-irodalom (Goldsmith; Budworth és tsai terepkísérlete):
   a „mit csinálj jövőre másképp/többet” keretezés kisebb védekezést és
   jobb utólagos teljesítmény-értékelést hoz, mint a hagyományos értékelő
   visszajelzés.
3. **A kért visszajelzés hat, a kéretlen gyakran lepattan.** A
   feedback-seeking irodalom (Ashford nyomán): amit a címzett maga kér,
   azt kevésbé védekezően fogadja és inkább hasznosítja. A jó rendszer
   ezért a KÉRÉST teszi könnyűvé, nem a kéretlen kritikát.
4. **Anonimitás: kétélű.** Növelheti az őszinteséget (főleg felfelé irányuló
   vagy alacsony pszichológiai biztonságú közegben), de csökkenti az
   elszámoltathatóságot és a konstruktivitást, megöli a párbeszédet, és
   **5–12 fős csapatban jórészt illúzió** (stílusból, példákból felismerhető
   a feladó — ami a bizalmat pont aláássa). A szervezeti gyakorlat-irodalom
   konszenzusa: a transzparens, nevesített visszajelzés építi a kapcsolatot;
   az anonimitás ott indokolt, ahol hatalmi aszimmetria vagy alacsony
   biztonság van — és ott is inkább AGGREGÁLTAN.
5. **Elismerés ≠ fejlesztő visszajelzés.** A kettő más műfaj, más
   gyakorisággal, más kockázattal — egy felületre gyúrva a pozitív elem
   inflálódik, a kritikai elem mérgesedik. Külön kell kezelni.

## 1. Javasolt modell — három műfaj, három szabálykészlet

### A) Elismerés („Köszönet/Kudos”) — nevesített, bármikor
- Bárki bárkinek, csapaton belül; NEVESÍTETT (az elismerés értéke pont a
  feladóban van), a címzett látja azonnal; opció: „csapat számára látható”.
- Struktúra: 1 mondat + opcionális címke a Trita-nyelvből (pl. melyik
  csapatszerep-viselkedést köszöni meg — OG/KE/KO… kódok) → a termékhez köt.
- Ez a belépő műfaj: alacsony kockázat, magas gyakoriság, normát épít.

### B) Kért fejlesztő visszajelzés („Kérek visszajelzést”) — a címzett kontrollál
- A címzett indítja: kiválasztja, kiktől kér, és MIRŐL (téma/kérdés, pl.
  „a meetingjeim hasznosak?”). Ő dönti el, hogy a válaszok nevesítettek
  vagy anonimok lehetnek-e — a sebezhetőség önkéntes, ez a pszichológiailag
  biztonságos hely az anonimitásnak.
- Válasz-struktúra (feedforward): „Folytasd, mert…” + „Jövőre próbáld…”
  (+ opcionális szabad megjegyzés CSAK nevesített módban — anonim módban
  nincs szabad szöveg, mert a stílus deanonimizál).
- A válaszok csak a kérőnek látszanak; nem továbbíthatók.

### C) Kampány-elem: strukturált peer-visszajelzési kör (új lépés-típus: PEER_FEEDBACK)
- Választható lépés a wizard katalógusában, a sor VÉGÉN (a bizalom a
  korábbi lépéseken már felépült; a kanonikus sorrend bővül).
- Mindenki minden csapattársának (vagy 2–3 választott társának) kitölt egy
  rövid, strukturált lapot: 1 elismerés (nevesített) + 1 feedforward-javaslat.
- **A feedforward-elem alapból nevesített.** Anonim változat csak
  aggregált formában létezik: ha a kör anonim módban fut (kampány-opció),
  akkor a címzett a javaslatokat legalább 3 beküldő esetén, összekeverve,
  tétel-listaként kapja — pontosan a peer-szerep/pulse küszöb-elvünk szerint
  (TEAM_ROLE_PEER_MIN_RATERS mintájára).
- A tanácsadó a RÉSZVÉTELT látja (ki adott/kapott), a TARTALMAT nem —
  kivéve az aggregált téma-mintázatokat a debriefhez (pl. „a csapat
  javaslatainak 40%-a a meeting-fegyelemről szól”).

## 2. Védőkorlátok (nem opcionálisak)

- Viselkedés-szintű prompt + karakterlimit; „ilyen vagy” típusú mondatokra
  finom tone-nudge a kliensben (később).
- Anonim módban SOHA nincs szabad szöveg egyéni címzettnek — csak
  strukturált/aggregált forma, n≥3 küszöbbel.
- Jelentés/moderáció: a címzett bármely elemet jelezhet a tanácsadónak;
  a feladó ilyenkor a tanácsadó felé feloldható (a consent-szöveg kimondja).
- GDPR: a visszajelzés-szöveg MINDKÉT fél személyes adata — retention
  (javaslat: kampány-zárás + 12 hónap), export/törlés útvonal.
- Nem kerül be a pszichometriai rétegbe: ez fejlesztési kommunikáció,
  nem mérés — a riportokban legfeljebb részvételi statisztika szerepel.

## 3. Adatmodell-vázlat

- `PeerFeedbackItem`: id, teamId, campaignId?, requestId?, fromUserId,
  toUserId, kind (`appreciation` | `feedforward`), visibility
  (`named` | `anonymous_aggregated`), payload (strukturált mezők),
  createdAt. Anonim elem: a fromUserId tárolva (dedupe+moderáció), de a
  felület SOHA nem mutatja.
- `FeedbackRequest`: id, askerId, teamId, topic, allowAnonymous,
  audienceUserIds, status, createdAt.
- Kampány: `steps` bővítése `PEER_FEEDBACK` értékkel + kör-opció
  (anonim-aggregált vs. nevesített mód).

## 4. Ütemezés-javaslat (fázisok)

> **Állapot (2026-07-24 este): F1–F4 IMPLEMENTÁLVA** — kudos + kérés-flow +
> PEER_FEEDBACK kampány-lépés (anonim-aggregált opcióval, max lépés 3→4) +
> részvételi statisztika és tone-nudge. Hátravan: prisma migrate a gépen,
> kézi átkattintás dev-en, éles pilot-próba tanácsadói kísérettel.

| Fázis | Mit | Becslés | Mikor |
|---|---|---|---|
| F1 | Kudos (nevesített, team-oldalról, értesítéssel) | S–M | pilot előtt belefér — a pilotban normaépítő |
| F2 | „Kérek visszajelzést” flow (címzett-vezérelt, anonim-opcióval) | M | szeptember, pilot közben |
| F3 | PEER_FEEDBACK kampány-lépés (strukturált kör, aggregált anonim mód) | M–L | október — a pilot 2. körére |
| F4 | Téma-aggregátum a debriefhez + tone-nudge | M | november+ |

A pilot 1. körében a C) műfajt előbb TANÁCSADÓI GYAKORLATKÉNT érdemes
kipróbálni (facilitált, sablonos e-mail/workshop formában) — a termékbe
azt kódoljuk, ami ott bevált.

## 5. Nyitott döntések

1. Kudos legyen-e org-szinten látható „fal”, vagy maradjon címzett-privát +
   csapat-opció? (Javaslat: v1-ben címzett-privát, láthatóság később.)
2. A PEER_FEEDBACK számítson-e bele a max 3 lépés/kampány limitbe, vagy
   emeljük 4-re? (Javaslat: emelés 4-re, mert záró elemként ül a sor végén.)
3. Vezető kapjon-e külön kört (felfelé irányuló visszajelzés)? Itt az
   anonimitás indokoltabb (hatalmi aszimmetria) — külön tervezést érdemel.

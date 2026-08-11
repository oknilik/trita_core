# Motor-audit v9 — a záró vak kör (2026-08-11)

> **Típus:** vak kód-audit (6 egymásról nem tudó elemző) + azonnali javítási kör.
> **Kontextus:** a v8 után indított kilencedik kör — a konvergencia-szabály szerint
> a v8 még adott új kód-leletet, ezért egy újabb vak kör indokolt volt. Ez a doksi
> rögzíti az eredményt és a belőle következő **tulajdonosi döntést a kód-körök
> lezárásáról**.
> **Verdikt:** a kód-szint NEM konvergált (≈40 új kód-lelet). A válasz nem újabb
> audit, hanem **szerkezeti lépés + pilot** — ld. lent.

## 1. Módszertan

A bevett vak protokoll: hat elemző, egy-egy motor-területre (pontozás ·
interpretáció · csapat-dinamika · observer/360 · csapatszerep · karrier/hiring).
Az elemzők **csak a kódot** olvashatták — a `docs/audits/`, a changelog és minden
riport-HTML tiltva —, és nem tudtak egymásról. A leleteket `[CODE]` (kóddal
javítható defekt) / `[STRUCTURAL]` (adat vagy termék-döntés kell) címkével adták,
súlyossággal, fájl:sor hivatkozással, konkrét hiba-forgatókönyvvel. A
ledger-osztályozás — mint mindig — a **szintézis** lépésben történt (ez a doksi),
nem az elemzőknél, hogy a vakság megmaradjon.

Ezt a kört megelőzte három ismert következetlenség rendezése (`8186bf9`):
a friction-kalibrációs script `disconnected`-drift, a research `stats.ts` elavult
fejléc, és a hero-kapu `2·SEM` nevesítése + a facet-kapu (~22 pont) dokumentálása.

## 2. Verdikt: a kód-szint nem konvergált

A hat elemző összesen ~40 megerősített `[CODE]` leletet adott, ebből 8 HIGH.
Fontos: **nem mind testvér-felület** volt — a v4 óta domináns „ugyanaz a szabály
kimaradt egy felületről" minta mellett ez a kör **valódi új logikai hibákat** is
hozott, olyan kódutakon, amelyeket korábbi kör nem auditált:

- **trust-háló irány-szemantika** — a „beágyazatlan tag" / „összekötő" címke a
  csomópont KIMENŐ (általa adott) értékeléseiből is számolt, rater-minimum nélkül,
  és NÉVVEL került a publikált riportba (két teammate szigorú értékelése önmagát
  bélyegzi „beágyazatlannak");
- **psych-safety több-csapatos kampány-scope** — a pulzus csak a legacy `teamId`-re
  szűrt, így egy több-csapatos kampány a MÁSIK csapat névtelen válaszait az egyik
  csapat riportjába öntötte;
- **jelölt-meghívó org-útvonala** — „csapat nélkül" ágon a létrehozó AKTÍV orgja alá
  került a meghívó (és később a jelölt teljes eredménye), nem a hiring-oldal orgja
  alá — cross-org PII-elcsúszás tanácsadói fióknál;
- **karrier observer-blend invertálhatóság** — a kliensnek küldött `userRaw` a
  blendelt érték volt, és mivel `observerWeight(n≥3)` konstans 0,5, az
  observer-aggregátum pontosan visszafejthető;
- **kijelentkezett draft-olvasás** — külső meghívónál a szerver-oldali félkész,
  névvel azonosítható rater-válaszok kijelentkezett látogatónak is kiszolgálódtak.

Emellett a szokott testvér-felület osztályok: RESO-valencia (a magas pólus az
erősség-oldalon, a deficit-oldalon már mindenhol kizárva), lapos-profil hero,
`?? 0` fabrikált nulla dimenzió-szinten, ideál-környezet 65/35 hedge nélkül,
kanonikus rangsor kimaradása a napi sweep-ben és a glyph aria-label-ben.

**Következtetés:** a validitási alap (§1 a ledgerben) nyolc kör alatt strukturálisan
stabil, DE a kód-felület még mindig ad új leleteket — mert túl sok párhuzamos
render-/számítás-út van. A konvergencia-szabály szó szerinti alkalmazása („addig
vak kör, amíg 0 új kód-bug") ezen a felület-számon még több kört jelentene, egyre
csökkenő hozammal.

## 3. Tulajdonosi döntés: a kód-körök lezárása + szerkezeti válasz

A puszta ismétlés helyett a döntés a hibaOSZTÁLY felszámolása:

1. **Kanonikus valencia-kapu — `src/lib/score-valence.ts` (ebben a körben létrejött).**
   Minden „pontszám → erősség / kockázat / fejlesztendő" besorolás ezen megy át
   (`deficitSlotEligible`, `strengthSlotEligible(surface)`), a szétszórt
   `!== "RESO"` literálok helyett. A leggyakoribb visszatérő osztály (RESO-valencia)
   ezzel egyetlen döntési ponttá válik — a nyitott „magas RESO a self-felületen"
   termék-döntés EGY helyen átvezethető.
2. **Display-gate réteg (terv).** A cél-állapot: egyetlen modul, amelyen MINDEN
   „pontszám → címke/szín/szöveg" transzformáció átmegy (tier-címke, pólus-hedge,
   forrás-badge, ± tiltás). Amíg ez nincs, a v9-ben a legfontosabb kapuk (hero,
   ideál-környezet hedge, glyph aria, growth-intro) a meglévő közös helyekre
   (`workstyle-content`, `personality-type`, `score-valence`) kötve, de a
   teljes réteg külön munka — a következő strukturális lépés, NEM audit.
3. **Kalibráció.** Az IPIP-referencia (nemzetközi, angol nyelvű online minta) BELSŐ
   kalibrációra (α, SEM, küszöbök visszamérése) — `scripts/research/norms-from-ipip-dataset.ts`
   —, majd a hazai pilot mint arany standard. Részletek: ledger §1.

## 4. Javítási kör (ebben a körben, 6 párhuzamos batch)

Minden megerősített `[CODE]` lelet javítva. Kiemelt tételek:

**Observer/GDPR/privacy:** kijelentkezett draft-olvasás lezárva (böngészőhöz kötött,
HMAC-cookie-s draft-kiszolgálás); dossier + cockpit időbélyeg nap-pontosra vágva a
padló alatt; GDPR-scrub kiterjesztve (`TeamPendingInvite`, `OrganizationPendingInvite`,
`ConsultantInvite`, `FakeDoorResponse` + notification-PII redakció); draft-lifecycle
lejárat-ellenőrzés; `observerSuspectCount` csak a padló felett; `/api/observer/link`
rate-limit + inviter self-guard.

**Csapat-dinamika:** trust-hub/izolált csak befelé-evidenciált élekből, rater-
minimummal; psych-safety `getCampaignTeamIds`-alapú, egy-csapatos aggregáció;
org-átlag `leftAt: null`; mért szerep-kitöltés bekerül a csapat-aggregátumokba
személyiségteszt nélkül is; `intelligence-data` nem fabrikál 50-eket; hub-forrás
egységesítés (map = riport); valódi „vár a kitöltésre" számláló (draft-alapú);
TeamInsights RESO-kizárás a fejlesztendő-slotból; pattern-API tanácsadói kapura
emelve; „tagpár" → „felmért kapcsolat" szöveg.

**Csapatszerep:** a becslés-ág nem megy ki önképként a peer-összevetésbe;
profil-státusz % valódi személyiségprofilra; `hasCompleteTritanDims` egységes
használat; `Object.hasOwn` + mind a 9 kód a mért ághoz; peer-upsert teamId-frissítés;
a halott `role-round` route rendezve.

**Karrier/hiring:** jelölt-meghívó a hiring-oldal orgja alá; `userRaw` = self
(blend-invertálhatóság zárva); h-floor egységes kezelés a growth-planben; feasibility
egy-forrású szint-létra; SE-tudatos címkék; szerver-oldali RIASEC-pontozás;
fake-door willingness szegmentálva + profil-dedup; hiányzó rate-limitek; progress
`answeredCount` szerver-oldali clamp; `leftAt` szűrők; kredit-refund + ledger-típus.

**Interpretáció/pontozás:** lapos-profil hero „kiegyensúlyozott" mondat; `?? 0`
fabrikált nulla megszüntetése (hiányzó dim/altruizmus elrejtése); observer-konfidencia
gate; ideál-környezet hedge a 65–70 sávban; growth-intro őszinte szöveg; role-fit
disclaimer a felületen + `secondary`; glyph aria uncertainty-variáns; share
metadata locale; growth-hint max 2/dimenzió; altruizmus valencia-mentes címke;
bank-fingerprint hash; facet-címke drift; halott aspects-út; sweep kanonikus rangsor;
persona-fixture gap ≥ 15.

## 5. Konvergencia-státusz és a következő lépés

- **Struktúra:** ✅ stabil (a validitási alap nyolc–kilenc kör alatt változatlan).
- **Kód:** a v9 után a megerősített leletek javítva; az ismétlődő osztályra
  szerkezeti válasz indult (valencia-kapu kész, display-gate réteg tervezve).
- **A kód-körök tulajdonosi döntéssel LEZÁRVA.** A következő lépés a display-gate
  réteg megépítése és a **pilot-kalibráció** (IPIP-referencia + hazai minta), nem
  újabb vak kör. Ha később egy célzott ellenőrzés kell, az a display-gate rétegre
  fókuszáljon, ne a teljes felület-mátrixra.

A teljes, elemzőnkénti leletlista és a „SOLID" megerősítések a kör munkapéldányában;
a ledgerbe sorolt tételek: `motor-known-residuals.md` (v9 változásnapló-bejegyzés).

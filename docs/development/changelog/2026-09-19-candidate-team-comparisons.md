# 2026-09-19 — Radaros jelöltprofil és többcsapatos összevetés

A jelölti riport három külön nézetet kap: Profilkép, Csapatok összevetése, Visszajelzés. A self-profil és a kijelölt csapatreferencia közös, 0–100-as radar-ábrán jelenik meg; a teljes dimenziónevek és a pontos értékek táblázatban is elérhetők. A több csapat kártyánkénti miniatűr ábrát kap. Mobilon a tartalom egy oszlopba rendeződik.

Legfeljebb nyolc különböző csapat publikált, lezárt Scan-riportja adható hozzá, ugyanabból a szervezetből. Egy csapathoz egy rögzített forrás tartozik; nincs automatikus frissítés vagy rangsor. A forrás neve, azonosítója, revíziója, publikálási ideje, elemszáma és hat személyiségátlaga kerül a snapshotba; tagszintű adat nem.

A tanácsadó csapatonként szerkeszti a Kapcsolódás, Megbeszélendő és Beszélgetésindító mezőket. Üres mező helyett nincs generált profilértelmezés. Az új és eltávolított forrás, illetve minden megállapításmódosítás új riportrevíziót hoz létre és érvényteleníti a korábbi jóváhagyást. Revízióellenőrzés és tranzakciós zár védi a párhuzamos szerkesztést. Módosult vagy visszavont forrás megállítja az új megosztást. A korábbi megosztások változatlanok; a csapatadatok és megállapítások nem kerülnek automatikusan a jelölti/megbízói kivonatba.

A visszajelzések olvasása és szerkesztése külön állapot. A nem mentett szöveg blokkolja a nézet- és csapatváltást. A kihagyott csapatszerep belső kód helyett HU/EN feliratot kap.

## Migráció

`20260919160000_candidate_team_comparisons`: nullable `CandidateReport.comparisons` JSONB. NULL az eredeti programreferenciát örökli; [] kifejezett üres lista. Az eredeti program snapshotja változatlan. Csak helyi, elkülönített tesztadatbázison alkalmazva; kiadás előtt a migráció futtatandó.

## Ellenőrzés

- 2 unit: program és snapshot-kompatibilitás, örökölt/üres/hibás referencialista.
- 3 PostgreSQL integrációs: jelölti életciklus, rögzített baseline, többcsapatos revízióütközés, duplikáció és hatókör, jóváhagyás visszavonása, módosult forrás, kivonatok adatszétválasztása.
- 5 kliens: kitöltés, mentési hiba, riport szerkesztése, csapatválasztás, nem mentett megállapítások védelme.
- 4 Chromium E2E: kitöltés, három csapat hozzáadása/váltása/annotálása és riportmegosztás, magyar asztali és mobil nézet, tiltott szervezet és ismeretlen programverzió.
- Typecheck/lint/színellenőrzés és production build. A teljes korábban hibás unit/client csomag nem lett újrafuttatva.

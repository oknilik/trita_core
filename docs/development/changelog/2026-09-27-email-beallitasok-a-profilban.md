# E-mail-beállítások elérése a profilból

Az e-mail-beállítások korábban a külön `/email-preferences` oldalon voltak
elérhetők, főként a levelek és az emlékeztetők hivatkozásain keresztül.
A profilbeállítások között nem volt hozzájuk belépési pont.

## Változás

- A profil felső szakaszmenüjében megjelent az „E-mail-beállítások” hivatkozás.
- A nyelvi beállítások alatt külön kártya mutatja be a három levélcsoportot:
  kitöltési emlékeztetők, új blogcikkek értesítői és hírlevél.
- A „Levelek beállítása” gomb a meglévő, bejelentkezést kérő oldalra vezet.
- Az e-mail-beállítások oldalán a „Vissza a profilbeállításokhoz” hivatkozás
  közvetlenül az új profilkártyához visz (`/profile#emails`).
- Minden új feliratnak van magyar és angol változata a profil szótárában.

A meglévő levéllinkek, kapcsolók és mentési végpont változatlanul működnek.

## Ellenőrzés

- `pnpm check`: sikeres.
- Egységtesztek: 1345 sikeres.
- Kliensoldali tesztek: 431 sikeres, 84 fájl.
- A profil navigációja és kártyája magyarul és angolul, 390 és 1440 px
  szélességen ellenőrizve. A célhivatkozás helyes, a gomb 44 px magas,
  az oldal nem lóg túl vízszintesen; a képi ellenőrzés is sikeres.
- Staged quality gate és diffellenőrzés: sikeres.

A böngészős ellenőrzés elkülönített helyi adatbázison, tesztprofillal futott.

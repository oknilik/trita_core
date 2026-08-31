# CRM egyszerűsítés

## Mi változott

- A CRM négy alnézete három emberi munkanézetre egyszerűsödött:
  **Teendők**, **Aktív ügyek**, **Lezárt ügyek**.
- Az új megkeresések és a mai követések egy helyre kerültek.
- A belső CRM-kifejezések helyett következetesen ügy, állapot és teendő
  szerepel a felületen.
- Az ügy részletoldala állapotfüggő összefoglalót és egyetlen kiemelt
  következő műveletet kapott.
- Az állapotváltás, lezárás, másolat, törlés és belső ajánlati mutatók
  másodlagos, lenyitható felületre kerültek.
- Az idővonal, a kapcsolatok és az üzleti összesítés alapállapotban nem
  terhelik a napi munkanézetet.
- Az üres állapotú csoportok nem jelennek meg, a későbbre tett ügyek pedig
  nem számítanak bele az aktív ügyértékbe.

## Kompatibilitás

- Az adatmodell és a CRM állapotgépe nem változott, ezért új migráció nem
  szükséges.
- A korábbi `view=today` és `view=inbox` mélylinkek az összevont Teendők
  nézetre érkeznek.

## Ellenőrzés

- TypeScript típusellenőrzés: sikeres.
- Célzott ESLint: sikeres.
- CRM kliens-tesztek: 11/11 sikeres.
- UI audit: nincs új hardcoded szín.

# 2026-09-21 — Candidate tanácsadói műhely

A csapatösszevetés háromrészes munkafelület: csapatválasztó, központi radar és a
kiválasztott csapat tanácsadói megfigyelései. Mobilon a panelek egymás alá rendeződnek.
A szövegjavaslatok szerkeszthető műhelylapokon, tág képernyőn két oszlopban jelennek meg.

A Card, Button és SectionEyebrow primitívek, a meglévő Fraunces/DM Sans betűk,
a tipográfiai szerep-utilityk és a témázható surface/radius/spacing/shadow tokenek
adják a megjelenést. A pontozott háttér is meglévő tokeneket használ; nincs új paletta,
betűkészlet vagy egyedi betűméret. Nincs szabadon húzható vagy végtelen vászon.

A jelölti belépő a ténylegesen engedélyezett lépéseket mutató áttekintést kapott;
a kérdésenkénti kitöltés változatlan. A két célközönség megosztott visszajelzése
ugyanezt a lapformát használja, a meglévő befagyasztott tartalommal és egyéni ábrával.
Jogosultság, megosztási határ, jóváhagyás és adatmodell nem változott.

Ellenőrzés: típus/lint/színtoken ellenőrzés, meglévő candidate client és Chromium
folyamatteszt; asztali és mobil képernyőképek. Az üres megfigyelések kliensoldali
elvárása a csapatonként ismétlődő helyett az aktív csapat három műhelylapját követi.

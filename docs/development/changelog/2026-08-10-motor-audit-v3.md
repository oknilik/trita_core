# 2026-08-10 — motor-audit harmadik kör (vak, feltárás-only)

A v2-javítási kör (PR #22) után **harmadszor** is a nulláról futott a motor-audit:
hat friss elemző a JAVÍTOTT kódon, tiltva minden korábbi audit- és changelog-doksi
olvasása. Cél: mit talál a friss szem ott, ahol épp most takarítottunk.

**Ez a kör feltárás-only** — nincs kód-változás, a javítás külön döntés. A teljes
lelet-lista: `docs/audits/motor-audit-v3-2026-08-10.md`. Vizuális riport: claude.ai
artifact „Trita motor-audit · harmadik kör — a réteg alatt".

## Összkép

- **A v2-javítások tartanak — 0 regresszió.** Mind a hat elemző külön megerősítette
  (provenance-fegyelem, centralizált observer-lifecycle, anonimitás min-N egy
  konstansból, input-hardening, kanonikus candidate-validátor).
- Előbukkant a **harmadik réteg**, három fajta lelettel:

### 1. Befejezetlen fixek (a v2 biztonsági javítások maradék pereme — most zárható)
- **W2 (magas):** a self-submission guard csak belépve véd; kijelentkezve (inkognitó,
  külső token) a ratee beküldhet magáról → uralhatja a saját összevetését. A C3-fix pereme.
- **W1 (magas):** a 4. értékelőtől a de-anonimizálás attribúálhatóvá válik a nevesített
  `InvitationsTab` completed-listával (`rₖ = k·avgₖ − (k−1)·avgₖ₋₁`). Enyhíthető; teljes zárás strukturális.
- **W6 (közép):** a fiók-törlés csak az INVITER, nem a RATER szerepet takarítja → maradék GDPR-PII + árva draft.

### 2. Validitási alap (pilot-adatot igényel, nem kód-írást)
- **F1/F2/F3:** nem-normált POMP %-ként; SEM két magic konstanson (`MEAN_ITEM_R`,
  `SCORE_SD`); 40/70 vs 35/65 küszöb-ellentmondás.
- **HIGH-1/2/3:** 16-minta kalibrálatlan küszöbök; cohesion=mean((ADAP+INTE)/2)
  konstrukció + variancia-kompresszió; friction 12/22 a mérési hibán belül.
- **hiring S1:** fit-küszöb (`avgAbsGap<10`) a SE≈11.5 alatt.

### 3. Konzisztencia-maradék (jórészt kód-szintű)
- **Élő bug:** `IdealEnvironmentSection.getShortLabel` — a Kultúra-jelölő üres/rossz póluson.
- glyph≠címke top-2; uncertainty-kapu csak a 2./3. dimenzióra; szerep mért/becsült %
  egyben; tie-break OG/KE/KO torzítás; lefedettség >100%; trust-aszimmetria; karrier known-groups körkörös.

## Ajánlás

Egy fókuszált **v3-javítási kör** a „zárható most" oszlopot zárhatja (W2, W6,
Kultúra-jelölő, F3, szerep S1, interpr. S2/S3 + W1-enyhítés). A validitási alap a
pilot-backlog — az eszközök (`scripts/research/`) készen állnak, a referencia-minta hiányzik.

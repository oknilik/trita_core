# Team Scan esetnapló — másolható sablon

> P2.3 operatív sablon · 2026-08-16. Egy példány = egy csapat teljes
> diagnózis → beavatkozás → visszamérés köre. A kitöltött példányt az
> engedélyezett belső ügyfélmappában/táblában kell tartani, **nem gitben**.

## Használati szabály

- Az első blokkot a kampány aktiválásakor, a mérési és workshop-blokkokat az
  eseménytől számított 48 órán belül töltsd ki. Ne emlékezetből, a pilot végén.
- Tag neve, emailje, nyers válasza, contributor kulcsa vagy azonosítható idézete
  nem kerülhet a naplóba. Csak csapatszintű aggregátum és szerepkör írható bele.
- A mért értéket a befagyasztott riportból/összehasonlítóból másold; ne számold
  újra kézzel. A `significant` mező a Trita mérési-hiba kapuját jelenti, nem
  klasszikus nullhipotézis-tesztet.
- A személyiségdimenzió változása kontroll, nem fejlesztési kimenet. Gyenge
  összetételi átfedésnél a napló sem nevezheti a teljes csapat deltáját
  fejlődésnek.
- A „mi okozta?” mezőben megfigyelés és hipotézis szerepelhet; kontrollcsoport
  nélkül okozati állítás nem.

## 0. Esetazonosító és adatkezelés

```yaml
case_id: TS-YYYY-NNN
record_status: opened | baseline_complete | action_running | followup_complete | closed
org_alias: ORG-NNN
team_alias: TEAM-NNN
team_size_band: 5-9 | 10-19 | 20-30
sector_band: optional-high-level-category
consultant_role: lead | reviewer
baseline_campaign_id: internal-id
baseline_report_id: internal-id
followup_campaign_id: pending
followup_report_id: pending
opened_on: YYYY-MM-DD
baseline_published_on: YYYY-MM-DD
workshop_on: YYYY-MM-DD
followup_due_on: YYYY-MM-DD
closed_on: pending
internal_calibration_use: yes
anonymized_research_use: yes | no | pending
public_reference_permission: named | anonymous | no | pending
permission_record_location: internal-link-or-id
baseline_commercial_unit: TEAM_SCAN_LICENSE
followup_commercial_unit: REMEASUREMENT_CYCLE
commercial_treatment: paid | discounted | pilot_free | barter
commercial_terms_record_location: protected-internal-link-or-id
```

Az alias stabil marad minden körben. A valódi org-/csapatnév és a
hozzájárulás dokumentuma csak a hozzáférés-szabályozott ügyfélmappában
kapcsolható hozzá.

## 1. Mit mutatott a mérés?

### 1.1 Adatminőség és értelmezési kapuk

| Mező | Baseline | Visszamérés | Megjegyzés |
|---|---:|---:|---|
| Meghívott tagok |  |  | |
| Self kitöltők |  |  | |
| Trust kitöltők |  |  | |
| Pulse kitöltők |  |  | anonimitási minimum: n ≥ 3 |
| Publikált riport dátuma |  |  | |
| Közös kitöltők (`common`) | n/a |  | csak összehasonlításkor |
| Belépők / kimaradók (`joined` / `left`) | n/a |  | |
| Kisebb körhöz mért átfedés | n/a |  | ≥70% és common ≥3 kell |
| Kompozíciós döntés | n/a | stabil mag / figyelmeztetés / ismeretlen | |
| Egyéb adatminőségi korlát |  |  | küszöb, hiány, incidens |

### 1.2 Bizonyítéktérkép

Csak azokat a sorokat tartsd meg, amelyekről a workshopon tényleges állítás
hangzott el. A `metric_key` lehetőleg a termék kulcsa legyen:
`psych_safety_index`, `psych_safety_item:PS1`…`PS8`, `trust_coverage`,
`trust_isolated_count`; a `role_gap:<kód>` csak külön kiegészítő körnél.

| metric_key | Baseline érték | n / lefedettség | Forrás | Kapu/státusz | Mit állíthatunk? |
|---|---:|---:|---|---|---|
|  |  |  | mért / becsült | elég adat / nem elég adat |  |
|  |  |  |  |  |  |

### 1.3 Elsődleges diagnosztikai olvasat

- A legerősebb, közvetlenül mért jel:
- A legfontosabb elakadás vagy kockázat:
- Mi támasztja ezt alá (legalább két, egymástól eltérő evidencia, ha van):
- Mi becslés vagy értelmezési nyelv, nem bizonyíték:
- Milyen alternatív magyarázat maradt nyitva:
- Mit **nem** mondunk az adatok alapján:

## 2. Mit mondtunk a workshopon?

| Téma | Előre tervezett állítás | Ténylegesen használt megfogalmazás | Csapat/vezető reakciója | Megmaradt kérdés |
|---|---|---|---|---|
|  |  |  |  |  |
|  |  |  |  |  |

- Fordulópont: melyik mondat/ábra indított érdemi beszélgetést?
- Félreértés: mit kellett pontosítani vagy visszavonni?
- Mintanév: segített / semleges volt / félrevezetett — mi működött helyette?
- Facilitátori döntés: mit hagytunk ki idő-, bizalmi vagy adatminőségi okból?
- Workshop-kimenet elfogadása: ki, milyen szerepkörben erősítette meg?

## 3. Mit vállalt a csapat?

Az akcióazonosító és a célmutató egyezzen a publikált riportban tárolt
`TeamReportActionItem` adattal.

| action_id | Vállalt akció | Felelős szerepkör | Határidő | targetMetric kulcs | Kiinduló érték | Végrehajtási jel | Státusz |
|---|---|---|---|---|---:|---|---|
|  |  |  |  |  |  | miből tudjuk, hogy valóban megtörtént? | planned |
|  |  |  |  |  |  |  | planned |

Akciónként röviden:

- Miért ezt választottuk, és nem egy másik javaslatot?
- Milyen gyakorisággal/intenzitással kell megtörténnie?
- Mi akadályozhatja a végrehajtást?
- Milyen nem várt mellékhatást figyelünk?

## 4. Mi történt a visszamérésre?

### 4.1 Akció → kimenet

| action_id | Státusz a visszaméréskor | targetMetric | Baseline | Follow-up | Delta | significant | Kompozíció | Értelmezés |
|---|---|---|---:|---:|---:|---|---|---|
|  | done / partial / blocked / overdue |  |  |  |  | true / false / n/a | stabil mag / warning |  |
|  |  |  |  |  |  |  |  |  |

### 4.2 Védhető összegzés

- Mi mozdult el a mérési kapun túl?
- Mi maradt a mérési hibán belül?
- Mit tett értelmezhetetlenné az összetétel-változás vagy a hiányzó adat?
- A stabil személyiségkontroll ugyanazt a csapatot valószínűsíti-e?
- Az akció végrehajtási intenzitása elég volt-e ahhoz, hogy kimenetet várjunk?
- Védhető mondat: „A vállalt akciót követően …”
- Tiltott/kerülendő okozati mondat: „Az akció bizonyítottan … okozott.”
- Következő mérési vagy vezetői lépés:

## 5. Mit csinálnánk másképp?

| Réteg | Ami működött | Ami nem működött | Következő esetben konkrét változtatás | Playbook-jelölt? |
|---|---|---|---|---|
| Setup / consent |  |  |  | igen / nem |
| Mérési teher / pacing |  |  |  | igen / nem |
| Riport-validálás |  |  |  | igen / nem |
| Workshop-dramaturgia |  |  |  | igen / nem |
| Akcióválasztás |  |  |  | igen / nem |
| Kísérés |  |  |  | igen / nem |
| Visszamérés |  |  |  | igen / nem |

- Új hipotézis a termékről vagy folyamatról:
- Ismétlődő jelenség? Ha igen, mely korábbi `case_id` esetekben láttuk?
- Kódhiba / adatminőségi incidens / kérdéses pont és hivatkozása:
- Mely mező hiányzott a sablonból?

## 6. Lezárás és újrahasznosítás

| Kimenet | Állapot | Hivatkozás / következő lépés |
|---|---|---|
| Akciók lezárva vagy átütemezve |  |  |
| Következő kör rögzítve |  |  |
| Kalibrációs sor ellenőrizve |  |  |
| Playbook-jelölt megjelölve |  |  |
| Anonimizált case study vázlat |  | csak engedéllyel |
| Named referencia |  | csak külön, dokumentált engedéllyel |

### Portfólió-index — egy sor esetenként

Ezt a sort másold a közös, hozzáférés-szabályozott esetindexbe. Szabad szöveg
helyett rövid, szűrhető értékeket használj.

| case_id | team_size_band | baseline_date | followup_date | commercial_treatment | main_target | action_status | outcome_gate | composition | public_reference | playbook_candidate |
|---|---|---|---|---|---|---|---|---|---|---|
| TS-YYYY-NNN |  |  |  | paid/discounted/pilot_free/barter |  | done/partial/blocked | beyond_error/within_error/n-a | stable/warning/unknown | named/anonymous/no/pending | yes/no |

# Team Scan kampány-ütemterv és ops-checklist

> Készült: 2026-07-20 · Frissítve: 2026-08-16. A
> `pilot-playbook.md` technikai melléklete.
>
> Kódforrás: `src/lib/campaign-steps-core.ts`. A `SCAN_V1` rögzített sorrendje:
> `SELF_ASSESSMENT → TRUST_360 → PSYCH_SAFETY`. A preset kötelezően
> `requireFreshResults=true`, ezért a self-adat is az adott körhöz címkézett.
> Observer, role self/peer és recognition csak külön kiegészítő kampány.

## 0. Előkészítés — T–2 hét

1. **Szervezet létrehozása** — `/org/new`.
2. **Org-aktiválás** — `/admin?tab=orgs`; nincs önkiszolgáló billing.
3. **Tanácsadó hozzárendelése** — Admin → Tanácsadók.
4. **Csapat létrehozása és névsor ellenőrzése** — ajánlott 5–30 aktív tag.
5. **Tagok meghívása** — ugyanazon a napon menjen ki a vezetői beharangozó
   (`ugyfel-kommunikacio.md`).
6. **Eset megnyitása** — stabil `case_id`, csapat-alias és tervezett
   visszamérési dátum a `team-scan-esetnaplo-sablon.md` 0. blokkjában.
7. **Dry run** — belső orggal a teljes baseline és follow-up út, beleértve a
   riport-összehasonlítást és a kompozíciós warningot.

## 1. Baseline kampány létrehozása

- Válaszd a nevesített **Trita Team Scan v1** csomagot. Ne az egyedi módon
  állítsd össze ugyanazt a három lépést: a preset az összevethetőség szerződése.
- Ajánlott egy csapat/kampány. Ha egy kampány több csapatot céloz, minden
  csapat külön riportot és külön esetnaplót kap; a kampányazonosító közös lehet.
- Név: `<csapat alias> · Team Scan · baseline · YYYY-MM`.
- Pacing: alapérték 24 óra. A 0 órás nyitást csak előre egyeztetett,
  facilitált kitöltésnél használd; a respondens-terhet jegyezd fel.
- A preset friss selfet kényszerít ki. Korábbi self-eredmény nem fast-forwardol,
  mert kör-címke nélkül a baseline riport és a pilotkohorsz hiányos lenne.
- Aktiválás előtt ellenőrizd: névsor, csapat, leírás, pacing, kickoff consent.
  A DRAFT → ACTIVE → CLOSED életciklus nem fordítható vissza.
- Aktiválás a kickoff zárásaként; az első lépés értesítése ekkor megy ki.

## 2. A három lépés

### 2.1 Self (`SELF_ASSESSMENT`)

| | |
|---|---|
| Kitöltő | kampánylinkes `/assessment?campaignId=…`, TSFI-S 60 item, kb. 10 perc |
| Tárolás | új `AssessmentResult`, pontos `campaignId`; korábbi eredmény megmarad |
| Automatikus | draftmentés, lépésteljesítés és a pacing után trust-nyitás |
| Tanácsadó | T+3 státusz, lemaradók célzott emlékeztetése |
| Működési cél | ≥85% a meghívott tagokból |

A self-dimenzió a későbbi összehasonlításban stabilitási/kompozíciós kontroll;
nem azt várjuk tőle, hogy a beavatkozástól fejlődjön.

### 2.2 Bizalmi háló (`TRUST_360`)

| | |
|---|---|
| Kitöltő | `/assessment/trust`; a csapattársak közti bizalom, segítségkérés, nyíltság, bevonás és együttműködés |
| Teher | a csapatmérettel négyzetesen nő; 12 főnél fejenként 11 kapcsolat × 5 kérdés |
| Láthatóság | egyéni irányított válasz nem jelenik meg; node-aggregátum csak a rater-küszöb felett |
| Kimenet | mért él-szám/lefedettség, hub- és beágyazatlansági kontextus |
| Tanácsadó | consent ismétlése; képernyőkép vagy egyéni válasz bekérése tilos |
| Működési cél | ≥80% résztvevői beadás; a tényleges él-lefedettség külön rögzül |

### 2.3 Pszichológiai biztonság (`PSYCH_SAFETY`)

| | |
|---|---|
| Kitöltő | `/assessment/psych-safety`, 8 item, kb. 2 perc |
| Adatvédelem | névtelen, nincs user-referencia; aggregátum csak n≥3 esetén |
| Kimenet | index, item-átlagok és gyenge itemek; forrásjelöléssel |
| Tanácsadó | az anonimitást a lépés nyitásakor újra kimondja |
| Működési cél | n≥3 és lehetőleg ≥70% csapatlefedettség |

## 3. Emlékeztető-politika

- **T+3 nap:** platform-remind az aktuális lépés lemaradóinak.
- **T+7 nap:** vezetői üzenet a belső csatornán; a vezető részvételt kér,
  választ vagy bizonyítékot nem.
- **T+10 nap:** második platform-remind + név szerinti kitöltöttségi lista a
  kapcsolattartónak a nem anonim lépésekhez. Pulse-válasz soha nem listázható.
- Minden eltérő remind vagy határidő az esetnapló teher/pacing sorába kerül.

## 4. Zárás, riport és akció

1. A hátralévő lemaradás elfogadása vagy rendezése után kampányzárás.
2. Riportvázlat létrehozása **a baseline kampány azonosítójával**, hogy self,
   trust és pulse ugyanabból a körből jöjjön.
3. Adatminőség ellenőrzése: kitöltőszámok, anonimitási padlók, mért/becsült
   források, esetleges hiány.
4. Tanácsadói narratíva és publikálás; ezzel az aggregátum befagy.
5. Debrief; 1–3 akció felelőssel és határidővel.
6. Legalább egy akcióhoz strukturált célmutató:
   `psych_safety_index`, `psych_safety_item:PS1…PS8`, `trust_coverage` vagy
   `trust_isolated_count`.
7. Az esetnapló 1–3. blokkjának lezárása 48 órán belül.

## 5. Akciókövetés

- Kéthetente státusz: `in_progress`, `done`, `blocked` vagy `overdue`.
- A státusz mellett végrehajtási jel kell: gyakoriság, megtartott alkalom,
  elfogadott működési szabály vagy más, nem személyes evidencia.
- Cél- vagy scope-váltásnál új akcióelem készül. A baseline action itemet nem
  írjuk át visszamenőleg.
- Fluktuáció/átszervezés dátuma és nagyságrendje bekerül az esetnaplóba.

## 6. Follow-up kampány és összehasonlítás

1. Új kampány, új név: `<csapat alias> · Team Scan · follow-up · YYYY-MM`.
2. Alapesetben ismét `SCAN_V1`, így ugyanaz a három réteg és fresh self készül.
3. A follow-up riport is a saját kampányazonosítójával épül és publikálódik.
4. A két publikált riport összehasonlítója adja:
   - `common`, `joined`, `left` és a kisebb körhöz mért átfedést;
   - stabil-mag vagy kompozíciós warning döntést;
   - pulse-index/item mérési-hiba kaput;
   - trust-, role- és observer-kimenetet, ha az adott réteg mindkét körben volt;
   - akció → célmutató → mért kimenet kapcsolatot.
5. A nem szignifikáns pulse-delta nem kerül „mi változott” narratívába. A
   trust-változás kalibrált hiba hiányában leíró; nem kap hamis szignifikancia-
   címkét.
6. Gyenge kompozíció esetén a teljes csapat delta kontextus, nem fejlődés.
7. Az esetnapló 4–6. blokkja és az indexsor lezárja az esetet.

## 7. Operatív minimumnapló

| Mikor | Kötelező naplóblokk |
|---|---|
| Setup | 0. azonosító, engedélyek, dátumok |
| Baseline publikálás | 1. adatminőség és bizonyítéktérkép |
| Debrief +48 óra | 2–3. workshop és vállalások |
| Minden kísérő alkalom | action státusz + végrehajtási jel |
| Follow-up publikálás +48 óra | 4. akció → kimenet |
| Záró interjú +48 óra | 5–6. tanulság, referencia és indexsor |

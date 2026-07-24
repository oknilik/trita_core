# Mérési körök újrafuttatása + történeti összehasonlítás — terv

> Készült: 2026-07-24. Kérdés: hogyan futtassunk teljesen új self/observer/
> csapatszerep-kört, és mi legyen a régi eredményekkel (jövőbeni
> összehasonlítás)?

## 0. Mit tud MA az adatmodell? (kód-audit eredménye)

| Mérés | Tárolás | Újrafuttatható? | Történet megmarad? |
|---|---|---|---|
| Self (TRITAN) | `AssessmentResult` — **append-only**, az olvasók `findFirst createdAt desc` (legfrissebb nyer) | igen (új sor) | ✅ minden korábbi sor megvan |
| Observer | `ObserverInvitation` (**van `campaignId`-ja!**) + `ObserverAssessment` append-only | igen (új meghívók) | ✅ de az aggregátum ma az ÖSSZES valaha beérkezett értékelést keveri |
| Csapatszerep — self | `TeamRoleAnswer`/`TeamRoleScore` — **`userProfileId @unique` → felülírás** | igen, de… | ❌ **újrakitöltéskor a régi válasz/pontszám ELVÉSZ** |
| Csapatszerep — peer | `TeamRoleObservation` — `@@unique(campaignId, about, rater)` | igen (új kampány) | ✅ kampányonként külön él |
| Trust / Pulse | kampány-kötött | igen (új kampány) | ✅ körönként külön |

Plusz egy viselkedési csapda: `initializeCampaignProgress` a meglévő
eredménnyel rendelkezőket **automatikusan túllépteti** a lépésen (a /try-claim
kényelmi logikája) — vagyis egy „2. kör" kampányban ma senki nem venné fel
újra a tesztet, mindenki átugorja.

## 1. Javasolt modell: a kör = kampány, az adat = append-only + kör-címke

**Elv: soha nem törlünk és nem írunk felül.** A „legfrissebb kör" a kanonikus
nézet (riport, team-intelligence), a régebbi körök az összehasonlítás
nyersanyaga — ez a novemberi „index-delta" értékesítési sztori általánosítása
minden mérésre.

### 1.1 Adatmodell-változások

1. **TeamRoleAnswer/TeamRoleScore: a `@unique(userProfileId)` feloldása** —
   append-only sorok `campaignId?` mezővel; az olvasók (riport, becslő-fallback,
   team-intelligence) a legfrissebbet veszik. Migráció: a meglévő 1-1 sor
   marad, csak az constraint változik + index (userProfileId, createdAt).
   **Ez az egyetlen adatvesztéses pont ma — a pilot előtt érdemes lezárni.**
2. **AssessmentResult**: már jó; opcionális `campaignId?` a kör-címkéhez
   (melyik kampánykör alatt született), hogy a kör-riport pontosan szűrhessen.
3. **Observer aggregátum kör-szűrése**: az invitation `campaignId`-ja már
   megvan — az összehasonlító nézet kapjon kör-szűrőt (adott kampány
   meghívóiból jött értékelések vs. összes). Default marad az összes
   (kis elemszámnál az a stabilabb), a kör-nézet opció.

### 1.2 Újrafuttatás mechanika: „friss eredmény kell" kapcsoló

Új kampány-mező: **`requireFreshResults: Boolean @default(false)`**.

- `false` (default, mai viselkedés): akinek van self/szerep eredménye, azt a
  lépés-inicializálás túllépteti — gyors első kör, /try-claim működik.
- `true` („újrafelvételi kör"): a lépés CSAK a kampány aktiválása UTÁN
  beadott eredménnyel teljesül (`result.createdAt >= campaign.activatedAt`
  ellenőrzés az `initializeCampaignProgress`-ben és az
  `advanceCampaignStepForUser`-ben). Kell hozzá: `activatedAt` timestamp a
  kampányra (ma nincs — a status-váltás nem naplózza).

A wizard 2. lépésén checkbox: „Újrafelvételi kör — a korábbi eredmények nem
számítanak, mindenki újra kitölti." A kampány-oldalon badge jelzi.

### 1.3 „Új kör indítása" UX

A LEZÁRT kampány összegzőjén gomb: **„Új kör indítása ugyanezzel"** — a
wizardot előtöltve nyitja (ugyanazok a lépések, ugyanaz a csapat, név:
„… — 2. kör", `requireFreshResults` bekapcsolva). Így az újrafuttatás
egy kattintás + aktiválás, és automatikusan kör-címkézett.

### 1.4 Történeti összehasonlítás (a hozadék)

- **Egyéni riport**: „Korábbi eredményeid" szekció — dimenzió-pontszám
  idősor (kör-címkékkel), önkép-stabilitás jelzés („a Tervezettséged 45→58:
  a legtöbbet változott dimenzió"). Módszertani jegyzet kötelező: a
  változás mérési hiba VAGY valódi elmozdulás — hipotézis-keretezés (P1-elv).
- **Team view**: kör-választó a meglévő aggregátum-nézetek felett
  (szerep-lefedettség, heatmap) + „változás az előző kör óta" sor.
- **Pulse**: már tervben (november, index-delta) — ez a minta általánosul.

## 2. Ütemezés-javaslat

| Mikor | Mit | Becslés |
|---|---|---|
| Pilot előtt (aug) | 1.1/1: TeamRole unique feloldás + campaignId (adatvesztés-stop) | S–M |
| Pilot előtt (aug) | 1.2: `requireFreshResults` + `activatedAt` + wizard-checkbox | M |
| Pilot alatt ráér | 1.3: „Új kör indítása" gomb a zárt kampányon | S |
| Október (a nov. 2. kör előtt) | 1.4: összehasonlító nézetek (egyéni idősor + team kör-választó + observer kör-szűrő) | M–L |

Így a szeptemberi pilot 1. köre már úgy rögzít, hogy a novemberi 2. kör
teljes értékű összehasonlítást adjon — a „változást mérünk" bizonyíték a
záró beszámoló és a folytatás-ajánlat gerince.

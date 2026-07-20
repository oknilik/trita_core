# Pilot kampány-ütemterv és ops-checklist

> Készült: 2026-07-20 · A `pilot-playbook.md` technikai melléklete.
> A lépés-sorrend és a viselkedés a kódból: `src/lib/campaign-steps-core.ts`
> (kanonikus sorrend: OBSERVER_360 → TEAM_ROLE → PSYCH_SAFETY, lépések
> felhasználónként, sorban nyílnak, értesítéssel).

## 0. Előkészítés — org setup checklist (T–2 hét)

Sorrendben, a saját (admin/tanácsadói) fiókból:

1. **Szervezet létrehozása** — `/org/new`; a cégadatok (adószám, cím,
   kapcsolattartó) már a formban megadhatók, vagy később: Admin →
   Szervezetek → „Cégadatok (számlázás)".
2. **Org-aktiválás** — `/admin?tab=orgs` → activate (a hozzáférést a
   platform-admin adja kézzel; nincs önkiszolgáló fizetés).
3. **Tanácsadó hozzárendelése** — Admin → Tanácsadók fül (meghívó emailre,
   létező fióknál azonnal érvényesül) + org-kiosztás. A tanácsadó
   „Tanácsadó" badge-dzsel jelenik meg, nem számít bele a tag-számokba.
4. **Csapatok felvétele** — org-oldal → Csapatok fül; a kapcsolattartói
   adatlap névsora alapján.
5. **Tagok meghívása** — org-/csapat-meghívó (a platform emailt küld:
   „Meghívtak a(z) … csapatba/szervezetbe – Trita"). Javasolt: a meghívás
   NAPJÁN menjen ki a vezetői beharangozó email (ld.
   `ugyfel-kommunikacio.md` 3. sablon), különben a platform-email hidegen
   érkezik.
6. **Dry run** — belső teszt-szervezettel a teljes út: wizard → aktiválás →
   kitöltés → lépés-váltás → riport. (A `seed-org-team` és
   `seed-psych-safety` szkriptek segítenek a teszt-adatban.)

## 1. Kampány beállítása (kickoff napján)

- Wizard: **egyetlen kampányban mindhárom mérés** kiválasztása
  (multi-select; a sorrendet a rendszer rögzíti: önértékelés+observer →
  csapatszerep → pulse). Auto-név: „Mérés-sorozat (3)" — írjuk át beszédesre,
  pl. „Őszi csapatprogram — 1. kör".
- Csapat-célzás kötelező a szerep- és pulse-lépés miatt.
- **Aktiválás a kickoff zárásaként** — ekkor mindenki lépés-nyitó
  értesítést kap, és akinek már van self-eredménye (pl. /try-ról claimelt),
  azt a rendszer automatikusan túllépteti az első lépésen.
- Fontos: a kampány-életciklus DRAFT → ACTIVE → CLOSED **visszafordíthatatlan**
  — aktiválni csak akkor, ha a névsor végleges. Utólagos tag-hozzáadás
  aktív kampányhoz lehetséges (a rendszer inicializálja az új résztvevőt).

## 2. Mérés-lépések — mit csinál a platform, mit a tanácsadó

### 1. lépés: Önértékelés + kollégai visszajelzés (OBSERVER_360)

| | |
|---|---|
| Kitöltő | `/assessment` — TSFI-S rövid forma, 60 item, ~10 perc |
| Observer | tagonként max 5 aktív meghívó, token-link, 30 nap érvényes, regisztráció nélkül kitölthető, confidence-értékeléssel |
| Automatikus | observer-meghívó email + emlékeztető-változat; „Megérkezett egy visszajelzés" értesítés; félbehagyott tesztre draft-emlékeztető |
| Tanácsadó | kitöltöttség-figyelés a kampány-oldalon; remind gomb a lemaradóknak; observer-kör bátorítása a vezetőn keresztül |
| Kilépési cél | ≥85% self-kitöltés a 2. hét végére; utána tovább lehet engedni a kört akkor is, ha 1-2 fő lemaradt (ők a saját ütemükben haladnak) |

### 2. lépés: Csapatszerep-kérdőív (TEAM_ROLE)

| | |
|---|---|
| Kitöltő | `/assessment/team-roles` — 7 szekció × 8 állítás, pontelosztásos; eredmény: top 3 szerep a 9-ből |
| Automatikus | a self-lépés teljesítésekor a rendszer megnyitja + „Új mérés vár rád" értesítés; team-oldali banner mindig az aktuális nyitott lépést mutatja |
| Tanácsadó | 4. hét elején státusz-kör; akinél nincs valódi kitöltés, a riportban TRITAN-becslés fut forrás-badge-dzsel — ezt a debriefen jelezni kell |
| Kilépési cél | ≥70% kérdőíves (nem becsült) lefedettség |

### 3. lépés: Pszichológiai biztonság pulse (PSYCH_SAFETY)

| | |
|---|---|
| Kitöltő | `/assessment/psych-safety` — 8 állítás, ~2 perc, teljesen névtelen (nincs user-referencia, nincs piszkozat, nap-pontosságú dátum) |
| Küszöb | aggregátum csak n ≥ 3 válasznál; alatta a felület magyarázó szöveget mutat |
| Automatikus | lépés-nyitó értesítés; zárolt lépés közvetlen URL-en sem tölthető ki (409) |
| Tanácsadó | az anonimitás-üzenet ismétlése a vezetői csatornán; 3 fő alatti csapatnál előre jelezni, hogy nem lesz index |
| Kilépési cél | minden csapatnál n ≥ 3 |

## 3. Emlékeztető-politika

A cél, hogy a nudge-ok ritmusa kiszámítható legyen és ne érje spam-vádként
a platformot:

- **T+3 nap**: platform-remind a kampány-oldalról (lemaradóknak).
- **T+7 nap**: vezetői üzenet a belső csatornán (sablon a kommunikációs
  dokumentumban) — tapasztalat szerint ez hozza a legtöbbet.
- **T+10 nap**: második platform-remind + a tanácsadó név szerinti listát
  küld a kapcsolattartónak (ő dönti el, ki kap személyes szót).
- Observer-meghívóknál a 30 napos lejáratra a 3. hét végén érdemes
  figyelmeztetni (új meghívó bármikor küldhető).

## 4. Zárás és riport

1. Minden lépés lezárult (vagy a maradék lemaradó elfogadott veszteség) →
   **kampány zárása** (CLOSED — visszafordíthatatlan).
2. Riport-vázlat generálása a team-oldal Riport rétegében — az aggregátum
   a legutóbbi pulse-körből is töltődik; a narratíva-prefill kockázat- és
   akció-pontokat ajánl.
3. Tanácsadói szerkesztés a `riport-ertelmezesi-sablonok.md` szerint →
   **publikálás** (az aggregátum riportba fagy; a tagok/admin a publikált
   csapatképet látják).
4. Vezetői debrief → 30 napos akciólista.
5. (Opció, november) **második pulse-kör** külön kampányként — index-delta
   a záró alkalomra. Ez az első valódi „változást mérünk" bizonyíték, és
   erős értékesítési anyag a folytatáshoz.

## 5. Heti operatív ritmus (tanácsadó)

- Hétfő: kampány-oldal átnézése (kitöltöttség, elakadt lépések) → 2 mondatos
  státusz a kapcsolattartónak.
- Szerda: remindok kiküldése a politika szerint.
- Péntek: jegyzet a hétről (mi akadt, milyen kérdés jött) — ebből épül a
  roadmap-input és a záró beszámoló.

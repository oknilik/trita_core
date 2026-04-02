# Manager Cockpit — Tervezési dokumentum

> Dátum: 2026-04-02
> Státusz: terv

---

## Probléma

Jelenleg a manager és az admin ugyanarra a `/dashboard` (admin) felületre érkezik bejelentkezés után. Ez az admin cockpit szervezeti szintű metrikákat mutat: összes csapat, összes tag, szervezeti kampányok, subscription állapot.

A manager szempontjából ez félrevezető és irreleváns:
- Nem az összes csapat érdekli, hanem a **saját csapata(i)**
- Nem a szervezeti subscription állapot érdekli, hanem a **csapata teljesítettsége**
- Nem org-szintű kampányokat akar indítani, hanem a **csapatához kapcsolódó teendőket** akarja látni
- Az admin dashboard sok akcióra nem is van jogosultsága (billing, org settings)

A journey engine jelenleg nem differenciál (`home.ts:58`):
```typescript
if (context.currentContext === "org-admin" || context.currentContext === "org-manager") {
  return { activeSurface: "org", home: buildHomeResolution("/dashboard", "org_cockpit", ...) };
}
```

---

## Célállapot

A manager bejelentkezés után egy **csapatfókuszú cockpitot** lát, ami az ő csapatá(i)nak állapotát mutatja. Ez nem az admin dashboard egy szűkített verziója — teljesen más nézőpont.

### Admin vs. Manager összehasonlítás

| Dimenzió | Admin cockpit | Manager cockpit |
|----------|---------------|-----------------|
| **Scope** | Teljes szervezet | Saját csapat(ok) |
| **Fő metrika** | Org completion %, csapatok száma | Csapat completion %, tagok állapota |
| **Kampányok** | Összes org kampány | Csak a csapatomat érintő körök |
| **Tagok** | Összes org member | Csapattagjaim (név, kitöltöttség, Belbin) |
| **Akciók** | Org invite, kampány indítás, billing | Tag emlékeztető, feedback kör nyomon követés |
| **Dinamika** | Org-szintű összesítés | Csapat friction térkép, részletes breakdown |
| **Next step** | Org-szintű javasolt akció | Csapatspecifikus javasolt akció |

---

## Tartalmi blokkok

### 1. Hero szekció
- Csapat neve (ha egy csapat) vagy "Csapatjaid" (ha több)
- Összesített completion: "6/8 tag kitöltötte a személyiségtesztet"
- Badge: "Csapatkép elérhető" / "3 tag hiányzik a csapatképhez"

### 2. Csapattagok állapot kártyák
Tagonkénti kártya grid:
- Név + avatar
- Személyiségteszt: kész / folyamatban / nem kezdte el
- Observer kör: X visszajelzés érkezett
- Belbin: kész (top szerep) / becslésből / nincs
- Utolsó aktivitás időbélyeg

Ez a manager **legfontosabb** nézete — egy pillantásra látja, ki hol tart.

### 3. Csapatdinamika összefoglaló
A jelenlegi friction térkép kompakt verziója:
- Hány aligned / complementary / friction pár
- Top 2-3 figyelmet igénylő kapcsolat kiemelve
- Link a teljes dynamics map-re

### 4. Aktív feedback kör (ha van)
- Kör neve, státusza
- Hányan töltötték ki / hányan nem
- Ki van hátra (nevek)
- Emlékeztető küldés CTA

### 5. Javasolt következő lépés
Manager-specifikus next-best-action:
- "2 tag nem töltötte ki a tesztet — küldj emlékeztetőt"
- "A csapatkép elérhető — tekintsd meg az eredményeket"
- "Indíts feedback kört a csapat dinamikájának felméréséhez"
- "A Belbin teszt 3 tagnál becslésből fut — indíts kitöltési kört"

### 6. Multi-team nézet (ha több csapatot kezel)
Ha a manager több csapatban is manager:
- Csapat kártyák egymás alatt, mindegyik a saját completion%-kal
- Kattintásra a részletes team page nyílik meg
- Összesített "leggyengébb láncszem" kiemelés: melyik csapatban kell leginkább beavatkozni

---

## Architekturális döntések

### Route

**Javaslat A — Dedikált route:** `/manager`
- Tiszta szeparáció az admin dashboardtól
- Saját server component, saját data fetching
- A journey engine `org-manager` kontextust ide irányítja

**Javaslat B — Paraméteres org route:** `/org/[id]?view=manager`
- Egy route, server-side role-based renderelés
- Kevesebb új fájl, de bonyolultabb route logika

**Ajánlás:** Javaslat A — a két dashboard tartalma annyira eltérő, hogy közös route-ból bonyolultabb lenne

### Journey engine módosítás

```typescript
// home.ts — jelenlegi (mindkettő /dashboard-ra megy)
if (context.currentContext === "org-admin" || context.currentContext === "org-manager") {
  return { activeSurface: "org", home: buildHomeResolution("/dashboard", "org_cockpit", ...) };
}

// home.ts — javaslat (szétválasztás)
if (context.currentContext === "org-admin") {
  return { activeSurface: "org", home: buildHomeResolution("/dashboard", "org_cockpit", ...) };
}
if (context.currentContext === "org-manager") {
  return { activeSurface: "team", home: buildHomeResolution("/manager", "manager_cockpit", ...) };
}
```

### Data fetching

A manager cockpit adatai a meglévő `getTeamPageData()` és `getTeamPageData()`-ból összeállíthatók:
- Csapattagok: `teamData.members`
- Completion: `teamData.completedCount` / `teamData.memberCount`
- Dynamics: `teamData.dynamicsEdges`
- Campaign: `teamData.activeCampaign`
- Belbin: `BelbinScore` query per member

Új data function: `getManagerCockpitData(profileId)` ami összegyűjti az összes managed team adatát.

### Nav integráció

A `nav-header-ui.tsx` manager-nél a "Szervezet" dropdown helyett "Csapatom" / "Csapataim" jelenne meg, ami a `/manager` route-ra mutat.

---

## Nem scope (első iteráció)

- Nem ad tag-szintű coaching ajánlást
- Nem tartalmaz chat/messaging funkciót
- Nem jeleníti meg más managerek csapatait
- Nem tartalmaz szervezeti szintű metrikákat
- Nem helyettesíti a részletes team page-et (az továbbra is `/team/[id]`)

---

## Implementációs sorrend

### Fázis 1 — Manager home route + journey wiring
1. `/manager/page.tsx` server component létrehozása
2. `getManagerCockpitData()` data function
3. Journey engine `home.ts` szétválasztás: admin → `/dashboard`, manager → `/manager`
4. Nav frissítés: manager-nél "Csapatom" link

### Fázis 2 — Tartalom felépítés
5. Hero + tagok állapot grid
6. Dynamics összefoglaló (kompakt friction nézet)
7. Manager-specifikus next-best-action
8. Aktív feedback kör blokk

### Fázis 3 — Multi-team + polish
9. Több csapat kezelése (multi-team grid)
10. Emlékeztető küldés CTA bekötés
11. Belbin lefedettség jelzése
12. Mobile responsive layout

---

## Meglévő kód amit újra lehet használni

| Komponens / Funkció | Hol van | Mire jó |
|---|---|---|
| `getTeamPageData()` | `src/lib/team-stats.ts` | Csapat metrikák, tagok, dynamics edges |
| `buildProfileBasedEdges()` | `src/lib/team-stats.ts` | Friction számítás |
| `DashboardMetricCard` | `src/components/dashboard/DashboardPrimitives.tsx` | Metrika kártya UI |
| `JourneyNextStepCard` | `src/components/journey/JourneyNextStepCard.tsx` | Javasolt akció kártya |
| `SurfaceHero` | `src/components/ui/patterns/SurfaceHero.tsx` | Hero szekció |
| `ProgressChecklist` | `src/components/journey/ProgressChecklist.tsx` | Tagok teljesítettség checklist |
| `DashboardStatusChip` | `src/components/dashboard/DashboardPrimitives.tsx` | Státusz badge |
| `getAvatarGradient` | `src/lib/ui/avatar.ts` | Tag avatar színek |
| `TeamBelbinSection` | `src/components/team/TeamBelbinSection.tsx` | Belbin vizualizáció (kompakt verzióhoz) |

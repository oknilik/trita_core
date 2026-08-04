# Dashboard Content Scope Audit

## Cél

Ez a dokumentum a jelenlegi signed-in admin dashboard tartalmát sorolja be négy kategóriába:

- `operatív`
- `analitikai`
- `admin/settings`
- `termék-teaser / jövőbeli modul`

A cél annak tisztázása, hogy a dashboard hosszú távon operatív home maradjon, és az analitikai vagy admin jellegű tartalmak külön surface-re kerüljenek.

## Auditált források

- [src/app/dashboard/page.tsx](/Users/leinadoknilik/trita/codebase/src/app/dashboard/page.tsx)
- [src/app/dashboard/AdminDashboard.tsx](/Users/leinadoknilik/trita/codebase/src/app/dashboard/AdminDashboard.tsx)
- [src/components/dashboard](/Users/leinadoknilik/trita/codebase/src/components/dashboard)

## Összkép

A jelenlegi admin dashboard vizuálisan erős, de scope szempontból négy külön világot húz egy képernyőre:

1. napi operatív döntések
2. szervezeti és csapat analitika
3. admin / settings belépési pontok
4. teaser és jövőbeli modul kommunikáció

Ez a keveredés csökkenti a tanulhatóságot. A dashboardban jelenleg több blokk nem “mit tegyek most?” kérdésre válaszol, hanem “mit jelent ez az állapot?” vagy “mi jön majd később?” típusú rétegbe tartozik.

## Jelenlegi blokklista és besorolás

| Blokk | Jelenlegi cél | Kategória | Javaslat |
|---|---|---|---|
| Hero banner | Szervezeti állapot + fő CTA-k | `operatív` | Maradjon, de legyen rövidebb és task-first |
| Live snapshot jobb oldali panel | gyors státuszszámok | `operatív` | Maradhat kompakt állapotpanelként |
| First-team onboarding checklist | indulási teendők | `operatív` | Maradjon onboarding állapotban |
| Upcoming modules blurred teaser | jövőbeli modulok promója | `termék-teaser / jövőbeli modul` | Kerüljön ki a dashboard fő flow-ból |
| Recommended next step | következő legjobb akció | `operatív` | Erős dashboard-mag, maradjon |
| Secondary step card | másodlagos fókusz | `operatív` | Maradhat, ha tényleg akció-orientált |
| KPI row | szervezeti completion / aktív tagok / figyelmi pontok / team readiness | vegyes | Csak az operatív KPI-k maradjanak |
| Layer readiness | 4+2 rétegek készültsége | `analitikai` | Kerüljön külön analitika nézetbe |
| Org personality profile | szervezeti személyiség-összkép | `analitikai` | Kerüljön külön Analitika oldalra |
| Dominant pattern action card | értelmező mintázat-összefoglaló | `analitikai` | Kerüljön Analitika oldalra |
| Watch now / high-low tension card | értelmező insight és súrlódási hipotézis | `analitikai` | Kerüljön Analitika oldalra |
| Needs attention panel | nyitott problémák és teendők | `operatív` | Maradjon dashboardon |
| Team status panel | csapatok haladása és állapota | `operatív` | Maradjon, ez jó home-komponens |
| Recent activity | utolsó mozgások | `operatív` | Maradjon, ha tömör és action-höz kötött |

## Blokkok részletes bontása

### 1. Operatív blokkok

Ezek illenek a dashboard “home” szerepéhez, mert napi döntést vagy közvetlen következő lépést támogatnak.

- Hero banner
- Live snapshot
- First-team onboarding checklist
- Recommended next step
- Secondary step
- Needs attention
- Team status
- Recent activity
- KPI row operatív részei

Megjegyzés:

A KPI row most vegyes. Az alábbiak operatív jellegűek:

- `Org completion`
- `Active members`
- `Attention / nyitott pontok`
- `Team readiness`

Ezek maradhatnak, ha rövid, “állapot + mit tegyek?” logikával jelennek meg, nem elemzési dashboardként.

### 2. Analitikai blokkok

Ezek már nem operatív home elemek, hanem értelmező nézetek.

- Layer readiness
- Org personality profile
- Dominant pattern
- High / low tension insight card

Ezek tartalmilag nem azt mondják meg, mit kell most csinálni, hanem azt, hogyan értelmezd a szervezeti vagy csapatműködési mintázatot.

Javaslat:

Ezek kerüljenek külön `Analitika` surface-re, és a dashboardon csak rövid link vagy summary maradjon, például:

- `Szervezeti profil megnyitása`
- `Csapatmintázatok megtekintése`
- `Riportok`

### 3. Admin / settings közeli tartalmak

A dashboardban közvetlen settings blokk jelenleg nincs külön panelként, de több CTA admin felületre visz.

Jelenlegi admin/settings közeli entrypointok:

- `Open org report` jellegű CTA-k
- org route-ba vezető linkek
- members / campaigns entrypointok

Javaslat:

Ezek ne dominálják a home nézetet. A dashboard csak handoff legyen:

- napi operatív teendőkhöz
- team management belépési pontokhoz
- később külön `Szervezet` oldalhoz

### 4. Termék-teaser / jövőbeli modul

Jelenleg egyértelműen ide tartozik:

- `Upcoming modules` blurred teaser

Ez nem operatív, nem analitikai és nem admin. Marketing / roadmap kommunikációs elem.

Javaslat:

- onboarding után ne a dashboard közepén legyen
- menjen külön érdeklődési vagy roadmap felületre
- legfeljebb kisméretű callout maradjon, ha tényleg kell

## Mi maradjon a dashboardon

Rövid távú célállapot:

- hero rövid operatív összefoglalóval
- 1 elsődleges következő lépés
- 1 másodlagos fókusz
- figyelmet igénylő pontok
- csapatok állapota
- friss aktivitás
- onboarding checklist, ha a szervezet korai fázisban van

## Mi kerüljön le a dashboardról

- layer readiness
- org personality profile
- dominant pattern értelmezés
- high/low tension interpretáció
- blurred upcoming modules teaser

Ezek vagy `Analitika`, vagy külön teaser/roadmap felületre valók.

## Külön megjegyzés a dashboard komponenskészletről

A [src/components/dashboard](/Users/leinadoknilik/trita/codebase/src/components/dashboard) mappában több komponens a personal/self dashboard korszakból maradt meg, és nem a jelenlegi admin home részeként működik.

Ilyenek például:

- `DashboardTabs`
- `InviteSection`
- `ObserverComparison`
- `ProfileInsights`
- `ResearchSurvey`
- `UpcomingFeaturesCTA`

Ezeket nem szabad automatikusan a mostani admin dashboard scope-jába keverni. A mappa neve jelenleg túl tág, ezért hosszabb távon érdemes szétválasztani:

- `dashboard/home`
- `dashboard/self`
- `dashboard/shared-primitives`

## Következő döntési lépés

A scope audit alapján a következő refaktor logikus sorrendje:

1. dashboardból kivinni az analitikai blokkokat
2. külön `Analitika` oldal struktúráját kijelölni
3. a hero és a KPI sor operatív egyszerűsítése
4. a teaser blokk eltávolítása vagy áthelyezése

## Rövid döntési összegzés

- `dashboard = operatív home`
- `analitika = külön értelmező nézet`
- `admin/settings = külön szervezeti felület`
- `teaser = nem a dashboard magja`

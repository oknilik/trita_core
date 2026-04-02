# Page-to-Nav Map

Date: 2026-04-02  
Status: Active  
Scope: dashboard, team, org, hiring, billing/settings, reports/analytics, profile

## Cél

Ez a dokumentum rögzíti, hogy minden releváns signed-in oldal melyik IA top-level menühöz tartozik, és hol vannak legacy alias route-ok.

## Top-level nav ownership

- Admin: `Vezérlő`, `Csapatok`, `Jelöltek`, `Szervezet`, `Analitika`
- Manager: `Vezérlő`, `Csapatom`, `Jelöltek`, `Riportok`
- User menu: `Saját profil`, `Nyelv`, `Kijelentkezés`

## Page mapping

| Route | Nav owner | Role scope | Canonical | Megjegyzés |
|---|---|---|---|---|
| `/dashboard` | `Vezérlő` | admin + manager | igen | Operatív home |
| `/platform/home` | `Vezérlő` | admin + manager | nem (alias) | Re-export `/dashboard` |
| `/team` | `Csapatok` / `Csapatom` | admin + manager | igen | Team entry route, fallback redirect |
| `/team/[id]?tab=members` | `Csapatok` / `Csapatom` | admin + manager | igen | Operatív team management |
| `/team/[id]?tab=profile` | `Analitika` / `Riportok` | admin + manager | igen | Csapatriport és értelmező nézet |
| `/platform/team` | `Csapatok` / `Csapatom` | admin + manager | nem (alias) | Re-export `/team` |
| `/platform/team/[id]` | `Csapatok` / `Csapatom` | admin + manager | nem (alias) | Re-export `/team/[id]` |
| `/hiring/[orgId]` | `Jelöltek` | admin + manager (capability alapján) | igen | Jelöltfolyamat főnézet |
| `/hiring/[orgId]?invite=true` | `Jelöltek` | admin + manager (capability alapján) | igen | Új jelölt indítás |
| `/hiring/[orgId]/candidates/[inviteId]` | `Jelöltek` | admin + manager (capability alapján) | igen | Jelölt részletes eredmény |
| `/org` | `Szervezet` | admin | igen | Entry route: org membership alapján redirect |
| `/org/[id]?tab=members` | `Szervezet` | admin | igen | Jogosultságok, tagok, meghívások |
| `/org/[id]/settings` | `Szervezet` | admin | igen | Szervezeti admin/settings/billing belépés |
| `/org/[id]/setup` | `Szervezet` | admin | igen | Szervezeti setup flow |
| `/org/[id]/campaigns/new` | `Szervezet` | admin | igen | Kampány műveleti indítás |
| `/org/[id]/campaigns/[campaignId]` | `Szervezet` | admin | igen | Kampány részletes kezelőnézet |
| `/org/[id]?tab=overview` | `Analitika` | admin | igen | Szervezeti értelmező összkép |
| `/org/[id]?tab=teams` | `Analitika` | admin | igen | Csapatmintázatok és összesítő analitika |
| `/org/[id]?tab=campaigns` | `Analitika` | admin | igen | Kampányanalitika nézet |
| `/platform/org` | `Szervezet` | admin | nem (alias) | Re-export `/org` |
| `/platform/org/[id]` | `Szervezet` vagy `Analitika` (tab alapján) | admin | nem (alias) | Re-export `/org/[id]` |
| `/assessment-layers` | `Analitika` / `Riportok` | admin + manager | igen | Mélyebb 4+2 értelmező nézet |
| `/assessment-layers/[slug]` | `Analitika` / `Riportok` | admin + manager | igen | Réteg-részlet |
| `/billing/upgrade` | `Szervezet` (org) vagy user flow (self) | admin + manager + self | igen | Tranzakciós oldal, jellemzően CTA-ról érkezik |
| `/billing/checkout` | `Szervezet` (org) vagy user flow (self) | admin + manager + self | igen | Tranzakciós oldal, nem top-level menüpont |
| `/billing/return` | `Szervezet` (org) vagy user flow (self) | admin + manager + self | igen | Journey handoff route |
| `/billing/success` | `Szervezet` (org) vagy user flow (self) | admin + manager + self | igen | Checkout success route |
| `/org/suspended` | `Szervezet` | admin | igen | Restriction/frozen org state fallback |
| `/profile` | User menu (`Saját profil`) | admin + manager + self | igen | Személyes account beállítások |
| `/profile/results` | User menu (`Saját profil`) | admin + manager + self | igen | Personal journey home |
| `/platform/self` | User menu (`Saját profil`) | admin + manager + self | nem (legacy alias) | Redirect `/platform/self/results` |
| `/platform/self/results` | User menu (`Saját profil`) | admin + manager + self | nem (alias) | Re-export `/profile/results` |

## Route cleanup notes

- `platform/*` alias route-ok még élnek a visszafelé kompatibilitás miatt.
- Hosszú távú cleanup: aliasok fokozatos kivezetése, amikor minden belső link és külső bookmark kanonikus route-ra áll.
- `/org/[id]` és `/team/[id]` query-tab alapú kettős ownershipet használ (`operatív` vs `analitika`), ez jelenleg szándékos.

## Unassigned check (D1)

A D1 minimum scope minden oldala hozzárendelést kapott:

- dashboard
- team pages
- org pages
- hiring pages
- billing/settings pages
- reports/analytics pages
- profile pages

Jelen állapotban nincs „sehova sem illeszkedő” oldal ebben a scope-ban.

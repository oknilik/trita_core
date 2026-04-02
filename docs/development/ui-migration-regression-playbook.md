# UI Migration & Regression Playbook

## Cél

A nagyobb UI migrációk ne egyetlen nehezen review-zható változásban menjenek ki, hanem kis blokkokban, explicit regresszióvédelemmel.

Ez a dokumentum a 8-as kockázatkezelési feladatok központi folyamata.

## 8.1 Blokkonkénti migrációs stratégia

Minden migráció **blokkokra bontva** történik. Egy blokk lehetőleg:

- 1 fő minta (pl. button hotspot, panel hotspot, header chrome),
- 1-3 feature-terület,
- kis diff (célszám: max ~8-12 fájl, kivétel dokumentáltan).

### Kötelező blokk template (PR leírásban vagy taskban)

1. Scope
- Mely komponensek/fájlok érintettek?
- Mi marad kifejezetten scope-on kívül?

2. Csereszabály
- Mit váltunk ki (régi recipe/helper)?
- Melyik primitive/token/API lesz az új source of truth?

3. Visszaellenőrzési pontok
- `pnpm check`
- `pnpm audit:ui`
- `pnpm test:ui:surface`
- `pnpm test:ui:smoke` (vagy célzott `--only=...`)

4. Kockázat és rollback
- Mi törhet el leginkább?
- Mi a gyors visszaállítási út?

### Merge feltétel blokkra

- A blokk önállóan review-zható.
- Tartalmaz regresszióellenőrzést.
- Nem hagy rejtett párhuzamos implementációt dokumentálatlanul.

## 8.2 Kritikus entrypoint smoke check

Minden jelentős UI migráció után kötelező smoke kör futtatása.

Minimum entrypoint coverage:

- onboarding
- join
- apply
- observe
- profile/results
- org dashboard
- team dashboard

### Futtatás

- Check list: `pnpm test:ui:smoke:list`
- Teljes smoke: `pnpm test:ui:smoke`
- Célzott blokk smoke: `pnpm test:ui:smoke -- --only=journey-entrypoints,join-apply-integration`

### Mit futtat a smoke orchestrator

- E2E journey entrypoint smoke
- E2E assessment flow smoke
- E2E observe flow smoke
- Integration join/apply smoke
- Integration journey destination smoke
- Surface character guardrail

Megjegyzés:
Az org/team/profile dashboard esetén jelenleg a destination és guardrail logika integration tesztelt; vizuális regresszióhoz manuális UX pass továbbra is javasolt.

## 8.3 Surface karakter megőrzése

Egységesítés közben a self/team/org karakter nem veszhet el.

### Kötelező technikai guardrail

- `pnpm test:ui:surface`

Ez ellenőrzi:

- kötelező surface tokenek létezését (`self/team/org` accent + soft),
- `PlatformPageShell` surface mappinget,
- `Card` és `SectionEyebrow` surface mappinget,
- `SurfaceHero` mindhárom variánsát.

### Manuális vizuális sign-off (rövid)

Minden nagy blokk után nézd meg legalább:

- self oldal (pl. `/profile/results`)
- team oldal (pl. `/team/[id]`)
- org oldal (pl. `/org/[id]`)

Checklist:

- van felismerhető surface accent különbség,
- CTA/fókusz állapotok konzisztens primitive-ből jönnek,
- nincs “lapos” teljes uniformizáció (mindhárom surface vizuálisan azonos).

## Ajánlott release sorrend

1. Blokk tervezés + scope rögzítés.
2. Kódmigráció blokkban.
3. Guardrail + smoke futtatás.
4. Rövid manuális surface check.
5. Merge.


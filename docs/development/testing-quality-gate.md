# Testing Quality Gate — No Test, No Merge

Ez a dokumentum rögzíti a minimális tesztelési követelményeket a kritikus domain területekre.

## Cél

Nem coverage-maximalizálás, hanem regresszióvédelem:

- journey
- join
- observer
- billing
- assessment
- policy

Rétegfelelősségek (mit melyik teszttípus véd): `docs/test-ownership.md`

## Szabály

Ha a fenti modulok valamelyike módosul:

- kötelező legalább 1 unit teszt módosítás (`tests/unit/**`)
- kötelező legalább 1 integration teszt módosítás (`tests/integration/**`)
- kritikus flow módosításnál kötelező E2E teszt update (`tests/e2e/**`)

## Mit enforce-olunk automatikusan

PR-ben fut a `Quality Gate` workflow lépés, ami a `scripts/quality-gate-check.mjs` scriptet hívja:

- összehasonlítja a PR base és head commitokat
- detektálja, hogy érintett-e védett modul
- ellenőrzi, hogy történt-e unit + integration teszt módosítás
- kritikus flow fájlmódosításnál ellenőrzi az E2E teszt változást

Ha valamelyik hiányzik, a check fail-el.

## Lokális futtatás

- `pnpm test:quality-gate` (HEAD~1 diffre)
- `pnpm test:quality-gate:staged` (staged változásokra)

## PR folyamat

`.github/pull_request_template.md` tartalmazza a kötelező quality gate checklistet.

## Fontos korlát

Ez path-alapú részleges enforce (heurisztika), nem teljes szemantikus elemzés.

- Ha az automatika átenged valamit, de valós kritikus üzleti logika változott, reviewer döntés alapján továbbra is kérhető extra teszt.
- Ha false positive van, a PR leírásban rövid indoklás + következő cleanup lépés szükséges.

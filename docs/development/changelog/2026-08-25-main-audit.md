# Main-ág audit a 08-24–25-ös kiadási hullámról — 2026-08-25

Utólagos audit a két nap alatt a `main`-re került 18 PR-ról (#45–#63,
mind éles deployjal). Teljes jelentés:
`docs/audits/napi-audit-main-2026-08-24-25.md`.

## Fő megállapítások

- A minőségi kapuk a `main@4191bce` csúcson zöldek (type-check 0, lint 0,
  unit + client + CI production build + pilot gate).
- A #45 és #53 audit-javító körök a P0-célokat hibátlanul hozták
  (tranzakcionalitás, atomikus claim-ek, anonimitás-padlók, truthful email).
- **5 megerősített P1** maradt a mainen: observer „Vissza" gomb
  lapozáshatáron; kudos-feed címzetti beleegyezési rés; `text-fluid-heading`
  fantom-utility a blog-indexen; TeamActionEvent kulcs-korrupció;
  hírlevél-route-ok file-tracing hézaga (éles ellenőrzést igényel).
- Folyamat: 08-24-én 5 PR piros main-re merge-ölt (a #48
  guardrail-regressziója ~12 órán át élesben — az API-szintű policy tartott);
  a PR-eken nem volt code review; a changelog 08-25-re üresen maradt;
  a CLAUDE.md és a launch-checklist több ponton elavult.
- Migrációk élesítése kézi (`migrate deploy` nincs a buildben) — a három új
  migráció alkalmazása a prod DB-n ellenőrzendő.

A javasolt javítási sorrend a jelentés 8. pontjában.

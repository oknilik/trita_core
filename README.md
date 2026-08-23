# Trita

Személyiség- és csapatintelligencia platform, **tanácsadás-vezérelt
(consulting-led)** modellben. Önértékelő személyiségfelmérés + ismerősi/kollégai
(observer) visszajelzés + csapat-szintű elemzések. A platform a tanácsadói munka
demonstrációs és követő eszköze.

A teljes projekt-kontextus (üzleti modell, architektúra, konvenciók):
**[`CLAUDE.md`](./CLAUDE.md)**.

## Indulás

```bash
pnpm install                       # a postinstall lefuttatja a prisma generate-et
cp .env.example .env.local         # töltsd ki — a fájl minden változót magyaráz
pnpm dev                           # http://localhost:3000
```

Kötelező minimum a futáshoz: Clerk kulcsok, `DATABASE_URL` + `DIRECT_URL`,
`RESEND_API_KEY`, `ADMIN_EMAILS`, `NEXT_PUBLIC_APP_URL`. A teljes, jelölt lista
(`[KÖTELEZŐ]` / `[ÉLES]` / `[OPCIONÁLIS]`) a **[`.env.example`](./.env.example)**-ben van.

> A `.env*` fájlokhoz soha ne nyúlj commitban, és secretet ne tegyél a repóba.

## Tech stack

Next.js 16 (App Router, Turbopack) · TypeScript strict · Tailwind CSS v4 ·
Clerk (auth) · Neon PostgreSQL + Prisma 6 · Resend (email) · Upstash (rate limit)

## Parancsok

| Parancs | Mit csinál |
|---|---|
| `pnpm dev` | fejlesztői szerver |
| `pnpm build` | éles build (`prisma generate` + `next build`) |
| `pnpm check` | type-check + lint + szín-guardrail |
| `pnpm test:unit` | unit tesztek (node:test + tsx) |
| `pnpm test:client` | kliens-komponens tesztek (vitest + testing-library) |
| `pnpm test:integration` | integrációs tesztek — **dedikált teszt-DB kell** |
| `pnpm test:e2e` | Playwright end-to-end |
| `pnpm test:pilot` | pilot-kiadási kapu (Scan v1 lánc + kritikus e2e utak) |
| `pnpm preview:emails` | email-sablonok előnézete |

Elvárás minden PR-en: **type-check 0 hiba, lint 0 hiba, unit + client zölden.**
Ugyanezt a CI is futtatja (`.github/workflows/tests.yml`).

### Integrációs és e2e tesztek adatbázisa

```bash
cp .env.test.example .env.test     # dedikált teszt-DB (NEM a dev DB)
pnpm test:integration:bootstrap    # migrate + reset + seed
pnpm test:integration
```

A resolver megtagadja a futást, ha a teszt-DB azonos a dev DB-vel.

## Dokumentáció

| Hol | Mit |
|---|---|
| `CLAUDE.md` | projekt-kontextus, architektúra, konvenciók |
| `docs/development/launch-checklist.md` | kódból NEM intézhető élesítési teendők |
| `docs/development/changelog/` | napi változásnapló |
| `docs/architecture/` | ADR-ek, journey- és notification-architektúra |
| `docs/audits/` | egyszeri auditok |
| `docs/pilot/` | tanácsadói playbook és kampány-ütemterv |
| `docs/development/ui-token-map.md` | design-token térkép |
| `docs/api/openapi.yaml` | API-leíró |

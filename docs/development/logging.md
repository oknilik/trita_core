# Logging — konvenciók (2026-07-29)

## Belépési pontok

| Környezet | Import | Mikor |
|---|---|---|
| Route handler / server component | `getRequestLogger("modul")` — `@/lib/logger.server` | kérés-kötött kód: automatikusan requestId + path binding |
| Szerver-lib, cron, import-idő | `createLogger("modul")` — `@/lib/logger` | nincs kérés-kontextus |
| Kliens (`"use client"`) | `createClientLogger("modul")` — `@/lib/client-logger` | böngésző; prodban csak warn/error jut ki |

`console.*` az `src/` alatt **lint-error** (no-console). A két logger-fájl
belső sinkje az egyetlen kivétel.

## Formátum

- **Production**: egysoros JSON stdout/stderr-re (error/warn → stderr, a
  Vercel eszerint címkéz). Mezők: `level`, `time` (ISO), `msg`, `module`,
  `requestId`, `path` + hívó mezői.
- **Dev**: színezett olvasható sor (`HH:MM:SS LEVEL [module] msg {mezők}`);
  `LOG_JSON=1` dev-ben is JSON-t kényszerít (tesztek ezt használják).
- **Szint**: `LOG_LEVEL` env (`debug|info|warn|error`); default prod=info,
  dev=debug.

## Hívási minta

```ts
const log = await getRequestLogger("campaign");
log.info({ event: "campaign.activated", campaignId, orgId }, "Campaign activated");
log.error({ event: "email.send_failed", template: "org_invite", to, err }, "Failed to send org invite");
```

Szabályok:

1. **`event` mező kötelező** minden érdemi sorra: `domain.action[_result]`
   (pl. `email.sent`, `assessment.submit_invalid`, `clerk.email_created`).
   A log-drainben ezen keresünk/aggregálunk.
2. **Azonosítók mezőben, sosem az üzenetben** — `orgId`, `campaignId`,
   `userId`, `to`… Az `msg` stabil, kereshető angol mondat.
3. **Hibát az `err` mező alá** — Error-objektum name/message/stack/cause-zá
   szerializálódik.
4. **Szint-választás**: `error` = akció kell; `warn` = várható-de-rossz
   (invalid input, hiányzó konfig); `info` = üzleti esemény; `debug` =
   fejlesztői részlet (prodban nem jelenik meg).
5. **Secret/PII**: kulcs-alapú automatikus redaction
   (token/secret/password/authorization/cookie/apiKey → `[REDACTED]`),
   de ez védőháló — secretet eleve ne adj át. OTP-kódot, nyers webhook
   payloadot TILOS logolni (a Clerk webhook csak kulcs-listát logol).

## Request-korreláció

- A `src/proxy.ts` minden kérésre `x-request-id`-t generál (a bejövőt
  tiszteletben tartja), request- ÉS response-fejlécre is felteszi, plusz
  `x-pathname`-t a request-fejlécekre.
- `getRequestLogger` ezekből bindingol — egy kérés minden logsora ugyanazt
  a `requestId`-t viseli, és a kliens a response-fejlécből tudja idézni
  hibabejelentésnél.
- Kezeletlen szerver-hibák: `src/instrumentation.ts` `onRequestError` →
  `event: "server.unhandled_error"` requestId-vel.

## Tesztek

`tests/unit/platform/logger.test.ts` — formátum, szint-küszöb, child
bindingok, err-szerializálás, redaction. A journey-trace teszt
(`observability.test.ts`) a strukturált kimenetet ellenőrzi.

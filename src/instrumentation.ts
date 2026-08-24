// Next.js instrumentation hook — minden KEZELETLEN szerver-oldali hiba
// (route handler, server component, server action) egységes, strukturált
// logsort kap request-korrelációval. A kezelt hibákat a hívó helyek
// logolják; ez az utolsó védőháló.
//
// A logsor mellé riasztás is megy (`sendErrorAlert`), ha az
// ERROR_ALERT_WEBHOOK_URL be van állítva — enélkül a hiba a Vercel
// stdout-jában maradna, ahova senki nem néz.

import type { Instrumentation } from "next";
import { createLogger } from "@/lib/logger";
import { sendErrorAlert } from "@/lib/error-alert";

const log = createLogger("unhandled");

export const onRequestError: Instrumentation.onRequestError = async (
  err,
  request,
  context,
) => {
  const requestId =
    typeof request.headers?.["x-request-id"] === "string"
      ? (request.headers["x-request-id"] as string)
      : undefined;

  log.error(
    {
      event: "server.unhandled_error",
      err,
      method: request.method,
      path: request.path,
      requestId,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
    "Unhandled server error",
  );

  // Az instrumentation hook Promise-át a runtime életben tartja. A modul a
  // webhook hibáját továbbra is elnyeli, de a serverless request nem ér véget
  // a kézbesítési kísérlet előtt.
  const error = err as { name?: string; message?: string; digest?: string };
  await sendErrorAlert({
    event: "server.unhandled_error",
    origin: "server",
    // A `routePath` a minta (`/team/[id]`), nem a konkrét URL — így az
    // azonosítók nem kerülnek a riasztásba.
    path: context.routePath ?? request.path ?? null,
    name: error?.name ?? null,
    message: error?.message ?? null,
    digest: error?.digest ?? null,
    requestId: requestId ?? null,
  });
};

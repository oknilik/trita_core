// Next.js instrumentation hook — minden KEZELETLEN szerver-oldali hiba
// (route handler, server component, server action) egységes, strukturált
// logsort kap request-korrelációval. A kezelt hibákat a hívó helyek
// logolják; ez az utolsó védőháló.

import type { Instrumentation } from "next";
import { createLogger } from "@/lib/logger";

const log = createLogger("unhandled");

export const onRequestError: Instrumentation.onRequestError = (
  err,
  request,
  context,
) => {
  log.error(
    {
      event: "server.unhandled_error",
      err,
      method: request.method,
      path: request.path,
      requestId: request.headers["x-request-id"] ?? undefined,
      routerKind: context.routerKind,
      routePath: context.routePath,
      routeType: context.routeType,
    },
    "Unhandled server error",
  );
};

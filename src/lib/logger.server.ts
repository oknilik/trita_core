// Request-kötött logger — a proxy által beállított x-request-id és
// x-pathname fejlécekkel dúsít, így egy kérés összes logsora korrelálható.
// Route handlerben és server componentben hívható; kérés-kontextuson kívül
// (cron, fire-and-forget) csendben visszaesik a sima modul-loggerre.

import "server-only";

import { headers } from "next/headers";
import { createLogger, type Logger } from "@/lib/logger";

export async function getRequestLogger(module: string): Promise<Logger> {
  const base = createLogger(module);
  try {
    const h = await headers();
    const requestId = h.get("x-request-id");
    const path = h.get("x-pathname");
    return base.child({
      ...(requestId ? { requestId } : {}),
      ...(path ? { path } : {}),
    });
  } catch {
    return base;
  }
}

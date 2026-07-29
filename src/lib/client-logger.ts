"use client";

// Kliens-oldali logger — ugyanaz az API, mint a szerver-oldali logger.ts,
// de a böngésző console-jára ír. Dev-ben minden szint látszik, prodban
// csak warn/error (a debug/info sose jusson el a felhasználó konzoljára).
// Szerver-kódban a @/lib/logger (ill. logger.server) a helyes import.

import type { LogFields, Logger, LogLevel } from "@/lib/logger";

const PROD_VISIBLE: LogLevel[] = ["warn", "error"];

function makeClientLogger(bindings: LogFields): Logger {
  const log =
    (level: LogLevel) =>
    (fieldsOrMsg: LogFields | string, maybeMsg?: string): void => {
      if (
        process.env.NODE_ENV === "production" &&
        !PROD_VISIBLE.includes(level)
      ) {
        return;
      }
      const fields = typeof fieldsOrMsg === "string" ? {} : fieldsOrMsg;
      const msg = typeof fieldsOrMsg === "string" ? fieldsOrMsg : (maybeMsg ?? "");
      /* eslint-disable no-console -- a client-logger az engedélyezett console-hívó */
      const sink =
        level === "error"
          ? console.error
          : level === "warn"
            ? console.warn
            : console.log;
      /* eslint-enable no-console */
      const mod = bindings.module ? `[${String(bindings.module)}] ` : "";
      if (Object.keys(fields).length > 0 || Object.keys(bindings).length > 1) {
        sink(`${mod}${msg}`, { ...bindings, ...fields });
      } else {
        sink(`${mod}${msg}`);
      }
    };
  return {
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error: log("error"),
    child: (fields: LogFields) => makeClientLogger({ ...bindings, ...fields }),
  };
}

export function createClientLogger(module: string): Logger {
  return makeClientLogger({ module });
}

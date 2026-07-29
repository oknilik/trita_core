"use client";

// Kliens-oldali logger — ugyanaz az API, mint a szerver-oldali logger.ts,
// de a böngésző console-jára ír. Dev-ben minden szint látszik, prodban
// csak warn/error (a debug/info sose jusson el a felhasználó konzoljára).
// Szerver-kódban a @/lib/logger (ill. logger.server) a helyes import.

import type { LogFields, Logger, LogLevel } from "@/lib/logger";

const PROD_VISIBLE: LogLevel[] = ["warn", "error"];

/** Error → olvasható mező-objektum (a nyers Error spreadje {}-t adna). */
function serializeClientError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return { name: err.name, message: err.message };
  }
  if (err && typeof err === "object") {
    // Clerk-hibák: errors[] tömb a hasznos rész
    const anyErr = err as { errors?: Array<{ code?: string; message?: string }>; message?: string };
    if (Array.isArray(anyErr.errors)) {
      return { errors: anyErr.errors.map((e) => ({ code: e.code, message: e.message })) };
    }
    if (anyErr.message) return { message: anyErr.message };
  }
  return { message: String(err) };
}

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
      const rawFields = typeof fieldsOrMsg === "string" ? {} : fieldsOrMsg;
      const msg = typeof fieldsOrMsg === "string" ? fieldsOrMsg : (maybeMsg ?? "");
      const { err, ...rest } = rawFields;
      const fields: LogFields =
        err !== undefined ? { ...rest, err: serializeClientError(err) } : rest;
      /* eslint-disable no-console -- a client-logger az engedélyezett console-hívó */
      // Dev-ben az error szint is warn-sinkre megy: a Next dev-overlay a
      // console.error-t "Console Error"-ként tolja a felhasználó arcába,
      // a KEZELT hibáknak (UI úgyis jelzi) ott semmi keresnivalójuk.
      const errorSink =
        process.env.NODE_ENV === "production" ? console.error : console.warn;
      const sink =
        level === "error" ? errorSink : level === "warn" ? console.warn : console.log;
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

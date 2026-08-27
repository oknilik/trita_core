// ─────────────────────────────────────────────────────────────────────
// Strukturált logger — zéró dependency, Node ÉS edge runtime alatt fut.
//
// Használat:
//   const log = createLogger("email");
//   log.info({ event: "email.sent", to, template }, "Observer invite sent");
//   log.error({ event: "email.send_failed", err }, "Send failed");
//
// Konvenciók:
//   - `event`: pont-szeparált esemény-név (domain.action[_result]) — ezen
//     lehet keresni/aggregálni a log-drainben.
//   - entitás-azonosítók mezőként (orgId, campaignId, userId, requestId…),
//     SOHA a szöveges üzenetbe fűzve.
//   - `err` mező alá Error-objektum — name/message/stack-ké szerializálódik.
//   - Request-kötött kódban a logger.server.ts getRequestLogger()-e ad
//     requestId-vel dúsított loggert.
//
// Kimenet: production → egysoros JSON (Vercel log drain barát);
// dev → színezett, olvasható sor. LOG_JSON=1 dev-ben is JSON-t kényszerít.
// Szint: LOG_LEVEL env (debug|info|warn|error), default: prod=info, dev=debug.
// ─────────────────────────────────────────────────────────────────────

export type LogLevel = "debug" | "info" | "warn" | "error";

export type LogFields = Record<string, unknown>;

const LEVEL_ORDER: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

function resolveThreshold(): number {
  const raw = process.env.LOG_LEVEL?.trim().toLowerCase();
  if (raw && raw in LEVEL_ORDER) return LEVEL_ORDER[raw as LogLevel];
  return process.env.NODE_ENV === "production"
    ? LEVEL_ORDER.info
    : LEVEL_ORDER.debug;
}

const REDACT_KEY_PATTERN =
  /token|secret|password|authorization|cookie|api[-_]?key|clerk[-_]?key/i;

/** Kulcs-alapú rekurzív redaction — mélység-limittel, ciklus-védelemmel. */
function redact(value: unknown, depth = 0, seen?: WeakSet<object>): unknown {
  if (value === null || typeof value !== "object") return value;
  if (depth >= 4) return "[Truncated]";
  const tracker = seen ?? new WeakSet<object>();
  if (tracker.has(value as object)) return "[Circular]";
  tracker.add(value as object);
  if (Array.isArray(value)) {
    return value.map((v) => redact(v, depth + 1, tracker));
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    out[k] = REDACT_KEY_PATTERN.test(k) ? "[REDACTED]" : redact(v, depth + 1, tracker);
  }
  return out;
}

function serializeError(err: unknown): Record<string, unknown> {
  if (err instanceof Error) {
    return {
      name: err.name,
      message: err.message,
      stack: err.stack,
      ...(err.cause ? { cause: serializeError(err.cause) } : {}),
    };
  }
  return { message: String(err) };
}

function prepareFields(fields: LogFields): LogFields {
  const { err, ...rest } = fields;
  const prepared = redact(rest) as LogFields;
  if (err !== undefined) prepared.err = serializeError(err);
  return prepared;
}

const DEV_COLORS: Record<LogLevel, string> = {
  debug: "\x1b[90m", // szürke
  info: "\x1b[36m", // cián
  warn: "\x1b[33m", // sárga
  error: "\x1b[31m", // piros
};
const COLOR_RESET = "\x1b[0m";

function isPrettyOutput(): boolean {
  return (
    process.env.NODE_ENV !== "production" && process.env.LOG_JSON !== "1"
  );
}

/* eslint-disable no-console -- a logger az egyetlen engedélyezett console-hívó */
function emit(level: LogLevel, bindings: LogFields, fields: LogFields, msg: string): void {
  const record = {
    level,
    time: new Date().toISOString(),
    msg,
    ...bindings,
    ...prepareFields(fields),
  };
  // console.error/warn stderr-re megy — Vercel ez alapján címkéz.
  const sink = level === "error" ? console.error : level === "warn" ? console.warn : console.log;

  if (!isPrettyOutput()) {
    sink(JSON.stringify(record));
    return;
  }

  const { module: mod, ...restRecord } = record as LogFields & { module?: string };
  delete restRecord.level;
  delete restRecord.time;
  delete restRecord.msg;
  const hhmmss = record.time.slice(11, 19);
  const head = `${DEV_COLORS[level]}${hhmmss} ${level.toUpperCase().padEnd(5)}${COLOR_RESET}`;
  const modPart = mod ? ` \x1b[1m[${mod}]\x1b[0m` : "";
  const extras = Object.keys(restRecord).length > 0 ? ` ${JSON.stringify(restRecord)}` : "";
  sink(`${head}${modPart} ${msg}${extras}`);
}
/* eslint-enable no-console */

export interface Logger {
  debug(fields: LogFields, msg: string): void;
  debug(msg: string): void;
  info(fields: LogFields, msg: string): void;
  info(msg: string): void;
  warn(fields: LogFields, msg: string): void;
  warn(msg: string): void;
  error(fields: LogFields, msg: string): void;
  error(msg: string): void;
  /** Új logger a meglévő bindingok + a megadott mezők összefésülésével. */
  child(fields: LogFields): Logger;
}

function makeLogger(bindings: LogFields): Logger {
  const log =
    (level: LogLevel) =>
    (fieldsOrMsg: LogFields | string, maybeMsg?: string): void => {
      if (LEVEL_ORDER[level] < resolveThreshold()) return;
      const fields = typeof fieldsOrMsg === "string" ? {} : fieldsOrMsg;
      const msg = typeof fieldsOrMsg === "string" ? fieldsOrMsg : (maybeMsg ?? "");
      emit(level, bindings, fields, msg);
    };
  return {
    debug: log("debug"),
    info: log("info"),
    warn: log("warn"),
    error: log("error"),
    child: (fields: LogFields) => makeLogger({ ...bindings, ...fields }),
  };
}

/** Modul-szintű logger – a `module` mező minden sorba bekerül. */
export function createLogger(module: string): Logger {
  return makeLogger({ module });
}

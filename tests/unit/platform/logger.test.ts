import test from "node:test";
import assert from "node:assert/strict";
import { createLogger } from "@/lib/logger";

type Captured = { channel: "log" | "warn" | "error"; line: string };

function capture(fn: () => void): Captured[] {
  const rows: Captured[] = [];
  const orig = { log: console.log, warn: console.warn, error: console.error };
  console.log = (line: string) => void rows.push({ channel: "log", line });
  console.warn = (line: string) => void rows.push({ channel: "warn", line });
  console.error = (line: string) => void rows.push({ channel: "error", line });
  try {
    fn();
  } finally {
    console.log = orig.log;
    console.warn = orig.warn;
    console.error = orig.error;
  }
  return rows;
}

function withEnv(env: Record<string, string | undefined>, fn: () => void): void {
  const prev: Record<string, string | undefined> = {};
  for (const [k, v] of Object.entries(env)) {
    prev[k] = process.env[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
  try {
    fn();
  } finally {
    for (const [k, v] of Object.entries(prev)) {
      if (v === undefined) delete process.env[k];
      else process.env[k] = v;
    }
  }
}

const JSON_ENV = { LOG_JSON: "1", LOG_LEVEL: "debug" };

test("JSON kimenet: level/time/msg/module + mezők", () => {
  withEnv(JSON_ENV, () => {
    const rows = capture(() => {
      createLogger("teszt").info({ event: "x.y", orgId: "o1" }, "hello");
    });
    assert.equal(rows.length, 1);
    assert.equal(rows[0].channel, "log");
    const rec = JSON.parse(rows[0].line);
    assert.equal(rec.level, "info");
    assert.equal(rec.module, "teszt");
    assert.equal(rec.msg, "hello");
    assert.equal(rec.event, "x.y");
    assert.equal(rec.orgId, "o1");
    assert.ok(!Number.isNaN(Date.parse(rec.time)));
  });
});

test("szint-küszöb: LOG_LEVEL=warn alatt a debug/info elnyelődik", () => {
  withEnv({ LOG_JSON: "1", LOG_LEVEL: "warn" }, () => {
    const rows = capture(() => {
      const log = createLogger("teszt");
      log.debug("d");
      log.info("i");
      log.warn("w");
      log.error("e");
    });
    assert.deepEqual(
      rows.map((r) => r.channel),
      ["warn", "error"],
    );
  });
});

test("child bindingok összefésülődnek és felülírhatók", () => {
  withEnv(JSON_ENV, () => {
    const rows = capture(() => {
      createLogger("teszt")
        .child({ requestId: "r1", orgId: "o1" })
        .child({ orgId: "o2" })
        .info("m");
    });
    const rec = JSON.parse(rows[0].line);
    assert.equal(rec.requestId, "r1");
    assert.equal(rec.orgId, "o2");
  });
});

test("err mező Error-ként szerializálódik (name/message/stack)", () => {
  withEnv(JSON_ENV, () => {
    const rows = capture(() => {
      createLogger("teszt").error(
        { err: new Error("boom", { cause: new Error("root") }) },
        "failed",
      );
    });
    const rec = JSON.parse(rows[0].line);
    assert.equal(rec.err.name, "Error");
    assert.equal(rec.err.message, "boom");
    assert.ok(String(rec.err.stack).includes("logger.test"));
    assert.equal(rec.err.cause.message, "root");
  });
});

test("redaction: secret-gyanús kulcsok rejtve, mélyen is", () => {
  withEnv(JSON_ENV, () => {
    const rows = capture(() => {
      createLogger("teszt").info(
        {
          token: "t",
          nested: { apiKey: "k", authorization: "Bearer x", safe: "ok" },
          password: "p",
        },
        "m",
      );
    });
    const rec = JSON.parse(rows[0].line);
    assert.equal(rec.token, "[REDACTED]");
    assert.equal(rec.password, "[REDACTED]");
    assert.equal(rec.nested.apiKey, "[REDACTED]");
    assert.equal(rec.nested.authorization, "[REDACTED]");
    assert.equal(rec.nested.safe, "ok");
  });
});

test("csak-üzenet forma is működik", () => {
  withEnv(JSON_ENV, () => {
    const rows = capture(() => createLogger("teszt").info("plain"));
    const rec = JSON.parse(rows[0].line);
    assert.equal(rec.msg, "plain");
  });
});

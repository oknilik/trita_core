// ─────────────────────────────────────────────────────────────────────
// Kérésenkénti DB-metrika — query-darabszám, össz-DB-idő, duplikátumok.
//
// Csak akkor kapcsol be, ha a DB_METRICS env "1". Kikapcsolva a Prisma
// kliensre RÁ SEM kerül az extension, tehát nulla futásidejű költség.
//
// Korreláció: a proxy minden kérésre beállítja az x-request-id és
// x-pathname REQUEST-fejlécet (src/proxy.ts). A Prisma-extension callbackje
// a szerver-komponens / route handler async kontextusában fut, így a
// next/headers headers()-e elérhető — ezen kulcsolunk.
//
// Kiírás: a kérés utolsó query-je után DB_METRICS_FLUSH_MS csenddel egy
// összesítő logsor megy ki (event: "db.request_summary").
//
// Használat:
//   DB_METRICS=1 pnpm dev
//   # majd: scripts/measure-page-queries.mjs
// ─────────────────────────────────────────────────────────────────────

// FONTOS: itt NINCS "server-only" — a prisma.ts-t seed/CLI szkriptek is
// importálják (Next-kontextuson kívül). A next/headers csak dinamikusan,
// try/catch-ben töltődik be, így ott is elhasal, nem robban.

import { Prisma } from "@prisma/client";
import { createLogger } from "@/lib/logger";

const log = createLogger("db-metrics");

export function isDbMetricsEnabled(): boolean {
  return process.env.DB_METRICS === "1";
}

/** Csend-idő az utolsó query után, ami után az összesítő kimegy. */
const FLUSH_MS = Number(process.env.DB_METRICS_FLUSH_MS ?? 400);
/** Ennyi különböző signature kerül be a top-listába. */
const TOP_N = Number(process.env.DB_METRICS_TOP ?? 12);

interface RequestBucket {
  requestId: string;
  path: string;
  count: number;
  totalMs: number;
  maxMs: number;
  /** Query-intervallumok (ms, a bucket kezdetétől) a párhuzamosság-elemzéshez. */
  spans: Array<[number, number]>;
  /** signature (model.operation + args-hash) → hányszor futott */
  signatures: Map<string, number>;
  /** model.operation → darabszám (a signature-nél durvább bontás) */
  operations: Map<string, number>;
  firstAt: number;
  timer: ReturnType<typeof setTimeout> | null;
}

const buckets = new Map<string, RequestBucket>();

/** Stabil, rövid args-ujjlenyomat — a duplikátum-felismeréshez. */
function fingerprintArgs(args: unknown): string {
  let json: string;
  try {
    json = JSON.stringify(args, (_key, value) =>
      value instanceof Date ? "<date>" : value,
    );
  } catch {
    return "?";
  }
  if (!json) return "-";
  // FNV-1a — elég egy azonosság-ellenőrzéshez, nem kriptográfia.
  let h = 0x811c9dc5;
  for (let i = 0; i < json.length; i += 1) {
    h ^= json.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(36);
}

/**
 * Hány EGYMÁS UTÁNI körfordulás-hullámban ment ki a kérés összes query-je?
 *
 * Ez a legfontosabb szám a válaszidőhöz: a DB-oldali alsó korlát nagyjából
 * `hullám × körfordulás-idő`. A hullámokat mohón számoljuk: a kezdés szerint
 * rendezett intervallumokat addig soroljuk egy hullámba, amíg átfednek —
 * az első nem átfedő query új hullámot nyit.
 *
 * Együtt olvasandó a `parallelism`-mal (összes DB-idő / DB-időszak hossza):
 *  - parallelism ≈ pool-méret  → a POOL fogja vissza (emeld a limitet),
 *  - parallelism ≈ 1           → WATERFALL (a kód várakoztat, nem a pool).
 */
function analyzeSpans(spans: Array<[number, number]>): {
  waves: number;
  spanMs: number;
  parallelism: number;
} {
  if (spans.length === 0) return { waves: 0, spanMs: 0, parallelism: 0 };
  const sorted = [...spans].sort((a, b) => a[0] - b[0]);
  let waves = 1;
  let waveEnd = sorted[0][1];
  for (const [start, end] of sorted.slice(1)) {
    if (start >= waveEnd) {
      waves += 1;
      waveEnd = end;
    } else if (end > waveEnd) {
      waveEnd = end;
    }
  }
  const first = sorted[0][0];
  const last = sorted.reduce((max, [, end]) => (end > max ? end : max), 0);
  const spanMs = last - first;
  const totalMs = sorted.reduce((sum, [s, e]) => sum + (e - s), 0);
  return {
    waves,
    spanMs,
    parallelism: spanMs > 0 ? Number((totalMs / spanMs).toFixed(1)) : 1,
  };
}

function flush(key: string): void {
  const bucket = buckets.get(key);
  if (!bucket) return;
  buckets.delete(key);

  const duplicates = [...bucket.signatures.values()].reduce(
    (sum, n) => sum + (n - 1),
    0,
  );
  const topSignatures = [...bucket.signatures.entries()]
    .filter(([, n]) => n > 1)
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([sig, n]) => `${sig}×${n}`);
  const topOperations = [...bucket.operations.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, TOP_N)
    .map(([op, n]) => `${op}×${n}`);

  const { waves, spanMs, parallelism } = analyzeSpans(bucket.spans);

  log.info(
    {
      event: "db.request_summary",
      requestId: bucket.requestId,
      path: bucket.path,
      queries: bucket.count,
      duplicateQueries: duplicates,
      dbMs: Math.round(bucket.totalMs),
      slowestMs: Math.round(bucket.maxMs),
      wallMs: Math.round(Date.now() - bucket.firstAt),
      /** Egymás utáni körfordulás-hullámok száma (ld. analyzeSpans). */
      waves,
      /** Az első query kezdetétől az utolsó végéig eltelt idő. */
      dbSpanMs: Math.round(spanMs),
      /** dbMs / dbSpanMs — a tényleges párhuzamossági fok. */
      parallelism,
      topOperations,
      duplicateSignatures: topSignatures,
    },
    `${bucket.path} — ${bucket.count} query, ${waves} hullám (${duplicates} duplikátum)`,
  );
}

function record(
  key: string,
  requestId: string,
  path: string,
  signature: string,
  operation: string,
  startedAt: number,
  endedAt: number,
): void {
  const ms = endedAt - startedAt;
  let bucket = buckets.get(key);
  if (!bucket) {
    bucket = {
      requestId,
      path,
      count: 0,
      totalMs: 0,
      maxMs: 0,
      spans: [],
      signatures: new Map(),
      operations: new Map(),
      firstAt: Date.now(),
      timer: null,
    };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  bucket.totalMs += ms;
  bucket.spans.push([startedAt, endedAt]);
  if (ms > bucket.maxMs) bucket.maxMs = ms;
  bucket.signatures.set(signature, (bucket.signatures.get(signature) ?? 0) + 1);
  bucket.operations.set(operation, (bucket.operations.get(operation) ?? 0) + 1);

  if (bucket.timer) clearTimeout(bucket.timer);
  bucket.timer = setTimeout(() => flush(key), FLUSH_MS);
  bucket.timer.unref?.();
}

/**
 * Kérés-azonosító a proxy fejlécéből. Kérés-kontextuson kívül (cron,
 * seed, fire-and-forget) null — ilyenkor nem gyűjtünk.
 */
async function readRequestContext(): Promise<{ id: string; path: string } | null> {
  try {
    const { headers } = await import("next/headers");
    const h = await headers();
    const id = h.get("x-request-id");
    if (!id) return null;
    return { id, path: h.get("x-pathname") ?? "?" };
  } catch {
    return null;
  }
}

export const dbMetricsExtension = Prisma.defineExtension({
  name: "trita-db-metrics",
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const ctx = await readRequestContext();
        const startedAt = performance.now();
        try {
          return await query(args);
        } finally {
          if (ctx) {
            const op = `${model}.${operation}`;
            record(
              ctx.id,
              ctx.id,
              ctx.path,
              `${op}#${fingerprintArgs(args)}`,
              op,
              startedAt,
              performance.now(),
            );
          }
        }
      },
    },
  },
});

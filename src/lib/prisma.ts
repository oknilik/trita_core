import { PrismaClient } from "@prisma/client";
import { dbMetricsExtension, isDbMetricsEnabled } from "@/lib/db-metrics";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

/**
 * Prisma pool-méret.
 *
 * A korábbi fix `connection_limit=3` a Neon DIREKT endpointjának szólt
 * („free tier / dev HMR kapcsolat-kimerülés"). A DATABASE_URL viszont a
 * POOLED endpointra mutat (`…-pooler.…neon.tech`), ahol a PgBouncer
 * multiplexel — ott a 3-as korlát már nem véd semmitől, viszont sorosítja
 * a renderek `Promise.all`-jait.
 *
 * Mérve (2026-07-30, dev gépről Neon eu-central-1-re): 30 párhuzamos
 * indexelt count — limit=3: 282 ms · limit=10: 116 ms · limit=20: 91 ms.
 * A soros körfordulás medián 24 ms, tehát a nyereség tisztán a
 * párhuzamosságból jön.
 *
 * Miért nem több: serverless alatt MINDEN futó példánynak SAJÁT pool-ja van,
 * a szorzat pedig a pooler kliens-korlátjába fut. A 10 óvatos középút; ha
 * hangolni kell, a `PRISMA_CONNECTION_LIMIT` env felülírja (nem kell deploy).
 * DIREKT (nem pooled) endpointra visszatérve vidd vissza 3–5-re.
 */
const DEFAULT_CONNECTION_LIMIT = 10;

function resolveConnectionLimit(): number {
  const raw = Number(process.env.PRISMA_CONNECTION_LIMIT);
  if (Number.isFinite(raw) && raw >= 1 && raw <= 100) return Math.floor(raw);
  return DEFAULT_CONNECTION_LIMIT;
}

function buildDatasourceUrl() {
  const base = process.env.DATABASE_URL;
  if (!base) return undefined;
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}connection_limit=${resolveConnectionLimit()}&connect_timeout=20&pool_timeout=30`;
}

function createPrismaClient(): PrismaClient {
  const client = new PrismaClient({
    log: ["error", "warn"],
    datasourceUrl: buildDatasourceUrl(),
  });

  // DB_METRICS=1 esetén kérésenkénti query-számláló (src/lib/db-metrics.ts).
  // Kikapcsolva az extension rá sem kerül a kliensre – nulla költség.
  // A cast azért biztonságos, mert az extension CSAK `query` hookot ad,
  // a kliens típus-felülete változatlan.
  if (!isDbMetricsEnabled()) return client;
  return client.$extends(dbMetricsExtension) as unknown as PrismaClient;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

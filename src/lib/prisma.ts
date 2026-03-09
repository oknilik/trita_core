import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

function buildDatasourceUrl() {
  const base = process.env.DATABASE_URL;
  if (!base) return undefined;
  // Limit pool size to avoid exhaustion on Neon free tier / dev HMR
  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}connection_limit=5&connect_timeout=15`;
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    datasourceUrl: buildDatasourceUrl(),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

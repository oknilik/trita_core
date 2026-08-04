import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["error", "warn"],
});

type SchemaRow = { schema_name: string };
type TableRow = { table_name: string };

function quoteIdentifier(identifier: string): string {
  return `"${identifier.replace(/"/g, '""')}"`;
}

async function resetCurrentSchema(): Promise<void> {
  const [schemaRow] = await prisma.$queryRaw<SchemaRow[]>`
    SELECT current_schema() AS schema_name
  `;
  const schemaName = schemaRow?.schema_name ?? "public";

  const tableRows = await prisma.$queryRaw<TableRow[]>`
    SELECT tablename AS table_name
    FROM pg_tables
    WHERE schemaname = ${schemaName}
      AND tablename <> '_prisma_migrations'
  `;

  if (tableRows.length === 0) return;

  const qualifiedTables = tableRows
    .map((row) => `${quoteIdentifier(schemaName)}.${quoteIdentifier(row.table_name)}`)
    .join(", ");

  await prisma.$executeRawUnsafe(
    `TRUNCATE TABLE ${qualifiedTables} RESTART IDENTITY CASCADE`,
  );
}

async function main() {
  await resetCurrentSchema();
}

main()
  .catch((error) => {
    console.error("[reset-test-db] failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

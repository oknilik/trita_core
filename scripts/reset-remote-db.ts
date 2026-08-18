/**
 * reset-remote-db — távoli (Vercel/Neon) adatbázis teljes újraépítése a
 * repo migrációs láncára.
 *
 * ROMBOLÓ. A cél-adatbázis `public` sémáját ELDOBJA minden táblával és
 * adattal együtt, majd lefuttatja a `prisma migrate deploy`-t. Nincs
 * visszavonás — a Neon PITR-en kívül semmi nem hozza vissza.
 *
 * Miért kell: a repo migrációs lánca 2026-07-16-on squash-elve újraindul
 * (`20260716120000_init`), a régebbi környezetek DB-jében viszont a squash
 * ELŐTTI history van. A `prisma migrate deploy` ilyenkor vagy P3009-cel
 * (bukott migrációs rekord), vagy "already exists" hibával áll meg. A
 * lánc újrajátszásához tiszta séma kell.
 *
 * Használat:
 *
 *   # 1) env letöltése a Vercelről (production vagy preview)
 *   npx vercel env pull .env.prod --environment=production --yes
 *
 *   # 2) SZÁRAZ FUTÁS — csak kiírja, mit törölne (semmit nem módosít)
 *   npx tsx scripts/reset-remote-db.ts --env-file .env.prod
 *
 *   # 3) éles futás — a --confirm értéke a cél endpoint-azonosító,
 *   #    pontosan úgy, ahogy a száraz futás kiírta
 *   npx tsx scripts/reset-remote-db.ts --env-file .env.prod \
 *     --confirm ep-holy-morning-agjde634 --yes
 *
 * A `--confirm` szándékos súrlódás: ha rossz env-fájlt adsz meg, a
 * hostnév nem fog egyezni, és a script leáll, mielőtt bármit törölne.
 */

import { PrismaClient } from "@prisma/client";
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

type Args = {
  envFile: string;
  confirm: string | null;
  yes: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = { envFile: "", confirm: null, yes: false };
  for (let i = 0; i < argv.length; i += 1) {
    const a = argv[i];
    // A csupasz `--` konvencionális elválasztó, nem kapcsoló: a
    // `pnpm <script> -- --flag` alak továbbadja a scriptnek, és enélkül
    // „Ismeretlen kapcsoló"-val állna le.
    if (a === "--") continue;
    if (a === "--env-file") args.envFile = argv[++i] ?? "";
    else if (a === "--confirm") args.confirm = argv[++i] ?? "";
    else if (a === "--yes") args.yes = true;
    else throw new Error(`Ismeretlen kapcsoló: ${a}`);
  }
  if (!args.envFile) throw new Error("Kötelező: --env-file <útvonal>");
  return args;
}

/** dotenv-formátumú fájl beolvasása (idézőjelek és export-prefix nélkül). */
function readEnvFile(path: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const rawLine of readFileSync(path, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).replace(/^export\s+/, "").trim();
    const value = line
      .slice(eq + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    out[key] = value;
  }
  return out;
}

/**
 * A DDL-t és a migrációkat MINDIG a nem-poolozott (direct) kapcsolaton
 * futtatjuk — a Neon pooler mögött a séma-szintű műveletek megbízhatatlanok.
 */
function resolveUrls(env: Record<string, string>): { pooled: string; direct: string } {
  const pooled = env.DATABASE_URL;
  if (!pooled) throw new Error("Az env-fájlban nincs DATABASE_URL");
  const direct =
    env.DIRECT_URL || env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || pooled;
  return { pooled, direct };
}

function endpointId(url: string): string {
  return new URL(url).hostname.split(".")[0].replace(/-pooler$/, "");
}

async function inventory(prisma: PrismaClient): Promise<void> {
  const tables = await prisma.$queryRawUnsafe<{ table_name: string }[]>(
    `SELECT table_name FROM information_schema.tables
     WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
     ORDER BY table_name`,
  );

  if (tables.length === 0) {
    console.log("A public séma üres — nincs mit törölni, csak a migrációk futnak le.");
    return;
  }

  console.log(`\nTáblák (${tables.length}) és sorszámok:`);
  const counts: { tabla: string; sorok: number }[] = [];
  for (const { table_name } of tables) {
    const rows = await prisma.$queryRawUnsafe<{ n: number }[]>(
      `SELECT count(*)::int AS n FROM "${table_name.replace(/"/g, '""')}"`,
    );
    counts.push({ tabla: table_name, sorok: rows[0].n });
  }
  console.table(counts.sort((a, b) => b.sorok - a.sorok));
  console.log(`Összes sor: ${counts.reduce((s, c) => s + c.sorok, 0)}`);
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const env = readEnvFile(args.envFile);
  const { pooled, direct } = resolveUrls(env);
  const target = endpointId(direct);

  console.log("=".repeat(70));
  console.log(`CÉL ADATBÁZIS: ${target}`);
  console.log(`  host      : ${new URL(direct).hostname}`);
  console.log(`  adatbázis : ${new URL(direct).pathname.slice(1)}`);
  console.log(`  env-fájl  : ${args.envFile}`);
  console.log("=".repeat(70));

  const prisma = new PrismaClient({ datasourceUrl: direct, log: ["error"] });
  try {
    await inventory(prisma);
  } finally {
    await prisma.$disconnect();
  }

  if (!args.yes) {
    console.log("\n[SZÁRAZ FUTÁS] Semmi nem változott.");
    console.log("Éles futáshoz:");
    console.log(
      `  npx tsx scripts/reset-remote-db.ts --env-file ${args.envFile} --confirm ${target} --yes`,
    );
    return;
  }

  if (args.confirm !== target) {
    throw new Error(
      `A --confirm nem egyezik a cél endpointtal.\n` +
        `  megadva : ${args.confirm ?? "(hiányzik)"}\n` +
        `  elvárt  : ${target}\n` +
        `Ez a védőháló azért van, hogy rossz env-fájllal ne törölj adatbázist.`,
    );
  }

  console.log(`\n[1/3] public séma eldobása (${target})…`);
  const ddl = new PrismaClient({ datasourceUrl: direct, log: ["error"] });
  try {
    await ddl.$executeRawUnsafe("DROP SCHEMA public CASCADE");
    await ddl.$executeRawUnsafe("CREATE SCHEMA public");
  } finally {
    await ddl.$disconnect();
  }
  console.log("      kész — a séma üres.");

  console.log("\n[2/3] prisma migrate deploy…");
  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    stdio: "inherit",
    env: { ...process.env, DATABASE_URL: pooled, DIRECT_URL: direct },
  });

  console.log("\n[3/3] ellenőrzés…");
  const verify = new PrismaClient({ datasourceUrl: direct, log: ["error"] });
  try {
    const migs = await verify.$queryRawUnsafe<{ migration_name: string }[]>(
      `SELECT migration_name FROM _prisma_migrations
       WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
       ORDER BY started_at`,
    );
    console.log(`Alkalmazott migrációk (${migs.length}):`);
    for (const m of migs) console.log(`  ✓ ${m.migration_name}`);
    const tables = await verify.$queryRawUnsafe<{ n: number }[]>(
      `SELECT count(*)::int AS n FROM information_schema.tables
       WHERE table_schema = 'public' AND table_type = 'BASE TABLE'`,
    );
    console.log(`Táblák: ${tables[0].n}`);
  } finally {
    await verify.$disconnect();
  }

  console.log(`\nKÉSZ — ${target} újraépítve a repo migrációs láncára.`);
}

main().catch((error) => {
  console.error(`\n[reset-remote-db] HIBA: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
});

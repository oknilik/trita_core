/**
 * reset-and-seed.ts — adatbázis nulláról: teljes ürítés, majd demó-adat.
 *
 * ROMBOLÓ. A cél-adatbázis `public` sémáját ELDOBJA minden adattal együtt,
 * újrajátssza a migrációs láncot, és utána felhúzza a demó-tartalmat.
 * Nincs visszavonás — a Neon PITR-en kívül semmi nem hozza vissza.
 *
 * MIÉRT ORCHESTRÁTOR, nem új script: a törlés-logika már megvan és jól
 * védett (`reset-remote-db.ts`), a seedek pedig külön-külön idempotensek.
 * Ez a script CSAK a sorrendet és a védőhálót adja hozzá — a lépéseket a
 * meglévő scriptekre delegálja, hogy egyetlen helyen se legyen másolat.
 *
 * LÉPÉSEK
 *   1. reset            — public séma eldobása + prisma migrate deploy
 *   2. showcase-org     — 1 szervezet, 3 csapat, 15 bejelentkezhető tag,
 *                         mindenkinek self-kitöltés + 3 observer-válasz
 *   3. observer-culture — a visszajelzési kultúra blokk adata (a
 *                         showcase-org-ra épül, ezért utána fut)
 *   4. personas         — 48 bejelentkezhető archetípus-persona (OPCIONÁLIS,
 *                         `--personas`; lassú, és a demóhoz nem kötelező)
 *
 * HASZNÁLAT
 *   # 1) env letöltése a cél-környezetről
 *   npx vercel env pull .env.preview --environment=preview --yes
 *
 *   # 2) SZÁRAZ FUTÁS — kiírja a tervet és a jelenlegi sortáblát, nem ír
 *   pnpm db:reset-and-seed -- --env-file .env.preview
 *
 *   # 3) éles futás — a --confirm értéke a cél endpoint-azonosító, pontosan
 *   #    úgy, ahogy a száraz futás kiírta
 *   pnpm db:reset-and-seed -- --env-file .env.preview \
 *     --confirm ep-holy-morning-agjde634 --yes
 *
 * A `--confirm` szándékos súrlódás: rossz env-fájlnál a hostnév nem egyezik,
 * és a futás leáll, mielőtt bármit törölne. Ugyanaz a védőháló, mint a
 * `reset-remote-db.ts`-ben — itt is a törlés ELŐTT ellenőrződik.
 *
 * ELŐFELTÉTEL: CLERK_SECRET_KEY (sk_test_…) az env-fájlban. A seedek
 * bejelentkezhető teszt-usereket hoznak létre; éles kulccsal leállnak, mert
 * a +clerk_test címek és a 424242 kód csak dev instance-on működnek.
 */

import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

type Args = {
  envFile: string;
  confirm: string | null;
  yes: boolean;
  skipReset: boolean;
  personas: boolean;
};

function parseArgs(argv: string[]): Args {
  const args: Args = {
    envFile: "",
    confirm: null,
    yes: false,
    skipReset: false,
    personas: false,
  };
  for (let i = 0; i < argv.length; i += 1) {
    const flag = argv[i];
    if (flag === "--env-file") args.envFile = argv[++i] ?? "";
    else if (flag === "--confirm") args.confirm = argv[++i] ?? "";
    else if (flag === "--yes") args.yes = true;
    else if (flag === "--skip-reset") args.skipReset = true;
    else if (flag === "--personas") args.personas = true;
    else throw new Error(`Ismeretlen kapcsoló: ${flag}`);
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
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    out[key] = value;
  }
  return out;
}

function endpointId(url: string): string {
  return new URL(url).hostname.split(".")[0].replace(/-pooler$/, "");
}

interface Step {
  name: string;
  detail: string;
  args: string[];
}

function buildSteps(args: Args): Step[] {
  const steps: Step[] = [];

  if (!args.skipReset) {
    steps.push({
      name: "reset",
      detail: "public séma eldobása + prisma migrate deploy",
      // A --confirm/--yes átmegy: a cél-ellenőrzést a reset script végzi el,
      // hogy a védőháló EGY helyen éljen.
      args: [
        "scripts/reset-remote-db.ts",
        "--env-file", args.envFile,
        "--confirm", args.confirm ?? "",
        "--yes",
      ],
    });
  }

  steps.push({
    name: "showcase-org",
    detail: "1 szervezet · 3 csapat · 15 bejelentkezhető tag · self + 3 observer",
    args: ["scripts/seed-showcase-org.ts", "--env-file", args.envFile, "--yes"],
  });

  steps.push({
    name: "observer-culture",
    detail: "visszajelzési kultúra blokk adata (a showcase-org-ra épül)",
    args: ["scripts/seed-observer-culture.ts", "--env-file", args.envFile, "--yes"],
  });

  if (args.personas) {
    steps.push({
      name: "personas",
      detail: "48 bejelentkezhető archetípus-persona (lassú)",
      // Nem ismer --env-file kapcsolót: az env-et a gyerekfolyamatba
      // injektáljuk (a saját loadEnv-je csak a HIÁNYZÓ kulcsokat tölti).
      args: ["scripts/seed-personas.ts"],
    });
  }

  return steps;
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const env = readEnvFile(args.envFile);

  const pooled = env.DATABASE_URL;
  if (!pooled) throw new Error("Az env-fájlban nincs DATABASE_URL");
  const direct =
    env.DIRECT_URL || env.DATABASE_URL_UNPOOLED || env.POSTGRES_URL_NON_POOLING || pooled;
  const target = endpointId(direct);

  // A Clerk-kapu ELŐRE fut: a seedek amúgy is leállnának éles kulccsal, de
  // akkor már a reset lefutott volna, és üres adatbázis maradna utána.
  const clerkKey = env.CLERK_SECRET_KEY ?? "";
  const clerkOk = clerkKey.startsWith("sk_test_");

  const steps = buildSteps(args);

  console.log("=".repeat(70));
  console.log(`CÉL ADATBÁZIS: ${target}`);
  console.log(`  host      : ${new URL(direct).hostname}`);
  console.log(`  adatbázis : ${new URL(direct).pathname.slice(1)}`);
  console.log(`  env-fájl  : ${args.envFile}`);
  console.log(`  Clerk     : ${clerkOk ? "sk_test_… (dev)" : "NEM dev-kulcs vagy hiányzik"}`);
  console.log("=".repeat(70));

  console.log("\nTERV:");
  steps.forEach((step, index) => {
    console.log(`  ${index + 1}. ${step.name.padEnd(18)} ${step.detail}`);
  });
  if (!args.personas) {
    console.log("     (a 48 archetípus-persona kimarad — kérheted: --personas)");
  }

  if (!clerkOk) {
    throw new Error(
      "A CLERK_SECRET_KEY nem dev-kulcs (sk_test_…). A seedek bejelentkezhető\n" +
        "teszt-usereket hoznak létre, éles kulccsal leállnának — és akkor a reset\n" +
        "után ÜRES adatbázis maradna. Ezért itt állunk meg, a törlés előtt.",
    );
  }

  if (!args.yes) {
    console.log("\n[SZÁRAZ FUTÁS] Semmi nem változott.");
    console.log("A jelenlegi tartalom sortáblájáért futtasd a reset száraz futását:");
    console.log(`  npx tsx scripts/reset-remote-db.ts --env-file ${args.envFile}`);
    console.log("\nÉles futáshoz:");
    console.log(
      `  pnpm db:reset-and-seed -- --env-file ${args.envFile} --confirm ${target} --yes` +
        (args.personas ? " --personas" : ""),
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

  const childEnv = { ...process.env, ...env, DATABASE_URL: pooled, DIRECT_URL: direct };
  const done: string[] = [];

  for (const [index, step] of steps.entries()) {
    console.log(`\n${"─".repeat(70)}`);
    console.log(`[${index + 1}/${steps.length}] ${step.name} — ${step.detail}`);
    console.log("─".repeat(70));
    const started = Date.now();
    try {
      execFileSync("npx", ["tsx", ...step.args], { stdio: "inherit", env: childEnv });
    } catch {
      console.error(`\n❌ A(z) „${step.name}" lépés elbukott — a futás itt megáll.`);
      console.error(`   Eddig lefutott: ${done.join(", ") || "(semmi)"}`);
      console.error("   A hiba javítása után a már kész lépéseket átugorhatod:");
      console.error(`     pnpm db:reset-and-seed -- --env-file ${args.envFile} --skip-reset --confirm ${target} --yes`);
      process.exitCode = 1;
      return;
    }
    console.log(`✓ ${step.name} — ${Math.round((Date.now() - started) / 1000)} mp`);
    done.push(step.name);
  }

  console.log(`\n${"=".repeat(70)}`);
  console.log(`KÉSZ — ${target} nulláról felhúzva. Lépések: ${done.join(" → ")}`);
  console.log("=".repeat(70));
  console.log("\nBelépés (Clerk dev teszt-mód): /sign-in → a seed által kiírt email → kód: 424242");
  console.log("\nAMI KÉZI LÉPÉST IGÉNYEL (nem automatizálható):");
  console.log("  · Kampányok: a UI-ból indíthatók (Szervezet → Kampányok → Új kampány).");
  console.log("    Utána a pulse-kitöltést a `pnpm seed:psych-safety` szimulálja.");
  console.log("  · Az `--email`-függő seedek (seed:org-team, seed:banan) egy MÁR LÉTEZŐ");
  console.log("    profilt várnak — előbb jelentkezz be azzal a címmel.");
}

try {
  main();
} catch (error) {
  console.error(`\n[reset-and-seed] HIBA: ${error instanceof Error ? error.message : error}`);
  process.exitCode = 1;
}

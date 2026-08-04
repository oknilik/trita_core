#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────
// Nézetenkénti DB-query mérés — futásidejű, nem statikus becslés.
//
// Mit csinál:
//   1. Elindít egy dev szervert DB_METRICS=1 + TRITA_E2E_AUTH_BYPASS=1
//      környezettel, és elkapja a stdout-ját.
//   2. Kiválaszt egy tesztfelhasználót (vagy a --user kapcsolóból veszi),
//      és a trita_e2e_user_id sütivel végigjárja a mért oldalakat.
//   3. Minden kéréshez saját x-request-id-t küld (a proxy tiszteletben
//      tartja), és ez alapján párosítja a szerver "db.request_summary"
//      logsorait az URL-hez.
//   4. Táblázatot ír: query-darabszám, ebből duplikátum, DB-idő, wall-idő.
//
// Használat:
//   node scripts/measure-page-queries.mjs                    # auto-felderítés
//   node scripts/measure-page-queries.mjs --user=user_abc123
//   node scripts/measure-page-queries.mjs --attach=3000      # már futó devhez
//   node scripts/measure-page-queries.mjs --json=out.json
//   node scripts/measure-page-queries.mjs --list-users
//
// FONTOS: a --attach módban a dev szervert NEKED kell DB_METRICS=1 és
// TRITA_E2E_AUTH_BYPASS=1 mellett indítanod, mert a szkript ilyenkor nem
// látja a stdout-ot — a summary sorok a te termináladban jelennek meg.
// ─────────────────────────────────────────────────────────────────────

import { spawn } from "node:child_process";
import readline from "node:readline";
import fs from "node:fs";
import crypto from "node:crypto";

const args = Object.fromEntries(
  process.argv.slice(2).map((a) => {
    const [k, v] = a.replace(/^--/, "").split("=");
    return [k, v ?? true];
  }),
);

const PORT = Number(args.port ?? args.attach ?? 3000);
const BASE = `http://localhost:${PORT}`;
const ATTACH = Boolean(args.attach);
const PASSES = Number(args.passes ?? 2);
/** --prod: `next build` + `next start` a `next dev` helyett. */
const PROD = Boolean(args.prod);

function fail(msg) {
  console.error(`\n  ${msg}\n`);
  process.exit(1);
}

// ── Env ───────────────────────────────────────────────────────────────
// A dev szerver a .env-et magától olvassa, a szkript felderítő Prisma-
// kliense nem — ezért itt töltjük be. `--db=test` esetén a TEST_DATABASE_URL-re
// állunk (ajánlott: a mérés GET-eket küld, de a getActiveOrgMembership
// írhat is — activeOrgId normalizálás —, ezért éles adaton óvatosan).
if (fs.existsSync(".env")) process.loadEnvFile(".env");
if (args.db === "test") {
  if (fs.existsSync(".env.test")) process.loadEnvFile(".env.test");
  if (process.env.TEST_DATABASE_URL) {
    process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;
    process.env.DIRECT_URL = process.env.TEST_DIRECT_URL ?? process.env.TEST_DATABASE_URL;
  }
}
if (!process.env.DATABASE_URL) fail("Nincs DATABASE_URL — .env hiányzik?");

// ── Tesztadat felderítése ─────────────────────────────────────────────
async function discover() {
  const { PrismaClient } = await import("@prisma/client");
  const db = new PrismaClient();
  try {
    if (args["list-users"]) {
      const users = await db.userProfile.findMany({
        select: { clerkId: true, email: true, username: true },
        take: 30,
        orderBy: { createdAt: "desc" },
      });
      console.table(users);
      process.exit(0);
    }

    // A legdrágább profilt keressük: org-admin, AKINEK VAN CSAPATA is —
    // a /team/[id] csak így mérhető. Ha nincs ilyen, bármely org-admin megteszi.
    const candidate =
      (await db.organizationMember.findFirst({
        where: {
          role: "ORG_ADMIN",
          leftAt: null,
          user: { is: { teamMemberships: { some: {} } } },
        },
        orderBy: { joinedAt: "asc" },
        select: {
          orgId: true,
          user: { select: { id: true, clerkId: true, email: true } },
        },
      })) ??
      (await db.organizationMember.findFirst({
        where: { role: "ORG_ADMIN", leftAt: null },
        orderBy: { joinedAt: "asc" },
        select: {
          orgId: true,
          user: { select: { id: true, clerkId: true, email: true } },
        },
      }));
    if (!candidate) fail("Nincs ORG_ADMIN tagság a DB-ben — add meg: --user=<clerkId> --org=<id> --team=<id>");

    const team = await db.teamMember.findFirst({
      where: { userId: candidate.user.id },
      select: { teamId: true },
    });

    return {
      clerkId: args.user ?? candidate.user.clerkId,
      email: candidate.user.email,
      orgId: args.org ?? candidate.orgId,
      teamId: args.team ?? team?.teamId ?? null,
    };
  } finally {
    await db.$disconnect();
  }
}

// ── Dev szerver ───────────────────────────────────────────────────────
const summaries = new Map(); // requestId → summary objektum

function attachLogParser(stream, echo) {
  const rl = readline.createInterface({ input: stream });
  rl.on("line", (line) => {
    if (line.includes('"db.request_summary"')) {
      try {
        const rec = JSON.parse(line);
        if (rec.requestId) summaries.set(rec.requestId, rec);
        return;
      } catch {
        /* nem JSON — átesik az echo-ra */
      }
    }
    if (echo) process.stderr.write(`  ${line}\n`);
  });
}

async function startDevServer() {
  // Árva dev szerver a porton = csendes hamis mérés (a szkript a RÉGI,
  // esetleg DB_METRICS nélküli példányt kérdezné). Inkább álljunk meg.
  try {
    await fetch(`${BASE}/`, { redirect: "manual", signal: AbortSignal.timeout(2000) });
    fail(
      `A ${PORT} porton már fut valami. Állítsd le (pkill -f "next dev"), ` +
        `vagy adj másik portot: --port=3210 — illetve --attach=${PORT}, ` +
        "ha szándékosan egy már futó, DB_METRICS=1-es szerverhez csatlakoznál.",
    );
  } catch {
    /* nem válaszol — szabad a port, mehet. (fail() process.exit-tel áll meg,
       ide nem esik be.) */
  }

  // --prod: éles build + `next start`. A dev szerver render-overheadje
  // (on-demand fordítás, fejlesztői RSC-út) nagyságrendekkel torzít, ezért a
  // „mennyi ebből valós?" kérdésre CSAK ez a mód ad választ.
  if (PROD) {
    console.log("  éles build (next build)… ez eltarthat pár percig");
    const build = spawn("pnpm", ["exec", "next", "build"], {
      env: { ...process.env },
      stdio: ["ignore", "inherit", "inherit"],
    });
    const code = await new Promise((r) => build.on("exit", r));
    if (code !== 0) fail("A next build elhasalt.");
  }

  const mode = PROD ? "start (éles build)" : "dev";
  console.log(`  ${mode} szerver indítása (DB_METRICS=1, port ${PORT})…`);
  // detached: saját process-group — így a leállításkor a Next gyerek-
  // folyamatai is elmennek (különben ott marad egy .next/dev/lock-ot fogó
  // árva next dev, és a következő futás nem tud elindulni).
  const child = spawn("pnpm", ["exec", "next", PROD ? "start" : "dev", "--port", String(PORT)], {
    env: {
      ...process.env,
      DB_METRICS: "1",
      TRITA_E2E_AUTH_BYPASS: "1",
      LOG_JSON: "1",
      LOG_LEVEL: "info",
    },
    stdio: ["ignore", "pipe", "pipe"],
    detached: true,
  });
  const stop = () => {
    try {
      process.kill(-child.pid, "SIGTERM");
    } catch {
      /* már leállt */
    }
  };
  child.stopGroup = stop;
  process.once("exit", stop);
  process.once("SIGINT", () => {
    stop();
    process.exit(130);
  });
  attachLogParser(child.stdout, Boolean(args.verbose));
  attachLogParser(child.stderr, Boolean(args.verbose));

  const deadline = Date.now() + 90_000;
  while (Date.now() < deadline) {
    try {
      const res = await fetch(`${BASE}/`, { redirect: "manual" });
      if (res.status < 500) return child;
    } catch {
      /* még nem áll */
    }
    await new Promise((r) => setTimeout(r, 1000));
  }
  stop();
  fail("A dev szerver 90 s alatt nem jött fel.");
}

// ── Mérés ─────────────────────────────────────────────────────────────
function buildRoutes({ orgId, teamId }) {
  const routes = [
    ["/dashboard", "journey dispatcher"],
    ["/profile/results", "saját eredmények"],
    ["/profile", "profil"],
    ["/tasks", "feladataim"],
    ["/team", "csapat-lista"],
    ["/manager", "manager cockpit"],
    ["/org", "org-lista"],
    ["/assessment", "kérdőív"],
  ];
  if (teamId) {
    routes.push(
      [`/team/${teamId}?tab=overview`, "csapat · áttekintés"],
      [`/team/${teamId}?tab=members`, "csapat · tagok"],
      [`/team/${teamId}?tab=intelligence`, "csapat · intelligence"],
      [`/team/${teamId}?tab=report`, "csapat · riport"],
    );
  }
  if (orgId) {
    routes.push(
      [`/org/${orgId}`, "org cockpit"],
      [`/org/${orgId}?tab=campaigns`, "org · kampányok"],
      [`/org/${orgId}?tab=members`, "org · tagok"],
      [`/org/${orgId}/settings`, "org · beállítások"],
    );
  }
  routes.push(
    ["/api/notifications/unread-count", "API: notif poll"],
    ["/api/dashboard/status", "API: dashboard poll"],
    ["/api/nav/context", "API: nav-kontextus"],
    ["/api/profile/locale", "API: locale"],
    ["/api/org/context", "API: org-kontextus"],
  );
  return routes;
}

async function hit(url, cookie) {
  const requestId = crypto.randomUUID();
  const startedAt = performance.now();
  const res = await fetch(`${BASE}${url}`, {
    headers: {
      cookie,
      "x-request-id": requestId,
      // FONTOS: `accept: text/html` esetén a Clerk dev-instance dokumentum-
      // kérésnek látja, és a hiányzó dev-browser süti miatt a handshake
      // endpointra irányít — a render el sem indul. `*/*`-gal a proxy
      // lefut, az E2E-bypass érvényesül, és a szerver-render megtörténik.
      accept: "*/*",
    },
    redirect: "manual",
  });
  await res.arrayBuffer();
  const wallMs = performance.now() - startedAt;
  // A summary a válasz UTÁN, csend-idővel flushol — várunk rá.
  for (let i = 0; i < 30; i += 1) {
    if (summaries.has(requestId)) break;
    await new Promise((r) => setTimeout(r, 100));
  }
  return {
    requestId,
    status: res.status,
    location: res.headers.get("location"),
    wallMs,
    summary: summaries.get(requestId) ?? null,
  };
}

// ── Fő ────────────────────────────────────────────────────────────────
const ctx = await discover();
if (!ctx.clerkId) fail("Nincs clerkId — add meg: --user=<clerkId>");

console.log(`\n  user:  ${ctx.email ?? ctx.clerkId}`);
console.log(`  org:   ${ctx.orgId ?? "—"}`);
console.log(`  team:  ${ctx.teamId ?? "—"}\n`);

let child = null;
if (!ATTACH) child = await startDevServer();
else console.log(`  csatlakozás a futó ${BASE} szerverhez (DB_METRICS=1 kell rajta!)\n`);

const cookie = `trita_e2e_user_id=${ctx.clerkId}; trita_locale=hu`;
const routes = buildRoutes(ctx);
const results = [];

try {
  for (let pass = 1; pass <= PASSES; pass += 1) {
    const warm = pass < PASSES;
    console.log(`  ── ${warm ? "bemelegítő" : "mérő"} kör (${pass}/${PASSES}) ──`);
    for (const [url, label] of routes) {
      const r = await hit(url, cookie);
      if (!warm) results.push({ url, label, ...r });
      else process.stdout.write(".");
    }
    if (warm) process.stdout.write("\n");
  }
} finally {
  if (child) child.stopGroup();
}

// ── Riport ────────────────────────────────────────────────────────────
const missing = results.filter((r) => !r.summary);
const measured = results.filter((r) => r.summary);

console.log("\n\n  NÉZETENKÉNTI DB-TERHELÉS\n");
const rows = measured
  .map((r) => ({
    nézet: r.label,
    query: r.summary.queries,
    dup: r.summary.duplicateQueries,
    // Hány egymás utáni körfordulás-hullám — ez szabja meg a DB-alsókorlátot.
    hullám: r.summary.waves ?? "?",
    // dbMs / dbSpanMs: ≈ pool-méret → pool fogja; ≈ 1 → waterfall.
    párh: r.summary.parallelism ?? "?",
    "DB ms": r.summary.dbMs,
    "DB span": r.summary.dbSpanMs ?? "?",
    "wall ms": Math.round(r.wallMs),
  }))
  .sort((a, b) => b.query - a.query);
console.table(rows);

const totalQ = measured.reduce((s, r) => s + r.summary.queries, 0);
const totalDup = measured.reduce((s, r) => s + r.summary.duplicateQueries, 0);
console.log(
  `  összesen ${totalQ} query, ebből ${totalDup} duplikátum ` +
    `(${totalQ ? Math.round((totalDup / totalQ) * 100) : 0}% — ennyit vinne el a React.cache)\n`,
);

console.log("  TOP DUPLIKÁTUMOK nézetenként\n");
for (const r of measured.sort((a, b) => b.summary.duplicateQueries - a.summary.duplicateQueries).slice(0, 6)) {
  if (!r.summary.duplicateSignatures?.length) continue;
  console.log(`  ${r.label} (${r.summary.duplicateQueries} duplikátum)`);
  for (const sig of r.summary.duplicateSignatures) console.log(`      ${sig}`);
  console.log("");
}

if (missing.length) {
  console.log("  Nem érkezett summary (redirect vagy 0 query):");
  for (const r of missing) console.log(`      ${r.status} ${r.url}${r.location ? ` → ${r.location}` : ""}`);
  console.log("");
}

if (args.json) {
  fs.writeFileSync(String(args.json), JSON.stringify(results, null, 2));
  console.log(`  nyers adat: ${args.json}\n`);
}

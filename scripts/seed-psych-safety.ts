/**
 * seed-psych-safety.ts
 *
 * A pszichológiai biztonság pulse demó-kitöltője: a dummy csapattagok
 * nevében ANONIM válaszokat szimulál egy aktív, pulse-lépést tartalmazó
 * kampányra (a dummy userek nem tudnak bejelentkezni, ezért közvetlenül
 * a DB-be ír — ugyanazzal a szerkezettel, mint az éles submit API).
 * Több-lépéses kampánynál a korábbi lépéseket is teljesítettnek jelöli,
 * és a pulse-lépésen túllépteti a résztvevőt.
 *
 * Tipikus demó-folyamat:
 *   1. Jelentkezz be a weboldalon — létrejön a profilod
 *   2. pnpm seed:org-team --email <email>            ← org + csapat + dummy tagok
 *   3. UI: Szervezet → Kampányok → Új kampány → mérés(ek) kiválasztása
 *      → cél-csapat → létrehozás → AKTIVÁLÁS
 *   4. pnpm seed:psych-safety --email <email>        ← dummy válaszok
 *   5. UI: kampány-oldal (lépés-haladás + index) · saját kitöltés a
 *      csapatoldal banneréből · riport-vázlat → "Pszichológiai biztonság"
 *
 * Opciók:
 *   --email <email>       Az admin emailje — az ő org-jában keresi a kampányt (kötelező)
 *   --campaign-id <id>    Konkrét kampány (alapért.: a legutóbbi ACTIVE, pulse-lépéses)
 *   --activate            Ha csak DRAFT kör van, aktiválja, majd folytatja
 *   --profile <p>         Válasz-mintázat: mixed | healthy | weak (alapért.: mixed)
 *                           mixed   → jó összkép, de a "Hibázás kezelése" és a
 *                                     "Segítségkérés" gyenge → a riport akció-kártyákat mutat
 *                           healthy → minden terület erős (nincs gyenge-kártya)
 *                           weak    → sok gyenge terület, alacsony index
 *   --clean               A kampány meglévő válaszainak törlése újra-seedelés előtt
 *   --help                Súgó
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import {
  PSYCH_SAFETY_ITEMS,
  aggregatePsychSafety,
  weakPsychSafetyItemIds,
  getPsychSafetyItem,
} from "../src/lib/psych-safety";
import { handleCampaignLaunched } from "../src/lib/notifications";

// ─── Load .env ─────────────────────────────────────────────────────────────────

function loadEnv() {
  const candidates = [".env.local", ".env"];
  for (const file of candidates) {
    try {
      const content = readFileSync(resolve(process.cwd(), file), "utf-8");
      for (const line of content.split("\n")) {
        const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
        if (!match) continue;
        const [, key, raw] = match;
        if (!process.env[key]) {
          process.env[key] = raw.replace(/^['"]|['"]$/g, "").trim();
        }
      }
      console.log(`📄 Env betöltve: ${file}`);
      return;
    } catch {
      // not found
    }
  }
}

loadEnv();

// ─── CLI args ──────────────────────────────────────────────────────────────────

function parseArgs(): Record<string, string> {
  const args = process.argv.slice(2);
  const result: Record<string, string> = {};
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg.startsWith("--")) {
      const key = arg.slice(2);
      const next = args[i + 1];
      if (next && !next.startsWith("--")) {
        result[key] = next;
        i++;
      } else {
        result[key] = "true";
      }
    }
  }
  return result;
}

// ─── Válasz-generálás ──────────────────────────────────────────────────────────

type ProfileKind = "mixed" | "healthy" | "weak";

function clamp15(v: number): number {
  return Math.max(1, Math.min(5, Math.round(v)));
}

/**
 * Egy válaszadó nyers válaszai. A `safetyByItem` a CÉL biztonság-szint
 * (1–5, magas = biztonságos) itemenként; fordított itemeknél a nyers
 * válasz ennek a tükre. Kis egyéni zajjal, hogy legyen szórás.
 */
function generateAnswers(safetyByItem: Record<string, number>): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const item of PSYCH_SAFETY_ITEMS) {
    const target = safetyByItem[item.id] ?? 4;
    const noisy = clamp15(target + (Math.random() - 0.5) * 1.6);
    answers[item.id] = item.reversed ? 6 - noisy : noisy;
  }
  return answers;
}

function profileTargets(profile: ProfileKind): Record<string, number> {
  const base: Record<string, number> = {};
  for (const item of PSYCH_SAFETY_ITEMS) base[item.id] = 4.3;
  if (profile === "healthy") return base;
  if (profile === "weak") {
    for (const item of PSYCH_SAFETY_ITEMS) base[item.id] = 2.6;
    base.PS4 = 3.6; // egy-két elviselhető terület a realizmusért
    base.PS7 = 3.4;
    return base;
  }
  // mixed: jó összkép, két beszédes gyenge ponttal
  base.PS2 = 2.4; // Hibázás kezelése
  base.PS3 = 2.8; // Segítségkérés
  return base;
}

// ─── Main ──────────────────────────────────────────────────────────────────────

function printHelp() {
  console.log(`
Pszichológiai biztonság pulse — demó válasz-seedelő

  pnpm seed:psych-safety --email admin@example.com [opciók]

  --email <email>      Admin email (kötelező) — az ő org-jában keresi a kampányt
  --campaign-id <id>   Konkrét kampány (alapért.: legutóbbi ACTIVE, pulse-lépéses)
  --activate           Ha csak DRAFT kör van, aktiválja, majd folytatja
  --profile <p>        mixed (alapért.) | healthy | weak
  --clean              Meglévő válaszok törlése a kampányról
  --help               Súgó
`);
}

async function main() {
  const args = parseArgs();
  if ("help" in args) {
    printHelp();
    process.exit(0);
  }
  const email = args.email;
  if (!email) {
    console.error("❌  --email megadása kötelező");
    printHelp();
    process.exit(1);
  }
  const profile = (["mixed", "healthy", "weak"].includes(args.profile ?? "")
    ? args.profile
    : "mixed") as ProfileKind;

  const prisma = new PrismaClient();

  try {
    console.log(`\n🔍  Admin keresése: ${email}`);
    const admin = await prisma.userProfile.findFirst({
      where: { email: { equals: email, mode: "insensitive" } },
      select: { id: true },
    });
    if (!admin) {
      console.error(`❌  Nem találom: ${email} — regisztrálj be először a weboldalon`);
      process.exit(1);
    }

    // ── Kampány megkeresése ────────────────────────────────────────────────────
    let campaign = args["campaign-id"]
      ? await prisma.campaign.findUnique({
          where: { id: args["campaign-id"] },
          select: {
            id: true,
            name: true,
            status: true,
            type: true,
            steps: true,
            orgId: true,
          },
        })
      : await prisma.campaign.findFirst({
          where: {
            OR: [{ type: "PSYCH_SAFETY" }, { steps: { has: "PSYCH_SAFETY" } }],
            status: "ACTIVE",
            org: { members: { some: { userId: admin.id } } },
          },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            name: true,
            status: true,
            type: true,
            steps: true,
            orgId: true,
          },
        });

    // ── Diagnosztika, ha nincs találat ────────────────────────────────────────
    if (!campaign) {
      const myCampaigns = await prisma.campaign.findMany({
        where: { org: { members: { some: { userId: admin.id } } } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          name: true,
          type: true,
          steps: true,
          status: true,
          org: { select: { name: true } },
          _count: { select: { participants: true } },
        },
      });

      const draft = myCampaigns.find(
        (c) =>
          (c.type === "PSYCH_SAFETY" || c.steps.includes("PSYCH_SAFETY")) &&
          c.status === "DRAFT",
      );

      if (draft && "activate" in args) {
        console.log(`▶️   DRAFT kör aktiválása: "${draft.name}" (${draft.id})`);
        const activated = await prisma.campaign.update({
          where: { id: draft.id },
          data: { status: "ACTIVE" },
          select: { orgId: true },
        });
        // Ugyanaz az értesítés, amit az éles PATCH API küld aktiváláskor.
        await handleCampaignLaunched({
          orgId: activated.orgId,
          campaignId: draft.id,
          campaignName: draft.name,
        });
        console.log("🔔  Kampány-indítás értesítés kiküldve az org tagjainak");
        campaign = {
          id: draft.id,
          name: draft.name,
          status: "ACTIVE",
          type: draft.type,
          steps: draft.steps,
          orgId: activated.orgId,
        };
      } else {
        console.error("❌  Nincs aktív, pulse-lépéses kampány ebben az org-ban.\n");
        if (myCampaigns.length === 0) {
          console.error(
            "    Ennél a usernél egyetlen kampány sincs. Valószínű okok:\n" +
              "      · a 3. lépés (kampány létrehozása a felületen) kimaradt, vagy\n" +
              "      · más emaillel vagy bejelentkezve, mint amit a seedhez adtál meg.\n\n" +
              "    Létrehozás: Szervezet → Kampányok → Új kampány →\n" +
              "    mérés(ek) kiválasztása → cél-csapat → létrehozás → AKTIVÁLÁS",
          );
        } else {
          console.error("    Amit találtam nálad (utolsó 10 kampány):");
          for (const c of myCampaigns) {
            const stepInfo = c.steps.length > 1 ? ` [${c.steps.join(" → ")}]` : "";
            console.error(
              `      · [${c.status}] ${c.type}${stepInfo} — "${c.name}" (${c.org.name}, ${c._count.participants} résztvevő)\n        id: ${c.id}`,
            );
          }
          if (draft) {
            console.error(
              `\n    Van egy DRAFT pulse-köröd — aktiváld a kampány-oldalon, VAGY futtasd:\n` +
                `      pnpm seed:psych-safety --email ${email} --activate`,
            );
          } else if (
            !myCampaigns.some(
              (c) => c.type === "PSYCH_SAFETY" || c.steps.includes("PSYCH_SAFETY"),
            )
          ) {
            console.error(
              "\n    Pszich. biztonság lépést tartalmazó kör még nincs — hozd létre a\n" +
                "    felületen (Új kampány → \"Pszichológiai biztonság pulse\"). Ha a\n" +
                "    kártya még „Hamarosan\"-t mutat, indítsd újra a dev szervert\n" +
                "    (rm -rf .next && pnpm dev).",
            );
          }
        }
        process.exit(1);
      }
    }
    const campaignSteps =
      campaign.steps.length > 0 ? campaign.steps : [campaign.type];
    if (!campaignSteps.includes("PSYCH_SAFETY")) {
      console.error(`❌  A(z) ${campaign.id} kampányban nincs pszich. biztonság lépés`);
      process.exit(1);
    }
    const psychStepIndex = campaignSteps.indexOf("PSYCH_SAFETY");
    if (campaign.status !== "ACTIVE") {
      console.error(
        `❌  A kampány állapota ${campaign.status} — előbb AKTIVÁLD a kampány-oldalon\n` +
          `    (vagy futtasd --activate kapcsolóval), hogy a demó az éles folyamatot kövesse.`,
      );
      process.exit(1);
    }
    console.log(`✅  Kampány: "${campaign.name}" (${campaign.id})`);
    if (campaignSteps.length > 1) {
      console.log(`    Lépések: ${campaignSteps.join(" → ")} (pulse: ${psychStepIndex + 1}. lépés)`);
    }

    // ── A te résztvevő-sorod ellenőrzése (enélkül nem látod a bannert!) ───────
    const adminParticipant = await prisma.campaignParticipant.findUnique({
      where: { campaignId_userId: { campaignId: campaign.id, userId: admin.id } },
      select: { id: true, completedAt: true },
    });
    if (!adminParticipant) {
      await prisma.campaignParticipant.create({
        data: { campaignId: campaign.id, userId: admin.id },
      });
      console.log(
        "➕  Nem voltál résztvevője a körnek — hozzáadtalak. (A felhívó banner és a\n" +
          "    /assessment/psych-safety kitöltő csak résztvevőknek jelenik meg.)",
      );
    } else if (adminParticipant.completedAt) {
      console.log("ℹ️   A saját kitöltésedet már beküldted ehhez a körhöz.");
    } else {
      console.log("✅  Résztvevő vagy a körben — a kitöltésed még hátravan.");
    }

    // ── Clean ──────────────────────────────────────────────────────────────────
    if ("clean" in args) {
      const { count } = await prisma.psychSafetyResponse.deleteMany({
        where: { campaignId: campaign.id },
      });
      await prisma.campaignParticipant.updateMany({
        where: { campaignId: campaign.id },
        data: { completedAt: null },
      });
      console.log(`🧹  ${count} korábbi válasz törölve, kitöltöttség nullázva`);
    }

    // ── Dummy résztvevők → anonim válaszok ────────────────────────────────────
    // Az admint kihagyjuk: a saját kitöltésedet a felületen éld végig
    // (csapatoldal banner → /assessment/psych-safety).
    const pending = await prisma.campaignParticipant.findMany({
      where: { campaignId: campaign.id, completedAt: null, userId: { not: admin.id } },
      select: { id: true, user: { select: { username: true } } },
    });

    if (pending.length === 0) {
      console.log("ℹ️   Nincs kitöltésre váró dummy résztvevő (már mind beküldte?)");
    }

    const targets = profileTargets(profile);
    const submittedOn = new Date();
    submittedOn.setUTCHours(0, 0, 0, 0);

    for (const participant of pending) {
      const answers = generateAnswers(targets);
      // A demó a korábbi lépéseket is teljesítettnek jelöli (a dummy userek
      // nem tudnak bejelentkezni), és a pulse-lépésen túllépteti a résztvevőt.
      const stepCompletions = Object.fromEntries(
        campaignSteps
          .slice(0, psychStepIndex + 1)
          .map((st) => [st, new Date().toISOString()]),
      );
      await prisma.$transaction([
        prisma.psychSafetyResponse.create({
          data: { campaignId: campaign.id, answers, submittedOn },
        }),
        prisma.campaignParticipant.update({
          where: { id: participant.id },
          data: {
            completedAt: new Date(),
            currentStep: psychStepIndex + 1,
            stepCompletions,
          },
        }),
      ]);
      console.log(`   📨  Anonim válasz beküldve (${participant.user.username ?? "?"} nevében)`);
    }

    // ── Összkép ────────────────────────────────────────────────────────────────
    const responses = await prisma.psychSafetyResponse.findMany({
      where: { campaignId: campaign.id },
      select: { answers: true },
    });
    const agg = aggregatePsychSafety(responses.map((r) => r.answers));
    console.log(`\n📊  Összesen ${responses.length} válasz a kampányon (profil: ${profile})`);
    if (agg) {
      console.log(`    Biztonság-index: ${agg.index}/100 (${agg.band}) · szórás ±${agg.spread}`);
      const weak = weakPsychSafetyItemIds(agg.itemMeans);
      if (weak.length > 0) {
        console.log(
          `    Gyenge területek: ${weak
            .map((id) => `${getPsychSafetyItem(id)?.area.hu} (${agg.itemMeans[id].toFixed(1)})`)
            .join(" · ")}`,
        );
      } else {
        console.log("    Nincs gyenge terület — kiegyensúlyozott kép.");
      }
    } else {
      console.log("    Küszöb alatt (<3 válasz) — az aggregátum még nem látszik.");
    }

    console.log(`\n🎯  Hol találod a felületen:
    1. 🔔 Harang: "kampány elindult" értesítés (org-tagoknak)
    2. Csapatoldal (Áttekintés fül) → zöld mérés-banner → töltsd ki TE is
       — vagy közvetlenül: http://localhost:3000/assessment/psych-safety
       (több-lépéses kampánynál előbb a korábbi lépéseidet kell teljesíteni!)
    3. Kampány-oldal → lépés-haladás + "Biztonság-index" blokk
    4. Csapatoldal → Riport fül → új vázlat → "Pszichológiai biztonság" szekció\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error("❌  Hiba:", err);
  process.exit(1);
});

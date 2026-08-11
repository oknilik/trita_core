/**
 * seed-observer-culture.ts — a csapat-szintű VISSZAJELZÉSI KULTÚRA blokk
 * demo-adata (TeamFeedbackCultureCard, `/team/[id]?tab=intelligence`).
 *
 * Előfeltétel: `seed-showcase-org.ts` már lefutott (org, csapatok, tagok,
 * self-kitöltések, fejenként 3 observer-válasz).
 *
 * MIÉRT KELL KÜLÖN SEED — a showcase-adat önmagában nem mutatja meg a blokkot
 * ────────────────────────────────────────────────────────────────────────────
 * A showcase-seed observer-képe `self ± jitter*12` DIMENZIÓNKÉNT ÉS
 * ÉRTÉKELŐNKÉNT FÜGGETLENÜL. A blokk viszont az értékelők ÁTLAGÁT veti össze
 * az önképpel, és 3 független ±12-es zaj átlaga ~±4-re zsugorodik — jóval a
 * kanonikus eltérés-küszöb (DOSSIER_GAP_MIN_DELTA = √2·SEM ≈ 11 pont) alatt.
 * Monte-Carlóval: egy tagnak ~1,3% eséllyel lenne érdemi eltérése, egy 5 fős
 * csapatban ~6% eséllyel lenne EGYÁLTALÁN egy is. Vagyis a blokk ~94%-ban
 * „5 egybevágó, 0 eltérés"-t mutatna, és az eltérés-ág sosem futna.
 *
 * Ez nem a seed hibája: a független zaj MODELLEZÉSILEG is rossz. Egy valódi
 * vakfolt nem véletlen szórás, hanem SZISZTEMATIKUS — az értékelők egyetértenek
 * egymással, és együtt térnek el az önképtől. Ez a script ezért KÖZÖS
 * (raterek közt osztott) eltolást ír a kijelölt tagokra, és csak apró
 * rater-szintű zajt hagy rajta. Így a demo-adat egyszerre hihető és stabil.
 *
 * Mit állít be (idempotens, determinisztikus — nincs Math.random):
 *   · csapatonként a tagok egy része KÖZÖS eltolást kap egy megnevezett
 *     dimenzión (érdemi eltérés), a többi a hibahatáron belül marad;
 *   · a tag COMPLETED observer-meghívói a csapat kampányához kötődnek —
 *     e nélkül a blokk nem látja őket (kampány-hatókör vörösvonal).
 *
 * A blokk küszöbei (a kód az igazság, ez csak emlékeztető):
 *   · tagonként ≥3 értékelő (MIN_RATERS_FOR_ANONYMOUS_AGGREGATE)
 *   · csapatonként ≥4 lefedett tag (TEAM_OBSERVER_MIN_COVERED)
 *
 * Futtatás:
 *   npx vercel env pull .env.preview --environment=preview --yes
 *   npx tsx scripts/seed-observer-culture.ts --env-file .env.preview
 *   npx tsx scripts/seed-observer-culture.ts --env-file .env.preview --teardown
 *
 * A --teardown a KÖZÖS eltolást vonja vissza (visszaírja a független jitteres
 * képet); a meghívókat és a válaszokat nem törli — azokat a showcase-seed
 * teardownja kezeli. FIGYELEM: a kampány-kötést SEM bontja vissza, tehát
 * teardown után a blokk továbbra is renderel, csak „minden egybevágó"
 * képpel (helyben mérve: 5 lefedett, 5 egybevágó, 0 eltérés). Ez szándékos —
 * a kampány-kötés a mérési ciklus tulajdona (seed-campaign-cycle), nem ezé
 * a scripté.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";
import { HEXACO_ORDER, type HexacoCode } from "../src/lib/hexaco";
import { extractDimensionScores } from "../src/lib/scoring";
import { DOSSIER_GAP_MIN_DELTA } from "../src/lib/member-dossier";
import { TEAM_OBSERVER_MIN_COVERED } from "../src/lib/team-observer";

// ─── Env / argumentumok ───────────────────────────────────────────────────────

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : (process.argv[i + 1] ?? null);
}

function loadEnvFile(path: string): void {
  const content = readFileSync(resolve(process.cwd(), path), "utf-8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).replace(/^export\s+/, "").trim();
    process.env[key] = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
  }
  console.log(`📄 Env: ${path}`);
}

const ORG_NAME = "Aurora Dinamika Kft.";

// ─── A demo-mintázat ──────────────────────────────────────────────────────────

/**
 * Csapatonként hány tag kapjon ÉRDEMI eltérést. A maradék a hibahatáron
 * belül marad. 5 fős csapatoknál a 2 egy hihető arány: a többség önképe
 * stimmel, de van miről beszélgetni — pontosan ez a blokk üzenete.
 */
const GAP_MEMBERS_PER_TEAM = 2;

/**
 * A közös eltolás nagysága. A küszöb FÖLÉ kell vinnie akkor is, ha a
 * rater-zaj lefelé húz, de ne legyen karikatúra: a küszöb + 6 pont úgy ül,
 * hogy a ±3-as rater-zaj mellett is stabilan eltérésnek minősül.
 */
const SHARED_SHIFT = DOSSIER_GAP_MIN_DELTA + 6;

/** Rater-szintű maradék zaj — az értékelők nem klónok, csak egyetértenek. */
const RATER_NOISE = 3;

/**
 * Melyik dimenzión legyen a vakfolt. Sorban osztjuk ki, hogy ne mindig
 * ugyanaz a dimenzió legyen a demóban.
 */
const GAP_DIMS: HexacoCode[] = ["C", "X", "A", "H", "O", "E"];

/** Determinisztikus [-1,1) a kulcsból — a showcase-seed jitterének párja. */
function jitter(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return ((h >>> 0) / 0xffffffff) * 2 - 1;
}

const clamp = (n: number): number => Math.max(5, Math.min(95, Math.round(n)));

/**
 * Egy értékelő képe a célszemélyről.
 *
 * @param sharedShift A KÖZÖS (raterek közt azonos) eltolás dimenziónként —
 *   ez teszi szisztematikussá a vakfoltot. Üres map = nincs eltolás, a tag a
 *   hibahatáron belül marad.
 */
function raterView(
  self: Record<string, number>,
  sharedShift: Partial<Record<HexacoCode, number>>,
  seed: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const dim of HEXACO_ORDER) {
    const base = self[dim];
    if (typeof base !== "number") continue;
    out[dim] = clamp(base + (sharedShift[dim] ?? 0) + jitter(`${seed}:${dim}`) * RATER_NOISE);
  }
  return out;
}

/** A showcase-seed EREDETI (független, ±12) képe — a teardownhoz. */
function independentView(
  self: Record<string, number>,
  seed: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const dim of HEXACO_ORDER) {
    const base = self[dim];
    if (typeof base !== "number") continue;
    out[dim] = clamp(base + jitter(`${seed}:${dim}`) * 12);
  }
  return out;
}

const scoresJson = (dimensions: Record<string, number>) => ({
  type: "likert",
  dimensions,
  answers: [],
  questionCount: 60,
});

// ─── Fő ───────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const envFile = argValue("--env-file");
  if (envFile) loadEnvFile(envFile);
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "Nincs DATABASE_URL. Add meg --env-file kapcsolóval (pl. --env-file .env.preview).",
    );
  }

  const teardown = process.argv.includes("--teardown");
  const prisma = new PrismaClient();

  try {
    const org = await prisma.organization.findFirst({
      where: { name: ORG_NAME },
      select: {
        id: true,
        teams: {
          select: {
            id: true,
            name: true,
            members: {
              select: {
                user: {
                  select: {
                    id: true,
                    username: true,
                    assessmentResults: {
                      where: { isSelfAssessment: true },
                      orderBy: { createdAt: "desc" },
                      take: 1,
                      select: { scores: true },
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!org) {
      throw new Error(
        `Nincs meg a(z) "${ORG_NAME}" szervezet — előbb futtasd: npx tsx scripts/seed-showcase-org.ts`,
      );
    }

    console.log(
      teardown
        ? "\n🗑  Közös eltolás visszavonása (független jitteres kép visszaírása)…"
        : "\n▸ Visszajelzési kultúra demo-adat…",
    );

    for (const [teamIdx, team] of org.teams.entries()) {
      // Stabil sorrend: a tag-azonosító szerint, hogy futásról futásra
      // UGYANAZOK a tagok kapják az eltérést.
      const members = team.members
        .map((m) => m.user)
        .sort((a, b) => a.id.localeCompare(b.id));

      // A csapat kampánya — e nélkül a blokk nem látja a válaszokat
      // (kampány-hatókör vörösvonal a loaderben).
      const campaign = await prisma.campaign.findFirst({
        where: { orgId: org.id, OR: [{ teamId: team.id }, { teamIds: { has: team.id } }] },
        orderBy: { createdAt: "desc" },
        select: { id: true, name: true },
      });

      let gapAssigned = 0;
      let alignedAssigned = 0;
      let boundInvites = 0;
      let skippedNoSelf = 0;

      for (const [memberIdx, member] of members.entries()) {
        const selfDims = extractDimensionScores(member.assessmentResults[0]?.scores);
        if (!selfDims) {
          skippedNoSelf += 1;
          continue;
        }

        const invitations = await prisma.observerInvitation.findMany({
          where: { inviterId: member.id, status: "COMPLETED" },
          select: { id: true, assessment: { select: { id: true } } },
        });

        // Kampányhoz kötés (idempotens): csak a még kötetlen meghívókat.
        if (campaign && !teardown) {
          const unbound = await prisma.observerInvitation.updateMany({
            where: { inviterId: member.id, status: "COMPLETED", campaignId: null },
            data: { campaignId: campaign.id },
          });
          boundInvites += unbound.count;
        }

        const isGapMember = !teardown && gapAssigned < GAP_MEMBERS_PER_TEAM;
        const gapDim = GAP_DIMS[(teamIdx + memberIdx) % GAP_DIMS.length];
        // Az eltolás iránya az önkép szintjétől függ: magas önértékelésnél
        // lefelé (a klasszikus „én ezt jobban csinálom, mint ahogy látszik"),
        // alacsonynál felfelé (rejtett erősség). Így nem ütközik a [5,95]
        // vágásba, és mindkét irány szerepel a demóban.
        const direction = (selfDims[gapDim] ?? 50) >= 50 ? -1 : 1;
        const sharedShift: Partial<Record<HexacoCode, number>> = isGapMember
          ? { [gapDim]: direction * SHARED_SHIFT }
          : {};

        for (const invitation of invitations) {
          if (!invitation.assessment) continue;
          // A seed a MEGHÍVÓ id-jét is tartalmazza → értékelőnként külön
          // zaj, de a közös eltolás mindegyikükön ugyanaz.
          const seed = `${member.id}:${invitation.id}`;
          const dims = teardown
            ? independentView(selfDims, seed)
            : raterView(selfDims, sharedShift, seed);
          await prisma.observerAssessment.update({
            where: { id: invitation.assessment.id },
            data: { scores: scoresJson(dims) as object },
          });
        }

        if (invitations.length > 0) {
          if (isGapMember) gapAssigned += 1;
          else alignedAssigned += 1;
        }
      }

      const covered = gapAssigned + alignedAssigned;
      const enough = covered >= TEAM_OBSERVER_MIN_COVERED;
      console.log(
        `\n  ${team.name}: ${covered} lefedett tag ` +
          `(${alignedAssigned} egybevágó, ${gapAssigned} eltérés)` +
          (boundInvites > 0 ? ` · ${boundInvites} meghívó kampányhoz kötve` : "") +
          (skippedNoSelf > 0 ? ` · ${skippedNoSelf} tag self-eredmény nélkül kihagyva` : ""),
      );
      if (!campaign) {
        console.log(
          "    ⚠️  Nincs kampány ehhez a csapathoz — a blokk NEM fog megjelenni.\n" +
            "        Futtasd előbb: npx tsx scripts/seed-campaign-cycle.ts",
        );
      } else if (!enough && !teardown) {
        console.log(
          `    ⚠️  ${covered} < ${TEAM_OBSERVER_MIN_COVERED} (TEAM_OBSERVER_MIN_COVERED) — ` +
            "a blokk szándékosan nem renderel (anonimitás-padló).",
        );
      }
    }

    console.log(
      teardown
        ? "\n✓ Kész — az observer-képek visszaálltak a showcase-seed eredeti mintájára.\n"
        : `\n✓ Kész. Nyisd meg: /team/<id>?tab=intelligence — a „Visszajelzési kultúra" blokk\n` +
          `  a csapat-összefoglaló fölött ül. Küszöb: tagonként ≥3 értékelő,\n` +
          `  csapatonként ≥${TEAM_OBSERVER_MIN_COVERED} lefedett tag.\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error("\n❌ Seed hiba:", error instanceof Error ? error.message : error);
  process.exit(1);
});

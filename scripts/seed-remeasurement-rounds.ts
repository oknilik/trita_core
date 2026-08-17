/**
 * seed-remeasurement-rounds.ts — TÖBB egymás utáni mérési kör EGY csapatra,
 * hogy a visszamérés-összehasonlító (PR #30 / P0.1–P1.2) valódi adaton legyen
 * megnézhető: mit lát a tanácsadó és mit lát a csapattag.
 *
 * Előfeltétel: a `seed-showcase-org.ts` már lefutott (Aurora Dinamika Kft.,
 * csapatok, tagok, self-kitöltések).
 *
 * Mit hoz létre körönként (idempotens, újrafuttatható):
 *   · Campaign — LEZÁRT, `requireFreshResults: true`, saját aktiválás/zárás
 *     dátummal; `--preset SCAN_V1` esetén a nevesített preset lépéseivel
 *   · CampaignParticipant minden RÉSZTVEVŐ tagnak, minden lépés teljesítve
 *   · SELF — körhöz CÍMKÉZETT AssessmentResult (`campaignId`), ez adja a
 *     riport `comparisonBasis` pszeudonim hozzájáruló-halmazát
 *   · PSYCH_SAFETY — anonim pulse, itemenként TERVEZETT pályagörbével
 *   · TRUST_360 — bizalmi válaszok, körönként NÖVEKVŐ lefedettséggel
 *   · OBSERVER_360 / TEAM_ROLE / TEAM_ROLE_360 — teljes körnél (alapértelmezés)
 *   · TeamReport PUBLISHED, az adott KÖRRE szűrt aggregátumokkal
 *     (`buildTeamReportAggregates(teamId, { assessmentCampaignId })`)
 *
 * A körök szándékosan úgy állnak, hogy a összehasonlító minden ága éljen:
 *   · a pszichológiai biztonság két itemje a mérési kapun TÚL javul,
 *     a többi kapun BELÜL marad (nincs zajra épített állítás),
 *   · a bizalmi lefedettség nő,
 *   · a személyiség-átlagok mérési hibán belül maradnak — ez a KONTROLL
 *     („ugyanazt a csapatot mérjük"), nem fejlődés,
 *   · az összetétel körönként mozog (ki-be lépő kitöltők), de az átfedés a
 *     70%-os kapu felett marad, így a stabil mag számolható.
 *
 * Futtatás:
 *   npx vercel env pull .env.preview --environment=preview --yes
 *   npx tsx scripts/seed-remeasurement-rounds.ts --env-file .env.preview
 *   npx tsx scripts/seed-remeasurement-rounds.ts --env-file .env.preview --team "Értékesítés"
 *   npx tsx scripts/seed-remeasurement-rounds.ts --env-file .env.preview --rounds 2
 *   npx tsx scripts/seed-remeasurement-rounds.ts --env-file .env.preview --preset SCAN_V1
 *   npx tsx scripts/seed-remeasurement-rounds.ts --env-file .env.preview --teardown
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient, type RelationshipType } from "@prisma/client";
import {
  CAMPAIGN_STEP_ORDER,
  getCampaignPresetSteps,
  type CampaignStepType,
} from "../src/lib/campaign-steps-core";
import { TEAM_ROLE_ITEMS, type TeamRoleSelections } from "../src/lib/team-role-questions";
import { calculateTeamRoleScores } from "../src/lib/team-role-scoring";
import { TRUST_QUESTIONS } from "../src/lib/trust-network";
import { PSYCH_SAFETY_ITEMS } from "../src/lib/psych-safety";
import { buildFacets } from "./personas.shared";

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

loadEnvFile(argValue("--env-file") ?? ".env");

const ORG_NAME = "Aurora Dinamika Kft.";
/** A körök közös név-előtagja — a teardown KIZÁRÓLAG ezekre nyúl. */
const ROUND_PREFIX = "Team Scan visszamérés";
const roundName = (i: number) => `${ROUND_PREFIX} — ${i + 1}. kör`;

// ─── Determinisztikus véletlen (a seed-campaign-cycle mintája) ────────────────

/**
 * FNV-1a + murmur3 lezáró keverés. A finalizer NEM dísz: nélküle a kulcs
 * UTOLSÓ karaktere alig mozdítja a felső biteket, így a `...:${roundIndex}`
 * alakú kulcsok körönként ugyanazt a kis egészet adták vissza (a self-drift
 * mind a három körben azonos lett).
 */
function hash(key: string): number {
  let h = 2166136261;
  for (let i = 0; i < key.length; i += 1) {
    h ^= key.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  h ^= h >>> 15;
  h = Math.imul(h, 2246822507);
  h ^= h >>> 13;
  h = Math.imul(h, 3266489909);
  h ^= h >>> 16;
  return h >>> 0;
}
const rand = (key: string): number => hash(key) / 0xffffffff;
const randInt = (key: string, min: number, max: number): number =>
  min + Math.floor(rand(key) * (max - min + 1));

function shuffle<T>(items: readonly T[], key: string): T[] {
  return items
    .map((item, i) => ({ item, sort: rand(`${key}:${i}`) }))
    .sort((a, b) => a.sort - b.sort)
    .map((entry) => entry.item);
}

// ─── Pszichológiai biztonság: TERVEZETT pályagörbe ────────────────────────────
//
// Itemenkénti CÉL normalizált átlag (1–5, magas = biztonságos) körönként.
// A gondolat: a workshop után vállalt két akció (kényes témák · ötlet-kockázat)
// a harmadik körre a mérési kapun TÚL javul; a többi item a kapun belül mozog,
// és PS8 a második körben BEESIK, hogy az „új gyenge terület" ág is látszódjon.
//
// A kapu nagyságrendje itt √(sd²/n₁ + sd²/n₂) ≈ 0,3–0,5 pont, tehát a ~+0,9-es
// tervezett elmozdulás védhető, a ±0,2-es pedig szándékosan NEM az.
const PSYCH_TRAJECTORY: Record<string, number[]> = {
  //      1. kör  2. kör  3. kör
  PS1: [2.8, 3.0, 4.0], // kényes témák felvetése — vállalt akció célpontja
  PS2: [4.0, 4.2, 4.2], // hibázás kezelése (fordított item)
  PS3: [3.8, 3.8, 4.0], // segítségkérés
  PS4: [3.6, 3.8, 3.8], // eltérő gondolkodás
  PS5: [3.1, 3.2, 4.1], // ötlet-kockázat (fordított) — vállalt akció célpontja
  PS6: [4.2, 4.4, 4.4], // egymás munkájának tisztelete (fordított)
  PS7: [3.8, 4.0, 4.0], // képességek megbecsülése
  PS8: [3.9, 3.2, 3.6], // nyílt egyet-nem-értés — a 2. körben esik be
};

/**
 * n válaszadóra olyan egész (1–5) NORMALIZÁLT értéksor, aminek az átlaga a
 * célhoz a lehető legközelebb van, és van valódi szóródása (az itemSds így
 * mért érték lesz, nem prior).
 */
function normalizedAnswersFor(target: number, n: number, seed: string): number[] {
  const clamped = Math.max(1, Math.min(5, target));
  const base = Math.floor(clamped);
  const upperCount = Math.round((clamped - base) * n);
  const values = Array.from({ length: n }, (_, i) =>
    Math.max(1, Math.min(5, i < upperCount ? base + 1 : base)),
  );
  return shuffle(values, seed);
}

/** Normalizált érték → nyers Likert-válasz (a fordított itemek visszafordítva). */
function rawAnswer(itemId: string, normalized: number): number {
  const item = PSYCH_SAFETY_ITEMS.find((i) => i.id === itemId);
  return item?.reversed ? 6 - normalized : normalized;
}

// ─── Egyéb kör-adatok ─────────────────────────────────────────────────────────

/**
 * A self-pontszámok kör-specifikus elmozdulása. SZÁNDÉKOSAN kicsi (±3 pont):
 * a személyiségvonás stabil konstruktum, a csapatátlag deltájának a mérési
 * hibán BELÜL kell maradnia — ez a kontroll, amit a riport annak is nevez.
 */
function driftedDims(
  base: Record<string, number>,
  roundIndex: number,
  userId: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [code, value] of Object.entries(base)) {
    const delta = randInt(`drift:${userId}:${code}:${roundIndex}`, -3, 3);
    out[code] = Math.max(1, Math.min(99, value + delta));
  }
  return out;
}

const scoresJson = (dimensions: Record<string, number>) => ({
  type: "likert",
  dimensions,
  facets: buildFacets(dimensions),
  answers: [],
  questionCount: 60,
});

function buildSelections(seed: string): TeamRoleSelections {
  const picked = shuffle(TEAM_ROLE_ITEMS, seed).slice(0, 10);
  const selections: TeamRoleSelections = {};
  picked.forEach((item, i) => {
    selections[item.id] = i < 3 ? 2 : 1;
  });
  return selections;
}

/**
 * A csapattársi szerep-visszajelzés a TAG SAJÁT képéből indul, és csak a
 * kiemelt hármas ablakát tolja el értékelőnként. Enélkül a peer-kép független
 * véletlen lenne, és a riport 100%-os önkép–peer eltérést mutatna — ami nem
 * a termék viselkedése, hanem a seed műterméke.
 */
function buildPeerSelections(subjectSeed: string, raterSeed: string): TeamRoleSelections {
  const pool = shuffle(TEAM_ROLE_ITEMS, subjectSeed).slice(0, 12);
  const offset = randInt(raterSeed, 0, 2);
  const selections: TeamRoleSelections = {};
  pool.slice(offset, offset + 10).forEach((item, i) => {
    selections[item.id] = i < 3 ? 2 : 1;
  });
  return selections;
}

/** Bizalmi válaszkészlet — a körrel enyhén erősödő kapcsolati kép. */
function buildTrustAnswers(seed: string, roundIndex: number): Record<string, number> {
  const answers: Record<string, number> = {};
  for (const q of TRUST_QUESTIONS) {
    const low = q.max === 5 ? (roundIndex >= 2 ? 3 : 2) : 2;
    answers[q.id] = randInt(`${seed}:${q.id}`, low, q.max);
  }
  return answers;
}

const RELATIONSHIPS: RelationshipType[] = ["COLLEAGUE", "COLLEAGUE", "FRIEND"];
const DURATIONS = ["1_3", "3_5", "5P"];
const clamp99 = (n: number) => Math.max(1, Math.min(99, Math.round(n)));

function observerView(
  self: Record<string, number>,
  seed: string,
): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [code, value] of Object.entries(self)) {
    out[code] = clamp99(value + (rand(`${seed}:${code}`) * 2 - 1) * 12);
  }
  return out;
}

/**
 * Ki tölt ki az adott körben? Az első körben mindenki; utána körönként EGY
 * (körről körre MÁS) tag kimarad. Így a összehasonlítás `common` / `joined` /
 * `left` számai nem triviálisak, de az átfedés a 70%-os kapu felett marad.
 */
function participantsFor<T>(members: T[], roundIndex: number): T[] {
  if (roundIndex === 0 || members.length <= 4) return members;
  const skip = (roundIndex + 1) % members.length;
  return members.filter((_, i) => i !== skip);
}

/** A vállalt akciók státusza a KÖVETKEZŐ kör riportjában. */
const ACTION_STATUSES = ["done", "done", "in_progress", "not_started"] as const;

// ─── Teardown ─────────────────────────────────────────────────────────────────

async function teardown(prisma: PrismaClient): Promise<void> {
  const org = await prisma.organization.findFirst({
    where: { name: ORG_NAME },
    select: { id: true },
  });
  if (!org) {
    console.log("ℹ️  Nincs ilyen szervezet — nincs mit törölni.");
    return;
  }
  const campaigns = await prisma.campaign.findMany({
    where: { orgId: org.id, name: { startsWith: ROUND_PREFIX } },
    select: { id: true, teamId: true },
  });
  const campaignIds = campaigns.map((c) => c.id);
  if (campaignIds.length === 0) {
    console.log("ℹ️  Nincs ilyen előtagú kör — nincs mit törölni.");
    return;
  }

  // A körhöz CÍMKÉZETT adatokat előbb szedjük ki: a Campaign törlésekor a
  // SetNull-os kapcsolatoknál (AssessmentResult, TeamRoleScore) már nem
  // lenne mivel azonosítani őket, és címke nélkül maradnának a DB-ben.
  const selfDeleted = await prisma.assessmentResult.deleteMany({
    where: { campaignId: { in: campaignIds } },
  });
  const roleScoreIds = (
    await prisma.teamRoleScore.findMany({
      where: { campaignId: { in: campaignIds } },
      select: { id: true },
    })
  ).map((r) => r.id);
  const observerInvites = await prisma.observerInvitation.findMany({
    where: { campaignId: { in: campaignIds } },
    select: { id: true },
  });
  const inviteIds = observerInvites.map((i) => i.id);
  await prisma.observerAssessment.deleteMany({ where: { invitationId: { in: inviteIds } } });
  await prisma.observerDraft.deleteMany({ where: { invitationId: { in: inviteIds } } });
  await prisma.observerInvitation.deleteMany({ where: { id: { in: inviteIds } } });

  const reports = await prisma.teamReport.deleteMany({
    where: { title: { startsWith: ROUND_PREFIX } },
  });
  // A kampány törlése kaszkádolja a résztvevőket, a pulse-válaszokat és a
  // szerep-/bizalmi megfigyeléseket.
  const { count } = await prisma.campaign.deleteMany({ where: { id: { in: campaignIds } } });
  await prisma.teamRoleScore.deleteMany({ where: { id: { in: roleScoreIds } } });

  console.log(
    `🗑  ${count} kör · ${reports.count} riport · ${selfDeleted.count} self-eredmény` +
      ` · ${inviteIds.length} observer-meghívó · ${roleScoreIds.length} szerep-kitöltés törölve.`,
  );
}

// ─── Fő folyamat ──────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  const prisma = new PrismaClient({ log: ["error"] });
  // A riport-építő az app prisma-singletonját használja, ami import-időben
  // olvassa a DATABASE_URL-t — ezért CSAK az env betöltése után importálható.
  const { buildTeamReportAggregates, buildDraftNarrativePrefill } = await import(
    "../src/lib/team-report"
  );

  try {
    if (process.argv.includes("--teardown")) {
      await teardown(prisma);
      return;
    }

    const presetArg = argValue("--preset");
    const presetId = presetArg?.toUpperCase() === "SCAN_V1" ? ("SCAN_V1" as const) : null;
    const steps: CampaignStepType[] = presetId
      ? getCampaignPresetSteps(presetId)
      : [...CAMPAIGN_STEP_ORDER].filter((s) => s !== "SELF_ASSESSMENT");
    const rounds = Math.max(2, Number(argValue("--rounds") ?? 3));
    const teamNameArg = argValue("--team");

    const org = await prisma.organization.findFirst({
      where: { name: ORG_NAME },
      select: {
        id: true,
        teams: {
          select: {
            id: true,
            name: true,
            members: {
              orderBy: { joinedAt: "asc" },
              select: { user: { select: { id: true, username: true } } },
            },
          },
        },
        members: { where: { role: "ORG_CONSULTANT" }, select: { userId: true } },
      },
    });
    if (!org) {
      throw new Error(`Nincs "${ORG_NAME}" szervezet — előbb futtasd a seed-showcase-org.ts-t.`);
    }

    const team = teamNameArg
      ? org.teams.find((t) => t.name === teamNameArg)
      : org.teams[0];
    if (!team) {
      throw new Error(
        `Nincs "${teamNameArg}" csapat. Elérhető: ${org.teams.map((t) => t.name).join(", ")}`,
      );
    }
    const consultantId = org.members[0]?.userId ?? team.members[0]?.user.id;
    if (!consultantId) throw new Error("Nincs kiadó (tanácsadó vagy tag) a szervezetben.");

    const members = team.members.map((m) => m.user);
    if (members.length < 3) {
      throw new Error(`A(z) "${team.name}" csapatban ${members.length} tag van — legalább 3 kell.`);
    }

    // A kör-specifikus self-eredmény a tag JELENLEGI profiljából indul: a
    // meglévő (kampány nélküli) kitöltés a bázis, arra jön a kör-drift.
    const baseDims = new Map<string, Record<string, number>>();
    for (const m of members) {
      const latest = await prisma.assessmentResult.findFirst({
        where: { userProfileId: m.id, isSelfAssessment: true },
        orderBy: { createdAt: "desc" },
        select: { scores: true },
      });
      const dims = (latest?.scores as { dimensions?: Record<string, number> } | null)?.dimensions;
      if (!dims) {
        throw new Error(
          `${m.username ?? m.id} tagnak nincs self-eredménye — előbb futtasd a seed-showcase-org.ts-t.`,
        );
      }
      baseDims.set(m.id, dims);
    }

    console.log(
      `\n▸ ${team.name} — ${members.length} tag · ${rounds} kör · lépések: ${steps.join(", ")}` +
        `${presetId ? ` · preset: ${presetId}` : ""}`,
    );

    /** Az előző kör riportjának akciótételei — a következő kör kimenet-táblájához. */
    let previousReportId: string | null = null;

    for (let roundIndex = 0; roundIndex < rounds; roundIndex += 1) {
      const name = roundName(roundIndex);
      // A legrégebbi kör van leghátrébb; a körök ~10 hetente követik egymást,
      // és a LEGUTOLSÓ kör is teljesen a múltban zárul (nincs jövőbeli dátum).
      const activatedAt = new Date();
      activatedAt.setDate(activatedAt.getDate() - (rounds - roundIndex) * 70);
      const closedAt = new Date(activatedAt);
      closedAt.setDate(closedAt.getDate() + 14);
      const publishedAt = new Date(closedAt);
      publishedAt.setDate(publishedAt.getDate() + 2);

      const roundMembers = participantsFor(members, roundIndex);
      const roundMemberIds = new Set(roundMembers.map((m) => m.id));

      // 1) Kampány
      let campaign = await prisma.campaign.findFirst({
        where: { orgId: org.id, name, teamId: team.id },
        select: { id: true },
      });
      const campaignData = {
        presetId,
        type: steps[0],
        steps,
        teamId: team.id,
        teamIds: [team.id],
        stepIntervalHours: 24,
        // A kör-címkézés lényege: minden kör SAJÁT, friss kitöltést kér.
        requireFreshResults: true,
        status: "CLOSED",
        activatedAt,
        closedAt,
      };
      if (campaign) {
        await prisma.campaign.update({ where: { id: campaign.id }, data: campaignData });
      } else {
        campaign = await prisma.campaign.create({
          data: {
            ...campaignData,
            orgId: org.id,
            name,
            description:
              roundIndex === 0
                ? "Alapmérés: a beavatkozás előtti kiindulási kép."
                : "Visszamérés: a vállalt akciók hatásának ellenőrzése.",
            createdBy: consultantId,
            createdAt: activatedAt,
          },
          select: { id: true },
        });
      }
      const campaignId = campaign.id;

      // 2) Résztvevők — minden lépés teljesítve
      const stepCompletions: Record<string, string> = {};
      steps.forEach((stepType, i) => {
        const at = new Date(activatedAt);
        at.setDate(at.getDate() + i * 2);
        stepCompletions[stepType] = at.toISOString();
      });
      for (const m of roundMembers) {
        await prisma.campaignParticipant.upsert({
          where: { campaignId_userId: { campaignId, userId: m.id } },
          create: {
            campaignId,
            userId: m.id,
            addedAt: activatedAt,
            currentStep: steps.length,
            stepCompletions,
            completedAt: closedAt,
            nextStepOpensAt: null,
          },
          update: {
            currentStep: steps.length,
            stepCompletions,
            completedAt: closedAt,
            nextStepOpensAt: null,
          },
        });
      }
      // A kimaradó tag résztvevő marad, de nem teljesített — a kitöltöttségi
      // szám így őszinte, és a hozzájáruló-halmazból is kiesik.
      for (const m of members) {
        if (roundMemberIds.has(m.id)) continue;
        await prisma.campaignParticipant.upsert({
          where: { campaignId_userId: { campaignId, userId: m.id } },
          create: { campaignId, userId: m.id, addedAt: activatedAt, currentStep: 0 },
          update: { currentStep: 0, stepCompletions: {}, completedAt: null },
        });
      }

      // 3) SELF — a körhöz CÍMKÉZETT eredmény (ez adja a comparisonBasist)
      let selfCreated = 0;
      for (const m of roundMembers) {
        const existing = await prisma.assessmentResult.findFirst({
          where: { userProfileId: m.id, campaignId, isSelfAssessment: true },
          select: { id: true },
        });
        if (existing) continue;
        const createdAt = new Date(activatedAt);
        createdAt.setDate(createdAt.getDate() + randInt(`self:${m.id}:${roundIndex}`, 1, 10));
        await prisma.assessmentResult.create({
          data: {
            userProfileId: m.id,
            campaignId,
            testType: "TRITAN",
            isSelfAssessment: true,
            createdAt,
            scores: scoresJson(driftedDims(baseDims.get(m.id)!, roundIndex, m.id)) as object,
          },
        });
        selfCreated += 1;
      }

      // 4) PSYCH_SAFETY — tervezett pályagörbe, anonim válaszok
      let pulseCreated = 0;
      if (steps.includes("PSYCH_SAFETY")) {
        const existing = await prisma.psychSafetyResponse.count({ where: { campaignId } });
        if (existing === 0) {
          const n = roundMembers.length;
          // Itemenként előállítjuk a normalizált értéksort, majd válaszadónként
          // összefűzzük — így minden item átlaga a TERVEZETT pályán van.
          const perItem = new Map<string, number[]>();
          for (const item of PSYCH_SAFETY_ITEMS) {
            const traj = PSYCH_TRAJECTORY[item.id] ?? [3.8, 3.8, 3.8];
            const target = traj[Math.min(roundIndex, traj.length - 1)];
            perItem.set(item.id, normalizedAnswersFor(target, n, `${item.id}:${roundIndex}`));
          }
          for (let r = 0; r < n; r += 1) {
            const answers: Record<string, number> = {};
            for (const item of PSYCH_SAFETY_ITEMS) {
              answers[item.id] = rawAnswer(item.id, perItem.get(item.id)![r]);
            }
            await prisma.psychSafetyResponse.create({
              data: { campaignId, answers: answers as object, submittedOn: closedAt },
            });
            pulseCreated += 1;
          }
        }
      }

      // 5) TRUST_360 — körönként NÖVEKVŐ lefedettség
      let trustCreated = 0;
      if (steps.includes("TRUST_360")) {
        // A korai körökben csak a közvetlen szomszédot értékelik (részleges
        // háló), az UTOLSÓ körben mindenki mindenkit — így a lefedettség
        // valóban NŐ, nem csak a létszámtól ingadozik.
        const reach = roundIndex === rounds - 1 ? roundMembers.length - 1 : 1;
        for (const [i, rater] of roundMembers.entries()) {
          for (let k = 1; k <= reach; k += 1) {
            const about = roundMembers[(i + k) % roundMembers.length];
            if (about.id === rater.id) continue;
            await prisma.trustObservation.upsert({
              where: {
                campaignId_aboutUserId_raterUserId: {
                  campaignId,
                  aboutUserId: about.id,
                  raterUserId: rater.id,
                },
              },
              create: {
                teamId: team.id,
                campaignId,
                aboutUserId: about.id,
                raterUserId: rater.id,
                answers: buildTrustAnswers(`trust:${about.id}:${rater.id}`, roundIndex) as object,
              },
              update: {},
            });
            trustCreated += 1;
          }
        }
      }

      // 6) TEAM_ROLE + TEAM_ROLE_360 — teljes körnél
      let roleCreated = 0;
      if (steps.includes("TEAM_ROLE")) {
        for (const m of roundMembers) {
          const existing = await prisma.teamRoleScore.findFirst({
            where: { userProfileId: m.id, campaignId },
            select: { id: true },
          });
          if (existing) continue;
          await prisma.teamRoleScore.create({
            data: {
              userProfileId: m.id,
              campaignId,
              source: "questionnaire",
              createdAt: closedAt,
              scores: calculateTeamRoleScores(
                buildSelections(`role:${m.id}`),
              ) as object,
            },
          });
          roleCreated += 1;
        }
      }
      if (steps.includes("TEAM_ROLE_360")) {
        for (const about of roundMembers) {
          for (const rater of roundMembers) {
            if (rater.id === about.id) continue;
            await prisma.teamRoleObservation.upsert({
              where: {
                campaignId_aboutUserId_raterUserId: {
                  campaignId,
                  aboutUserId: about.id,
                  raterUserId: rater.id,
                },
              },
              create: {
                teamId: team.id,
                campaignId,
                aboutUserId: about.id,
                raterUserId: rater.id,
                selections: buildPeerSelections(
                  `role:${about.id}`,
                  `peer:${rater.id}:${about.id}:${roundIndex}`,
                ) as object,
              },
              update: {},
            });
          }
        }
      }

      // 7) OBSERVER_360 — körhöz kötött külső kép (a self↔külső kép panelhez
      //    tagonként legalább 3 értékelő kell, a csapatnak legalább 4 lefedett).
      let observerCreated = 0;
      if (steps.includes("OBSERVER_360")) {
        for (const subject of roundMembers) {
          const already = await prisma.observerInvitation.count({
            where: { inviterId: subject.id, campaignId, status: "COMPLETED" },
          });
          if (already >= 3) continue;
          const raters = roundMembers.filter((r) => r.id !== subject.id).slice(0, 3);
          for (const [i, rater] of raters.entries()) {
            const expiresAt = new Date(activatedAt);
            expiresAt.setDate(expiresAt.getDate() + 30);
            const invitation = await prisma.observerInvitation.create({
              data: {
                inviterId: subject.id,
                observerProfileId: rater.id,
                observerName: rater.username ?? "Csapattárs",
                testType: "TRITAN",
                status: "COMPLETED",
                observerType: "TEAM",
                campaignId,
                createdAt: activatedAt,
                expiresAt,
                completedAt: closedAt,
              },
            });
            await prisma.observerAssessment.create({
              data: {
                invitationId: invitation.id,
                relationshipType: RELATIONSHIPS[i % RELATIONSHIPS.length],
                knownDuration: DURATIONS[i % DURATIONS.length],
                confidence: 4,
                scores: scoresJson(
                  observerView(
                    baseDims.get(subject.id)!,
                    `obs:${subject.id}:${rater.id}:${roundIndex}`,
                  ),
                ) as object,
              },
            });
            observerCreated += 1;
          }
        }
      }

      console.log(
        `  ${roundIndex + 1}. kör (${activatedAt.toISOString().slice(0, 10)}) — kitöltők: ` +
          `${roundMembers.length}/${members.length} · self: ${selfCreated} · pulse: ${pulseCreated}` +
          ` · bizalom: ${trustCreated} · szerep: ${roleCreated} · observer: ${observerCreated}`,
      );

      // 8) Publikált riport — KIZÁRÓLAG erre a körre szűrt aggregátumokkal
      const aggregates = await buildTeamReportAggregates(team.id, {
        assessmentCampaignId: campaignId,
      });
      if (!aggregates) {
        console.log("     ⚠️  Nem épült aggregátum — riport kimarad.");
        continue;
      }
      const narrative = buildDraftNarrativePrefill(aggregates);
      // A vállalt akciók státusza: az előző kör tételei nagyrészt elkészültek,
      // így a következő kör kimenet-táblája nem üres állapotokkal indul.
      const actionItems = (narrative?.actionItems ?? []).map((item, i) => ({
        ...item,
        status: ACTION_STATUSES[i % ACTION_STATUSES.length],
      }));

      const title = `${name} — ${team.name}`;
      const reportData = {
        teamId: team.id,
        orgId: org.id,
        status: "PUBLISHED",
        title,
        aggregates: aggregates as object,
        summary: narrative?.summary ?? null,
        strengths: narrative?.strengths ?? null,
        risks: narrative?.risks ?? null,
        recommendations: narrative?.recommendations ?? null,
        leadershipGuide: narrative?.leadershipGuide ?? null,
        actionItems: actionItems as object,
        createdById: consultantId,
        createdAt: publishedAt,
        publishedAt,
        publishedById: consultantId,
      };
      const existingReport = await prisma.teamReport.findFirst({
        where: { teamId: team.id, title },
        select: { id: true },
      });
      const report = existingReport
        ? await prisma.teamReport.update({
            where: { id: existingReport.id },
            data: reportData,
            select: { id: true },
          })
        : await prisma.teamReport.create({ data: reportData, select: { id: true } });

      const targeted = actionItems.filter((a) => "targetMetric" in a && a.targetMetric).length;
      console.log(
        `     ✓ riport PUBLISHED (${publishedAt.toISOString().slice(0, 10)}) · akciók: ` +
          `${actionItems.length} (célmutatóval: ${targeted})` +
          `${previousReportId ? " · összehasonlítható az előző körrel" : ""}`,
      );
      previousReportId = report.id;
    }

    console.log(
      `\n✅  Kész — "${team.name}": ${rounds} lezárt kör, mindegyik publikált riporttal.\n` +
        `    Tanácsadó/admin: /team/${team.id}?tab=profile → „Mi változott az előző kör óta?"\n` +
        `    Csapattag:       /team/${team.id} (a publikált riport tag-nézete)\n`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * seed-showcase-org.ts — teljes bemutató-szervezet egy lépésben.
 *
 * Mit hoz létre (idempotens, újrafuttatható):
 *   · 1 szervezet ("Aurora Dinamika Kft.") aktív team-előfizetéssel,
 *     bekapcsolt karrier-modullal
 *   · 3 csapat, csapatonként 5 BEJELENTKEZHETŐ taggal (15 Clerk teszt-user)
 *   · minden tagnak saját TRITAN self-kitöltés + 3 observer-visszajelzés
 *     (a visszajelzők a csapattársak — így a dinamika-nézetek is élnek)
 *   · a platform-admin (ADMIN_EMAILS első címe) ORG_CONSULTANT-ként,
 *     saját self-kitöltéssel („Energikus újító") és 3 observer-válasszal
 *
 * Futtatás (a cél-környezet env-fájljával):
 *   npx vercel env pull .env.preview --environment=preview --yes
 *   npx tsx scripts/seed-showcase-org.ts --env-file .env.preview
 *   npx tsx scripts/seed-showcase-org.ts --env-file .env.preview --teardown
 *
 * Belépés (Clerk dev teszt-mód): /sign-in → email → kód: 424242
 *
 * Előfeltétel: CLERK_SECRET_KEY (sk_test_…) — éles kulccsal a script leáll,
 * mert a +clerk_test címek és a 424242 kód csak dev instance-on működnek.
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient, type RelationshipType } from "@prisma/client";
import { DIMS, buildFacets, type DimCode } from "./personas.shared";

// ─── Env ──────────────────────────────────────────────────────────────────────

function loadEnvFile(path: string): void {
  const content = readFileSync(resolve(process.cwd(), path), "utf-8");
  for (const rawLine of content.split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).replace(/^export\s+/, "").trim();
    const value = line.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    process.env[key] = value;
  }
  console.log(`📄 Env: ${path}`);
}

function argValue(flag: string): string | null {
  const i = process.argv.indexOf(flag);
  return i === -1 ? null : (process.argv[i + 1] ?? null);
}

loadEnvFile(argValue("--env-file") ?? ".env");

const CLERK_SECRET_KEY = process.env.CLERK_SECRET_KEY ?? "";
const CLERK_API = "https://api.clerk.com/v1";
const ORG_NAME = "Aurora Dinamika Kft.";

// ─── Clerk Backend API ────────────────────────────────────────────────────────

async function clerkFetch(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`${CLERK_API}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
}

async function ensureClerkUser(email: string, firstName: string, lastName: string): Promise<string> {
  const found = await clerkFetch(`/users?email_address=${encodeURIComponent(email)}&limit=1`);
  if (!found.ok) throw new Error(`Clerk keresés (${found.status}): ${await found.text()}`);
  const existing = (await found.json()) as Array<{ id: string }>;
  if (existing[0]) return existing[0].id;

  const created = await clerkFetch("/users", {
    method: "POST",
    body: JSON.stringify({
      email_address: [email],
      first_name: firstName,
      last_name: lastName,
      skip_password_requirement: true,
    }),
  });
  if (!created.ok) throw new Error(`Clerk létrehozás (${created.status}): ${await created.text()}`);
  return ((await created.json()) as { id: string }).id;
}

// ─── Determinisztikus jitter ──────────────────────────────────────────────────

/**
 * Stabil pszeudo-véletlen [-1, 1) a kulcsból — így az observer-értékek
 * futásról futásra ugyanazok, de nem azonosak a self-értékekkel.
 */
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
 * Observer-kép a self-profilból: dimenziónként ±12 pont eltérés. Ettől lesz
 * értelmes a self–observer összevetés (vakfolt/rejtett erősség), miközben a
 * két kép felismerhetően ugyanaz az emberről.
 */
function observerView(self: Record<string, number>, seed: string): Record<string, number> {
  const out: Record<string, number> = {};
  for (const dim of DIMS) out[dim] = clamp(self[dim] + jitter(`${seed}:${dim}`) * 12);
  return out;
}

const scoresJson = (dimensions: Record<string, number>) => ({
  type: "likert",
  dimensions,
  facets: buildFacets(dimensions),
  answers: [],
  questionCount: 60,
});

// ─── Adatok ───────────────────────────────────────────────────────────────────

type Member = {
  slug: string;
  first: string;
  last: string;
  orgRole: "ORG_ADMIN" | "ORG_MEMBER";
  teamRole: "manager" | "member";
  dims: Record<DimCode, number>;
};

type TeamSpec = { name: string; members: Member[] };

const TEAMS: TeamSpec[] = [
  {
    name: "Termékfejlesztés",
    members: [
      // Csapatvezető + org-admin: módszeres rendszerépítő
      { slug: "kata", first: "Aurora", last: "Kata", orgRole: "ORG_ADMIN", teamRole: "manager",
        dims: { INTE: 74, RESO: 46, TEMP: 58, ADAP: 60, THOR: 88, OPEN: 66 } },
      { slug: "bence", first: "Aurora", last: "Bence", orgRole: "ORG_MEMBER", teamRole: "member",
        dims: { INTE: 58, RESO: 40, TEMP: 62, ADAP: 48, THOR: 52, OPEN: 90 } },
      { slug: "dora", first: "Aurora", last: "Dóra", orgRole: "ORG_MEMBER", teamRole: "member",
        dims: { INTE: 68, RESO: 66, TEMP: 44, ADAP: 72, THOR: 70, OPEN: 58 } },
      { slug: "gergo", first: "Aurora", last: "Gergő", orgRole: "ORG_MEMBER", teamRole: "member",
        dims: { INTE: 50, RESO: 34, TEMP: 78, ADAP: 44, THOR: 46, OPEN: 76 } },
      { slug: "hanna", first: "Aurora", last: "Hanna", orgRole: "ORG_MEMBER", teamRole: "member",
        dims: { INTE: 80, RESO: 58, TEMP: 40, ADAP: 66, THOR: 76, OPEN: 50 } },
    ],
  },
  {
    name: "Értékesítés",
    members: [
      { slug: "marton", first: "Aurora", last: "Márton", orgRole: "ORG_MEMBER", teamRole: "manager",
        dims: { INTE: 56, RESO: 38, TEMP: 90, ADAP: 78, THOR: 54, OPEN: 62 } },
      { slug: "reka", first: "Aurora", last: "Réka", orgRole: "ORG_MEMBER", teamRole: "member",
        dims: { INTE: 62, RESO: 52, TEMP: 82, ADAP: 84, THOR: 44, OPEN: 58 } },
      { slug: "tamas", first: "Aurora", last: "Tamás", orgRole: "ORG_MEMBER", teamRole: "member",
        dims: { INTE: 44, RESO: 30, TEMP: 86, ADAP: 56, THOR: 60, OPEN: 54 } },
      { slug: "zsofia", first: "Aurora", last: "Zsófia", orgRole: "ORG_MEMBER", teamRole: "member",
        dims: { INTE: 70, RESO: 64, TEMP: 72, ADAP: 80, THOR: 50, OPEN: 66 } },
      { slug: "levente", first: "Aurora", last: "Levente", orgRole: "ORG_MEMBER", teamRole: "member",
        dims: { INTE: 52, RESO: 44, TEMP: 76, ADAP: 62, THOR: 68, OPEN: 42 } },
    ],
  },
  {
    name: "Ügyfélszolgálat",
    members: [
      { slug: "eszter", first: "Aurora", last: "Eszter", orgRole: "ORG_MEMBER", teamRole: "manager",
        dims: { INTE: 72, RESO: 84, TEMP: 54, ADAP: 86, THOR: 62, OPEN: 48 } },
      { slug: "adam", first: "Aurora", last: "Ádám", orgRole: "ORG_MEMBER", teamRole: "member",
        dims: { INTE: 66, RESO: 78, TEMP: 46, ADAP: 74, THOR: 58, OPEN: 44 } },
      { slug: "nora", first: "Aurora", last: "Nóra", orgRole: "ORG_MEMBER", teamRole: "member",
        dims: { INTE: 58, RESO: 88, TEMP: 62, ADAP: 70, THOR: 40, OPEN: 56 } },
      { slug: "peter", first: "Aurora", last: "Péter", orgRole: "ORG_MEMBER", teamRole: "member",
        dims: { INTE: 76, RESO: 56, TEMP: 38, ADAP: 68, THOR: 82, OPEN: 46 } },
      { slug: "viktoria", first: "Aurora", last: "Viktória", orgRole: "ORG_MEMBER", teamRole: "member",
        dims: { INTE: 64, RESO: 72, TEMP: 68, ADAP: 78, THOR: 48, OPEN: 60 } },
    ],
  },
];

const emailOf = (m: Member) => `aurora-${m.slug}+clerk_test@trita.io`;
const nameOf = (m: Member) => `${m.first} ${m.last}`;

/** Tanácsadó self-profilja: domináns OPEN + második TEMP = „Energikus újító". */
const CONSULTANT_DIMS: Record<DimCode, number> = {
  INTE: 68, RESO: 46, TEMP: 82, ADAP: 62, THOR: 54, OPEN: 91,
};

const RELATIONSHIPS: RelationshipType[] = ["COLLEAGUE", "COLLEAGUE", "FRIEND"];
const DURATIONS = ["1_3", "3_5", "5P"];

// ─── Seed-lépések ─────────────────────────────────────────────────────────────

const ALL_MEMBERS = TEAMS.flatMap((t) => t.members);

async function ensureProfile(
  prisma: PrismaClient,
  email: string,
  username: string,
  firstName: string,
  lastName: string,
): Promise<string> {
  const clerkId = await ensureClerkUser(email, firstName, lastName);
  const profile = await prisma.userProfile.upsert({
    where: { clerkId },
    update: { email, username, testType: "TRITAN", onboardedAt: new Date(), consentedAt: new Date() },
    create: {
      clerkId,
      email,
      username,
      testType: "TRITAN",
      testTypeAssignedAt: new Date(),
      onboardedAt: new Date(),
      consentedAt: new Date(),
      locale: "hu",
    },
  });
  return profile.id;
}

async function ensureSelfResult(
  prisma: PrismaClient,
  profileId: string,
  dims: Record<string, number>,
): Promise<void> {
  const existing = await prisma.assessmentResult.findFirst({
    where: { userProfileId: profileId, isSelfAssessment: true },
    select: { id: true },
  });
  if (existing) return;
  await prisma.assessmentResult.create({
    data: {
      userProfileId: profileId,
      testType: "TRITAN",
      isSelfAssessment: true,
      scores: scoresJson(dims) as object,
    },
  });
}

/**
 * Observer-visszajelzések: a `raters` listából annyi, hogy a célszemélynek
 * összesen legalább `target` COMPLETED válasza legyen. A meghívó és a válasz
 * egyszerre készül (a demo-adathoz nincs értelme félkész meghívónak).
 */
async function ensureObservers(
  prisma: PrismaClient,
  subject: { id: string; name: string; dims: Record<string, number> },
  raters: Array<{ id: string; name: string }>,
  target: number,
): Promise<number> {
  const done = await prisma.observerInvitation.count({
    where: { inviterId: subject.id, status: "COMPLETED" },
  });
  let created = 0;
  for (const rater of raters) {
    if (done + created >= target) break;
    const already = await prisma.observerInvitation.findFirst({
      where: { inviterId: subject.id, observerProfileId: rater.id },
      select: { id: true },
    });
    if (already) continue;

    const idx = (done + created) % RELATIONSHIPS.length;
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const invitation = await prisma.observerInvitation.create({
      data: {
        inviterId: subject.id,
        observerProfileId: rater.id,
        observerName: rater.name,
        testType: "TRITAN",
        status: "COMPLETED",
        observerType: "TEAM",
        expiresAt,
        completedAt: new Date(),
      },
    });
    await prisma.observerAssessment.create({
      data: {
        invitationId: invitation.id,
        relationshipType: RELATIONSHIPS[idx],
        knownDuration: DURATIONS[idx],
        confidence: 4,
        scores: scoresJson(observerView(subject.dims, `${subject.id}:${rater.id}`)) as object,
      },
    });
    created += 1;
  }
  return created;
}

async function teardown(prisma: PrismaClient): Promise<void> {
  const emails = ALL_MEMBERS.map(emailOf);
  const profiles = await prisma.userProfile.findMany({
    where: { email: { in: emails } },
    select: { id: true, email: true },
  });
  const ids = profiles.map((p) => p.id);

  const org = await prisma.organization.findFirst({ where: { name: ORG_NAME }, select: { id: true } });
  if (org) {
    await prisma.team.deleteMany({ where: { orgId: org.id } });
    await prisma.organization.delete({ where: { id: org.id } });
    console.log(`🗑  Org törölve: ${ORG_NAME}`);
  }

  // Observer-adat mindkét irányban (a tanácsadó felé menők is innen jönnek).
  const invitations = await prisma.observerInvitation.findMany({
    where: { OR: [{ inviterId: { in: ids } }, { observerProfileId: { in: ids } }] },
    select: { id: true },
  });
  const invIds = invitations.map((i) => i.id);
  await prisma.observerAssessment.deleteMany({ where: { invitationId: { in: invIds } } });
  await prisma.observerDraft.deleteMany({ where: { invitationId: { in: invIds } } });
  await prisma.observerInvitation.deleteMany({ where: { id: { in: invIds } } });
  await prisma.assessmentResult.deleteMany({ where: { userProfileId: { in: ids } } });
  await prisma.assessmentDraft.deleteMany({ where: { userProfileId: { in: ids } } });
  await prisma.organizationMember.deleteMany({ where: { userId: { in: ids } } });
  await prisma.teamMember.deleteMany({ where: { userId: { in: ids } } });
  for (const p of profiles) {
    await prisma.userProfile
      .delete({ where: { id: p.id } })
      .catch(() => console.log(`⚠️  ${p.email} nem törölhető (kapcsolódó adat) — megtartva`));
  }
  console.log(`🗑  ${profiles.length} dummy profil törölve. A Clerk-userek megmaradnak.`);
}

async function main(): Promise<void> {
  if (!CLERK_SECRET_KEY.startsWith("sk_test_")) {
    console.error(
      "❌  CLERK_SECRET_KEY nem dev-kulcs (sk_test_…).\n" +
        "    A +clerk_test címek és a 424242 kód csak Clerk dev instance-on működnek,\n" +
        "    éles kulccsal a seedelt userek nem tudnának belépni.",
    );
    process.exit(1);
  }

  const prisma = new PrismaClient({ log: ["error"] });
  try {
    if (process.argv.includes("--teardown")) {
      await teardown(prisma);
      return;
    }

    // 1) Tagok: Clerk-user + profil + self-kitöltés
    console.log("\n▸ Tagok…");
    const byTeam = new Map<string, Array<{ id: string; name: string; member: Member }>>();
    for (const team of TEAMS) {
      const entries: Array<{ id: string; name: string; member: Member }> = [];
      for (const m of team.members) {
        const id = await ensureProfile(prisma, emailOf(m), nameOf(m), m.first, m.last);
        await ensureSelfResult(prisma, id, m.dims);
        entries.push({ id, name: nameOf(m), member: m });
        console.log(`  ✓ ${nameOf(m)} — ${emailOf(m)}`);
      }
      byTeam.set(team.name, entries);
    }

    // 2) Szervezet: owner = az ORG_ADMIN tag, aktív előfizetés, karrier-modul BE
    const allEntries = [...byTeam.values()].flat();
    const owner = allEntries.find((e) => e.member.orgRole === "ORG_ADMIN") ?? allEntries[0];
    let org = await prisma.organization.findFirst({ where: { name: ORG_NAME }, select: { id: true } });
    if (!org) {
      org = await prisma.organization.create({
        data: { name: ORG_NAME, ownerId: owner.id, hideCareerModule: false },
        select: { id: true },
      });
    } else {
      await prisma.organization.update({
        where: { id: org.id },
        data: { hideCareerModule: false, status: "ACTIVE" },
      });
    }

    const periodEnd = new Date();
    periodEnd.setMonth(periodEnd.getMonth() + 12);
    await prisma.subscription.upsert({
      where: { orgId: org.id },
      create: {
        orgId: org.id,
        status: "active",
        planType: "team",
        currentPeriodStart: new Date(),
        currentPeriodEnd: periodEnd,
      },
      update: {
        status: "active",
        planType: "team",
        currentPeriodEnd: periodEnd,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
      },
    });

    for (const e of allEntries) {
      await prisma.organizationMember.upsert({
        where: { orgId_userId: { orgId: org.id, userId: e.id } },
        create: { orgId: org.id, userId: e.id, role: e.member.orgRole },
        update: { role: e.member.orgRole, leftAt: null },
      });
    }

    // 3) Csapatok
    console.log("\n▸ Csapatok…");
    for (const spec of TEAMS) {
      const entries = byTeam.get(spec.name)!;
      const lead = entries.find((e) => e.member.teamRole === "manager") ?? entries[0];
      let team = await prisma.team.findFirst({
        where: { orgId: org.id, name: spec.name },
        select: { id: true },
      });
      if (!team) {
        team = await prisma.team.create({
          data: { name: spec.name, orgId: org.id, ownerId: lead.id },
          select: { id: true },
        });
      }
      for (const e of entries) {
        await prisma.teamMember.upsert({
          where: { teamId_userId: { teamId: team.id, userId: e.id } },
          create: { teamId: team.id, userId: e.id, role: e.member.teamRole },
          update: { role: e.member.teamRole },
        });
      }
      console.log(`  ✓ ${spec.name} — ${entries.length} tag (vezető: ${lead.name})`);
    }

    // 4) Observer-visszajelzések: csapaton belüli kollégáktól, fejenként 3
    console.log("\n▸ Observer-visszajelzések…");
    for (const spec of TEAMS) {
      const entries = byTeam.get(spec.name)!;
      for (const subject of entries) {
        const raters = entries.filter((e) => e.id !== subject.id);
        const n = await ensureObservers(
          prisma,
          { id: subject.id, name: subject.name, dims: subject.member.dims },
          raters,
          3,
        );
        console.log(`  ✓ ${subject.name}: +${n} válasz`);
      }
    }

    // 5) Tanácsadó: ORG_CONSULTANT + saját kitöltés + 3 observer
    // A `vercel env pull` a sensitive-nek jelölt változókat "[SENSITIVE]"-ként
    // írja ki, ezért az ADMIN_EMAILS-ből olvasott érték használhatatlan lehet —
    // ilyenkor a --consultant-email kapcsoló adja meg a címet.
    const envAdmin = (process.env.ADMIN_EMAILS ?? "").split(",")[0]?.trim();
    const adminEmail =
      argValue("--consultant-email") ?? (envAdmin?.includes("@") ? envAdmin : null);
    if (!adminEmail) {
      console.log(
        "\n⚠️  Tanácsadó-cím nincs meg (ADMIN_EMAILS maszkolt vagy hiányzik).\n" +
          "    Add meg: --consultant-email <email>",
      );
    } else {
      console.log(`\n▸ Tanácsadó: ${adminEmail}`);
      const consultantId = await ensureProfile(prisma, adminEmail, "Trita tanácsadó", "Trita", "Tanácsadó");
      await ensureSelfResult(prisma, consultantId, CONSULTANT_DIMS);
      await prisma.organizationMember.upsert({
        where: { orgId_userId: { orgId: org.id, userId: consultantId } },
        create: { orgId: org.id, userId: consultantId, role: "ORG_CONSULTANT" },
        update: { role: "ORG_CONSULTANT", leftAt: null },
      });
      // Visszajelzők: a három csapatvezető
      const leads = TEAMS.map((spec) => {
        const entries = byTeam.get(spec.name)!;
        return entries.find((e) => e.member.teamRole === "manager") ?? entries[0];
      });
      const n = await ensureObservers(
        prisma,
        { id: consultantId, name: "Trita tanácsadó", dims: CONSULTANT_DIMS },
        leads.map((l) => ({ id: l.id, name: l.name })),
        3,
      );
      console.log(`  ✓ ORG_CONSULTANT, self-kitöltés (Energikus újító), +${n} observer-válasz`);
    }

    // ─── Összegzés ────────────────────────────────────────────────────────────
    console.log(`\n🏢  ${ORG_NAME} (${org.id}) — karrier-modul BEKAPCSOLVA, aktív team-előfizetés`);
    console.log("🔑  Belépés: /sign-in → email → kód: 424242\n");
    for (const spec of TEAMS) {
      console.log(`   ${spec.name}`);
      for (const m of spec.members) {
        const tag = m.orgRole === "ORG_ADMIN" ? "  ← ORG_ADMIN" : m.teamRole === "manager" ? "  ← csapatvezető" : "";
        console.log(`     ${emailOf(m)}${tag}`);
      }
    }
    console.log(`\n   Tanácsadó: ${adminEmail ?? "(nincs)"}\n`);
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

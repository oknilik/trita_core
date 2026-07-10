/**
 * assign-consultants.ts
 *
 * A megadott (vagy az ADMIN_EMAILS első) felhasználót ORG_CONSULTANT
 * szerepben hozzárendeli MINDEN meglévő szervezethez.
 * Lásd: docs/product/team-report-gating-plan.md (8. döntés).
 *
 * Futtatás:
 *   npx tsx scripts/assign-consultants.ts [--email tanacsado@email.hu] [--dry-run]
 *
 * Viselkedés:
 *   - ha az adott org-ban nincs tagsága → ORG_CONSULTANT tagság jön létre
 *   - ha már ORG_CONSULTANT → kihagyja
 *   - ha VALÓDI tagsága van (admin/manager/member) → kihagyja figyelmeztetéssel
 */

import { readFileSync } from "fs";
import { resolve } from "path";
import { PrismaClient } from "@prisma/client";

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

function getArg(name: string): string | null {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1) return null;
  return process.argv[idx + 1] ?? null;
}

async function main() {
  loadEnv();
  const prisma = new PrismaClient();
  const dryRun = process.argv.includes("--dry-run");

  const email =
    getArg("email") ??
    (process.env.ADMIN_EMAILS ?? "").split(",").map((e) => e.trim()).filter(Boolean)[0];

  if (!email) {
    console.error("❌ Nincs email: adj meg --email paramétert, vagy állítsd be az ADMIN_EMAILS env-változót.");
    process.exit(1);
  }

  const consultant = await prisma.userProfile.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, deleted: false },
    select: { id: true, email: true, username: true },
  });
  if (!consultant) {
    console.error(`❌ Nincs ilyen felhasználó a DB-ben: ${email}`);
    process.exit(1);
  }
  console.log(`👤 Tanácsadó: ${consultant.username ?? consultant.email} (${consultant.id})`);
  if (dryRun) console.log("🔎 DRY RUN — nem írunk semmit.");

  const orgs = await prisma.organization.findMany({
    select: {
      id: true,
      name: true,
      members: {
        where: { userId: consultant.id },
        select: { role: true },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  let created = 0;
  let skippedConsultant = 0;
  let skippedRealMember = 0;

  for (const org of orgs) {
    const existing = org.members[0];
    if (existing?.role === "ORG_CONSULTANT") {
      skippedConsultant++;
      continue;
    }
    if (existing) {
      console.warn(`⚠️  Kihagyva (valódi tagság: ${existing.role}): ${org.name}`);
      skippedRealMember++;
      continue;
    }
    if (!dryRun) {
      await prisma.organizationMember.create({
        data: { orgId: org.id, userId: consultant.id, role: "ORG_CONSULTANT" },
      });
    }
    console.log(`✅ Hozzárendelve: ${org.name}`);
    created++;
  }

  console.log(
    `\n📊 Összegzés: ${orgs.length} org · ${created} új hozzárendelés · ` +
      `${skippedConsultant} már tanácsadó · ${skippedRealMember} kihagyva (valódi tag)`,
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

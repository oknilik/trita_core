/** Backfill verified primary addresses from Clerk. Dry-run unless --apply.
 * Usage: npx tsx --env-file=<target-env> scripts/sync-lifecycle-email-verification.ts
 *        --from=2026-09-26T00:00:00Z [--after=<profile-id>] [--limit=100] [--apply]
 * The caller selects the environment; this script never sends email. */
import { createClerkClient } from "@clerk/nextjs/server";
import { prisma } from "../src/lib/prisma";

async function main() {
  const args = process.argv.slice(2);
  const value = (key: string) => args.find(arg => arg.startsWith(`--${key}=`))?.slice(key.length + 3);
  const from = value("from");
  const limit = Number(value("limit") ?? 100);
  if (!from || !Number.isFinite(Date.parse(from)) || !Number.isInteger(limit) || limit < 1 || limit > 500) {
    throw new Error("Provide --from=<ISO timestamp> and an optional --limit between 1 and 500");
  }
  if (!process.env.CLERK_SECRET_KEY) throw new Error("CLERK_SECRET_KEY is required");
  const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
  const rows = await prisma.userProfile.findMany({ where: {
    deleted: false, clerkId: { not: null }, createdAt: { gte: new Date(from) },
    ...(value("after") ? { id: { gt: value("after") } } : {}),
  }, orderBy: { id: "asc" }, take: limit, select: { id: true, clerkId: true, email: true, verifiedEmail: true } });
  let changes = 0; let applied = 0;
  const failed: string[] = [];
  for (const row of rows) {
    try {
      const user = await clerk.users.getUser(row.clerkId!);
      const primary = user.emailAddresses.find(email => email.id === user.primaryEmailAddressId);
      const verified = primary?.verification?.status === "verified" && primary.emailAddress.trim().toLowerCase() === row.email?.trim().toLowerCase() ? row.email : null;
      if (row.verifiedEmail !== verified) {
        changes++;
        if (args.includes("--apply")) {
          const result = await prisma.userProfile.updateMany({ where: { id: row.id, clerkId: row.clerkId, email: row.email, deleted: false }, data: { verifiedEmail: verified } });
          applied += result.count;
        }
      }
    } catch { failed.push(row.id); }
  }
  console.log(JSON.stringify({ checked: rows.length, changes, applied, failed, nextCursor: rows.length === limit ? rows.at(-1)?.id : null }));
  if (failed.length) process.exitCode = 1;
}
main().catch(error => { console.error(error instanceof Error ? error.message : "Verification sync failed"); process.exitCode = 1; }).finally(() => prisma.$disconnect());

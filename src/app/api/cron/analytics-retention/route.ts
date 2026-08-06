import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { createLogger } from "@/lib/logger";
import { ANALYTICS_RETENTION_MONTHS, analyticsRetentionCutoff } from "@/lib/analytics/retention";

const log = createLogger("analytics");

// Konstans-idejű string-összevetés (timing-oldalcsatorna ellen) — a
// release-steps cron mintája.
function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return crypto.timingSafeEqual(ab, bb);
}

export const dynamic = "force-dynamic";

/**
 * `GET /api/cron/analytics-retention` — a megőrzési időn túli analitikai
 * események törlése.
 *
 * MIÉRT KELL: a megőrzési idő az adatvédelmi tájékoztatóban VÁLLALÁS. Ha
 * nincs, ami betartatja, akkor nem vállalás, hanem szöveg. Ez a cron a
 * betartató.
 *
 * Kötegelt törlés: egy hívásban legfeljebb MAX_BATCHES × BATCH_SIZE sor, hogy
 * a Neon-kapcsolat ne fusson bele időtúllépésbe. Ami kimarad, azt a másnapi
 * futás viszi el — a megőrzési idő napos pontossága bőven elég.
 *
 * Guard: a release-steps mintája — élesben a CRON_SECRET kötelező.
 */

const BATCH_SIZE = 5_000;
const MAX_BATCHES = 10;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (secret) {
    const header = req.headers.get("authorization") ?? "";
    if (!safeEqual(header, `Bearer ${secret}`)) {
      return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
    }
  }

  const cutoff = analyticsRetentionCutoff();
  let deleted = 0;

  try {
    for (let batch = 0; batch < MAX_BATCHES; batch++) {
      const stale = await prisma.analyticsEvent.findMany({
        where: { occurredAt: { lt: cutoff } },
        select: { id: true },
        take: BATCH_SIZE,
      });
      if (stale.length === 0) break;

      const result = await prisma.analyticsEvent.deleteMany({
        where: { id: { in: stale.map((row) => row.id) } },
      });
      deleted += result.count;
      if (stale.length < BATCH_SIZE) break;
    }
  } catch (error) {
    log.error({ event: "analytics.retention_failed", err: error }, "Megőrzési takarítás hibára futott");
    return NextResponse.json({ error: "RETENTION_FAILED" }, { status: 500 });
  }

  log.info(
    { event: "analytics.retention_done", deleted, retentionMonths: ANALYTICS_RETENTION_MONTHS },
    "Analitikai megőrzési takarítás lefutott",
  );

  return NextResponse.json({ ok: true, deleted, cutoff: cutoff.toISOString() });
}

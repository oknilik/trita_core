import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { getRequestLogger } from "@/lib/logger.server";
import {
  recoverStaleConfirmationClaims,
  retryPendingConfirmations,
} from "@/lib/newsletter-confirmation";
import { recoverStaleDeliveryClaims } from "@/lib/newsletter";
import { recoverStaleNewsletterIssues } from "@/lib/newsletter-issue";
import { cleanupNewsletterData } from "@/lib/newsletter-retention";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

/** DOI-retry, crash-recovery és adatmegőrzési takarítás. */
export async function GET(req: NextRequest) {
  const log = await getRequestLogger("newsletter-maintenance");
  const secret = process.env.CRON_SECRET;
  if (!secret && process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }
  if (secret && !safeEqual(req.headers.get("authorization") ?? "", `Bearer ${secret}`)) {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  try {
    const staleConfirmations = await recoverStaleConfirmationClaims();
    // Sorrend számít: előbb a delivery claim váljon FAILED-dé, utána a
    // hozzá tartozó SENDING issue ebből számolja ki a PARTIAL/FAILED állapotot.
    const staleDeliveries = await recoverStaleDeliveryClaims();
    const staleIssues = await recoverStaleNewsletterIssues();
    const [confirmations, retention] = await Promise.all([
      retryPendingConfirmations(),
      cleanupNewsletterData(),
    ]);
    const result = { staleConfirmations, confirmations, staleDeliveries, staleIssues, retention };
    log.info({ event: "newsletter.maintenance_done", ...result }, "Newsletter maintenance finished");
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    log.error({ event: "newsletter.maintenance_failed", err: error }, "Newsletter maintenance failed");
    return NextResponse.json({ error: "MAINTENANCE_FAILED" }, { status: 500 });
  }
}

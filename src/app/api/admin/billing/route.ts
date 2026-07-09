/**
 * I1 — Billing reconciliation admin endpoint
 *
 * GET /api/admin/billing — returns billing event log for admin view.
 * POST /api/admin/billing — retry a failed event.
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { listRetryableEvents, resetEventForRetry, getRetryStats } from "@/lib/billing/retry";

export const dynamic = "force-dynamic";

export async function GET(_req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const [events, stats] = await Promise.all([
    prisma.billingEventLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        eventId: true,
        eventType: true,
        objectId: true,
        provider: true,
        status: true,
        errorMessage: true,
        retryable: true,
        retryCount: true,
        processedAt: true,
        createdAt: true,
      },
    }),
    getRetryStats(),
  ]);

  const retryable = await listRetryableEvents(20);

  return NextResponse.json({
    stats,
    retryable: retryable.map((e) => ({
      ...e,
      createdAt: e.createdAt.toISOString(),
    })),
    events: events.map((e) => ({
      ...e,
      processedAt: e.processedAt?.toISOString() ?? null,
      createdAt: e.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  let eventId: string;
  try {
    const body = await req.json();
    eventId = body.eventId;
    if (!eventId || typeof eventId !== "string") {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
  } catch {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }

  const reset = await resetEventForRetry(eventId);
  if (!reset) {
    return NextResponse.json(
      { error: "NOT_RETRYABLE", message: "Event is not in a retryable state" },
      { status: 400 },
    );
  }

  // Note: the actual re-dispatch requires fetching the original event from Stripe
  // and re-running the handler. This endpoint only resets the status.
  // A full retry would call stripe.events.retrieve(eventId) and re-dispatch.

  return NextResponse.json({ ok: true, eventId, status: "reset_for_retry" });
}

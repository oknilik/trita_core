import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TRIAL_DAYS } from "@/lib/subscription";

// Consulting mode: subscriptions are provisioned manually by the platform
// admin instead of Stripe. This endpoint is the single write path for that.

const postSchema = z.object({
  orgId: z.string().min(1),
  action: z.enum(["activate", "trial", "extend", "deactivate", "set_credits"]),
  planType: z.enum(["team", "org", "scale"]).optional(),
  months: z.number().int().min(1).max(36).optional(),
  candidateCredits: z.number().int().min(0).max(1000).optional(),
});

// GET /api/admin/org-access — all orgs with subscription state
export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const orgs = await prisma.organization.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      status: true,
      createdAt: true,
      _count: { select: { members: true } },
      subscription: {
        select: {
          status: true,
          planType: true,
          trialEndsAt: true,
          currentPeriodEnd: true,
          candidateCredits: true,
        },
      },
    },
  });

  return NextResponse.json({
    orgs: orgs.map((org) => ({
      id: org.id,
      name: org.name,
      status: org.status,
      createdAt: org.createdAt.toISOString(),
      memberCount: org._count.members,
      subscription: org.subscription
        ? {
            status: org.subscription.status,
            planType: org.subscription.planType,
            trialEndsAt: org.subscription.trialEndsAt?.toISOString() ?? null,
            currentPeriodEnd:
              org.subscription.currentPeriodEnd?.toISOString() ?? null,
            candidateCredits: org.subscription.candidateCredits,
          }
        : null,
    })),
  });
}

// POST /api/admin/org-access — manually provision / extend / deactivate access
export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const { orgId, action, planType, months, candidateCredits } = parsed.data;

  const org = await prisma.organization.findUnique({
    where: { id: orgId },
    select: { id: true, subscription: { select: { currentPeriodEnd: true } } },
  });
  if (!org) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const now = new Date();

  if (action === "activate" || action === "extend") {
    const monthsToAdd = months ?? 12;
    // Extend from the current period end when it is still in the future,
    // otherwise start a fresh period from today.
    const base =
      action === "extend" &&
      org.subscription?.currentPeriodEnd &&
      org.subscription.currentPeriodEnd > now
        ? org.subscription.currentPeriodEnd
        : now;
    const periodEnd = new Date(base);
    periodEnd.setMonth(periodEnd.getMonth() + monthsToAdd);

    const subscription = await prisma.subscription.upsert({
      where: { orgId },
      create: {
        orgId,
        status: "active",
        planType: planType ?? "team",
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        ...(candidateCredits !== undefined ? { candidateCredits } : {}),
      },
      update: {
        status: "active",
        ...(planType ? { planType } : {}),
        currentPeriodStart: now,
        currentPeriodEnd: periodEnd,
        trialEndsAt: null,
        cancelAtPeriodEnd: false,
        ...(candidateCredits !== undefined ? { candidateCredits } : {}),
      },
    });
    return NextResponse.json({ ok: true, subscription: serialize(subscription) });
  }

  if (action === "trial") {
    const trialEndsAt = new Date(now);
    trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_DAYS);

    const subscription = await prisma.subscription.upsert({
      where: { orgId },
      create: {
        orgId,
        status: "trialing",
        planType: planType ?? "team",
        trialEndsAt,
      },
      update: {
        status: "trialing",
        ...(planType ? { planType } : {}),
        trialEndsAt,
        cancelAtPeriodEnd: false,
      },
    });
    return NextResponse.json({ ok: true, subscription: serialize(subscription) });
  }

  if (action === "deactivate") {
    const existing = await prisma.subscription.findUnique({ where: { orgId } });
    if (!existing) {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    const subscription = await prisma.subscription.update({
      where: { orgId },
      data: { status: "canceled", currentPeriodEnd: now },
    });
    return NextResponse.json({ ok: true, subscription: serialize(subscription) });
  }

  // set_credits
  if (candidateCredits === undefined) {
    return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
  }
  const subscription = await prisma.subscription.upsert({
    where: { orgId },
    create: {
      orgId,
      status: "none",
      candidateCredits,
    },
    update: { candidateCredits },
  });
  return NextResponse.json({ ok: true, subscription: serialize(subscription) });
}

function serialize(sub: {
  status: string;
  planType: string | null;
  trialEndsAt: Date | null;
  currentPeriodEnd: Date | null;
  candidateCredits: number;
}) {
  return {
    status: sub.status,
    planType: sub.planType,
    trialEndsAt: sub.trialEndsAt?.toISOString() ?? null,
    currentPeriodEnd: sub.currentPeriodEnd?.toISOString() ?? null,
    candidateCredits: sub.candidateCredits,
  };
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TRIAL_DAYS } from "@/lib/subscription";

// Consulting mode: subscriptions are provisioned manually by the platform
// admin instead of Stripe. This endpoint is the single write path for that.

const postSchema = z.object({
  orgId: z.string().min(1),
  action: z.enum([
    "activate",
    "trial",
    "extend",
    "deactivate",
    "set_credits",
    "assign_consultant",
    "remove_consultant",
  ]),
  planType: z.enum(["team", "org", "scale"]).optional(),
  months: z.number().int().min(1).max(36).optional(),
  candidateCredits: z.number().int().min(0).max(1000).optional(),
  consultantEmail: z.string().email().optional(),
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
      members: {
        where: { role: "ORG_CONSULTANT" },
        select: {
          userId: true,
          user: { select: { email: true, username: true } },
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
      consultants: org.members.map((m) => ({
        userId: m.userId,
        email: m.user.email,
        username: m.user.username,
      })),
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
  const { orgId, action, planType, months, candidateCredits, consultantEmail } = parsed.data;

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

  if (action === "assign_consultant" || action === "remove_consultant") {
    if (!consultantEmail) {
      return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });
    }
    const consultant = await prisma.userProfile.findFirst({
      where: { email: { equals: consultantEmail, mode: "insensitive" }, deleted: false },
      select: { id: true, email: true, username: true },
    });
    if (!consultant) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    if (action === "assign_consultant") {
      const existing = await prisma.organizationMember.findUnique({
        where: { orgId_userId: { orgId, userId: consultant.id } },
        select: { role: true },
      });
      if (existing && existing.role !== "ORG_CONSULTANT") {
        // Real membership must not be silently converted to a consultancy.
        return NextResponse.json({ error: "ALREADY_MEMBER" }, { status: 409 });
      }
      await prisma.organizationMember.upsert({
        where: { orgId_userId: { orgId, userId: consultant.id } },
        create: { orgId, userId: consultant.id, role: "ORG_CONSULTANT" },
        update: { role: "ORG_CONSULTANT", leftAt: null },
      });
      return NextResponse.json({
        ok: true,
        consultant: { userId: consultant.id, email: consultant.email, username: consultant.username },
      });
    }

    const membership = await prisma.organizationMember.findUnique({
      where: { orgId_userId: { orgId, userId: consultant.id } },
      select: { role: true },
    });
    if (!membership || membership.role !== "ORG_CONSULTANT") {
      return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    }
    await prisma.organizationMember.delete({
      where: { orgId_userId: { orgId, userId: consultant.id } },
    });
    return NextResponse.json({ ok: true });
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

import type { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSelfAccessLevel } from "@/lib/access";
import { getActiveOrgMembership } from "@/lib/org-context";
import { getServerAuth } from "@/lib/auth-server";
import { INDUSTRIES } from "@/lib/industry-fit";

const currentYear = new Date().getFullYear();

const onboardingSchema = z.object({
  username: z.string().min(2).max(20),
  birthYear: z.number().int().min(currentYear - 100).max(currentYear - 16),
  gender: z.enum(["male", "female", "other", "prefer_not_to_say"]),
  country: z.string().min(1).max(100).optional(),
  consentedAt: z.string().datetime().optional(),
  // Karrier-háttér (opcionális) — a Karrier-iránytű előtöltéséhez, a
  // careerBackground JSON-ba merge-ölve (kulcsok = career-background route)
  eduLevel: z.enum(["primary", "secondary", "vocational", "higher"]).optional(),
  eduField: z
    .enum([
      "tech_engineering", "economics", "health", "humanities",
      "natural_science", "legal", "arts", "pedagogy", "trade", "none",
    ])
    .optional(),
  currentIndustry: z.string().max(50).optional(),
});

export async function GET() {
  const { userId } = await getServerAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: {
      id: true,
      email: true,
      username: true,
      birthYear: true,
      gender: true,
      country: true,
      role: true,
      orgMemberships: {
        where: { leftAt: null },
        orderBy: { joinedAt: "desc" },
        select: {
          role: true,
          org: { select: { id: true, name: true } },
        },
      },
      teamMemberships: {
        select: {
          team: { select: { id: true, name: true } },
        },
      },
    },
  });

  if (!profile) return NextResponse.json({});

  const accessLevel = await getSelfAccessLevel(profile.id);
  const activeMembership = await getActiveOrgMembership(profile.id);
  const activeOrgMembership =
    profile.orgMemberships.find((m) => m.org.id === activeMembership?.orgId) ??
    profile.orgMemberships[0] ??
    null;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { id: _id, ...rest } = profile;

  return NextResponse.json({ ...rest, activeOrgMembership, accessLevel });
}

export async function POST(req: Request) {
  const { userId } = await getServerAuth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = onboardingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Karrier-háttér merge (opcionális mezők) — a meglévő careerBackground
  // JSON kulcsait megőrizzük, csak a most kapottakat írjuk felül.
  const { eduLevel, eduField, currentIndustry } = parsed.data;
  let careerBackgroundUpdate: Record<string, unknown> | undefined;
  if (eduLevel || eduField || currentIndustry) {
    if (currentIndustry && !INDUSTRIES.some((i) => i.key === currentIndustry)) {
      return NextResponse.json({ error: "INVALID_INDUSTRY" }, { status: 400 });
    }
    const existing = await prisma.userProfile.findFirst({
      where: { clerkId: userId },
      select: { careerBackground: true },
    });
    careerBackgroundUpdate = {
      ...((existing?.careerBackground as Record<string, unknown> | null) ?? {}),
      ...(eduLevel && { eduLevel }),
      ...(eduField && { eduField }),
      ...(currentIndustry && { currentIndustry }),
    };
  }

  await prisma.userProfile.updateMany({
    where: { clerkId: userId },
    data: {
      username: parsed.data.username,
      birthYear: parsed.data.birthYear,
      gender: parsed.data.gender,
      ...(parsed.data.country && { country: parsed.data.country }),
      ...(parsed.data.consentedAt && {
        consentedAt: new Date(parsed.data.consentedAt),
        onboardedAt: new Date(),
      }),
      ...(careerBackgroundUpdate && { careerBackground: careerBackgroundUpdate as Prisma.InputJsonValue }),
    },
  });

  return NextResponse.json({ ok: true });
}

import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = ["kilinkod@gmail.com"];

const schema = z.object({
  action: z.enum(["approve", "reject"]),
  reviewNote: z.string().max(500).optional(),
  maxClientSlots: z.number().int().min(1).max(100).optional().default(10),
});

// PATCH /api/admin/coach-applications/[id]
// action=approve → promotes the user + sets status to APPROVED
// action=reject  → sets status to REJECTED
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const clerkUser = await currentUser();
  const callerEmail = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!callerEmail || !ADMIN_EMAILS.includes(callerEmail)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { action, reviewNote, maxClientSlots } = parsed.data;

  // Fetch application via raw SQL (Prisma client cache issue with new model)
  const rows = await prisma.$queryRaw<
    Array<{ id: string; email: string; status: string; userProfileId: string | null }>
  >`SELECT "id", "email", "status", "userProfileId" FROM "CoachApplication" WHERE "id" = ${id}`;

  if (rows.length === 0) {
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  }

  const application = rows[0];

  if (application.status !== "PENDING") {
    return NextResponse.json({ error: "ALREADY_REVIEWED" }, { status: 400 });
  }

  if (action === "approve") {
    // Find the user by email
    const profile = await prisma.userProfile.findFirst({
      where: { email: { equals: application.email, mode: "insensitive" }, deleted: false },
      select: { id: true, role: true },
    });

    if (!profile) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
    }

    if (profile.role !== "MANAGER") {
      await prisma.$transaction([
        prisma.userProfile.update({
          where: { id: profile.id },
          data: { role: "MANAGER" },
        }),
        prisma.coachProfile.upsert({
          where: { userProfileId: profile.id },
          create: { userProfileId: profile.id, maxClientSlots },
          update: { maxClientSlots },
        }),
      ]);
    }

    await prisma.$executeRaw`
      UPDATE "CoachApplication"
      SET "status" = 'APPROVED',
          "reviewedAt" = NOW(),
          "reviewNote" = ${reviewNote ?? null},
          "userProfileId" = ${profile.id}
      WHERE "id" = ${id}
    `;

    return NextResponse.json({ ok: true, action: "approved", userId: profile.id });
  }

  // reject
  await prisma.$executeRaw`
    UPDATE "CoachApplication"
    SET "status" = 'REJECTED',
        "reviewedAt" = NOW(),
        "reviewNote" = ${reviewNote ?? null}
    WHERE "id" = ${id}
  `;

  return NextResponse.json({ ok: true, action: "rejected" });
}

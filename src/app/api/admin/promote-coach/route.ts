import { auth, currentUser } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const ADMIN_EMAILS = [
  "kilinkod@gmail.com",
];

const schema = z.object({
  email: z.string().email(),
  maxClientSlots: z.number().int().min(1).max(100).optional().default(10),
}).strict();

// POST /api/admin/promote-coach — promote a user to COACH role
export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const clerkUser = await currentUser();
  const callerEmail = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!callerEmail || !ADMIN_EMAILS.includes(callerEmail)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email, maxClientSlots } = parsed.data;

  const profile = await prisma.userProfile.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, deleted: false },
    select: { id: true, role: true, email: true, username: true },
  });

  if (!profile) {
    return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
  }

  if (profile.role === "COACH") {
    return NextResponse.json({ error: "ALREADY_COACH", userId: profile.id }, { status: 400 });
  }

  await prisma.$transaction([
    prisma.userProfile.update({
      where: { id: profile.id },
      data: { role: "COACH" },
    }),
    prisma.coachProfile.upsert({
      where: { userProfileId: profile.id },
      create: { userProfileId: profile.id, maxClientSlots },
      update: { maxClientSlots },
    }),
  ]);

  return NextResponse.json({
    success: true,
    userId: profile.id,
    email: profile.email,
    username: profile.username,
    maxClientSlots,
  });
}

// GET /api/admin/promote-coach?email=... — check a user's current role
export async function GET(req: Request) {
  const { userId } = await auth();
  if (!userId) return new NextResponse("Unauthorized", { status: 401 });

  const clerkUser = await currentUser();
  const callerEmail = clerkUser?.primaryEmailAddress?.emailAddress;
  if (!callerEmail || !ADMIN_EMAILS.includes(callerEmail)) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "Missing email param" }, { status: 400 });

  const profile = await prisma.userProfile.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, deleted: false },
    select: { id: true, role: true, email: true, username: true, coachProfile: { select: { maxClientSlots: true } } },
  });

  if (!profile) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

  return NextResponse.json({
    userId: profile.id,
    email: profile.email,
    username: profile.username,
    role: profile.role,
    maxClientSlots: profile.coachProfile?.maxClientSlots ?? null,
  });
}

import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { sendCoachApplicationNotification } from "@/lib/emails";

const schema = z
  .object({
    name: z.string().min(2).max(100),
    email: z.string().email(),
    background: z.string().min(20).max(2000),
    motivation: z.string().min(20).max(2000),
    specializations: z.string().max(500).optional(),
  })
  .strict();

// POST /api/manager/apply
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { userId } = await auth();

  // Optionally link to the user profile if authenticated
  let userProfileId: string | null = null;
  if (userId) {
    const profile = await prisma.userProfile.findUnique({
      where: { clerkId: userId },
      select: { id: true },
    });
    userProfileId = profile?.id ?? null;
  }

  const id = randomUUID();
  await prisma.$executeRaw`
    INSERT INTO "CoachApplication" ("id", "email", "name", "background", "motivation", "specializations", "userProfileId", "status")
    VALUES (${id}, ${parsed.data.email}, ${parsed.data.name}, ${parsed.data.background}, ${parsed.data.motivation}, ${parsed.data.specializations ?? null}, ${userProfileId}, 'PENDING')
  `;

  // Fire-and-forget: email failure doesn't block the response
  sendCoachApplicationNotification({
    applicantName: parsed.data.name,
    applicantEmail: parsed.data.email,
    background: parsed.data.background,
    motivation: parsed.data.motivation,
    specializations: parsed.data.specializations ?? null,
  }).catch((err) => console.error("[CoachApply] Email notification failed:", err));

  return NextResponse.json({ ok: true });
}

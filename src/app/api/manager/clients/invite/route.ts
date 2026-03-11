import { auth } from "@clerk/nextjs/server";
import { after } from "next/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { resend } from "@/lib/resend";

const inviteSchema = z.object({
  email: z.string().email(),
}).strict();

// POST /api/manager/clients/invite — meghív egy felhasználót klienssé email alapján
export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const parsed = inviteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { userId } = await auth();
  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  const manager = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, role: true, email: true, username: true, coachProfile: { select: { maxClientSlots: true } } },
  });

  if (!manager || manager.role !== "MANAGER") {
    return NextResponse.json({ error: "NOT_A_MANAGER" }, { status: 403 });
  }

  // Prevent self-invite
  if (manager.email && parsed.data.email.toLowerCase() === manager.email.toLowerCase()) {
    return NextResponse.json({ error: "SELF_INVITE" }, { status: 400 });
  }

  // Check active client count vs slot limit
  const maxSlots = manager.coachProfile?.maxClientSlots ?? 10;
  const activeCount = await prisma.managerClientRelationship.count({
    where: { managerId: manager.id, status: "ACTIVE" },
  });
  if (activeCount >= maxSlots) {
    return NextResponse.json({ error: "CLIENT_SLOTS_FULL" }, { status: 400 });
  }

  // Find existing user by email
  const clientProfile = await prisma.userProfile.findFirst({
    where: { email: { equals: parsed.data.email, mode: "insensitive" }, deleted: false },
    select: { id: true, email: true, username: true },
  });

  if (!clientProfile) {
    // User doesn't have a Trita account yet — send invite email and return pending state
    const managerName = manager.username ?? manager.email ?? "Coach";
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "";

    after(async () => {
      try {
        await resend.emails.send({
          from: process.env.RESEND_FROM_EMAIL ?? "Trita <onboarding@resend.dev>",
          to: parsed.data.email,
          subject: `${managerName} meghívott a Tritára`,
          html: `<p>${managerName} meghívott meghívott, hogy csatlakozz a Tritához. <a href="${appUrl}/sign-up">Regisztrálj itt</a>, majd jelezd coachod emailjét: ${manager.email}</p>`,
        });
      } catch (err) {
        console.error("Failed to send coach invite email:", err);
      }
    });

    return NextResponse.json({ status: "INVITED_NO_ACCOUNT", emailSent: true });
  }

  // Check if relationship already exists
  const existing = await prisma.managerClientRelationship.findUnique({
    where: { managerId_clientId: { managerId: manager.id, clientId: clientProfile.id } },
  });

  if (existing) {
    if (existing.status === "ACTIVE") {
      return NextResponse.json({ error: "ALREADY_CLIENT" }, { status: 400 });
    }
    // Reactivate ended/paused relationship
    const updated = await prisma.managerClientRelationship.update({
      where: { id: existing.id },
      data: { status: "ACTIVE", endedAt: null },
    });
    return NextResponse.json({ relationshipId: updated.id, status: "REACTIVATED" });
  }

  const relationship = await prisma.managerClientRelationship.create({
    data: { managerId: manager.id, clientId: clientProfile.id },
  });

  return NextResponse.json({ relationshipId: relationship.id, status: "CREATED" });
}

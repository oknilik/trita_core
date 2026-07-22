import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { isConsultantSurface } from "@/lib/measurement-auth";

// Tanácsadói inquiry-kezelés a saját szervezet kérdésein: státusz + jegyzet.
// A user/org link kötése-oldása admin-hatáskör marad (/api/admin/inquiries).

const patchSchema = z.object({
  inquiryId: z.string().min(1),
  action: z.enum(["set_status", "set_note"]),
  status: z.enum(["NEW", "IN_PROGRESS", "CLOSED"]).optional(),
  note: z.string().max(4000).optional(),
});

async function requireConsultant(orgId: string) {
  const { userId } = await auth();
  if (!userId) return null;
  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, email: true, isConsultant: true },
  });
  if (!profile) return null;
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership) return null;
  if (!isConsultantSurface(membership.role, profile.email, profile.isConsultant)) {
    return null;
  }
  return profile;
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: orgId } = await params;
  const consultant = await requireConsultant(orgId);
  if (!consultant) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  // Csak a saját org-hoz kötött inquiry módosítható
  const inquiry = await prisma.inquiry.findFirst({
    where: { id: parsed.data.inquiryId, organizationId: orgId },
    select: { id: true },
  });
  if (!inquiry) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if (parsed.data.action === "set_status") {
    if (!parsed.data.status) {
      return NextResponse.json({ error: "MISSING_STATUS" }, { status: 400 });
    }
    await prisma.inquiry.update({
      where: { id: inquiry.id },
      data: { status: parsed.data.status },
    });
  } else {
    await prisma.inquiry.update({
      where: { id: inquiry.id },
      data: { adminNote: (parsed.data.note ?? "").trim() || null },
    });
  }

  return NextResponse.json({ ok: true });
}

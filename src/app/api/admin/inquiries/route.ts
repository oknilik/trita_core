import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Admin inquiry-kezelés: státusz-váltás, jegyzet, user/org link kézi
// kötése-oldása. A lista a szerver-komponensből jön (admin?tab=inquiries),
// ez az endpoint csak a mutációkat fedi.

const patchSchema = z.object({
  inquiryId: z.string().min(1),
  action: z.enum(["set_status", "set_note", "link_org", "unlink_org", "link_user", "unlink_user"]),
  status: z.enum(["NEW", "IN_PROGRESS", "CLOSED"]).optional(),
  note: z.string().max(4000).optional(),
  organizationId: z.string().optional(),
  userProfileId: z.string().optional(),
});

export async function PATCH(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const { inquiryId, action } = parsed.data;
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    select: { id: true },
  });
  if (!inquiry) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  switch (action) {
    case "set_status": {
      if (!parsed.data.status) {
        return NextResponse.json({ error: "MISSING_STATUS" }, { status: 400 });
      }
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { status: parsed.data.status },
      });
      break;
    }
    case "set_note": {
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { adminNote: (parsed.data.note ?? "").trim() || null },
      });
      break;
    }
    case "link_org": {
      if (!parsed.data.organizationId) {
        return NextResponse.json({ error: "MISSING_ORG" }, { status: 400 });
      }
      const org = await prisma.organization.findUnique({
        where: { id: parsed.data.organizationId },
        select: { id: true },
      });
      if (!org) return NextResponse.json({ error: "ORG_NOT_FOUND" }, { status: 404 });
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { organizationId: org.id },
      });
      break;
    }
    case "unlink_org": {
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { organizationId: null },
      });
      break;
    }
    case "link_user": {
      if (!parsed.data.userProfileId) {
        return NextResponse.json({ error: "MISSING_USER" }, { status: 400 });
      }
      const profile = await prisma.userProfile.findUnique({
        where: { id: parsed.data.userProfileId },
        select: { id: true },
      });
      if (!profile) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { userProfileId: profile.id },
      });
      break;
    }
    case "unlink_user": {
      await prisma.inquiry.update({
        where: { id: inquiryId },
        data: { userProfileId: null },
      });
      break;
    }
  }

  return NextResponse.json({ ok: true });
}

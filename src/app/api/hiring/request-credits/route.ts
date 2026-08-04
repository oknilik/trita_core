import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hasOrgRole } from "@/lib/auth";
import { resend, EMAIL_FROM } from "@/lib/resend";
import {
  buildEmailLayout,
  escapeHtml,
  renderCtaButton,
  EMAIL_P,
  EMAIL_P_MUTED,
} from "@/lib/email-layout";

const schema = z.object({ orgId: z.string() });

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://trita.app";

export async function POST(req: Request) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true },
  });
  if (!profile) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const body = schema.safeParse(await req.json());
  if (!body.success) return NextResponse.json({ error: "INVALID_INPUT" }, { status: 400 });

  const { orgId } = body.data;

  // Verify requester is a manager in this org
  const membership = await prisma.organizationMember.findUnique({
    where: { orgId_userId: { orgId, userId: profile.id } },
    select: { role: true },
  });
  if (!membership || !hasOrgRole(membership.role, "ORG_MANAGER")) {
    return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
  }

  const [org, admins] = await Promise.all([
    prisma.organization.findUnique({
      where: { id: orgId },
      select: { name: true },
    }),
    prisma.organizationMember.findMany({
      where: { orgId, role: "ORG_ADMIN" },
      select: { user: { select: { email: true, username: true } } },
    }),
  ]);

  const requesterName = profile.username ?? profile.email ?? "Egy menedzser";
  const orgName = org?.name ?? "Trita";

  for (const admin of admins) {
    const adminEmail = admin.user.email;
    if (!adminEmail) continue;

    await resend.emails.send({
      from: EMAIL_FROM,
      to: adminEmail,
      subject: `Jelölt kredit igénylés – ${orgName}`,
      html: buildEmailLayout({
        locale: "hu",
        heading: "Jelölt kredit igénylés",
        bodyContent: `
          <p style="${EMAIL_P}">
            <strong>${escapeHtml(requesterName)}</strong> jelölt értékelési krediteket kér a
            <strong>${escapeHtml(orgName)}</strong> szervezethez.
          </p>
          <p style="${EMAIL_P_MUTED};margin-bottom:24px">
            A jelenlegi kreditkeret üres. Tölts fel krediteket, hogy a csapat
            folytathassa a jelöltértékelést.
          </p>
          ${renderCtaButton({ href: `${APP_URL}/hiring/${orgId}`, label: "Kreditek vásárlása" })}`,
      }),
      text: `${requesterName} jelölt értékelési krediteket kér a ${orgName} szervezethez. Töltsd fel a poolt: ${APP_URL}/hiring/${orgId}`,
    });
  }

  return NextResponse.json({ ok: true });
}

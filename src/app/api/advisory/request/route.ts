import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { getActiveOrgMembership } from "@/lib/org-context";
import { Resend } from "resend";
import {
  buildEmailLayout,
  escapeHtml,
  renderInfoTable,
  EMAIL_P,
  EMAIL_P_MUTED,
} from "@/lib/email-layout";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.RESEND_FROM_EMAIL ?? "hello@trita.io";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: "FORBIDDEN" }, { status: 401 });

  const profile = await prisma.userProfile.findUnique({
    where: { clerkId: userId },
    select: { id: true, username: true, email: true },
  });
  if (!profile) return NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });

  const activeMembership = await getActiveOrgMembership(profile.id);
  const membership = activeMembership
    ? await prisma.organizationMember.findUnique({
        where: {
          orgId_userId: { orgId: activeMembership.orgId, userId: profile.id },
        },
        select: { org: { select: { name: true } } },
      })
    : null;

  const body = await req.json().catch(() => ({}));
  const teamsSummary: Array<{ name: string; pattern: string }> =
    Array.isArray(body.teams) ? body.teams : [];

  const orgName = membership?.org?.name ?? "Ismeretlen";
  const displayName = profile.username ?? profile.email ?? "Felhasználó";
  const firstName = displayName.split(/[\s@]/)[0] ?? displayName;
  const userEmail = profile.email ?? "";

  try {
    await Promise.all([
      // Admin notification
      resend.emails.send({
        from: "Trita Advisory <noreply@trita.io>",
        to: ADMIN_EMAIL,
        subject: `🟢 Konzultáció igény: ${orgName} – ${displayName}`,
        html: buildEmailLayout({
          locale: "hu",
          heading: "Tanácsadói konzultáció igény",
          bodyContent: `
            ${renderInfoTable([
              ["Név", escapeHtml(displayName)],
              ["Email", `<a href="mailto:${escapeHtml(userEmail)}" style="color:#c17f4a">${escapeHtml(userEmail)}</a>`],
              ["Szervezet", escapeHtml(orgName)],
              [
                "Csapatok",
                teamsSummary.length > 0
                  ? teamsSummary.map((t) => `${escapeHtml(t.name)}: ${escapeHtml(t.pattern)}`).join("<br/>")
                  : "—",
              ],
            ])}
            <p style="${EMAIL_P_MUTED};margin-bottom:0">
              Válaszolj 24 órán belül időpont-egyeztetéssel.
            </p>`,
        }),
      }),

      // User confirmation (only if email is available)
      ...(userEmail
        ? [
            resend.emails.send({
              from: "Trita <hello@trita.io>",
              to: userEmail,
              subject: "Megkaptuk a konzultáció-igényed — Trita Advisory",
              html: buildEmailLayout({
                locale: "hu",
                preheader: "24 órán belül személyesen kereslek az időpont-egyeztetéssel.",
                bodyContent: `
                  <p style="${EMAIL_P}">Kedves ${escapeHtml(firstName)},</p>
                  <p style="${EMAIL_P}">
                    Megkaptuk a jelentkezésedet a tanácsadói konzultációra!
                    24 órán belül személyesen kereslek az időpont-egyeztetéssel.
                  </p>
                  <p style="${EMAIL_P};margin-bottom:0">
                    A konzultáción a csapataid aktuális mintázataiból indulunk ki — nem kell semmit előkészítened.
                  </p>`,
                thanks: "Üdvözlettel,",
                team: "Leinad · Trita",
              }),
            }),
          ]
        : []),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Advisory request error:", error);
    return NextResponse.json({ error: "EMAIL_SEND_FAILED" }, { status: 500 });
  }
}

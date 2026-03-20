import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { Resend } from "resend";

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

  const membership = await prisma.organizationMember.findUnique({
    where: { userId: profile.id },
    select: { org: { select: { name: true } } },
  });

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
        html: `
          <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px 0; color: #1a1814;">
            <h1 style="font-size: 20px; color: #c8410a; margin: 0 0 24px;">Tanácsadói konzultáció igény</h1>
            <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e8e4dc; font-weight: bold; width: 120px;">Név</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e8e4dc;">${displayName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e8e4dc; font-weight: bold;">Email</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e8e4dc;">
                  <a href="mailto:${userEmail}" style="color: #c8410a;">${userEmail}</a>
                </td>
              </tr>
              <tr>
                <td style="padding: 10px 0; border-bottom: 1px solid #e8e4dc; font-weight: bold;">Szervezet</td>
                <td style="padding: 10px 0; border-bottom: 1px solid #e8e4dc;">${orgName}</td>
              </tr>
              <tr>
                <td style="padding: 10px 0; font-weight: bold; vertical-align: top;">Csapatok</td>
                <td style="padding: 10px 0;">
                  ${
                    teamsSummary.length > 0
                      ? teamsSummary.map((t) => `${t.name}: ${t.pattern}`).join("<br/>")
                      : "—"
                  }
                </td>
              </tr>
            </table>
            <p style="margin-top: 24px; font-size: 13px; color: #a09a90;">
              Válaszolj 24 órán belül időpont-egyeztetéssel.
            </p>
          </div>
        `,
      }),

      // User confirmation (only if email is available)
      ...(userEmail
        ? [
            resend.emails.send({
              from: "Trita <hello@trita.io>",
              to: userEmail,
              subject: "Megkaptuk a konzultáció-igényed — Trita Advisory",
              html: `
                <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px 0; color: #1a1814;">
                  <p style="font-size: 16px; line-height: 1.7;">Kedves ${firstName},</p>
                  <p style="font-size: 16px; line-height: 1.7;">
                    Megkaptuk a tanácsadói konzultáció igényedet!
                    24 órán belül személyesen kereslek az időpont-egyeztetéssel.
                  </p>
                  <p style="font-size: 16px; line-height: 1.7;">
                    A konzultáción a csapataid aktuális mintázataiból indulunk ki — nem kell semmit előkészítened.
                  </p>
                  <p style="font-size: 16px; line-height: 1.7; margin-top: 24px;">
                    Üdvözlettel,<br/>
                    <strong>Leinad</strong><br/>
                    <span style="color: #c8410a;">Trita</span>
                  </p>
                </div>
              `,
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

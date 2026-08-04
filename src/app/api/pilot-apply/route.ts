import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";
import { getRequestLogger } from "@/lib/logger.server";
import {
  buildEmailLayout,
  escapeHtml,
  renderInfoTable,
  EMAIL_P,
  EMAIL_P_MUTED,
} from "@/lib/email-layout";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAILS?.split(",")[0] || "hello@trita.io";

export async function POST(req: NextRequest) {
  const log = await getRequestLogger("pilot");
  const rateLimitResult = await checkRateLimit("contact");
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await req.json();
    const { name, email, company, size, message } = body as Record<string, string>;

    if (!name?.trim() || !email?.trim() || !company?.trim()) {
      return NextResponse.json({ error: "Hiányzó kötelező mezők." }, { status: 400 });
    }

    await resend.emails.send({
      from: "Trita Pilot <noreply@trita.io>",
      to: ADMIN_EMAIL,
      subject: `Pilot jelentkezes: ${company} – ${name}`,
      html: buildEmailLayout({
        locale: "hu",
        heading: "Új pilotprogram jelentkezés",
        bodyContent: `
          ${renderInfoTable([
            ["Név", escapeHtml(name)],
            ["Email", `<a href="mailto:${escapeHtml(email)}" style="color:#c17f4a">${escapeHtml(email)}</a>`],
            ["Cég", escapeHtml(company)],
            ["Csapatméret", size ? escapeHtml(size) : "Nem adta meg"],
            ...(message ? [["Kérdés", escapeHtml(message)] as [string, string]] : []),
          ])}
          <p style="${EMAIL_P_MUTED};margin-bottom:0">Válaszolj 24 órán belül · trita.io/pilot</p>`,
      }),
    });

    await resend.emails.send({
      from: "Trita <hello@trita.io>",
      to: email,
      subject: "Megkaptuk a jelentkezésed – Trita Pilotprogram",
      html: buildEmailLayout({
        locale: "hu",
        preheader: "Köszönjük, hogy jelentkeztél a Trita Pilotprogramba!",
        bodyContent: `
          <p style="${EMAIL_P}">Kedves ${escapeHtml(name.split(" ")[0] ?? name)},</p>
          <p style="${EMAIL_P}">Köszönjük, hogy jelentkeztél a Trita Pilotprogramba!</p>
          <p style="${EMAIL_P};margin-bottom:0">24 órán belül személyesen kereslek, hogy megbeszéljük a részleteket és egyeztessünk egy rövid, kötelezettségmentes bevezető beszélgetést.</p>`,
        thanks: "Üdvözlettel,",
        team: "Leinad · Trita",
      }),
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    log.error({ event: "pilot.pilot_application_error", err: error }, "Pilot application error");
    return NextResponse.json({ error: "Szerverhiba. Kérjük próbáld újra." }, { status: 500 });
  }
}

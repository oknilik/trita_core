import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { checkRateLimit } from "@/lib/rate-limit";

const resend = new Resend(process.env.RESEND_API_KEY);
const ADMIN_EMAIL = process.env.ADMIN_EMAILS?.split(",")[0] || "hello@trita.io";

export async function POST(req: NextRequest) {
  const rateLimitResult = await checkRateLimit("contact");
  if (rateLimitResult) return rateLimitResult;

  try {
    const body = await req.json();
    const { name, email, company, size, message } = body as Record<string, string>;

    if (!name?.trim() || !email?.trim() || !company?.trim()) {
      return NextResponse.json({ error: "Hiányzó kötelező mezők." }, { status: 400 });
    }

    await resend.emails.send({
      from: "Trita Founding <noreply@trita.io>",
      to: ADMIN_EMAIL,
      subject: `Founding jelentkezes: ${company} – ${name}`,
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px 0;">
          <h1 style="font-size: 22px; color: #c8410a; margin-bottom: 24px;">Új Founding Customer jelentkezés</h1>
          <table style="width: 100%; border-collapse: collapse; font-size: 15px; color: #2C2420;">
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold; width: 140px;">Név</td><td style="padding: 10px 0; border-bottom: 1px solid #eee;">${esc(name)}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 10px 0; border-bottom: 1px solid #eee;"><a href="mailto:${esc(email)}" style="color: #c8410a;">${esc(email)}</a></td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Cég</td><td style="padding: 10px 0; border-bottom: 1px solid #eee;">${esc(company)}</td></tr>
            <tr><td style="padding: 10px 0; border-bottom: 1px solid #eee; font-weight: bold;">Csapatméret</td><td style="padding: 10px 0; border-bottom: 1px solid #eee;">${size ? esc(size) : "Nem adta meg"}</td></tr>
            ${message ? `<tr><td style="padding: 10px 0; font-weight: bold; vertical-align: top;">Kérdés</td><td style="padding: 10px 0;">${esc(message)}</td></tr>` : ""}
          </table>
          <p style="margin-top: 24px; font-size: 13px; color: #999;">Válaszolj 24 órán belül · trita.io/founding</p>
        </div>
      `,
    });

    await resend.emails.send({
      from: "Trita <hello@trita.io>",
      to: email,
      subject: "Megkaptuk a jelentkezésed – Trita Founding Program",
      html: `
        <div style="font-family: Georgia, serif; max-width: 560px; margin: 0 auto; padding: 32px 0; color: #2C2420;">
          <p style="font-size: 16px; line-height: 1.7;">Kedves ${esc(name.split(" ")[0] ?? name)},</p>
          <p style="font-size: 16px; line-height: 1.7;">Köszönjük, hogy jelentkeztél a Trita Alapító Ügyfél Programba!</p>
          <p style="font-size: 16px; line-height: 1.7;">24 órán belül személyesen kereslek, hogy megbeszéljük a részleteket és egyeztessünk egy rövid, kötelezettségmentes bevezető beszélgetést.</p>
          <p style="font-size: 16px; line-height: 1.7; margin-top: 24px;">Üdvözlettel,<br/><strong>Leinad</strong><br/><span style="color: #c8410a;">Trita</span> · trita.io</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Founding application error:", error);
    return NextResponse.json({ error: "Szerverhiba. Kérjük próbáld újra." }, { status: 500 });
  }
}

function esc(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

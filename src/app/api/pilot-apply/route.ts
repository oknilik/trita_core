import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { submitInquiry } from "@/lib/inquiries";
import { sendPilotApplyConfirmationEmail } from "@/lib/emails";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";

export const runtime = "nodejs";

// Pilot-jelentkezés a publikus /pilot oldalról. A siker mércéje a perzisztált
// inquiry (DB + admin-notif + CRM auto-attach a submitInquiry-n át) — az
// emailek best effort. (Korábban a route csak két Resend-emailt küldött:
// Resend-hiba esetén 500 ment vissza, és a pilot-lead nyomtalanul elveszett.)

const pilotApplySchema = z
  .object({
    name: z.string().trim().min(2).max(100),
    email: z.string().trim().email().max(320),
    company: z.string().trim().min(1).max(120),
    size: z.string().trim().max(60).optional().or(z.literal("")),
    message: z.string().trim().max(4000).optional().or(z.literal("")),
    locale: z.enum(["hu", "en"]).optional(),
  })
  .strict();

export async function POST(req: NextRequest) {
  const log = await getRequestLogger("pilot");
  const rateLimitResult = await checkRateLimit("contact");
  if (rateLimitResult) return rateLimitResult;

  const body = await req.json().catch(() => ({}));
  const parsed = pilotApplySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const { name, email, company, size, message, locale } = parsed.data;

  const inquiryMessage = [
    `Pilot-jelentkezés a /pilot oldalról.`,
    `Csapatméret: ${size?.trim() || "nem adta meg"}`,
    ...(message?.trim() ? ["", "Kérdés / üzenet:", message.trim()] : []),
  ].join("\n");

  try {
    await submitInquiry({
      name,
      email,
      company,
      topic: "pilot",
      message: inquiryMessage,
      source: "pilot_form",
    });
  } catch (error) {
    log.error(
      { event: "pilot.pilot_application_error", err: error },
      "Pilot application error",
    );
    return NextResponse.json({ error: "SUBMIT_FAILED" }, { status: 502 });
  }

  // Visszaigazoló email a jelentkezőnek — best effort, a lead már perzisztált.
  try {
    await sendPilotApplyConfirmationEmail({
      to: email,
      name,
      locale: locale ?? "hu",
    });
  } catch (error) {
    log.error(
      { event: "pilot.confirmation_email_error", err: error },
      "Pilot confirmation email error",
    );
  }

  trackServerEvent("inquiry.submit", { topic: "pilot", source: "pilot_form" });

  return NextResponse.json({ ok: true });
}

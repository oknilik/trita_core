import { NextResponse } from "next/server";
import { z } from "zod";
import { checkRateLimit } from "@/lib/rate-limit";
import { submitInquiry } from "@/lib/inquiries";
import { getRequestLogger } from "@/lib/logger.server";
import { trackServerEvent } from "@/lib/analytics/server";

export const runtime = "nodejs";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(120).optional(),
  topic: z.enum(["demo", "pricing", "support", "partnership", "other"]),
  message: z.string().trim().min(20).max(4000),
  website: z.string().optional(),
}).strict();

export async function POST(req: Request) {
  const log = await getRequestLogger("inquiries");
  const rateLimitResponse = await checkRateLimit("contact");
  if (rateLimitResponse) return rateLimitResponse;

  const body = await req.json().catch(() => ({}));
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  // Honeypot: bots tend to fill hidden fields.
  if ((parsed.data.website ?? "").trim().length > 0) {
    return NextResponse.json({ ok: true });
  }

  // A siker mércéje a perzisztált inquiry (admin-notif is megy vele) — az
  // admin-email best effort, a hibája nem a beküldő hibája.
  try {
    await submitInquiry({
      name: parsed.data.name,
      email: parsed.data.email,
      company: parsed.data.company,
      topic: parsed.data.topic,
      message: parsed.data.message,
      source: "contact_form",
    });
  } catch (error) {
    log.error({ event: "inquiries.failed_to_submit_inquiry", err: error }, "Failed to submit inquiry");
    return NextResponse.json({ error: "Send failed" }, { status: 502 });
  }

  // Analitika: a megkeresés BEÉRKEZÉSE a perzisztálás után igaz — a
  // tartalma nem kerül eseménybe, csak a téma (zárt értékkészlet).
  trackServerEvent("inquiry.submit", { topic: parsed.data.topic, source: "contact_form" });

  return NextResponse.json({ ok: true });
}

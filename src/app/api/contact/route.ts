import { NextResponse } from "next/server";
import { z } from "zod";
import { resend, EMAIL_FROM } from "@/lib/resend";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const contactSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(320),
  company: z.string().trim().max(120).optional(),
  topic: z.enum(["demo", "pricing", "support", "partnership", "other"]),
  message: z.string().trim().min(20).max(4000),
  website: z.string().optional(),
}).strict();

const topicLabel: Record<z.infer<typeof contactSchema>["topic"], string> = {
  demo: "Demó igény",
  pricing: "Árazás",
  support: "Terméktámogatás",
  partnership: "Partnerség",
  other: "Egyéb",
};

export async function POST(req: Request) {
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

  const to = process.env.CONTACT_FORM_TO ?? "info@trita.io";
  const company = parsed.data.company?.trim();
  const submittedAt = new Date().toISOString();

  const text = [
    "Új kapcsolatfelvétel érkezett a trita oldalon.",
    "",
    `Név: ${parsed.data.name}`,
    `Email: ${parsed.data.email}`,
    `Téma: ${topicLabel[parsed.data.topic]}`,
    `Cég: ${company && company.length > 0 ? company : "-"}`,
    `Beküldve: ${submittedAt}`,
    "",
    "Üzenet:",
    parsed.data.message,
  ].join("\n");

  try {
    const { error } = await resend.emails.send({
      from: EMAIL_FROM,
      to: [to],
      replyTo: parsed.data.email,
      subject: `[trita kapcsolat] ${topicLabel[parsed.data.topic]} — ${parsed.data.name}`,
      text,
    });

    if (error) {
      console.error("[Contact] Resend returned error:", error);
      return NextResponse.json({ error: "Send failed" }, { status: 502 });
    }
  } catch (error) {
    console.error("[Contact] Unexpected send error:", error);
    return NextResponse.json({ error: "Send failed" }, { status: 502 });
  }

  return NextResponse.json({ ok: true });
}

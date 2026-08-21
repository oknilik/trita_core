import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getRequestLogger } from "@/lib/logger.server";
import { previewIssue, sendIssue } from "@/lib/newsletter-issue";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Szerkesztett hírlevél-szám admin API-ja.
 *
 *   POST   { subject, intro, locale, postSlugs }        — új piszkozat
 *   PATCH  { id, ...mezők }                             — piszkozat mentése
 *   PATCH  { id, action: "preview" }                    — mi menne ki, hánynak
 *   PATCH  { id, action: "send" }                       — kiküldés (végleges)
 *   DELETE { id }                                       — piszkozat törlése
 *
 * A SENT szám nem szerkeszthető és nem törölhető: a levél kiment, a szövegét
 * utólag átírni azt jelentené, hogy a napló mást mond, mint amit a címzettek
 * kaptak.
 */

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

const draftSchema = z.object({
  subject: z.string().trim().min(3).max(200),
  intro: z.string().trim().min(10).max(5000),
  locale: z.enum(["hu", "en"]),
  postSlugs: z.array(z.string().regex(SLUG_RE).max(120)).max(6),
});

export async function POST(req: Request) {
  await requireAdmin();

  const parsed = draftSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const issue = await prisma.newsletterIssue.create({
    data: { ...parsed.data, status: "DRAFT" },
    select: { id: true },
  });

  return NextResponse.json({ ok: true, id: issue.id });
}

const patchSchema = z.union([
  draftSchema.partial().extend({ id: z.string().min(1), action: z.undefined().optional() }),
  z.object({ id: z.string().min(1), action: z.enum(["preview", "send"]) }),
]);

export async function PATCH(req: Request) {
  await requireAdmin();
  const log = await getRequestLogger("newsletter-issue");

  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const body = parsed.data;
  const existing = await prisma.newsletterIssue.findUnique({
    where: { id: body.id },
    select: { status: true },
  });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  if ("action" in body && body.action === "preview") {
    const preview = await previewIssue(body.id);
    return NextResponse.json({ ok: true, ...preview });
  }

  if ("action" in body && body.action === "send") {
    if (existing.status === "SENT") {
      return NextResponse.json({ error: "ALREADY_SENT" }, { status: 409 });
    }
    const result = await sendIssue(body.id);
    if (result.blocked) {
      return NextResponse.json({ error: result.blocked.toUpperCase() }, { status: 409 });
    }
    log.info(
      { event: "newsletter.issue_send", issueId: body.id, recipients: result.recipients },
      "Newsletter issue sent from admin",
    );
    return NextResponse.json({ ok: true, ...result });
  }

  // Mentés — csak piszkozaton.
  if (existing.status === "SENT") {
    return NextResponse.json({ error: "ALREADY_SENT" }, { status: 409 });
  }

  const { id, action: _action, ...fields } = body as { id: string; action?: undefined } & Partial<
    z.infer<typeof draftSchema>
  >;
  void _action;

  await prisma.newsletterIssue.update({ where: { id }, data: fields });
  return NextResponse.json({ ok: true });
}

export async function DELETE(req: Request) {
  await requireAdmin();

  const parsed = z
    .object({ id: z.string().min(1) })
    .safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "INVALID_PAYLOAD" }, { status: 400 });
  }

  const existing = await prisma.newsletterIssue.findUnique({
    where: { id: parsed.data.id },
    select: { status: true },
  });
  if (!existing) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
  if (existing.status === "SENT") {
    return NextResponse.json({ error: "ALREADY_SENT" }, { status: 409 });
  }

  await prisma.newsletterIssue.delete({ where: { id: parsed.data.id } });
  return NextResponse.json({ ok: true });
}
